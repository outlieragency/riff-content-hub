"""Generate carousel slides for a user-uploaded template.

Given a template schema + an idea/summary + slide count, ask Claude to
produce N slides where each slide is a {field_key: value} object matching
the template's field schema exactly.

Uses Anthropic tool_use → no JSON parsing, guaranteed shape.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any

from ...settings import get_settings
from .caching import (
    cached_text_block,
    load_prompt_for_user,
    plain_text_block,
    render_voice_profile,
)
from .client import CallMeta, call_messages, extract_tool_input


SUBMIT_SLIDES_TOOL: dict[str, Any] = {
    "name": "submit_slides",
    "description": (
        "Submit the generated carousel slides. Call exactly once. Each "
        "slide must contain a string value for every key in the template "
        "schema — no missing keys, no extra keys."
    ),
    "input_schema": {
        "type": "object",
        "required": ["slides"],
        "properties": {
            "slides": {
                "type": "array",
                "minItems": 1,
                "maxItems": 12,
                "items": {
                    "type": "object",
                    "description": (
                        "Field values for one slide. Keys must match the "
                        "template schema's `key` fields exactly."
                    ),
                    "additionalProperties": {"type": "string"},
                },
            },
            "carousel_title": {
                "type": "string",
                "maxLength": 80,
                "description": "Short title summarizing this carousel.",
            },
        },
    },
}


@dataclass
class GeneratedSlides:
    slides: list[dict[str, str]]
    title: str
    meta: CallMeta


class SlidesGenerateError(RuntimeError):
    pass


def generate_template_slides(
    *,
    template_schema: list[dict[str, Any]],
    idea: str,
    slide_count: int,
    voice_profile: dict[str, Any] | None = None,
    user_id: str | None = None,
) -> GeneratedSlides:
    """Generate slide_count slides whose keys match template_schema."""
    if not template_schema:
        raise SlidesGenerateError("template_schema ห้ามว่าง")
    if not idea.strip():
        raise SlidesGenerateError("idea ห้ามว่าง")
    if slide_count < 1 or slide_count > 12:
        raise SlidesGenerateError("slide_count ต้องอยู่ในช่วง 1-12")

    settings = get_settings()
    instruction_prompt = load_prompt_for_user(
        "generate-carousel-slides.md", user_id
    )

    # Block 1 (cached): voice profile if provided, else just instructions
    system_blocks: list[dict[str, Any]] = [cached_text_block(instruction_prompt)]
    if voice_profile:
        voice_block_text = render_voice_profile(voice_profile, user_id)
        system_blocks.append(cached_text_block(voice_block_text))

    # User message: schema (cached, reusable across multiple calls for the
    # same template) + idea + count (uncached).
    schema_payload = {
        "template_schema": template_schema,
    }
    schema_text = json.dumps(schema_payload, ensure_ascii=False, indent=2)

    task_text = (
        f"Idea:\n{idea.strip()}\n\n"
        f"Generate exactly {slide_count} slides. Call submit_slides "
        f"with the slides array. Each slide must include every schema key."
    )

    user_messages = [
        {
            "role": "user",
            "content": [
                cached_text_block(schema_text),
                plain_text_block(task_text),
            ],
        }
    ]

    if user_id:
        try:
            from ..llm import call_via_router

            msg, meta = call_via_router(
                user_id=user_id,
                task="carousel_slides_generate",
                system=system_blocks,
                messages=user_messages,
                max_tokens=8000,
                temperature=0.7,
                tools=[SUBMIT_SLIDES_TOOL],
                tool_choice={"type": "tool", "name": "submit_slides"},
            )
        except Exception:
            msg, meta = call_messages(
                model=settings.sonnet_model,
                system=system_blocks,
                messages=user_messages,
                max_tokens=8000,
                temperature=0.7,
                tools=[SUBMIT_SLIDES_TOOL],
                tool_choice={"type": "tool", "name": "submit_slides"},
            )
    else:
        msg, meta = call_messages(
            model=settings.sonnet_model,
            system=system_blocks,
            messages=user_messages,
            max_tokens=8000,
            temperature=0.7,
            tools=[SUBMIT_SLIDES_TOOL],
            tool_choice={"type": "tool", "name": "submit_slides"},
        )

    payload = extract_tool_input(msg, "submit_slides")
    if payload is None:
        raise SlidesGenerateError("AI ไม่ได้เรียก submit_slides")

    raw_slides = payload.get("slides")
    if not isinstance(raw_slides, list) or not raw_slides:
        raise SlidesGenerateError("AI ส่ง slides ว่าง")

    # Coerce to dict[str,str] + ensure every schema key present (fill blank
    # with the schema default rather than crashing — UI will let user fix).
    schema_keys = [f.get("key") for f in template_schema if isinstance(f, dict)]
    defaults = {
        f["key"]: str(f.get("default", ""))
        for f in template_schema
        if isinstance(f, dict) and "key" in f
    }

    coerced: list[dict[str, str]] = []
    for s in raw_slides[:12]:
        if not isinstance(s, dict):
            continue
        slide: dict[str, str] = {}
        for key in schema_keys:
            if not isinstance(key, str):
                continue
            val = s.get(key)
            slide[key] = (
                str(val) if isinstance(val, (str, int, float)) and str(val).strip()
                else defaults.get(key, "")
            )
        coerced.append(slide)

    if not coerced:
        raise SlidesGenerateError("ทุก slide ไม่มี key ที่ตรงกับ schema")

    title = payload.get("carousel_title")
    title_str = title.strip()[:80] if isinstance(title, str) else "Carousel"

    return GeneratedSlides(slides=coerced, title=title_str, meta=meta)
