"""Job handlers — register one per `kind`.

Each handler:
  - Receives (sb: Client, job: dict)
  - Reads payload from job["payload"]
  - Calls update_progress() during work
  - Returns dict (becomes job.result)
  - Raises RetryableJobError for transient failures
"""

from __future__ import annotations

import asyncio
from typing import Any

from anthropic import APIStatusError, RateLimitError
from googleapiclient.errors import HttpError

from ..deps import get_supabase
from ..services.claude.recreate import get_handler as get_recreate_handler
from ..services.claude.recreate import supported_formats
from ..services.claude.recreate._orchestrator import (
    insert_draft,
    load_recreate_context,
)
from ..services.claude.summarize import SummarizeError, summarize_transcript
from ..services.claude.translate import translate_to_thai
from ..services.claude.voice_extract import (
    VoiceExtractError,
    VoiceSample,
    extract_voice_profile,
)
from ..services.youtube.channel_sync import sync_channel
from ..services.youtube.transcript import (
    TranscriptError,
    fetch_transcript,
)
from .jobs_runner import RetryableJobError, register, update_progress


def _retryable_anthropic(exc: Exception) -> bool:
    """Decide if Anthropic error is transient."""
    if isinstance(exc, RateLimitError):
        return True
    if isinstance(exc, APIStatusError):
        # 5xx are transient; 4xx generally not (auth, validation)
        status = getattr(exc, "status_code", None)
        if status is not None and 500 <= status < 600:
            return True
    return False


# =====================================================================
# sync_channel
# =====================================================================
@register("sync_channel")
async def handle_sync_channel(sb, job: dict[str, Any]) -> dict[str, Any]:
    """payload: { ref_kind, ref_value, video_limit?, mode? }
    mode: 'top_viewed' (default) | 'recent' | 'hybrid'
    """
    user_id = job["user_id"]
    p = job["payload"] or {}
    mode = p.get("mode") or "top_viewed"
    if mode not in {"top_viewed", "recent", "hybrid"}:
        mode = "top_viewed"

    update_progress(sb, job["id"], progress=5, step=f"resolving_channel_{mode}")

    def _do_sync() -> dict[str, Any]:
        return sync_channel(
            sb,
            user_id=user_id,
            ref_kind=p["ref_kind"],
            ref_value=p["ref_value"],
            video_limit=int(p.get("video_limit") or 50),
            mode=mode,
        )

    try:
        # sync_channel is sync; run in thread to avoid blocking event loop
        result = await asyncio.to_thread(_do_sync)
    except ValueError as exc:
        # 404 channel not found — not retryable
        raise RuntimeError(f"channel not found: {exc}") from exc
    except HttpError as exc:
        status = getattr(getattr(exc, "resp", None), "status", 0)
        if status >= 500:
            raise RetryableJobError(f"youtube api transient: {exc}") from exc
        raise RuntimeError(f"youtube api error: {exc}") from exc

    update_progress(sb, job["id"], progress=100, step="done")
    return result


# =====================================================================
# process_transcript
# =====================================================================
@register("process_transcript")
async def handle_process_transcript(sb, job: dict[str, Any]) -> dict[str, Any]:
    """payload: { video_id, force? }

    Pipeline:
      1. Fetch transcript via youtube-transcript-api
      2. If language != th → translate via Haiku
      3. Summarize via Sonnet (structured JSON)
      4. Upsert public.transcripts
    """
    user_id = job["user_id"]
    p = job["payload"] or {}
    video_id = p["video_id"]
    force = bool(p.get("force"))

    # Verify ownership
    video_res = (
        sb.table("videos")
        .select("id, youtube_video_id")
        .eq("id", video_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    video = video_res.data[0] if video_res.data else None
    if not video:
        raise RuntimeError("video not found for this user")

    # Skip if cached and not forced — but still honor auto_recreate even on cache hit
    if not force:
        existing_res = (
            sb.table("transcripts")
            .select("id, language, plain_text, translated_text, summary, summarized_at")
            .eq("user_id", user_id)
            .eq("video_id", video_id)
            .limit(1)
            .execute()
        )
        existing = existing_res.data[0] if existing_res.data else None
        if existing and existing.get("summary"):
            # Auto-chain even on cache hit (transcript already done = recreate ready)
            chained_job_id_cached: str | None = None
            auto = p.get("auto_recreate")
            if auto and isinstance(auto, dict) and auto.get("format"):
                idea_res = (
                    sb.table("ideas")
                    .select("id")
                    .eq("user_id", user_id)
                    .eq("video_id", video_id)
                    .limit(1)
                    .execute()
                )
                idea_row = (idea_res.data or [None])[0]
                if idea_row:
                    try:
                        from .jobs_runner import enqueue_job

                        next_job = enqueue_job(
                            sb,
                            user_id=user_id,
                            kind="run_recreate",
                            payload={
                                "idea_id": idea_row["id"],
                                "format": auto["format"],
                                "voice_profile_id": auto.get("voice_profile_id"),
                            },
                            resource_kind="idea",
                            resource_id=idea_row["id"],
                        )
                        chained_job_id_cached = next_job["id"]
                    except Exception:  # noqa: BLE001
                        chained_job_id_cached = None

            update_progress(sb, job["id"], progress=100, step="cached")
            return {
                "transcript_id": existing["id"],
                "language": existing.get("language"),
                "is_thai": existing.get("language") in {"th", "th-TH"},
                "has_translation": bool(existing.get("translated_text")),
                "cached": True,
                "chained_recreate_job_id": chained_job_id_cached,
            }

    # 1. Fetch
    update_progress(sb, job["id"], progress=10, step="fetching_transcript")
    try:
        tr = await asyncio.to_thread(fetch_transcript, video["youtube_video_id"])
    except TranscriptError as exc:
        raise RuntimeError(f"transcript unavailable: {exc}") from exc

    # 2. Translate if needed
    translated_text: str | None = None
    if not tr.is_thai and tr.plain_text.strip():
        update_progress(sb, job["id"], progress=35, step="translating")
        try:
            tres = await asyncio.to_thread(translate_to_thai, tr.plain_text)
            translated_text = tres.text
        except Exception as exc:  # noqa: BLE001
            if _retryable_anthropic(exc):
                raise RetryableJobError(f"translate transient: {exc}") from exc
            raise RuntimeError(f"translate error: {exc}") from exc

    text_for_summary = translated_text or tr.plain_text
    if not text_for_summary.strip():
        raise RuntimeError("transcript empty after fetch")

    # 3. Summarize
    update_progress(sb, job["id"], progress=65, step="summarizing")
    try:
        sres = await asyncio.to_thread(summarize_transcript, text_for_summary)
    except SummarizeError as exc:
        raise RuntimeError(f"summarize parse error: {exc}") from exc
    except Exception as exc:  # noqa: BLE001
        if _retryable_anthropic(exc):
            raise RetryableJobError(f"summarize transient: {exc}") from exc
        raise RuntimeError(f"summarize error: {exc}") from exc

    # 4. Upsert
    update_progress(sb, job["id"], progress=90, step="saving")
    from datetime import UTC, datetime

    iso = datetime.now(UTC).isoformat()
    payload = {
        "user_id": user_id,
        "video_id": video_id,
        "language": tr.language,
        "raw_segments": tr.segments,
        "plain_text": tr.plain_text,
        "translated_text": translated_text,
        "summary": sres.summary,
        "fetched_at": iso,
        "summarized_at": iso,
    }
    upsert_res = (
        sb.table("transcripts").upsert(payload, on_conflict="user_id,video_id").execute()
    )
    rows = upsert_res.data or []
    if not rows:
        raise RuntimeError("failed to persist transcript")

    update_progress(sb, job["id"], progress=100, step="done")

    # Auto-chain: if payload has auto_recreate, enqueue run_recreate next.
    # Used by Quick Recreate from URL — paste URL → wait → get FB post (no extra clicks).
    chained_job_id: str | None = None
    auto = p.get("auto_recreate")
    if auto and isinstance(auto, dict) and auto.get("format"):
        # Find the idea for this video (auto-chain only works if idea exists)
        idea_res = (
            sb.table("ideas")
            .select("id")
            .eq("user_id", user_id)
            .eq("video_id", video_id)
            .limit(1)
            .execute()
        )
        idea_row = (idea_res.data or [None])[0]
        if idea_row:
            try:
                from .jobs_runner import enqueue_job  # local import: avoid cycle

                next_job = enqueue_job(
                    sb,
                    user_id=user_id,
                    kind="run_recreate",
                    payload={
                        "idea_id": idea_row["id"],
                        "format": auto["format"],
                        "voice_profile_id": auto.get("voice_profile_id"),
                    },
                    resource_kind="idea",
                    resource_id=idea_row["id"],
                )
                chained_job_id = next_job["id"]
            except Exception:  # noqa: BLE001
                chained_job_id = None

    return {
        "transcript_id": rows[0]["id"],
        "language": tr.language,
        "is_thai": tr.is_thai,
        "has_translation": translated_text is not None,
        "cached": False,
        "chained_recreate_job_id": chained_job_id,
    }


# =====================================================================
# extract_voice
# =====================================================================
@register("extract_voice")
async def handle_extract_voice(sb, job: dict[str, Any]) -> dict[str, Any]:
    """payload: { samples: [{text, type?, date?}], target_profile_id? }

    If target_profile_id set, the action will overwrite that profile.
    Otherwise just returns the extracted profile (caller decides).
    """
    job["user_id"]
    p = job["payload"] or {}
    samples_in = p.get("samples") or []

    samples = [
        VoiceSample(text=s["text"], type=s.get("type"), date=s.get("date"))
        for s in samples_in
        if isinstance(s, dict) and s.get("text")
    ]
    if not samples:
        raise RuntimeError("samples ว่าง — ใส่ sample อย่างน้อย 1 ชิ้น")

    update_progress(sb, job["id"], progress=20, step="analyzing")

    try:
        result = await asyncio.to_thread(extract_voice_profile, samples)
    except VoiceExtractError as exc:
        raise RuntimeError(f"voice extract parse error: {exc}") from exc
    except Exception as exc:  # noqa: BLE001
        if _retryable_anthropic(exc):
            raise RetryableJobError(f"anthropic transient: {exc}") from exc
        raise RuntimeError(f"voice extract error: {exc}") from exc

    update_progress(sb, job["id"], progress=100, step="done")
    return {
        "voice_profile": result.voice_profile,
        "meta": result.meta.to_jsonable(),
    }


# =====================================================================
# run_recreate
# =====================================================================
@register("run_recreate")
async def handle_run_recreate(sb, job: dict[str, Any]) -> dict[str, Any]:
    """payload: { idea_id, format, voice_profile_id?, instruction_extra? }"""
    user_id = job["user_id"]
    p = job["payload"] or {}
    fmt = p["format"]
    if fmt not in supported_formats():
        raise RuntimeError(f"unsupported format: {fmt}")

    update_progress(sb, job["id"], progress=10, step="loading_context")

    # Map format → creative_style format_type for default lookup
    visual_format_type = {
        "fb_article": "cover",
        "yt_script": "thumbnail",
        "reels": "reel",
        "carousel": "carousel",
    }.get(fmt, "cover")

    try:
        ctx = await asyncio.to_thread(
            load_recreate_context,
            sb,
            user_id=user_id,
            idea_id=p["idea_id"],
            voice_profile_id=p.get("voice_profile_id"),
            creative_style_id=p.get("creative_style_id"),
            creative_style_format_type=visual_format_type,
        )
    except ValueError as exc:
        raise RuntimeError(str(exc)) from exc

    ctx.instruction_extra = p.get("instruction_extra")

    update_progress(sb, job["id"], progress=30, step=f"generating_{fmt}")
    handler = get_recreate_handler(fmt)
    try:
        output, markdown, title, meta = await asyncio.to_thread(handler, ctx)
    except ValueError as exc:
        raise RuntimeError(f"generation error: {exc}") from exc
    except Exception as exc:  # noqa: BLE001
        if _retryable_anthropic(exc):
            raise RetryableJobError(f"anthropic transient: {exc}") from exc
        raise RuntimeError(f"generation unexpected: {exc}") from exc

    update_progress(sb, job["id"], progress=70, step="saving_draft")
    draft_id = await asyncio.to_thread(
        insert_draft,
        sb,
        ctx=ctx,
        format_id=fmt,
        output=output,
        output_markdown=markdown,
        title=title,
        meta=meta,
    )

    # ---- FB article post-processing: render cover + upload to Supabase Storage ----
    cover_url: str | None = None
    cover_warnings: list[str] = []
    if fmt == "fb_article" and output.get("cover"):
        update_progress(sb, job["id"], progress=80, step="rendering_cover")
        try:
            from ..services.claude.recreate.fb_article import (
                render_and_upload_cover_for_draft,
            )

            # Fetch full video + channel metadata needed for cover
            idea_video = (
                sb.table("ideas")
                .select("video_id")
                .eq("id", ctx.idea_id)
                .eq("user_id", user_id)
                .limit(1)
                .execute()
            )
            video_id = (idea_video.data or [{}])[0].get("video_id")
            video_meta: dict[str, Any] = {}
            if video_id:
                vid_res = (
                    sb.table("videos")
                    .select(
                        "youtube_video_id, thumbnail_url, channel_id"
                    )
                    .eq("id", video_id)
                    .eq("user_id", user_id)
                    .limit(1)
                    .execute()
                )
                vid = (vid_res.data or [{}])[0]
                video_meta["youtube_video_id"] = vid.get("youtube_video_id")
                video_meta["thumbnail_url"] = vid.get("thumbnail_url")
                channel_id = vid.get("channel_id")
                if channel_id:
                    ch_res = (
                        sb.table("channels")
                        .select("title, thumbnail_url, subscriber_count")
                        .eq("id", channel_id)
                        .eq("user_id", user_id)
                        .limit(1)
                        .execute()
                    )
                    ch = (ch_res.data or [{}])[0]
                    video_meta["channel_name"] = ch.get("title") or ""
                    video_meta["channel_avatar_url"] = ch.get("thumbnail_url")
                    video_meta["subscriber_count"] = ch.get("subscriber_count")

            cover_url, cover_warnings = await asyncio.to_thread(
                render_and_upload_cover_for_draft,
                sb,
                user_id=user_id,
                draft_id=draft_id,
                output=output,
                video_meta=video_meta,
                creative_style=ctx.creative_style,
            )

            # Update draft.output with cover_url + warnings
            patched_output = dict(output)
            patched_output["cover_url"] = cover_url
            if cover_warnings:
                patched_output["cover_warnings"] = cover_warnings
            sb.table("recreated_drafts").update(
                {"output": patched_output}
            ).eq("id", draft_id).execute()
        except Exception as exc:  # noqa: BLE001
            cover_warnings.append(f"cover pipeline error: {exc}")

    # ---- Carousel post-processing: render N slides, upload each to Storage ----
    carousel_urls: list[str] = []
    carousel_warnings: list[str] = []
    if fmt == "carousel" and output.get("slides"):
        update_progress(sb, job["id"], progress=80, step="rendering_carousel")
        try:
            from ..services.carousel_render import (
                CarouselRenderError,
                render_carousel_bytes,
            )

            cs = ctx.creative_style or {}
            cs_cfg = cs.get("renderer_config") if isinstance(cs.get("renderer_config"), dict) else {}
            base_template = (cs_cfg or {}).get("base_template") if cs_cfg else None
            template_name = output.get("template") or base_template or "thread-x"
            theme_name = output.get("theme") or "cream"
            theme_override = (cs_cfg or {}).get("theme") if isinstance((cs_cfg or {}).get("theme"), dict) else None

            try:
                pngs = await asyncio.to_thread(
                    render_carousel_bytes,
                    slides=output["slides"],
                    template=template_name,
                    theme_name=theme_name,
                    theme_override=theme_override,
                )
            except CarouselRenderError as exc:
                carousel_warnings.append(f"carousel render failed: {exc}")
                pngs = []

            for i, png in enumerate(pngs, start=1):
                path = f"{user_id}/{draft_id}/{i:02d}.png"
                try:
                    sb.storage.from_("fb-covers").upload(
                        path,
                        png,
                        file_options={"upsert": "true", "content-type": "image/png"},
                    )
                    public = sb.storage.from_("fb-covers").get_public_url(path)
                    carousel_urls.append(public)
                except Exception as exc:  # noqa: BLE001
                    carousel_warnings.append(f"slide {i} upload failed: {exc}")

            patched = dict(output)
            if carousel_urls:
                patched["carousel_urls"] = carousel_urls
            if carousel_warnings:
                patched["carousel_warnings"] = carousel_warnings
            sb.table("recreated_drafts").update({"output": patched}).eq(
                "id", draft_id
            ).execute()
        except Exception as exc:  # noqa: BLE001
            carousel_warnings.append(f"carousel pipeline error: {exc}")

    update_progress(sb, job["id"], progress=100, step="done")
    return {
        "draft_id": draft_id,
        "format": fmt,
        "title": title,
        "cover_url": cover_url,
        "cover_warnings": cover_warnings,
        "carousel_urls": carousel_urls,
        "carousel_warnings": carousel_warnings,
        "cache_hit_ratio": meta.to_jsonable()["cache_hit_ratio"],
        "latency_ms": meta.latency_ms,
    }


__all__ = [
    "handle_extract_voice",
    "handle_process_transcript",
    "handle_run_recreate",
    "handle_sync_channel",
]


# Touch get_supabase so import side-effect lazily resolves at handler runtime
_ = get_supabase
