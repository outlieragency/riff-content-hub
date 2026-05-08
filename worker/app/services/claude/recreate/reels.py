"""IG Reels script recreate handler."""

from __future__ import annotations

import json
from typing import Any

from ..client import CallMeta
from ._orchestrator import (
    RecreateContext,
    call_recreate,
    parse_json_strict,
)

FORMAT_ID = "reels"
PROMPT_FILE = "recreate-reels.md"


class ReelsError(ValueError):
    pass


def _str_list(value: Any, max_len: int = 8) -> list[str]:
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
        raise ReelsError("output ไม่ใช่ JSON object")

    hook = raw.get("hook")
    body = raw.get("body")
    cta = raw.get("cta")
    if not (isinstance(hook, str) and hook.strip()):
        raise ReelsError("output ขาด hook")
    if not (isinstance(body, str) and body.strip()):
        raise ReelsError("output ขาด body")
    if not (isinstance(cta, str) and cta.strip()):
        cta = ""

    duration = raw.get("estimated_duration_seconds")
    try:
        duration_int = int(duration)
    except (TypeError, ValueError):
        duration_int = 45
    duration_int = max(15, min(90, duration_int))

    return {
        "hook": hook.strip(),
        "body": body.strip(),
        "cta": cta.strip(),
        "estimated_duration_seconds": duration_int,
        "visual_cues": _str_list(raw.get("visual_cues"), max_len=8),
    }


def _to_markdown(out: dict[str, Any]) -> str:
    lines: list[str] = ["# Reels Script\n"]
    lines.append(f"**Estimated duration:** {out['estimated_duration_seconds']}s\n")
    lines.append("## Hook (~5s)\n")
    lines.append(out["hook"])
    lines.append("\n## Body (~30-50s)\n")
    lines.append(out["body"])
    if out["cta"]:
        lines.append("\n## CTA (~5s)\n")
        lines.append(out["cta"])
    cues = out.get("visual_cues") or []
    if cues:
        lines.append("\n## Visual cues\n")
        for c in cues:
            lines.append(f"- {c}")
    return "\n".join(lines).strip() + "\n"


def generate(
    ctx: RecreateContext,
) -> tuple[dict[str, Any], str | None, str | None, CallMeta]:
    res = call_recreate(
        ctx=ctx,
        format_prompt_filename=PROMPT_FILE,
        max_tokens=2500,
        temperature=0.7,
    )
    try:
        raw = parse_json_strict(res.raw_text)
    except json.JSONDecodeError as e:
        raise ReelsError(f"AI output ไม่ใช่ JSON: {e}") from e

    output = _coerce(raw)
    title = (output["hook"][:60] + "…") if len(output["hook"]) > 60 else output["hook"]
    return output, _to_markdown(output), title, res.meta
