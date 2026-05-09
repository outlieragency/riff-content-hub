"""Render FB cover image (1080×1350 portrait, TrendTech-style tri-color highlight).

Ported from `marketing/_tools/fb-content-agent/src/render_cover.py`.

Adapted for Riff worker:
  - Returns PNG bytes instead of writing to disk (caller uploads to Supabase Storage)
  - Reads brand-mark + cover-photo override as bytes/None instead of paths
  - No CLI / no output_dir
"""

from __future__ import annotations

import base64
import html as html_lib
import mimetypes
from pathlib import Path
from typing import Optional

import requests
from jinja2 import Environment, FileSystemLoader, select_autoescape
from playwright.sync_api import sync_playwright

# Worker root: app/services/cover_render.py → app/
APP_ROOT = Path(__file__).resolve().parent.parent
TEMPLATE_DIR = APP_ROOT / "templates" / "cover"
ASSETS_DIR = APP_ROOT / "assets"

# Square viewport (legacy templates) and portrait viewport (trendtech-portrait)
SQUARE_VIEWPORT = {"width": 1080, "height": 1080}
PORTRAIT_VIEWPORT = {"width": 1080, "height": 1350}
DEVICE_SCALE = 2

# `headliner` = brand-neutral name for the original `trendtech-portrait` template
# Both names resolve to the same template file (alias kept for backward compat).
TEMPLATE_FILE_ALIASES: dict[str, str] = {
    "headliner": "trendtech-portrait",
    "trendtech-portrait": "trendtech-portrait",
}
KNOWN_TEMPLATES = set(TEMPLATE_FILE_ALIASES.keys())
PORTRAIT_TEMPLATES = {"headliner", "trendtech-portrait"}
DEFAULT_TEMPLATE = "headliner"

DEFAULT_THEME: dict[str, str] = {
    "bg": "#000000",
    "fg": "#FFFFFF",
    "hl_red": "#E53935",
    "hl_yellow": "#FFD400",
    "hl_orange": "#FF6B1A",
}


class CoverRenderError(RuntimeError):
    pass


def _http_to_data_uri(url: str, *, timeout: int = 20) -> Optional[str]:
    if not url:
        return None
    try:
        r = requests.get(url, timeout=timeout, headers={"User-Agent": "Mozilla/5.0"})
        r.raise_for_status()
    except Exception:
        return None
    content_type = r.headers.get("Content-Type", "image/jpeg").split(";")[0].strip()
    if not content_type.startswith("image/"):
        guessed, _ = mimetypes.guess_type(url)
        content_type = guessed or "image/jpeg"
    encoded = base64.b64encode(r.content).decode("ascii")
    return f"data:{content_type};base64,{encoded}"


def _bytes_to_data_uri(data: bytes, mime: str = "image/png") -> Optional[str]:
    if not data:
        return None
    encoded = base64.b64encode(data).decode("ascii")
    return f"data:{mime};base64,{encoded}"


def _file_to_data_uri(path: Path) -> Optional[str]:
    if not path.exists():
        return None
    mime, _ = mimetypes.guess_type(str(path))
    mime = mime or "image/png"
    encoded = base64.b64encode(path.read_bytes()).decode("ascii")
    return f"data:{mime};base64,{encoded}"


def _fetch_thumbnail_with_fallback(video_id: str, primary_url: str | None) -> Optional[str]:
    candidates = [
        primary_url,
        f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg",
        f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg",
        f"https://img.youtube.com/vi/{video_id}/mqdefault.jpg",
    ]
    for url in candidates:
        if not url:
            continue
        data_uri = _http_to_data_uri(url)
        if data_uri:
            return data_uri
    return None


def _wrap_highlight(text: str, highlight: str | None, css_class: str) -> str:
    """Wrap the `highlight` substring within `text` in `<span class="...">`."""
    if not text:
        return ""
    if not highlight or highlight not in text:
        return html_lib.escape(text)
    before, _, after = text.partition(highlight)
    return (
        html_lib.escape(before)
        + f'<span class="{css_class}">{html_lib.escape(highlight)}</span>'
        + html_lib.escape(after)
    )


def _format_subs_en(sub_count: int | None) -> str:
    """TrendTech-style EN sub format: '168K', '1.51M', '46.8K'."""
    if not sub_count:
        return ""
    n = int(sub_count)
    if n >= 1_000_000:
        v = n / 1_000_000
        s = f"{v:.2f}".rstrip("0").rstrip(".")
        return f"{s}M"
    if n >= 1_000:
        v = n / 1_000
        s = f"{v:.1f}".rstrip("0").rstrip(".")
        return f"{s}K"
    return str(n)


def render_cover_bytes(
    *,
    video_id: str,
    thumbnail_url: str | None,
    channel_name: str,
    channel_avatar_url: str | None,
    subscriber_count: int | None,
    line1: str,
    line2: str,
    line3: str,
    cover_template: str = DEFAULT_TEMPLATE,
    line1_highlight: str | None = None,
    line2_highlight: str | None = None,
    line3_highlight: str | None = None,
    subhead: str | None = None,
    arrow_caption_top: str | None = None,
    arrow_caption_bottom: str | None = None,
    arrow_position: str = "bottom-left",
    cover_photo_bytes: bytes | None = None,
    tool_icon_bytes: bytes | None = None,
    inset_image_bytes: bytes | None = None,
    brand_mark_bytes: bytes | None = None,
    theme: dict[str, str] | None = None,
) -> bytes:
    """Render cover and return PNG bytes.

    `theme` overrides the template's default CSS variables (bg, fg, accent,
    hl_red, hl_yellow, hl_orange). Missing keys fall back to DEFAULT_THEME.
    """
    if cover_template not in KNOWN_TEMPLATES:
        raise CoverRenderError(f"unknown cover_template: {cover_template}")

    template_basename = TEMPLATE_FILE_ALIASES[cover_template]
    template_file = f"{template_basename}.html.j2"
    template_path = TEMPLATE_DIR / template_file
    if not template_path.exists():
        raise CoverRenderError(f"template missing: {template_path}")

    merged_theme = {**DEFAULT_THEME, **(theme or {})}

    # ----- Image sources -----
    if cover_photo_bytes:
        screenshot_uri = _bytes_to_data_uri(cover_photo_bytes)
    else:
        screenshot_uri = _fetch_thumbnail_with_fallback(video_id, thumbnail_url)

    avatar_uri = _http_to_data_uri(channel_avatar_url) if channel_avatar_url else None
    tool_icon_uri = _bytes_to_data_uri(tool_icon_bytes) if tool_icon_bytes else None
    inset_uri = _bytes_to_data_uri(inset_image_bytes) if inset_image_bytes else None

    # Brand mark: caller-supplied bytes override > local asset > SVG fallback in template
    if brand_mark_bytes:
        brand_mark_uri = _bytes_to_data_uri(brand_mark_bytes)
    else:
        brand_mark_path = ASSETS_DIR / "brand-mark.png"
        brand_mark_uri = _file_to_data_uri(brand_mark_path) if brand_mark_path.exists() else None

    # ----- Template render -----
    env = Environment(
        loader=FileSystemLoader(str(TEMPLATE_DIR)),
        autoescape=select_autoescape(["html"]),
    )
    template = env.get_template(template_file)

    line1_html = _wrap_highlight(line1, line1_highlight, "hl-red")
    line2_html = _wrap_highlight(line2, line2_highlight, "hl-yellow")
    line3_html = _wrap_highlight(line3, line3_highlight, "hl-orange")

    html = template.render(
        screenshot_data_uri=screenshot_uri,
        channel_avatar_data_uri=avatar_uri,
        tool_icon_data_uri=tool_icon_uri,
        inset_image_data_uri=inset_uri,
        brand_mark_data_uri=brand_mark_uri,
        channel_name=channel_name,
        subscriber_text_en=_format_subs_en(subscriber_count),
        subscriber_text=None,  # legacy field, not used by headliner template
        line1_html=line1_html,
        line2_html=line2_html,
        line3_html=line3_html,
        subhead=subhead or "",
        arrow_caption_top=arrow_caption_top or "",
        arrow_caption_bottom=arrow_caption_bottom or "",
        arrow_position=arrow_position,
        theme=merged_theme,
    )

    viewport = PORTRAIT_VIEWPORT if cover_template in PORTRAIT_TEMPLATES else SQUARE_VIEWPORT

    # ----- Playwright render -----
    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context(viewport=viewport, device_scale_factor=DEVICE_SCALE)
        page = context.new_page()
        page.set_content(html, wait_until="networkidle")
        page.wait_for_timeout(900)

        # Overflow safeguard — same as fb-content-agent
        overflow_issues = page.evaluate(
            """() => {
                const issues = [];
                const targets = [['line1','.line1'],['line2','.line2'],['line3','.line3']];
                targets.forEach(([key, sel]) => {
                    const el = document.querySelector(sel);
                    if (!el || !el.textContent.trim()) return;
                    const cs = getComputedStyle(el);
                    const fontSize = parseFloat(cs.fontSize) || 0;
                    let lineHeight = parseFloat(cs.lineHeight);
                    if (isNaN(lineHeight)) lineHeight = fontSize * 1.2;
                    const actualHeight = el.getBoundingClientRect().height;
                    const wrapped = actualHeight > lineHeight * 1.4;
                    const overflowX = el.scrollWidth > el.clientWidth + 2;
                    if (wrapped || overflowX) {
                        issues.push({line: key, text: el.textContent.trim(),
                                     chars: el.textContent.trim().length,
                                     wrapped, overflow_x: overflowX,
                                     scroll_w: el.scrollWidth, client_w: el.clientWidth});
                    }
                });
                return issues;
            }"""
        )
        if overflow_issues:
            browser.close()
            details = "; ".join(
                f"{i['line']}={i['text']!r} ({i['chars']} chars,"
                f" wrap={i['wrapped']}, overflow_x={i['overflow_x']})"
                for i in overflow_issues
            )
            raise CoverRenderError(
                f"headline overflow: {details}. Shorten lines (TT budget ≤ 32 chars/line at 60px)."
            )

        png_bytes = page.screenshot(
            clip={"x": 0, "y": 0, **viewport},
            omit_background=False,
            type="png",
        )
        browser.close()

    return png_bytes


__all__ = ["render_cover_bytes", "CoverRenderError"]
