# Cover Variants — fb-content-agent

> ภาพปกคือสิ่งแรกที่ Hook คน
>
> **DEFAULT (May 2026 onward) = `trendtech-portrait`** — calibrated to TrendTech style refs.
> Legacy templates (`thumbnail-bottom`, `headline-hero`, `statement-card`) เก็บไว้สำหรับ edge cases เท่านั้น

---

## ⭐ Template TT (DEFAULT): `trendtech-portrait`

**Layout:** Portrait 1080×1350, photo full-bleed top, black headline band bottom, tri-color highlight

```
┌─────────────────────────┐
│ [tool icon]    [Outlier]│
│                         │
│      [face shot]        │
│  ↘arrow + $ caption     │  ~66%
│  [inset]   [YT badge]   │
│                         │
├─────────────────────────┤
│ ▓ L1 RED HL ▓ rest      │
│ L2 with YELLOW key word │  ~34%
│ ▓ L3 ORANGE HL ▓        │
│ - subhead italic -      │
└─────────────────────────┘
1080 × 1350
```

**ใช้กับ:** Default ทุกโพสต์ — case study, framework breakdown, success story, tool tutorial

**Hook ที่จับคู่:** B (Specific Number), F (Personal Story), C (Curiosity Gap), D (Mistake/Warning) — 4/6 ใช้ได้

**Color theme:** `trendtech` (red+yellow+orange tri-highlight on black) — ห้ามเปลี่ยน

**Required fields ใน headline.json:**
- `line1`, `line1_highlight` (red bg phrase)
- `line2`, `line2_highlight` (yellow text phrase)
- `line3`, `line3_highlight` (orange bg phrase)
- `subhead` (preview, no surrounding dashes)
- `arrow_caption_top` (context line)
- `arrow_caption_bottom` ($ figure — will render yellow bold)

**ดู `prompts/trendtech-references.md`** สำหรับ 13 refs decoded + tri-highlight rules

---

## Template A: `thumbnail-bottom`

**Layout:** Top 60% = thumbnail YouTube + channel badge / Bottom 40% = headline บนพื้นดำ

```
┌─────────────────┐
│                 │
│   [thumbnail]   │ 60%
│   [Alek] 5.4แสน │
│  ↓ gradient     │
├─────────────────┤
│ L1 (orange)     │
│ L2 (white)      │ 40%
│ L3 small + 👤   │
└─────────────────┘
```

**ใช้กับ:** Personal Story, Curiosity Gap, Profile/Interview, คลิปที่ตัวบุคคล/visual ใน thumbnail สำคัญ

**Hook ที่จับคู่:** F (Personal Story), C (Curiosity Gap)

**Color theme:** `dark` (default) — bg ดำ, headline ส้ม+ขาว

---

## Template B: `headline-hero`

**Layout:** Top 25% = thumbnail แคบ-แบน + channel badge / Bottom 75% = headline ใหญ่ๆ บนพื้นดำหรือครีม

```
┌─────────────────┐
│ [thumbnail strip] [badge]
│  ↓ gradient     │ 25%
├─────────────────┤
│                 │
│  HUGE L1        │
│  HUGE L2        │ 75%
│                 │
│  small L3 + 👤  │
└─────────────────┘
```

**ใช้กับ:** Specific Number, Mistake/Warning — เน้นข้อความ ไม่ได้เน้นภาพคน
- คลิปประเภท "5 ขั้นตอน...", "27 เคล็ดลับ..."
- คลิปเตือน "อย่าทำ X" / "5 ความผิดพลาด"

**Hook ที่จับคู่:** B (Specific Number), D (Mistake/Warning)

**Color theme:** `dark` (bg ดำ) หรือ `cream` (bg ครีม + ตัวอักษรดำ)

**ตัวอักษรใหญ่กว่า template A:** 80px (จาก 64px) เพราะมีพื้นที่มากกว่า

---

## Template C: `statement-card`

**Layout:** ไม่มี thumbnail. พื้นหลังสีพื้น (ส้ม/ดำ/ครีม). ข้อความใหญ่กลางจอ. Channel attribution เล็กๆ ที่มุม

```
┌─────────────────┐
│                 │
│   STATEMENT     │
│   ใหญ่ๆ          │
│   กลางจอ         │
│                 │
│         — Alek  │
│         5.4แสน  │
└─────────────────┘
```

**ใช้กับ:** Contrarian, Question Hook — โพสต์ที่ "คำพูด" สำคัญกว่า "ตัวบุคคล"
- คลิปที่ message มีพลังในตัวเองโดยไม่ต้องเห็นหน้า speaker
- โพสต์ความเห็น / mindset / hot take

**Hook ที่จับคู่:** A (Contrarian), E (Question Hook)

**Color theme:** `orange` (พื้นส้ม + ตัวขาว — กระแทกตามาก), `black` (พื้นดำ + ส้ม), หรือ `cream` (พื้นครีม + ดำ)

---

## เลือก Template ยังไง (May 2026 onward)

**DEFAULT = `trendtech-portrait`** ทุก hook framework — เกือบทุก video มี $/time figure ให้ใส่ใน highlight

| Hook framework | Default | Legacy fallback (ถ้าไม่มี $/time figure) |
|---|---|---|
| **A. Contrarian** | `trendtech-portrait` | `statement-card` (orange/black) |
| **B. Specific Number** | `trendtech-portrait` | `headline-hero` (dark/cream) |
| **C. Curiosity Gap** | `trendtech-portrait` | `thumbnail-bottom` (dark) |
| **D. Mistake/Warning** | `trendtech-portrait` | `headline-hero` (dark/orange) |
| **E. Question Hook** | `trendtech-portrait` | `statement-card` (orange/cream) |
| **F. Personal Story** | `trendtech-portrait` | `thumbnail-bottom` (dark) |

**ใช้ Legacy เมื่อ:**
- คลิปเป็น philosophical/reflective ที่ไม่มีตัวเลขเด่น (rare)
- Earth ระบุชัดเจน
- ทดลอง variety หลังจากใช้ trendtech 3-4 โพสต์ติดกัน

---

## Variety Rule

**ห้ามใช้ template + theme เดียวกับโพสต์ก่อนหน้าติดกัน 2 ครั้ง**

ทำได้โดยดูจากไฟล์ `output/*/headline.json` ว่าครั้งล่าสุดใช้ `cover_template` กับ `color_theme` อะไร

ถ้า hook framework ที่เลือกแล้วบังคับให้กลับไป template/theme เดิม → ปรับ color theme อย่างน้อย (เช่น เปลี่ยน dark → cream หรือ orange)

---

## Color Palette

อ้างอิง brand ของ Outlier (เหมือน carousel):

| Theme | Background | Foreground | Accent |
|---|---|---|---|
| `dark` | `#0A0A0A` (ดำ) | `#FFFFFF` (ขาว) | `#FF6B1A` (ส้ม) |
| `cream` | `#F4EFE6` (ครีม) | `#0A0A0A` (ดำ) | `#FF6B1A` (ส้ม) |
| `orange` | `#FF6B1A` (ส้ม) | `#FFFFFF` (ขาว) | `#0A0A0A` (ดำ) |

---

## Headline JSON schema (ที่ render รับ)

### TrendTech-portrait (default, full schema):

```json
{
  "hook_framework": "A-F",
  "headline_pattern": "TT",
  "cover_template": "trendtech-portrait",
  "color_theme": "trendtech",
  "line1": "full L1 text",
  "line1_highlight": "phrase from L1 to RED-bg highlight",
  "line2": "full L2 text",
  "line2_highlight": "phrase from L2 to YELLOW-text highlight",
  "line3": "full L3 text",
  "line3_highlight": "phrase from L3 to ORANGE-bg highlight",
  "subhead": "preview sentence (renderer adds the dashes)",
  "arrow_caption_top": "context line above arrow",
  "arrow_caption_bottom": "$ figure (renders large + yellow)",
  "thesis": "1-sentence summary"
}
```

### Legacy (square 1080×1080):

```json
{
  "cover_template": "thumbnail-bottom" | "headline-hero" | "statement-card",
  "color_theme": "dark" | "cream" | "orange",
  "line1": "...",
  "line2": "...",
  "line3": "...",
  "thesis": "..."
}
```

ถ้าไม่ระบุ `cover_template` → default = `trendtech-portrait`
ถ้าไม่ระบุ `color_theme` → default = `trendtech`
