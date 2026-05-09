"""AI Action Presets — small focused tools (Hook Doctor, Grade Draft, Niche Playbook).

Each tool = 1 prompt + 1 user input → return Markdown response.
Routes through llm.router so user's per-task model preference (Settings page)
takes effect. Falls back to env-based Anthropic if user not configured.

Default model = Sonnet 4.6 (creative-critique needs quality + Thai writing).
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Literal

from ..llm import CallMeta, call_via_router
from .caching import cached_text_block, load_prompt, render_voice_profile


ToolKind = Literal[
    "hook_doctor",
    "grade_draft",
    "niche_playbook",
    "voice_rewrite",
]

PROMPT_FILES: dict[str, str] = {
    "hook_doctor": "tools/hook-doctor.md",
    "grade_draft": "tools/grade-draft.md",
    "niche_playbook": "tools/niche-playbook.md",
    "voice_rewrite": "tools/voice-rewrite.md",
}

# Map ToolKind → router TaskKind. Most tools use the generic "recreate_content"
# slot (creative writing). voice_rewrite has its own.
TOOL_TO_TASK: dict[str, str] = {
    "hook_doctor": "recreate_content",
    "grade_draft": "recreate_content",
    "niche_playbook": "recreate_content",
    "voice_rewrite": "recreate_content",
}

MAX_INPUT_CHARS = 8000


class ToolError(ValueError):
    """Raised when tool input invalid or output unexpected."""


@dataclass
class ToolResult:
    output_markdown: str
    meta: CallMeta


def _extract_text(msg: Any) -> str:
    """Provider-agnostic text extraction (matches AnthropicAdapter shape)."""
    parts: list[str] = []
    for block in getattr(msg, "content", []) or []:
        if getattr(block, "type", None) == "text":
            parts.append(getattr(block, "text", ""))
    return "".join(parts)


def run_tool(
    tool: ToolKind,
    user_input: str,
    voice_profile: dict[str, Any] | None = None,
    user_id: str | None = None,
) -> ToolResult:
    """Run a preset tool with user input. Returns Markdown string.

    `user_id` enables per-user model routing (Settings → AI Providers).
    If None, falls back to env-based Anthropic with default Sonnet model.
    `voice_profile` is required for `voice_rewrite`.
    """
    if tool not in PROMPT_FILES:
        raise ToolError(f"unknown tool: {tool}")

    cleaned = (user_input or "").strip()
    if not cleaned:
        raise ToolError("input ห้ามว่าง")
    if len(cleaned) > MAX_INPUT_CHARS:
        raise ToolError(
            f"input ยาวเกิน — ตัดให้สั้นลง (max {MAX_INPUT_CHARS} chars)"
        )

    template = load_prompt(PROMPT_FILES[tool])
    rendered = template.replace("{{ user_input }}", cleaned)
    if tool == "voice_rewrite":
        if not voice_profile:
            raise ToolError("voice_rewrite ต้องการ voice_profile")
        rendered = rendered.replace(
            "{{ voice_profile_rendered }}",
            render_voice_profile(voice_profile),
        )

    system_blocks = [cached_text_block(rendered)]
    user_msgs = [
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Run the tool now. Output Markdown only, no preface.",
                }
            ],
        }
    ]

    if user_id:
        # Use user's per-task model preference (Settings)
        msg, meta = call_via_router(
            user_id=user_id,
            task=TOOL_TO_TASK[tool],  # type: ignore[arg-type]
            system=system_blocks,
            messages=user_msgs,
            max_tokens=2500,
            temperature=0.5,
        )
    else:
        # Fallback: env-based Anthropic Sonnet
        from ...settings import get_settings
        from .client import call_messages

        settings = get_settings()
        msg, meta = call_messages(
            model=settings.sonnet_model,
            system=system_blocks,
            messages=user_msgs,
            max_tokens=2500,
            temperature=0.5,
        )

    text = _extract_text(msg).strip()
    if not text:
        raise ToolError("AI output ว่าง — ลองใหม่อีกครั้ง")

    return ToolResult(output_markdown=text, meta=meta)
