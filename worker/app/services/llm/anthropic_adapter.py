"""Anthropic adapter — wraps the Anthropic SDK to match LLMClient interface.

This is a thin adapter — preserves prompt caching, retries, vision, etc. by
just delegating to `client.messages.create()` and constructing CallMeta.
"""

from __future__ import annotations

import time
from typing import Any

from anthropic import Anthropic

from .base import CallMeta, Message, MessageBlock


class AnthropicAdapter:
    provider = "anthropic"

    def __init__(self, api_key: str):
        self._client = Anthropic(api_key=api_key, max_retries=3, timeout=120.0)

    def messages_create(
        self,
        *,
        model: str,
        system: list[MessageBlock] | str | None,
        messages: list[Message],
        max_tokens: int,
        temperature: float = 0.7,
        extra_headers: dict[str, str] | None = None,
    ) -> tuple[Any, CallMeta]:
        started = time.monotonic()
        msg = self._client.messages.create(
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
            provider=self.provider,
            input_tokens=getattr(usage, "input_tokens", 0) or 0,
            output_tokens=getattr(usage, "output_tokens", 0) or 0,
            cache_read_input_tokens=getattr(usage, "cache_read_input_tokens", 0) or 0,
            cache_creation_input_tokens=getattr(usage, "cache_creation_input_tokens", 0) or 0,
            latency_ms=elapsed_ms,
            stop_reason=getattr(msg, "stop_reason", None),
        )
        return msg, meta

    def extract_text(self, response: Any) -> str:
        parts: list[str] = []
        for block in getattr(response, "content", []) or []:
            if getattr(block, "type", None) == "text":
                parts.append(getattr(block, "text", ""))
        return "".join(parts)
