# Ultron Roadmap

**Updated:** 2026-09-26

**Roadmap status:** Phase 1 (app foundation) built and running in Docker with sample data. Phase 0 confirmations are still open, and there is no Giottus connection yet. Legacy stock code and generated data have been removed from the working tree; the current app and project history are retained.

## Product direction

Pivot Ultron from NIFTY 50 stock research to a **local, single-user Giottus crypto portfolio and research assistant**. The intended workflow is to show the user's account status, explain research signals, and suggest a risk-bounded spot order size for the user to review.

The initial product is **read-only**. It will not submit orders, manage withdrawals, or trade futures. Live spot-order support is a later, separately gated milestone. Recommendations are research outputs, not guaranteed outcomes or personalized financial advice.

Giottus API documentation reviewed on 2026-09-25: <https://api.giottus.com/docs/>. The reference states the older `https://www.giottus.com/api-docs/` endpoint set was deprecated effective 2026-07-31, and that it has no sandbox/testnet. Re-check the current Giottus API docs and account permissions before each API integration milestone. Build only against endpoints confirmed in the current reference. The currently reviewed reference documents authenticated wallet data, spot orders, open orders, and trade history; it does not establish futures order support.

## Recommended application stack

- **Frontend:** React + TypeScript, built with Vite. Vite produces optimized static assets and lets the local Python server serve the finished UI.
- **UI styling and components:** Tailwind CSS for a custom design system, with shadcn/ui as a source for accessible, customizable primitives. Build a distinctive Ultron interface rather than copying Giottus branding or assets.
- **Charts:** Start with a lightweight client-side chart library and only load detailed charts on asset pages. Keep chart data and UI state separate from the trading/research rules.
- **Backend:** Python + FastAPI, running as one local process. Keep market analysis, sizing, exchange communication, validation, and secrets in Python; expose a small typed JSON API to the browser. Reuse useful Python calculations after they have been reviewed for crypto.
- **Local persistence:** SQLite for cached market data, settings, recommendation history, and a reconciled activity ledger. Keep raw exchange credentials out of SQLite.
- **Development/deployment:** Vite dev server while designing; production build served by FastAPI from the same origin. No cloud account, hosted database, remote fonts, or CDN needed at runtime.
- **Packaging:** One Docker image (multi-stage: Node builds the UI, Python serves it). `compose.yaml` publishes the port on `127.0.0.1` only, runs as a non-root user with a read-only filesystem, and forwards only named `ULTRON_*` settings. Exchange credentials will be supplied as a runtime Docker secret, never baked into the image.

This stack separates a fast, polished UI from the existing Python analytics without introducing a separate database service or production deployment. Keep the app bound to `127.0.0.1` by default.

## Product principles

1. **Read-only before trading.** Connect and reconcile account state before implementing any write-capable UI.
2. **Show why and how much.** Every suggestion should display its data time, reasoning, uncertainty, assumed fees, risk limit, and proposed quantity/value.
3. **The user stays in control.** No unattended trading in the first release. Any later live order needs a clear review and confirmation screen.
4. **Local does not mean secret-free.** The exchange secret never reaches browser code, browser storage, logs, screenshots, or source control.
5. **Fail closed.** Stale market data, API errors, clock drift, uncertain balances, or failed validation disable order submission.
6. **Measure before recommending.** A strategy is not enabled as a recommendation until it has reproducible, cost-aware historical evaluation and paper-trading evidence.
7. **Fast and accessible.** Prioritize a quick dashboard, responsive layouts, keyboard use, readable numbers, and clear loading/empty/error states.

## Staged plan

### Phase 0 - Confirm integration constraints

- [ ] Re-check the active Giottus API reference, base URL, endpoint availability, rate limits, key permissions, and IP-whitelist behavior.
- [ ] Confirm whether a wallet/history-only key can be created and whether order permissions can be withheld. Never request withdrawal permissions for Ultron.
- [ ] Confirm supported spot symbols and data intervals; ask Giottus support about futures API only if futures become an explicit later goal.
- [ ] Record the user's intended quote currency, trading horizon, maximum risk per idea, and assets/pairs of interest before designing buy-sizing rules.
- [ ] Record API limitations: no sandbox/testnet means order endpoints must not be used for development smoke tests.

### Phase 1 - App foundation and visual direction

- [x] Create a React + TypeScript + Vite frontend and a modular FastAPI backend. (`frontend/`, `backend/`; stock-specific analysis was not carried into the crypto app.)
- [x] Define a compact design system: typography, spacing, colors, number formatting, buttons, cards, tables, charts, empty states, and warnings. (Tokens in `frontend/src/styles.css` for light and dark; the chart palette is checked for color-blind safety; INR uses lakh/crore grouping and quantities keep their exact digits. Primitives are hand-written in the shadcn/ui style. Add shadcn/Radix components when a complex widget such as a dialog or combobox is needed.)
- [x] Create the first dashboard shell using fixture data only; establish the information hierarchy and responsive behavior before connecting credentials. (Overview, Assets, Markets, Activity, Research (gated off), and Settings, checked at desktop and phone widths.)
- [x] Serve built frontend and backend API from one local origin; bind to loopback by default. (Default port 8765; Host-header allowlist, CSP, and a cross-site write guard.)
- [x] Add deterministic tests before any private API integration. (Backend pytest with an injected clock; frontend Vitest; a contract test keeps the frontend test data identical to real API output.)
- [ ] Add mocked Giottus-format responses. Deferred to the Phase 2 adapter so the mocks match endpoints confirmed in Phase 0 rather than guessed shapes.

### Phase 2 - Read-only Giottus account connection

- [ ] Implement a small exchange adapter for documented public market data and authenticated read endpoints only.
- [ ] Store secrets outside the frontend and source tree. Prefer Windows Credential Manager; for local development only, allow a git-ignored `.env` file with restrictive file permissions. Under Docker, the container cannot read Windows Credential Manager, so mount the key as a Docker secret file (read at startup, never logged) and decide which mechanism is primary before building the adapter.
- [ ] Support API key permissions and IP restrictions where Giottus offers them; use the narrowest access needed and exclude withdrawals.
- [ ] Display balances by asset, separating free and locked amounts; label market prices and portfolio valuations with their timestamps.
- [ ] Display open orders, recent/historical fills, fees, and deposit/withdrawal activity when exposed by documented read endpoints.
- [ ] Reconcile balances and fills safely; distinguish exchange-reported facts from Ultron-derived valuations and P&L.
- [ ] Handle rate limits, timeouts, clock errors, and partial data without presenting stale values as current.

### Phase 3 - Crypto research and recommendation evaluation

- [ ] Define the supported market-data source and candle schema for 24/7 crypto markets.
- [ ] Review existing indicators and signal logic before reuse; remove stock-specific assumptions and create crypto-specific tests.
- [ ] Implement explicit portfolio constraints: maximum allocation per asset, maximum order value, available-balance check, and user-selected risk budget.
- [ ] Calculate proposed quantity from risk budget and an explicit invalidation/stop distance; include quote currency, estimated fees, slippage, and exchange precision/minimums.
- [ ] Show recommendation evidence, counter-evidence, confidence/uncertainty, data freshness, and a clear 'no trade' outcome.
- [ ] Evaluate strategies with out-of-sample/walk-forward checks and realistic fees; paper-trade and compare predictions with subsequent outcomes.
- [ ] Keep recommendations disabled until evaluation reports are reviewed and the user accepts the strategy limits.

### Phase 4 - Polished portfolio and research UI

- [ ] **Overview:** total portfolio estimate, available quote balance, daily change, asset allocation, connection/data freshness, and a concise watchlist.
- [ ] **Assets:** searchable holdings table with quantity, available/locked status, price, value, allocation, and derived P&L clearly distinguished from exchange data.
- [ ] **Markets:** supported spot pairs, search/filter, price movement, and liquidity/spread context where available.
- [ ] **Asset detail:** fast price chart, timeframe controls, indicators, signal explanation, risk context, and recent activity.
- [ ] **Recommendation review:** proposed pair, buy amount and quantity, budget source, reasoning, risk/invalidation, estimated cost, and data timestamp.
- [ ] **Activity:** open orders and fills with status reconciliation and clear error states.
- [ ] **Settings:** API connection status without revealing secrets, refresh controls, display preferences, and risk limits.
- [ ] Add subtle motion only where it helps feedback; respect reduced-motion preferences and avoid distracting animation.
- [ ] Review desktop and mobile layouts, keyboard navigation, contrast, and readable financial values.

### Phase 5 - Optional confirmed spot orders

**Do not start until Phases 0-4 are complete and reviewed.** This app has no Giottus sandbox to safely validate a real order.

- [ ] Reconfirm current Giottus order API and permissions with the current official docs/support.
- [ ] Keep live order submission off by default behind a deliberate local setting.
- [ ] Require a review screen and explicit per-order confirmation showing symbol, side, order type, quantity, limit/trigger price, and estimated cost.
- [ ] Re-fetch balance and market data and re-run all limits immediately before submission.
- [ ] Treat submission as asynchronous; reconcile using documented open-order/trade endpoints and never infer a fill from an acknowledgement alone.
- [ ] Add a prominent disable switch and actionable audit record for every request and resulting exchange status.
- [ ] Never add withdrawals or futures without a new explicit product decision and a separate review.

## Local security requirements

- Bind the backend to `127.0.0.1`; do not expose it to the LAN by default.
- Keep the Giottus secret server-side. Never put it in React environment variables, API responses, URLs, local storage, or logs.
- Use least-privilege exchange keys, IP allowlisting when practical, and no withdrawal permission.
- Validate every request server-side; restrict browser origins/hosts and protect state-changing routes against cross-site requests.
- Do not load runtime JavaScript, fonts, images, or styles from third-party CDNs.
- Redact credentials and signatures from logs; provide a way to disconnect/revoke a key and explain how to rotate it.
- Keep live trading disabled in development and in tests; use mocked HTTP responses because no exchange testnet is documented.

## Initial definition of done

- UI runs locally from one command (`docker compose up --build`) and makes no external requests except documented Giottus endpoints when connected.
- User can inspect account balances, open orders, and trade history without placing or cancelling orders.
- Values show source and freshness; failures cannot silently appear as a zero balance or fresh quote.
- API secrets remain server-side and are absent from repository history, browser storage, and logs.
- Recommendations are explainable, fee-aware, constrained by available funds and configured risk limits, and evaluated out of sample.
- Desktop experience is polished and responsive; core workflows are keyboard-accessible.
- All account/order integrations are covered with mock-response tests; no production order is used as a test.

## Legacy work archived in Git history

The earlier NIFTY 50 prototype included local OHLCV ingestion, indicators, regime/reasoning summaries, heuristic scenarios, paper-trade simulation, a Flask dashboard, local watchlists, and report exports. Its files and generated datasets have been removed from the working tree to keep the crypto app focused. The earlier implementation remains recoverable from Git history; its stock-specific calculations are not validated for crypto.

## Decision notes

- **Product:** Local, single-user assistant; portfolio visibility and research first, not an exchange or unattended bot.
- **Initial trading scope:** Giottus spot only, and read-only in the first release.
- **Frontend:** React + TypeScript + Vite + Tailwind CSS + shadcn/ui primitives.
- **Backend:** Python + FastAPI; retain reviewed Python analytics.
- **Persistence:** SQLite for local cache/history/settings; secrets stored separately.
- **Runtime:** Docker Compose is the primary way to run Ultron; `python -m backend` remains supported for development.
- **Execution policy:** No live orders until a separately reviewed milestone; no withdrawals.
