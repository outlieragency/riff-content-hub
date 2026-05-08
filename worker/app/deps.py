"""Shared dependencies (Anthropic + Supabase clients)."""

from functools import lru_cache

from anthropic import Anthropic
from supabase import Client, create_client

from .settings import get_settings


@lru_cache(maxsize=1)
def get_anthropic() -> Anthropic:
    """Anthropic client with auto-retry for transient errors.

    SDK auto-retries (with exponential backoff) on:
      - 408 Request Timeout
      - 409 Conflict
      - 429 Rate Limit
      - 5xx Server Error
    Up to `max_retries` attempts before propagating the error.
    """
    settings = get_settings()
    return Anthropic(
        api_key=settings.anthropic_api_key,
        max_retries=3,  # 3 retries = ~9s total backoff before final failure
        timeout=120.0,  # individual request timeout — long-form summarize can take 60s+
    )


@lru_cache(maxsize=1)
def get_supabase() -> Client:
    """Service-role client. Bypasses RLS — server-side only."""
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_service_role_key)
