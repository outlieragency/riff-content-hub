# Voice Profile Extraction

> ใช้ Haiku 4.5 + structured JSON output
> Input: 3-10 content samples (caption, blog, tweet, video transcript)
> Output: VoiceProfile JSON (ตรง schema ของ portal/src/lib/types/voice-profile.ts)

## Task

You are analyzing samples of a creator's writing/speech to extract their **voice profile** — a structured representation of how they sound, what they say, and what they avoid.

You must output **only valid JSON** matching this exact shape:

```json
{
  "tone_words": ["string", "..."],
  "signature_phrases": ["string", "..."],
  "vocabulary": {
    "thai_english_mix": 70,
    "register": "casual but substantive"
  },
  "sentence_rhythm": "string",
  "dos": ["string", "..."],
  "donts": ["string", "..."]
}
```

Do not output markdown code fences, commentary, or explanation. Output JSON only.

## Field guide

**tone_words** (3-7 items)
คำสั้น ๆ บอก vibe ของผู้เขียน เช่น `direct`, `practical`, `no-fluff`, `Buddhist-pragmatic`, `playful`, `sharp`
สังเกตจาก stance + emotional register ไม่ใช่ topic

**signature_phrases** (3-10 items)
วลีที่ผู้เขียนใช้ซ้ำ ๆ จน distinctive ไม่ใช่ generic Thai (เช่น "สวัสดีครับ" ไม่นับ)
ตัวอย่าง: "ลองดูเดี๋ยวก็รู้เอง", "จริง ๆ แล้ว", "แบบ", "เอาตรง ๆ"
ถ้าไม่เห็น phrase ที่ distinctive จริง ๆ ให้ใส่น้อย ไม่ต้องเดา

**vocabulary.thai_english_mix** (0-100)
สัดส่วน % ภาษาไทย เทียบ 100% เช่น 70 = ไทย 70 อังกฤษ 30
นับ words ทั้งหมด ของ samples แล้วประมาณ ห้ามให้เกิน 100 ห้ามต่ำกว่า 0

**vocabulary.register** (1 of):
- `casual but substantive` — สบายแต่มีสาระ ไม่ corporate
- `casual` — สบาย ๆ ทั่วไป
- `professional` — ทางการ
- `expert` — เชี่ยวชาญ deep technical
- `provocative` — แรง ตรง challenger

เลือกตัวเดียวที่ใกล้ที่สุด

**sentence_rhythm** (1-2 sentences)
อธิบายโครงประโยคของผู้เขียน เช่น `short punchy 2-8 words, mix with longer when explaining` หรือ `medium length sentences, often start with a question`

**dos** (3-7 items)
สิ่งที่ผู้เขียนทำเป็น habit เวลาเขียน ที่ AI ควรเลียน เช่น
- `use real numbers and examples`
- `speak from personal experience`
- `Thai-English natural mix per industry term`
- `start with a contrarian take`

**donts** (3-7 items)
สิ่งที่ผู้เขียน *ไม่* ทำ เห็นชัดจาก samples เช่น
- `no hype/overpromise`
- `no em dash in Thai (—)`
- `no excessive emoji`
- `no นะคะ/ค่ะ` (ถ้าเป็น male voice)
- `do not lecture, talk as friend`

## Quality bar

- ทุก field ต้องสะท้อนสิ่งที่อยู่ใน samples จริง ห้าม invent
- ถ้า samples น้อย/ไม่ชัด field ไหน ใส่ array ว่าง / sentence_rhythm ว่าง ดีกว่าเดา
- ห้ามรวม field ที่ไม่มีใน schema
- ห้าม wrap ใน markdown ห้าม explanation ก่อน/หลัง JSON

## Samples to analyze

ผู้เขียนแชร์ content samples ด้านล่างนี้:

{{ samples_block }}

วิเคราะห์ samples เหล่านี้แล้ว output VoiceProfile JSON
