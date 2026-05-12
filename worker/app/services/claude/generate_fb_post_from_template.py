"""Generate an FB post (body + cover field values) for a user template.

Sibling of `generate_template_slides.py` but for the fb_post format —
one cover image template + a long-form post body, both generated in
one Anthropic tool_use call.
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


SUBMIT_FB_TEMPLATE_POST_TOOL: dict[str, Any] = {
    "name": "submit_fb_template_post",
    "description": (
        "Submit the generated FB post (long-form body) plus the cover "
        "field values matching the template schema. Call exactly once."
    ),
    "input_schema": {
        "type": "object",
        "required": ["title", "post_body", "thesis", "cover_fields"],
        "properties": {
            "title": {
                "type": "string",
                "maxLength": 80,
                "description": "Short title used as the draft name.",
            },
            "post_body": {
                "type": "string",
                "description": (
                    "Full FB post body, 800-1500 Thai characters, "
                    "paragraphs separated by \\n\\n."
                ),
            },
            "thesis": {
                "type": "string",
                "maxLength": 400,
                "description": "1-2 sentence core argument of the post.",
            },
            "cover_fields": {
                "type": "object",
                "description": (
                    "Field values for the cover template. Keys must match "
                    "the template schema's `key` fields exactly. Every "
                    "schema key MUST be present."
                ),
                "additionalProperties": {"type": "string"},
            },
        },
    },
}


@dataclass
class GeneratedFbPost:
    title: str
    post_body: str
    thesis: str
    cover_fields: dict[str, str]
    meta: CallMeta


class FbPostGenerateError(RuntimeError):
    pass


def generate_fb_post_from_template(
    *,
    template_schema: list[dict[str, Any]],
    idea: str,
    voice_profile: dict[str, Any] | None = None,
    template_writing_prompt: str | None = None,
    user_id: str | None = None,
) -> GeneratedFbPost:
    if not template_schema:
        raise FbPostGenerateError("template_schema ห้ามว่าง")
    if not idea.strip():
        raise FbPostGenerateError("idea ห้ามว่าง")

    settings = get_settings()
    instruction_prompt = load_prompt_for_user(
        "generate-fb-post-from-template.md", user_id
    )

    system_blocks: list[dict[str, Any]] = [
        cached_text_block(instruction_prompt)
    ]
    if voice_profile:
        voice_block_text = render_voice_profile(voice_profile, user_id)
        system_blocks.append(cached_text_block(voice_block_text))

    if template_writing_prompt and template_writing_prompt.strip():
        system_blocks.append(
            {
                "type": "text",
                "text": (
                    "## Template-specific writing guidance\n"
                    "(Layered on top of the global rules above.)\n\n"
                    f"{template_writing_prompt.strip()}"
                ),
            }
        )

    schema_text = json.dumps(
        {"cover_template_schema": template_schema},
        ensure_ascii=False,
        indent=2,
    )
    task_text = (
        f"Idea / source summary:\n{idea.strip()}\n\n"
        "Generate the FB post body + cover field values now via "
        "submit_fb_template_post."
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
                task="fb_post_template_generate",
                system=system_blocks,
                messages=user_messages,
                max_tokens=8000,
                temperature=0.6,
                tools=[SUBMIT_FB_TEMPLATE_POST_TOOL],
                tool_choice={
                    "type": "tool",
                    "name": "submit_fb_template_post",
                },
            )
        except Exception:
            msg, meta = call_messages(
                model=settings.sonnet_model,
                system=system_blocks,
                messages=user_messages,
                max_tokens=8000,
                temperature=0.6,
                tools=[SUBMIT_FB_TEMPLATE_POST_TOOL],
                tool_choice={
                    "type": "tool",
                    "name": "submit_fb_template_post",
                },
            )
    else:
        msg, meta = call_messages(
            model=settings.sonnet_model,
            system=system_blocks,
            messages=user_messages,
            max_tokens=8000,
            temperature=0.6,
            tools=[SUBMIT_FB_TEMPLATE_POST_TOOL],
            tool_choice={
                "type": "tool",
                "name": "submit_fb_template_post",
            },
        )

    payload = extract_tool_input(msg, "submit_fb_template_post")
    if payload is None:
        raise FbPostGenerateError("AI ไม่ได้เรียก submit_fb_template_post")

    title = str(payload.get("title") or "Untitled").strip()[:80]
    post_body = str(payload.get("post_body") or "").strip()
    if not post_body:
        raise FbPostGenerateError("post_body ว่าง")
    thesis = str(payload.get("thesis") or "").strip()[:400]

    raw_cover = payload.get("cover_fields")
    if not isinstance(raw_cover, dict):
        raise FbPostGenerateError("cover_fields ไม่ใช่ object")

    # Coerce — ensure every schema key present, fill blanks from defaults
    defaults = {
        f["key"]: str(f.get("default", ""))
        for f in template_schema
        if isinstance(f, dict) and "key" in f
    }
    cover_fields: dict[str, str] = {}
    for f in template_schema:
        if not isinstance(f, dict) or "key" not in f:
            continue
        key = f["key"]
        val = raw_cover.get(key)
        cover_fields[key] = (
            str(val)
            if isinstance(val, (str, int, float)) and str(val).strip()
            else defaults.get(key, "")
        )

    return GeneratedFbPost(
        title=title,
        post_body=post_body,
        thesis=thesis,
        cover_fields=cover_fields,
        meta=meta,
    )
