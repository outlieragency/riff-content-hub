"""YT Script recreate handler."""

from __future__ import annotations

import json
from typing import Any

from ..client import CallMeta
from ._orchestrator import (
    RecreateContext,
    call_recreate,
    parse_json_strict,
)

FORMAT_ID = "yt_script"
PROMPT_FILE = "recreate-yt-script.md"


class YTScriptError(ValueError):
    pass


def _str_list(value: Any, max_len: int = 10) -> list[str]:
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
        raise YTScriptError("output ไม่ใช่ JSON object")

    outline_raw = raw.get("outline", [])
    outline: list[dict[str, Any]] = []
    if isinstance(outline_raw, list):
        for s in outline_raw[:10]:
            if not isinstance(s, dict):
                continue
            heading = s.get("heading")
            if not isinstance(heading, str) or not heading.strip():
                continue
            outline.append(
                {
                    "heading": heading.strip()[:200],
                    "bullets": _str_list(s.get("bullets"), max_len=8),
                }
            )

    sections_raw = raw.get("script_sections", [])
    sections: list[dict[str, Any]] = []
    if isinstance(sections_raw, list):
        for s in sections_raw[:10]:
            if not isinstance(s, dict):
                continue
            heading = s.get("heading")
            text = s.get("text")
            if not isinstance(heading, str) or not isinstance(text, str):
                continue
            if not text.strip():
                continue
            sections.append(
                {
                    "heading": heading.strip()[:200],
                    "text": text.strip(),
                }
            )

    titles = _str_list(raw.get("title_options"), max_len=5)
    while len(titles) < 5:
        titles.append("")

    thumb_raw = raw.get("thumbnail_brief") or {}
    if not isinstance(thumb_raw, dict):
        thumb_raw = {}

    thumbnail = {
        "visual_description": (thumb_raw.get("visual_description") or "").strip()[:500],
        "text_overlay": (thumb_raw.get("text_overlay") or "").strip()[:80],
        "mood": (thumb_raw.get("mood") or "").strip()[:30],
    }

    if not sections:
        raise YTScriptError("output ไม่มี script_sections")

    return {
        "outline": outline,
        "script_sections": sections,
        "title_options": titles[:5],
        "thumbnail_brief": thumbnail,
    }


def _to_markdown(out: dict[str, Any]) -> str:
    """Render structured YT script เป็น markdown ที่ user copy ใช้ได้."""
    lines: list[str] = ["# YouTube Script\n"]

    titles = out.get("title_options") or []
    titles = [t for t in titles if t]
    if titles:
        lines.append("## Title options\n")
        for t in titles:
            lines.append(f"- {t}")
        lines.append("")

    outline = out.get("outline") or []
    if outline:
        lines.append("## Outline\n")
        for i, s in enumerate(outline, start=1):
            lines.append(f"### {i}. {s['heading']}")
            for b in s.get("bullets", []):
                lines.append(f"- {b}")
            lines.append("")

    sections = out.get("script_sections") or []
    if sections:
        lines.append("## Script\n")
        for s in sections:
            lines.append(f"### {s['heading']}\n")
            lines.append(s["text"].strip())
            lines.append("")

    thumb = out.get("thumbnail_brief") or {}
    if thumb.get("visual_description") or thumb.get("text_overlay"):
        lines.append("## Thumbnail brief\n")
        if thumb.get("visual_description"):
            lines.append(f"- Visual: {thumb['visual_description']}")
        if thumb.get("text_overlay"):
            lines.append(f"- Text overlay: **{thumb['text_overlay']}**")
        if thumb.get("mood"):
            lines.append(f"- Mood: {thumb['mood']}")
        lines.append("")

    return "\n".join(lines).strip() + "\n"


def generate(ctx: RecreateContext) -> tuple[dict[str, Any], str | None, str | None, CallMeta]:
    """Run YT script generation.

    Returns (output_json, output_markdown, title, meta)
    """
    res = call_recreate(
        ctx=ctx,
        format_prompt_filename=PROMPT_FILE,
        max_tokens=5000,
        temperature=0.7,
    )

    try:
        raw = parse_json_strict(res.raw_text)
    except json.JSONDecodeError as e:
        raise YTScriptError(f"AI output ไม่ใช่ JSON: {e}") from e

    output = _coerce(raw)
    markdown = _to_markdown(output)
    title = next((t for t in output["title_options"] if t), None)
    return output, markdown, title, res.meta
