"""Common pipeline ที่ทุก recreate format share.

หน้าที่:
- Resolve voice_profile + summary จาก DB ผ่าน supabase service-role
- Build cache blocks (system + user) ตาม 5-block structure
- Call Claude → return raw text + meta
- ปล่อยให้แต่ละ format handler ทำ JSON parsing/validation เอง
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from typing import Any

from supabase import Client

from ....settings import get_settings
from ..caching import (
    cached_text_block,
    load_prompt,
    plain_text_block,
    render_voice_profile,
)
from ..client import CallMeta, call_messages, extract_text


@dataclass
class RecreateContext:
    user_id: str
    idea_id: str
    voice_profile_id: str | None
    voice_profile: dict[str, Any]
    summary: dict[str, Any]
    video: dict[str, Any] | None  # title, channel, etc.
    transcripts_id: str
    instruction_extra: str | None = None  # extra ตามที่ user request


def load_recreate_context(
    sb: Client,
    *,
    user_id: str,
    idea_id: str,
    voice_profile_id: str | None,
) -> RecreateContext:
    """Load all data needed for recreate from DB.

    Raises ValueError ถ้า idea ไม่มี summary, no video link, etc.
    """
    # 1. Idea + video
    idea_res = (
        sb.table("ideas")
        .select("id, video_id, title")
        .eq("id", idea_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    idea = idea_res.data[0] if idea_res.data else None
    if not idea:
        raise ValueError("idea not found")
    if not idea.get("video_id"):
        raise ValueError("idea ยังไม่ได้ link กับ video")

    video_id = idea["video_id"]

    # 2. Transcript + summary
    tr_res = (
        sb.table("transcripts")
        .select("id, summary, language")
        .eq("user_id", user_id)
        .eq("video_id", video_id)
        .limit(1)
        .execute()
    )
    tr = tr_res.data[0] if tr_res.data else None
    if not tr or not tr.get("summary"):
        raise ValueError("ยังไม่ได้สรุป transcript ของ video นี้ — กดปุ่ม 'ดึง + แปล + สรุป' ใน Idea ก่อน")

    # 3. Video details (optional, for context)
    video_res = (
        sb.table("videos")
        .select("title, view_count, duration_seconds")
        .eq("id", video_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    video = video_res.data[0] if video_res.data else None

    # 4. Voice profile
    if voice_profile_id:
        vp_res = (
            sb.table("voice_profiles")
            .select("id, voice_profile")
            .eq("id", voice_profile_id)
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )
        vp = vp_res.data[0] if vp_res.data else None
    else:
        # Prefer active profile; fallback to oldest if none active
        active_res = (
            sb.table("voice_profiles")
            .select("id, voice_profile")
            .eq("user_id", user_id)
            .eq("is_active", True)
            .limit(1)
            .execute()
        )
        vp = active_res.data[0] if active_res.data else None
        if not vp:
            fallback_res = (
                sb.table("voice_profiles")
                .select("id, voice_profile")
                .eq("user_id", user_id)
                .order("created_at", desc=False)
                .limit(1)
                .execute()
            )
            vp = fallback_res.data[0] if fallback_res.data else None

    if not vp:
        raise ValueError("ยังไม่มี voice profile — สร้างก่อนใน /voice")

    return RecreateContext(
        user_id=user_id,
        idea_id=idea_id,
        voice_profile_id=vp["id"],
        voice_profile=vp.get("voice_profile") or {},
        summary=tr["summary"],
        video=video,
        transcripts_id=tr["id"],
    )


@dataclass
class RecreateCallResult:
    raw_text: str
    meta: CallMeta


def call_recreate(
    *,
    ctx: RecreateContext,
    format_prompt_filename: str,
    max_tokens: int = 4000,
    temperature: float = 0.7,
) -> RecreateCallResult:
    """Cached call ที่ทุก format ใน idea เดียวกัน share cache.

    Block layout:
      system[0]: voice_wrapper(global rules + voice profile)   cached, share ทุก format
      user[0]:   summary JSON                                  cached, share ทุก format ของ idea เดียวกัน
      user[1]:   format prompt + task instruction              uncached (เปลี่ยนตาม format)

    เหตุที่ format prompt อยู่ user (uncached): ทำให้ block ก่อนหน้า (voice + summary)
    คงตำแหน่งและเนื้อหาเดิมเมื่อสลับ format → cache hit ratio เกือบ 100% ตั้งแต่ format ที่ 2
    Format prompt ~1k tokens fresh input cost ~$0.003 ยังถูกกว่า re-cache voice+summary
    """
    settings = get_settings()

    # System: voice + global rules (cached, shared across formats)
    voice_block = render_voice_profile(ctx.voice_profile)
    system_blocks: list[dict[str, Any]] = [cached_text_block(voice_block)]

    # User block 1: summary JSON (cached, shared across formats of same idea)
    summary_payload = {
        "summary": ctx.summary,
        "source_video": ctx.video or {},
    }
    summary_text = json.dumps(summary_payload, ensure_ascii=False, indent=2)

    # User block 2: format-specific prompt + task (uncached — varies per format)
    format_prompt = load_prompt(format_prompt_filename)
    task_lines = [
        format_prompt.strip(),
        "",
        "---",
        "Recreate now. Output the JSON for this format. JSON only, no markdown, no commentary.",
    ]
    if ctx.instruction_extra:
        task_lines.append("")
        task_lines.append(f"Extra instruction from user: {ctx.instruction_extra.strip()}")
    task_text = "\n".join(task_lines)

    msg, meta = call_messages(
        model=settings.sonnet_model,
        system=system_blocks,
        messages=[
            {
                "role": "user",
                "content": [
                    cached_text_block(summary_text),
                    plain_text_block(task_text),
                ],
            }
        ],
        max_tokens=max_tokens,
        temperature=temperature,
    )

    return RecreateCallResult(raw_text=extract_text(msg).strip(), meta=meta)


def parse_json_strict(raw: str) -> Any:
    """Parse JSON; strip markdown fence ถ้ามี."""
    text = raw.strip()
    fence = re.match(r"^```(?:json)?\s*\n(.*?)\n```\s*$", text, flags=re.DOTALL)
    if fence:
        text = fence.group(1).strip()
    return json.loads(text)


# === draft persistence ===


def insert_draft(
    sb: Client,
    *,
    ctx: RecreateContext,
    format_id: str,
    output: dict[str, Any],
    output_markdown: str | None,
    title: str | None,
    meta: CallMeta,
    error: str | None = None,
) -> str:
    """Persist recreated_drafts row. Return new id."""
    payload = {
        "user_id": ctx.user_id,
        "idea_id": ctx.idea_id,
        "voice_profile_id": ctx.voice_profile_id,
        "format": format_id,
        "status": "ready" if not error else "error",
        "input_summary": ctx.summary,
        "output": output,
        "output_markdown": output_markdown,
        "title": title,
        "generation_meta": meta.to_jsonable(),
        "error": error,
    }
    res = sb.table("recreated_drafts").insert(payload).execute()
    rows = res.data or []
    if not rows:
        raise RuntimeError("failed to insert recreated_draft")
    # Update idea status → 'recreated' (best-effort, ignore failure)
    try:
        sb.table("ideas").update({"status": "recreated"}).eq("id", ctx.idea_id).eq(
            "user_id", ctx.user_id
        ).execute()
    except Exception:  # noqa: BLE001
        pass
    return rows[0]["id"]
