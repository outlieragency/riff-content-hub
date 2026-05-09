"""Cover preview/render route.

POST /cover/preview         — accepts cover fields + video metadata, returns base64 PNG.
                              Does NOT upload to Supabase Storage. Used for live preview
                              in portal editor (debounced calls as user types).

POST /cover/save            — accepts draft_id + new cover fields, re-renders, uploads
                              to Storage, updates draft.output. Used when user clicks
                              "Save" after editing.

POST /cover/upload-source   — multipart upload of user-supplied cover-photo.png override
                              (e.g. when YouTube thumbnail has bleeding text).
                              Saves to fb-covers/{user_id}/{draft_id}/cover-photo.png +
                              triggers re-render.
DELETE /cover/clear-source  — remove cover-photo.png override + re-render with default thumbnail.
"""

from __future__ import annotations

import asyncio
import base64

from fastapi import APIRouter, File, Form, Header, HTTPException, UploadFile
from pydantic import BaseModel, Field

from ..deps import get_supabase
from ..main import require_worker_secret
from ..services.claude.recreate.fb_article import (
    STORAGE_BUCKET,
    render_and_upload_cover_for_draft,
)
from ..services.cover_render import CoverRenderError, render_cover_bytes

router = APIRouter(prefix="/cover", tags=["cover"])


class LineStyleIn(BaseModel):
    highlight_color: str | None = None  # hex
    highlight_style: str | None = None  # 'background' | 'text-color'
    font_size_pct: int | None = None
    font_weight: int | None = None


class CoverFields(BaseModel):
    line1: str
    line2: str
    line3: str
    line1_highlight: str | None = None
    line2_highlight: str | None = None
    line3_highlight: str | None = None
    line1_style: LineStyleIn | None = None
    line2_style: LineStyleIn | None = None
    line3_style: LineStyleIn | None = None
    subhead: str | None = None
    arrow_caption_top: str | None = None
    arrow_caption_bottom: str | None = None
    arrow_position: str = "bottom-left"
    cover_template: str = "trendtech-portrait"


class VideoMeta(BaseModel):
    youtube_video_id: str | None = None
    thumbnail_url: str | None = None
    channel_name: str | None = None
    channel_avatar_url: str | None = None
    subscriber_count: int | None = None


class CoverPreviewRequest(BaseModel):
    cover: CoverFields
    video_meta: VideoMeta = Field(default_factory=VideoMeta)
    user_id: str | None = None
    creative_style_id: str | None = None
    # When set, /preview will look up the cover-photo.png override in Storage
    # (matching /cover/save behavior). Without this, preview uses YT thumbnail
    # only — which is the original "preview doesn't reflect upload" bug.
    draft_id: str | None = None


class CoverPreviewResponse(BaseModel):
    cover_data_uri: str  # data:image/png;base64,...
    bytes_length: int


@router.post("/preview", response_model=CoverPreviewResponse)
def post_preview(
    body: CoverPreviewRequest,
    authorization: str | None = Header(default=None),
) -> CoverPreviewResponse:
    """Render cover and return as base64 data URI (no Storage upload).

    If `draft_id` + `user_id` provided, looks up the cover-photo.png override
    so preview reflects the user's uploaded photo (not just YT thumbnail).
    """
    require_worker_secret(authorization)

    sb = get_supabase()

    # Resolve theme + base_template from creative_style if supplied
    theme: dict[str, str] | None = None
    cover_template = body.cover.cover_template
    if body.creative_style_id and body.user_id:
        cs_res = (
            sb.table("creative_styles")
            .select("renderer_config")
            .eq("id", body.creative_style_id)
            .eq("user_id", body.user_id)
            .limit(1)
            .execute()
        )
        if cs_res.data:
            cfg = cs_res.data[0].get("renderer_config") or {}
            if isinstance(cfg, dict):
                base = cfg.get("base_template")
                if isinstance(base, str) and base:
                    cover_template = base
                theme_raw = cfg.get("theme")
                if isinstance(theme_raw, dict):
                    theme = {k: v for k, v in theme_raw.items() if isinstance(v, str)}

    # Fetch cover-photo.png override if draft_id + user_id provided.
    # This ensures preview shows what /save will render — same photo source.
    cover_photo_bytes: bytes | None = None
    if body.draft_id and body.user_id:
        path = f"{body.user_id}/{body.draft_id}/cover-photo.png"
        try:
            cover_photo_bytes = sb.storage.from_("fb-covers").download(path)
        except Exception:
            cover_photo_bytes = None

    # Auto-hydrate video_meta from DB if caller didn't fill it (matches /save).
    # Without this, preview shows black BG when caller forgets to pass meta.
    video_meta_dict = body.video_meta.model_dump()
    needs_lookup = body.draft_id and body.user_id and not all(
        [
            video_meta_dict.get("youtube_video_id"),
            video_meta_dict.get("thumbnail_url"),
            video_meta_dict.get("channel_name"),
        ]
    )
    if needs_lookup:
        hydrated = _resolve_video_meta(sb, body.user_id, body.draft_id, body.video_meta)
        for key, value in hydrated.items():
            if value and not video_meta_dict.get(key):
                video_meta_dict[key] = value

    try:
        png_bytes = render_cover_bytes(
            video_id=video_meta_dict.get("youtube_video_id") or "",
            thumbnail_url=video_meta_dict.get("thumbnail_url"),
            channel_name=video_meta_dict.get("channel_name") or "",
            channel_avatar_url=video_meta_dict.get("channel_avatar_url"),
            subscriber_count=video_meta_dict.get("subscriber_count"),
            line1=body.cover.line1,
            line2=body.cover.line2,
            line3=body.cover.line3,
            line1_highlight=body.cover.line1_highlight,
            line2_highlight=body.cover.line2_highlight,
            line3_highlight=body.cover.line3_highlight,
            line1_style=body.cover.line1_style.model_dump() if body.cover.line1_style else None,
            line2_style=body.cover.line2_style.model_dump() if body.cover.line2_style else None,
            line3_style=body.cover.line3_style.model_dump() if body.cover.line3_style else None,
            subhead=body.cover.subhead,
            arrow_caption_top=body.cover.arrow_caption_top,
            arrow_caption_bottom=body.cover.arrow_caption_bottom,
            arrow_position=body.cover.arrow_position,
            cover_template=cover_template,
            cover_photo_bytes=cover_photo_bytes,
            theme=theme,
        )
    except CoverRenderError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"render error: {exc}") from exc

    encoded = base64.b64encode(png_bytes).decode("ascii")
    return CoverPreviewResponse(
        cover_data_uri=f"data:image/png;base64,{encoded}",
        bytes_length=len(png_bytes),
    )


class CoverSaveRequest(BaseModel):
    user_id: str
    draft_id: str
    cover: CoverFields
    video_meta: VideoMeta = Field(default_factory=VideoMeta)


class CoverSaveResponse(BaseModel):
    cover_url: str | None
    warnings: list[str]


def _resolve_creative_style(sb, user_id: str, draft_id: str) -> dict | None:
    """Look up the draft's creative_style row (or default for cover)."""
    draft_res = (
        sb.table("recreated_drafts")
        .select("creative_style_id")
        .eq("id", draft_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    if not draft_res.data:
        return None
    cs_id = draft_res.data[0].get("creative_style_id")
    if cs_id:
        cs_res = (
            sb.table("creative_styles")
            .select("id, renderer_config, style_guide_md")
            .eq("id", cs_id)
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )
        if cs_res.data:
            return cs_res.data[0]
    # Fallback to the user's default cover style
    default_res = (
        sb.table("creative_styles")
        .select("id, renderer_config, style_guide_md")
        .eq("user_id", user_id)
        .eq("format_type", "cover")
        .eq("is_default", True)
        .limit(1)
        .execute()
    )
    return default_res.data[0] if default_res.data else None


def _resolve_video_meta(
    sb,
    user_id: str,
    draft_id: str,
    fallback: VideoMeta,
) -> dict:
    """Look up video + channel metadata for a draft. If fields are missing in
    `fallback`, hydrate from DB (joining ideas → videos → channels).

    Without this, Save would render with empty video_meta → no thumbnail →
    black background (regression bug fixed 2026-05-08).
    """
    fb = fallback.model_dump()
    needs_lookup = not all(
        [
            fb.get("youtube_video_id"),
            fb.get("thumbnail_url"),
            fb.get("channel_name"),
            fb.get("subscriber_count"),
        ]
    )
    if not needs_lookup:
        return fb

    draft_res = (
        sb.table("recreated_drafts")
        .select("idea_id")
        .eq("id", draft_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    if not draft_res.data:
        return fb
    idea_id = draft_res.data[0].get("idea_id")
    if not idea_id:
        return fb

    idea_res = (
        sb.table("ideas")
        .select("video_id")
        .eq("id", idea_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    video_id = (idea_res.data or [{}])[0].get("video_id")
    if not video_id:
        return fb

    vid_res = (
        sb.table("videos")
        .select("youtube_video_id, thumbnail_url, channel_id")
        .eq("id", video_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    vid = (vid_res.data or [{}])[0]
    out = dict(fb)
    out["youtube_video_id"] = fb.get("youtube_video_id") or vid.get("youtube_video_id")
    out["thumbnail_url"] = fb.get("thumbnail_url") or vid.get("thumbnail_url")

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
        out["channel_name"] = fb.get("channel_name") or ch.get("title")
        out["channel_avatar_url"] = fb.get("channel_avatar_url") or ch.get("thumbnail_url")
        out["subscriber_count"] = fb.get("subscriber_count") or ch.get("subscriber_count")
    return out


@router.post("/save", response_model=CoverSaveResponse)
def post_save(
    body: CoverSaveRequest,
    authorization: str | None = Header(default=None),
) -> CoverSaveResponse:
    """Re-render cover with edited fields + upload to Storage + update draft.output."""
    require_worker_secret(authorization)

    sb = get_supabase()

    # Fetch existing draft to merge cover fields
    draft_res = (
        sb.table("recreated_drafts")
        .select("output")
        .eq("id", body.draft_id)
        .eq("user_id", body.user_id)
        .limit(1)
        .execute()
    )
    if not draft_res.data:
        raise HTTPException(status_code=404, detail="draft not found")

    existing_output = draft_res.data[0].get("output") or {}

    # Patch cover fields
    new_cover = {**(existing_output.get("cover") or {}), **body.cover.model_dump()}
    new_output = {**existing_output, "cover": new_cover}

    # Auto-hydrate video_meta from DB if caller didn't supply it
    video_meta = _resolve_video_meta(sb, body.user_id, body.draft_id, body.video_meta)
    creative_style = _resolve_creative_style(sb, body.user_id, body.draft_id)

    cover_url, warnings = render_and_upload_cover_for_draft(
        sb,
        user_id=body.user_id,
        draft_id=body.draft_id,
        output=new_output,
        video_meta=video_meta,
        creative_style=creative_style,
    )

    new_output["cover_url"] = cover_url
    if warnings:
        new_output["cover_warnings"] = warnings

    sb.table("recreated_drafts").update({"output": new_output}).eq(
        "id", body.draft_id
    ).eq("user_id", body.user_id).execute()

    return CoverSaveResponse(cover_url=cover_url, warnings=warnings)


# =====================================================================
# /cover/upload-source — user uploads custom cover-photo.png override
# =====================================================================

class CoverSourceResponse(BaseModel):
    cover_photo_url: str
    cover_url: str | None
    warnings: list[str]


@router.post("/upload-source", response_model=CoverSourceResponse)
async def post_upload_source(
    user_id: str = Form(...),
    draft_id: str = Form(...),
    file: UploadFile = File(...),
    authorization: str | None = Header(default=None),
) -> CoverSourceResponse:
    """Accept multipart PNG/JPG upload, save as cover-photo.png override,
    re-render the final cover, return both URLs.

    Expected aspect ratio: 1080×890 (portrait). Other sizes will work but may
    distort.
    """
    require_worker_secret(authorization)

    if file.content_type not in {"image/png", "image/jpeg", "image/webp"}:
        raise HTTPException(
            status_code=415,
            detail=f"unsupported content-type: {file.content_type}",
        )

    sb = get_supabase()

    # Verify draft ownership
    draft_res = (
        sb.table("recreated_drafts")
        .select("output, idea_id")
        .eq("id", draft_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    if not draft_res.data:
        raise HTTPException(status_code=404, detail="draft not found")
    draft = draft_res.data[0]
    output = draft.get("output") or {}

    # Save user file as cover-photo.png override
    raw = await file.read()
    src_path = f"{user_id}/{draft_id}/cover-photo.png"
    try:
        sb.storage.from_(STORAGE_BUCKET).upload(
            src_path,
            raw,
            file_options={"upsert": "true", "content-type": "image/png"},
        )
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"storage upload failed: {e}") from e

    cover_photo_url = sb.storage.from_(STORAGE_BUCKET).get_public_url(src_path)

    # Fetch video meta to re-render
    video_meta: dict = {}
    if draft.get("idea_id"):
        idea_res = (
            sb.table("ideas")
            .select("video_id")
            .eq("id", draft["idea_id"])
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )
        idea = (idea_res.data or [{}])[0]
        if idea.get("video_id"):
            vid_res = (
                sb.table("videos")
                .select("youtube_video_id, thumbnail_url, channel_id")
                .eq("id", idea["video_id"])
                .eq("user_id", user_id)
                .limit(1)
                .execute()
            )
            vid = (vid_res.data or [{}])[0]
            video_meta["youtube_video_id"] = vid.get("youtube_video_id")
            video_meta["thumbnail_url"] = vid.get("thumbnail_url")
            if vid.get("channel_id"):
                ch_res = (
                    sb.table("channels")
                    .select("title, thumbnail_url, subscriber_count")
                    .eq("id", vid["channel_id"])
                    .eq("user_id", user_id)
                    .limit(1)
                    .execute()
                )
                ch = (ch_res.data or [{}])[0]
                video_meta["channel_name"] = ch.get("title")
                video_meta["channel_avatar_url"] = ch.get("thumbnail_url")
                video_meta["subscriber_count"] = ch.get("subscriber_count")

    creative_style = _resolve_creative_style(sb, user_id, draft_id)

    # Re-render (will pick up the cover-photo.png override automatically).
    # Wrap in to_thread because render uses sync Playwright; route is async (file IO).
    def _render():
        return render_and_upload_cover_for_draft(
            sb,
            user_id=user_id,
            draft_id=draft_id,
            output=output,
            video_meta=video_meta,
            creative_style=creative_style,
        )

    cover_url, warnings = await asyncio.to_thread(_render)

    new_output = {
        **output,
        "cover_url": cover_url,
        "cover_photo_url": cover_photo_url,
    }
    if warnings:
        new_output["cover_warnings"] = warnings
    sb.table("recreated_drafts").update({"output": new_output}).eq("id", draft_id).eq(
        "user_id", user_id
    ).execute()

    return CoverSourceResponse(
        cover_photo_url=cover_photo_url,
        cover_url=cover_url,
        warnings=warnings,
    )


@router.delete("/clear-source", response_model=CoverSourceResponse)
def delete_clear_source(
    user_id: str,
    draft_id: str,
    authorization: str | None = Header(default=None),
) -> CoverSourceResponse:
    """Remove cover-photo.png override + re-render with default YouTube thumbnail."""
    require_worker_secret(authorization)
    sb = get_supabase()

    # Verify draft
    draft_res = (
        sb.table("recreated_drafts")
        .select("output, idea_id")
        .eq("id", draft_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    if not draft_res.data:
        raise HTTPException(status_code=404, detail="draft not found")
    draft = draft_res.data[0]
    output = draft.get("output") or {}

    src_path = f"{user_id}/{draft_id}/cover-photo.png"
    try:
        sb.storage.from_(STORAGE_BUCKET).remove([src_path])
    except Exception:
        pass  # not fatal; might not exist

    # Re-render
    video_meta: dict = {}
    if draft.get("idea_id"):
        idea_res = (
            sb.table("ideas")
            .select("video_id")
            .eq("id", draft["idea_id"])
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )
        idea = (idea_res.data or [{}])[0]
        if idea.get("video_id"):
            vid_res = (
                sb.table("videos")
                .select("youtube_video_id, thumbnail_url, channel_id")
                .eq("id", idea["video_id"])
                .eq("user_id", user_id)
                .limit(1)
                .execute()
            )
            vid = (vid_res.data or [{}])[0]
            video_meta["youtube_video_id"] = vid.get("youtube_video_id")
            video_meta["thumbnail_url"] = vid.get("thumbnail_url")
            if vid.get("channel_id"):
                ch_res = (
                    sb.table("channels")
                    .select("title, thumbnail_url, subscriber_count")
                    .eq("id", vid["channel_id"])
                    .eq("user_id", user_id)
                    .limit(1)
                    .execute()
                )
                ch = (ch_res.data or [{}])[0]
                video_meta["channel_name"] = ch.get("title")
                video_meta["channel_avatar_url"] = ch.get("thumbnail_url")
                video_meta["subscriber_count"] = ch.get("subscriber_count")

    creative_style = _resolve_creative_style(sb, user_id, draft_id)
    cover_url, warnings = render_and_upload_cover_for_draft(
        sb,
        user_id=user_id,
        draft_id=draft_id,
        output=output,
        video_meta=video_meta,
        creative_style=creative_style,
    )

    new_output = dict(output)
    new_output["cover_url"] = cover_url
    new_output.pop("cover_photo_url", None)
    if warnings:
        new_output["cover_warnings"] = warnings
    sb.table("recreated_drafts").update({"output": new_output}).eq("id", draft_id).eq(
        "user_id", user_id
    ).execute()

    return CoverSourceResponse(cover_photo_url="", cover_url=cover_url, warnings=warnings)
