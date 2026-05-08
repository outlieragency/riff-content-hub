"""Notion sync route — push a draft to Outlier Content OS.

POST /notion/push   {user_id, draft_id}
  → fetches draft + video + transcript
  → downloads cover.png from Supabase Storage
  → creates paired Hub + Output Tracker entries
  → updates draft.output with notion_hub_url + notion_output_url
"""

from __future__ import annotations

import tempfile
from pathlib import Path

import requests
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

from ..deps import get_supabase
from ..main import require_worker_secret
from ..services.notion_sync import push_recreate_to_outlier_os
from ..settings import get_settings

router = APIRouter(prefix="/notion", tags=["notion"])


class NotionPushRequest(BaseModel):
    user_id: str
    draft_id: str


class NotionPushResponse(BaseModel):
    notion_hub_url: str
    notion_output_url: str


def _get_notion_config() -> tuple[str, str, str]:
    s = get_settings()
    missing = []
    if not s.notion_token:
        missing.append("NOTION_TOKEN")
    if not s.notion_content_hub_dsid:
        missing.append("NOTION_CONTENT_HUB_DSID")
    if not s.notion_output_tracker_dsid:
        missing.append("NOTION_OUTPUT_TRACKER_DSID")
    if missing:
        raise HTTPException(
            status_code=422,
            detail=f"Notion config incomplete (missing {', '.join(missing)} in worker env)",
        )
    assert s.notion_token and s.notion_content_hub_dsid and s.notion_output_tracker_dsid
    return s.notion_token, s.notion_content_hub_dsid, s.notion_output_tracker_dsid


@router.post("/push", response_model=NotionPushResponse)
def post_push(
    body: NotionPushRequest,
    authorization: str | None = Header(default=None),
) -> NotionPushResponse:
    require_worker_secret(authorization)
    notion_token, hub_dsid, out_dsid = _get_notion_config()

    sb = get_supabase()

    # 1. Load draft
    draft_res = (
        sb.table("recreated_drafts")
        .select("id, idea_id, title, output, output_markdown")
        .eq("id", body.draft_id)
        .eq("user_id", body.user_id)
        .limit(1)
        .execute()
    )
    if not draft_res.data:
        raise HTTPException(status_code=404, detail="draft not found")
    draft = draft_res.data[0]
    output = draft.get("output") or {}
    post_body = draft.get("output_markdown") or output.get("post_body") or ""
    if not post_body:
        raise HTTPException(status_code=422, detail="draft has empty post_body")

    # 2. Load idea → video → channel + transcript
    idea_res = (
        sb.table("ideas")
        .select("id, video_id, title, source_url")
        .eq("id", draft["idea_id"])
        .eq("user_id", body.user_id)
        .limit(1)
        .execute()
    )
    idea = (idea_res.data or [{}])[0]
    video_id = idea.get("video_id")

    video_title = idea.get("title") or draft.get("title") or "Untitled"
    source_url = idea.get("source_url") or ""
    channel_name = ""
    view_count: int | None = None
    subscriber_count: int | None = None
    upload_date_yyyymmdd: str | None = None
    transcript_text = ""

    if video_id:
        vid_res = (
            sb.table("videos")
            .select("title, view_count, published_at, channel_id")
            .eq("id", video_id)
            .eq("user_id", body.user_id)
            .limit(1)
            .execute()
        )
        vid = (vid_res.data or [{}])[0]
        if vid.get("title"):
            video_title = vid["title"]
        view_count = vid.get("view_count")
        if vid.get("published_at"):
            ts = vid["published_at"][:10].replace("-", "")  # YYYYMMDD
            upload_date_yyyymmdd = ts
        ch_id = vid.get("channel_id")
        if ch_id:
            ch_res = (
                sb.table("channels")
                .select("title, subscriber_count")
                .eq("id", ch_id)
                .eq("user_id", body.user_id)
                .limit(1)
                .execute()
            )
            ch = (ch_res.data or [{}])[0]
            channel_name = ch.get("title") or ""
            subscriber_count = ch.get("subscriber_count")

        # transcript
        tr_res = (
            sb.table("transcripts")
            .select("plain_text, translated_text")
            .eq("user_id", body.user_id)
            .eq("video_id", video_id)
            .limit(1)
            .execute()
        )
        tr = (tr_res.data or [{}])[0]
        transcript_text = tr.get("translated_text") or tr.get("plain_text") or ""

    # 3. Download cover.png from Storage to a temp file (notion_sync expects Path)
    cover_url = output.get("cover_url")
    cover_path: Path | None = None
    tmp_file = None
    if cover_url:
        try:
            r = requests.get(cover_url, timeout=20)
            r.raise_for_status()
            tmp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".png")
            tmp_file.write(r.content)
            tmp_file.flush()
            tmp_file.close()
            cover_path = Path(tmp_file.name)
        except Exception:
            cover_path = None  # proceed without cover image

    try:
        hub_url, out_url = push_recreate_to_outlier_os(
            video_title=video_title,
            source_url=source_url,
            channel=channel_name,
            view_count=view_count,
            subscriber_count=subscriber_count,
            upload_date_yyyymmdd=upload_date_yyyymmdd,
            transcript=transcript_text,
            hook_breakdown=(output.get("cover") or {}).get("hook_framework"),
            output_title=draft.get("title") or video_title,
            post_body=post_body,
            cover_path=cover_path,
            content_hub_dsid=hub_dsid,
            output_tracker_dsid=out_dsid,
            token=notion_token,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e)) from e
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"notion error: {e}") from e
    finally:
        if cover_path and cover_path.exists():
            try:
                cover_path.unlink()
            except OSError:
                pass

    # 4. Persist URLs into draft.output
    new_output = {**output, "notion_hub_url": hub_url, "notion_output_url": out_url}
    sb.table("recreated_drafts").update({"output": new_output}).eq(
        "id", body.draft_id
    ).eq("user_id", body.user_id).execute()

    return NotionPushResponse(notion_hub_url=hub_url, notion_output_url=out_url)
