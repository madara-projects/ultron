# syntax=docker/dockerfile:1

# ---- Web UI build ----------------------------------------------------------
FROM node:22-alpine AS web-build
WORKDIR /web
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

# ---- Python base -----------------------------------------------------------
FROM python:3.13-slim AS python-base
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1
WORKDIR /app
COPY backend/requirements.txt backend/requirements.txt
RUN pip install -r backend/requirements.txt

# ---- Backend tests: docker build --target backend-test -t ultron-test . ----
FROM python-base AS backend-test
COPY backend/requirements-dev.txt backend/requirements-dev.txt
RUN pip install -r backend/requirements-dev.txt
COPY pyproject.toml ./
COPY backend backend
COPY frontend/src/test/api-samples.json frontend/src/test/api-samples.json
CMD ["python", "-m", "pytest", "-q"]

# ---- Runtime ---------------------------------------------------------------
FROM python-base AS runtime
RUN useradd --system --uid 10001 --no-create-home ultron
COPY backend backend
COPY --from=web-build /web/dist frontend/dist
USER ultron
# 0.0.0.0 is required inside the container; compose.yaml publishes the port on
# the host's 127.0.0.1 only, so Ultron is not reachable from the network.
ENV ULTRON_HOST=0.0.0.0 \
    ULTRON_PORT=8765
EXPOSE 8765
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD ["python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8765/api/health', timeout=3)"]
CMD ["python", "-m", "backend"]
