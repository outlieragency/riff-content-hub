# Recreate as IG Reels Script

> Used by: `services/claude/recreate/reels.py`
> Output: structured Reels script JSON (Hook / Body / CTA)

## Task

User ส่ง summary ของ video คู่แข่งมา ให้คุณ recreate เป็น **IG Reels script** วิดีโอแนวตั้ง 30-60 วินาที ที่ user จะถ่ายเองใน voice ของตัวเอง

หลักการ:
- **Insight** ของต้นฉบับ คงไว้ — argument หลัก 1 อันต่อ Reel
- **Format** = พูดสด ไม่ใช่อ่าน script เป๊ะ ๆ ดังนั้นเขียนแบบ "ปาก" ไม่ใช่ "หนังสือ"
- **Hook 5 วินาที** สำคัญที่สุด — ดึงคนหยุดในวินาทีแรก ไม่ทำคนหลุด
- **Body 30-50 วินาที** explain main argument + 1 example เท่านั้น (เกินนี้คนหลุด)
- **CTA 5 วินาที** specific (กดติดตาม, comment word, link in bio)
- ความยาวรวม estimated 30-60 seconds (~75-150 คำในไทย)

## Output schema

Output **only valid JSON** ห้าม markdown ห้าม commentary:

```json
{
  "hook": "string (1-2 ประโยคที่จะพูดใน 5 วิแรก ดึงคนหยุด scroll)",
  "body": "string (เนื้อหาหลักที่จะพูด 30-50 วินาที 1-3 paragraph)",
  "cta": "string (1 ประโยคปิดที่ชวน action 5 วินาทีท้าย)",
  "estimated_duration_seconds": 45,
  "visual_cues": ["string (sight-bites ที่ user ทำเสริมขณะพูด — text overlay, b-roll, gesture)"]
}
```

## Field guide

**hook** (target 5 seconds = ~12-20 คำในไทย)
Pattern ที่ใช้บ่อย:
- Contrarian: "ทุกคนบอกให้ X จริง ๆ คุณควร Y"
- Specific: "85% ของ creator ทำผิดข้อเดียวกัน"
- Question: "ทำไมคลิปคุณไม่ viral แม้คนตามเยอะ?"
- Story: "ผมเคย X จนเรียนรู้ว่า..."
- Curiosity gap: "เคยสงสัยไหมทำไม..."

**body** (target 30-50 seconds = ~75-130 คำ)
- 1 main argument เท่านั้น ห้าม 3 points
- 1 specific example/numbers
- ห้ามใช้ em dash (—) ใช้ comma หรือ break ประโยคแทน
- ภาษา casual แบบพูด ใช้ signature_phrases ของ user
- ใส่ pause natural ด้วย period/comma ไม่ใช่ ellipsis

**cta** (target 5 seconds = ~10-15 คำ)
- Specific action 1 อย่าง
- ห้าม "Like, share, subscribe" generic
- ตัวอย่างดี: "ลองเขียน hook ของคลิปต่อไปแล้วส่งมาในคอมเม้นท์", "Save ไว้แล้วทำตาม"

**estimated_duration_seconds**
ประมาณตาม word count: ภาษาไทยพูดประมาณ 2.5-3 คำ/วินาที
รวม hook + body + cta = 30-60

**visual_cues** (3-6 items)
แค่ hint sight-bites ระหว่างพูด ที่ user เพิ่มในขั้นตัดต่อ
- Text overlay สั้น (1-3 คำ): `"text overlay: '85%'"`
- Gesture: `"gesture: ชี้ที่ตัวเลข"`
- B-roll: `"b-roll: คลิปเปิด analytics dashboard"`

## Quality checks

1. รวมเวลา 30-60 วินาที ไม่เกิน
2. body มี 1 argument 1 example เท่านั้น
3. ภาษาตรง voice profile
4. JSON valid

Output the Reels script JSON now.
