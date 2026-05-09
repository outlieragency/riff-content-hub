"""AI Action Presets — small focused tools (Hook Doctor, Grade Draft, Niche Playbook).

Each tool = 1 prompt + 1 user input → return Markdown response.
Cheap pattern: load prompt, render {{ user_input }}, call Sonnet 4.6, return text.

Sonnet (not Haiku) เพราะ creative-critique ต้องการคุณภาพ + Thai writing สูง
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from ...settings import get_settings
from .caching import cached_text_block, load_prompt
from .client import CallMeta, call_messages, extract_text


ToolKind = Literal["hook_doctor", "grade_draft", "niche_playbook"]

PROMPT_FILES: dict[str, str] = {
    "hook_doctor": "tools/hook-doctor.md",
    "grade_draft": "tools/grade-draft.md",
    "niche_playbook": "tools/niche-playbook.md",
}

MAX_INPUT_CHARS = 8000  # ~2000 tokens — plenty for any single post / draft


class ToolError(ValueError):
    """Raised when tool input invalid or output unexpected."""


@dataclass
class ToolResult:
    output_markdown: str
    meta: CallMeta


def run_tool(tool: ToolKind, user_input: str) -> ToolResult:
    """Run a preset tool with user input. Returns Markdown string."""
    if tool not in PROMPT_FILES:
        raise ToolError(f"unknown tool: {tool}")

    cleaned = (user_input or "").strip()
    if not cleaned:
        raise ToolError("input ห้ามว่าง")
    if len(cleaned) > MAX_INPUT_CHARS:
        raise ToolError(
            f"input ยาวเกิน — ตัดให้สั้นลง (max {MAX_INPUT_CHARS} chars)"
        )

    settings = get_settings()
    template = load_prompt(PROMPT_FILES[tool])
    rendered = template.replace("{{ user_input }}", cleaned)

    # System block = instructions (cached if same tool called again)
    system_blocks = [cached_text_block(rendered)]

    msg, meta = call_messages(
        model=settings.sonnet_model,
        system=system_blocks,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Run the tool now. Output Markdown only, no preface.",
                    }
                ],
            }
        ],
        max_tokens=2500,
        temperature=0.5,
    )

    text = extract_text(msg).strip()
    if not text:
        raise ToolError("AI output ว่าง — ลองใหม่อีกครั้ง")

    return ToolResult(output_markdown=text, meta=meta)
