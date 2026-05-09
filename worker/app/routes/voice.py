"""Voice profile HTTP routes (called by portal).

POST /voice/extract  — รับ samples → return VoiceProfile JSON + cache meta
"""

from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

from ..main import require_worker_secret
from ..services.claude.voice_extract import (
    VoiceExtractError,
    VoiceSample,
    extract_voice_profile,
)

router = APIRouter(prefix="/voice", tags=["voice"])


class SampleIn(BaseModel):
    text: str = Field(..., min_length=20)
    type: str | None = None
    date: str | None = None


class ExtractVoiceRequest(BaseModel):
    user_id: str = Field(..., description="auth.users.id ของผู้สั่ง extract")
    samples: list[SampleIn] = Field(..., min_length=1, max_length=20)


class ExtractVoiceResponse(BaseModel):
    voice_profile: dict
    meta: dict


@router.post("/extract", response_model=ExtractVoiceResponse)
def post_extract_voice(
    body: ExtractVoiceRequest,
    authorization: str | None = Header(default=None),
) -> ExtractVoiceResponse:
    require_worker_secret(authorization)

    samples = [
        VoiceSample(text=s.text, type=s.type, date=s.date) for s in body.samples
    ]

    try:
        result = extract_voice_profile(samples, user_id=body.user_id)
    except VoiceExtractError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"anthropic error: {exc}") from exc

    return ExtractVoiceResponse(
        voice_profile=result.voice_profile,
        meta=result.meta.to_jsonable(),
    )
