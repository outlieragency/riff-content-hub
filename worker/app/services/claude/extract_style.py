"""Creative style auto-extraction from reference images.

Pipeline:
  1. Render extract-creative-style.md prompt as system block
  2. Build user message with image blocks (1-12 reference images) + JSON-only instruction
  3. Call Claude Sonnet 4.6 (vision-strong, JSON-reliable)
  4. Parse JSON response → coerce to typed shape → return CreativeStyle

ใช้ Sonnet ไม่ Haiku เพราะ vision + structured JSON อยากความนิ่ง
samples รับเป็น URL (Supabase Storage public URLs) — Anthropic SDK รองรับ source.type=url
ไม่มี voice_profile ใน call นี้ เพราะกำลัง *สร้าง* style ไม่ใช่ใช้ voice
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
class StyleReference:
    image_url: str
    label: str | None = None


@dataclass
class ExtractedStyle:
    creative_style: dict[str, Any]
    meta: CallMeta


# === schema validation ===

ALLOWED_BASE_TEMPLATES = {
    "headliner",
    "minimal-card",
    "bold-quote",
    "full-text",
    "photo-frame",
}

ALLOWED_HEADING_WEIGHTS = {"extra-bold", "bold", "medium", "regular"}
ALLOWED_HEADING_FAMILIES = {"sans-serif", "serif", "display", "mono"}
ALLOWED_BODY_WEIGHTS = {"regular", "medium"}
ALLOWED_PHOTO_TREATMENTS = {"full-bleed", "framed", "masked", "cutout", "none"}
ALLOWED_ENERGY_LEVELS = {"high", "medium", "low"}

REQUIRED_KEYS = {
    "color_palette",
    "typography",
    "layout",
    "visual_tone",
    "suggested_base_template",
    "style_guide_md",
    "naming_suggestion",
}

HEX_RE = re.compile(r"^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$")


class StyleExtractError(ValueError):
    """Raised when AI output cannot be coerced to CreativeStyle shape."""


def _strip_code_fence(text: str) -> str:
    text = text.strip()
    fence = re.match(r"^```(?:json)?\s*\n(.*?)\n```\s*$", text, flags=re.DOTALL)
    if fence:
        return fence.group(1).strip()
    return text


def _normalize_hex(value: Any, default: str) -> str:
    if isinstance(value, str) and HEX_RE.match(value.strip()):
        return value.strip().upper() if len(value.strip()) == 7 else value.strip()
    return default


def _normalize_hex_list(value: Any, max_len: int = 4) -> list[str]:
    if not isinstance(value, list):
        return []
    out: list[str] = []
    for item in value:
        if isinstance(item, str) and HEX_RE.match(item.strip()):
            out.append(item.strip())
    return out[:max_len]


def _normalize_str_list(value: Any, max_len: int = 8) -> list[str]:
    if not isinstance(value, list):
        return []
    out: list[str] = []
    for item in value:
        if isinstance(item, str):
            stripped = item.strip()
            if stripped:
                out.append(stripped)
    return out[:max_len]


def _coerce_creative_style(raw: dict[str, Any]) -> dict[str, Any]:
    """Validate + coerce AI output ให้ตรง shape ของ creative_styles table."""
    if not isinstance(raw, dict):
        raise StyleExtractError("output ไม่ใช่ JSON object")

    missing = REQUIRED_KEYS - set(raw.keys())
    if len(missing) >= 4:
        raise StyleExtractError(f"output ขาด field สำคัญ: {sorted(missing)}")

    # color_palette
    palette_raw = raw.get("color_palette") or {}
    if not isinstance(palette_raw, dict):
        palette_raw = {}
    highlight_raw = palette_raw.get("highlight_colors") or {}
    if not isinstance(highlight_raw, dict):
        highlight_raw = {}

    color_palette = {
        "background": _normalize_hex(palette_raw.get("background"), "#000000"),
        "foreground": _normalize_hex(palette_raw.get("foreground"), "#FFFFFF"),
        "accent_colors": _normalize_hex_list(palette_raw.get("accent_colors"), max_len=3),
        "highlight_colors": {
            "primary": _normalize_hex(highlight_raw.get("primary"), "#E53935"),
            "secondary": _normalize_hex(highlight_raw.get("secondary"), "#FFD400"),
            "tertiary": _normalize_hex(highlight_raw.get("tertiary"), "#FF6B1A"),
        },
    }

    # typography
    typo_raw = raw.get("typography") or {}
    if not isinstance(typo_raw, dict):
        typo_raw = {}
    heading_weight = typo_raw.get("heading_weight")
    heading_family = typo_raw.get("heading_family")
    body_weight = typo_raw.get("body_weight")
    typography = {
        "heading_weight": heading_weight if heading_weight in ALLOWED_HEADING_WEIGHTS else "extra-bold",
        "heading_family": heading_family if heading_family in ALLOWED_HEADING_FAMILIES else "sans-serif",
        "body_weight": body_weight if body_weight in ALLOWED_BODY_WEIGHTS else "regular",
        "is_thai_optimized": bool(typo_raw.get("is_thai_optimized", True)),
    }

    # layout
    layout_raw = raw.get("layout") or {}
    if not isinstance(layout_raw, dict):
        layout_raw = {}
    photo_treatment = layout_raw.get("photo_treatment")
    headline_lines_raw = layout_raw.get("headline_lines", 3)
    try:
        headline_lines = int(headline_lines_raw)
    except (TypeError, ValueError):
        headline_lines = 3
    headline_lines = max(1, min(5, headline_lines))

    layout = {
        "photo_treatment": photo_treatment if photo_treatment in ALLOWED_PHOTO_TREATMENTS else "full-bleed",
        "photo_position": str(layout_raw.get("photo_position") or "top")[:24],
        "headline_position": str(layout_raw.get("headline_position") or "bottom")[:24],
        "headline_lines": headline_lines,
        "highlight_pattern": str(layout_raw.get("highlight_pattern") or "tri-color")[:32],
        "brand_mark_position": str(layout_raw.get("brand_mark_position") or "top-right")[:24],
        "badge_position": str(layout_raw.get("badge_position") or "mid-right")[:24],
    }

    # visual_tone
    tone_raw = raw.get("visual_tone") or {}
    if not isinstance(tone_raw, dict):
        tone_raw = {}
    energy_level = tone_raw.get("energy_level")
    visual_tone = {
        "primary_descriptor": str(tone_raw.get("primary_descriptor") or "bold")[:32],
        "energy_level": energy_level if energy_level in ALLOWED_ENERGY_LEVELS else "high",
        "supporting_descriptors": _normalize_str_list(tone_raw.get("supporting_descriptors"), max_len=6),
    }

    # base_template
    base = raw.get("suggested_base_template")
    suggested_base_template = base if base in ALLOWED_BASE_TEMPLATES else "headliner"

    # style_guide_md
    guide = raw.get("style_guide_md")
    style_guide_md = guide.strip() if isinstance(guide, str) else ""
    if not style_guide_md:
        raise StyleExtractError("output ขาด style_guide_md")

    # naming_suggestion
    name = raw.get("naming_suggestion")
    naming_suggestion = name.strip()[:48] if isinstance(name, str) and name.strip() else "Bold Headliner"

    return {
        "color_palette": color_palette,
        "typography": typography,
        "layout": layout,
        "visual_tone": visual_tone,
        "suggested_base_template": suggested_base_template,
        "style_guide_md": style_guide_md,
        "naming_suggestion": naming_suggestion,
    }


def _build_image_blocks(refs: list[StyleReference]) -> list[dict[str, Any]]:
    """Build Anthropic image content blocks from list of URLs.

    Anthropic SDK รับ source.type='url' (เปิดให้ใช้ตั้งแต่ปี 2025).
    label ถ้ามี ใส่เป็น text block แทรกก่อนภาพ เพื่อให้ AI รู้ว่าใครคือใคร.
    """
    blocks: list[dict[str, Any]] = []
    for i, ref in enumerate(refs, start=1):
        label = ref.label.strip() if ref.label else f"Reference {i}"
        blocks.append({"type": "text", "text": f"--- {label} ---"})
        blocks.append(
            {
                "type": "image",
                "source": {
                    "type": "url",
                    "url": ref.image_url,
                },
            }
        )
    return blocks


def extract_creative_style(refs: list[StyleReference]) -> ExtractedStyle:
    """Extract CreativeStyle from N reference images via Claude Vision (Sonnet)."""
    if not refs:
        raise StyleExtractError("ต้องมี reference image อย่างน้อย 1 ภาพ")
    if len(refs) > 12:
        raise StyleExtractError("ใส่ reference image ได้สูงสุด 12 ภาพ")

    settings = get_settings()
    prompt_text = load_prompt("extract-creative-style.md")

    # System = analysis rules (cached on subsequent calls)
    system_blocks = [cached_text_block(prompt_text)]

    image_blocks = _build_image_blocks(refs)
    user_content = [
        *image_blocks,
        {
            "type": "text",
            "text": (
                "Analyze ALL the images above as ONE coherent visual style. "
                "Output the structured JSON now. JSON only, no commentary, no markdown wrapper."
            ),
        },
    ]

    msg, meta = call_messages(
        model=settings.sonnet_model,
        system=system_blocks,
        messages=[{"role": "user", "content": user_content}],
        max_tokens=3000,
        temperature=0.4,
    )

    text = extract_text(msg).strip()
    text = _strip_code_fence(text)

    try:
        raw = json.loads(text)
    except json.JSONDecodeError as e:
        raise StyleExtractError(f"AI output ไม่ใช่ JSON ที่ valid: {e}") from e

    style = _coerce_creative_style(raw)
    return ExtractedStyle(creative_style=style, meta=meta)
