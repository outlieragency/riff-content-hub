"""Smoke test: fb_article _coerce → render_and_upload_cover_for_draft pipeline.

Validates Phase 1.3:
  1. _coerce parses new schema correctly (cover sub-object, post_body, slot placeholders)
  2. Style compliance validator returns expected warnings
  3. render_and_upload_cover_for_draft with real Supabase service-role
  4. Cover ends up at fb-covers/{user_id}/{draft_id}/cover.png with valid public URL

Run:
    cd worker && ./.venv/bin/python tests/smoke_fb_article_pipeline.py
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

# Load .env
env_path = Path(__file__).resolve().parent.parent / ".env"
if env_path.exists():
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        os.environ.setdefault(k, v.strip().strip('"').strip("'"))

from supabase import create_client  # noqa: E402

from app.services.claude.recreate.fb_article import (  # noqa: E402
    _coerce,
    _validate_style_compliance,
    render_and_upload_cover_for_draft,
)

# A canned response that simulates what Claude would return per recreate-fb-article.md spec
SAMPLE_LLM_OUTPUT = {
    "title": "Patrick Dang สอน 5-step framework สร้าง 1-Person Business",
    "thesis": "Patrick Dang สอน 5-step framework สร้าง 1-Person Business ด้วย Claude AI",
    "cover": {
        "hook_framework": "B",
        "headline_pattern": "TT",
        "cover_template": "trendtech-portrait",
        "color_theme": "trendtech",
        "line1": "เซ็นลูกค้า AI $5,500 ต่อเดือน",
        "line1_highlight": "$5,500 ต่อเดือน",
        "line2": "ของแม่บ้าน + ทำงานประจำ + ลูก 3 คน",
        "line2_highlight": "แม่บ้าน + ทำงานประจำ",
        "line3": "ตามวิธีของ Patrick Dang ใน 21 วัน",
        "line3_highlight": "วิธีของ Patrick Dang",
        "subhead": "Patrick Dang อดีต Silicon Valley sales เผยกระบวนการสร้าง 1-Person Business",
        "arrow_caption_top": "เปลี่ยนจาก 0 เป็น AI agency",
        "arrow_caption_bottom": "$5,500 ต่อเดือน",
        "arrow_position": "bottom-left",
    },
    "post_body": (
        "เซ็นลูกค้า AI $5,500/เดือนได้ ทั้งที่ยังทำงานประจำ + ดูแลลูก 3 คน ด้วย 5-step framework\n"
        "(จาก Silicon Valley sales ที่ลาออกมาอยู่เวียดนาม)\n"
        ".\n"
        "ผมไปเจอคลิปของ Patrick Dang ผู้ติดตาม 3.7 แสนคน...\n"
        ".\n"
        "Patrick บอกว่า AI ไม่สามารถ launch หรือ land rocket ได้\n"
        ".\n"
        "วันนี้เอิร์ธจะพามาดู 5 step เต็ม\n"
        "#อ่านจบปุ๊ปเก่งขึ้นปั๊ป\n"
        "==========\n"
        "[1] Launch and Land the Rocket\n"
        ".\n"
        "Patrick พูดประโยคนึงในคลิป...\n"
        "==========\n"
        "[2] หาไอเดียธุรกิจด้วย Skill x Passion x Profit\n"
        ".\n"
        "ปัญหาคือ คนที่มี potential สูงมักจะ freeze...\n"
        "==========\n"
        "#สรุ๊ปสรุป\n"
        "- Launch and Land the Rocket คนตั้ง vision + curate AI ทำงานตรงกลาง\n"
        "- Niche of One หา idea จาก Skills x Passion x Profit ที่ overlap\n"
        "- Personal Brand First positioning ต้องมาก่อน content\n"
        "==========\n"
        "#ความเห็นฉบับเอิร์ธ\n"
        "ผมว่าจุดที่ Patrick พูดเรื่อง launch and land the rocket คือ insight สำคัญ\n"
        ".\n"
        "[ผู้เขียนใส่ CTA ของตัวเองตรงนี้]\n"
        ".\n"
        "หวังว่าโพสต์นี้จะมีประโยชน์กับทุกคนนะครับผม"
    ),
    "section_count": 2,
}


def main() -> int:
    print("=== Phase 1.3 smoke test ===\n")

    # 1. Test _coerce
    print("→ Test _coerce parses new schema...")
    try:
        out = _coerce(SAMPLE_LLM_OUTPUT)
        assert out["title"]
        assert out["cover"]["line1"] == "เซ็นลูกค้า AI $5,500 ต่อเดือน"
        assert out["cover"]["line1_highlight"] == "$5,500 ต่อเดือน"
        assert out["cover"]["arrow_position"] == "bottom-left"
        assert out["section_count"] == 2
        assert "[ผู้เขียนใส่ CTA" in out["post_body"]
        print(f"   ✓ parsed; title='{out['title']}'")
    except Exception as e:
        print(f"   ✗ _coerce failed: {e}")
        return 1

    # 2. Test style validator
    print("→ Test style compliance validator...")
    warnings = _validate_style_compliance(out["post_body"])
    print(f"   ✓ warnings (expected 0 for compliant body): {warnings}")
    if warnings:
        print(f"   ⚠ unexpected warnings: {warnings}")

    # Test detection: alter body to MISSING signature, expect warning
    bad_body = out["post_body"].replace("หวังว่าโพสต์นี้จะมีประโยชน์กับทุกคนนะครับผม", "")
    bad_warnings = _validate_style_compliance(bad_body)
    assert any("missing required signature" in w for w in bad_warnings), \
        "expected signature warning"
    print(f"   ✓ correctly detects missing signature: {bad_warnings}")

    # 3. Test render_and_upload_cover
    print("→ Test render_and_upload_cover_for_draft...")
    sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])
    user_id = "00000000-0000-0000-0000-000000000001"   # stub UUID for smoke
    draft_id = "ffffffff-ffff-ffff-ffff-ffffffffffff"  # stub UUID

    video_meta = {
        "youtube_video_id": "7GVlF0Rmzxw",
        "thumbnail_url": "https://i.ytimg.com/vi/7GVlF0Rmzxw/maxresdefault.jpg",
        "channel_name": "Patrick Dang",
        "channel_avatar_url": None,
        "subscriber_count": 370000,
    }

    cover_url, cover_warnings = render_and_upload_cover_for_draft(
        sb,
        user_id=user_id,
        draft_id=draft_id,
        output=out,
        video_meta=video_meta,
    )
    if cover_warnings:
        print(f"   ⚠ warnings: {cover_warnings}")
    if not cover_url:
        print("   ✗ cover_url is None")
        return 1
    print(f"   ✓ cover_url: {cover_url}")

    # 4. Verify URL is fetchable
    print("→ Verify cover URL is publicly fetchable...")
    try:
        r = httpx.get(cover_url, timeout=10.0, follow_redirects=True)
        r.raise_for_status()
        if len(r.content) < 100_000:
            print(f"   ⚠ cover bytes suspiciously small: {len(r.content)}")
        else:
            print(f"   ✓ fetched {len(r.content)} bytes")
    except Exception as e:
        print(f"   ✗ fetch failed: {e}")
        return 1

    # 5. Save local copy for visual inspection
    local = Path("/tmp/riff-fb-pipeline-cover.png")
    local.write_bytes(r.content)
    print(f"   ✓ saved local copy: {local}")

    # 6. Cleanup smoke artifacts
    print("→ Cleanup smoke artifacts...")
    try:
        sb.storage.from_("fb-covers").remove([f"{user_id}/{draft_id}/cover.png"])
        print("   ✓ removed")
    except Exception as e:
        print(f"   ⚠ cleanup warning: {e}")

    print("\n✅ FB article pipeline smoke test PASSED")
    return 0


if __name__ == "__main__":
    sys.exit(main())
