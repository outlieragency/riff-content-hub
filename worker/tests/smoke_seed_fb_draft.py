"""Seed a test fb_article draft into Earth's dev Supabase + render cover.

Outputs a URL to visit in localhost:3000/recreated/{draft_id} for visual smoke test.

Run:
    cd worker && ./.venv/bin/python tests/smoke_seed_fb_draft.py
"""

from __future__ import annotations

import os
import sys
import uuid
from pathlib import Path

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
    render_and_upload_cover_for_draft,
)

USER_ID = "4b819427-7517-429b-bf5d-494d7211f2f7"  # earthrati@outlieragency.co (dev)

# Patrick Dang sample (from previous fb-content-agent work)
SAMPLE = {
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
        "เซ็นลูกค้า AI $5,500/เดือนได้ ทั้งที่ยังทำงานประจำ + ดูแลลูก 3 คน ด้วย 5-step framework ของ Patrick Dang\n"
        "(จาก Silicon Valley sales ที่ลาออกมาอยู่เวียดนาม + เทรน Muay Thai ทุกเช้า)\n"
        ".\n"
        "ผมไปเจอคลิปของ Patrick Dang ผู้ติดตาม 3.7 แสนคน ที่เคยเป็น tech sales 6 หลัก ใน Silicon Valley แล้วลาออกมาทำธุรกิจออนไลน์ในเวียดนาม รันธุรกิจคนเดียวด้วย AI จนมีเวลาเทรน Muay Thai ทุกเช้า\n"
        ".\n"
        'Patrick บอกว่า "AI ไม่สามารถ launch หรือ land rocket ได้ มันบินได้อย่างเดียว" หน้าที่ของคนคือตั้ง vision + curate ผลลัพธ์ ส่วนงานจริงให้ AI ทำ และเขายกตัวอย่าง Sandy Lee ลูกค้าของเขาที่เป็นแม่ของลูก 3 คน + ทำงานประจำ แต่เซ็นลูกค้า AI Automation รายแรกได้ $5,500/เดือน\n'
        ".\n"
        "วันนี้เอิร์ธจะพามาถอดทั้ง 5 step ของ Patrick + วิเคราะห์ว่าจุดไหนที่คนไทยเอาไปใช้ได้จริง\n"
        "#อ่านจบปุ๊ปเก่งขึ้นปั๊ป\n"
        "==========\n"
        "[1] Launch and Land the Rocket คือ mental model เดียวที่ต้องเข้าใจในยุค AI\n"
        ".\n"
        "Patrick พูดประโยคนึงในคลิปที่ผมว่าเป็น mental model ที่ดีที่สุดที่ผมเคยได้ยินเรื่อง AI\n"
        ".\n"
        '"คุณไม่ได้บินจรวดด้วยตัวเอง คุณแค่ launch มัน + land มัน ส่วนการบินจริง ๆ AI ทำให้"\n'
        ".\n"
        "แปลว่า งานของคนในยุค AI คือ 2 อย่าง — ตั้ง vision (objective ชัด ๆ ก่อนสั่งงาน) + curate output (ตรวจว่าดีจริงไหม ปรับให้คม)\n"
        "==========\n"
        "[2] หาไอเดียธุรกิจด้วย Skill x Passion x Profit ไม่ใช่ตามกระแส\n"
        ".\n"
        'ปัญหาที่ Patrick เห็นจากการ coach ลูกค้ามาทั้งหมดคือ "คนที่มี potential สูงมักจะ freeze เพราะกลัวเลือกผิด"\n'
        ".\n"
        "Sandy Lee เริ่มจาก 0 ใช้ prompt ของ Patrick จนเจอ niche AI Automation จนเซ็นลูกค้ารายแรกได้ $5,500/เดือน\n"
        "==========\n"
        "[3] Personal Brand ต้องมาก่อน Content ไม่ใช่หลัง\n"
        ".\n"
        '"คนสับสน confused content creation กับ personal brand"\n'
        ".\n"
        "AI หา positioning ให้ไม่ได้ AI หา story ให้ไม่ได้ AI ทำได้แค่ write content ตาม positioning ที่คุณตั้ง\n"
        "==========\n"
        "[4] หา 10x ideas จาก outliers ของ competitor ไม่ใช่คิดเอง\n"
        ".\n"
        'Patrick บอกว่า "อย่าหลงกล AI guru ที่ build Claude Agent หา idea ลง Google Sheet ทุกวัน มันคือ gimmick"\n'
        "==========\n"
        "[5] [ผู้เขียนใส่ pitch product/service ของตัวเองตรงนี้]\n"
        "==========\n"
        "#สรุ๊ปสรุป\n"
        "- Launch and Land the Rocket คนตั้ง vision + curate AI ทำงานตรงกลาง\n"
        "- Niche of One หา idea จาก Skills x Passion x Profit ที่ overlap\n"
        "- Personal Brand First positioning ต้องมาก่อน content ไม่ใช่หลัง\n"
        "- Outlier-Based Ideas หา 4x video ของ competitor + reverse engineer\n"
        "- AI-Powered Scripting feed transcript + voice ของตัวเองให้ AI ไม่ใช่ให้เขียนแทน\n"
        "- High-Ticket First มี skill แต่ traffic ต่ำ ขาย $2K-$5K ไปก่อน\n"
        "==========\n"
        "#ความเห็นฉบับเอิร์ธ\n"
        'ผมว่าจุดที่ Patrick พูดเรื่อง "launch and land the rocket" มันคือ insight ที่จะเปลี่ยนวิธีที่คน build business ในยุค AI\n'
        ".\n"
        "Sandy ที่เซ็นลูกค้า $5,500/เดือนได้ ไม่ใช่เพราะเธอเก่ง AI กว่าคนอื่น แต่เพราะเธอมี taste ในการเลือกว่า output AI อันไหนดีพอ\n"
        ".\n"
        "[ผู้เขียนใส่ CTA ของตัวเองตรงนี้]\n"
        ".\n"
        "หวังว่าโพสต์นี้จะมีประโยชน์กับทุกคนนะครับผม"
    ),
    "section_count": 5,
}


def main() -> int:
    sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])

    # 1. Get or create a test idea (need video_id link in real flow but for smoke we bypass)
    # Find any idea owned by Earth, or create a placeholder
    print("→ Finding or creating test idea...")
    idea_res = (
        sb.table("ideas")
        .select("id")
        .eq("user_id", USER_ID)
        .limit(1)
        .execute()
    )
    if idea_res.data:
        idea_id = idea_res.data[0]["id"]
        print(f"   ✓ using existing idea: {idea_id}")
    else:
        idea_id = str(uuid.uuid4())
        sb.table("ideas").insert(
            {
                "id": idea_id,
                "user_id": USER_ID,
                "title": "[smoke] Patrick Dang FB test",
                "source_url": "https://www.youtube.com/watch?v=7GVlF0Rmzxw",
                "status": "in_progress",
            }
        ).execute()
        print(f"   ✓ created idea: {idea_id}")

    # 2. Get voice_profile
    print("→ Loading voice profile...")
    vp_res = (
        sb.table("voice_profiles")
        .select("id")
        .eq("user_id", USER_ID)
        .limit(1)
        .execute()
    )
    if not vp_res.data:
        print("   ✗ no voice profile in dev — create one via /voice page first")
        return 1
    vp_id = vp_res.data[0]["id"]
    print(f"   ✓ voice_profile_id: {vp_id}")

    # 3. Coerce sample (validates schema)
    print("→ Validating + coercing sample output...")
    output = _coerce(SAMPLE)
    output["style_warnings"] = []  # mark compliant
    print("   ✓ schema valid")

    # 4. Insert recreated_drafts row first (need draft_id for storage path)
    print("→ Inserting recreated_drafts row...")
    insert_res = (
        sb.table("recreated_drafts")
        .insert(
            {
                "user_id": USER_ID,
                "idea_id": idea_id,
                "voice_profile_id": vp_id,
                "format": "fb_article",
                "status": "ready",
                "input_summary": {"_note": "smoke test seed"},
                "output": output,
                "output_markdown": output["post_body"],
                "title": output["title"],
                "generation_meta": {"_note": "smoke seed (no LLM call)"},
            }
        )
        .execute()
    )
    draft_id = insert_res.data[0]["id"]
    print(f"   ✓ draft_id: {draft_id}")

    # 5. Render cover + upload to storage
    print("→ Rendering cover + uploading...")
    video_meta = {
        "youtube_video_id": "7GVlF0Rmzxw",
        "thumbnail_url": "https://i.ytimg.com/vi/7GVlF0Rmzxw/maxresdefault.jpg",
        "channel_name": "Patrick Dang",
        "channel_avatar_url": "https://yt3.googleusercontent.com/9FGi29r4SoqSGdMewr5xaXlx29XaJP8HE0ec71nE1ySUJ6v6f2pPT33kiO_wm9cvx6MjOkq2iA=s256-c-k-c0x00ffffff-no-rj-c0x00ffffff-no-rj",
        "subscriber_count": 370000,
    }
    cover_url, warnings = render_and_upload_cover_for_draft(
        sb,
        user_id=USER_ID,
        draft_id=draft_id,
        output=output,
        video_meta=video_meta,
    )
    if warnings:
        print(f"   ⚠ warnings: {warnings}")
    print(f"   ✓ cover_url: {cover_url}")

    # 6. Update draft.output with cover_url
    output["cover_url"] = cover_url
    sb.table("recreated_drafts").update({"output": output}).eq("id", draft_id).execute()

    print("\n" + "=" * 60)
    print("✅ Test draft seeded — visit:")
    print(f"   http://localhost:3000/recreated/{draft_id}")
    print("=" * 60)
    return 0


if __name__ == "__main__":
    sys.exit(main())
