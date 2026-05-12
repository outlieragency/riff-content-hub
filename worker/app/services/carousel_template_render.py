"""Render a user-uploaded carousel template.

Takes a Jinja2 HTML string + field values + theme. Returns either:
  - render_template_html(): the rendered HTML string (used for iframe live preview)
  - render_template_png(): a screenshot via Playwright (final output)

This complements the existing `carousel_render.py` which handles the
built-in `thread-x` / `minimal-thai` templates. The split:

  carousel_render.py            → built-in templates (file-on-disk Jinja)
  carousel_template_render.py   → user templates (Jinja string from DB)
"""

from __future__ import annotations

from typing import Any

from jinja2 import Environment, select_autoescape
from playwright.sync_api import sync_playwright


class TemplateRenderError(RuntimeError):
    pass


def _render_jinja(html_template: str, ctx: dict[str, Any]) -> str:
    """Render a Jinja2 HTML string with the given context."""
    env = Environment(
        loader=None,
        autoescape=select_autoescape(["html"]),
    )
    try:
        tpl = env.from_string(html_template)
        return tpl.render(**ctx)
    except Exception as exc:  # noqa: BLE001
        raise TemplateRenderError(f"jinja2 render failed: {exc}") from exc


def render_template_html(
    *,
    html_template: str,
    fields: dict[str, Any],
    theme: dict[str, Any],
) -> str:
    """Render Jinja → HTML string. No browser needed.

    `fields` is the per-slide content (e.g. {heading: "...", body: "..."}).
    `theme` is the color/font dict — bound to `theme.*` in templates.
    """
    ctx = dict(fields)
    ctx["theme"] = theme
    return _render_jinja(html_template, ctx)


def render_template_png(
    *,
    html_template: str,
    fields: dict[str, Any],
    theme: dict[str, Any],
    width: int = 1080,
    height: int = 1350,
    device_scale: int = 2,
) -> bytes:
    """Render Jinja → HTML → Playwright screenshot → PNG bytes."""
    html = render_template_html(
        html_template=html_template,
        fields=fields,
        theme=theme,
    )

    with sync_playwright() as p:
        browser = p.chromium.launch()
        try:
            context = browser.new_context(
                viewport={"width": width, "height": height},
                device_scale_factor=device_scale,
            )
            page = context.new_page()
            page.set_content(html, wait_until="networkidle")
            # Small extra wait so Google Fonts have time to swap in.
            page.wait_for_timeout(800)
            png = page.screenshot(
                clip={"x": 0, "y": 0, "width": width, "height": height},
                omit_background=False,
                type="png",
            )
        finally:
            browser.close()

    return png


def render_template_pngs(
    *,
    html_template: str,
    slides: list[dict[str, Any]],
    theme: dict[str, Any],
    width: int = 1080,
    height: int = 1350,
    device_scale: int = 2,
) -> list[bytes]:
    """Batch render: one Playwright session, N slides → N PNGs."""
    pngs: list[bytes] = []

    with sync_playwright() as p:
        browser = p.chromium.launch()
        try:
            context = browser.new_context(
                viewport={"width": width, "height": height},
                device_scale_factor=device_scale,
            )
            page = context.new_page()

            for slide_fields in slides:
                html = render_template_html(
                    html_template=html_template,
                    fields=slide_fields,
                    theme=theme,
                )
                page.set_content(html, wait_until="networkidle")
                page.wait_for_timeout(800)
                png = page.screenshot(
                    clip={"x": 0, "y": 0, "width": width, "height": height},
                    omit_background=False,
                    type="png",
                )
                pngs.append(png)
        finally:
            browser.close()

    return pngs
