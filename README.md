# Ultron

Ultron is a local, single-user crypto portfolio and research assistant for Giottus. The current app uses illustrative fixture data only. It is **not connected to Giottus**, and it cannot place, cancel, or withdraw orders.

## Run locally

Requirements: Docker Desktop with Docker Compose.

```bash
docker compose up --build
```

Open <http://127.0.0.1:8765>. Compose publishes the app on loopback only. Set `ULTRON_HOST_PORT` in `.env` to use a different host port. Stop it with:

```bash
docker compose down
```

## Develop the frontend

Run the backend in Docker, then use Vite for frontend hot reload:

```bash
docker compose up -d
cd frontend
npm ci
npm run dev
```

Vite serves the UI at <http://127.0.0.1:5173> and proxies API requests to the backend.

## Verify changes

Backend tests run in the Docker test stage:

```bash
docker build --target backend-test -t ultron-test .
docker run --rm ultron-test
```

Frontend checks:

```bash
cd frontend
npm test
npm run typecheck
npm run build
```

The backend can also run outside Docker with Python 3.11+ after installing `backend/requirements.txt` and building the frontend with `npm run build`.

## What the app includes

- **Overview:** sample portfolio value, asset allocation, market freshness, and recent activity.
- **Assets:** balances, available/locked amounts, valuations, and unpriced-asset warnings.
- **Markets:** sample spot pairs, prices, spreads, and stale-price indicators.
- **Activity:** illustrative open orders and fills.
- **Research:** recommendations are intentionally disabled until a crypto strategy is evaluated.
- **Settings:** local display preferences and configurable fee assumptions for estimates.

Values Ultron derives are marked as estimates. Stale or missing prices make the portfolio incomplete; missing values are never silently replaced with zero. Fees are assumptions and must be checked against Giottus's current fee schedule.

## Architecture and security

- `frontend/`: React, TypeScript, Vite, and Tailwind CSS.
- `backend/`: FastAPI JSON API, portfolio calculations, and the fixture data source.
- `Dockerfile` + `compose.yaml`: one local app, loopback-only port mapping, non-root runtime, read-only root filesystem, and dropped Linux capabilities.
- The backend currently accepts fixture data only. No Giottus keys or credentials are used.
- The current API is read-only. No order, cancel, or withdrawal endpoints are implemented.
- Never expose the service to a network or put exchange secrets in frontend code. See [ROADMAP.md](ROADMAP.md) before starting the Giottus integration.

## Roadmap

The implementation plan, completed phase notes, open decisions, security requirements, and next steps are tracked in [ROADMAP.md](ROADMAP.md). Project changes are recorded in [CHANGELOG.md](CHANGELOG.md).
