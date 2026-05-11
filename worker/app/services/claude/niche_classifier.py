"""Classify a YouTube channel into 1-3 of the curated Riff niches.

Single Claude Haiku call. Cheap (~$0.0005/channel) and fast. Called
from the channel-sync flow so freshly-added channels show up tagged
on /discover without manual chip-clicking.
"""

from __future__ import annotations

import json
import re
from typing import Any

from anthropic import Anthropic

# Canonical niche catalog. Mirrors portal/src/lib/niches.ts. Keep in sync
# when adding niches — the IDs must match exactly.
NICHE_CATALOG = [
    ("solopreneur", "Solopreneur, single-person businesses, lean ops, AI leverage"),
    ("ai-tech", "AI/Technology tools, coding, software"),
    ("marketing", "Marketing, sales, copywriting, growth, funnels"),
    (
        "digital-product",
        "Digital products, courses, info-products, Gumroad, course creators",
    ),
    ("self-dev", "Self-development, mindset, philosophy, mental models"),
    ("productivity", "Productivity systems, time management, Notion, second brain"),
    ("business", "General business, entrepreneurship, startups, ops"),
    ("creator-economy", "Creator business, monetizing audience, personal brand"),
    ("finance", "Personal finance, investing, money, FIRE, wealth-building"),
    ("coaching", "Coaching, consulting, expert-as-business, high-ticket services"),
]

NICHE_IDS = {n[0] for n in NICHE_CATALOG}


def _build_system_prompt() -> str:
    lines = ["You classify YouTube creators into niches.", "", "Available niches (id · description):"]
    for nid, desc in NICHE_CATALOG:
        lines.append(f"  {nid} · {desc}")
    lines.extend(
        [
            "",
            "Rules:",
            "- Pick 1-3 niche ids per creator, ordered by relevance (most fitting first).",
            "- Use the exact niche ids (lowercase, dashed).",
            "- If no fit, return [].",
            "- Output JSON only: an array of niche-id strings.",
            "  Example: [\"ai-tech\", \"marketing\"]",
        ]
    )
    return "\n".join(lines)


_SYSTEM_PROMPT = _build_system_prompt()


def classify_channel(
    title: str,
    handle: str | None = None,
    description: str | None = None,
    subscriber_count: int | None = None,
    *,
    model: str = "claude-haiku-4-5",
) -> list[str]:
    """Return niche ids for the channel. Empty list = no confident fit."""
    user_payload = {
        "title": title,
        "handle": handle,
        "description": (description or "")[:800],
        "subscribers": subscriber_count,
    }
    client = Anthropic()
    msg = client.messages.create(
        model=model,
        max_tokens=200,
        system=_SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": "Classify this creator:\n\n"
                + json.dumps(user_payload, ensure_ascii=False, indent=2),
            }
        ],
    )
    raw = msg.content[0].text.strip()

    # Strip ```json fences if Claude wraps the answer
    fence = re.match(r"^```(?:json)?\s*\n(.*?)\n```\s*$", raw, flags=re.DOTALL)
    if fence:
        raw = fence.group(1).strip()

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return []
    if not isinstance(data, list):
        return []
    return [
        x for x in data
        if isinstance(x, str) and x.lower() in NICHE_IDS
    ][:3]


def classify_channel_row(sb: Any, channel_id: str, user_id: str) -> list[str]:
    """Look up channel by id, classify, persist niches. Returns the saved list."""
    res = (
        sb.table("channels")
        .select("title, handle, description, subscriber_count")
        .eq("id", channel_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    if not res.data:
        return []
    ch = res.data[0]
    niches = classify_channel(
        title=ch.get("title") or "",
        handle=ch.get("handle"),
        description=ch.get("description"),
        subscriber_count=ch.get("subscriber_count"),
    )
    sb.table("channels").update({"niches": niches}).eq("id", channel_id).eq(
        "user_id", user_id
    ).execute()
    return niches
