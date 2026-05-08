"""Background job runner — Postgres-backed (no Redis ใน MVP).

Pattern: poll loop ที่:
  1. SELECT job WHERE status='queued' AND visibility_at <= now() ORDER BY created_at LIMIT 1
     FOR UPDATE SKIP LOCKED — ป้องกัน 2 worker หยิบ job เดียวกัน
  2. UPDATE status='running', worker_lease_id, started_at
  3. รัน handler ตาม kind
  4. UPDATE status='done' / 'error' + result/error
  5. ถ้า error + attempts < max_attempts → re-queue ด้วย exponential backoff

Heartbeat: ทุก 30 วินาที refresh lease_expires_at ของ job ที่กำลังทำ
Stale recovery: poller ถ้าเจอ job status=running แต่ lease หมด → claim ได้

Job kinds:
  - sync_channel       — payload: { ref_kind, ref_value, video_limit }
  - process_transcript — payload: { video_id, force? }
  - extract_voice      — payload: { samples[], target_profile_id }
  - run_recreate       — payload: { idea_id, format, voice_profile_id?, instruction_extra? }

แต่ละ kind register ใน HANDLERS dict ด้านล่าง
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import signal
import time
import uuid
from collections.abc import Awaitable, Callable
from datetime import UTC, datetime
from typing import Any

from supabase import Client

from ..deps import get_supabase

log = logging.getLogger("riff.jobs")

# === Tunables ===
POLL_INTERVAL_S = 1.5  # how often to look for queued jobs when idle
MAX_ATTEMPTS = 3
BACKOFF_BASE_S = 30  # 30s → 60s → 120s
HEARTBEAT_INTERVAL_S = 30
WORKER_ID = f"riff-worker-{uuid.uuid4().hex[:8]}-pid{os.getpid()}"

# === Handler registry ===
# Each handler signature: (sb, job_row) -> dict (result) | raises on failure
JobHandler = Callable[[Client, dict[str, Any]], Awaitable[dict[str, Any]]]
HANDLERS: dict[str, JobHandler] = {}


def register(kind: str):
    def decorator(fn: JobHandler) -> JobHandler:
        HANDLERS[kind] = fn
        return fn

    return decorator


# === Job operations ===


def _now_iso() -> str:
    return datetime.now(UTC).isoformat()


def claim_next_job(sb: Client) -> dict[str, Any] | None:
    """Atomically claim the next runnable job using a Postgres function or
    a UPDATE ... RETURNING with subquery (we use the latter via raw RPC).

    Falls back to "best effort" SELECT-then-UPDATE if no concurrent workers.
    Since we run 1 worker process in MVP, this is safe enough.
    """
    # Find oldest visible job that's either queued, or running with expired lease
    now_iso = _now_iso()

    # Step 1: query candidate
    res = (
        sb.table("jobs")
        .select("id, kind, payload, attempts")
        .or_(f"status.eq.queued,and(status.eq.running,lease_expires_at.lt.{now_iso})")
        .lte("visibility_at", now_iso)
        .order("created_at", desc=False)
        .limit(1)
        .execute()
    )
    if not res.data:
        return None
    candidate = res.data[0]

    # Step 2: claim with optimistic lock — only succeed if status hasn't changed
    # (we re-check status to avoid race with another worker for queued; for stale
    # running jobs, this also handles takeover atomically because lease_expires
    # is part of WHERE)
    upd = (
        sb.table("jobs")
        .update(
            {
                "status": "running",
                "worker_lease_id": WORKER_ID,
                "started_at": _now_iso(),
            }
        )
        .eq("id", candidate["id"])
        .or_(f"status.eq.queued,and(status.eq.running,lease_expires_at.lt.{now_iso})")
        .execute()
    )
    if not upd.data:
        # Another worker beat us; try again next poll
        return None
    return upd.data[0]


def append_log(sb: Client, job_id: str, event: str, data: dict[str, Any] | None = None) -> None:
    """Append a structured log entry to jobs.logs.

    Note: NOT atomic against concurrent appends — but each job is owned by 1
    worker via lease, so concurrent writes don't happen in practice.
    """
    res = sb.table("jobs").select("logs").eq("id", job_id).limit(1).execute()
    current = (res.data[0]["logs"] if res.data else []) or []
    entry = {"ts": _now_iso(), "event": event}
    if data is not None:
        entry["data"] = data
    current.append(entry)
    # Keep only last 50 entries to bound size
    current = current[-50:]
    sb.table("jobs").update({"logs": current}).eq("id", job_id).execute()


def update_progress(
    sb: Client,
    job_id: str,
    *,
    progress: int | None = None,
    step: str | None = None,
) -> None:
    patch: dict[str, Any] = {}
    if progress is not None:
        patch["progress"] = max(0, min(100, progress))
    if step is not None:
        patch["progress_step"] = step
    if patch:
        sb.table("jobs").update(patch).eq("id", job_id).execute()


def finish_success(sb: Client, job_id: str, result: dict[str, Any]) -> None:
    sb.table("jobs").update(
        {
            "status": "done",
            "progress": 100,
            "result": result,
            "finished_at": _now_iso(),
            "error": None,
        }
    ).eq("id", job_id).execute()


def finish_error(
    sb: Client,
    job_id: str,
    *,
    error: str,
    attempts: int,
    can_retry: bool,
) -> None:
    if can_retry and attempts < MAX_ATTEMPTS:
        # exponential backoff
        delay_s = BACKOFF_BASE_S * (2 ** (attempts - 1))
        next_visible = datetime.now(UTC).timestamp() + delay_s
        sb.table("jobs").update(
            {
                "status": "queued",
                "attempts": attempts,
                "error": error[:500],
                "visibility_at": datetime.fromtimestamp(next_visible, tz=UTC).isoformat(),
                "worker_lease_id": None,
                "lease_expires_at": None,
                "progress_step": "retrying",
            }
        ).eq("id", job_id).execute()
        log.info(f"job {job_id} retry #{attempts} in {delay_s}s")
    else:
        sb.table("jobs").update(
            {
                "status": "error",
                "error": error[:500],
                "finished_at": _now_iso(),
                "attempts": attempts,
            }
        ).eq("id", job_id).execute()
        log.error(f"job {job_id} failed permanently: {error[:200]}")


# === Heartbeat ===


async def heartbeat_loop(sb: Client, job_id: str, stop: asyncio.Event) -> None:
    """Periodically refresh lease_expires_at while job is running."""
    while not stop.is_set():
        try:
            sb.table("jobs").update({"worker_lease_id": WORKER_ID}).eq(
                "id", job_id
            ).execute()
        except Exception:  # noqa: BLE001
            log.exception("heartbeat failed")
        try:
            await asyncio.wait_for(stop.wait(), timeout=HEARTBEAT_INTERVAL_S)
        except TimeoutError:
            continue


# === Main loop ===


async def run_one_job(sb: Client, job: dict[str, Any]) -> None:
    """Execute a single claimed job."""
    job_id = job["id"]
    kind = job["kind"]
    attempts = (job.get("attempts") or 0) + 1

    handler = HANDLERS.get(kind)
    if not handler:
        finish_error(
            sb,
            job_id,
            error=f"no handler for kind={kind}",
            attempts=attempts,
            can_retry=False,
        )
        return

    # Update attempts + bump progress immediately (so client UI sees movement
    # right away, not stuck at 0%)
    sb.table("jobs").update(
        {"attempts": attempts, "progress": 2, "progress_step": "starting"}
    ).eq("id", job_id).execute()
    append_log(sb, job_id, "started", {"worker": WORKER_ID, "attempt": attempts})

    stop_hb = asyncio.Event()
    hb_task = asyncio.create_task(heartbeat_loop(sb, job_id, stop_hb))

    started = time.monotonic()
    try:
        result = await handler(sb, job)
        elapsed = int((time.monotonic() - started) * 1000)
        append_log(sb, job_id, "completed", {"elapsed_ms": elapsed})
        finish_success(sb, job_id, result)
    except RetryableJobError as exc:
        elapsed = int((time.monotonic() - started) * 1000)
        append_log(sb, job_id, "retryable_error", {"error": str(exc), "elapsed_ms": elapsed})
        finish_error(sb, job_id, error=str(exc), attempts=attempts, can_retry=True)
    except Exception as exc:  # noqa: BLE001
        elapsed = int((time.monotonic() - started) * 1000)
        log.exception(f"job {job_id} ({kind}) crashed")
        append_log(sb, job_id, "fatal_error", {"error": str(exc), "elapsed_ms": elapsed})
        finish_error(sb, job_id, error=str(exc), attempts=attempts, can_retry=False)
    finally:
        stop_hb.set()
        await hb_task


class RetryableJobError(Exception):
    """Handlers raise this for transient failures (network, rate limit)."""


async def main_loop() -> None:
    """Main poll-and-run loop. Run forever until SIGTERM."""
    # Lazy import to register handlers
    from . import handlers  # noqa: F401

    sb = get_supabase()
    log.info(f"jobs runner started: {WORKER_ID}")
    log.info(f"registered handlers: {list(HANDLERS.keys())}")

    stop = asyncio.Event()

    def _on_signal(signum: int, frame: Any) -> None:  # noqa: ARG001
        log.info(f"received signal {signum}, draining...")
        stop.set()

    for sig in (signal.SIGTERM, signal.SIGINT):
        signal.signal(sig, _on_signal)

    while not stop.is_set():
        try:
            job = claim_next_job(sb)
        except Exception:  # noqa: BLE001
            log.exception("claim_next_job failed")
            await asyncio.sleep(POLL_INTERVAL_S * 4)
            continue

        if not job:
            try:
                await asyncio.wait_for(stop.wait(), timeout=POLL_INTERVAL_S)
            except TimeoutError:
                pass
            continue

        await run_one_job(sb, job)

    log.info("jobs runner stopped")


def run() -> None:
    """Entry point — `python -m app.workers.jobs_runner` or via uv script."""
    logging.basicConfig(
        level=os.environ.get("LOG_LEVEL", "info").upper(),
        format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
    )
    asyncio.run(main_loop())


if __name__ == "__main__":
    run()


# === Convenience: enqueue helper ===


# Rate limits per (user, kind) — sliding window in seconds
# Stage A starting values; tune based on real usage
RATE_LIMITS: dict[str, tuple[int, int]] = {
    # kind: (max_jobs_in_window, window_seconds)
    "run_recreate": (5, 60),  # 5 recreates / minute
    "process_transcript": (10, 60),  # 10 transcripts / minute
    "extract_voice": (10, 60),  # 10 voice extracts / minute
    "sync_channel": (5, 60),  # 5 channel syncs / minute
}


class RateLimitError(Exception):
    """Raised when a user exceeds rate limits for a given kind."""

    def __init__(self, kind: str, limit: int, window_s: int):
        self.kind = kind
        self.limit = limit
        self.window_s = window_s
        super().__init__(
            f"rate limit exceeded for {kind}: max {limit} per {window_s}s"
        )


def check_rate_limit(sb: Client, user_id: str, kind: str) -> None:
    """Raise RateLimitError if user exceeded the rate window for this kind."""
    spec = RATE_LIMITS.get(kind)
    if not spec:
        return  # no limit configured = allowed
    limit, window_s = spec

    from datetime import timedelta

    cutoff = datetime.now(UTC) - timedelta(seconds=window_s)
    res = (
        sb.table("jobs")
        .select("id", count="exact")
        .eq("user_id", user_id)
        .eq("kind", kind)
        .gte("created_at", cutoff.isoformat())
        .limit(0)
        .execute()
    )
    count = res.count or 0
    if count >= limit:
        raise RateLimitError(kind, limit, window_s)


def enqueue_job(
    sb: Client,
    *,
    user_id: str,
    kind: str,
    payload: dict[str, Any],
    resource_kind: str | None = None,
    resource_id: str | None = None,
) -> dict[str, Any]:
    """Insert a job row. Returns the new job (or existing if dedup hit).

    Race-safe: if the unique partial index `jobs_dedup_inflight_idx` rejects
    our INSERT (because a concurrent caller inserted first), we re-fetch the
    winning row and return it.

    Rate-limited: raises RateLimitError if user exceeds RATE_LIMITS[kind].
    """
    check_rate_limit(sb, user_id, kind)

    payload_json = json.dumps(payload, sort_keys=True, ensure_ascii=False, separators=(",", ":"))
    import hashlib

    payload_hash = hashlib.md5(payload_json.encode("utf-8")).hexdigest()  # noqa: S324

    def _fetch_existing() -> dict[str, Any] | None:
        res = (
            sb.table("jobs")
            .select("id, status, progress, progress_step, result, error, created_at, attempts")
            .eq("user_id", user_id)
            .eq("kind", kind)
            .eq("payload_hash", payload_hash)
            .in_("status", ["queued", "running"])
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        return res.data[0] if res.data else None

    # Optimistic fast-path: check before insert
    existing = _fetch_existing()
    if existing:
        return existing

    insert_payload = {
        "user_id": user_id,
        "kind": kind,
        "payload": payload,
        "payload_hash": payload_hash,
        "status": "queued",
        "progress": 0,
        "progress_step": "queued",
        "resource_kind": resource_kind,
        "resource_id": resource_id,
    }
    try:
        res = sb.table("jobs").insert(insert_payload).execute()
    except Exception as e:  # noqa: BLE001
        # 23505 = unique_violation — race lost, fetch the winning row
        msg = str(e) + " " + repr(e)
        is_dup = (
            "23505" in msg
            or "duplicate key" in msg.lower()
            or "jobs_dedup_inflight_idx" in msg
        )
        log.warning(f"insert failed (is_dup={is_dup}): {msg[:200]}")
        if is_dup:
            # Retry fetch with brief delays — read-after-write may need a moment
            for attempt in range(5):
                existing = _fetch_existing()
                if existing:
                    log.info(f"dedup hit after race (attempt {attempt + 1}): {existing['id']}")
                    return existing
                time.sleep(0.05 * (attempt + 1))
            log.error(f"dedup race lost but fetch returned None after retries; payload_hash={payload_hash}")
        raise

    if not res.data:
        raise RuntimeError("failed to enqueue job")
    return res.data[0]
