"""Smoke test: render TrendTech-portrait cover via Riff worker's cover_render service.

Run:
    cd worker && ./.venv/bin/python tests/smoke_cover_render.py

Outputs to /tmp/riff-smoke-cover.png — open in Preview to verify visually.
"""

from __future__ import annotations

import sys
from pathlib import Path

# Make `app` importable
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.services.cover_render import render_cover_bytes  # noqa: E402


def main() -> int:
    # Ryan Mathews "Alex Hormozi's Ad Strategy But Make It AI" — same data we tested fb-content-agent with
    png = render_cover_bytes(
        video_id="xJ99dBYhpRI",
        thumbnail_url="https://i.ytimg.com/vi/xJ99dBYhpRI/maxresdefault.jpg",
        channel_name="Ryan Mathews",
        channel_avatar_url=None,
        subscriber_count=18700,
        line1="ทำ ROAS 12.43 เท่าจาก Ad ตัวเดียว",
        line1_highlight="ROAS 12.43 เท่า",
        line2="ด้วยการสร้าง AI Loop จาก Hormozi",
        line2_highlight="AI Loop จาก Hormozi",
        line3="feedback loop ที่ฉลาดขึ้นเอง",
        line3_highlight="ฉลาดขึ้นเอง",
        subhead="Ryan build AI ที่ feed Instagram + Meta + Hyros เข้า Claude Code ให้เรียนจาก data",
        arrow_caption_top="ใช้ Hormozi สูตรใหม่ + AI",
        arrow_caption_bottom="ROAS 12.43 เท่า",
        arrow_position="bottom-left",
        cover_template="trendtech-portrait",
    )

    out = Path("/tmp/riff-smoke-cover.png")
    out.write_bytes(png)
    print(f"✓ rendered {len(png)} bytes → {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
