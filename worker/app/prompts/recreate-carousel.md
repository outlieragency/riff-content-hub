# Recreate as IG Carousel

> Used by: `services/claude/recreate/carousel.py`
> Output JSON ที่ portal types/recreate-formats.ts CarouselOutput schema
> JSON นี้ส่งต่อให้ Outlier Carousel renderer (`marketing/_tools/ig-carousel-agent/renderer/`) ทำเป็น PNG

## Task

User ส่ง summary ของ video คู่แข่งมา ให้ recreate เป็น **IG Carousel post** (5-9 slides) ใน voice ของ user

หลักการ:
- **Insight** ของต้นฉบับ คงไว้
- **Format** = mobile-first carousel ที่อ่าน slide ละ 3-5 วินาที
- **Slide 1 = Cover/Hook** สำคัญสุด — ดึงคน swipe
- **Last slide = CTA** ห้ามขาด
- ทุก slide ต้องมี value ของตัวเอง ห้าม "tease" อย่างเดียว
- ระหว่าง 5-9 slides เท่านั้น (น้อยไป shallow มากไป tired)

## Output schema

Output **only valid JSON** ห้าม markdown ห้าม commentary:

```json
{
  "slug": "kebab-case-slug-from-title",
  "template": "thread-x",
  "theme": "cream",
  "slides": [
    { "kind": "cover", "title": "string", "subtitle": "string (optional)" },
    { "kind": "content", "heading": "string", "body": "string" },
    { "kind": "list", "heading": "string", "items": ["string", "string"] },
    { "kind": "quote", "text": "string", "attribution": "string (optional)" },
    { "kind": "tweet", "text": "string", "author": "string (optional)" },
    { "kind": "cta", "heading": "string", "body": "string", "cta_text": "string (optional)" }
  ]
}
```

## Field guide

**slug**
สั้น 3-6 คำ kebab-case ภาษาอังกฤษ derived จาก main_thesis (ใช้ใน file output ของ renderer)
ตัวอย่าง: "median-not-mean", "no-personal-brand-needed"

**template**
- `thread-x` — tweet card บน photo background (ดูเป็น personal brand) เลือกถ้าเนื้อหาออกแนว personal essay
- `minimal-thai` — structured layout (heading + body) เลือกถ้า how-to / framework

**theme**
- `cream` — default warm, friendly สำหรับ educational
- `light` — clean white สำหรับ minimal
- `dark` — สำหรับ contrarian/strong claim
- `orange` — สำหรับ bold/loud message
- `white` — pure white minimal

**slides** (5-9 ชิ้น)
ลำดับแนะนำ:
1. **cover** — hook ในรูป cover slide เป็น curiosity gap หรือ specific claim
2-7. **content / list / quote / tweet** — body slides โครง:
   - opening setup (1 slide) ทำไม topic นี้สำคัญ
   - main argument (2-4 slides) แต่ละ slide = 1 point + body 30-60 คำ
   - example/case (1 slide) รูปธรรม
3. (last) **cta** — ชวน save, comment, follow specific

Slide kind guidance:
- **cover**: title 6-12 คำที่เป็น hook; subtitle 6-15 คำเสริม
- **content**: heading 3-8 คำ; body 30-80 คำ (sweet spot 40-50)
- **list**: heading + 3-5 items แต่ละ item 5-15 คำ (ห้ามยาว)
- **quote**: 1 line punchy + attribution = author/source หรือ user
- **tweet**: tweet-style 1-3 sentences (ใช้ใน thread-x template)
- **cta**: heading + body + optional cta_text ปุ่ม (เช่น "Save ไว้")

## Voice rules

- ภาษาไทยทั้งหมด ยกเว้น technical term (funnel, AI, SaaS)
- ใช้ signature_phrases ของ user 1-2 ครั้ง (ไม่ stuff)
- ห้าม em dash (—)
- ห้าม emoji ใน body (เว้น cta_text ใส่ได้ 1 ตัว)
- ห้าม "นะคะ/ค่ะ" ถ้า user ผู้ชาย

## Quality checks

1. main_thesis สะท้อนชัดใน cover + content slides
2. ทุก slide ยืน alone ได้ — อ่าน slide เดียวก็เข้าใจ value
3. JSON valid escape \" และ \n ให้ถูก
4. slug = ASCII kebab-case เท่านั้น
5. slides 5-9 ชิ้น

Output the carousel JSON now.
