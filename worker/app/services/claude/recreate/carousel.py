"""Carousel recreate handler.

Output JSON ตรง shape ของ portal types/recreate-formats.ts CarouselOutput
ส่งต่อให้ existing renderer ที่ marketing/_tools/ig-carousel-agent/renderer/
"""

from __future__ import annotations

import json
import re
from typing import Any

from ..client import CallMeta
from ._orchestrator import (
    RecreateContext,
    call_recreate,
    parse_json_strict,
)

FORMAT_ID = "carousel"
PROMPT_FILE = "recreate-carousel.md"

ALLOWED_TEMPLATES = {"thread-x", "minimal-thai"}
ALLOWED_THEMES = {"light", "dark", "cream", "orange", "white"}
ALLOWED_KINDS = {"tweet", "cover", "content", "quote", "list", "cta"}


class CarouselError(ValueError):
    pass


def _slugify(value: str) -> str:
    """ASCII kebab-case fallback if model output bad slug."""
    s = re.sub(r"[^A-Za-z0-9\s-]", "", value).strip().lower()
    s = re.sub(r"[\s_-]+", "-", s)
    return s[:60] or "carousel"


def _coerce_slide(raw: Any) -> dict[str, Any] | None:
    if not isinstance(raw, dict):
        return None
    kind = raw.get("kind")
    if kind not in ALLOWED_KINDS:
        return None

    if kind == "tweet":
        text = raw.get("text")
        if not isinstance(text, str) or not text.strip():
            return None
        slide: dict[str, Any] = {"kind": "tweet", "text": text.strip()}
        author = raw.get("author")
        if isinstance(author, str) and author.strip():
            slide["author"] = author.strip()[:50]
        return slide

    if kind == "cover":
        title = raw.get("title")
        if not isinstance(title, str) or not title.strip():
            return None
        slide = {"kind": "cover", "title": title.strip()[:120]}
        subtitle = raw.get("subtitle")
        if isinstance(subtitle, str) and subtitle.strip():
            slide["subtitle"] = subtitle.strip()[:200]
        return slide

    if kind == "content":
        heading = raw.get("heading")
        body = raw.get("body")
        if not (isinstance(heading, str) and heading.strip()):
            return None
        if not (isinstance(body, str) and body.strip()):
            return None
        return {
            "kind": "content",
            "heading": heading.strip()[:100],
            "body": body.strip()[:600],
        }

    if kind == "quote":
        text = raw.get("text")
        if not isinstance(text, str) or not text.strip():
            return None
        slide = {"kind": "quote", "text": text.strip()[:300]}
        attr = raw.get("attribution")
        if isinstance(attr, str) and attr.strip():
            slide["attribution"] = attr.strip()[:80]
        return slide

    if kind == "list":
        heading = raw.get("heading")
        items = raw.get("items")
        if not isinstance(heading, str) or not heading.strip():
            return None
        if not isinstance(items, list):
            return None
        clean_items: list[str] = []
        for it in items[:6]:
            if isinstance(it, str) and it.strip():
                clean_items.append(it.strip()[:160])
        if not clean_items:
            return None
        return {
            "kind": "list",
            "heading": heading.strip()[:100],
            "items": clean_items,
        }

    if kind == "cta":
        heading = raw.get("heading")
        body = raw.get("body")
        if not isinstance(heading, str) or not heading.strip():
            return None
        if not isinstance(body, str) or not body.strip():
            return None
        slide = {
            "kind": "cta",
            "heading": heading.strip()[:100],
            "body": body.strip()[:500],
        }
        cta_text = raw.get("cta_text")
        if isinstance(cta_text, str) and cta_text.strip():
            slide["cta_text"] = cta_text.strip()[:40]
        return slide

    return None


def _coerce(raw: Any) -> dict[str, Any]:
    if not isinstance(raw, dict):
        raise CarouselError("output ไม่ใช่ JSON object")

    template = raw.get("template")
    if template not in ALLOWED_TEMPLATES:
        template = "minimal-thai"

    theme = raw.get("theme")
    if theme not in ALLOWED_THEMES:
        theme = "cream"

    slides_raw = raw.get("slides")
    if not isinstance(slides_raw, list) or not slides_raw:
        raise CarouselError("output ขาด slides")

    slides: list[dict[str, Any]] = []
    for s in slides_raw[:9]:
        coerced = _coerce_slide(s)
        if coerced:
            slides.append(coerced)

    if len(slides) < 3:
        raise CarouselError("slides น้อยเกินไป (ต้อง ≥ 3 หลัง validate)")

    slug = raw.get("slug")
    if not isinstance(slug, str) or not slug.strip():
        # Fallback: derive from first slide title/heading
        first = slides[0]
        seed = first.get("title") or first.get("heading") or "carousel"
        slug = _slugify(seed)
    else:
        slug = _slugify(slug)

    return {
        "slug": slug,
        "template": template,
        "theme": theme,
        "slides": slides,
    }


def _to_markdown(out: dict[str, Any]) -> str:
    lines: list[str] = [f"# Carousel: {out['slug']}\n"]
    lines.append(f"**Template:** {out['template']} · **Theme:** {out['theme']}\n")
    for i, s in enumerate(out["slides"], start=1):
        lines.append(f"## Slide {i} — {s['kind']}\n")
        if s["kind"] == "tweet":
            lines.append(s["text"])
            if s.get("author"):
                lines.append(f"\n— {s['author']}")
        elif s["kind"] == "cover":
            lines.append(f"**{s['title']}**")
            if s.get("subtitle"):
                lines.append(f"\n{s['subtitle']}")
        elif s["kind"] == "content":
            lines.append(f"### {s['heading']}\n")
            lines.append(s["body"])
        elif s["kind"] == "quote":
            lines.append(f"> {s['text']}")
            if s.get("attribution"):
                lines.append(f"\n— {s['attribution']}")
        elif s["kind"] == "list":
            lines.append(f"### {s['heading']}\n")
            for it in s["items"]:
                lines.append(f"- {it}")
        elif s["kind"] == "cta":
            lines.append(f"### {s['heading']}\n")
            lines.append(s["body"])
            if s.get("cta_text"):
                lines.append(f"\n**[{s['cta_text']}]**")
        lines.append("")
    lines.append("---")
    lines.append(
        "JSON output นี้ feed ตรงเข้า "
        "`marketing/_tools/ig-carousel-agent/renderer/` ได้เพื่อ render PNG"
    )
    return "\n".join(lines).strip() + "\n"


def generate(
    ctx: RecreateContext,
) -> tuple[dict[str, Any], str | None, str | None, CallMeta]:
    res = call_recreate(
        ctx=ctx,
        format_prompt_filename=PROMPT_FILE,
        max_tokens=4500,
        temperature=0.7,
    )
    try:
        raw = parse_json_strict(res.raw_text)
    except json.JSONDecodeError as e:
        raise CarouselError(f"AI output ไม่ใช่ JSON: {e}") from e

    output = _coerce(raw)
    title_seed = next(
        (
            s.get("title") or s.get("heading")
            for s in output["slides"]
            if s.get("title") or s.get("heading")
        ),
        output["slug"],
    )
    return output, _to_markdown(output), title_seed, res.meta
