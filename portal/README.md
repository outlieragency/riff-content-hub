# Riff Portal

Next.js 16 frontend ของ **Riff** (by Outlier Agency)
Folder ใช้ชื่อ `portal` ใต้ `content-hub/`

## Stack

- Next.js 16 App Router + React 19
- Supabase Auth + Postgres (RLS)
- Tailwind CSS 4 + shadcn/ui (base-nova style)
- IBM Plex Sans Thai + Inter

## Quickstart

```bash
cp .env.local.example .env.local
# ใส่ Supabase URL + keys
npm install
npm run dev
```

เปิด http://localhost:3000 → redirect ไป `/login`

## Routes

- `/login` — Supabase email/password
- `/outliers` — outlier feed (default landing)
- `/channels`, `/channels/[id]` — track YouTube channels
- `/ideas`, `/ideas/[id]` — saved outlier vault + recreate flow
- `/recreated`, `/recreated/[id]` — generated drafts editor
- `/voice`, `/voice/setup` — brand voice profile
- `/api/health` — healthcheck

## Migrations

```bash
npx supabase link --project-ref <ref>
npx supabase db push
```

อ่าน schema ที่ `supabase/migrations/0001_init_schema.sql`

## Status

Slice 0 Bootstrap — empty shell working ทุก placeholder route ใช้ `EmptyState`
