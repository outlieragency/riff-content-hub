"""FastAPI worker entry point.

Handles HTTP API + runs the in-process background jobs runner.

Architecture:
  - HTTP routes accept enqueue requests, return job_id immediately
  - Background jobs runner (asyncio task) polls jobs table + executes handlers
  - Portal subscribes to Supabase Realtime for `jobs` updates → progress UI
"""

from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager
from datetime import UTC, datetime

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel

from .settings import get_settings

log = logging.getLogger("riff.main")


def require_worker_secret(authorization: str | None) -> None:
    """Auth between portal and worker via shared secret.

    NOTE: Stage A wk2 will replace this with per-user JWT verification.
    """
    settings = get_settings()
    expected = f"Bearer {settings.worker_secret}"
    if authorization != expected:
        raise HTTPException(status_code=401, detail="invalid worker secret")


# === Lifespan: start jobs runner alongside HTTP API ===

_jobs_task: asyncio.Task | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Start jobs runner as background asyncio task on app boot."""
    global _jobs_task
    # Lazy import to avoid loading handlers at import time
    from .workers.jobs_runner import main_loop

    # Configure logging — split INFO/DEBUG → stdout, WARNING+ → stderr.
    # Default Python logging sends EVERYTHING to stderr, which makes Railway
    # tag every line (including INFO) as "error" in its UI.
    import sys

    log_level = get_settings().log_level.upper()
    fmt = "%(asctime)s %(levelname)s [%(name)s] %(message)s"
    formatter = logging.Formatter(fmt)

    root = logging.getLogger()
    # Remove existing default handlers
    for h in list(root.handlers):
        root.removeHandler(h)

    stdout_handler = logging.StreamHandler(sys.stdout)
    stdout_handler.setLevel(log_level)
    stdout_handler.addFilter(lambda r: r.levelno < logging.WARNING)
    stdout_handler.setFormatter(formatter)

    stderr_handler = logging.StreamHandler(sys.stderr)
    stderr_handler.setLevel(logging.WARNING)
    stderr_handler.setFormatter(formatter)

    root.setLevel(log_level)
    root.addHandler(stdout_handler)
    root.addHandler(stderr_handler)

    log.info("starting jobs runner")
    _jobs_task = asyncio.create_task(main_loop(), name="jobs_runner")

    try:
        yield
    finally:
        log.info("stopping jobs runner")
        if _jobs_task:
            _jobs_task.cancel()
            try:
                await _jobs_task
            except (asyncio.CancelledError, Exception):  # noqa: BLE001
                pass


app = FastAPI(
    title="Riff Worker",
    version="0.2.0",
    docs_url="/docs",
    lifespan=lifespan,
)


class HealthResponse(BaseModel):
    ok: bool
    service: str
    time: str


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(
        ok=True,
        service="riff-worker",
        time=datetime.now(UTC).isoformat(),
    )


@app.get("/internal/ping")
async def ping(authorization: str | None = Header(default=None)) -> dict:
    require_worker_secret(authorization)
    return {"ok": True, "authenticated": True}


# === Routes ===
from .routes import channels as channels_routes  # noqa: E402
from .routes import cover as cover_routes  # noqa: E402
from .routes import jobs as jobs_routes  # noqa: E402
from .routes import notion as notion_routes  # noqa: E402
from .routes import prompts as prompts_routes  # noqa: E402
from .routes import quick_recreate as quick_recreate_routes  # noqa: E402
from .routes import recreate as recreate_routes  # noqa: E402
from .routes import styles as styles_routes  # noqa: E402
from .routes import tools as tools_routes  # noqa: E402
from .routes import transcripts as transcripts_routes  # noqa: E402
from .routes import shared_pool as shared_pool_routes  # noqa: E402
from .routes import voice as voice_routes  # noqa: E402

app.include_router(channels_routes.router)
app.include_router(voice_routes.router)
app.include_router(transcripts_routes.router)
app.include_router(recreate_routes.router)
app.include_router(jobs_routes.router)
app.include_router(cover_routes.router)
app.include_router(notion_routes.router)
app.include_router(prompts_routes.router)
app.include_router(quick_recreate_routes.router)
app.include_router(styles_routes.router)
app.include_router(tools_routes.router)
app.include_router(shared_pool_routes.router)
