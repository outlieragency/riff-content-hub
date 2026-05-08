"""Channel sync HTTP routes (called by portal)."""

from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException
from googleapiclient.errors import HttpError
from pydantic import BaseModel, Field

from ..deps import get_supabase
from ..main import require_worker_secret
from ..services.youtube.channel_sync import sync_channel

router = APIRouter(prefix="/scrape", tags=["channels"])


class ChannelRefKind(str):
    HANDLE = "handle"
    CHANNEL_ID = "channel_id"
    CUSTOM = "custom"


class SyncChannelRequest(BaseModel):
    user_id: str = Field(..., description="auth.users.id ของผู้สั่งซิงค์")
    ref_kind: str = Field(..., description="handle | channel_id | custom")
    ref_value: str
    video_limit: int = 50
    mode: str = Field(
        "top_viewed",
        description="top_viewed | recent | hybrid (default top_viewed surfaces evergreen outliers)",
    )


class SyncChannelResponse(BaseModel):
    channel_uuid: str
    youtube_channel_id: str
    videos_synced: int
    channel_avg_views: float | None
    mode: str | None = None


@router.post("/channel", response_model=SyncChannelResponse)
def post_sync_channel(
    body: SyncChannelRequest,
    authorization: str | None = Header(default=None),
) -> SyncChannelResponse:
    require_worker_secret(authorization)

    if body.mode not in {"top_viewed", "recent", "hybrid"}:
        raise HTTPException(
            status_code=400,
            detail="mode must be one of: top_viewed, recent, hybrid",
        )

    sb = get_supabase()
    try:
        out = sync_channel(
            sb,
            user_id=body.user_id,
            ref_kind=body.ref_kind,
            ref_value=body.ref_value,
            video_limit=body.video_limit,
            mode=body.mode,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except HttpError as exc:
        # YouTube API quota / permission errors
        exc.resp.status if hasattr(exc, "resp") else 502
        raise HTTPException(status_code=502, detail=f"youtube api error: {exc}") from exc

    return SyncChannelResponse(**out)
