# Riff Worker — production Dockerfile
# Build from repo root: docker build -f worker/Dockerfile .
# Railway uses this same Dockerfile via railway.toml dockerfilePath setting.

FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# System deps required by Playwright Chromium (Debian-based)
RUN apt-get update && apt-get install -y --no-install-recommends \
      curl \
      ca-certificates \
      libglib2.0-0 \
      libnss3 \
      libnspr4 \
      libatk1.0-0 \
      libatk-bridge2.0-0 \
      libcups2 \
      libdrm2 \
      libxkbcommon0 \
      libxcomposite1 \
      libxdamage1 \
      libxext6 \
      libxfixes3 \
      libxrandr2 \
      libgbm1 \
      libpango-1.0-0 \
      libcairo2 \
      libasound2 \
      libatspi2.0-0 \
      fonts-liberation \
      fonts-noto-color-emoji \
      fonts-noto \
      fonts-noto-cjk \
      fonts-thai-tlwg \
      libxshmfence1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install uv (fast Python package manager)
RUN pip install uv

# Python deps
COPY worker/pyproject.toml ./
RUN uv pip install --system -r pyproject.toml

# Download Chromium browser for Playwright (no --with-deps because we
# already installed system libs above; --with-deps would re-install + slow)
RUN python -m playwright install chromium

# App code (templates + assets + prompts all under app/)
COPY worker/app ./app

ENV PORT=8000
EXPOSE 8000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
