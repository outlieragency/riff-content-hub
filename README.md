# Riff

> Turn on. Tune in. Drop out.

Riff คือ web app ของ **Outlier Agency** สำหรับ research outlier content จาก YouTube แล้ว recreate ในเสียงผู้ใช้เอง

ภาพรวม:
1. Add YouTube channel แล้วดึง videos + คำนวณ Outlier Score (median-based)
2. Save outlier video ที่น่าสนใจเข้า Idea Library
3. Recreate AI ดึง transcript แปลไทย สรุป generate ใน brand voice (FB / YT / Reels / Carousel)
4. Vault เก็บ Ideas vs Recreated drafts

ภายในเรียกว่า `content-hub` (folder name คงเดิม) Brand-facing เรียกว่า **Riff**

## Repo layout

```
content-hub/
├── portal/    Next.js 16 + Supabase frontend (เปิดที่ riff.outlieragency.co)
└── worker/    FastAPI + Anthropic SDK background worker
```

แต่ละส่วนมี own README + own deploy

## Quickstart

```bash
# Portal
cd portal
cp .env.local.example .env.local   # ใส่ Supabase + worker URL
npm install
npm run dev                         # http://localhost:3000

# Worker (ต้อง Python 3.12)
cd worker
cp .env.example .env                # ใส่ Anthropic + YouTube API + Supabase service key
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

## Plan

ดู `~/.claude/plans/saas-clever-gadget.md` (full spec + build slices)

## Status

- ✓ Slice 0 (Bootstrap)
- ✓ Slice 1 (Channel + Outlier dashboard) code done, รอ YouTube key smoke test
- ✓ Slice 2 (Idea Vault)
- ✓ Slice 3 (Voice Profile editor + auto-extraction with Haiku 4.5) — รอ Anthropic key smoke test
- ✓ Slice 4 (Transcript fetch + translate + summarize) — รอ smoke test
- ✓ Slice 5 (YT Script recreate) — รอ smoke test
- ✓ Slice 6 (FB Article + Reels recreate) — รอ smoke test
- ✓ Slice 7 (Carousel recreate, output JSON ตรง schema ของ ig-carousel-agent renderer) — รอ smoke test
- pending: Slice 8 (cache-report page, end-to-end smoke test)

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind 4, shadcn/ui |
| DB / Auth | Supabase (Postgres + RLS + Storage) |
| Worker | FastAPI, Python 3.12 |
| AI | Anthropic Claude (Sonnet 4.6 + Haiku 4.5) with prompt caching |
| Sources | YouTube Data API v3, youtube-transcript-api |
| Deploy | Vercel (portal), Railway/Fly (worker) |
