"""Parse carousel template from screenshot via Claude vision.

Input: image URL (public bucket) → Claude Sonnet 4.6 multimodal call
Output: Jinja2 HTML template + JSON schema + default theme

Uses Anthropic tool_use to guarantee structured output — no JSON parsing.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from ...settings import get_settings
from .caching import cached_text_block, load_prompt_for_user
from .client import CallMeta, call_messages, extract_tool_input


PARSE_TEMPLATE_TOOL: dict[str, Any] = {
    "name": "submit_template",
    "description": (
        "Submit the parsed carousel template. Call exactly once with the "
        "Jinja2 HTML, the editable field schema, and the default theme."
    ),
    "input_schema": {
        "type": "object",
        "required": ["html", "schema", "theme", "name_suggestion"],
        "properties": {
            "html": {
                "type": "string",
                "description": (
                    "Complete standalone HTML document with inline <style>. "
                    "Body contains a single .slide root at 1080×1350. "
                    "Editable text uses {{ field_key }} Jinja2 placeholders. "
                    "Theme uses {{ theme.bg }}, {{ theme.fg }}, {{ theme.accent }}, "
                    "{{ theme.font_heading }}, {{ theme.font_body }}."
                ),
            },
            "schema": {
                "type": "array",
                "minItems": 1,
                "maxItems": 8,
                "description": "Editable fields in the template, in display order.",
                "items": {
                    "type": "object",
                    "required": ["key", "type", "label", "default"],
                    "properties": {
                        "key": {
                            "type": "string",
                            "description": "Jinja2 variable name (snake_case)",
                        },
                        "type": {
                            "type": "string",
                            "enum": ["text", "longtext", "image"],
                            "description": (
                                "text/longtext = editable string. "
                                "image = URL of an <img> element; default "
                                "MUST be a working https://placehold.co URL."
                            ),
                        },
                        "label": {"type": "string"},
                        "default": {
                            "type": "string",
                            "description": (
                                "Realistic example value. For image fields, "
                                "a working placehold.co URL. Never empty."
                            ),
                        },
                        "max_chars": {"type": "integer", "minimum": 1},
                    },
                },
            },
            "theme": {
                "type": "object",
                "required": ["bg", "fg", "font_heading", "font_body"],
                "properties": {
                    "bg": {
                        "type": "string",
                        "description": "Background color hex like #F4EFE6",
                    },
                    "fg": {
                        "type": "string",
                        "description": "Main text color hex",
                    },
                    "accent": {
                        "type": "string",
                        "description": "Accent / highlight color hex",
                    },
                    "font_heading": {
                        "type": "string",
                        "description": "Google Font family name for headings",
                    },
                    "font_body": {
                        "type": "string",
                        "description": "Google Font family name for body text",
                    },
                },
            },
            "name_suggestion": {
                "type": "string",
                "maxLength": 60,
                "description": "Short descriptive name for this template",
            },
        },
    },
}


@dataclass
class ParsedTemplate:
    html: str
    schema: list[dict[str, Any]]
    theme: dict[str, str]
    name_suggestion: str
    meta: CallMeta


class TemplateParseError(RuntimeError):
    pass


def parse_template_from_image(
    image_url: str,
    user_id: str | None = None,
) -> ParsedTemplate:
    """Parse one carousel slide screenshot into a reusable template.

    `image_url` must be a public URL Anthropic can fetch (e.g. Supabase
    storage public bucket).
    """
    if not image_url.strip():
        raise TemplateParseError("image_url ห้ามว่าง")

    settings = get_settings()
    prompt_text = load_prompt_for_user("parse-carousel-template.md", user_id)

    system_blocks = [cached_text_block(prompt_text)]
    user_messages = [
        {
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {"type": "url", "url": image_url},
                },
                {
                    "type": "text",
                    "text": (
                        "Analyze the carousel slide above. Call submit_template "
                        "with the Jinja2 HTML, field schema, theme, and name."
                    ),
                },
            ],
        }
    ]

    if user_id:
        try:
            from ..llm import call_via_router

            msg, meta = call_via_router(
                user_id=user_id,
                task="carousel_template_parse",
                system=system_blocks,
                messages=user_messages,
                max_tokens=8000,
                temperature=0.3,
                tools=[PARSE_TEMPLATE_TOOL],
                tool_choice={"type": "tool", "name": "submit_template"},
            )
        except Exception:
            msg, meta = call_messages(
                model=settings.sonnet_model,
                system=system_blocks,
                messages=user_messages,
                max_tokens=8000,
                temperature=0.3,
                tools=[PARSE_TEMPLATE_TOOL],
                tool_choice={"type": "tool", "name": "submit_template"},
            )
    else:
        msg, meta = call_messages(
            model=settings.sonnet_model,
            system=system_blocks,
            messages=user_messages,
            max_tokens=8000,
            temperature=0.3,
            tools=[PARSE_TEMPLATE_TOOL],
            tool_choice={"type": "tool", "name": "submit_template"},
        )

    payload = extract_tool_input(msg, "submit_template")
    if payload is None:
        raise TemplateParseError(
            "AI ไม่ได้เรียก submit_template — อาจ image โหลดไม่ได้"
        )

    html = payload.get("html")
    schema = payload.get("schema")
    theme = payload.get("theme")
    name = payload.get("name_suggestion") or "Untitled template"

    if not isinstance(html, str) or "{{" not in html:
        raise TemplateParseError("html ที่ได้ไม่มี Jinja2 placeholder")
    if not isinstance(schema, list) or not schema:
        raise TemplateParseError("schema ว่าง")
    if not isinstance(theme, dict):
        raise TemplateParseError("theme ไม่ใช่ object")

    return ParsedTemplate(
        html=html,
        schema=schema,
        theme=theme,
        name_suggestion=name.strip()[:60],
        meta=meta,
    )
