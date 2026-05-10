"""Recreate format registry — v2 collapsed to FB article only."""

from __future__ import annotations

from collections.abc import Callable
from typing import Any

from . import fb_article
from ..client import CallMeta
from ._orchestrator import RecreateContext

HandlerFn = Callable[
    [RecreateContext],
    tuple[dict[str, Any], str | None, str | None, CallMeta],
]


HANDLERS: dict[str, HandlerFn] = {
    fb_article.FORMAT_ID: fb_article.generate,
}


def get_handler(format_id: str) -> HandlerFn:
    fn = HANDLERS.get(format_id)
    if not fn:
        raise ValueError(f"unknown format: {format_id}")
    return fn


def supported_formats() -> list[str]:
    return sorted(HANDLERS.keys())
