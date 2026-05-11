"""Shared creator pool routes — admin/cron-only.

POST /internal/sync-curated-pool — sync every creator in the curated map
                                   into shared_channels + shared_videos.
                                   Called from Vercel cron daily, or
                                   triggered manually via the /discover
                                   admin button.
"""

from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

from ..deps import get_supabase
from ..main import require_worker_secret
from ..services.youtube.shared_pool_sync import sync_full_curated_pool

router = APIRouter(prefix="/internal", tags=["shared-pool"])


class SyncPoolRequest(BaseModel):
    video_limit: int = 30


class SyncPoolResponse(BaseModel):
    creators_total: int
    creators_synced: int
    creators_errored: int


@router.post("/sync-curated-pool", response_model=SyncPoolResponse)
def post_sync_curated_pool(
    body: SyncPoolRequest = SyncPoolRequest(),
    authorization: str | None = Header(default=None),
) -> SyncPoolResponse:
    require_worker_secret(authorization)
    sb = get_supabase()
    try:
        result = sync_full_curated_pool(sb, video_limit=body.video_limit)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"sync failed: {exc}") from exc
    return SyncPoolResponse(
        creators_total=result["creators_total"],
        creators_synced=result["creators_synced"],
        creators_errored=result["creators_errored"],
    )
