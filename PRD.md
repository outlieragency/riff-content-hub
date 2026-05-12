# Riff — Product Requirements Document

> **Audience:** Design team (UI/UX redesign)
> **Product:** Riff by Outlier Agency
> **Live at:** `riff.outlieragency.co`
> **Owner:** Earth Rati
> **Status:** v1 live, single-user (Earth), pre public-beta
> **Last updated:** 2026-05-12

---

## 0. How to read this doc

This PRD documents Riff **as it stands today** plus the gaps that
block its next phase. It is not an aspirational greenfield brief —
the product is already running in production at `riff.outlieragency.co`
with the architecture and features described below.

Use this doc as:
- A reference for what exists (so the redesign doesn't accidentally
  scope out a working feature).
- A pain-point inventory (so the redesign actively fixes what's
  overlapping or hidden today).
- A constraint sheet (so the redesign respects the tech stack +
  brand voice).

---

## 1. Executive Summary

### What Riff is

**Riff is an AI Ghostwriter for Thai founders and creators who don't
want to be on camera.** Paste a YouTube URL → Riff fetches the
transcript, translates Thai, summarizes it, then rewrites it as a
**Facebook long-form post** or **Instagram Carousel** in the user's
own voice and brand template.

### Two halves of the value prop

1. **Research layer (the moat)** — discovers viral videos from
   tracked YouTube channels using an Outlier Score
   (`views ÷ subscriber_count`). This is where Riff differs from a
   generic LLM chat product: it brings the input.
2. **Voice layer + Template layer (the craft)** — extracts a Voice
   Profile from the user's existing writing, then lets the user
   upload screenshot references that AI parses into reusable
   HTML carousel/cover templates. Each template carries its own
   writing prompt so a "bold quote" template sounds different from
   a "narrative arc" template.

### Why the pivot to FB + IG only

Phase 7 (2026-05-12) trimmed the format menu from four to two.
Reels Script and YouTube Script were available but never the
strongest output. The new positioning — *AI Ghostwriter for founders
who don't want to be on camera* — leans into Earth's actual customer
("founder, 35-50, B2B service, wants thought-leadership without
filming"). Text-first formats serve that ICP directly.

### Out of scope for v1

- Reels / TikTok script generation
- YouTube long-form script generation
- Direct posting to FB / IG / X (export only)
- Email sequences, ad copy, sales pages
- Multi-user workspaces or team collaboration
- Mobile app (responsive web only)
- Voice / audio input
- Multi-language (Thai + English only)
- Public billing / tiers (Earth is single-user during validation)

---

## 2. Personas

### Primary — "Earth" (current single user)

- Solopreneur + agency owner running Outlier Agency
- Posts FB + IG content daily to drive leads to a digital
  product + done-with-you funnel offer
- Mixes Thai-English in industry terms ("Sales Funnel", "Offer",
  "Solopreneur", "Leverage")
- Tone: "wise direct friend" — practical, contrarian, no hype
- Knows the AI stack — happy to tune prompts, theme colors,
  template HTML if exposed in the UI
- Will not tolerate going back into the codebase to change UI copy
  or prompt text — the platform must self-edit

### Secondary — "Khun A" (post-launch target ICP)

- Thai SME founder, 35-50yo
- Service business, professional services (consulting, real estate,
  solar, agency, coaching)
- Audience: 0-10K followers, wants thought-leadership
- Tech savvy: medium — uses FB / LINE / basic SaaS, not an early
  adopter
- Refuses to be on camera
- Has 30-60 min/week to spend on content
- Pain: "I tried ChatGPT — it sounds generic. I tried hiring a
  ghostwriter — they don't sound like me. I don't want to be an
  influencer, I want to be the expert."

---

## 3. Core Product Flows

### 3.1 Daily research-to-content loop

```
[1] Track YouTube channels (one-time setup)
       ↓
[2] /discover surfaces outlier videos (views ÷ subscriber > avg)
       from tracked channels + curated shared pool
       ↓
[3] Click a video → save to /ideas (auto-fetches transcript,
       translates Thai if needed, runs summarize)
       ↓
[4] On /ideas/{id} pick a format:
       • FB Post  → optional FB-post template dropdown
       • Carousel → optional carousel template dropdown
       ↓
[5] AI generates draft using:
       • Voice profile (extracted from past samples)
       • Template's writing_prompt (per-template guidance)
       • Template's HTML + schema (visual layout)
       ↓
[6] Renderer:
       • FB Post  → Playwright screenshots cover.png (1080×1080)
       • Carousel → Playwright screenshots N×PNG (1080×1350)
       Uploaded to Supabase Storage, URLs saved to draft.output
       ↓
[7] /recreated/{draft_id} viewer
       • FB Post  → post body + cover image + "Edit cover" handoff
       • Carousel → grid of slide PNGs + "Edit slides" handoff
       ↓
[8] "Edit" link → /carousel-templates/{template_id}
       • Generated slides loaded into live editor
       • Iframe Path B preview renders Jinja HTML in real-time
       • Tweak text / theme / fonts / image fields
       • Auto-saves draft every 1.2s
       • Download single PNG or ZIP of all slides
```

### 3.2 Quick paste flow (skips Discover)

```
[1] Sidebar "Quick from URL" → paste YouTube URL
       ↓
[2] Modal asks: Save / Recreate as FB Post / Recreate as IG Carousel
       ↓
[3] On Save → goes to /ideas/{id} (same as flow 3.1 from step 3)
   On Recreate FB → auto-processes + redirects to /recreated/{id}
   On Recreate Carousel → same auto-flow but with carousel pipeline
```

### 3.3 Template authoring flow

```
[1] /carousel-templates → click "Upload template"
       ↓
[2] Pick format type: "IG Carousel" or "FB Post (cover)"
       ↓
[3] Upload screenshot (PNG/JPG/WebP, ≤8MB)
       ↓
[4] AI vision (Claude Sonnet 4.6) parses screenshot →
       • html_template (Jinja2 inline-CSS)
       • schema[] (editable fields: text / longtext / image)
       • default_theme (bg/fg/accent/font_heading/font_body)
       • name_suggestion
       ↓
[5] Lands in editor at /carousel-templates/{new_id}
       • Edit name + theme + writing_prompt
       • Manually generate slides via "Generate from idea" modal
       • Or use this template later via flows 3.1/3.2
```

### 3.4 Voice extraction flow

```
[1] /voice → paste 5-15 past Earth posts (or any past writing)
       ↓
[2] AI extract (Claude Sonnet 4.6) → voice_profile JSON
       (tone_words, signature_phrases, vocabulary, sentence_rhythm,
        dos, donts, sample paragraphs)
       ↓
[3] Saved as active voice profile — used by every AI generation
       downstream
       ↓
[4] Re-train anytime by submitting new samples
```

---

## 4. Feature Inventory

### 4.1 Navigation (sidebar)

| Page | Purpose | Status |
|---|---|---|
| `/today` | Dashboard — recent drafts + counts | live |
| `/discover` | Outlier video feed (tracked + curated) | live |
| `/ideas` | Saved video ideas waiting to be recreated | live |
| `/recreated` | All drafts (FB Post + Carousel) | live |
| `/channels` | Track YouTube channels + niche tagging | live |
| `/voice` | Voice profile management | live |
| `/carousel-templates` | Template gallery (FB Post + Carousel) | live |
| `/settings` | Profile, AI provider keys, integrations, prompts | live |

### 4.2 Core capabilities

#### Discovery
- Track YouTube channels by URL or handle
- Auto-sync videos + thumbnails + subscriber count (cron)
- Compute Outlier Score = `views / subscriber_count`
- Niche tagging (per-channel multi-select)
- Shared curated pool — Outlier provides preset top creators per niche
- Filter feed by niche chips
- "Latest" vs "Outliers" sort modes

#### Transcript + Summarize
- Fetch via youtube-transcript-api (Webshare proxy support for cloud)
- Translate non-Thai → Thai (Claude Haiku 4.5, max 32k output tokens)
- Summarize into structured JSON (hook, body sections, examples,
  takeaways, CTA) (Claude Sonnet 4.6)
- Cached per video — subsequent recreates of the same idea reuse
  the summary

#### Voice profile
- Paste samples (any text format)
- AI extracts JSON profile
- Only one active profile per user
- Editable JSON via UI

#### Carousel templates
- Upload screenshot → AI parse to HTML+schema+theme
- Format types: `carousel` (multi-slide) and `fb_post` (single cover)
- Live editor with iframe Path B preview (same Jinja HTML the
  renderer will screenshot — no React/Jinja drift)
- Per-template writing prompt (layered on top of global prompt)
- Auto-save draft (slides + theme) every 1.2s
- Multi-slide tabs with Add / Duplicate / Remove (carousel format)
- Image fields: drag-drop upload with auto-fit (object-fit:cover)
- Theme: bg/fg/accent color pickers + Google Font dropdowns
  (curated list of Thai-friendly fonts)
- Generate slides via "Generate from idea" modal:
  - Paste idea text
  - Slide count slider (locked to 1 for fb_post)
  - AI generates field values using voice + template writing_prompt
- Render: single PNG download or batch ZIP download

#### Recreate (URL → draft)
- /recreate route accepts:
  - `format` (fb_article | carousel)
  - `voice_profile_id` (optional)
  - `creative_style_id` (legacy)
  - `carousel_template_id` (new)
  - `fb_post_template_id` (new)
  - `instruction_extra` (extra guidance string)
- Two pipelines per format:
  - **Built-in** (legacy): fixed Jinja cover renderer, fixed
    carousel thread-x template
  - **Template-based** (Phase 4-6): uses user-uploaded
    `carousel_templates` row

#### Settings
- AI provider keys (Anthropic / OpenAI / Google / OpenRouter)
- Provider keys encrypted at rest (pgsodium)
- Per-task model routing
- Notion integration (token + content hub DSID + output tracker DSID)
- Profile (display name, timezone, language)
- **Prompts editor** at `/settings/prompts` — 10 editable AI prompts:
  - `recreate-fb-article`
  - `recreate-carousel`
  - `generate-carousel-slides`
  - `generate-fb-post-from-template`
  - `parse-carousel-template`
  - `fb-cover-variants`
  - `fb-headline-craft`
  - `fb-hook-frameworks`
  - `fb-personal-experiences`
  - `earth-rati-fb-style`
  - `system_voice_wrapper`

---

## 5. Data Model (high-level)

```
auth.users
  ↓ 1:1
user_settings (profile, encrypted provider keys, task model map)

auth.users
  ↓ 1:N
channels (tracked YT channels per user)
  ↓ 1:N
videos (synced)
  ↓ 1:N
ideas (user-curated)
  ↓ 1:N
recreated_drafts (output of recreate flow)
       output: jsonb — shape varies by format/kind
       kind='template' / 'template_fb_post' = new pipeline
       (no kind) = legacy built-in pipeline

auth.users
  ↓ 1:N
voice_profiles (only 1 is_active per user)

auth.users
  ↓ 1:N
carousel_templates
  - format_type: 'carousel' | 'fb_post'
  - html_template, schema (jsonb), default_theme (jsonb)
  - writing_prompt
  - last_draft (jsonb) — autosaved editor state

auth.users
  ↓ 1:N
user_prompts (per-user override for the worker's .md prompt files)

shared_channels + shared_videos (curated pool, no user_id, public read)

storage buckets:
  fb-covers/{user_id}/{draft_id}/cover.png   (FB Post + carousel slides)
  carousel-templates/{user_id}/{tpl_id}/source.png   (uploaded screenshots)
  carousel-templates/{user_id}/{tpl_id}/fields/{key}-{stamp}.png   (user-uploaded image fields)
  creative-styles/{user_id}/{style_id}/ref-*.png   (legacy creative_style refs)
```

Every per-user table is RLS owner-only. Shared tables use public-read
RLS policies. The worker uses the service-role key when it needs to
write across users (curated pool sync); the portal always uses the
authenticated user's session.

---

## 6. AI Architecture

```
┌────────────────────────────────────────────────────┐
│ Caching: 5-block prompt-cache structure (mandatory │
│ for every Claude call) — target hit rate ≥ 60%     │
│ See worker/app/services/claude/caching.py          │
└────────────────────────────────────────────────────┘

Voice extraction          Sonnet 4.6   tool_use
Translate to Thai         Haiku 4.5    32k max output
Summarize transcript      Sonnet 4.6   tool_use (structured)
Recreate FB article       Sonnet 4.6   tool_use (FB_ARTICLE_TOOL)
Recreate carousel slides  Sonnet 4.6   JSON parse with json_repair
Parse carousel template   Sonnet 4.6   tool_use (submit_template) +
                                       vision (image input)
Generate carousel slides  Sonnet 4.6   tool_use (submit_slides)
Generate FB post template Sonnet 4.6   tool_use (submit_fb_template_post)
Extract creative style    Sonnet 4.6   vision
Niche classifier          Haiku 4.5    bounded JSON
```

**Tool Use everywhere** — Anthropic's tool_use API guarantees
structured output, eliminating the "AI returned non-JSON" class of
errors that plagued early Riff.

**Per-user routing** — `worker/app/services/llm/` checks if the
authenticated user has set their own Anthropic key in
`user_settings.provider_keys_encrypted`. If yes, route through their
key (BYO-key model). If not, fall back to platform key.

---

## 7. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router) + TypeScript + Tailwind |
| UI primitives | shadcn/ui base + custom components |
| State | Server actions + Supabase Realtime for job progress |
| Backend (heavy) | FastAPI Python on Railway |
| Backend (light) | Next.js server actions (Vercel) |
| Database | Supabase Postgres (project `kwwsmpsnneakribwkake`) |
| Auth | Supabase Auth |
| Storage | Supabase Storage (3 buckets, public-read with RLS upload) |
| Realtime | Supabase Realtime for jobs table |
| LLM | Anthropic Claude (Sonnet 4.6 + Haiku 4.5) |
| Rendering | Playwright (Chromium) + Jinja2 |
| Transcript | youtube-transcript-api + Webshare residential proxy |
| Encryption | pgsodium (provider keys, Notion token) |
| Deploy (portal) | Vercel (auto-deploy on `git push origin main`) |
| Deploy (worker) | Railway (auto-deploy on `git push origin main`) |
| DNS | Cloudflare |

---

## 8. UI/UX Audit — What Hurts Today

The redesign should specifically address these pain points. Each
item is a real workflow Earth has hit:

### 8.1 Sidebar still has legacy / overlap

- `/today` (Dashboard), `/discover`, `/ideas`, `/recreated` —
  four pages for what could be one unified "Workspace"
- `/voice` and `/templates` (now /carousel-templates) are similar
  concepts (both are "personalization assets") but live separately
- `/channels` mixes research config with content config
- Sidebar order doesn't match daily workflow frequency

### 8.2 Recreate format-picker fragments

The `/ideas/{id}` page has the format-picker, but the user gets
there only after going through `/discover` or `/ideas`. The "Quick
from URL" modal is the much faster entry but is hidden as a small
button in the sidebar.

The most-used action ("paste URL → make me an FB Post") is 3
clicks deep instead of 1.

### 8.3 Two ways to do the same thing

The legacy "built-in template" path (fb_article + thread-x carousel)
still exists alongside the new "user template" path. The UI today
treats them as a dropdown choice ("Built-in" vs your templates), but
the legacy path has none of the new editing affordances. Users either
discover the new path or stay stuck with worse output forever.

**Recommendation for redesign:** retire the built-in path visually.
If a user has no templates, the empty state should guide them to
upload one — not silently fall back to the legacy renderer.

### 8.4 Template editor crams too much in one column

The current editor has Template name → Slides tabs → Content fields →
Writing prompt → Theme → all stacked vertically in a 420px column.
For a template with 6 fields × 5 slides, the column is 3-4 screens
tall, and the writing prompt + theme are at the very bottom (rarely
seen).

**Recommendation:** tabbed left panel (Content / Theme / Writing
prompt / HTML+Schema advanced) keeping the iframe preview always
visible.

### 8.5 No HTML / schema editor

Today the user uploads a screenshot, AI parses HTML+schema, and the
user can never touch those again. If the AI got the schema wrong
(missed a field, wrong type, awkward names) the only fix is to
delete and re-upload. The raw HTML is similarly locked.

**Recommendation:** an "Advanced" tab in the template editor exposing:
- Schema editor (add/remove/rename fields, change type, change
  default, change max_chars)
- HTML editor (Monaco-style code block with live iframe preview)

This is a hard requirement for the "edit everything via UI" promise
(see §10).

### 8.6 The `/recreated/{id}` viewer is read-only

After a draft is generated, the user can only view it. To iterate
text they have to either:
- Copy → paste into a separate editor → manually re-render
- Or jump back to the template editor (which then doesn't know
  about this specific draft — it loads the template's `last_draft`
  which may have been overwritten by another generation)

**Recommendation:** make `/recreated/{id}` itself an editor.
Per-draft state, not template-shared `last_draft`. Each draft
should be its own independent slides + theme record.

### 8.7 Quick from URL modal flow

Today: URL → "Save / Recreate as FB / Recreate as Carousel" buttons.
If user picks "Recreate", they can't pick a template — it uses the
default (built-in). To use a custom template they have to Save first,
then navigate to `/ideas/{id}` and pick from there.

**Recommendation:** Quick modal should mirror `/ideas/{id}` format
cards — show template dropdown inline, one-click recreate.

### 8.8 Inconsistent visual language

The app uses orange (`#FF751F`) as accent on light off-white surfaces.
Marketing site uses similar palette with cream paper feel. But within
the app, some surfaces use shadcn defaults (gray hues), some use brand
soft (#FFE9DC), some use card white. Buttons range from `bg-brand`
to `bg-foreground` to outline-only — no clear hierarchy.

**Recommendation:** a unified design token set with:
- 1 surface system (background / card / elevated)
- 1 accent (kept as orange or migrated to PRD's monochrome — see §11)
- 1 button hierarchy (primary / secondary / ghost / destructive)

### 8.9 Mobile is technically responsive but practically unused

The editor's split layout (form 420px + iframe 1fr) doesn't gracefully
collapse. Mobile users get the form stacked above the iframe with
no tab UI to switch. Carousel template upload + AI parse + render
are also Earth's longest sessions (15+ min) — mobile is wrong for
that anyway.

**Recommendation:** explicitly desktop-only for the editor. Mobile
gets read-only browsing of /recreated and a "Open on desktop" prompt
for editing.

### 8.10 Empty / loading / error states are inconsistent

- Loading: mix of spinners, "AI กำลังเขียน..." text, skeleton screens
- Empty: some pages have illustrations, some are bare
- Error: red toast vs inline red text vs banner — no system

**Recommendation:** designer to spec one set of states applied
globally.

---

## 9. Brand Voice (use in UI copy)

These rules already live in `_context/outlier-agency-brand-context.md`
and `AGENTS.md`. The redesigned UI must keep them — they're what
makes Riff feel like Earth's voice, not ChatGPT's.

### Language
- **Thai-English mixed** in industry terms ("Sales Funnel", "Offer",
  "Leverage", "Solopreneur", "Skin in the Game", "Outlier")
- Conversational Thai for everything else — "พี่" / "คุณ" depending
  on context (never "ท่าน")

### Register
- "Wise direct friend" — practical, contrarian, no hype, no
  motivational fluff
- Pragmatic > inspirational

### Hard "don't"s
- **No em dash** (—) in user-facing copy
- **No ellipsis** (…) beyond strict necessity
- **No emoji** in body / microcopy (functional icons in UI only)
- **No exclamation marks** except 1-2 genuine celebration moments
- **No "🎉 Awesome!" / "Unlock your potential" / corporate** energy

### Examples

| ดี | ห้าม |
|---|---|
| "วันนี้คิดอะไรอยากเขียน?" | "🎉 Ready to create amazing content?" |
| "Voice profile ของคุณพร้อมแล้ว" | "Your AI is ready to crush it!" |
| "ลองอันนี้ดู น่าจะตรงสไตล์" | "AI-powered magical generator" |
| "Generate เสร็จแล้ว — edit ก่อน post" | "✨ Content unlocked!" |

---

## 10. "Edit Everything via UI" — Gap Analysis

The product promise is **no code touches**. This is what's editable
today vs what still needs git push.

### Editable via UI today ✓

| Surface | Where |
|---|---|
| Voice profile (paste samples) | `/voice` |
| AI provider keys (encrypted) | `/settings` |
| Notion integration token + IDs | `/settings` |
| Profile / timezone / language | `/settings` |
| Tracked channels + niche tags | `/channels` |
| Niche assignment per channel | `/channels` |
| Creative style references (legacy) | `/templates` (hidden from nav) |
| **AI prompts** (10 of them, see §4.2) | `/settings/prompts` |
| Carousel template name | template editor |
| Carousel template theme (3 colors + 2 fonts) | template editor |
| Carousel template writing_prompt | template editor |
| Carousel template field VALUES (per slide) | template editor |
| Add/remove/duplicate slides | template editor |
| Image fields (drag-drop upload) | template editor |
| Generate slides from idea | template editor (modal) |

### Requires git push (gaps) ⚠️

| Surface | Impact | Priority |
|---|---|---|
| Carousel template **HTML** (raw Jinja2) | High — AI's parse is sometimes off; user can't tweak layout | **P0** |
| Carousel template **schema** (add / remove / rename / retype fields) | High — same issue, locked at parse time | **P0** |
| Carousel template width / height | Medium — currently 1080×1350 only | P2 |
| Worker prompts NOT in `/settings/prompts` whitelist (`summarize.md`, `translate-th.md`, `extract-voice-profile.md`, `extract-creative-style.md`) | Low — system prompts, rarely tuned | P2 |
| Built-in carousel templates (`thread-x`, `minimal-thai`) | None — superseded by user templates | retire |
| Built-in FB cover template HTML | Low — superseded by FB-post template upload | retire |
| Curated shared creator pool | Low — admin-side feature | P3 |
| Sidebar nav structure | Low — code change | P3 |
| Marketing copy (hero / features / FAQ) | Medium — Earth iterates pre-launch | P1 |

### Requirements for v1.1 — "fully editable"

The two P0 items together unlock the full promise:

**Schema editor** in the template editor → Advanced tab:
- List of fields with key, type, label, default, max_chars
- Add field (with type selector: text / longtext / image)
- Remove field (warning if HTML still references the placeholder)
- Rename field (with HTML find/replace assist)
- Reorder fields (display order in editor)

**HTML editor** in the template editor → Advanced tab:
- Monaco editor with Jinja2 / HTML syntax highlighting
- Side-by-side iframe live preview (existing Path B)
- Validation: warn if HTML references placeholders missing from
  schema, or vice versa

Both should be hidden by default (Advanced tab opt-in) — most users
will never need them, but the platform must not block the user who
does.

---

## 11. Design Direction Options

Earth has not committed to a final aesthetic. Two viable directions
for the designer to evaluate:

### Option A — Keep current Outlier orange

- Accent: `#FF751F` (current)
- Surfaces: warm off-white / cream paper
- Vibe: friendly, energetic, Thai SME-approachable
- Pros: continuous with Outlier Agency brand; warmer; less generic
- Cons: feels less "serious / expert"; risks looking like a
  generic SaaS template
- Reference: current `riff.outlieragency.co`

### Option B — Pivot to monochrome (Linear / Substack / Notion)

- Accent: near-black on off-white, sparing color usage
- Surfaces: `#FAFAF9` base, `#1C1B1A` ink, `#E5E4E2` dividers
- Vibe: serious, professional, writer-first
- Pros: matches "AI Ghostwriter for founders" positioning; signals
  expertise; ages well
- Cons: requires re-skin of entire app; loses Outlier visual brand
  continuity
- Reference: substack.com, linear.app, notion.so

### Option C — Hybrid

- Marketing site: keep orange (Outlier brand continuity)
- App surfaces: monochrome (writer-first focus)
- Pros: best of both
- Cons: brand identity discontinuity at the auth boundary

### Designer recommendation request

Evaluate all three. Earth's tendency is toward Option A (own the
warm/practical brand) — but designer should push back if a stronger
case exists for B or C.

---

## 12. Key Screens (current → redesign scope)

The designer should rework all of these. Listed in priority order
of how often they're used.

1. **`/today` Dashboard** — primary landing, currently mostly recent
   drafts list. Should become the "next action" launcher.
2. **`/discover`** — outlier video feed. Currently functional but
   visually dense (cards, badges, stats per row).
3. **`/ideas/{id}`** — recreate format picker. The two-card FB / IG
   layout is new (Phase 7) and works conceptually but design polish
   needed.
4. **`/carousel-templates/{id}` editor** — the biggest information-
   density problem. Form column overflows; advanced features need
   to be tabbed.
5. **`/recreated/{id}` viewer** — currently read-only; should
   become per-draft editor (see §8.6).
6. **Quick from URL modal** — entry point; merge template picker
   into the modal (§8.7).
7. **`/voice`** — voice profile management. Currently raw JSON
   editing; designer to spec field-by-field UI.
8. **`/channels`** — tracked channel management.
9. **`/settings`** + **`/settings/prompts`** — settings hub.
10. **Marketing site** (`/`) — public landing, hero, features,
    FAQ. Updated copy in Phase 7 but not visual.

---

## 13. Open Questions for Design Team

The designer should answer these as part of the brief return:

1. **Sidebar consolidation** — Is the right move to merge
   `/today` + `/discover` + `/ideas` + `/recreated` into one
   "Workspace" with tabs? Or keep separate?

2. **Template gallery vs Inline picker** — Should `/carousel-
   templates` remain its own page, or surface templates inside
   the recreate flow (so user never leaves the recreate context)?

3. **"Edit slides" handoff after Recreate** — Should clicking
   "Edit slides" from `/recreated/{id}` navigate to a dedicated
   per-draft editor (new route), or load the template editor with
   draft-specific state?

4. **Built-in path retirement** — How visible should the legacy
   built-in renderer be? Hard-retire (remove from UI entirely) or
   soft (only fall back if user has zero templates of that format)?

5. **Single-user mode UI signals** — Riff is currently single-user
   (no billing, no sharing). Should the redesign include UI
   affordances for future multi-user (e.g. workspace switcher,
   team avatars) even if v1 is solo?

6. **Monaco editor weight** — For the HTML/schema advanced editor
   (§10), Monaco (~2MB) is heavy. Lighter alternative? Or
   acceptable since it's behind an Advanced tab?

7. **Mobile** — Read-only browsing + "Open on desktop" prompt
   when an edit action is tapped — acceptable, or should mobile
   editor be a v1.x deliverable?

---

## 14. Non-Negotiables for the Redesign

Things the new design must preserve from current Riff:

1. **Research layer is the moat** — `/discover` and the Outlier
   Score concept must remain front-and-center, even if visually
   reworked.

2. **Voice profile drives everything** — Every generation surface
   must visibly use the user's voice. The voice is the differentiator.

3. **Template + Writing prompt pairing** — A carousel/FB template
   is not just visual; it carries its own copy reference. The
   redesign must keep these conceptually paired.

4. **Live iframe preview** — Path B (server-rendered Jinja → iframe
   srcDoc) is the only way to guarantee preview-matches-PNG.
   Designer should expect this constraint in any "live editor"
   spec.

5. **Tool Use everywhere** — All AI calls return structured data
   (no JSON parse failures). The redesign's loading / error states
   should reflect this stability — no "AI failed, try again" fear.

6. **Thai-first** — Microcopy, error messages, helper text all
   primarily Thai. English only where industry terms are clearer.

7. **No-hype voice** — Every microcopy decision passes through
   "would Earth say this?" filter. See §9.

---

## 15. Out of Scope (Hard No for v1)

These are real requests that have come up in conversations. The
redesign should not waste cycles on them.

- ❌ Reels / TikTok / X scripts (cut Phase 7)
- ❌ Direct posting to FB / IG (export only)
- ❌ Email automation
- ❌ Sales page / landing page builder
- ❌ Ad copy generator
- ❌ CRM / lead capture
- ❌ Analytics dashboard / performance tracking
- ❌ Multi-user team collaboration
- ❌ Mobile editor (read-only mobile is fine)
- ❌ Voice / audio input
- ❌ Multi-language beyond Thai + English
- ❌ Public billing tiers (Earth single-user during validation)
- ❌ AI image generation (image upload only — no Midjourney-style
  generation)

---

## 16. Deliverables Expected from Design Team

1. **Figma file** with:
   - Style guide (colors, type scale, spacing, components)
   - All key screens from §12 at desktop + tablet breakpoints
   - Empty / loading / error states for each
   - Component library mapped to existing shadcn/ui primitives

2. **Click-through prototypes** of:
   - Daily research-to-content loop (§3.1)
   - Quick paste flow (§3.2)
   - Template upload + edit (§3.3)

3. **Design tokens** as Tailwind config additions (or replacement)
   the engineering team can drop in.

4. **Annotations** for any new component requiring engineering
   work (e.g. the Advanced HTML/schema editor in §10).

5. **Written answers** to the open questions in §13.

---

## 17. Sign-Off

- [ ] Product Owner — Earth Rati
- [ ] Design Lead — (TBD)
- [ ] Engineering — (Earth doubles as engineering for now)

---

## Appendix A — Related Internal Docs

| Path | Purpose |
|---|---|
| `SPEC.md` | Engineering spec (architecture + decisions + slice history) |
| `AGENTS.md` | Dev operating manual + module conventions |
| `RIFF-OVERVIEW.md` | Earlier high-level overview |
| `RIFF-PITCH.md` | Pitch / positioning notes |
| `_context/outlier-agency-brand-context.md` | Workspace-wide brand voice rules |
| `worker/app/prompts/*.md` | All AI prompts (10 editable via UI, others system-level) |
| `portal/supabase/migrations/*.sql` | Full DB schema history (26 migrations as of Phase 7) |

## Appendix B — Phase History

For context on what's been built when:

| Phase | What shipped | Date |
|---|---|---|
| 0-7 | Riff v1 core — channels, videos, ideas, recreate, voice, FB cover, built-in carousel | 2026-Q1 |
| 8 | Cache report — hit rate >60% confirmed | early Q2 |
| 9 | Niche tagging + filter | 2026-05-10 |
| 10 | Shared curated creator pool | 2026-05-11 |
| 11 | Webshare proxy support | code ready, needs activation |
| Prompts UI | `/settings/prompts` — edit prompts without code | 2026-05-12 |
| 1-3 | Carousel templates: upload, AI parse, live editor, multi-slide, PNG/ZIP | 2026-05-12 |
| 4 | URL → recreate with carousel template | 2026-05-12 |
| 5 | Per-template writing_prompt + draft handoff | 2026-05-12 |
| 6 | FB Post template system (mirror of carousel) | 2026-05-12 |
| 7 | Focus pivot — cut Reels + YT Script from UI, marketing copy update | 2026-05-12 |
| Image upload UX | Drag-drop image fields, auto-fit prompt | 2026-05-12 |
