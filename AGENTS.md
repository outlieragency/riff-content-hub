# AGENTS.md — Riff

This is **Riff** (folder ชื่อ `content-hub` แต่ brand เรียก Riff) by Outlier Agency
Internal tool ของ Earth Rati สำหรับ content research + recreation จาก YouTube ในเสียงผู้ใช้เอง

Brand slogan: **Turn on. Tune in. Drop out.**
ความหมาย Riff = หยิบ theme ของคนอื่นมา improvise ในแบบของตัวเอง ไม่ copy

> Brand voice + tone อยู่ที่ workspace root `~/Desktop/Outlier Agency/CLAUDE.md` และ `_context/outlier-agency-brand-context.md` Claude โหลดอัตโนมัติ ไม่ต้องอ่านซ้ำ

## Repo

- `portal/` — Next.js 16 frontend (Supabase auth + RLS, mirrors client-portal stack)
- `worker/` — FastAPI Python service (YouTube API + Claude API + transcript)

แต่ละส่วน deploy แยก, share Supabase project เดียว

## หลักการสำคัญ

**1. Single-tenant ตอนนี้ multi-tenant ใน Phase 2**
ทุก table มี `user_id` + RLS ตั้งแต่ migration 0001 ห้าม query โดยไม่ filter `user_id`

**2. Heavy reuse ห้าม rebuild**
- Brand voice schema → reuse จาก `Operation/products/outlier-carousel/SPEC.md` §6
- Hook frameworks + structures → copy จาก `marketing/_tools/ig-carousel-agent/prompts/`
- Auth + Supabase clients → copy pattern จาก `Operation/apps/client-portal/portal/src/lib/supabase/`
- UI primitives + theme tokens → copy จาก `Operation/apps/client-portal/portal/`

**3. Prompt caching mandatory**
ทุก Claude call ต้องใช้ 5-block cache structure (ดู `worker/app/services/claude/caching.py`) target hit rate ≥ 60% input tokens log `cache_read_input_tokens` ลง `recreated_drafts.generation_meta` ทุกครั้ง

**4. Outlier score = views / subscriber_count**
สูตรอุตสาหกรรม (เหมือน Sortlytics / vidIQ) วัด viral signal ว่า video reach ออกนอกฐานแฟนเดิมได้แค่ไหน
`channel_avg_views` (median ของ 30 long-form ล่าสุด exclude Shorts) ยังเก็บใน DB เป็น secondary metric
แต่ไม่ได้ใช้ใน outlier_score formula

**5. Thai writing avoid AI tells**
ห้ามใช้ em dash (—) ห้ามใช้ ellipsis (…) เกินจำเป็น ห้ามใส่ emoji ใน microcopy ใส่แค่ icon ที่ functional ใน UI ดู memory `feedback_thai_writing_style.md`

## Build slices (current plan)

ดู `~/.claude/plans/saas-clever-gadget.md` 8 slices, target 5-7 weeks

| Slice | Status |
|---|---|
| 0 Bootstrap | done |
| 1 Channel + Outlier dashboard | done (รอ smoke test) |
| 2 Idea Vault | done |
| 3 Voice Profile setup + auto-extract | done (รอ ANTHROPIC_API_KEY smoke test) |
| 4 Transcript + summarize | done (รอ smoke test) |
| 5 YT Script recreate | done (รอ smoke test) |
| 6 FB + Reels recreate | done (รอ smoke test) |
| 7 Carousel recreate | done (รอ smoke test, output ตรง ig-carousel-agent schema) |
| 8 Polish + cache report | pending |

## Quick commands

```bash
# Run dev
cd portal && npm run dev          # localhost:3000
cd worker && uv run uvicorn app.main:app --reload  # localhost:8000

# Migrations
cd portal && supabase db push     # apply migrations to remote
cd portal && supabase db reset    # reset local DB

# Tests
cd worker && uv run pytest
```
