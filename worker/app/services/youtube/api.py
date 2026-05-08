"""YouTube Data API v3 thin wrapper.

ดึง channel metadata + video list + statistics
ใช้ google-api-python-client เป็น HTTP client (พร้อม retry/quota handling)
"""

from __future__ import annotations

from typing import Any

import httpx
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from ...settings import get_settings


def _client():
    return build("youtube", "v3", developerKey=get_settings().youtube_api_key, cache_discovery=False)


def resolve_channel(ref_kind: str, ref_value: str) -> dict[str, Any] | None:
    """Resolve channel by handle / channel_id / custom name → full channel record.

    Returns dict with: id, title, description, customUrl, thumbnails, subscriber/video counts.
    None ถ้าไม่เจอ
    """
    yt = _client()

    # Path 1: direct channel_id
    if ref_kind == "channel_id":
        resp = (
            yt.channels()
            .list(part="snippet,statistics,contentDetails", id=ref_value, maxResults=1)
            .execute()
        )
        items = resp.get("items", [])
        return items[0] if items else None

    # Path 2: handle (@earthrati)
    if ref_kind == "handle":
        resp = (
            yt.channels()
            .list(part="snippet,statistics,contentDetails", forHandle=f"@{ref_value}", maxResults=1)
            .execute()
        )
        items = resp.get("items", [])
        if items:
            return items[0]

    # Path 3: custom (legacy /c/Name) → search fallback
    if ref_kind in ("custom", "handle"):
        resp = (
            yt.search()
            .list(part="snippet", q=ref_value, type="channel", maxResults=1)
            .execute()
        )
        items = resp.get("items", [])
        if not items:
            return None
        cid = items[0]["snippet"]["channelId"]
        resp = (
            yt.channels()
            .list(part="snippet,statistics,contentDetails", id=cid, maxResults=1)
            .execute()
        )
        items = resp.get("items", [])
        return items[0] if items else None

    return None


def fetch_uploads_playlist(channel: dict[str, Any]) -> str | None:
    """Channel ทุกอันมี 'uploads' playlist ที่รวม video ทุกอัน
    relatedPlaylists.uploads = playlist ID
    """
    return channel.get("contentDetails", {}).get("relatedPlaylists", {}).get("uploads")


def fetch_recent_video_ids(playlist_id: str, limit: int = 50) -> list[str]:
    """Get up to `limit` most-recent video IDs from uploads playlist.
    YouTube API max page size = 50; iterate ถ้าต้องการมากกว่า"""
    yt = _client()
    ids: list[str] = []
    page_token: str | None = None
    while len(ids) < limit:
        page_size = min(50, limit - len(ids))
        resp = (
            yt.playlistItems()
            .list(
                part="contentDetails",
                playlistId=playlist_id,
                maxResults=page_size,
                pageToken=page_token,
            )
            .execute()
        )
        for item in resp.get("items", []):
            vid = item.get("contentDetails", {}).get("videoId")
            if vid:
                ids.append(vid)
        page_token = resp.get("nextPageToken")
        if not page_token:
            break
    return ids


def fetch_top_viewed_video_ids(channel_id: str, limit: int = 50) -> list[str]:
    """Top-viewed videos from a channel via search.list (order=viewCount).

    Surfaces evergreen outliers throughout the channel's full history (vs
    fetch_recent_video_ids which is only the latest N uploads).

    Quota cost: 100 units per search.list call (vs 1 per playlistItems.list).
    """
    yt = _client()
    ids: list[str] = []
    page_token: str | None = None
    while len(ids) < limit:
        page_size = min(50, limit - len(ids))
        resp = (
            yt.search()
            .list(
                part="id",
                channelId=channel_id,
                type="video",
                order="viewCount",
                maxResults=page_size,
                pageToken=page_token,
            )
            .execute()
        )
        for item in resp.get("items", []):
            vid = (item.get("id") or {}).get("videoId")
            if vid:
                ids.append(vid)
        page_token = resp.get("nextPageToken")
        if not page_token:
            break
    return ids[:limit]


def fetch_videos_for_channel(
    yt_channel: dict[str, Any],
    *,
    limit: int = 50,
    mode: str = "top_viewed",
) -> list[str]:
    """Single entry-point that picks the right strategy.

    mode = 'top_viewed' (default) → search.list order=viewCount (outliers across history)
           'recent'                → playlistItems on uploads playlist (latest uploads)
           'hybrid'                → top_viewed + recent merged (deduped, recent up to 25)
    """
    yt_channel_id = yt_channel.get("id")
    if not yt_channel_id:
        return []

    if mode == "recent":
        playlist_id = fetch_uploads_playlist(yt_channel)
        return fetch_recent_video_ids(playlist_id, limit=limit) if playlist_id else []

    if mode == "hybrid":
        top = fetch_top_viewed_video_ids(yt_channel_id, limit=limit)
        playlist_id = fetch_uploads_playlist(yt_channel)
        recent = (
            fetch_recent_video_ids(playlist_id, limit=min(25, limit // 2))
            if playlist_id
            else []
        )
        seen: set[str] = set()
        merged: list[str] = []
        for vid in top + recent:
            if vid not in seen:
                seen.add(vid)
                merged.append(vid)
        return merged

    # default: top_viewed
    return fetch_top_viewed_video_ids(yt_channel_id, limit=limit)


def fetch_videos_details(video_ids: list[str]) -> list[dict[str, Any]]:
    """Batch fetch video metadata + statistics + duration.
    YouTube API max ids per request = 50"""
    yt = _client()
    out: list[dict[str, Any]] = []
    for i in range(0, len(video_ids), 50):
        chunk = video_ids[i : i + 50]
        resp = (
            yt.videos()
            .list(part="snippet,contentDetails,statistics", id=",".join(chunk), maxResults=50)
            .execute()
        )
        out.extend(resp.get("items", []))
    return out


def is_youtube_short(video_id: str, *, timeout: float = 5.0) -> bool | None:
    """Detect ว่า video เป็น YouTube Short จริงไหม โดย probe URL `/shorts/<id>`.

    YouTube Data API ไม่ expose flag นี้ → de-facto standard:
      HEAD https://www.youtube.com/shorts/<id> ถ้า:
        - 200 OK              → Short จริง (page render ตรง)
        - 303 / 302 redirect  → ไม่ใช่ Short (redirect ไป /watch?v=...)

    Returns True/False; None ถ้า request fail (caller ตัดสินใจเอง — fallback duration heuristic ก็ได้)
    """
    if not video_id:
        return None
    url = f"https://www.youtube.com/shorts/{video_id}"
    try:
        resp = httpx.head(url, follow_redirects=False, timeout=timeout)
    except (httpx.HTTPError, OSError):
        return None
    if resp.status_code == 200:
        return True
    if resp.status_code in (301, 302, 303, 307, 308):
        loc = resp.headers.get("location", "")
        return "/shorts/" in loc
    return None


async def is_youtube_short_async(
    client: httpx.AsyncClient, video_id: str, *, timeout: float = 5.0
) -> bool | None:
    """Async version for batch concurrent probing."""
    if not video_id:
        return None
    url = f"https://www.youtube.com/shorts/{video_id}"
    try:
        resp = await client.head(url, follow_redirects=False, timeout=timeout)
    except (httpx.HTTPError, OSError):
        return None
    if resp.status_code == 200:
        return True
    if resp.status_code in (301, 302, 303, 307, 308):
        loc = resp.headers.get("location", "")
        return "/shorts/" in loc
    return None


async def probe_shorts_batch(
    video_ids: list[str],
    *,
    max_concurrent: int = 10,
    timeout: float = 5.0,
) -> dict[str, bool | None]:
    """Probe many video IDs concurrently. Returns map id → True/False/None.

    50 videos sequential ~85s; concurrent (10x) ~10s.
    """
    import asyncio

    if not video_ids:
        return {}

    sem = asyncio.Semaphore(max_concurrent)
    async with httpx.AsyncClient() as client:
        async def _one(vid: str) -> tuple[str, bool | None]:
            async with sem:
                result = await is_youtube_short_async(client, vid, timeout=timeout)
                return vid, result

        tasks = [_one(vid) for vid in video_ids]
        results = await asyncio.gather(*tasks)
        return dict(results)


__all__ = [
    "HttpError",
    "fetch_recent_video_ids",
    "fetch_top_viewed_video_ids",
    "fetch_uploads_playlist",
    "fetch_videos_for_channel",
    "fetch_videos_details",
    "is_youtube_short",
    "is_youtube_short_async",
    "probe_shorts_batch",
    "resolve_channel",
]
