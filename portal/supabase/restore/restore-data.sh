#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────
# restore-data.sh — load v1 JSON backups back into the now-empty
# tables that restore-v1-schema.sql just re-created.
#
# Order respects FKs:
#   channels (root)
#     ← videos       (FK channel_id)
#         ← ideas      (FK video_id)
#             ← transcripts (FK video_id)
#             ← board_ideas (FK idea_id)
#                 ↑ boards   (FK board_id)
#   creative_styles  (independent of ideas/videos)
#   waitlist         (independent)
#
# Calls Supabase REST with the service-role key in worker/.env.local.
# Each table loads with `Prefer: resolution=ignore-duplicates` so re-runs
# are idempotent.
# ──────────────────────────────────────────────────────────────────────

set -e
cd "$(dirname "$0")/../../.."

ENV_FILE="portal/.env.local"
BACKUP_DIR=".backups/2026-05-10-pre-strip-v2"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ $ENV_FILE missing"
  exit 1
fi
if [ ! -d "$BACKUP_DIR" ]; then
  echo "❌ $BACKUP_DIR missing — JSON backups not found"
  exit 1
fi

URL=$(grep -E "^NEXT_PUBLIC_SUPABASE_URL=" "$ENV_FILE" | sed 's/^[^=]*=//')
KEY=$(grep -E "^SUPABASE_SERVICE_ROLE_KEY=" "$ENV_FILE" | sed 's/^[^=]*=//')
if [ -z "$URL" ] || [ -z "$KEY" ]; then
  echo "❌ NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not in $ENV_FILE"
  exit 1
fi

load_table() {
  local table="$1"
  local file="$BACKUP_DIR/${table}.json"
  if [ ! -f "$file" ]; then
    echo "  · $table: no backup file, skip"
    return
  fi
  local rows=$(python3 -c "import json; print(len(json.load(open('$file'))))")
  if [ "$rows" -eq 0 ]; then
    echo "  · $table: 0 rows, skip"
    return
  fi
  printf "  · %-20s %s rows..." "$table" "$rows"
  # channels.videos_count is denormalized via trigger on videos insert.
  # If we POST it here, the videos restore step doubles the count via the
  # AFTER INSERT trigger. Strip the column so it reaches 0, then the
  # video restore populates the correct count.
  local payload
  if [ "$table" = "channels" ]; then
    payload=$(python3 -c "
import json
data = json.load(open('$file'))
for row in data:
    row.pop('videos_count', None)
print(json.dumps(data))
")
  else
    payload=$(cat "$file")
  fi
  local resp=$(curl -s -X POST "$URL/rest/v1/$table" \
    -H "apikey: $KEY" \
    -H "Authorization: Bearer $KEY" \
    -H "Content-Type: application/json" \
    -H "Prefer: resolution=ignore-duplicates" \
    --data-binary "$payload")
  if [ -n "$resp" ] && echo "$resp" | python3 -c "import sys,json; d=json.load(sys.stdin); raise SystemExit(0 if not isinstance(d,dict) or 'message' not in d else 1)" 2>/dev/null; then
    echo " OK"
  else
    echo " FAIL"
    echo "    response: $resp" | head -c 400
    echo ""
    return 1
  fi
}

echo "▶ loading v1 backups into $URL"
load_table channels
load_table videos
load_table ideas
load_table transcripts
load_table boards
load_table board_ideas
load_table creative_styles
load_table waitlist

echo ""
echo "✓ data restore done"
echo ""
echo "Next: run this in Supabase SQL Editor to validate the FK that"
echo "the schema script left in NOT VALID state:"
echo ""
echo "  alter table public.recreated_drafts"
echo "    validate constraint recreated_drafts_idea_id_fkey;"
echo "  alter table public.recreated_drafts alter column idea_id set not null;"
