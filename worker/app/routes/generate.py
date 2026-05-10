"""POST /generate — paste-URL → FB post + cover (synchronous, v2 entry).

Riff v2 collapses the v1 channel/idea/transcript pipeline into a single
synchronous endpoint:

  1. Parse YouTube URL → video_id
  2. Fetch video + channel metadata via YouTube Data API
  3. Fetch transcript (translate to Thai if needed)
  4. Summarize with Claude (cached prompt)
  5. Resolve user's active voice profile from DB
  6. Generate FB article (post body + cover spec) via fb_article handler
  7. Persist a row in `recreated_drafts` (idea_id NULL — v2 has no idea row)
  8. Render the trendtech-portrait cover and upload to Supabase Storage
  9. Return everything the /generate page needs to show + edit
"""

from __future__ import annotations

import asyncio
import re
from typing import Any

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

from ..deps import get_supabase
from ..main import require_worker_secret
from ..services.claude.recreate import get_handler
from ..services.claude.recreate._orchestrator import (
    RecreateContext,
    insert_draft,
)
from ..services.claude.recreate.fb_article import (
    render_and_upload_cover_for_draft,
)
from ..services.claude.summarize import SummarizeError, summarize_transcript
from ..services.claude.translate import translate_to_thai
from ..services.youtube.api import fetch_videos_details, resolve_channel
from ..services.youtube.parse import channel_row, video_row
from ..services.youtube.transcript import TranscriptError, fetch_transcript

router = APIRouter(prefix="/generate", tags=["generate"])

_VIDEO_ID_RE = re.compile(
    r"(?:v=|youtu\.be/|/embed/|/shorts/)([A-Za-z0-9_-]{11})"
)


def _extract_video_id(url_or_id: str) -> str | None:
    s = url_or_id.strip()
    if len(s) == 11 and re.match(r"^[A-Za-z0-9_-]{11}$", s):
        return s
    m = _VIDEO_ID_RE.search(s)
    return m.group(1) if m else None


class GenerateRequest(BaseModel):
    user_id: str
    url: str
    instruction_extra: str | None = None


class GenerateResponse(BaseModel):
    draft_id: str
    title: str
    content: str  # post_body — copy/paste straight to FB
    cover_url: str | None  # public URL of rendered cover.png
    cover_data: dict[str, Any]  # raw cover spec — line1/2/3, highlights, arrow, etc.
    video_meta: dict[str, Any]  # for cover editor (creator badge, thumbnail)
    style_warnings: list[str]
    cache_hit_ratio: float
    latency_ms: int


@router.post("", response_model=GenerateResponse)
async def post_generate(
    body: GenerateRequest,
    authorization: str | None = Header(default=None),
) -> GenerateResponse:
    require_worker_secret(authorization)

    # 1. Parse URL → video_id
    video_id = _extract_video_id(body.url)
    if not video_id:
        raise HTTPException(status_code=400, detail="parse YouTube URL failed")

    sb = get_supabase()

    # 2. Fetch video + channel from YouTube Data API
    items = await asyncio.to_thread(fetch_videos_details, [video_id])
    if not items:
        raise HTTPException(status_code=404, detail="video not found on YouTube")
    yt_video = items[0]
    yt_channel_id = (yt_video.get("snippet") or {}).get("channelId")
    if not yt_channel_id:
        raise HTTPException(status_code=502, detail="missing channelId from YouTube")
    yt_channel = await asyncio.to_thread(resolve_channel, "channel_id", yt_channel_id)
    if not yt_channel:
        raise HTTPException(status_code=502, detail="could not resolve channel from YouTube")

    video_data = video_row(yt_video)
    channel_data = channel_row(yt_channel)

    # 3. Transcript
    try:
        tr = await asyncio.to_thread(fetch_transcript, video_id)
    except TranscriptError as exc:
        raise HTTPException(status_code=422, detail=f"transcript unavailable: {exc}") from exc

    # 4. Translate → Thai if not already
    text_for_summary = tr.plain_text
    if not tr.is_thai and text_for_summary.strip():
        translated = await asyncio.to_thread(translate_to_thai, text_for_summary, body.user_id)
        text_for_summary = translated.text
    if not text_for_summary.strip():
        raise HTTPException(status_code=422, detail="transcript empty after fetch")

    # 5. Summarize
    try:
        summary_res = await asyncio.to_thread(
            summarize_transcript, text_for_summary, body.user_id
        )
    except SummarizeError as exc:
        raise HTTPException(status_code=500, detail=f"summarize parse error: {exc}") from exc

    # 6. Resolve voice profile (active → fallback to oldest)
    vp_res = (
        sb.table("voice_profiles")
        .select("id, voice_profile")
        .eq("user_id", body.user_id)
        .eq("is_active", True)
        .limit(1)
        .execute()
    )
    vp = vp_res.data[0] if vp_res.data else None
    if not vp:
        fallback = (
            sb.table("voice_profiles")
            .select("id, voice_profile")
            .eq("user_id", body.user_id)
            .order("created_at", desc=False)
            .limit(1)
            .execute()
        )
        vp = fallback.data[0] if fallback.data else None
    if not vp:
        raise HTTPException(status_code=412, detail="no voice profile for this user")

    # 7. Build context (no idea_id, no transcripts_id — v2 paste-URL flow)
    video_for_ctx = {
        "title": video_data.get("title"),
        "channel": channel_data.get("title"),
        "view_count": video_data.get("view_count"),
        "duration_seconds": video_data.get("duration_seconds"),
    }
    ctx = RecreateContext(
        user_id=body.user_id,
        voice_profile_id=vp["id"],
        voice_profile=vp.get("voice_profile") or {},
        summary=summary_res.summary,
        video=video_for_ctx,
        instruction_extra=body.instruction_extra,
    )

    # 8. Generate via fb_article handler
    handler = get_handler("fb_article")
    output, markdown, title, meta = await asyncio.to_thread(handler, ctx)

    # 9. Persist draft (idea_id NULL after migration 0020)
    draft_id = await asyncio.to_thread(
        insert_draft,
        sb,
        ctx=ctx,
        format_id="fb_article",
        output=output,
        output_markdown=markdown,
        title=title,
        meta=meta,
    )

    # 10. Render cover + upload to Storage
    video_meta = {
        "youtube_video_id": video_id,
        "thumbnail_url": video_data.get("thumbnail_url"),
        "channel_name": channel_data.get("title", ""),
        "channel_avatar_url": channel_data.get("thumbnail_url"),
        "subscriber_count": channel_data.get("subscriber_count"),
    }
    cover_url, cover_warnings = await asyncio.to_thread(
        render_and_upload_cover_for_draft,
        sb,
        user_id=body.user_id,
        draft_id=draft_id,
        output=output,
        video_meta=video_meta,
        creative_style=None,
    )

    # 11. Update draft with cover_url for downstream lookups
    if cover_url:
        patched = dict(output)
        patched["cover_url"] = cover_url

        def _update():
            sb.table("recreated_drafts").update({"output": patched}).eq(
                "id", draft_id
            ).execute()

        await asyncio.to_thread(_update)

    style_warnings = list(output.get("style_warnings") or []) + cover_warnings

    return GenerateResponse(
        draft_id=draft_id,
        title=title or "",
        content=output["post_body"],
        cover_url=cover_url,
        cover_data=output["cover"],
        video_meta=video_meta,
        style_warnings=style_warnings,
        cache_hit_ratio=meta.to_jsonable()["cache_hit_ratio"],
        latency_ms=meta.latency_ms,
    )
