"""YouTube transcript fetching via youtube-transcript-api.

API นี้ดึง captions/auto-captions ของวิดีโอโดยไม่ต้อง API key
~85-95% videos works ที่เหลือเป็น disabled-captions, age-restricted, region-locked
ใน MVP ให้ graceful fallback Whisper เป็น Phase 2

Cloud datacenter IPs (Railway, Vercel, AWS, etc.) get blocked by
YouTube. When deploying the worker outside a residential network,
set WEBSHARE_PROXY_USERNAME + WEBSHARE_PROXY_PASSWORD on the host —
this routes the underlying HTTP calls through Webshare residential
proxies and bypasses the block.

Output:
  TranscriptResult ที่ include language detection + raw segments + plain text
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Any

from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import (
    NoTranscriptFound,
    TranscriptsDisabled,
    VideoUnavailable,
)
from youtube_transcript_api.proxies import (
    GenericProxyConfig,
    WebshareProxyConfig,
)

THAI_LANG_CODES = {"th", "th-TH"}


def _build_proxy_config():
    """Pick a proxy config based on env vars (None = no proxy = direct).

    Webshare (preferred when deploying to cloud):
        WEBSHARE_PROXY_USERNAME + WEBSHARE_PROXY_PASSWORD
    Generic HTTP/HTTPS (fallback for any other provider):
        TRANSCRIPT_HTTP_PROXY_URL + TRANSCRIPT_HTTPS_PROXY_URL
    """
    ws_user = os.getenv("WEBSHARE_PROXY_USERNAME", "").strip()
    ws_pass = os.getenv("WEBSHARE_PROXY_PASSWORD", "").strip()
    if ws_user and ws_pass:
        return WebshareProxyConfig(
            proxy_username=ws_user,
            proxy_password=ws_pass,
        )

    http = os.getenv("TRANSCRIPT_HTTP_PROXY_URL", "").strip()
    https = os.getenv("TRANSCRIPT_HTTPS_PROXY_URL", "").strip() or http
    if http or https:
        return GenericProxyConfig(http_url=http or None, https_url=https or None)

    return None


@dataclass
class TranscriptResult:
    language: str
    is_thai: bool
    segments: list[dict[str, Any]]  # [{ text, start, duration }]
    plain_text: str


class TranscriptError(RuntimeError):
    """Raised when transcript cannot be fetched (disabled/missing/blocked)."""


def _segments_to_text(segments: list[dict[str, Any]]) -> str:
    """Concat segments into plain text. Strip music/sound markers."""
    parts: list[str] = []
    for seg in segments:
        text = (seg.get("text") or "").strip()
        if not text:
            continue
        # Skip pure sound markers like [Music] [Applause]
        if text.startswith("[") and text.endswith("]"):
            continue
        parts.append(text)
    return " ".join(parts)


def _select_best_transcript(transcript_list) -> tuple[Any, str]:
    """Prefer Thai → English → first available."""
    # 1. Thai (manual or auto)
    for code in ("th", "th-TH"):
        try:
            return transcript_list.find_transcript([code]), code
        except NoTranscriptFound:
            continue
    # 2. English
    try:
        return transcript_list.find_transcript(["en"]), "en"
    except NoTranscriptFound:
        pass
    # 3. Any auto-generated
    try:
        return transcript_list.find_generated_transcript(["en", "th"]), "en"
    except NoTranscriptFound:
        pass
    # 4. First whatever it finds
    for tr in transcript_list:
        return tr, tr.language_code
    raise TranscriptError("no transcripts available")


def fetch_transcript(youtube_video_id: str) -> TranscriptResult:
    """Fetch transcript by YouTube videoId."""
    api = YouTubeTranscriptApi(proxy_config=_build_proxy_config())
    try:
        transcript_list = api.list(youtube_video_id)
    except TranscriptsDisabled as e:
        raise TranscriptError("captions disabled by uploader") from e
    except VideoUnavailable as e:
        raise TranscriptError("video unavailable") from e
    except Exception as e:  # noqa: BLE001
        raise TranscriptError(f"unable to list transcripts: {e}") from e

    chosen, lang = _select_best_transcript(transcript_list)

    try:
        fetched = chosen.fetch()
    except Exception as e:  # noqa: BLE001
        raise TranscriptError(f"unable to fetch transcript: {e}") from e

    # youtube-transcript-api v1 returns FetchedTranscript wrapping FetchedTranscriptSnippet objects
    # Iterate to coerce to plain dicts for jsonb storage
    seg_dicts: list[dict[str, Any]] = []
    iter_source = fetched if hasattr(fetched, "__iter__") else getattr(fetched, "snippets", [])
    for s in iter_source:
        if isinstance(s, dict):
            seg_dicts.append(
                {
                    "text": s.get("text", ""),
                    "start": s.get("start"),
                    "duration": s.get("duration"),
                }
            )
        else:
            seg_dicts.append(
                {
                    "text": getattr(s, "text", ""),
                    "start": getattr(s, "start", None),
                    "duration": getattr(s, "duration", None),
                }
            )

    return TranscriptResult(
        language=lang,
        is_thai=lang in THAI_LANG_CODES,
        segments=seg_dicts,
        plain_text=_segments_to_text(seg_dicts),
    )
