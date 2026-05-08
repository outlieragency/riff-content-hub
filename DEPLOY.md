# Deploy

## Production targets

| Service | Target | URL |
|---|---|---|
| Portal | Vercel | riff.outlieragency.co |
| Worker | Railway (หรือ Fly.io) | worker.riff.outlieragency.co |
| DB | Supabase project (shared with portal/Auth) | TBD |

## First-time setup

### 1. Supabase project

```bash
# สร้าง project ใหม่ใน Supabase dashboard
# Region: Singapore (ap-southeast-1) — ใกล้ Thailand ที่สุด
# Plan: Free (upgrade ตอน multi-tenant Phase 2)
```

จด:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (worker only ห้ามใส่ใน portal env)

### 2. Apply migrations

```bash
cd portal
npx supabase link --project-ref <ref>
npx supabase db push
```

### 3. YouTube Data API

- Google Cloud Console → enable "YouTube Data API v3"
- Create API key (restrict by HTTP referrer หรือ IP)
- Quota default 10k units/day พอสำหรับ solo

### 4. Anthropic API

- Console → create API key
- Workspace: dedicate workspace สำหรับ content-hub เพื่อแยก spend tracking

### 5. Portal (Vercel)

```bash
# Connect repo to Vercel (root: Operation/apps/content-hub/portal)
# Env vars:
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
WORKER_URL=https://worker-riff.outlieragency.co
WORKER_SECRET=<random-secret-shared-with-worker>
```

### 6. Worker (Railway)

```bash
# Connect repo to Railway (root: Operation/apps/content-hub/worker)
# Build: Dockerfile
# Env vars:
ANTHROPIC_API_KEY=
YOUTUBE_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
WORKER_SECRET=<same-as-portal>
PORT=8000
```

## DNS

- `riff.outlieragency.co` → CNAME → Vercel
- `worker-riff.outlieragency.co` → CNAME → Railway

## Verification

```bash
# Portal
curl https://riff.outlieragency.co/api/health

# Worker
curl https://worker-riff.outlieragency.co/health
```

ทั้ง 2 ตอบ `{"ok":true}` = ขึ้นเรียบร้อย
