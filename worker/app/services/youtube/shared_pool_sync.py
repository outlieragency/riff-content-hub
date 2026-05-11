"""Sync the curated creator pool → shared_channels + shared_videos.

Mirrors `channel_sync.sync_channel` but writes user-less rows. Run from
a cron route or admin trigger — these rows surface on every user's
/discover so the feed isn't limited to channels they personally track.
"""

from __future__ import annotations

import asyncio
from datetime import datetime
from typing import Any

from supabase import Client

from . import api
from .api import probe_shorts_batch
from .outlier_score import compute_channel_avg_views, compute_score
from .parse import channel_row, video_row

SHORT_PROBE_MAX_DURATION_S = 180
PROBE_MAX_CONCURRENT = 10


def sync_curated_channel(
    sb: Client,
    *,
    handle: str,
    niches: list[str],
    video_limit: int = 30,
) -> dict[str, Any]:
    """Sync a single curated creator (by @handle) into the shared pool.

    `niches` overrides any prior tagging on the row — the curated map
    in `portal/src/lib/niche-creators.ts` is the source of truth for
    which niches a creator belongs to.
    """
    yt_channel = api.resolve_channel("handle", handle)
    if not yt_channel:
        raise ValueError(f"curated channel not found: @{handle}")

    yt_channel_id = yt_channel["id"]
    ch_payload = channel_row(yt_channel)
    # shared_channels has no user_id; the channel_row helper doesn't add one
    ch_payload["niches"] = niches
    ch_payload["sync_status"] = "syncing"
    ch_payload["last_synced_at"] = datetime.utcnow().isoformat() + "Z"

    res = (
        sb.table("shared_channels")
        .upsert(ch_payload, on_conflict="youtube_channel_id")
        .execute()
    )
    channel = res.data[0]
    channel_uuid = channel["id"]

    video_ids = api.fetch_videos_for_channel(yt_channel, limit=video_limit, mode="top_viewed")
    if not video_ids:
        sb.table("shared_channels").update(
            {"sync_status": "error", "sync_error": "no videos returned"}
        ).eq("id", channel_uuid).execute()
        return {
            "channel_uuid": channel_uuid,
            "youtube_channel_id": yt_channel_id,
            "videos_synced": 0,
            "niches": niches,
        }

    yt_videos = api.fetch_videos_details(video_ids)

    video_rows: list[dict[str, Any]] = []
    for yt_v in yt_videos:
        row = video_row(yt_v)
        # shared_videos uses shared_channel_id (not channel_id) and has no user_id
        row.pop("user_id", None)
        row["shared_channel_id"] = channel_uuid
        video_rows.append(row)

    # Shorts probe (same heuristic as user sync)
    candidates: list[str] = []
    for row in video_rows:
        dur = row.get("duration_seconds")
        if dur is None or dur > SHORT_PROBE_MAX_DURATION_S:
            row["is_short"] = False
        else:
            candidates.append(row["youtube_video_id"])
    if candidates:
        probe_results = asyncio.run(
            probe_shorts_batch(candidates, max_concurrent=PROBE_MAX_CONCURRENT)
        )
        for row in video_rows:
            vid = row["youtube_video_id"]
            if vid not in probe_results:
                continue
            probe = probe_results[vid]
            row["is_short"] = (
                probe if probe is not None else (row.get("duration_seconds") or 0) < 60
            )

    if video_rows:
        sb.table("shared_videos").upsert(
            video_rows, on_conflict="shared_channel_id,youtube_video_id"
        ).execute()

    channel_avg = compute_channel_avg_views(video_rows)
    sb.table("shared_channels").update(
        {
            "channel_avg_views": channel_avg,
            "channel_avg_views_recomputed_at": datetime.utcnow().isoformat() + "Z",
            "sync_status": "idle",
            "sync_error": None,
        }
    ).eq("id", channel_uuid).execute()

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
                sb.table("shared_videos")
                .update(
                    {"outlier_score": score, "outlier_score_computed_at": score_now}
                )
                .eq("shared_channel_id", channel_uuid)
                .eq("youtube_video_id", row["youtube_video_id"])
                .execute()
            )

    return {
        "channel_uuid": channel_uuid,
        "youtube_channel_id": yt_channel_id,
        "videos_synced": len(video_rows),
        "niches": niches,
    }


# The curated map mirrors portal/src/lib/niche-creators.ts. Keep in sync —
# both files are append-only.
CURATED_BY_NICHE: dict[str, list[str]] = {
    "solopreneur": ["hormozi", "thedankoe", "thejustinwelsh", "codiesanchez", "gregisenberg"],
    "ai-tech": ["mreflow", "aisearchio", "wesroth", "mattvidpro", "theaigrid"],
    "marketing": ["imangadzhi", "hormozi", "andrewkirby", "thedankoe", "jaymezzy"],
    "digital-product": ["noahkagan", "thejustinwelsh", "roblennon", "aliabdaal"],
    "self-dev": ["thedankoe", "aliabdaal", "chriswillx", "hubermanlab"],
    "productivity": ["aliabdaal", "thomasfrank", "tiagoforte", "augustbradley"],
    "business": ["hormozi", "codiesanchez", "gregisenberg", "mybenshapiro"],
    "creator-economy": ["gregisenberg", "colinandsamir", "thedankoe", "thejustinwelsh"],
    "finance": ["grahamstephan", "humphreytalks", "andreijikh", "thoughtsmoney"],
    "coaching": ["hormozi", "codiesanchez", "mybenshapiro", "sambailey"],
}


def sync_full_curated_pool(sb: Client, video_limit: int = 30) -> dict[str, Any]:
    """Iterate the full curated map. Each creator is synced once; their
    niches[] is the union of all niches they're listed under."""
    by_creator: dict[str, list[str]] = {}
    for niche, handles in CURATED_BY_NICHE.items():
        for h in handles:
            by_creator.setdefault(h, []).append(niche)

    synced: list[dict[str, Any]] = []
    errors: list[dict[str, Any]] = []

    for handle, niches in by_creator.items():
        try:
            result = sync_curated_channel(
                sb, handle=handle, niches=niches, video_limit=video_limit
            )
            synced.append({"handle": handle, **result})
        except Exception as exc:  # noqa: BLE001
            errors.append({"handle": handle, "error": str(exc)})

    return {
        "creators_total": len(by_creator),
        "creators_synced": len(synced),
        "creators_errored": len(errors),
        "synced": synced,
        "errors": errors,
    }
