"""Creative style HTTP routes (called by portal).

POST /styles/extract — รับ image URLs (Supabase Storage public) → return CreativeStyle JSON

CRUD ของ creative_styles ทำผ่าน portal server actions (Supabase client) โดยตรง
เพราะเป็น metadata table ธรรมดา ไม่ต้องผ่าน worker
"""

from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

from ..main import require_worker_secret
from ..services.claude.extract_style import (
    StyleExtractError,
    StyleReference,
    extract_creative_style,
)

router = APIRouter(prefix="/styles", tags=["styles"])


class StyleReferenceIn(BaseModel):
    image_url: str = Field(..., min_length=8)
    label: str | None = None


class ExtractStyleRequest(BaseModel):
    user_id: str = Field(..., description="auth.users.id ของผู้สั่ง extract")
    references: list[StyleReferenceIn] = Field(..., min_length=1, max_length=12)
    format_type: str = Field(default="cover", description="cover | carousel")


class ExtractStyleResponse(BaseModel):
    creative_style: dict
    meta: dict


@router.post("/extract", response_model=ExtractStyleResponse)
def post_extract_style(
    body: ExtractStyleRequest,
    authorization: str | None = Header(default=None),
) -> ExtractStyleResponse:
    require_worker_secret(authorization)

    refs = [
        StyleReference(image_url=r.image_url, label=r.label) for r in body.references
    ]

    try:
        result = extract_creative_style(refs)
    except StyleExtractError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"anthropic error: {exc}") from exc

    return ExtractStyleResponse(
        creative_style=result.creative_style,
        meta=result.meta.to_jsonable(),
    )
