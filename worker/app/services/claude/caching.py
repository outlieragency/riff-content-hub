"""Prompt caching helper — 5-block structure.

ทุก Claude call ใน Riff ต้องผ่าน helper นี้เพื่อรับประกัน cache structure ที่ stable
target hit ratio ≥ 60% input tokens (ดู AGENTS.md หลักการ #3)

Block order (สำคัญ ห้ามสลับ):
  1. system: GLOBAL_RULES                เปลี่ยนน้อย cache
  2. system: HOOK_FRAMEWORKS + STRUCTURES static cache
  3. system: VOICE_PROFILE rendered      ~weekly change cache
  4. user:   PRIMARY CONTEXT (transcript / samples) per-resource cache
  5. user:   TASK INSTRUCTION             uncached (varies)

Anthropic อนุญาต cache_control ไม่เกิน 4 จุด ใน 1 request
ให้ mark block 1+2+3 (system) + block 4 (user) = 4 จุด pass
block 5 ไม่ mark cache เพราะเป็นส่วนที่ดูเปลี่ยน
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

PROMPTS_DIR = Path(__file__).resolve().parent.parent.parent / "prompts"


def load_prompt(filename: str) -> str:
    path = PROMPTS_DIR / filename
    if not path.exists():
        raise FileNotFoundError(f"prompt file not found: {path}")
    return path.read_text(encoding="utf-8")


def cached_text_block(text: str) -> dict[str, Any]:
    """System block ที่ mark cache_control = ephemeral."""
    return {
        "type": "text",
        "text": text,
        "cache_control": {"type": "ephemeral"},
    }


def plain_text_block(text: str) -> dict[str, Any]:
    return {"type": "text", "text": text}


def build_system_blocks(
    *,
    global_rules: str,
    structures: str | None = None,
    voice_profile_rendered: str | None = None,
) -> list[dict[str, Any]]:
    """Compose system blocks ตาม cache structure.

    blocks 1-3 mark cache_control ทั้งหมด เพื่อ guarantee re-use ใน call ถัดไป
    """
    blocks: list[dict[str, Any]] = [cached_text_block(global_rules)]
    if structures:
        blocks.append(cached_text_block(structures))
    if voice_profile_rendered:
        blocks.append(cached_text_block(voice_profile_rendered))
    return blocks


def render_voice_profile(profile: dict[str, Any]) -> str:
    """Render voice profile JSON เข้า system prompt."""
    wrapper = load_prompt("system_voice_wrapper.md")
    import json

    return wrapper.replace("{{ voice_profile_json }}", json.dumps(profile, ensure_ascii=False, indent=2))


def build_user_blocks(
    *,
    primary_context: str | None,
    task_instruction: str,
) -> list[dict[str, Any]]:
    """Build user message content blocks.

    block 4 (primary_context) cached
    block 5 (task_instruction) uncached
    """
    content: list[dict[str, Any]] = []
    if primary_context:
        content.append(cached_text_block(primary_context))
    content.append(plain_text_block(task_instruction))
    return content
