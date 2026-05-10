#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────
# run-local.sh — start the worker locally + expose via Cloudflare Tunnel
#
# Why this exists:
#   YouTube IP-blocks scraping requests from cloud datacenters (Railway,
#   Vercel, AWS, …). The worker therefore runs on this Mac (residential
#   IP) and Cloudflare Tunnel hands it a public HTTPS URL the Vercel
#   portal can call.
#
# Prereqs (one-time):
#   1. cloudflared installed
#        macOS:   download .pkg from
#                 https://github.com/cloudflare/cloudflared/releases/latest
#        verify:  cloudflared --version
#   2. worker/.env filled (ANTHROPIC_API_KEY, YOUTUBE_API_KEY,
#                          SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
#                          WORKER_SECRET)
#   3. Python venv ready: `cd worker && uv sync`
#
# Usage:
#   ./run-local.sh
#
# Output:
#   - worker on http://127.0.0.1:8000
#   - tunnel public URL printed in terminal (looks like
#     https://<random-words>.trycloudflare.com)
#   - copy that URL → set as WORKER_URL on Vercel → redeploy portal
#
# Stop both:  Ctrl-C  (sends SIGINT to whichever foreground process; the
#             trap kills the other)
# ──────────────────────────────────────────────────────────────────────

set -e
cd "$(dirname "$0")"

if ! command -v cloudflared >/dev/null 2>&1; then
  echo "❌ cloudflared not found"
  echo "   Install from https://github.com/cloudflare/cloudflared/releases/latest"
  exit 1
fi

if [ ! -f .env ]; then
  echo "❌ worker/.env missing — copy .env.example and fill in keys"
  exit 1
fi

WORKER_PORT="${WORKER_PORT:-8000}"

# Start worker in background, capture PID so we can kill on exit
echo "▶ starting worker on :$WORKER_PORT"
.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port "$WORKER_PORT" --log-level info &
WORKER_PID=$!

cleanup() {
  echo ""
  echo "▶ stopping worker (pid=$WORKER_PID)"
  kill "$WORKER_PID" 2>/dev/null || true
  wait "$WORKER_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# Give uvicorn a couple seconds to bind the port
sleep 2

echo ""
echo "▶ opening Cloudflare Tunnel (public URL printed below)"
echo "  copy the https://*.trycloudflare.com URL → Vercel env WORKER_URL → redeploy"
echo ""
exec cloudflared tunnel --url "http://127.0.0.1:$WORKER_PORT"
