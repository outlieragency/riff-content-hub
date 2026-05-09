"""Summarize transcript into structured JSON (Sonnet 4.6).

Output ตาม schema ใน prompts/summarize.md
ใช้ feed เข้า recreate prompts ทุก format ใน Slice 5-7
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from typing import Any

from ...settings import get_settings
from .caching import cached_text_block, load_prompt
from .client import CallMeta, call_messages, extract_text


@dataclass
class SummaryResult:
    summary: dict[str, Any]
    meta: CallMeta


class SummarizeError(ValueError):
    """Raised when AI output cannot be parsed/coerced to summary shape."""


def _strip_code_fence(text: str) -> str:
    text = text.strip()
    fence = re.match(r"^```(?:json)?\s*\n(.*?)\n```\s*$", text, flags=re.DOTALL)
    if fence:
        return fence.group(1).strip()
    return text


def _str_list(value: Any, max_len: int = 12) -> list[str]:
    if not isinstance(value, list):
        return []
    out: list[str] = []
    for item in value:
        if isinstance(item, str):
            stripped = item.strip()
            if stripped:
                out.append(stripped)
    return out[:max_len]


def _coerce(raw: Any) -> dict[str, Any]:
    if not isinstance(raw, dict):
        raise SummarizeError("output ไม่ใช่ JSON object")

    body_raw = raw.get("body_sections", [])
    body: list[dict[str, Any]] = []
    if isinstance(body_raw, list):
        for s in body_raw[:10]:
            if not isinstance(s, dict):
                continue
            heading = s.get("heading")
            if not isinstance(heading, str) or not heading.strip():
                continue
            body.append(
                {
                    "heading": heading.strip()[:200],
                    "key_points": _str_list(s.get("key_points"), max_len=8),
                }
            )

    cta = raw.get("cta")
    if cta is not None and not isinstance(cta, str):
        cta = None
    if isinstance(cta, str):
        cta = cta.strip()
        if not cta:
            cta = None

    main_thesis = raw.get("main_thesis", "")
    main_thesis = main_thesis.strip()[:500] if isinstance(main_thesis, str) else ""

    hook = raw.get("hook", "")
    hook = hook.strip()[:500] if isinstance(hook, str) else ""

    return {
        "main_thesis": main_thesis,
        "hook": hook,
        "body_sections": body,
        "examples": _str_list(raw.get("examples"), max_len=10),
        "cta": cta,
        "takeaways": _str_list(raw.get("takeaways"), max_len=8),
    }


def summarize_transcript(
    thai_text: str,
    user_id: str | None = None,
) -> SummaryResult:
    """Summarize Thai transcript into structured JSON."""
    if not thai_text.strip():
        raise SummarizeError("thai_text ห้ามว่าง")

    settings = get_settings()
    prompt_template = load_prompt("summarize.md")

    system_blocks = [cached_text_block(prompt_template)]
    user_messages = [
        {
            "role": "user",
            "content": [
                cached_text_block(thai_text),
                {
                    "type": "text",
                    "text": "Output the structured summary JSON now. JSON only, no commentary, no markdown.",
                },
            ],
        }
    ]

    if user_id:
        try:
            from ..llm import call_via_router

            msg, meta = call_via_router(
                user_id=user_id,
                task="transcript_summarize",
                system=system_blocks,
                messages=user_messages,
                max_tokens=6000,
                temperature=0.3,
            )
        except Exception:
            msg, meta = call_messages(
                model=settings.sonnet_model,
                system=system_blocks,
                messages=user_messages,
                max_tokens=6000,
                temperature=0.3,
            )
    else:
        msg, meta = call_messages(
            model=settings.sonnet_model,
            system=system_blocks,
            messages=user_messages,
            max_tokens=6000,
            temperature=0.3,
        )

    text = _strip_code_fence(extract_text(msg).strip())
    try:
        raw = json.loads(text)
    except json.JSONDecodeError as e:
        raise SummarizeError(f"AI output ไม่ใช่ JSON: {e}") from e

    return SummaryResult(summary=_coerce(raw), meta=meta)
