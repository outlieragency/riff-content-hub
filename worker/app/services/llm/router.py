"""LLM router — resolve user's per-task model preference + adapter.

Lookup order:
  1. user_settings.task_models[task] — explicit user choice
  2. DEFAULT_MODELS[task] — system fallback (current Anthropic models)

API key lookup order:
  1. user_settings.provider_keys_encrypted[provider] (decrypted)
  2. system env (only for anthropic — Phase 1 fallback)
  3. raise NotConfiguredError

This module is the only place that reads user_settings.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Any

from supabase import Client

from ...deps import get_supabase
from ...settings import get_settings
from .anthropic_adapter import AnthropicAdapter
from .base import LLMClient, TaskKind


class NotConfiguredError(RuntimeError):
    """Raised when no API key available for the resolved provider."""


# Default models per task — current Riff behavior
DEFAULT_MODELS: dict[str, str] = {
    "voice_extract": "claude-haiku-4-5",
    "transcript_translate": "claude-haiku-4-5",
    "transcript_summarize": "claude-sonnet-4-6",
    "recreate_content": "claude-sonnet-4-6",
    "style_extract": "claude-sonnet-4-6",
}


def _provider_from_model_id(model_id: str) -> str:
    """Infer provider from model id prefix."""
    if model_id.startswith("claude") or "claude-" in model_id:
        return "anthropic"
    if model_id.startswith("gpt") or model_id.startswith("o1") or model_id.startswith("o3"):
        return "openai"
    if model_id.startswith("gemini") or model_id.startswith("models/gemini"):
        return "google"
    if "/" in model_id:  # OpenRouter style: anthropic/claude-3-5-sonnet
        return "openrouter"
    # Default to anthropic for unknown
    return "anthropic"


def _load_user_settings(sb: Client, user_id: str) -> dict[str, Any]:
    """Load user_settings row. Returns empty dict if not found (system defaults)."""
    res = (
        sb.table("user_settings")
        .select("task_models, provider_keys_encrypted")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    if not res.data:
        return {}
    return res.data[0]


def _decrypt_provider_key(sb: Client, encrypted: str | None) -> str | None:
    """Decrypt a provider key via DB function. None if encrypted is empty/null."""
    if not encrypted:
        return None
    try:
        res = sb.rpc("decrypt_secret", {"ciphertext": encrypted}).execute()
        return res.data if res.data else None
    except Exception:
        return None


def resolve_model_for_task(user_id: str, task: TaskKind) -> str:
    """Just resolve the model id (no client construction)."""
    sb = get_supabase()
    settings_row = _load_user_settings(sb, user_id)
    task_models = settings_row.get("task_models") or {}
    chosen = task_models.get(task)
    if isinstance(chosen, str) and chosen:
        return chosen
    return DEFAULT_MODELS[task]


def get_client_for_task(user_id: str, task: TaskKind) -> tuple[LLMClient, str]:
    """Resolve provider+model+key → return (client, model_id).

    Phase 1 fallback: if user_settings has no Anthropic key, use system env key.
    For OpenAI/Google: must come from user_settings (no system fallback).
    """
    sb = get_supabase()
    settings_row = _load_user_settings(sb, user_id)
    task_models = settings_row.get("task_models") or {}
    model = task_models.get(task) or DEFAULT_MODELS[task]
    provider = _provider_from_model_id(model)

    # Resolve API key
    encrypted_keys = settings_row.get("provider_keys_encrypted") or {}
    encrypted = encrypted_keys.get(provider) if isinstance(encrypted_keys, dict) else None
    api_key = _decrypt_provider_key(sb, encrypted)

    if not api_key:
        if provider == "anthropic":
            api_key = get_settings().anthropic_api_key
        else:
            raise NotConfiguredError(
                f"{provider} API key ยังไม่ได้ตั้งค่า — ไปที่ /settings → AI Providers"
            )

    return _create_adapter(provider, api_key), model


def _create_adapter(provider: str, api_key: str) -> LLMClient:
    if provider == "anthropic":
        return _get_or_create_anthropic(api_key)
    if provider == "openai":
        from .openai_adapter import OpenAIAdapter

        return OpenAIAdapter(api_key)
    if provider == "google":
        from .google_adapter import GoogleAdapter

        return GoogleAdapter(api_key)
    if provider == "openrouter":
        # OpenRouter is OpenAI-compatible — when implemented, reuse OpenAIAdapter with custom base_url
        from .openai_adapter import OpenAIAdapter

        return OpenAIAdapter(api_key)
    raise NotConfiguredError(f"unknown provider: {provider}")


@lru_cache(maxsize=8)
def _get_or_create_anthropic(api_key: str) -> AnthropicAdapter:
    """Cache Anthropic adapter per unique API key (avoid re-creating SDK).

    LRU bounded so multi-tenant doesn't leak — older keys evicted.
    """
    return AnthropicAdapter(api_key)
