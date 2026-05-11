# Riff — Project Overview

> For marketing team / partners / collaborators picking up context.

**Last updated:** 2026-05-11
**Status:** Live · single active user (Earth, founder)
**Live URL:** [riff.outlieragency.co](https://riff.outlieragency.co)

---

## 1. Riff in one line

**A daily content engine for solo creators and founders who want to
ship every day — without spending hours hunting for ideas.**

In three lines:
- Pick niches → Riff discovers outlier videos in each
- Open the app in the morning → see what beat its channel's average
- Click recreate → AI writes a FB post in your voice + renders the cover

## 2. The problem

The hypothesis: the bottleneck for solo creators isn't "writing one
post slowly" — it's "shipping consistently for 90 days straight."

Pain points heard from founders in course / coaching / digital
product niches:

1. Open YouTube / IG looking for ideas → scroll for an hour
2. Post 7 days, miss 3, restart 4 — never compounds
3. After a month, you've forgotten which ideas worked
4. Generic AI (ChatGPT / Claude) makes everyone sound the same
5. Hiring an agency costs 30,000-100,000 baht/mo; doing it solo = burnout

Riff's bet: **discovery is the hard part**. Execution (writing, cover,
copy-paste) is already covered by half a dozen tools. Riff focuses on
discovery + a frictionless habit loop.

## 3. Mechanism

```
1. RESEARCH    AI surfaces outlier videos in your niches every day
2. ORGANIZE    save into the Idea Library, group with boards
3. DECODE      AI extracts transcript + structure of the viral video
4. RECREATE    AI generates new content in your voice (FB / IG / Reels / YT)
```

Two discovery sources feed the `/discover` feed:
- **Tracked channels** Earth adds himself
- **Shared creator pool** — top creators per niche pre-synced by the
  worker, so the feed surfaces fresh signal Earth doesn't track yet

Outlier Score formula:
```
score = views / subscribers
```
Same formula vidIQ + creator agencies use. Measures reach beyond the
channel's existing audience, not raw popularity.

## 4. Target user

**Primary:**
- Solo creator / founder — course creator, coach, consultant, digital
  product seller
- 100k+ followers OR pre-scale expert
- Treats FB as their primary content channel
- Tried hiring an agency and was burnt by cost or burnt out doing it solo

**Secondary:**
- Thai content creators who pull EN content for inspiration
- Founders building a personal brand without a team

**Not the target:**
- Generic content writers / copy agencies
- E-commerce / physical product brands
- Entertainment influencers

## 5. Current state (built · 2026-05-11)

### ✅ Live + working

- **Discover feed** — `/discover` with mode tabs, niche chip filter,
  Suggested Creators row, and a curated pool that surfaces creators
  Earth doesn't track yet
- **Niche tagging** — every channel carries `niches text[]`,
  auto-classified by Claude Haiku on add, hand-editable on
  `/channels/[id]`
- **Daily Brief** — top 5 outliers + week-streak badge on the home
  dashboard
- **Idea Library** — `/ideas` for saved videos, optional boards for
  theme grouping
- **Recreate** — FB long-form, IG carousel, Reels script, YT script,
  all driven by Earth's voice profile
- **Voice profile** — extracted from past posts, hand-editable
- **Cover renderer** — Playwright-rendered trendtech-portrait cover
  (1080×1350, tri-color highlight, hand-drawn arrow), with a live
  inline editor for headline / highlight / arrow caption / creator
  badge
- **Quick from URL** — paste a YouTube link → recreate to the chosen
  format
- **Notion push** — recreated draft → Content Hub + Output Tracker DBs
- **Auth** — Google OAuth + email allowlist
- **Founder admin** — manage allowlist, view waitlist + survey
- **Marketing site** — landing + waitlist + onboarding survey

### Tech stack

- Frontend: Next.js 16 (App Router) on Vercel
- Backend: FastAPI Python on Railway, Playwright + Chromium for cover render
- DB / Auth / Storage: Supabase, ap-south-1 (Mumbai)
- AI: Anthropic Claude Sonnet 4.6 + Haiku 4.5 (prompt caching mandatory)
- DNS: GoHighLevel

### Architecture decisions

- Single-tenant with RLS from day one — SaaS-ready, zero refactor cost
- Heavy reuse from `Outlier Carousel` + `client-portal` codebases
- Prompt caching target ≥60% input-token cache hit
- Worker stateless, jobs queued in Postgres
- Shared creator pool sits outside RLS (public read, service-role write)
  so every authenticated user can pull from the same curated catalog

## 6. Roadmap

### Now — validate daily use
Earth uses the live build every day; ship surgical fixes (parser
hardening, imposter cleanup, etc) rather than new features. The
single-user data informs every decision below.

### Next — extend the discovery loop
- Curated pool sync on a schedule (daily cron, not on-demand only)
- Verified handle audit for `niche-creators.ts` — replace any handle
  that resolves to an imposter (today's blocklist is the floor)
- Performance analytics — which post reach was highest in the last 30
  days; AI suggests follow-ups in the same vein

### Later — Phase 3 channels
- Instagram, TikTok, X discovery (Eden's multi-platform parity)
- Probably via Apify or direct platform APIs depending on plan tier

### Phase C — public + monetize
- Stripe webhook auto-grants access
- Pricing tiers (TBD)
- Onboarding survey → segmented waitlist for acquisition

## 7. Decisions log

| Date | Decision | Why |
|---|---|---|
| 2026-05-09 | Cancel canvas-style cover editor v2 | Canva does it better — out-build, not out-compete |
| 2026-05-09 | Cancel schema-driven templates | Over-engineered. 3 hardcoded templates first, validate, then expand |
| 2026-05-10 | Drop manual channel-add → AI auto-curate by niche | Onboarding goes from 3 steps to 1 |
| 2026-05-10 | Strip multi-format Quick URL | Earth posts only to FB — default to that, keep the option |
| 2026-05-10 | Stop adding features, start validating | Feedback: "feature เยอะ, ใช้จริงไม่ได้" |
| 2026-05-10 | Tried v2 "cover-only" pivot, reverted same day | The narrower scope killed discovery — Riff's whole point. v1 surface restored from `3eada56` + DB JSON snapshots |
| 2026-05-10 | Add niche tagging + filter to `/discover` | Stop the feed from recycling the same channels |
| 2026-05-11 | Shared creator pool | Surface video from creators Earth doesn't track, in his picked niches. Imposter-resistant via `MIN_SUBSCRIBER_FLOOR = 5000` |
| 2026-05-11 | Defer Canva-clone post-gen editor | Polotno or custom canvas = 3+ weeks. Path B (enhance structured editor) gets 80% of value at 5% of effort |
| 2026-05-11 | Webshare proxy for cloud transcript fetch | $3.50/mo beats Mac+Tunnel ops baggage; one paid line item buys full cloud reliability |

## 8. Open questions

1. Pricing model — flat subscription vs pay-per-recreate vs free + premium discovery
2. Multi-platform priority — IG vs TikTok vs X first
3. Thai creator coverage — when to add Thai creators to the
   `niche-creators` map (today's catalog is all EN)
4. B2B vs B2C — sell to solo creators or to agencies who run content
   for their clients
5. Stripe timing — beta free for 30-90 days for feedback, or charge from day one

## 9. People

- **Earth Rati (founder)** — ex-Solopreneur (7-figure baht/mo from
  Notion templates + courses), now runs Outlier Agency (Sales Funnel
  via GoHighLevel). Riff started as his own internal tool.
- **Outlier Agency clients** — MissMook (50% profit share), Sistangkwa
  (20%) — both run through GHL funnels, not Riff
- **Tech / AI partner** — Claude (Anthropic)

## 10. Related docs

- **Spec (architecture, formulas, decisions):** [`SPEC.md`](SPEC.md)
- **Developer guide (build state, debug paths):** [`AGENTS.md`](AGENTS.md)
- **Deploy runbook:** [`DEPLOY.md`](DEPLOY.md)
- **Pitch (for investors):** [`RIFF-PITCH.md`](RIFF-PITCH.md)
- **Brand voice:** [`/_context/outlier-agency-brand-context.md`](../../../_context/outlier-agency-brand-context.md)
- **Live URL:** [riff.outlieragency.co](https://riff.outlieragency.co)
- **Repo:** [github.com/outlieragency/riff-content-hub](https://github.com/outlieragency/riff-content-hub)
