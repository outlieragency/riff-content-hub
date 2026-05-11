"""Facebook long-form recreate handler (Earth Rati style).

Output schema (new — May 2026 onward):
  {
    "title": str,
    "cover": {
      hook_framework, headline_pattern, cover_template, color_theme,
      line1, line1_highlight,
      line2, line2_highlight,
      line3, line3_highlight,
      subhead, arrow_caption_top, arrow_caption_bottom, arrow_position,
    },
    "post_body": str,        # full FB post following Earth's 7-zone skeleton
    "section_count": int,
    "thesis": str,
  }

After Claude generation, the worker handler calls `render_and_upload_cover_for_draft()`
to render the TrendTech-portrait cover via cover_render service and upload to
Supabase Storage at `fb-covers/{user_id}/{draft_id}/cover.png`. The draft's
`output.cover_url` is updated to the public URL.

Source-of-truth for prompt: `prompts/recreate-fb-article.md` + `earth-rati-fb-style.md`
"""

from __future__ import annotations

import json
from typing import Any

from supabase import Client

from ....services.cover_render import CoverRenderError, render_cover_bytes
from ..client import CallMeta
from ._orchestrator import (
    RecreateContext,
    call_recreate,
    parse_json_strict,
)

FORMAT_ID = "fb_article"
PROMPT_FILE = "recreate-fb-article.md"
STORAGE_BUCKET = "fb-covers"

REQUIRED_HASHTAGS = (
    "#อ่านจบปุ๊ปเก่งขึ้นปั๊ป",
    "#สรุ๊ปสรุป",
    "#ความเห็นฉบับเอิร์ธ",
)
REQUIRED_SIGNATURE = "หวังว่าโพสต์นี้จะมีประโยชน์กับทุกคนนะครับผม"


class FbArticleError(ValueError):
    pass


def _coerce_str(raw: Any, key: str, *, max_len: int | None = None, required: bool = True) -> str:
    val = raw.get(key) if isinstance(raw, dict) else None
    if not isinstance(val, str) or not val.strip():
        if required:
            raise FbArticleError(f"output ขาด {key} (string)")
        return ""
    s = val.strip()
    if max_len:
        s = s[:max_len]
    return s


def _coerce_cover(raw: Any) -> dict[str, Any]:
    if not isinstance(raw, dict):
        raise FbArticleError("output ขาด cover (object)")
    cover = {
        "hook_framework": _coerce_str(raw, "hook_framework", required=False)[:1].upper() or "F",
        "headline_pattern": _coerce_str(raw, "headline_pattern", required=False) or "TT",
        "cover_template": _coerce_str(raw, "cover_template", required=False) or "trendtech-portrait",
        "color_theme": _coerce_str(raw, "color_theme", required=False) or "trendtech",
        "line1": _coerce_str(raw, "line1", max_len=80),
        "line1_highlight": _coerce_str(raw, "line1_highlight", required=False, max_len=80),
        "line2": _coerce_str(raw, "line2", max_len=80),
        "line2_highlight": _coerce_str(raw, "line2_highlight", required=False, max_len=80),
        "line3": _coerce_str(raw, "line3", max_len=80),
        "line3_highlight": _coerce_str(raw, "line3_highlight", required=False, max_len=80),
        "subhead": _coerce_str(raw, "subhead", required=False, max_len=200),
        "arrow_caption_top": _coerce_str(raw, "arrow_caption_top", required=False, max_len=80),
        "arrow_caption_bottom": _coerce_str(raw, "arrow_caption_bottom", required=False, max_len=80),
        "arrow_position": _coerce_str(raw, "arrow_position", required=False) or "bottom-left",
    }
    return cover


def _coerce(raw: Any) -> dict[str, Any]:
    if not isinstance(raw, dict):
        raise FbArticleError("output ไม่ใช่ JSON object")

    title = _coerce_str(raw, "title", max_len=300)
    post_body = _coerce_str(raw, "post_body")
    cover = _coerce_cover(raw.get("cover"))
    thesis = _coerce_str(raw, "thesis", required=False, max_len=400) or title

    section_count_raw = raw.get("section_count")
    try:
        section_count = int(section_count_raw)
    except (TypeError, ValueError):
        section_count = post_body.count("==========") // 2  # rough fallback

    return {
        "title": title,
        "cover": cover,
        "post_body": post_body,
        "section_count": section_count,
        "thesis": thesis,
    }


def _validate_style_compliance(post_body: str) -> list[str]:
    """Check Earth's hard rules — return list of warnings (empty = compliant)."""
    warnings: list[str] = []
    for tag in REQUIRED_HASHTAGS:
        if tag not in post_body:
            warnings.append(f"missing required hashtag: {tag}")
    if REQUIRED_SIGNATURE not in post_body:
        warnings.append(f"missing required signature: '{REQUIRED_SIGNATURE}'")
    if "===========" in post_body or "============" in post_body:
        warnings.append("found 11+ '=' divider — must be exactly 10 chars '=========='")
    if "—" in post_body:
        warnings.append("contains em dash — must use regular dash or break sentence")
    return warnings


def generate(
    ctx: RecreateContext,
) -> tuple[dict[str, Any], str | None, str | None, CallMeta]:
    res = call_recreate(
        ctx=ctx,
        format_prompt_filename=PROMPT_FILE,
        max_tokens=6000,
        temperature=0.7,
        inject_visual_style=True,
    )
    try:
        raw = parse_json_strict(res.raw_text)
    except json.JSONDecodeError as e:
        # Log the raw payload so the next failure is debuggable.
        # Slice WINDOW around the failure column so the relevant context
        # is visible regardless of where in the output it broke.
        import logging
        log = logging.getLogger("riff.fb_article")
        char_pos = getattr(e, "pos", 0) or 0
        window_start = max(0, char_pos - 500)
        window_end = min(len(res.raw_text), char_pos + 500)
        log.error(
            "fb_article JSON parse failed at line=%s col=%s pos=%s\n"
            "----- WINDOW around failure -----\n%s\n"
            "----- FULL output (first 16KB) -----\n%s",
            getattr(e, "lineno", "?"),
            getattr(e, "colno", "?"),
            char_pos,
            res.raw_text[window_start:window_end],
            res.raw_text[:16000],
        )
        raise FbArticleError(f"AI output ไม่ใช่ JSON: {e}") from e

    output = _coerce(raw)

    # Soft-validate (don't reject, but log warnings into output for UI)
    output["style_warnings"] = _validate_style_compliance(output["post_body"])

    # Markdown for copy-paste = the post body itself
    markdown = output["post_body"]
    title = output["title"]

    return output, markdown, title, res.meta


# =====================================================================
# Cover render + Storage upload (called from handler AFTER insert_draft)
# =====================================================================

def _try_fetch_cover_photo_override(
    sb: Client, user_id: str, draft_id: str
) -> bytes | None:
    """If user uploaded a custom cover-photo.png, fetch it from Storage to use
    as the photo source instead of the YouTube thumbnail."""
    path = f"{user_id}/{draft_id}/cover-photo.png"
    try:
        return sb.storage.from_(STORAGE_BUCKET).download(path)
    except Exception:
        return None


def render_and_upload_cover_for_draft(
    sb: Client,
    *,
    user_id: str,
    draft_id: str,
    output: dict[str, Any],
    video_meta: dict[str, Any],
    creative_style: dict[str, Any] | None = None,
) -> tuple[str | None, list[str]]:
    """Render cover.png and upload to Supabase Storage.

    Returns (public_url, warnings).

    `creative_style` (optional) supplies renderer_config:
      - renderer_config.base_template overrides cover_template
      - renderer_config.theme overrides CSS variables
      - renderer_config.fonts overrides heading + body font family
    """
    warnings: list[str] = []
    cover_data = output.get("cover") or {}
    if not cover_data:
        return None, ["no cover data in output"]

    # Check for user-uploaded cover-photo override (P0-2)
    cover_photo_bytes = _try_fetch_cover_photo_override(sb, user_id, draft_id)

    # Resolve template + theme + fonts from creative_style.renderer_config
    cover_template = cover_data.get("cover_template", "headliner")
    theme: dict[str, str] | None = None
    fonts: dict[str, str] | None = None
    if creative_style:
        cfg = creative_style.get("renderer_config") or {}
        if isinstance(cfg, dict):
            base = cfg.get("base_template")
            if isinstance(base, str) and base:
                cover_template = base
            theme_raw = cfg.get("theme")
            if isinstance(theme_raw, dict):
                theme = {k: v for k, v in theme_raw.items() if isinstance(v, str)}
            fonts_raw = cfg.get("fonts")
            if isinstance(fonts_raw, dict):
                fonts = {k: v for k, v in fonts_raw.items() if isinstance(v, str)}

    # Per-cover fonts override (cover.fonts in the draft output). Lets
    # Earth pick a font per cover without touching the shared creative_style.
    cover_fonts_raw = cover_data.get("fonts")
    if isinstance(cover_fonts_raw, dict):
        cover_fonts = {k: v for k, v in cover_fonts_raw.items() if isinstance(v, str)}
        if cover_fonts:
            fonts = {**(fonts or {}), **cover_fonts}

    try:
        png_bytes = render_cover_bytes(
            video_id=video_meta.get("youtube_video_id") or "",
            thumbnail_url=video_meta.get("thumbnail_url"),
            channel_name=video_meta.get("channel_name") or "",
            channel_avatar_url=video_meta.get("channel_avatar_url"),
            subscriber_count=video_meta.get("subscriber_count"),
            line1=cover_data["line1"],
            line2=cover_data["line2"],
            line3=cover_data["line3"],
            line1_highlight=cover_data.get("line1_highlight"),
            line2_highlight=cover_data.get("line2_highlight"),
            line3_highlight=cover_data.get("line3_highlight"),
            line1_style=cover_data.get("line1_style"),
            line2_style=cover_data.get("line2_style"),
            line3_style=cover_data.get("line3_style"),
            subhead=cover_data.get("subhead"),
            arrow_caption_top=cover_data.get("arrow_caption_top"),
            arrow_caption_bottom=cover_data.get("arrow_caption_bottom"),
            arrow_position=cover_data.get("arrow_position", "bottom-left"),
            badge_position=cover_data.get("badge_position", "bottom-right"),
            brand_mark_position=cover_data.get("brand_mark_position", "top-right"),
            cover_template=cover_template,
            cover_photo_bytes=cover_photo_bytes,
            theme=theme,
            fonts=fonts,
        )
    except CoverRenderError as e:
        warnings.append(f"cover render failed: {e}")
        return None, warnings
    except Exception as e:  # noqa: BLE001
        warnings.append(f"cover render unexpected error: {e}")
        return None, warnings

    storage_path = f"{user_id}/{draft_id}/cover.png"
    try:
        sb.storage.from_(STORAGE_BUCKET).upload(
            storage_path,
            png_bytes,
            file_options={"upsert": "true", "content-type": "image/png"},
        )
    except Exception as e:  # noqa: BLE001
        warnings.append(f"storage upload failed: {e}")
        return None, warnings

    public_url = sb.storage.from_(STORAGE_BUCKET).get_public_url(storage_path)
    return public_url, warnings
