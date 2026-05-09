"""LLM adapter interface + shared types.

Each provider adapter (Anthropic, OpenAI, Google) implements LLMClient by
wrapping its native SDK. Caller code uses only this interface so swapping
providers happens at the router layer with zero downstream change.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Literal, Protocol


# Task identifiers used to lookup user's model preference.
# Must match the keys in user_settings.task_models JSONB.
TaskKind = Literal[
    "voice_extract",
    "transcript_translate",
    "transcript_summarize",
    "recreate_content",
    "style_extract",
]


# Block-level content (text / image), provider-agnostic shape.
# Adapters translate to native SDK shape internally.
MessageBlock = dict[str, Any]
Message = dict[str, Any]  # { role: "user" | "assistant", content: list[MessageBlock] | str }


@dataclass
class CallMeta:
    model: str
    provider: str
    input_tokens: int
    output_tokens: int
    cache_read_input_tokens: int
    cache_creation_input_tokens: int
    latency_ms: int
    stop_reason: str | None

    def to_jsonable(self) -> dict[str, Any]:
        return {
            "model": self.model,
            "provider": self.provider,
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


class LLMClient(Protocol):
    """Provider-agnostic chat completion interface."""

    provider: str

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
        """Call the provider's chat API. Returns (raw_response, meta)."""
        ...

    def extract_text(self, response: Any) -> str:
        """Concat assistant text blocks → string."""
        ...
