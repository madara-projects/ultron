# Changelog

All notable changes to Ultron are documented here.

## 2026-09-25

Start of the Giottus crypto portfolio redesign (ROADMAP Phase 1). The new app uses sample data only and has no exchange connection.

### Added
- `backend/`: FastAPI server with a read-only JSON API (`/api/status`, `/portfolio`, `/markets`, `/orders/open`, `/fills`). The data-source interface has no order, cancel, or withdrawal methods.
- Portfolio valuation that fails closed: assets without an INR price are left unvalued (never counted as zero), stale prices mark the total as incomplete, and every response carries its source and timestamp.
- Configurable Giottus fee assumptions (0.4% INR pairs, 0.3% crypto pairs, plus 18% GST), used only for estimates.
- `frontend/`: React + TypeScript + Vite + Tailwind UI with Overview, Assets, Markets, Activity, Research (turned off until validated), and Settings. It supports light and dark themes, responsive layouts, and keyboard navigation.
- Docker: multi-stage `Dockerfile` and `compose.yaml` (loopback-only port 8765, non-root user, read-only filesystem, dropped capabilities).
- Local hardening: Host-header allowlist, Content-Security-Policy with no third-party sources, and a cross-site request guard for any future write routes.
- Tests: backend pytest (valuation, API, security), frontend Vitest (formatting, pages, error states), and a contract test that keeps the frontend test data in sync with the API.

### Changed
- `.gitignore` now excludes `.env` files, `frontend/node_modules/`, and build output.

### Notes
- The legacy NIFTY 50 code and generated data were removed from the working tree to make the Giottus app the single project focus. They remain recoverable from Git history.

## 2026-03-12

### Added
- Local-first UI with dashboard, focus mode, and watchlist
- Explainable chat with local Ollama (safe fallback when offline)
- PDF export per stock (`reports/pdf/`)
- Scenario engine (trend / mean-reversion / breakout)
- Reasoning engine with evidence-backed confidence
- Signal reliability ledger and risk suite
- Research lab parameter grid runner
- Daily summary reports (Markdown + PDF)
- Offline assets bundled locally (Bootstrap, icons, fonts)

### Improved
- Cached interactive charts and lighter dashboard pagination
- Data quality checks and freshness indicators
- Safer local-only defaults with offline mode

### Notes
- Ultron remains **read-only** and **simulation-only**. No real trading, no broker APIs, no cloud services.
