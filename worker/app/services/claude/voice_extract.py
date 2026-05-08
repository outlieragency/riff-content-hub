"""Voice profile auto-extraction.

Pipeline:
  1. Concat samples → render extract-voice-profile.md prompt
  2. Call Claude Haiku 4.5 (cheap, fast, pattern-match strong)
  3. Parse JSON response → validate shape → return VoiceProfile

ใช้ Haiku ไม่ Sonnet เพราะ pattern recognition task ราคาถูกกว่า 5x
ไม่ใช้ system_voice_wrapper ใน call นี้เพราะกำลัง *สร้าง* profile ไม่ใช่ใช้ profile
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
class VoiceSample:
    text: str
    type: str | None = None
    date: str | None = None


@dataclass
class ExtractedVoice:
    voice_profile: dict[str, Any]
    meta: CallMeta


# === schema validation ===

ALLOWED_REGISTERS = {
    "casual but substantive",
    "casual",
    "professional",
    "expert",
    "provocative",
}

REQUIRED_KEYS = {
    "tone_words",
    "signature_phrases",
    "vocabulary",
    "sentence_rhythm",
    "dos",
    "donts",
}


class VoiceExtractError(ValueError):
    """Raised when AI output cannot be coerced to VoiceProfile shape."""


def _format_samples_block(samples: list[VoiceSample]) -> str:
    """Render samples เป็น text block ใส่ใน prompt."""
    if not samples:
        raise VoiceExtractError("ต้องมี sample อย่างน้อย 1 ชิ้น")

    parts: list[str] = []
    for i, s in enumerate(samples, start=1):
        meta_bits: list[str] = []
        if s.type:
            meta_bits.append(s.type)
        if s.date:
            meta_bits.append(s.date)
        meta_suffix = f" [{', '.join(meta_bits)}]" if meta_bits else ""
        parts.append(f"--- Sample {i}{meta_suffix} ---\n{s.text.strip()}")
    return "\n\n".join(parts)


def _strip_code_fence(text: str) -> str:
    """Anthropic บางครั้ง wrap json ใน ```json ... ``` แม้บอกห้าม strip ออก."""
    text = text.strip()
    fence = re.match(r"^```(?:json)?\s*\n(.*?)\n```\s*$", text, flags=re.DOTALL)
    if fence:
        return fence.group(1).strip()
    return text


def _normalize_str_list(value: Any, max_len: int = 12) -> list[str]:
    if not isinstance(value, list):
        return []
    out: list[str] = []
    for item in value:
        if isinstance(item, str):
            stripped = item.strip()
            if stripped:
                out.append(stripped)
    return out[:max_len]


def _coerce_voice_profile(raw: dict[str, Any]) -> dict[str, Any]:
    """Validate + coerce AI output ให้ตรง shape ของ portal types/voice-profile.ts.

    Throws VoiceExtractError ถ้า field พื้นฐานหายไปทั้งหมด.
    """
    if not isinstance(raw, dict):
        raise VoiceExtractError("output ไม่ใช่ JSON object")

    missing = REQUIRED_KEYS - set(raw.keys())
    if len(missing) >= 4:
        raise VoiceExtractError(
            f"output ขาด field สำคัญ: {sorted(missing)}"
        )

    vocab_raw = raw.get("vocabulary") or {}
    if not isinstance(vocab_raw, dict):
        vocab_raw = {}

    mix = vocab_raw.get("thai_english_mix", 70)
    try:
        mix_int = int(mix)
    except (TypeError, ValueError):
        mix_int = 70
    mix_int = max(0, min(100, mix_int))

    register = vocab_raw.get("register") or "casual but substantive"
    if not isinstance(register, str) or register not in ALLOWED_REGISTERS:
        # คงค่าเดิมถ้า model ใส่ custom mark เป็น "custom" แต่ยังให้ผ่าน
        register = register if isinstance(register, str) and register else "casual but substantive"

    rhythm = raw.get("sentence_rhythm")
    rhythm = rhythm.strip() if isinstance(rhythm, str) else ""

    return {
        "tone_words": _normalize_str_list(raw.get("tone_words"), max_len=10),
        "signature_phrases": _normalize_str_list(raw.get("signature_phrases"), max_len=12),
        "vocabulary": {
            "thai_english_mix": mix_int,
            "register": register,
        },
        "sentence_rhythm": rhythm[:400],
        "dos": _normalize_str_list(raw.get("dos"), max_len=10),
        "donts": _normalize_str_list(raw.get("donts"), max_len=10),
        "samples": [],  # samples เก็บฝั่ง portal แยก ไม่ทับของเดิม
    }


def extract_voice_profile(samples: list[VoiceSample]) -> ExtractedVoice:
    """Extract VoiceProfile from samples ผ่าน Claude Haiku."""
    settings = get_settings()
    prompt_template = load_prompt("extract-voice-profile.md")
    samples_block = _format_samples_block(samples)
    rendered = prompt_template.replace("{{ samples_block }}", samples_block)

    # Use system block to put extraction rules in cache
    # (User then provides only bare instruction)
    system_blocks = [cached_text_block(rendered)]

    msg, meta = call_messages(
        model=settings.haiku_model,
        system=system_blocks,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Output the VoiceProfile JSON now. JSON only, no commentary, no markdown.",
                    }
                ],
            }
        ],
        max_tokens=2000,
        temperature=0.3,
    )

    text = extract_text(msg).strip()
    text = _strip_code_fence(text)

    try:
        raw = json.loads(text)
    except json.JSONDecodeError as e:
        raise VoiceExtractError(f"AI output ไม่ใช่ JSON ที่ valid: {e}") from e

    profile = _coerce_voice_profile(raw)
    return ExtractedVoice(voice_profile=profile, meta=meta)
