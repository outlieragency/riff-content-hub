"""OpenAI adapter — Phase 1 stub.

When OpenAI support is added, implement messages_create + extract_text
to translate Anthropic-style cached content blocks → OpenAI Responses API.

Notes for future implementation:
- Anthropic 5-block cache → OpenAI implicit caching (content order matters)
- Anthropic image source.url → OpenAI input_image
- Vision: GPT-4o / GPT-5 supports image input via responses API
"""

from __future__ import annotations

from typing import Any

from .base import CallMeta, Message, MessageBlock


class OpenAIAdapter:
    provider = "openai"

    def __init__(self, api_key: str):
        if not api_key:
            raise ValueError("OpenAI API key required")
        self._api_key = api_key

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
        raise NotImplementedError(
            "OpenAI provider ยังไม่พร้อมใช้งาน — coming in next release. "
            "ใช้ Anthropic ก่อน หรือเปลี่ยน task_models ใน Settings"
        )

    def extract_text(self, response: Any) -> str:
        raise NotImplementedError("OpenAI provider not yet implemented")
