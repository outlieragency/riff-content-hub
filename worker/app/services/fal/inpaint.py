"""fal.ai image-to-image — used to clean YouTube thumbnails before they
land in the FB cover.

YT thumbnails routinely carry text overlays, channel logos, and
watermarks. Earth's pre-Riff workflow:
  download thumbnail → ChatGPT resize → ChatGPT remove text → upload

This module replaces step 3 (text removal) with a single fal.ai call,
so the cropper UI can offer a 'Clean text' button.

Model: fal-ai/flux/dev/image-to-image — Flux dev at low strength.
Low strength (0.35) preserves the subject + pose; the prompt drives
the model to drop text overlays. Empirically the best trade between
cost (~$0.025/call) and accuracy for this use case.
"""

from __future__ import annotations

import os
from typing import Any

import httpx

FAL_BASE = "https://fal.run"
DEFAULT_MODEL = "fal-ai/flux/dev/image-to-image"

CLEAN_TEXT_PROMPT = (
    "the same exact photo but with all text overlays, captions, watermarks, "
    "channel logos, subscribe buttons, and graphic embellishments removed. "
    "preserve the subject's face, pose, expression, clothing, and the "
    "overall composition exactly. clean background. photorealistic. "
    "no text. no logos. no graphics."
)


class FalError(RuntimeError):
    pass


def _api_key() -> str:
    key = os.getenv("FAL_API_KEY", "").strip()
    if not key:
        raise FalError("FAL_API_KEY not set on worker — cannot clean thumbnail")
    return key


def remove_text_from_image_url(
    image_url: str,
    *,
    strength: float = 0.35,
    timeout: float = 90.0,
    model: str | None = None,
) -> str:
    """Submit image_url, return URL of the cleaned image.

    Synchronous call against `fal.run/{model}`. Raises FalError on any
    non-2xx response so the caller can surface a clean error message.

    `strength` controls how much the model can diverge from the original.
    0.35 keeps the subject recognizable; higher loses fidelity, lower
    barely changes anything.
    """
    key = _api_key()
    chosen_model = model or DEFAULT_MODEL
    url = f"{FAL_BASE}/{chosen_model}"
    payload: dict[str, Any] = {
        "image_url": image_url,
        "prompt": CLEAN_TEXT_PROMPT,
        "strength": strength,
        "num_inference_steps": 30,
        "guidance_scale": 5.0,
        "num_images": 1,
        "enable_safety_checker": False,
    }
    try:
        res = httpx.post(
            url,
            headers={
                "Authorization": f"Key {key}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=timeout,
        )
    except httpx.HTTPError as e:
        raise FalError(f"fal.ai request failed: {e}") from e

    if res.status_code >= 400:
        try:
            body = res.json()
            detail = body.get("detail") or body.get("error") or res.text[:300]
        except Exception:  # noqa: BLE001
            detail = res.text[:300]
        raise FalError(f"fal.ai {res.status_code}: {detail}")

    data = res.json()
    images = data.get("images") or []
    if not images:
        raise FalError(f"fal.ai returned no images: {str(data)[:300]}")
    cleaned_url = images[0].get("url")
    if not cleaned_url:
        raise FalError("fal.ai response missing image url")
    return cleaned_url


def download_image_bytes(url: str, *, timeout: float = 30.0) -> bytes:
    """Fetch the cleaned image from fal's CDN as raw bytes for Storage upload."""
    res = httpx.get(url, timeout=timeout, follow_redirects=True)
    res.raise_for_status()
    return res.content
