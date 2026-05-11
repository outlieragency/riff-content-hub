# Deploy

## Production targets

| Service | Target | URL |
|---|---|---|
| Portal | Vercel | https://riff.outlieragency.co |
| Worker | Railway | https://riff-content-hub-production.up.railway.app |
| DB / Auth / Storage | Supabase project `kwwsmpsnneakribwkake` (ap-south-1) | shared with portal + worker |

## First-time setup

### 1. Supabase project

Create in Supabase dashboard. Region `ap-south-1` (Mumbai) was chosen
over Singapore — empirically lower latency to Bangkok at the time.

Capture these from Settings → API:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — worker-only, never ship to the portal

### 2. Apply migrations

```bash
cd portal
npx supabase link --project-ref kwwsmpsnneakribwkake
npx supabase db push
```

Migrations 0001-0019 = v1 schema (channels, videos, ideas,
transcripts, recreated_drafts, voice_profiles, boards, creative_styles,
allowed_emails, waitlist, app_settings, user_settings).

0020 = `channels.niches text[]` + GIN index.
0021 = `shared_channels` + `shared_videos` for the curated pool.

### 3. YouTube Data API v3

- Google Cloud Console → enable "YouTube Data API v3"
- Create API key (restrict by HTTP referrer or IP)
- Quota: 10,000 units/day on the free tier — plenty for solo use

### 4. Anthropic API

- console.anthropic.com → create API key
- Recommend dedicating a workspace for content-hub so spend is tracked
  separately from other Outlier projects

### 5. Webshare residential proxy (REQUIRED for cloud transcript fetch)

YouTube IP-blocks `youtube-transcript-api` requests from cloud
datacenters. Without a proxy, recreate fails on the deployed worker
even though the rest of Riff works fine.

- Sign up at [webshare.io](https://www.webshare.io)
- Plan: **Rotating Residential ($3.50/mo)** — datacenter and static
  plans get blocked just as hard
- Capture the proxy username + password from the Webshare dashboard

### 6. Portal (Vercel)

```bash
# Connect repo to Vercel (root: Operation/apps/content-hub/portal)
# Build command: npm run build
# Output dir: .next
```

Required env vars:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
WORKER_URL=https://riff-content-hub-production.up.railway.app
WORKER_SECRET=<random-32-byte-hex; matches worker>
```

### 7. Worker (Railway)

```bash
# Connect repo to Railway (root: Operation/apps/content-hub/worker)
# Build: Dockerfile in worker/
```

Required env vars:
```
ANTHROPIC_API_KEY=
YOUTUBE_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
WORKER_SECRET=<same as portal>

# Transcript fetch on cloud — REQUIRED for recreate to work
WEBSHARE_PROXY_USERNAME=
WEBSHARE_PROXY_PASSWORD=

# Optional generic-proxy fallback (any HTTPS proxy)
# TRANSCRIPT_HTTP_PROXY_URL=
# TRANSCRIPT_HTTPS_PROXY_URL=

# Optional Notion push (Outlier Content OS)
NOTION_TOKEN=
NOTION_CONTENT_HUB_DSID=
NOTION_OUTPUT_TRACKER_DSID=

# Models (defaults shown)
ANTHROPIC_SONNET_MODEL=claude-sonnet-4-6
ANTHROPIC_HAIKU_MODEL=claude-haiku-4-5

PORT=8000
LOG_LEVEL=info
```

## DNS

- `riff.outlieragency.co` → CNAME → Vercel (managed at GoHighLevel)
- Worker uses Railway's default `*.up.railway.app` URL — no custom
  domain needed since only the portal calls it (server-side, by
  WORKER_URL env)

## Verification

```bash
# Portal
curl https://riff.outlieragency.co/api/health
# → { "ok": true }

# Worker
curl https://riff-content-hub-production.up.railway.app/health
# → { "ok": true, "service": "riff-worker", "time": "..." }

# Worker auth (requires WORKER_SECRET)
curl https://riff-content-hub-production.up.railway.app/internal/ping \
  -H "Authorization: Bearer $WORKER_SECRET"
# → { "ok": true, "authenticated": true }
```

## One-off ops

### Trigger curated pool resync

The `/discover` page exposes a `Refresh pool` button for the founder.
For automation:

```bash
curl -X POST https://riff-content-hub-production.up.railway.app/internal/sync-curated-pool \
  -H "Authorization: Bearer $WORKER_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"video_limit": 30}'
```

Iterates `CURATED_BY_NICHE` in
`worker/app/services/youtube/shared_pool_sync.py`. Takes 5-10 min for
the full ~25-creator catalog. Imposters (< 5000 subs) are rejected at
write time.

### Bulk re-classify channels via Claude Haiku

If the niche catalog changes meaningfully, re-run the bulk classifier:

```bash
cd worker
.venv/bin/python -c "from <one-off script that pulls channels + calls Claude>"
```

(There's no standing endpoint for this — written ad-hoc when needed.)
