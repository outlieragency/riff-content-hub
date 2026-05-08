# Recreate as YouTube Script

> Used by: `services/claude/recreate/yt_script.py`
> Inputs (all in cache prefix): system_voice_wrapper + this prompt + summary JSON
> Output: structured YT script JSON

## Task

User ส่ง summary ของ video คู่แข่งมา ให้คุณ recreate เป็น **YouTube script ของ user เองในเสียงของ user เอง** ไม่ใช่ copy ไม่ใช่ translate

หลักการสำคัญ:
- **Insight** ของต้นฉบับ คงไว้ — argument main_thesis
- **Phrasing/voice** ของต้นฉบับ ทิ้ง — เอา signature_phrases ของ user มาใช้แทน
- **Structure** ของต้นฉบับ ใช้เป็น input แต่ปรับให้เหมาะกับ format YouTube ของ user (อาจ shorter, sharper, contrarian opening)
- **Examples** ของต้นฉบับ user จะเอาไปแก้เป็น example ของตัวเอง — ใส่เป็น placeholder ที่ flag ชัด `[ใส่ example ของคุณตรงนี้]` ถ้า example ของต้นฉบับ specific เกินจะใช้ตรง ๆ
- **CTA** ออกแบบใหม่ตาม user's typical CTA (subscribe, link in description, etc.)

## Output schema

Output **only valid JSON** ตาม shape นี้ ห้าม markdown ห้าม commentary:

```json
{
  "outline": [
    { "heading": "string", "bullets": ["string", "..."] }
  ],
  "script_sections": [
    { "heading": "string", "text": "string (full prose ที่อ่านสคริปต์ได้เลย)" }
  ],
  "title_options": ["string", "string", "string", "string", "string"],
  "thumbnail_brief": {
    "visual_description": "string (เห็นในรูปอะไร — บรรยายสำหรับ designer/AI image gen)",
    "text_overlay": "string (ตัวหนังสือบน thumbnail สั้นที่สุดที่จะใช้)",
    "mood": "string (curious | shocked | confident | calm | playful — เลือก 1)"
  }
}
```

## Field guide

**outline** (3-5 sections)
Skeleton ของ video ที่ user ใช้ตอนถ่าย
- section แรกควรเป็น Hook (5-15 วินาที)
- section ระหว่าง = body แต่ละ point
- section สุดท้าย = CTA / wrap-up

**script_sections** (parallel ของ outline)
ขยายเป็น prose ที่อ่านปาก ๆ ได้เลย ภาษาไทยทั้งหมด ยกเว้น technical terms ภาษาอังกฤษ
- เขียนแบบ "พูด" ไม่ใช่ "เขียน" ให้ rhythm ตรงกับ sentence_rhythm ใน voice profile
- ใช้ signature_phrases ของ user 1-2 ครั้ง (ไม่ stuff)
- ห้าม em dash (—) ห้าม ellipsis (...) เกินจำเป็น

**title_options** (5 ตัวเลือก)
สั้น punchy ไทย ที่ generate curiosity + bait click ที่ deliverable
- mix style: 2 specific number ("3 วิธี..."), 1 contrarian ("ทำไม X ถึงผิด"), 1 question ("ทำไม...?"), 1 personal ("ผมเรียนรู้ X จาก Y")
- ห้ามเกิน 60 ตัวอักษร
- ห้ามใส่ emoji

**thumbnail_brief**
ไม่ใช่ image gen — แค่ brief ให้ user/designer ทำต่อ
- visual_description: สิ่งที่เห็นในรูป + facial expression ของ user
- text_overlay: 2-5 คำที่ overlay บนรูป (ภาษาไทยใหญ่ ๆ ตามสไตล์ youtuber ไทย)
- mood: 1 คำสั้นจาก list

## Quality checks

1. main_thesis ของต้นฉบับ ต้องสะท้อนในศัพท์และ argument ของ script — ห้าม drift
2. ภาษาที่ใช้ต้องตรงกับ voice profile (tone, signature, do/don't)
3. ห้ามใช้ phrasing ของต้นฉบับโดยตรง — paraphrase ทั้งหมด
4. ถ้า user เขียนภาษาผู้ชาย ห้ามใช้ "นะคะ/ค่ะ"
5. JSON valid — escape quote ให้ถูก

Output the YT script JSON now.
