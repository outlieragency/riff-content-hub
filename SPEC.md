# Riff — Spec

> Brand: Riff (by Outlier Agency)
> Folder: `content-hub`
> Slogan: Turn on. Tune in. Drop out.
> Owner: Earth Rati
> Last updated: 2026-05-11

---

## 1. What it does (current)

Riff is a personal content tool — Earth's daily workflow goes from
"flip between 5-6 tabs" to one app:

1. **Discover** — `/discover` shows outlier videos from two sources:
   - **Tracked channels** Earth added
   - **Shared curated pool** — pre-synced top creators per niche
2. **Niche filter** — chip row at the top filters the feed to videos
   from channels (tracked + curated) tagged with the picked niches
3. **Save idea** — bookmark outliers into the Idea Library
4. **Recreate** — AI fetches transcript, translates to Thai if needed,
   summarizes, regenerates content in Earth's voice
5. **Cover** — Playwright renders a 1080×1350 FB cover using the
   trendtech-portrait Jinja2 template; live editor for headline +
   highlight + arrow + creator badge
6. **Notion push** — recreated drafts can flow into Content Hub +
   Output Tracker databases

## 2. Output formats

| Format | Output |
|---|---|
| 📺 YT Script | Outline + full script + 5 title options + thumbnail brief |
| 📘 FB Article | 800-1500 word Thai post + trendtech-portrait cover |
| 📱 Reels Script | Hook (5s) + Body (30-50s) + CTA (5s) |
| 🎴 Carousel | JSON matching `marketing/_tools/ig-carousel-agent/renderer/schema.py` |

Cover render is FB-specific; the other three are text-only.

## 3. Outlier Score

```
score = video.view_count / channel.subscriber_count
```

Industry-standard formula (Sortlytics / vidIQ) measuring how far a
video's reach pushed beyond the channel's existing audience. High =
viral signal.

Color bands in `lib/outlier/score.ts`:
- `< 1.0` grey · below avg
- `1-2` blue · average
- `2-5` green · outlier
- `5-10` orange · viral
- `> 10` red · mega viral

`channel_avg_views` (median of last 30 long-form, exclude Shorts) is
kept as a secondary metric — not in the formula, but shown on channel
detail pages and used as a fallback denominator when a channel hides
its subscriber count.

## 4. Niche system

Each channel — both user-tracked and shared-pool — carries a
`niches text[]` column. `/discover` exposes a multi-select chip row
that filters the feed to channels matching any of the picked niches
(`channels.niches && selected[]`).

Curated niche catalog in `portal/src/lib/niches.ts`:

```
solopreneur · ai-tech · marketing · digital-product · self-dev ·
productivity · business · creator-economy · finance · coaching
```

Channel niches are populated three ways:
1. **Auto-classify on add** — `worker/services/claude/niche_classifier.py`
   runs after every channel sync (Claude Haiku, ~$0.0005/call), picks
   1-3 niches from the catalog.
2. **Manual chip toggle** — `/channels/[id]` has a NicheEditor that
   the owner can override the AI tagging on.
3. **Bulk fix** — a one-off Python script can reclassify all channels
   at once if the catalog changes meaningfully.

## 5. Shared creator pool

`/discover` doesn't loop on Earth's tracked channels alone. When a
niche is selected, the feed unions in `shared_videos` from the
curated pool (`shared_channels.niches && selected[]`).

The pool is pre-synced by `worker/services/youtube/shared_pool_sync.py`
which iterates the canonical map in
`portal/src/lib/niche-creators.ts` (mirror in
`worker/.../shared_pool_sync.py::CURATED_BY_NICHE` — keep in sync).

Anti-imposter rule: handle resolution sometimes hits a fan/parody
account squatting a clean handle. `MIN_SUBSCRIBER_FLOOR = 5000` in the
sync function rejects any resolved channel below that threshold.

Trigger paths:
- Founder-only `RefreshPoolButton` on `/discover` (synchronous, ~5-10
  min for the full catalog).
- `POST /api/admin/sync-curated-pool` → `POST /internal/sync-curated-pool`
  on the worker (Bearer WORKER_SECRET).
- Cron (TBD — manual for now).

## 6. Data model

Migrations live in `portal/supabase/migrations/`.

**Per-user (RLS = `auth.uid() = user_id`):**

| Table | Purpose |
|---|---|
| `voice_profiles` | Earth's writing-style JSONB extracted from past posts |
| `channels` | YouTube channels Earth tracks. `niches text[]`, `videos_count` denorm via trigger |
| `videos` | Videos from tracked channels. `outlier_score` denorm |
| `ideas` | Saved outliers. `status idea/in_progress/recreated/archived` |
| `transcripts` | Cached transcript + summary per video |
| `recreated_drafts` | AI-generated outputs (FB/YT/Reels/Carousel) |
| `boards` + `board_ideas` | Optional grouping of ideas |
| `creative_styles` | Reference-image-driven visual style spec per format |
| `jobs` | Polling worker queue (sync, recreate, voice extract) |
| `user_settings` | `interests text[]`, `onboarded_at`, etc |
| `app_settings` | Global per-user settings |
| `allowed_emails` | Login allowlist |
| `waitlist` | Signups pre-onboarding |

**Shared (RLS = read-for-any-authenticated, write via service-role):**

| Table | Purpose |
|---|---|
| `shared_channels` | Pre-synced curated creators (no `user_id`). `niches text[]` |
| `shared_videos` | Videos from curated creators (`shared_channel_id` FK) |

## 7. Tech stack

| Layer | Choice |
|---|---|
| Portal | Next.js 16 (App Router, RSC + Server Actions) |
| Worker | FastAPI on Railway, Playwright + Chromium in Docker |
| DB / Auth / Storage | Supabase (Free tier, ap-south-1 / Mumbai) |
| AI | Anthropic — Claude Sonnet 4.6 for recreate, Haiku 4.5 for extract / classify |
| Cover render | Playwright screenshot of Jinja2 templates (Thai fonts: Noto Sans Thai) |
| Deploy | Vercel (portal) + Railway (worker), DNS at GHL |

## 8. Cloud transcript fetch — known limitation

`youtube-transcript-api` (the library powering `Quick from URL` and the
recreate flow) scrapes YouTube's public transcript HTML. YouTube
escalates IP blocks on cloud datacenters — Railway included. The
worker has `Webshare residential proxy` support wired
(`worker/services/youtube/transcript.py::_build_proxy_config`); set
`WEBSHARE_PROXY_USERNAME` + `WEBSHARE_PROXY_PASSWORD` on Railway env
to activate ($3.50/mo Rotating Residential plan).

Without the proxy, recreate works on local dev (Mac residential IP)
but errors out on the deployed worker. Other flows (channel sync,
cover render, niche classify) are unaffected.

## 9. Tech decisions (locked)

| Decision | Why |
|---|---|
| YouTube only for now | API quota free + transcript-api stable, Earth is a YouTuber himself |
| All 4 recreate formats kept | Earth uses all of them; pipeline reuses 90% of the code |
| Voice extraction in MVP | Hand-craft JSONB blocks recreate every time, no per-call latency |
| Standalone app (not in client-portal) | Different audience: Earth-only vs Outlier clients |
| Single-tenant + RLS from day one | SaaS-ready at no cost; multi-tenant when needed |
| Single cover template (trendtech-portrait) | Cancelled v2 multi-template builder — Thai font + structured layout outweigh free-form Canva freedom for now |
| Webshare proxy over Mac+Tunnel | $3.50/mo beats running a Mac 24/7; trades one paid dependency for full cloud reliability |

## 10. What we won't build (yet)

- IG / TikTok / X scraping → Phase 2 (probably Apify)
- Carousel rendering pipeline in Riff → reuse `marketing/_tools/ig-carousel-agent/renderer/`
- Multi-tenant + Stripe
- Embeddings / semantic search
- Cron auto-resync — manual button on `/discover` for now
- Whisper fallback for videos with no captions
- Full Canva-clone cover editor (Polotno / Fabric.js) — explored 2026-05-11, deferred. Current structured editor + Playwright render delivers 80% of value at 5% of effort
- Visual template builder UI — same decision as above

## 11. Pivot history (so future-me doesn't repeat it)

| Date | Move | Outcome |
|---|---|---|
| 2026-05-10 | Tried v2 "single FB cover generator" pivot — stripped 130 files / 21k LOC, dropped 8 tables | Reverted same day. v1's structured Recreate + Niche system was right; v2's narrower scope killed the discovery value |
| 2026-05-10 | Niche tagging + filter on `/discover` | Shipped. Reduced channel-loop fatigue |
| 2026-05-11 | Shared creator pool (Phase 2) | Shipped. Pool seeded with 18 verified creators after imposter cleanup |
| 2026-05-11 | Considered Canva-clone post-edit | Deferred. Path B (enhance structured editor) approved as future direction |

The v2 pivot is documented commit-by-commit in `git log` — start at
`acbcd48..8ce9887` to read it as a story.
