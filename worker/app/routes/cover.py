"""Cover preview / save / upload-source routes (Riff v2).

POST /cover/preview      — render preview PNG (base64 data URI). Picks up
                            any uploaded cover-photo.png override from
                            Storage when draft_id + user_id supplied.
POST /cover/save         — render final PNG, upload to Storage, update
                            recreated_drafts.output.cover_url.
POST /cover/upload-source — multipart upload of user-supplied cover-photo.png
                            override (e.g. when YouTube thumbnail is bad).
                            Just persists the file; the editor calls /preview
                            again to repaint.
DELETE /cover/clear-source — drop the cover-photo.png override.

v2 callers always supply the full video_meta (channel_name, subscriber_count,
thumbnail_url, …) — the v1 ideas/videos/channels join tables are gone, so
the worker no longer hydrates from DB. Pass it from the editor every time.
"""

from __future__ import annotations

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


def _try_load_cover_photo_override(
    sb, user_id: str | None, draft_id: str | None
) -> bytes | None:
    if not user_id or not draft_id:
        return None
    path = f"{user_id}/{draft_id}/cover-photo.png"
    try:
        return sb.storage.from_(STORAGE_BUCKET).download(path)
    except Exception:
        return None


def _render(
    *,
    cover: CoverFields,
    video_meta: VideoMeta,
    cover_photo_bytes: bytes | None,
) -> bytes:
    return render_cover_bytes(
        video_id=video_meta.youtube_video_id or "",
        thumbnail_url=video_meta.thumbnail_url,
        channel_name=video_meta.channel_name or "",
        channel_avatar_url=video_meta.channel_avatar_url,
        subscriber_count=video_meta.subscriber_count,
        line1=cover.line1,
        line2=cover.line2,
        line3=cover.line3,
        line1_highlight=cover.line1_highlight,
        line2_highlight=cover.line2_highlight,
        line3_highlight=cover.line3_highlight,
        line1_style=cover.line1_style.model_dump() if cover.line1_style else None,
        line2_style=cover.line2_style.model_dump() if cover.line2_style else None,
        line3_style=cover.line3_style.model_dump() if cover.line3_style else None,
        subhead=cover.subhead,
        arrow_caption_top=cover.arrow_caption_top,
        arrow_caption_bottom=cover.arrow_caption_bottom,
        arrow_position=cover.arrow_position,
        cover_template=cover.cover_template,
        cover_photo_bytes=cover_photo_bytes,
    )


# ────────────────────────────────────────────────────────────────────────
# /cover/preview
# ────────────────────────────────────────────────────────────────────────


class CoverPreviewRequest(BaseModel):
    cover: CoverFields
    video_meta: VideoMeta = Field(default_factory=VideoMeta)
    user_id: str | None = None
    draft_id: str | None = None


class CoverPreviewResponse(BaseModel):
    cover_data_uri: str
    bytes_length: int


@router.post("/preview", response_model=CoverPreviewResponse)
def post_preview(
    body: CoverPreviewRequest,
    authorization: str | None = Header(default=None),
) -> CoverPreviewResponse:
    require_worker_secret(authorization)
    sb = get_supabase()

    cover_photo_bytes = _try_load_cover_photo_override(sb, body.user_id, body.draft_id)

    try:
        png = _render(
            cover=body.cover,
            video_meta=body.video_meta,
            cover_photo_bytes=cover_photo_bytes,
        )
    except CoverRenderError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"render error: {exc}") from exc

    encoded = base64.b64encode(png).decode("ascii")
    return CoverPreviewResponse(
        cover_data_uri=f"data:image/png;base64,{encoded}",
        bytes_length=len(png),
    )


# ────────────────────────────────────────────────────────────────────────
# /cover/save
# ────────────────────────────────────────────────────────────────────────


class CoverSaveRequest(BaseModel):
    user_id: str
    draft_id: str
    cover: CoverFields
    video_meta: VideoMeta = Field(default_factory=VideoMeta)


class CoverSaveResponse(BaseModel):
    cover_url: str | None
    warnings: list[str]


@router.post("/save", response_model=CoverSaveResponse)
def post_save(
    body: CoverSaveRequest,
    authorization: str | None = Header(default=None),
) -> CoverSaveResponse:
    require_worker_secret(authorization)
    sb = get_supabase()

    # Verify draft ownership before rendering.
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
    output = draft_res.data[0].get("output") or {}

    # Patch the latest cover spec back into output.cover so future calls
    # (re-saves, re-renders) see the same source of truth.
    patched_output = dict(output)
    patched_output["cover"] = body.cover.model_dump()

    cover_url, warnings = render_and_upload_cover_for_draft(
        sb,
        user_id=body.user_id,
        draft_id=body.draft_id,
        output=patched_output,
        video_meta=body.video_meta.model_dump(),
        creative_style=None,
    )
    if cover_url:
        patched_output["cover_url"] = cover_url
    if warnings:
        patched_output["cover_warnings"] = warnings
    sb.table("recreated_drafts").update({"output": patched_output}).eq(
        "id", body.draft_id
    ).eq("user_id", body.user_id).execute()

    return CoverSaveResponse(cover_url=cover_url, warnings=warnings)


# ────────────────────────────────────────────────────────────────────────
# /cover/upload-source + /cover/clear-source
# ────────────────────────────────────────────────────────────────────────


class CoverSourceResponse(BaseModel):
    cover_photo_url: str | None
    warnings: list[str]


@router.post("/upload-source", response_model=CoverSourceResponse)
async def post_upload_source(
    user_id: str = Form(...),
    draft_id: str = Form(...),
    file: UploadFile = File(...),
    authorization: str | None = Header(default=None),
) -> CoverSourceResponse:
    """Save a user-uploaded photo as cover-photo.png override.

    Re-render is left to the editor (call /cover/preview after upload).
    """
    require_worker_secret(authorization)

    if file.content_type not in {"image/png", "image/jpeg", "image/webp"}:
        raise HTTPException(
            status_code=415,
            detail=f"unsupported content-type: {file.content_type}",
        )
    sb = get_supabase()

    draft_res = (
        sb.table("recreated_drafts")
        .select("id")
        .eq("id", draft_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    if not draft_res.data:
        raise HTTPException(status_code=404, detail="draft not found")

    raw = await file.read()
    src_path = f"{user_id}/{draft_id}/cover-photo.png"
    try:
        sb.storage.from_(STORAGE_BUCKET).upload(
            src_path,
            raw,
            file_options={"upsert": "true", "content-type": "image/png"},
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"storage upload failed: {exc}") from exc

    cover_photo_url = sb.storage.from_(STORAGE_BUCKET).get_public_url(src_path)
    return CoverSourceResponse(cover_photo_url=cover_photo_url, warnings=[])


@router.delete("/clear-source", response_model=CoverSourceResponse)
def delete_clear_source(
    user_id: str,
    draft_id: str,
    authorization: str | None = Header(default=None),
) -> CoverSourceResponse:
    """Remove the cover-photo.png override (revert to YouTube thumbnail)."""
    require_worker_secret(authorization)
    sb = get_supabase()

    draft_res = (
        sb.table("recreated_drafts")
        .select("id")
        .eq("id", draft_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    if not draft_res.data:
        raise HTTPException(status_code=404, detail="draft not found")

    src_path = f"{user_id}/{draft_id}/cover-photo.png"
    try:
        sb.storage.from_(STORAGE_BUCKET).remove([src_path])
    except Exception:
        pass  # not fatal — might not exist

    return CoverSourceResponse(cover_photo_url=None, warnings=[])
