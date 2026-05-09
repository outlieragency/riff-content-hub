"""Translate non-Thai transcripts to Thai (Haiku 4.5).

Why Haiku: translation = bounded transformation task ที่ Haiku ทำได้ดีในราคาถูก 5x
Cache: prompt template เป็น cache prefix transcript ใส่ใน user block
"""

from __future__ import annotations

from dataclasses import dataclass

from ...settings import get_settings
from .caching import cached_text_block, load_prompt
from .client import CallMeta, call_messages, extract_text


@dataclass
class TranslateResult:
    text: str
    meta: CallMeta


def translate_to_thai(
    source_text: str,
    user_id: str | None = None,
) -> TranslateResult:
    if not source_text.strip():
        raise ValueError("source_text ห้ามว่าง")

    settings = get_settings()
    prompt_template = load_prompt("translate-th.md")

    system_blocks = [cached_text_block(prompt_template)]
    user_messages = [
        {
            "role": "user",
            "content": [
                cached_text_block(source_text),
                {
                    "type": "text",
                    "text": "Output the Thai translation now. Plain text only, no commentary.",
                },
            ],
        }
    ]

    if user_id:
        try:
            from ..llm import call_via_router

            msg, meta = call_via_router(
                user_id=user_id,
                task="transcript_translate",
                system=system_blocks,
                messages=user_messages,
                max_tokens=8000,
                temperature=0.3,
            )
        except Exception:
            msg, meta = call_messages(
                model=settings.haiku_model,
                system=system_blocks,
                messages=user_messages,
                max_tokens=8000,
                temperature=0.3,
            )
    else:
        msg, meta = call_messages(
            model=settings.haiku_model,
            system=system_blocks,
            messages=user_messages,
            max_tokens=8000,
            temperature=0.3,
        )
    return TranslateResult(text=extract_text(msg).strip(), meta=meta)
