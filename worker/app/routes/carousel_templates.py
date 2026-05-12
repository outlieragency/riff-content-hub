"""Carousel template routes.

Endpoints:
  POST /carousel-templates/parse        — image URL → AI vision → template
  POST /carousel-templates/render-html  — Jinja2 → HTML (live preview)
  POST /carousel-templates/render-png   — Jinja2 → PNG bytes (final)

Storage of templates themselves lives in `public.carousel_templates`
and is managed directly from the portal via Supabase (RLS owner-only).
This worker only does the heavy lifting that can't run in the browser:
Anthropic vision + Playwright rendering.
"""

from __future__ import annotations

import asyncio
import io
import zipfile

from fastapi import APIRouter, Header, HTTPException, Response
from pydantic import BaseModel, Field

from ..main import require_worker_secret
from ..services.carousel_template_render import (
    TemplateRenderError,
    render_template_html,
    render_template_png,
    render_template_pngs,
)
from ..services.claude.generate_template_slides import (
    SlidesGenerateError,
    generate_template_slides,
)
from ..services.claude.parse_carousel_template import (
    TemplateParseError,
    parse_template_from_image,
)

router = APIRouter(prefix="/carousel-templates", tags=["carousel-templates"])


# ====================================================================
# /parse — Claude vision: image → Jinja2 HTML + schema + theme
# ====================================================================


class ParseRequest(BaseModel):
    user_id: str = Field(..., description="auth.users.id")
    image_url: str = Field(
        ..., description="Public URL of the uploaded screenshot"
    )


class ParseResponse(BaseModel):
    html: str
    fields_schema: list[dict] = Field(..., alias="schema")
    theme: dict
    name_suggestion: str
    meta: dict

    model_config = {"populate_by_name": True}


@router.post("/parse", response_model=ParseResponse, response_model_by_alias=True)
async def post_parse_template(
    body: ParseRequest,
    authorization: str | None = Header(default=None),
) -> ParseResponse:
    require_worker_secret(authorization)
    try:
        parsed = await asyncio.to_thread(
            parse_template_from_image,
            body.image_url,
            body.user_id,
        )
    except TemplateParseError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=502, detail=f"vision parse error: {exc}"
        ) from exc

    return ParseResponse.model_validate(
        {
            "html": parsed.html,
            "schema": parsed.schema,
            "theme": parsed.theme,
            "name_suggestion": parsed.name_suggestion,
            "meta": parsed.meta.to_jsonable(),
        }
    )


# ====================================================================
# /render-html — fast Jinja2 render for live iframe preview
# ====================================================================


class RenderHtmlRequest(BaseModel):
    html_template: str = Field(..., min_length=20)
    fields: dict = Field(default_factory=dict)
    theme: dict = Field(default_factory=dict)


class RenderHtmlResponse(BaseModel):
    html: str
    width: int = 1080
    height: int = 1350


@router.post("/render-html", response_model=RenderHtmlResponse)
def post_render_html(
    body: RenderHtmlRequest,
    authorization: str | None = Header(default=None),
) -> RenderHtmlResponse:
    require_worker_secret(authorization)
    try:
        html = render_template_html(
            html_template=body.html_template,
            fields=body.fields,
            theme=body.theme,
        )
    except TemplateRenderError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    return RenderHtmlResponse(html=html)


# ====================================================================
# /render-png — Playwright screenshot of one slide (for final + thumbnails)
# ====================================================================


class RenderPngRequest(BaseModel):
    html_template: str = Field(..., min_length=20)
    fields: dict = Field(default_factory=dict)
    theme: dict = Field(default_factory=dict)
    width: int = 1080
    height: int = 1350


@router.post("/render-png")
async def post_render_png(
    body: RenderPngRequest,
    authorization: str | None = Header(default=None),
) -> Response:
    require_worker_secret(authorization)
    try:
        png = await asyncio.to_thread(
            render_template_png,
            html_template=body.html_template,
            fields=body.fields,
            theme=body.theme,
            width=body.width,
            height=body.height,
        )
    except TemplateRenderError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=502, detail=f"playwright error: {exc}"
        ) from exc

    return Response(content=png, media_type="image/png")


# ====================================================================
# /generate-slides — AI fills the template schema with content from an idea
# ====================================================================


class GenerateSlidesRequest(BaseModel):
    user_id: str = Field(..., description="auth.users.id")
    template_schema: list[dict] = Field(..., min_length=1)
    idea: str = Field(..., min_length=10, max_length=8000)
    slide_count: int = Field(default=5, ge=1, le=12)
    voice_profile: dict | None = None


class GenerateSlidesResponse(BaseModel):
    slides: list[dict[str, str]]
    title: str
    meta: dict


@router.post("/generate-slides", response_model=GenerateSlidesResponse)
async def post_generate_slides(
    body: GenerateSlidesRequest,
    authorization: str | None = Header(default=None),
) -> GenerateSlidesResponse:
    require_worker_secret(authorization)
    try:
        result = await asyncio.to_thread(
            generate_template_slides,
            template_schema=body.template_schema,
            idea=body.idea,
            slide_count=body.slide_count,
            voice_profile=body.voice_profile,
            user_id=body.user_id,
        )
    except SlidesGenerateError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=502, detail=f"anthropic error: {exc}"
        ) from exc

    return GenerateSlidesResponse(
        slides=result.slides,
        title=result.title,
        meta=result.meta.to_jsonable(),
    )


# ====================================================================
# /render-pngs-zip — batch render N slides → return ZIP
# ====================================================================


class RenderPngsZipRequest(BaseModel):
    html_template: str = Field(..., min_length=20)
    slides: list[dict] = Field(..., min_length=1, max_length=20)
    theme: dict = Field(default_factory=dict)
    width: int = 1080
    height: int = 1350
    filename_prefix: str = "slide"


@router.post("/render-pngs-zip")
async def post_render_pngs_zip(
    body: RenderPngsZipRequest,
    authorization: str | None = Header(default=None),
) -> Response:
    """Render every slide and bundle into one ZIP, named slide-01.png etc."""
    require_worker_secret(authorization)

    try:
        pngs = await asyncio.to_thread(
            render_template_pngs,
            html_template=body.html_template,
            slides=body.slides,
            theme=body.theme,
            width=body.width,
            height=body.height,
        )
    except TemplateRenderError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=502, detail=f"playwright error: {exc}"
        ) from exc

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_STORED) as zf:
        for i, png in enumerate(pngs, start=1):
            zf.writestr(f"{body.filename_prefix}-{i:02d}.png", png)
    buf.seek(0)

    return Response(
        content=buf.getvalue(),
        media_type="application/zip",
        headers={
            "Content-Disposition": (
                f'attachment; filename="{body.filename_prefix}-slides.zip"'
            )
        },
    )
