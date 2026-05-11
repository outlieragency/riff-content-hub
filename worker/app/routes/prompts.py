"""Prompt defaults route.

Portal /settings/prompts UI calls this to:
  - list editable prompt keys (curated whitelist)
  - read the on-disk default content for a given key (preview + reset)

User overrides themselves are written/read via Supabase directly from
the portal (table `public.user_prompts`, RLS owner-only). The worker
only exposes the *defaults* because the .md files live in the worker
container, not the portal.
"""

from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

from ..main import require_worker_secret
from ..services.claude.caching import PROMPTS_DIR

router = APIRouter(prefix="/prompts", tags=["prompts"])


# Curated whitelist — only prompts the user can sensibly edit via UI.
# Order matters: appears in this order in the dropdown.
EDITABLE_PROMPTS: list[dict[str, str]] = [
    {
        "key": "recreate-fb-article",
        "label": "FB long-form article",
        "group": "Recreate format",
        "description": "พรอมต์หลักสำหรับสร้าง FB long-form post (recreate flow)",
    },
    {
        "key": "recreate-carousel",
        "label": "IG/FB carousel",
        "group": "Recreate format",
        "description": "พรอมต์สร้าง carousel (multi-slide)",
    },
    {
        "key": "recreate-reels",
        "label": "Short-form / Reels script",
        "group": "Recreate format",
        "description": "พรอมต์สร้างสคริปต์ Reels / TikTok",
    },
    {
        "key": "recreate-yt-script",
        "label": "YouTube long-form script",
        "group": "Recreate format",
        "description": "พรอมต์สร้างสคริปต์ YouTube long-form",
    },
    {
        "key": "fb-cover-variants",
        "label": "FB cover variants",
        "group": "Cover",
        "description": "พรอมต์สร้าง variants ของ FB cover (title + line1-3 + highlights)",
    },
    {
        "key": "fb-headline-craft",
        "label": "Headline craft (reference)",
        "group": "Reference",
        "description": "Reference prompt — สูตร crafting headline แบบไทย",
    },
    {
        "key": "fb-hook-frameworks",
        "label": "Hook frameworks (reference)",
        "group": "Reference",
        "description": "Reference prompt — frameworks ของ hook",
    },
    {
        "key": "fb-personal-experiences",
        "label": "Personal experiences (reference)",
        "group": "Reference",
        "description": "Reference prompt — patterns การเล่าประสบการณ์ส่วนตัว",
    },
    {
        "key": "earth-rati-fb-style",
        "label": "Earth Rati FB style guide",
        "group": "Style",
        "description": "Style guide ของ Earth สำหรับ FB",
    },
    {
        "key": "system_voice_wrapper",
        "label": "Voice profile wrapper",
        "group": "System",
        "description": "Wrapper ที่ใส่ voice_profile_json เข้า system prompt",
    },
]


class PromptListItem(BaseModel):
    key: str
    label: str
    group: str
    description: str


class PromptListResponse(BaseModel):
    items: list[PromptListItem]


class PromptDefaultResponse(BaseModel):
    key: str
    content: str


@router.get("/list", response_model=PromptListResponse)
def list_prompts(
    authorization: str | None = Header(default=None),
) -> PromptListResponse:
    """Curated list of editable prompts (key + label + group)."""
    require_worker_secret(authorization)
    return PromptListResponse(
        items=[PromptListItem(**item) for item in EDITABLE_PROMPTS]
    )


@router.get("/default/{key}", response_model=PromptDefaultResponse)
def get_prompt_default(
    key: str,
    authorization: str | None = Header(default=None),
) -> PromptDefaultResponse:
    """Return on-disk default content for a given prompt key.

    Used by /settings/prompts UI to:
      - preview the original (for diff / reference)
      - implement "Reset to default" (replace user version with this)
    """
    require_worker_secret(authorization)

    allowed = {item["key"] for item in EDITABLE_PROMPTS}
    if key not in allowed:
        raise HTTPException(status_code=404, detail=f"unknown prompt key: {key}")

    path = PROMPTS_DIR / f"{key}.md"
    if not path.exists():
        raise HTTPException(
            status_code=404, detail=f"default file missing on disk: {path.name}"
        )

    return PromptDefaultResponse(key=key, content=path.read_text(encoding="utf-8"))
