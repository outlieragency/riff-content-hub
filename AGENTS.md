# AGENTS.md — Riff

Riff (folder `content-hub`, brand `Riff`) is Earth Rati's personal
content-research + recreation tool. Brand voice + tone live at the
workspace root (`~/Desktop/Outlier Agency/CLAUDE.md` +
`_context/outlier-agency-brand-context.md`) and Claude auto-loads
them — no need to re-read.

Slogan: **Turn on. Tune in. Drop out.** — grab someone else's theme,
improvise it in your own voice. Don't copy.

> For high-level architecture + decision history see [`SPEC.md`](SPEC.md).
> This file is the dev-side operating manual.

## Repo layout

```
content-hub/
├── portal/                  Next.js 16 (App Router) — Vercel
├── worker/                  FastAPI Python — Railway
├── _context/                Brand voice + context loaded by Claude
└── portal/supabase/         Migrations + RLS (Supabase project kwwsmpsnneakribwkake)
```

Portal + worker deploy separately, share one Supabase project.

## Core principles

**1. Single-tenant for now, multi-tenant ready**
Every per-user table carries `user_id UUID` + RLS from migration 0001.
Never query a per-user table without filtering `user_id`.
The exception is `shared_channels` + `shared_videos` (curated pool) —
they have no `user_id` and use a public-read RLS policy. Worker writes
via the service-role key; portal reads via the anon key as any
authenticated user.

**2. Heavy reuse, don't rebuild**
- Brand voice schema → reused from `Operation/products/outlier-carousel/SPEC.md` §6
- Hook frameworks → copied from `marketing/_tools/ig-carousel-agent/prompts/`
- Auth + Supabase client patterns → from `Operation/apps/client-portal/portal/src/lib/supabase/`
- UI primitives → from `client-portal`

**3. Prompt caching mandatory**
Every Claude call uses the 5-block cache structure
(`worker/app/services/claude/caching.py`). Target hit rate ≥ 60% input
tokens. Log `cache_read_input_tokens` into
`recreated_drafts.generation_meta` on every call.

**4. Outlier score = `views / subscriber_count`**
Industry formula. `channel_avg_views` (median of last 30 long-form,
exclude Shorts) is a secondary metric only — not in the formula. See
`SPEC.md` §3 for color bands + fallback rules.

**5. Thai writing — avoid AI tells**
No em dash (—) in user-facing copy. No ellipsis (…) beyond
strict necessity. No emoji in microcopy — only functional icons in
UI. See memory `feedback_thai_writing_style.md`.

**6. Two niche-creator catalogs must stay in sync**
- `portal/src/lib/niche-creators.ts` (TypeScript, used by `/discover`
  Suggested Creators row)
- `worker/app/services/youtube/shared_pool_sync.py::CURATED_BY_NICHE`
  (Python, used by pool sync)
Same handles, same niches. When adding a creator, edit both.

## Current build state

Riff v1 is end-to-end live at `riff.outlieragency.co`. Active
extensions (post-launch):

| Slice | Status |
|---|---|
| 0-7  v1 core (channels, videos, ideas, recreate, voice, covers) | done |
| 8    polish + cache report | done (cache hit rate >60% in production) |
| 9    niche tagging + filter | done (2026-05-10) |
| 10   shared creator pool | done (2026-05-11) |
| 11   Webshare proxy support | code shipped, needs paid plan + env vars to activate |
| 12   Canva-clone post-gen editor | deferred (see SPEC §10) |
| 13   IG / TikTok / X discovery | not started |

Pivot to v2 attempted + reverted on 2026-05-10 — see
[`SPEC.md` §11](SPEC.md) for the story.

## Quick commands

```bash
# Run dev
cd portal && npm run dev                       # localhost:3000
cd worker && uv run uvicorn app.main:app --reload  # localhost:8000

# Migrations
cd portal && supabase db push                  # apply migrations to remote

# Worker tests
cd worker && uv run pytest

# Trigger curated pool resync (cloud worker)
curl -X POST https://riff-content-hub-production.up.railway.app/internal/sync-curated-pool \
  -H "Authorization: Bearer $WORKER_SECRET" \
  -H "Content-Type: application/json" -d '{"video_limit":30}'
```

## Common debug paths

- **Recreate errored on cloud, works locally** → YouTube IP-blocking
  Railway. See `SPEC.md` §8 — set Webshare proxy env vars.
- **JSON parse error from fb_article** → Claude wrote a literal newline
  inside a string value. `parse_json_strict` uses `strict=False` now,
  and `fb_article.generate` logs raw output on failure
  (`riff.fb_article` logger).
- **Channel sync resolved a wrong account** → YouTube `forHandle`
  returned an imposter. Sync rejects anything with `< 5000` subs;
  fix the handle in `niche-creators.ts` + `shared_pool_sync.py` and
  resync.
- **`/discover` empty after picking a niche** → check if any channels
  (tracked or shared) are actually tagged with that niche; the chip
  goes dim when zero are.

## Module conventions

- Server actions live under `portal/src/lib/actions/` — one file per
  domain (e.g. `track-creator.ts`, `channel-niches.ts`).
- Worker routes live under `worker/app/routes/` — one file per surface.
- Claude prompts live as `.md` files under `worker/app/prompts/` so
  prompt caching keeps a stable byte-identical header.
- Migrations are append-only; never edit an applied migration. If a
  schema change requires undoing a prior one, write a follow-up
  migration that drops/adjusts.
