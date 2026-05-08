"""Worker configuration loaded from environment."""

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    anthropic_api_key: str = Field(..., alias="ANTHROPIC_API_KEY")
    youtube_api_key: str = Field(..., alias="YOUTUBE_API_KEY")

    supabase_url: str = Field(..., alias="SUPABASE_URL")
    supabase_service_role_key: str = Field(..., alias="SUPABASE_SERVICE_ROLE_KEY")

    worker_secret: str = Field(..., alias="WORKER_SECRET")

    sonnet_model: str = Field("claude-sonnet-4-6", alias="ANTHROPIC_SONNET_MODEL")
    haiku_model: str = Field("claude-haiku-4-5", alias="ANTHROPIC_HAIKU_MODEL")

    # Notion config (optional — only needed for /notion/push route).
    # Single-tenant Phase 1; in Phase 3 multi-tenant these will be per-user.
    notion_token: str | None = Field(None, alias="NOTION_TOKEN")
    notion_content_hub_dsid: str | None = Field(None, alias="NOTION_CONTENT_HUB_DSID")
    notion_output_tracker_dsid: str | None = Field(None, alias="NOTION_OUTPUT_TRACKER_DSID")

    port: int = Field(8000, alias="PORT")
    log_level: str = Field("info", alias="LOG_LEVEL")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
