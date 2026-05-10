# Riff — Project Overview

> สำหรับทีมการตลาด / partner / collaborator ที่จะมาช่วยต่อยอด

**Last updated:** 2026-05-10
**Status:** Pre-launch · 1 active user (founder) · Closed beta about to open
**Live:** [riff.outlieragency.co](https://riff.outlieragency.co)

---

## 1. คือ Riff คืออะไร 1 บรรทัด

**Daily content habit engine สำหรับ creator/founder ที่อยากลง content ทุกวัน — โดยไม่ต้องเสียเวลาหาไอเดีย**

3 บรรทัด:
- เลือก niche → Riff หา top creators ในนิชนั้นให้
- ทุกเช้าเปิดมา เห็น 5 outlier videos ที่ดังเกินค่าเฉลี่ย channel (proof แล้วว่าจะปัง)
- คลิก recreate → AI เขียนเป็น FB post ในเสียงของคุณ + cover ปก พร้อมลง

---

## 2. ปัญหาที่แก้

**Hypothesis:** ปัญหาของ creator/founder ที่ทำ content คนเดียว ไม่ใช่ "ทำ 1 post ช้า" — แต่คือ "ทำต่อเนื่อง 90 วันยาก"

**Pain points จากการสัมภาษณ์ founder ใน niche course/coaching/digital product:**

1. ไม่รู้ว่า "วันนี้จะลงเรื่องอะไร" — เปิด YouTube/IG เลื่อนเป็นชั่วโมง ยังคิดไม่ออก
2. เริ่มได้ 7 วัน หาย 3 วัน เริ่มใหม่ 4 วัน — ไม่ continuous
3. ทำเดือนเดียวก็ลืมว่า idea ที่ดีๆ มาจากไหน
4. AI generic (ChatGPT/Claude) ทำให้ทุกคนเขียนเหมือนกัน คนอ่านแยกออกใน 2 บรรทัด
5. จ้าง agency = 30,000-100,000 บาท/เดือน, ทำเอง = burnout

**Riff's bet:** การ "discovery" คือสิ่งที่ user ทำเองได้ยากที่สุด ส่วน "execution" (เขียน, ทำปก, copy paste) มี tool หลายตัวอยู่แล้ว Riff โฟกัสที่ discovery + frictionless habit loop

---

## 3. กลไก (Mechanism)

```
1. RESEARCH    → AI หา outlier videos ใน niche ของคุณ ทุกวัน
2. ORGANIZE    → save เข้า Idea Library → board ตาม theme
3. DECODE      → AI แกะ transcript + structure ของ video viral
4. RECREATE    → AI สร้าง content ใหม่ในเสียงคุณ (FB/IG/Reels/YT)
```

**Outlier Score formula** (ความได้เปรียบ):
```
score = views ÷ subscribers × age_decay
```
สูตรเดียวกับ vidIQ และ creator agency ใช้กัน วัด "video reach นอกฐานแฟน" ไม่ใช่แค่ดังในวงปิด

---

## 4. Target User

**Primary (validate กับคนนี้ก่อน):**
- Solo creator / founder ใน niche: course creator, coach, consultant, digital product
- มี 100k+ followers หรือ expert ที่กำลังจะ scale
- ทำ FB เป็นหลัก (gateway content)
- เคยลอง agency แล้ว expensive / ทำเอง burnout

**Secondary (ขยายทีหลัง):**
- Content creator ในไทยที่ใช้ EN content เป็น inspiration source
- Founder ที่อยากสร้าง personal brand แต่ไม่มีทีม

**ไม่ใช่ target:**
- Generic content writer / copy agency (ลูกค้าน้อยจ่ายไม่หนัก)
- E-commerce / physical product (pain ต่างกัน)
- Influencer entertainment (Riff ไม่ตอบโจทย์ creative variety)

---

## 5. Current State (built · 2026-05-10)

### ✅ Built + Working
- **Onboarding** — User เลือก interests → AI auto-add top creators ใน niche (16 nicheมี creator ละ 3-5 คน)
- **Discovery feed** — `/discover` แสดง outlier videos จาก channels ที่ track กรองตาม Outlier Score
- **Daily Brief** — Dashboard มี 5 outlier cards ทุกเช้า + weekly streak badge
- **Idea Library** — `/ideas` save video ที่ชอบ จัดเป็น board
- **Recreate** — generate FB post (เสร็จแล้ว) + IG carousel + Reels script + YT script จาก video
- **Voice profile** — AI เรียน writing style จาก post เก่าของ user → recreate ในเสียงเดียวกัน
- **Cover renderer** — 3 templates (Headliner / Minimal / Split) + Live edit mode
- **Quick from URL** — paste YT link → choose Save / Recreate (FB/IG/Reels/YT)
- **Push to Notion** — export draft เข้า Notion DB ตรง
- **Auth** — Google OAuth + email allowlist
- **Founder admin** — manage allowlist, view waitlist + survey responses
- **Marketing site** — landing page + waitlist form + onboarding survey

### Tech stack
- Frontend: Next.js 16 + Supabase (Auth + Postgres + Storage + RLS)
- Backend: FastAPI Python on Railway (YouTube API + Claude API + transcript)
- AI: Anthropic Claude Sonnet 4.6 (recreate) / Haiku 4.5 (extract) with prompt caching
- Renderer: Playwright Chromium screenshot of Jinja2 templates
- Deploy: Vercel (portal) + Railway (worker) + Cloudflare DNS

### Architecture decisions
- Single-tenant for MVP, multi-tenant ready (RLS on every table)
- Heavy reuse from `Outlier Carousel` + `client-portal` codebases
- Prompt caching mandatory (target ≥60% cache hit) — cost optimization
- Worker stateless · jobs queued via Postgres

---

## 6. Roadmap

### Priority 1 — Validate (หลัง MVP launch)
**1 founder ใช้ทุกวัน 1 อาทิตย์** (Earth เอง) → log pain points → adjust
- ยังไม่ add feature ใหม่จนกว่า validate
- เป้าหมาย: data ของจริง 1 user ก่อน scale

### Priority 2 — Growth loop
- **Idea Queue + scheduled posting** — save → schedule วันลง → batch generate Sunday
- **Streak counter จริง** (consecutive day tracker)
- **Performance analytics** — post ไหน reach สูงในเดือนที่ผ่านมา → suggest follow-up

### Priority 3 — Multi-platform discovery
- ขยายจาก YouTube → Instagram, TikTok, X (Eden's superpower)
- ต้อง investment ในการ index creators (1-2 เดือน)

### Phase C — เปิด public + monetize
- Stripe webhook auto-grant access
- Pricing tier (TBD)
- Onboarding survey → segment leads
- ทีมการตลาดเริ่มทำ acquisition

---

## 7. Decisions Log (สำคัญ)

| Date | Decision | Why |
|---|---|---|
| 2026-05-09 | Cancel canvas-style cover editor v2 | Canva ทำได้ดีกว่า — ไม่สู้ |
| 2026-05-09 | Cancel schema-driven templates | Over-engineered — 3 hardcoded templates พอแล้วก่อน validate |
| 2026-05-10 | Drop manual channel add → AI auto-curate | ลด friction onboarding 3-step → 1-step |
| 2026-05-10 | Strip multi-format Quick URL | Earth ลง FB อย่างเดียว — เก็บ option แต่ default FB |
| 2026-05-10 | Stop adding features, start validating | Earth feedback: "feature เยอะเกิน — ใช้จริงไม่ได้" |

---

## 8. Open Questions

1. **Pricing model** — flat subscription / pay-per-recreate / free + premium discovery?
2. **Multi-platform priority** — IG หรือ TikTok หรือ X ก่อน?
3. **Thai creator coverage** — ใส่ Thai creators ใน niche-creators map ตอนไหน?
4. **B2B vs B2C** — ขายให้ creator คนเดียว หรือ agency ที่ทำ content ให้ลูกค้า?
5. **Stripe integration timing** — เปิด beta free ก่อน 30-90 วัน เพื่อ feedback หรือเก็บเงินเลย?

---

## 9. People

- **Earth Rati (founder)** — ex-Solopreneur (หลักล้าน/เดือน จาก Notion template + course), ปัจจุบันเปิด Outlier Agency (Sales Funnel via GHL). Riff เริ่มจากเครื่องมือใช้เอง
- **Outlier Agency clients** — MissMook, Sistangkwa (50% / 20% profit-share, ใช้ GHL funnel ไม่ใช่ Riff)
- **Tech / AI** — Claude (Anthropic) เป็น primary AI partner

---

## 10. ที่เกี่ยวข้อง

- **Live URL:** [riff.outlieragency.co](https://riff.outlieragency.co)
- **App URL:** [riff.outlieragency.co/login](https://riff.outlieragency.co/login)
- **Repo:** [github.com/outlieragency/riff-content-hub](https://github.com/outlieragency/riff-content-hub)
- **Pitch doc:** [`RIFF-PITCH.md`](RIFF-PITCH.md) (สำหรับนักลงทุน)
- **Tech context:** [`AGENTS.md`](AGENTS.md) (สำหรับ developer)
- **Brand voice:** [`/_context/outlier-agency-brand-context.md`](../../../_context/outlier-agency-brand-context.md)
