"""Channel sync HTTP routes (called by portal)."""

from __future__ import annotations

import re

from fastapi import APIRouter, Header, HTTPException
from googleapiclient.errors import HttpError
from pydantic import BaseModel, Field

from ..deps import get_supabase
from ..main import require_worker_secret
from ..services.youtube.api import resolve_channel
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


# =====================================================================
# /channels/preview — resolve channel metadata only (no DB write, no video fetch)
# Used in onboarding to show "is this your channel?" confirmation card
# =====================================================================

class ChannelPreviewRequest(BaseModel):
    url: str = Field(..., description="YouTube channel URL or handle")


class ChannelPreviewResponse(BaseModel):
    youtube_channel_id: str
    handle: str | None
    title: str
    description: str | None
    thumbnail_url: str | None
    subscriber_count: int | None
    total_video_count: int | None


_HANDLE_RE = re.compile(r"youtube\.com/@([A-Za-z0-9_.-]+)")
_CHANNEL_RE = re.compile(r"youtube\.com/channel/(UC[A-Za-z0-9_-]{22})")
_CUSTOM_RE = re.compile(r"youtube\.com/c/([A-Za-z0-9_.-]+)")


def _parse_channel_url(url: str) -> tuple[str, str] | None:
    s = url.strip()
    # Bare @handle
    if s.startswith("@"):
        return ("handle", s[1:])
    m = _HANDLE_RE.search(s)
    if m:
        return ("handle", m.group(1))
    m = _CHANNEL_RE.search(s)
    if m:
        return ("channel_id", m.group(1))
    m = _CUSTOM_RE.search(s)
    if m:
        return ("custom", m.group(1))
    return None


class ChannelSearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=80)
    max_results: int = Field(8, ge=1, le=15)


class ChannelSearchHit(BaseModel):
    youtube_channel_id: str
    handle: str | None
    title: str
    thumbnail_url: str | None
    subscriber_count: int | None


class ChannelSearchResponse(BaseModel):
    hits: list[ChannelSearchHit]


@router.post("/channel/search", response_model=ChannelSearchResponse)
def post_channel_search(
    body: ChannelSearchRequest,
    authorization: str | None = Header(default=None),
) -> ChannelSearchResponse:
    """Search YouTube for channels matching a handle/name query.

    Used in onboarding for Eden-style search-as-you-type dropdown.
    Quota: 100 units per call (search.list) + 1 per channel detail
    Strategy: lean on search.list which already returns thumb + title.
    Caller can hit /preview later for sub_count if needed.
    """
    require_worker_secret(authorization)

    from ..services.youtube.api import _client

    yt = _client()
    q = body.query.strip().lstrip("@")

    try:
        # Search for channels by name/handle
        search_resp = (
            yt.search()
            .list(
                part="snippet",
                q=q,
                type="channel",
                maxResults=body.max_results,
            )
            .execute()
        )
    except HttpError as exc:
        raise HTTPException(status_code=502, detail=f"youtube api error: {exc}") from exc

    items = search_resp.get("items", [])
    if not items:
        return ChannelSearchResponse(hits=[])

    # Hydrate sub_count via channels.list batch (1 quota unit)
    channel_ids = [
        it.get("snippet", {}).get("channelId") or it.get("id", {}).get("channelId")
        for it in items
    ]
    channel_ids = [cid for cid in channel_ids if cid]

    sub_counts: dict[str, int] = {}
    handles: dict[str, str | None] = {}
    if channel_ids:
        try:
            ch_resp = (
                yt.channels()
                .list(part="snippet,statistics", id=",".join(channel_ids), maxResults=50)
                .execute()
            )
            for ch in ch_resp.get("items", []):
                cid = ch.get("id")
                if not cid:
                    continue
                stats = ch.get("statistics", {}) or {}
                sub_counts[cid] = (
                    int(stats["subscriberCount"]) if stats.get("subscriberCount") else 0
                )
                snip = ch.get("snippet", {}) or {}
                custom = snip.get("customUrl")
                if custom and custom.startswith("@"):
                    custom = custom[1:]
                handles[cid] = custom or None
        except HttpError:
            # Best-effort — continue without sub counts if details fail
            pass

    hits: list[ChannelSearchHit] = []
    for it in items:
        snip = it.get("snippet", {}) or {}
        cid = snip.get("channelId") or it.get("id", {}).get("channelId")
        if not cid:
            continue
        thumbs = snip.get("thumbnails", {}) or {}
        thumb_url = (
            (thumbs.get("high") or {}).get("url")
            or (thumbs.get("medium") or {}).get("url")
            or (thumbs.get("default") or {}).get("url")
        )
        hits.append(
            ChannelSearchHit(
                youtube_channel_id=cid,
                handle=handles.get(cid),
                title=snip.get("channelTitle") or snip.get("title") or "Unknown",
                thumbnail_url=thumb_url,
                subscriber_count=sub_counts.get(cid),
            )
        )

    return ChannelSearchResponse(hits=hits)


@router.post("/channel/preview", response_model=ChannelPreviewResponse)
def post_channel_preview(
    body: ChannelPreviewRequest,
    authorization: str | None = Header(default=None),
) -> ChannelPreviewResponse:
    """Resolve YouTube channel metadata for onboarding confirmation card.

    No DB write, no video fetch — just one YouTube API call to verify the
    URL parses + channel exists.
    """
    require_worker_secret(authorization)

    parsed = _parse_channel_url(body.url)
    if not parsed:
        raise HTTPException(
            status_code=400,
            detail="วิเคราะห์ URL ไม่ได้ ลองวาง youtube.com/@handle หรือ /channel/UC...",
        )

    ref_kind, ref_value = parsed
    try:
        ch = resolve_channel(ref_kind, ref_value)
    except HttpError as exc:
        raise HTTPException(status_code=502, detail=f"youtube api error: {exc}") from exc

    if not ch:
        raise HTTPException(status_code=404, detail="ไม่พบ channel นี้บน YouTube")

    snippet = ch.get("snippet", {}) or {}
    stats = ch.get("statistics", {}) or {}
    thumbs = snippet.get("thumbnails", {}) or {}

    # Pick best thumb available
    thumb_url = (
        (thumbs.get("high") or {}).get("url")
        or (thumbs.get("medium") or {}).get("url")
        or (thumbs.get("default") or {}).get("url")
    )

    handle = snippet.get("customUrl")
    if handle and handle.startswith("@"):
        handle = handle[1:]

    return ChannelPreviewResponse(
        youtube_channel_id=ch.get("id", ""),
        handle=handle,
        title=snippet.get("title", "Unknown"),
        description=(snippet.get("description") or None),
        thumbnail_url=thumb_url,
        subscriber_count=int(stats["subscriberCount"]) if stats.get("subscriberCount") else None,
        total_video_count=int(stats["videoCount"]) if stats.get("videoCount") else None,
    )
