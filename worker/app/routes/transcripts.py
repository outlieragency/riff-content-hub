"""Transcript pipeline route — enqueue version.

POST /transcripts/enqueue — create job, return job_id immediately.
Portal subscribes via Supabase Realtime to track progress.
"""

from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

from ..deps import get_supabase
from ..main import require_worker_secret
from ..workers.jobs_runner import RateLimitError, enqueue_job

router = APIRouter(prefix="/transcripts", tags=["transcripts"])


class ProcessTranscriptRequest(BaseModel):
    user_id: str = Field(..., description="auth.users.id")
    video_id: str = Field(..., description="UUID of public.videos")
    force: bool = Field(False, description="re-fetch + re-summarize even if cached")


class EnqueueResponse(BaseModel):
    job_id: str
    status: str
    deduplicated: bool


@router.post("/enqueue", response_model=EnqueueResponse)
def post_enqueue(
    body: ProcessTranscriptRequest,
    authorization: str | None = Header(default=None),
) -> EnqueueResponse:
    require_worker_secret(authorization)
    sb = get_supabase()

    # Verify video belongs to user before enqueueing
    video_res = (
        sb.table("videos")
        .select("id")
        .eq("id", body.video_id)
        .eq("user_id", body.user_id)
        .limit(1)
        .execute()
    )
    if not video_res.data:
        raise HTTPException(status_code=404, detail="video not found for this user")

    payload = {"video_id": body.video_id, "force": body.force}
    try:
        job = enqueue_job(
            sb,
            user_id=body.user_id,
            kind="process_transcript",
            payload=payload,
            resource_kind="video",
            resource_id=body.video_id,
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
        or (job.get("created_at") and (job.get("attempts") or 0) > 0),
    )
