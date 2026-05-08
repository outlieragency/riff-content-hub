"""Anthropic SDK wrapper.

หน้าที่:
- เก็บ singleton client ผ่าน deps.get_anthropic()
- Helper สำหรับเรียก messages.create พร้อมเก็บ usage metadata
- Log cache_read_input_tokens + cache_creation_input_tokens เพื่อ track hit ratio
"""

from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Any

from anthropic import Anthropic
from anthropic.types import Message

from ...deps import get_anthropic


@dataclass
class CallMeta:
    model: str
    input_tokens: int
    output_tokens: int
    cache_read_input_tokens: int
    cache_creation_input_tokens: int
    latency_ms: int
    stop_reason: str | None

    def to_jsonable(self) -> dict[str, Any]:
        return {
            "model": self.model,
            "input_tokens": self.input_tokens,
            "output_tokens": self.output_tokens,
            "cache_read_input_tokens": self.cache_read_input_tokens,
            "cache_creation_input_tokens": self.cache_creation_input_tokens,
            "latency_ms": self.latency_ms,
            "stop_reason": self.stop_reason,
            "cache_hit_ratio": self._cache_hit_ratio(),
        }

    def _cache_hit_ratio(self) -> float:
        total = self.input_tokens + self.cache_read_input_tokens
        if total == 0:
            return 0.0
        return round(self.cache_read_input_tokens / total, 3)


def call_messages(
    *,
    model: str,
    system: list[dict[str, Any]] | str | None,
    messages: list[dict[str, Any]],
    max_tokens: int,
    temperature: float = 0.7,
    extra_headers: dict[str, str] | None = None,
) -> tuple[Message, CallMeta]:
    """Call Anthropic messages API and return (message, meta).

    `system` รับเป็น list ของ content blocks เพื่อใส่ cache_control ได้
    """
    client: Anthropic = get_anthropic()

    started = time.monotonic()
    msg = client.messages.create(
        model=model,
        max_tokens=max_tokens,
        temperature=temperature,
        system=system,  # type: ignore[arg-type]
        messages=messages,  # type: ignore[arg-type]
        extra_headers=extra_headers or {},
    )
    elapsed_ms = int((time.monotonic() - started) * 1000)

    usage = msg.usage
    meta = CallMeta(
        model=model,
        input_tokens=getattr(usage, "input_tokens", 0) or 0,
        output_tokens=getattr(usage, "output_tokens", 0) or 0,
        cache_read_input_tokens=getattr(usage, "cache_read_input_tokens", 0) or 0,
        cache_creation_input_tokens=getattr(usage, "cache_creation_input_tokens", 0) or 0,
        latency_ms=elapsed_ms,
        stop_reason=getattr(msg, "stop_reason", None),
    )
    return msg, meta


def extract_text(msg: Message) -> str:
    """Concat all text blocks ของ assistant response."""
    parts: list[str] = []
    for block in msg.content:
        if getattr(block, "type", None) == "text":
            parts.append(getattr(block, "text", ""))
    return "".join(parts)
