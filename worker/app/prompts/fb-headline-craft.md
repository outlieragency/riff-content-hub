# Headline Craft — Cover Headline System

> **Headline = 80% of the spend.** (Ogilvy)
>
> Cover headline = สิ่งแรกที่คน "อ่าน" จริงๆ ก่อนตัดสินใจหยุด scroll
>
> **🚨 PRIORITY ORDER** (ถ้าขัดกัน file ที่อยู่บนชนะ):
> 1. `prompts/trendtech-references.md` — NEW DEFAULT (May 2026 onward, 13 refs)
> 2. `prompts/headline-references.md` — legacy 9 refs (square layout)
> 3. ไฟล์นี้ — principle layer

---

## 🎯 NEW Default (May 2026 onward) = TrendTech Pattern (TT)

```
L1: [opening verb/noun] + [▓ RED HL: pain/dream/$ outcome ▓]
L2: [connector: ด้วยการ / จาก / โดยใช้] + [yellow text: the method/how]
L3: [setup] + [▓ ORANGE HL: tool/framework/promise ▓]
+ subhead: "- single-sentence preview, 70-110 chars -"
+ arrow caption: "context" + "yellow $ figure"
```

**ใช้กับ:** Default ทุกโพสต์ — case study, framework breakdown, success story, tool tutorial

**Required output fields:** `line1` + `line1_highlight`, `line2` + `line2_highlight`, `line3` + `line3_highlight`, `subhead`, `arrow_caption_top`, `arrow_caption_bottom`

ดู 13 refs decoded + tri-highlight rules ที่ `trendtech-references.md`

---

## Legacy Patterns (P1/P2/P3) — เก็บไว้สำหรับ edge cases

ใช้เมื่อ:
- คลิปไม่มีตัวเลข $ หรือ scale figure ชัดเจน
- ต้องการ variety หลังจากใช้ TT 3-4 โพสต์ติดกัน
- Earth specifies legacy

### P1 Signature: Question-Promise-Credibility (legacy default)

```
L1: ใช้ [TOOL/CONCEPT] ยังไง?
L2: ให้ [VIVID metaphor]
L3: ([SOURCE / สูตรโกง / ด้านมืด / insider tip])
```

ใช้ pattern นี้เมื่อ legacy → ดูตัวอย่างเต็ม + variants ใน `headline-references.md`

---

## Source material (เพื่อ context)

| Book | Author | Distilled to |
|---|---|---|
| Ogilvy on Advertising | David Ogilvy | Specific > general. Promise + benefit. Identify prospect. |
| Tested Advertising Methods | John Caples | Self-interest. Specific numbers + names. |
| Scientific Advertising | Claude Hopkins | Be specific. Specifics build credibility. |
| Adweek Copywriting Handbook | Joe Sugarman | Slippery slide — every line makes you read next. |
| The Copywriter's Handbook | Bob Bly | 8 categories: direct, news, how-to, question, command, reason-why, testimonial. |
| Breakthrough Advertising | Eugene Schwartz | Match awareness stage. Mass desire. |

These books inform **why** patterns work. The **what** (specific Thai patterns to use) comes from refs.

---

## Universal rules (apply อย่างไรก็ตาม)

1. **Specifics > generics** — ตัวเลขจริง, ชื่อจริง, $ จริง
2. **Promise must be vivid** — "เหมือนมีลูกน้องร้อยคน" > "ทำงานได้ดีขึ้น"
3. **Identify your prospect** — Solopreneur / Creator / Coach / Consultant
4. **Front-load strongest word** — First 1-2 words decide eye stop
5. **Active over passive** — เผย/ทำ/สร้าง > ถูกเปิดเผย
6. **Question opens curiosity loop** — Earth signature pattern always L1 ends with "?"
7. **Match awareness stage** — most readers are problem-aware or solution-aware
8. **Avoid clever wordplay** — clarity beats cleverness

---

## 3 Patterns to rotate (priority order)

### ⭐ Pattern P1: Question-Promise-Credibility (signature, default)

**Use:** any video where the ANGLE is "how to use [tool] to achieve [outcome]" — fits 70%+ of summaries

```
L1: ใช้ [TOOL] ยังไง?
L2: ให้ [VIVID metaphor / outcome]
L3: ([SOURCE / สูตรโกง / ด้านมืด / insider tip])
```

L2 metaphor stems (use one):
- "ให้เหมือนมี [persona]" (เหมือนมีลูกน้องเป็นร้อยคน / มีเลขาส่วนตัว)
- "ให้เก่งเหมือน [skilled persona]" (เหมือนนักออกแบบมือโปร)
- "ให้เก่งแบบ [persona] ระดับโลก" (เก่งแบบ Dev ระดับโลก)
- "ให้ [outcome] ไม่ต้อง [obstacle]" (หาเงินล้านได้ ไม่ต้องโชว์หน้า)

L3 stems (use one — vary across posts):
- "(สูตรโกงจาก [identifier])"
- "(สูตรโกงคน [pain identifier])"
- "(คำแนะนำจาก [name] [credential])"
- "(ด้วย [philosophy] ของ [name])"
- "(ด้านมืดที่ [counterintuitive insight])"
- "(จากประสบการณ์ [scale/time])"
- "(ยุคนี้เขาวัดกันที่ [X] ไม่ใช่ [Y])"

### Pattern P2: Listicle + Multiplier-or-Negation

**Use:** when source has explicit numbered list (5 ways / 27 tips / 3 lessons)

```
L1: [N] [วิธี/เคล็ดลับ/บทเรียน/ขั้นตอน/Test] [topic]
L2: ที่ [benefit + multiplier]   OR   ไม่ [pain] ไม่ [pain]
L3: ([source/credential/curiosity tease])
```

Examples:
- "27 เคล็ดลับ Claude Code / ที่รู้แล้วจะทำให้งานเสร็จไวขึ้น 10x / (จากประสบการใช้งานจริงกว่า 500 ชั่วโมง)"
- "5 วิธีหาเงินด้วย AI / ไม่ต้องโชว์หน้า ไม่มีทุนก็เริ่มได้ / จากอดีต CEO สตาร์ทอัพมูลค่า 300 ล้าน"

Number choice:
- Odd numbers (3, 5, 7, 27) feel more specific than even (4, 6, 10, 30)
- Avoid generic "10 ways" — pick the actual count from source

### Pattern P3: How-to + Specific Number + Double Negation

**Use:** when source has dramatic dollar/time figure + clear pain removal

```
L1: วิธี [outcome] [specific $ or time]
L2: ไม่ [pain1] ไม่ [pain2]
L3: ([philosophy / specific method])
```

Example:
- "วิธีหาเงิน 2.7 ล้านบาท/เดือน / ไม่จ้างลูกน้อง ไม่ตามกระแส AI / (ด้วยปรัชญาการทอยลูกเต๋าของ Marc Lu)"

---

## 🚨 Hard length budget (enforced by render-time safeguard)

**Render will REJECT and refuse to save cover.png if any headline line wraps OR clips horizontally.**

### TrendTech-portrait (60px @ 1080-112=968px container, white-space:nowrap)

| Line | Max recommended (Thai+EN chars) | Why |
|---|---|---|
| L1 | ≤ 32 chars | "วัยรุ่น Gen Z เงินแสนต่อเดือน" = 25 ✓ |
| L2 | ≤ 32 chars | "เด็กอายุ 14 สร้างแอปดูแลสุขภาพในรูปแบบเกม" = 39 ❌ would clip |
| L3 | ≤ 32 chars | "ด้วยการใช้ Claude Code และขั้นตอนเหล่านี้" = 31 ✓ |
| Subhead (22px italic) | ≤ 110 chars | wraps OK at 22px |

### Legacy templates (76px @ 1080-128=952px)

| Line | Max | Reality check |
|---|---|---|
| L1 (76px) | ≤ 22 chars | "ใช้ Claude Skills ยังไง?" = 22 ✓ |
| L2 (76px) | ≤ 22 chars | "ให้เหมือนมี Agency ส่วนตัว" = 22 ✓ |
| L3 (30px) | ≤ 50 chars | "(สูตรโกงคน Solopreneur ที่ไม่อยากจ้าง Agency)" = 41 ✓ |

### Word count guideline (cross-template)

- TrendTech L1/L2/L3: each 5-9 SHORT words (refs ใน trendtech-references.md เฉลี่ย 7 words)
- Legacy L1/L2: each 3-5 short words

**Compound English words burn budget fast:**
- ❌ "Software as a Service Cloud Platform" — too many segments
- ✅ "Software as a Service" — fits clean

**If L1/L2/L3 ยาวเกิน budget — ตัดให้สั้น แล้วย้ายข้อมูลที่เหลือไป subhead** (subhead มี 110-char budget)

---

## Anti-patterns — actually banned

ดู `headline-references.md` สำหรับคำที่เคยห้ามแต่ refs ใช้ — คำเหล่านั้น **ปลดแบน** แล้ว

ที่ยังห้ามจริง (ไม่มีใน refs และเป็น overpromise):
- ❌ "เปลี่ยนชีวิต"
- ❌ "ปลดล็อก"
- ❌ "ความลับ" (เน้น "ลับ" — overpromise; "ลับ" ใน "เคล็ดลับ" = OK)
- ❌ "หากคุณ...คุณจะ..." (AI Thai)
- ❌ "เพราะว่า...นั่นเอง" (AI Thai)
- ❌ Wordplay/puns
- ❌ Generic intensifiers ที่ไม่ visual: "ดีขึ้น", "เก่งขึ้น", "พัฒนาขึ้น" (ต้องเป็น "เหมือน X" / "แบบ X ระดับโลก" / "10x" specific)

---

## L3 rules (สำคัญ — ผมเคยทำผิด)

L3 **ส่วนใหญ่อยู่ในวงเล็บ** (8/9 refs ใช้) — มันคือ visual signature ที่ Earth's audience คาดหวัง

L3 ต้อง pull weight ของตัวเอง — **ไม่ใช่แค่ "(จาก [name])"** เปล่าๆ

L3 ที่ดี ทำ 1 ใน 4 อย่าง:
1. **Authority credit:** "(คำแนะนำจาก Hormozi นักธุรกิจหมื่นล้าน)"
2. **Insider tip preview:** "(ยุคนี้เขาวัดกันที่สั่งงานถูก ไม่ใช่เขียนโค้ดเร็ว)"
3. **Identifier (your audience):** "(สูตรโกงคนไม่มีทุน แต่อยากมีรายได้ online)"
4. **Curiosity tease:** "(ด้านมืดที่ทำให้คนส่วนใหญ่ล้มเหลวแบบไม่รู้สาเหตุ)"

---

## Process to draft headline

1. **อ่าน `prompts/headline-references.md`** เพื่อ refresh signature pattern
2. **ดูประเภทคลิป:**
   - "How to use [tool]" / interview / strategy → P1 Question-Promise (default)
   - Numbered list / framework → P2 Listicle
   - Specific $/time + pain removal → P3 How-to
3. **เช็ค output ก่อนหน้าใน `output/*/headline.json`** — ห้ามใช้ pattern เดียวกับ 1 โพสต์ก่อนหน้า
4. **Draft:**
   - L1 = Question (P1) OR Number (P2/P3)
   - L2 = vivid metaphor / specific outcome
   - L3 = parens + meaningful proof element
5. **Stress test 3 questions:**
   - L1 มี "?" หรือเริ่มด้วยเลข?
   - L2 มี vivid concrete picture?
   - L3 ใน parens + tell something insider/curious?
6. **Save** `headline_pattern: "P1" | "P2" | "P3"` ใน headline.json

---

## headline.json schema (May 2026 onward)

### TT (default — TrendTech-portrait):

```json
{
  "hook_framework": "<A-F from hook-frameworks.md>",
  "headline_pattern": "TT",
  "cover_template": "trendtech-portrait",
  "color_theme": "trendtech",
  "line1": "<full L1 text>",
  "line1_highlight": "<2-7 word substring of L1, gets RED bg>",
  "line2": "<full L2 text>",
  "line2_highlight": "<2-7 word substring of L2, gets YELLOW text color>",
  "line3": "<full L3 text>",
  "line3_highlight": "<2-7 word substring of L3, gets ORANGE bg (Earth CI)>",
  "subhead": "<70-110 char preview, no surrounding dashes>",
  "arrow_caption_top": "<context line>",
  "arrow_caption_bottom": "<$ figure — renders yellow bold>",
  "thesis": "<1-sentence summary>"
}
```

### Legacy (square — keep for edge cases):

```json
{
  "hook_framework": "<A-F>",
  "headline_pattern": "P1 | P2 | P3",
  "cover_template": "thumbnail-bottom | headline-hero | statement-card",
  "color_theme": "dark | cream | orange",
  "line1": "<...>",
  "line2": "<...>",
  "line3": "<...>",
  "thesis": "<...>"
}
```

`hook_framework` (A-F) = post body opening pattern (hook-frameworks.md)
`headline_pattern` (TT/P1/P2/P3) = cover headline pattern
