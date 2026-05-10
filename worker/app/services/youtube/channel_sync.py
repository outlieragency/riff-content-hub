"""End-to-end channel sync: resolve → fetch videos → compute scores → upsert Supabase."""

from __future__ import annotations

import asyncio
from datetime import datetime
from typing import Any

from supabase import Client

from . import api
from .api import probe_shorts_batch
from .outlier_score import compute_channel_avg_views, compute_score
from .parse import channel_row, video_row

# Shorts ยาวสุดปัจจุบันประมาณ 3 นาที ถ้า duration เกินนี้ ไม่ต้อง probe (ลด sync time)
SHORT_PROBE_MAX_DURATION_S = 180
PROBE_MAX_CONCURRENT = 10


def sync_channel(
    sb: Client,
    user_id: str,
    ref_kind: str,
    ref_value: str,
    *,
    video_limit: int = 50,
    mode: str = "top_viewed",
) -> dict[str, Any]:
    """ดึง channel + วิดีโอ → upsert ลง Supabase + คำนวณ outlier score

    Args:
        mode: 'top_viewed' (default) — top videos by viewCount across full history
              'recent'                — most-recent N uploads (chronological)
              'hybrid'                — merged top + recent (deduped)

    Returns: { channel_id, channel_uuid, videos_synced, channel_avg_views, mode }

    Raises ValueError ถ้า channel ไม่เจอ
    """
    # 1. Resolve channel
    yt_channel = api.resolve_channel(ref_kind, ref_value)
    if not yt_channel:
        raise ValueError(f"channel not found: {ref_kind}={ref_value}")

    yt_channel_id = yt_channel["id"]
    ch_payload = channel_row(yt_channel)
    ch_payload["user_id"] = user_id
    ch_payload["sync_status"] = "syncing"
    ch_payload["last_synced_at"] = datetime.utcnow().isoformat() + "Z"

    # 2. Upsert channel
    res = (
        sb.table("channels")
        .upsert(ch_payload, on_conflict="user_id,youtube_channel_id")
        .execute()
    )
    channel = res.data[0]
    channel_uuid = channel["id"]

    # 3. Fetch video IDs by mode (top_viewed default — surfaces evergreen outliers)
    video_ids = api.fetch_videos_for_channel(yt_channel, limit=video_limit, mode=mode)
    if not video_ids:
        sb.table("channels").update(
            {"sync_status": "error", "sync_error": f"no videos returned ({mode})"}
        ).eq("id", channel_uuid).execute()
        return {
            "channel_uuid": channel_uuid,
            "youtube_channel_id": yt_channel_id,
            "videos_synced": 0,
            "channel_avg_views": None,
            "mode": mode,
        }

    yt_videos = api.fetch_videos_details(video_ids)

    # 4. Build video rows + insert
    video_rows = []
    for yt_v in yt_videos:
        row = video_row(yt_v)
        row["user_id"] = user_id
        row["channel_id"] = channel_uuid
        video_rows.append(row)

    # 4b. Detect YouTube Shorts via concurrent HEAD probe to /shorts/<id>
    # Only probe candidates with duration ≤ 180s (Shorts ยาวสุด ~3 นาที)
    candidates: list[str] = []
    for row in video_rows:
        dur = row.get("duration_seconds")
        if dur is None or dur > SHORT_PROBE_MAX_DURATION_S:
            row["is_short"] = False
        else:
            candidates.append(row["youtube_video_id"])

    if candidates:
        # Run async batch probe in this sync function via asyncio.run
        # (each sync_channel call gets its own loop)
        probe_results = asyncio.run(
            probe_shorts_batch(candidates, max_concurrent=PROBE_MAX_CONCURRENT)
        )
        for row in video_rows:
            vid = row["youtube_video_id"]
            if vid not in probe_results:
                continue
            probe = probe_results[vid]
            if probe is None:
                # fallback: duration < 60s heuristic
                dur = row.get("duration_seconds") or 0
                row["is_short"] = dur < 60
            else:
                row["is_short"] = probe

    if video_rows:
        sb.table("videos").upsert(video_rows, on_conflict="user_id,youtube_video_id").execute()

    # 5. Compute median channel_avg_views (secondary metric, not used for score)
    channel_avg = compute_channel_avg_views(video_rows)

    # 6. Update channel with computed avg + sync done
    sb.table("channels").update(
        {
            "channel_avg_views": channel_avg,
            "channel_avg_views_recomputed_at": datetime.utcnow().isoformat() + "Z",
            "sync_status": "idle",
            "sync_error": None,
        }
    ).eq("id", channel_uuid).execute()

    # 7. Compute + write outlier_score = views / subscriber_count
    #    fallback to channel_avg_views (median) ถ้า subs missing/0 (channel hide subs count)
    subscriber_count = ch_payload.get("subscriber_count")
    if (subscriber_count and subscriber_count > 0) or (channel_avg and channel_avg > 0):
        score_now = datetime.utcnow().isoformat() + "Z"
        for row in video_rows:
            score = compute_score(
                row.get("view_count"),
                subscriber_count,
                fallback_avg_views=channel_avg,
            )
            if score is None:
                continue
            (
                sb.table("videos")
                .update({"outlier_score": score, "outlier_score_computed_at": score_now})
                .eq("user_id", user_id)
                .eq("youtube_video_id", row["youtube_video_id"])
                .execute()
            )

    return {
        "channel_uuid": channel_uuid,
        "youtube_channel_id": yt_channel_id,
        "videos_synced": len(video_rows),
        "channel_avg_views": channel_avg,
        "mode": mode,
    }
