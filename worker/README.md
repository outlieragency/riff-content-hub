# Riff Worker

FastAPI service ของ **Riff** (by Outlier Agency)
รับงานจาก portal: YouTube ingestion, transcript fetching, Claude-powered recreate

## Stack

- Python 3.12 + FastAPI + Uvicorn
- Anthropic SDK (Claude Sonnet 4.6 + Haiku 4.5) with prompt caching
- google-api-python-client (YouTube Data API v3)
- youtube-transcript-api (free, no API key)
- Supabase Python SDK (service role)

## Quickstart

ต้องมี `uv` (https://docs.astral.sh/uv/)

```bash
cp .env.example .env   # ใส่ Anthropic + YouTube + Supabase keys
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

ทดสอบ:

```bash
curl http://localhost:8000/health
# {"ok":true,"service":"content-hub-worker","time":"..."}

curl -H "Authorization: Bearer dev-shared-secret-change-me" \
     http://localhost:8000/internal/ping
# {"ok":true,"authenticated":true}
```

## Status

Slice 0 — health + auth scaffolding. Routers สำหรับ scrape / transcript / recreate ยังเป็น stub
