"""Google Gemini adapter — Phase 1 stub.

When Gemini support is added:
- Anthropic 5-block cache → Gemini explicit cache (cachedContent.create)
- Vision: Gemini 2.0 supports image input natively
- Different message shape (parts[] vs content[])
"""

from __future__ import annotations

from typing import Any

from .base import CallMeta, Message, MessageBlock


class GoogleAdapter:
    provider = "google"

    def __init__(self, api_key: str):
        if not api_key:
            raise ValueError("Google API key required")
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
            "Google Gemini provider ยังไม่พร้อมใช้งาน — coming in next release"
        )

    def extract_text(self, response: Any) -> str:
        raise NotImplementedError("Google provider not yet implemented")
