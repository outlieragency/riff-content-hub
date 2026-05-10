"""Recreate format registry.

แต่ละ format = handler 1 ตัว ที่ implement same Protocol:
  generate(ctx: RecreateContext) -> (output_json, output_markdown, title, meta)

เพิ่ม format ใหม่ = สร้าง handler + register ตรงนี้ ไม่ต้อง schema migration
"""

from __future__ import annotations

from collections.abc import Callable
from typing import Any

from ..client import CallMeta
from ._orchestrator import RecreateContext

HandlerFn = Callable[
    [RecreateContext],
    tuple[dict[str, Any], str | None, str | None, CallMeta],
]


def _build_handlers() -> dict[str, HandlerFn]:
    from . import yt_script

    handlers: dict[str, HandlerFn] = {
        yt_script.FORMAT_ID: yt_script.generate,
    }

    try:
        from . import fb_article  # type: ignore[attr-defined]

        handlers[fb_article.FORMAT_ID] = fb_article.generate
    except ImportError:
        pass

    try:
        from . import reels  # type: ignore[attr-defined]

        handlers[reels.FORMAT_ID] = reels.generate
    except ImportError:
        pass

    try:
        from . import carousel  # type: ignore[attr-defined]

        handlers[carousel.FORMAT_ID] = carousel.generate
    except ImportError:
        pass

    return handlers


HANDLERS: dict[str, HandlerFn] = _build_handlers()


def get_handler(format_id: str) -> HandlerFn:
    fn = HANDLERS.get(format_id)
    if not fn:
        raise ValueError(f"unknown format: {format_id}")
    return fn


def supported_formats() -> list[str]:
    return sorted(HANDLERS.keys())
