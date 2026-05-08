"""Parse YouTube API responses into Supabase row shapes."""

from __future__ import annotations

import re
from datetime import datetime
from typing import Any

# ISO-8601 duration: PT#H#M#S
_DUR_RE = re.compile(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?")


def parse_iso_duration(iso: str | None) -> int | None:
    if not iso:
        return None
    m = _DUR_RE.fullmatch(iso)
    if not m:
        return None
    h, mi, s = m.groups(default="0")
    return int(h) * 3600 + int(mi) * 60 + int(s)


def parse_iso_datetime(s: str | None) -> str | None:
    if not s:
        return None
    # YouTube returns RFC3339 e.g. "2026-04-15T10:23:00Z"
    # Postgres timestamptz accepts directly
    return s


def channel_row(yt_channel: dict[str, Any]) -> dict[str, Any]:
    """Map YouTube channel record → channels table row payload (without user_id)."""
    snippet = yt_channel.get("snippet", {})
    stats = yt_channel.get("statistics", {})
    thumbs = snippet.get("thumbnails", {})
    thumb = thumbs.get("high") or thumbs.get("medium") or thumbs.get("default") or {}

    return {
        "youtube_channel_id": yt_channel["id"],
        "handle": snippet.get("customUrl"),
        "title": snippet.get("title", ""),
        "description": snippet.get("description"),
        "thumbnail_url": thumb.get("url"),
        "subscriber_count": int(stats.get("subscriberCount") or 0) or None,
        "total_video_count": int(stats.get("videoCount") or 0) or None,
    }


def video_row(yt_video: dict[str, Any]) -> dict[str, Any]:
    """Map YouTube video record → videos table row payload (without user_id, channel_id)."""
    snippet = yt_video.get("snippet", {})
    stats = yt_video.get("statistics", {})
    content = yt_video.get("contentDetails", {})
    thumbs = snippet.get("thumbnails", {})
    thumb = thumbs.get("high") or thumbs.get("medium") or thumbs.get("default") or {}

    duration_s = parse_iso_duration(content.get("duration"))
    # Provisional is_short — channel_sync overrides via HEAD probe to /shorts/<id>
    # ถ้า duration > 180s → ไม่ต้อง probe (Shorts สูงสุด 3 นาที)
    # ถ้า ≤ 180s → ตั้ง provisional False ให้ channel_sync probe override
    is_short_provisional = False

    return {
        "youtube_video_id": yt_video["id"],
        "title": snippet.get("title", ""),
        "description": snippet.get("description"),
        "published_at": parse_iso_datetime(snippet.get("publishedAt")),
        "duration_seconds": duration_s,
        "is_short": is_short_provisional,
        "view_count": int(stats.get("viewCount") or 0) or None,
        "like_count": int(stats.get("likeCount") or 0) or None,
        "comment_count": int(stats.get("commentCount") or 0) or None,
        "thumbnail_url": thumb.get("url"),
        "metrics_synced_at": datetime.utcnow().isoformat() + "Z",
    }
