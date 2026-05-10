"""Render IG Carousel slides (1080×1350 per slide, multi-PNG).

Ported from `marketing/_tools/ig-carousel-agent/renderer/render.py`.

Adapted for Riff worker:
  - Returns list[bytes] instead of writing to disk (caller uploads to Storage)
  - Theme + template resolved from `creative_styles.renderer_config`
  - No CLI / no Drive upload
"""

from __future__ import annotations

import base64
import json
import mimetypes
from pathlib import Path
from typing import Any

from jinja2 import Environment, FileSystemLoader, select_autoescape
from playwright.sync_api import sync_playwright

APP_ROOT = Path(__file__).resolve().parent.parent
TEMPLATE_DIR = APP_ROOT / "templates" / "carousel"
COLORS_FILE = APP_ROOT / "assets" / "carousel" / "colors.json"

VIEWPORT = {"width": 1080, "height": 1350}
DEVICE_SCALE = 2

KNOWN_TEMPLATES = {"thread-x", "minimal-thai"}
DEFAULT_TEMPLATE = "thread-x"


class CarouselRenderError(RuntimeError):
    pass


def _load_palette() -> dict[str, Any]:
    return json.loads(COLORS_FILE.read_text(encoding="utf-8"))


def _resolve_theme(theme_name: str | None, override_theme: dict[str, str] | None) -> dict[str, str]:
    palette = _load_palette()
    themes = palette.get("themes", {})
    base = (themes.get(theme_name) if theme_name else None) or themes.get(
        palette.get("default_theme", "cream")
    ) or {"bg": "#F4EFE6", "fg": "#0A0A0A", "muted": "#6B6B6B", "accent": "#FF751F", "border": "#E5E0D5"}
    if override_theme:
        merged = {**base, **{k: v for k, v in override_theme.items() if isinstance(v, str)}}
        return merged
    return base


def _bytes_to_data_uri(data: bytes, mime: str = "image/png") -> str | None:
    if not data:
        return None
    return f"data:{mime};base64,{base64.b64encode(data).decode('ascii')}"


def _http_or_local_to_data_uri(path_or_url: str | None) -> str | None:
    if not path_or_url:
        return None
    # Local file (relative to APP_ROOT or absolute)
    p = Path(path_or_url)
    if not p.is_absolute():
        p = APP_ROOT / path_or_url
    if p.exists():
        mime, _ = mimetypes.guess_type(str(p))
        mime = mime or "image/png"
        return f"data:{mime};base64,{base64.b64encode(p.read_bytes()).decode('ascii')}"
    # Treat as HTTP URL
    if path_or_url.startswith(("http://", "https://")):
        try:
            import requests

            r = requests.get(path_or_url, timeout=20)
            r.raise_for_status()
            ct = r.headers.get("Content-Type", "image/jpeg").split(";")[0].strip()
            if not ct.startswith("image/"):
                ct = "image/jpeg"
            return f"data:{ct};base64,{base64.b64encode(r.content).decode('ascii')}"
        except Exception:
            return None
    return None


def _adapt_slide(raw: dict[str, Any]) -> dict[str, Any]:
    """Riff carousel handler outputs `kind` + heading/text; templates expect
    `type` + headline/body. Bridge here."""
    s = dict(raw)
    if "type" not in s and "kind" in s:
        s["type"] = s["kind"]
    t = s.get("type")
    if t == "tweet" and "body" not in s and "text" in s:
        s["body"] = s["text"]
    if t in {"content", "list", "cta"} and "headline" not in s and "heading" in s:
        s["headline"] = s["heading"]
    return s


def render_carousel_bytes(
    *,
    slides: list[dict[str, Any]],
    template: str = DEFAULT_TEMPLATE,
    theme_name: str | None = None,
    theme_override: dict[str, str] | None = None,
    background_image: str | None = None,
    background_color: str | None = None,
    profile_name: str = "Earth Rati",
    profile_handle: str = "@earth.rati",
    profile_initial: str = "E",
    profile_image_url: str | None = None,
) -> list[bytes]:
    """Render N slides → return list of PNG bytes (in slide order)."""
    if template not in KNOWN_TEMPLATES:
        raise CarouselRenderError(f"unknown carousel template: {template}")

    template_path = TEMPLATE_DIR / template / "slide.html.j2"
    if not template_path.exists():
        raise CarouselRenderError(f"template missing: {template_path}")

    theme = _resolve_theme(theme_name, theme_override)
    bg_image_uri = _http_or_local_to_data_uri(background_image)
    profile_image_uri = _http_or_local_to_data_uri(profile_image_url)

    common_ctx = {
        "theme": theme,
        "background_image": bg_image_uri,
        "background_color": background_color,
        "profile_image": profile_image_uri,
        "profile_name": profile_name,
        "profile_handle": profile_handle,
        "profile_initial": profile_initial,
    }

    env = Environment(
        loader=FileSystemLoader(str(template_path.parent)),
        autoescape=select_autoescape(["html"]),
    )
    jinja_template = env.get_template("slide.html.j2")

    last_index = len(slides) - 1
    pngs: list[bytes] = []

    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context(
            viewport=VIEWPORT,
            device_scale_factor=DEVICE_SCALE,
        )
        page = context.new_page()

        for i, slide in enumerate(slides):
            patched = _adapt_slide(slide)
            if i == 0 and "is_hook" not in patched:
                patched["is_hook"] = True
            if i == last_index and "is_last" not in patched:
                patched["is_last"] = True

            slide_ctx = dict(common_ctx)
            if patched.get("background_image"):
                slide_ctx["background_image"] = _http_or_local_to_data_uri(
                    patched["background_image"]
                )
                slide_ctx["background_color"] = None
            elif patched.get("background_color"):
                slide_ctx["background_color"] = patched["background_color"]
                slide_ctx["background_image"] = None

            html = jinja_template.render(slide=patched, index=i + 1, **slide_ctx)
            page.set_content(html, wait_until="networkidle")
            page.wait_for_timeout(800)
            png = page.screenshot(
                clip={"x": 0, "y": 0, **VIEWPORT},
                omit_background=False,
                type="png",
            )
            pngs.append(png)

        browser.close()

    return pngs


__all__ = ["render_carousel_bytes", "CarouselRenderError", "KNOWN_TEMPLATES"]
