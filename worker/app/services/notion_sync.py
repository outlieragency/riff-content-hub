"""Push a generated FB post to the Outlier Content OS Notion structure.

Architecture:
- **Content Hub** (`NOTION_CONTENT_HUB_DSID`): the source video — title, URL, channel,
  views, followers, transcript, status. One Hub entry per video.
- **Output Tracker** (`NOTION_OUTPUT_TRACKER_DSID`): the recreated FB post — body,
  cover image, status (Draft / Published / etc), with a `Source Content` relation
  back to the Hub entry.

A single /fb-content run creates BOTH entries, linked. Earth approves the Output
Tracker entry, copies body to FB, attaches cover, then updates Status=Published
manually.
"""

from __future__ import annotations

import os
from datetime import date
from pathlib import Path
from typing import Optional

import requests
from notion_client import Client

NOTION_PARAGRAPH_LIMIT = 2000
NOTION_API_VERSION = "2025-09-03"


def _split_text(text: str, limit: int = NOTION_PARAGRAPH_LIMIT) -> list[str]:
    """Split text into chunks ≤ limit, preferring paragraph boundaries."""
    text = text.replace("\r\n", "\n")
    chunks: list[str] = []
    paragraphs = text.split("\n")
    current = ""
    for p in paragraphs:
        if len(current) + len(p) + 1 > limit:
            if current:
                chunks.append(current)
            while len(p) > limit:
                chunks.append(p[:limit])
                p = p[limit:]
            current = p
        else:
            current = f"{current}\n{p}" if current else p
    if current:
        chunks.append(current)
    return chunks


def _paragraph_block(text: str) -> dict:
    return {
        "object": "block",
        "type": "paragraph",
        "paragraph": {
            "rich_text": [{"type": "text", "text": {"content": text}}],
        },
    }


def _toggle_block(summary: str, children: list[dict]) -> dict:
    return {
        "object": "block",
        "type": "toggle",
        "toggle": {
            "rich_text": [{"type": "text", "text": {"content": summary}}],
            "children": children,
        },
    }


def _heading_block(text: str, level: int = 2) -> dict:
    h = f"heading_{level}"
    return {
        "object": "block",
        "type": h,
        h: {"rich_text": [{"type": "text", "text": {"content": text}}]},
    }


def _image_block_from_upload(upload_id: str) -> dict:
    return {
        "object": "block",
        "type": "image",
        "image": {
            "type": "file_upload",
            "file_upload": {"id": upload_id},
        },
    }


def _parse_upload_date(yyyymmdd: Optional[str]) -> Optional[str]:
    if not yyyymmdd or len(yyyymmdd) != 8:
        return None
    try:
        return f"{yyyymmdd[:4]}-{yyyymmdd[4:6]}-{yyyymmdd[6:8]}"
    except Exception:
        return None


def _truncate(text: str, limit: int = 1900) -> str:
    if len(text) <= limit:
        return text
    return text[:limit].rstrip() + "…"


def _upload_file_to_notion(path: Path, *, token: str) -> Optional[str]:
    """Upload a local file via Notion's file_uploads API. Returns the upload_id."""
    headers = {
        "Authorization": f"Bearer {token}",
        "Notion-Version": NOTION_API_VERSION,
    }
    create_resp = requests.post(
        "https://api.notion.com/v1/file_uploads",
        headers={**headers, "Content-Type": "application/json"},
        json={"mode": "single_part", "filename": path.name},
        timeout=30,
    )
    if create_resp.status_code >= 400:
        print(f"   ⚠ Notion file upload create failed: {create_resp.status_code} {create_resp.text[:200]}")
        return None
    upload_obj = create_resp.json()
    upload_id = upload_obj.get("id")
    upload_url = upload_obj.get("upload_url")
    if not upload_id or not upload_url:
        return None
    with open(path, "rb") as f:
        send_resp = requests.post(
            upload_url,
            headers=headers,
            files={"file": (path.name, f, "image/png")},
            timeout=60,
        )
    if send_resp.status_code >= 400:
        print(f"   ⚠ Notion file upload send failed: {send_resp.status_code} {send_resp.text[:200]}")
        return None
    return upload_id


def push_recreate_to_outlier_os(
    *,
    # Hub fields
    video_title: str,
    source_url: str,
    channel: str,
    view_count: Optional[int],
    subscriber_count: Optional[int],
    upload_date_yyyymmdd: Optional[str],
    transcript: str,
    hook_breakdown: Optional[str] = None,
    # Output Tracker fields
    output_title: str,
    post_body: str,
    cover_path: Optional[Path] = None,
    # Config
    content_hub_dsid: Optional[str] = None,
    output_tracker_dsid: Optional[str] = None,
    token: Optional[str] = None,
) -> tuple[str, str]:
    """Create paired entries: Content Hub (source) + Output Tracker (FB Article).

    Returns (hub_page_url, output_page_url).
    """
    token = token or os.getenv("NOTION_TOKEN")
    content_hub_dsid = content_hub_dsid or os.getenv("NOTION_CONTENT_HUB_DSID")
    output_tracker_dsid = output_tracker_dsid or os.getenv("NOTION_OUTPUT_TRACKER_DSID")
    if not token:
        raise RuntimeError("NOTION_TOKEN not set in env.")
    if not content_hub_dsid:
        raise RuntimeError("NOTION_CONTENT_HUB_DSID not set in env.")
    if not output_tracker_dsid:
        raise RuntimeError("NOTION_OUTPUT_TRACKER_DSID not set in env.")

    notion = Client(auth=token, notion_version=NOTION_API_VERSION)

    # === 1. Content Hub entry ===
    hub_props: dict = {
        "Title": {"title": [{"type": "text", "text": {"content": video_title[:200]}}]},
        "Source URL": {"url": source_url},
        "Platform": {"select": {"name": "YT"}},
        "Status": {"select": {"name": "Reviewed"}},
        "Date Scouted": {"date": {"start": date.today().isoformat()}},
    }
    if view_count is not None:
        hub_props["Views"] = {"number": view_count}
    if subscriber_count is not None:
        hub_props["Followers"] = {"number": subscriber_count}
    posted = _parse_upload_date(upload_date_yyyymmdd)
    if posted:
        hub_props["Date Posted"] = {"date": {"start": posted}}
    # Truncated transcript in property (for searchability + preview)
    if transcript:
        hub_props["Original Transcript"] = {
            "rich_text": [{"type": "text", "text": {"content": _truncate(transcript)}}],
        }
    if hook_breakdown:
        hub_props["Hook Breakdown"] = {
            "rich_text": [{"type": "text", "text": {"content": _truncate(hook_breakdown)}}],
        }

    # Hub page content: full transcript inside a toggle so it doesn't dominate
    hub_children: list[dict] = []
    if transcript:
        transcript_blocks = [_paragraph_block(c) for c in _split_text(transcript)]
        hub_children.append(_heading_block("Source", level=2))
        hub_children.append(
            _paragraph_block(f"Channel: {channel}\nVideo URL: {source_url}")
        )
        hub_children.append(_heading_block("Original Transcript", level=2))
        hub_children.append(
            _toggle_block(
                f"Full transcript ({len(transcript)} chars) — click to expand",
                transcript_blocks,
            )
        )

    hub_page = notion.pages.create(
        parent={"data_source_id": content_hub_dsid},
        properties=hub_props,
        children=hub_children,
    )
    hub_id = hub_page["id"]
    hub_url = hub_page.get("url", "")
    print(f"   ✓ Content Hub: {hub_url}")

    # === 2. Upload cover (if provided) ===
    cover_upload_id = None
    if cover_path and cover_path.exists():
        cover_upload_id = _upload_file_to_notion(cover_path, token=token)

    # === 3. Output Tracker entry, linked to Hub ===
    output_props: dict = {
        "Title": {"title": [{"type": "text", "text": {"content": output_title[:200]}}]},
        "Source Content": {"relation": [{"id": hub_id}]},
        "Format": {"select": {"name": "FB Article"}},
        "Status": {"select": {"name": "Draft"}},
    }

    output_children: list[dict] = []
    if cover_upload_id:
        output_children.append(_image_block_from_upload(cover_upload_id))
    if post_body:
        output_children.append(_heading_block("Post body", level=2))
        for chunk in _split_text(post_body):
            output_children.append(_paragraph_block(chunk))

    output_page = notion.pages.create(
        parent={"data_source_id": output_tracker_dsid},
        properties=output_props,
        children=output_children,
    )
    output_url = output_page.get("url", "")
    print(f"   ✓ Output Tracker: {output_url}")

    return hub_url, output_url
