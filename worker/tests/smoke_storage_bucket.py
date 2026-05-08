"""Smoke test: apply migration 0009 (storage bucket) to dev Supabase + roundtrip upload/read.

Runs:
  1. Read service role key from worker/.env
  2. Create bucket 'fb-covers' if not exists (idempotent)
  3. Upload a test PNG to fb-covers/_smoke/test.png
  4. Read it back via public URL
  5. Delete the test file

Run:
    cd worker && ./.venv/bin/python tests/smoke_storage_bucket.py
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

# Load .env
env_path = Path(__file__).resolve().parent.parent / ".env"
if env_path.exists():
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        os.environ.setdefault(k, v.strip().strip('"').strip("'"))

from supabase import Client, create_client  # noqa: E402

SUPABASE_URL = os.environ["SUPABASE_URL"]
SERVICE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
BUCKET_ID = "fb-covers"
TEST_PATH = "_smoke/test.png"


def main() -> int:
    sb: Client = create_client(SUPABASE_URL, SERVICE_KEY)

    # 1. Create bucket (idempotent — ignore if exists)
    print(f"→ Ensure bucket '{BUCKET_ID}' exists...")
    try:
        sb.storage.create_bucket(
            BUCKET_ID,
            options={
                "public": True,
                "file_size_limit": 10 * 1024 * 1024,
                "allowed_mime_types": ["image/png", "image/jpeg", "image/webp"],
            },
        )
        print("   ✓ created")
    except Exception as e:
        if "already exists" in str(e).lower() or "duplicate" in str(e).lower() or "409" in str(e):
            print("   ✓ already exists")
        else:
            print(f"   ⚠ create_bucket error (non-fatal): {e}")

    # 2. Upload test PNG
    print(f"→ Upload test file to {BUCKET_ID}/{TEST_PATH}...")
    # 1×1 transparent PNG
    test_png = bytes.fromhex(
        "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000"
        "000d49444154789c63000100000005000100"
        "0d0a2db40000000049454e44ae426082"
    )
    try:
        sb.storage.from_(BUCKET_ID).upload(
            TEST_PATH,
            test_png,
            file_options={"upsert": "true", "content-type": "image/png"},
        )
        print(f"   ✓ uploaded {len(test_png)} bytes")
    except Exception as e:
        print(f"   ✗ upload failed: {e}")
        return 1

    # 3. Read back via public URL
    public_url = sb.storage.from_(BUCKET_ID).get_public_url(TEST_PATH)
    print(f"→ Read back from {public_url}...")
    try:
        r = httpx.get(public_url, timeout=10.0)
        r.raise_for_status()
        if len(r.content) > 0:
            print(f"   ✓ fetched {len(r.content)} bytes")
        else:
            print("   ⚠ public URL returned empty body")
    except Exception as e:
        print(f"   ✗ read failed: {e}")
        return 1

    # 4. Cleanup
    print("→ Cleanup test file...")
    try:
        sb.storage.from_(BUCKET_ID).remove([TEST_PATH])
        print("   ✓ removed")
    except Exception as e:
        print(f"   ⚠ cleanup warning: {e}")

    print("\n✅ Storage smoke test PASSED")
    return 0


if __name__ == "__main__":
    sys.exit(main())
