# Recreate as Facebook Long-form Post (Earth Rati style)

> Used by: `services/claude/recreate/fb_article.py`
> Output: structured FB post + cover headline JSON
>
> **TRUTH SOURCE for voice + structure:** `prompts/earth-rati-fb-style.md` — read it. ทุกกฎใน guide นั้นบังคับใช้ทั้งหมด. Output ที่ violate จะถูก reject.

## Task

User ส่ง summary ของ video คู่แข่งมา (พร้อม voice profile + transcript)
ให้ recreate เป็น **Facebook long-form post** ในเสียง user (ภาษาไทย, code-switching อังกฤษเฉพาะ technical terms) + headline+highlight สำหรับ TrendTech-style cover (1080×1350 portrait)

## Inputs available

ในระบบ system prompt + user message จะมี:
- `voice_profile` — tone, signature_phrases, vocabulary, dos, donts
- `summary` — main_thesis, hook, body_sections, examples, takeaways จาก video ต้นฉบับ
- Source video metadata (title, channel, views) สำหรับ context
- `personal-experiences.md` — Earth's chapters of experience สำหรับ anecdote selection
- `trendtech-references.md` — 13 cover refs decoded (highlight rules, length budget)
- `earth-rati-fb-style.md` — full structural style guide

## Hard rules (Earth's style guide — violation = reject)

ดู `earth-rati-fb-style.md` รายละเอียด หลักๆ:

- **Self-reference:** "เอิร์ธ" + "ผม" สลับ. NEVER "แอด" / "เรา"
- **Section divider:** `==========` (10 chars exactly)
- **Paragraph break:** `.` บรรทัดเดียว — NEVER blank lines
- **Numbering:** `[1]` `[2]` `[3]` (square brackets) — NEVER `1.` or `1)`
- **3 hashtags in order:** `#อ่านจบปุ๊ปเก่งขึ้นปั๊ป`, `#สรุ๊ปสรุป`, `#ความเห็นฉบับเอิร์ธ`
- **Closing signature** (exact): `หวังว่าโพสต์นี้จะมีประโยชน์กับทุกคนนะครับผม`
- **Slot placeholders:** ถ้าโพสต์มี Offer Point ให้เขียน LITERAL `[ผู้เขียนใส่ pitch product/service ของตัวเองตรงนี้]` ใน `[5]` slot. CTA ใน #ความเห็นฉบับเอิร์ธ ใช้ LITERAL `[ผู้เขียนใส่ CTA ของตัวเองตรงนี้]`. DO NOT invent products / CTAs.
- **No markdown** (`**bold**`, `# header`, `> quote`, tables) ใน post body
- **Numbers specific:** ห้าม "หลายล้าน" "หลายสิบ" — ใช้ตัวเลขจริง
- **Code-switching ไทย-อังกฤษ:** technical terms (Funnel, Offer, Solopreneur) ไม่แปล
- **Length:** 1500-2800 words

## Cover headline (TrendTech-portrait template)

3 lines + 3 highlights + subhead + arrow caption. ดู `trendtech-references.md` สำหรับ pattern + length budget.

- L1: action verb + dramatic outcome. Highlight = pain/dream/$ figure (red bg)
- L2: method/the how. Highlight = the actual technique (yellow text)
- L3: tool/framework/promise. Highlight = specific tool/framework (orange bg)
- Each line ≤ 32 Thai+English chars (60px font, 968px width container, no-wrap)
- Subhead: 70-110 char single-sentence preview
- Arrow caption: top line = context, bottom line = $ figure (renders yellow bold)

## Output schema

Output **only valid JSON** (no markdown wrapper, no commentary):

```json
{
  "title": "<thesis sentence — used as Notion title + draft title>",

  "cover": {
    "hook_framework": "A | B | C | D | E | F",
    "headline_pattern": "TT",
    "cover_template": "trendtech-portrait",
    "color_theme": "trendtech",
    "line1": "<full L1 text, ≤32 chars>",
    "line1_highlight": "<2-7 word substring of L1 to red-bg highlight>",
    "line2": "<full L2 text, ≤32 chars>",
    "line2_highlight": "<2-7 word substring of L2 to yellow text>",
    "line3": "<full L3 text, ≤32 chars>",
    "line3_highlight": "<2-7 word substring of L3 to orange-bg highlight>",
    "subhead": "<70-110 char preview, no surrounding dashes>",
    "arrow_caption_top": "<context line, 4-10 Thai words>",
    "arrow_caption_bottom": "<$ figure, 3-7 words, renders yellow bold>",
    "arrow_position": "bottom-left"
  },

  "post_body": "<full FB post following Earth's 7-zone skeleton — see earth-rati-fb-style.md. Use literal \\n for line breaks. Must include all 3 hashtags + signature line + slot placeholders if applicable.>",

  "section_count": <integer 3-7>,

  "thesis": "<1-sentence summary, same as title or shorter>"
}
```

## Field guide (post_body)

โครงสร้างที่ต้องมี (ตาม earth-rati-fb-style.md):

```
[HOOK บรรทัดเดียว: ตัวเลข + ผลลัพธ์ + วิธีการ]
([Subhook ในวงเล็บ — optional])
.
[INTRO ย่อหน้า 1: source + personal context (เอิร์ธเจอจากไหน)]
.
[INTRO ย่อหน้า 2: hook quote / key insight จาก source]
.
[INTRO ย่อหน้า 3: promise — เอิร์ธจะพาดูอะไร]
#อ่านจบปุ๊ปเก่งขึ้นปั๊ป
==========
[1] หัวข้อ
[3-5 ย่อหน้า, คั่นด้วย . บรรทัดเดียว]
==========
[2] [3] [4] ...
==========
[5] [ผู้เขียนใส่ pitch product/service ของตัวเองตรงนี้]   ← OPTIONAL — skip if topic doesn't fit
==========
#สรุ๊ปสรุป
- Keyword EN คำอธิบาย TH (5-6 bullets)
==========
#ความเห็นฉบับเอิร์ธ
[ความเห็นส่วนตัว 1-2 ย่อหน้า]
.
[ผู้เขียนใส่ CTA ของตัวเองตรงนี้]
.
หวังว่าโพสต์นี้จะมีประโยชน์กับทุกคนนะครับผม
```

## Quality checks (self-verify before output)

1. main_thesis ของต้นฉบับสะท้อนใน body (insight คงไว้, phrasing ใหม่หมด)
2. Cover lines ทั้ง 3 ≤32 chars (count รวม Thai+English)
3. Cover highlight phrases เป็น substring ของ line ที่อ้างถึง
4. Closing signature ตรงเป๊ะ "หวังว่าโพสต์นี้จะมีประโยชน์กับทุกคนนะครับผม"
5. 3 hashtags ครบทั้งหมด
6. Numbering `[1]` `[2]` ไม่ใช่ `1.`
7. ไม่มี em dash (—) ใน body
8. ไม่มี emoji เกิน 1-2 ตัวทั้งโพสต์
9. JSON valid (escape `\"` และ `\n` ให้ถูก, post_body ใช้ literal `\n` ใน JSON string)
10. ถ้า topic ไม่เข้ากับ Offer Point → SKIP ทั้ง section [5] entirely (ไม่ใส่ slot placeholder)

Output the JSON now.
