"""Quick Recreate from URL — 1-click flow for users with single video.

Bypasses the channel-sync flow (which fetches 50 videos). Takes a YouTube URL,
upserts just THAT video + its channel into the DB, creates an idea, enqueues
process_transcript. User then clicks "Recreate" on the idea page.

Reduces friction: 5 steps (add channel → wait sync → outliers → save idea →
recreate) → 2 clicks (paste URL → recreate).
"""

from __future__ import annotations

import re

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

from ..deps import get_supabase
from ..main import require_worker_secret
from ..services.youtube.api import fetch_videos_details, resolve_channel
from ..services.youtube.parse import channel_row, video_row
from ..workers.jobs_runner import RateLimitError, enqueue_job

router = APIRouter(prefix="/ideas", tags=["ideas"])


_VIDEO_ID_RE = re.compile(
    r"(?:v=|youtu\.be/|/embed/|/shorts/)([A-Za-z0-9_-]{11})"
)


def _extract_video_id(url_or_id: str) -> str | None:
    s = url_or_id.strip()
    if len(s) == 11 and re.match(r"^[A-Za-z0-9_-]{11}$", s):
        return s
    m = _VIDEO_ID_RE.search(s)
    return m.group(1) if m else None


class QuickInitRequest(BaseModel):
    user_id: str
    url: str
    auto_recreate_format: str | None = "fb_article"
    """If set (default 'fb_article'), worker auto-chains run_recreate after
    transcript is ready. Pass null to skip the auto-chain."""


class QuickInitResponse(BaseModel):
    idea_id: str
    video_id: str
    channel_id: str
    transcript_job_id: str
    deduplicated: bool


@router.post("/quick-init", response_model=QuickInitResponse)
def post_quick_init(
    body: QuickInitRequest,
    authorization: str | None = Header(default=None),
) -> QuickInitResponse:
    """Resolve URL → upsert channel + video + idea → enqueue transcript job."""
    require_worker_secret(authorization)

    yt_video_id = _extract_video_id(body.url)
    if not yt_video_id:
        raise HTTPException(status_code=400, detail="parse YouTube URL failed")

    sb = get_supabase()

    # 1. Fetch video metadata via YouTube API
    items = fetch_videos_details([yt_video_id])
    if not items:
        raise HTTPException(status_code=404, detail="video not found on YouTube")
    yt_video = items[0]
    yt_channel_id = (yt_video.get("snippet") or {}).get("channelId")
    if not yt_channel_id:
        raise HTTPException(status_code=502, detail="missing channelId in YouTube response")

    # 2. Resolve channel metadata
    yt_channel = resolve_channel("channel_id", yt_channel_id)
    if not yt_channel:
        raise HTTPException(status_code=502, detail="channel not found on YouTube")

    # 3. Upsert channel row
    ch_payload = {**channel_row(yt_channel), "user_id": body.user_id}
    upsert_ch = (
        sb.table("channels")
        .upsert(ch_payload, on_conflict="user_id,youtube_channel_id")
        .execute()
    )
    channel_uuid = (upsert_ch.data or [{}])[0].get("id")
    if not channel_uuid:
        # Re-fetch since some Supabase clients don't return upsert payload
        sel = (
            sb.table("channels")
            .select("id")
            .eq("user_id", body.user_id)
            .eq("youtube_channel_id", ch_payload["youtube_channel_id"])
            .limit(1)
            .execute()
        )
        channel_uuid = (sel.data or [{}])[0].get("id")
    if not channel_uuid:
        raise HTTPException(status_code=500, detail="channel upsert failed")

    # 4. Upsert video row
    vid_payload = {
        **video_row(yt_video),
        "user_id": body.user_id,
        "channel_id": channel_uuid,
    }
    upsert_vid = (
        sb.table("videos")
        .upsert(vid_payload, on_conflict="user_id,youtube_video_id")
        .execute()
    )
    video_uuid = (upsert_vid.data or [{}])[0].get("id")
    if not video_uuid:
        sel = (
            sb.table("videos")
            .select("id")
            .eq("user_id", body.user_id)
            .eq("youtube_video_id", yt_video_id)
            .limit(1)
            .execute()
        )
        video_uuid = (sel.data or [{}])[0].get("id")
    if not video_uuid:
        raise HTTPException(status_code=500, detail="video upsert failed")

    # 5. Create idea (or reuse existing for this video)
    existing_idea = (
        sb.table("ideas")
        .select("id")
        .eq("user_id", body.user_id)
        .eq("video_id", video_uuid)
        .limit(1)
        .execute()
    )
    if existing_idea.data:
        idea_id = existing_idea.data[0]["id"]
    else:
        idea_insert = (
            sb.table("ideas")
            .insert(
                {
                    "user_id": body.user_id,
                    "video_id": video_uuid,
                    "title": vid_payload.get("title") or "Untitled",
                    "source_url": f"https://www.youtube.com/watch?v={yt_video_id}",
                    "thumbnail_url": vid_payload.get("thumbnail_url"),
                    "status": "in_progress",
                }
            )
            .execute()
        )
        idea_id = (idea_insert.data or [{}])[0].get("id")
        if not idea_id:
            raise HTTPException(status_code=500, detail="idea insert failed")

    # 6. Enqueue process_transcript job (with auto_recreate chain hint if requested)
    payload: dict = {"video_id": video_uuid}
    if body.auto_recreate_format:
        payload["auto_recreate"] = {"format": body.auto_recreate_format}

    try:
        job = enqueue_job(
            sb,
            user_id=body.user_id,
            kind="process_transcript",
            payload=payload,
            resource_kind="video",
            resource_id=video_uuid,
        )
    except RateLimitError as exc:
        raise HTTPException(
            status_code=429,
            detail=f"rate limit: {exc.kind} เกิน {exc.limit}/{exc.window_s}s",
        ) from exc

    deduped = job.get("status", "queued") != "queued"
    return QuickInitResponse(
        idea_id=idea_id,
        video_id=video_uuid,
        channel_id=channel_uuid,
        transcript_job_id=job["id"],
        deduplicated=deduped,
    )
