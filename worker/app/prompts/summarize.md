# Summarize Transcript (structured)

> Used by: `services/claude/summarize.py` (Sonnet 4.6, structured JSON output)
> Input: Thai transcript (จากต้นฉบับไทย หรือแปลจากภาษาอื่นแล้ว)
> Output: structured summary JSON ที่ใช้ feed เข้า recreate prompts ทุก format

## Task

วิเคราะห์ transcript ของ video แล้ว extract structure ออกมาเป็น JSON ที่ recreate engine เอาไปใช้ต่อได้

Output **only valid JSON** ตาม shape นี้:

```json
{
  "main_thesis": "string (1-2 sentences ที่จับ insight หลักของวิดีโอ)",
  "hook": "string (วิธีเปิด video ของต้นฉบับ — เพื่อให้ recreate engine เห็น pattern ของการเปิดที่ work)",
  "body_sections": [
    {
      "heading": "string (1-line summary ของ section)",
      "key_points": ["string", "..."]
    }
  ],
  "examples": ["string (รูปธรรมที่ต้นฉบับใช้ — ตัวเลข, story, case study)"],
  "cta": "string | null (วิธีจบ/ชวน action ของต้นฉบับ)",
  "takeaways": ["string (3-5 actionable insights ที่ผู้ชมเอาไปทำได้จริง)"]
}
```

## Field guide

**main_thesis**
What is this video actually arguing? เขียนเป็นประโยคเดียวที่ summary insight หลักไม่ใช่หัวข้อ ผู้ดูเดินออกจาก video แล้วเชื่ออะไร

**hook**
ประโยค/วิธีที่ต้นฉบับ "ดึง" คนให้อยู่ใน 5-10 วินาทีแรก เป็น contrarian claim? specific number? curiosity gap? story? mistake/warning?
สรุปให้สั้น แต่ระบุ pattern ได้

**body_sections** (3-7 sections)
แบ่ง flow ของ video เป็นช่วง ๆ แต่ละช่วงสรุปเป็น heading + key points
ห้ามแค่คัดประโยคจาก transcript ต้อง structure ใหม่ที่อ่านแล้วเข้าใจ flow

**examples**
เก็บตัวเลข เคส story รูปธรรมที่ต้นฉบับใช้ที่ทำให้ argument มีน้ำหนัก
recreate engine จะใช้ slot นี้ลง content (แต่ users จะแก้เป็น example ของตัวเองได้)

**cta**
ตอนจบของ video เขาชวนทำอะไร? subscribe? buy? try? share? null ได้ถ้าไม่มี

**takeaways** (3-5 items)
What should the viewer DO differently? action-oriented ไม่ใช่ summary
เช่น "วัด channel_avg_views ด้วย median ไม่ใช่ mean" ไม่ใช่ "พูดถึง median"

## Quality bar

- ทุก field ต้องสะท้อนเนื้อหาใน transcript จริง ห้าม invent ห้าม embellish
- ภาษาไทยทั้งหมด ยกเว้น technical terms (funnel, offer, AI, SaaS, etc.)
- output JSON only ห้าม markdown code fence ห้าม commentary
- ถ้า transcript ขาด/สั้นมาก ให้ใส่ field ว่างได้ (empty array, null) อย่าเดา
