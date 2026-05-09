"""LLM provider abstraction.

Phase 1: Anthropic adapter functional, OpenAI/Google/OpenRouter = stubs.

Public API:
  - LLMClient (Protocol)
  - get_client_for_task(user_id, task) -> (LLMClient, model_id)
  - TaskKind enum-like

The router resolves user's per-task model preference (from user_settings),
falls back to system default (Anthropic env-based) if not configured.
"""

from .base import CallMeta, LLMClient, Message, MessageBlock, TaskKind
from .router import get_client_for_task, resolve_model_for_task

__all__ = [
    "CallMeta",
    "LLMClient",
    "Message",
    "MessageBlock",
    "TaskKind",
    "get_client_for_task",
    "resolve_model_for_task",
]
