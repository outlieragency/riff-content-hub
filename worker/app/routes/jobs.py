"""Job status routes — for portal polling fallback (Realtime is primary)."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

from ..deps import get_supabase
from ..main import require_worker_secret

router = APIRouter(prefix="/jobs", tags=["jobs"])


class JobStatusResponse(BaseModel):
    id: str
    kind: str
    status: str  # queued | running | done | error
    progress: int
    progress_step: str | None
    result: dict[str, Any] | None
    error: str | None
    created_at: str
    started_at: str | None
    finished_at: str | None
    attempts: int


@router.get("/{job_id}", response_model=JobStatusResponse)
def get_job(
    job_id: str,
    user_id: str,  # query param: ?user_id=...
    authorization: str | None = Header(default=None),
) -> JobStatusResponse:
    require_worker_secret(authorization)
    sb = get_supabase()
    res = (
        sb.table("jobs")
        .select(
            "id, kind, status, progress, progress_step, result, error, "
            "created_at, started_at, finished_at, attempts"
        )
        .eq("id", job_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="job not found")
    return JobStatusResponse(**res.data[0])
