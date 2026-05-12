"""Recreate enqueue route.

POST /recreate/enqueue — create a job row, return job_id immediately.
Portal subscribes via Supabase Realtime to track progress.

Sync mode `/recreate/run` (legacy, used in Stage 0 smoke tests) เก็บไว้
สำหรับ debug/admin direct invocation — แต่ portal ห้ามใช้ใน Stage A+
"""

from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

from ..deps import get_supabase
from ..main import require_worker_secret
from ..services.claude.recreate import get_handler, supported_formats
from ..services.claude.recreate._orchestrator import (
    insert_draft,
    load_recreate_context,
)
from ..workers.jobs_runner import RateLimitError, enqueue_job

router = APIRouter(prefix="/recreate", tags=["recreate"])


class RecreateRequest(BaseModel):
    user_id: str = Field(..., description="auth.users.id")
    idea_id: str = Field(..., description="UUID of public.ideas")
    format: str = Field(..., description="yt_script | fb_article | reels | carousel")
    voice_profile_id: str | None = None
    creative_style_id: str | None = Field(
        default=None,
        description="UUID of public.creative_styles — controls visual cover style",
    )
    carousel_template_id: str | None = Field(
        default=None,
        description=(
            "UUID of public.carousel_templates — when format=carousel, routes "
            "to the user-template pipeline (Claude fills the template schema "
            "from the video summary) instead of the built-in thread-x renderer."
        ),
    )
    instruction_extra: str | None = None


class EnqueueResponse(BaseModel):
    job_id: str
    status: str  # 'queued' or 'running' (if dedup hit existing)
    deduplicated: bool


@router.post("/enqueue", response_model=EnqueueResponse)
def post_enqueue(
    body: RecreateRequest,
    authorization: str | None = Header(default=None),
) -> EnqueueResponse:
    require_worker_secret(authorization)

    if body.format not in supported_formats():
        raise HTTPException(
            status_code=400,
            detail=f"unsupported format. supported: {supported_formats()}",
        )

    sb = get_supabase()
    payload = {
        "idea_id": body.idea_id,
        "format": body.format,
        "voice_profile_id": body.voice_profile_id,
        "creative_style_id": body.creative_style_id,
        "carousel_template_id": body.carousel_template_id,
        "instruction_extra": body.instruction_extra,
    }
    try:
        job = enqueue_job(
            sb,
            user_id=body.user_id,
            kind="run_recreate",
            payload=payload,
            resource_kind="idea",
            resource_id=body.idea_id,
        )
    except RateLimitError as exc:
        raise HTTPException(
            status_code=429,
            detail=f"rate limit: {exc.kind} เกิน {exc.limit}/{exc.window_s}s รอแล้วลองใหม่",
        ) from exc
    is_new_status = job.get("status", "queued")
    return EnqueueResponse(
        job_id=job["id"],
        status=is_new_status,
        deduplicated=is_new_status != "queued"
        or (job.get("created_at") and job.get("attempts", 0) > 0),
    )


# ============================================================
# Legacy sync route (debug/admin only — portal ห้ามเรียก)
# ============================================================


class SyncRecreateResponse(BaseModel):
    draft_id: str
    format: str
    title: str | None
    output: dict
    output_markdown: str | None
    cache_hit_ratio: float
    latency_ms: int


@router.post("/run", response_model=SyncRecreateResponse, deprecated=True)
def post_recreate_sync(
    body: RecreateRequest,
    authorization: str | None = Header(default=None),
) -> SyncRecreateResponse:
    """LEGACY synchronous recreate — kept for direct admin invocation only.

    Portal must use /recreate/enqueue instead.
    """
    require_worker_secret(authorization)

    if body.format not in supported_formats():
        raise HTTPException(
            status_code=400,
            detail=f"unsupported format. supported: {supported_formats()}",
        )

    sb = get_supabase()

    try:
        ctx = load_recreate_context(
            sb,
            user_id=body.user_id,
            idea_id=body.idea_id,
            voice_profile_id=body.voice_profile_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    ctx.instruction_extra = body.instruction_extra

    handler = get_handler(body.format)
    try:
        output, markdown, title, meta = handler(ctx)
    except ValueError as exc:
        raise HTTPException(status_code=502, detail=f"generation error: {exc}") from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"unexpected: {exc}") from exc

    draft_id = insert_draft(
        sb,
        ctx=ctx,
        format_id=body.format,
        output=output,
        output_markdown=markdown,
        title=title,
        meta=meta,
    )

    return SyncRecreateResponse(
        draft_id=draft_id,
        format=body.format,
        title=title,
        output=output,
        output_markdown=markdown,
        cache_hit_ratio=meta.to_jsonable()["cache_hit_ratio"],
        latency_ms=meta.latency_ms,
    )
