# Riff — Spec

> Brand: Riff (by Outlier Agency)
> Folder: `content-hub`
> Slogan: Turn on. Tune in. Drop out.
> Owner: Earth Rati
> Plan: `~/.claude/plans/saas-clever-gadget.md`

## What it does

Riff พา workflow ของ Earth จาก "ใช้ tool 5-6 ตัวสลับไปมา" มาเป็น single tool

1. **Add channel** paste YouTube URL → ดึง videos + metadata
2. **Outlier dashboard** sort by Outlier Score (median-based) คัดกรองด้วย date / duration / keyword
3. **Save idea** outlier ที่น่าสนใจเก็บใน Idea Library
4. **Recreate** AI ดึง transcript, แปลไทย (ถ้าต่างประเทศ), สรุป, generate output ใน brand voice
5. **Vault** Ideas tab + Recreated tab พร้อม edit + status tracking

## Output formats (MVP)

| Format | Output |
|---|---|
| 📺 YT Script | Outline + full script + 5 title options + thumbnail brief |
| 📘 FB Article | 800-1500 word Thai post |
| 📱 Reels Script | Hook (5s) + Body (30-50s) + CTA (5s) |
| 🎴 Carousel | JSON ตรง schema ของ `marketing/_tools/ig-carousel-agent/renderer/schema.py` |

## Outlier Score

```
score = video.view_count / channel.subscriber_count
```

Industry-standard formula (เดียวกับ Sortlytics / vidIQ) วัดว่า video reach ออกนอกฐานแฟนเดิม
ไปได้แค่ไหน ค่าสูง = viral signal

Color bands `lib/outlier/score.ts`:
- `< 1.0` grey · below avg
- `1-2` blue · average
- `2-5` green · outlier
- `5-10` orange · viral
- `> 10` red · mega viral

`channel_avg_views` (median ของ 30 long-form ล่าสุด exclude Shorts) ยังเก็บใน DB เป็น secondary
metric แสดง "ค่ากลาง view ต่อคลิป" ของช่อง ไม่ได้ใช้ใน score formula

## Data model

ดู `portal/supabase/migrations/0001_init_schema.sql`

Tables: `voice_profiles`, `channels`, `videos`, `ideas`, `transcripts`, `recreated_drafts`, `jobs`

ทุก table มี `user_id UUID` + RLS

## Tech decisions ที่ lock แล้ว

| Decision | Why |
|---|---|
| YouTube only ใน MVP | API ฟรี + transcript-api stable, Earth เป็น YouTuber เอง |
| All 4 formats ใน MVP | Earth ใช้ทั้งหมด, pipeline reuse 90% |
| Voice extraction ใน MVP | hand-craft JSONB blocks recreate ทุกครั้ง |
| Standalone app ไม่อยู่ใน client-portal | audience ต่างกัน (Earth-only vs clients) |
| Single-tenant ตอนนี้ + RLS | SaaS-ready ฟรี ไม่ต้อง refactor |

## ห้าม build ใน MVP

- IG / TikTok / Facebook scraping → Phase 2 (Apify)
- Carousel render pipeline → reuse `marketing/_tools/ig-carousel-agent/renderer/`
- Multi-tenant + Stripe
- Embeddings / semantic search
- Cron auto-resync (manual button พอ)
- Whisper fallback for missing transcripts
