from datetime import UTC, datetime
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from backend.main import create_app
from backend.models import DataSource
from backend.settings import Settings
from backend.sources.base import SourceUnavailable
from backend.sources.fixture import FixtureSource

NOW = datetime(2026, 9, 25, 12, 0, tzinfo=UTC)


def clock() -> datetime:
    return NOW


@pytest.fixture
def dist(tmp_path: Path) -> Path:
    dist = tmp_path / "dist"
    (dist / "assets").mkdir(parents=True)
    (dist / "index.html").write_text("<!doctype html><title>Ultron</title>", encoding="utf-8")
    (dist / "assets" / "app.js").write_text("console.log('ultron')", encoding="utf-8")
    (dist / "favicon.svg").write_text("<svg/>", encoding="utf-8")
    (tmp_path / "secret.txt").write_text("outside dist", encoding="utf-8")
    return dist


@pytest.fixture
def client(dist: Path) -> TestClient:
    app = create_app(Settings(frontend_dist=dist), clock=clock)
    return TestClient(app, base_url="http://127.0.0.1:8765")


def test_portfolio_is_sample_data_with_exact_decimal_strings(client: TestClient):
    body = client.get("/api/portfolio").json()

    assert body["source"] == "fixture"
    assert body["generated_at"] == "2026-09-25T12:00:00Z"
    portfolio = body["data"]
    assert portfolio["quote_currency"] == "INR"
    assert portfolio["total_value"] == "964976.38"
    assert portfolio["available_quote"] == "48250.75"
    assert portfolio["locked_value"] == "63322.50"
    assert portfolio["complete"] is False
    assert len(portfolio["warnings"]) == 2
    statuses = {holding["asset"]: holding["status"] for holding in portfolio["holdings"]}
    assert statuses["ARB"] == "unpriced"
    assert statuses["XRP"] == "stale_price"
    assert "DOGE" not in statuses


def test_status_is_read_only_without_live_orders(client: TestClient):
    status = client.get("/api/status").json()["data"]

    assert status["connected"] is False
    assert status["read_only"] is True
    assert status["live_orders"] == "unavailable"
    assert status["fees"]["inr_pair_effective_pct"] == "0.472"


def test_activity_endpoints(client: TestClient):
    orders = client.get("/api/orders/open").json()["data"]
    assert [order["order_id"] for order in orders] == ["ord-1001", "ord-1002"]

    fills = client.get("/api/fills", params={"limit": 3}).json()["data"]
    assert [fill["fill_id"] for fill in fills] == ["fill-5009", "fill-5008", "fill-5007"]
    assert fills[0]["value"] == "99344.00"

    assert client.get("/api/fills", params={"limit": 0}).status_code == 422


def test_markets_flag_stale_prices(client: TestClient):
    markets = {row["symbol"]: row for row in client.get("/api/markets").json()["data"]}
    assert markets["XRP/INR"]["stale"] is True
    assert markets["BTC/INR"]["stale"] is False


def test_rejects_non_local_host_header(client: TestClient):
    response = client.get("/api/portfolio", headers={"Host": "attacker.example"})
    assert response.status_code == 400


@pytest.mark.parametrize(
    "headers",
    [{"Origin": "https://attacker.example"}, {"Sec-Fetch-Site": "cross-site"}],
)
def test_rejects_cross_site_writes(client: TestClient, headers: dict[str, str]):
    response = client.post("/api/portfolio", headers=headers)
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "cross_site_request"


def test_api_responses_carry_security_headers(client: TestClient):
    response = client.get("/api/status")
    assert response.headers["cache-control"] == "no-store"
    assert "default-src 'self'" in response.headers["content-security-policy"]
    assert response.headers["x-content-type-options"] == "nosniff"


def test_source_failure_is_an_error_not_an_empty_portfolio(dist: Path):
    class BrokenSource(FixtureSource):
        def balances(self):
            raise SourceUnavailable("exchange timed out")

    app = create_app(Settings(frontend_dist=dist), source=BrokenSource(clock=clock), clock=clock)
    response = TestClient(app, base_url="http://127.0.0.1").get("/api/portfolio")

    assert response.status_code == 503
    assert response.json() == {"error": {"code": "source_unavailable", "message": "exchange timed out"}}


def test_unknown_api_route_is_404_not_the_ui(client: TestClient):
    response = client.get("/api/nope")
    assert response.status_code == 404
    assert response.headers["content-type"].startswith("application/json")


def test_serves_ui_assets_and_client_routes(client: TestClient):
    assert client.get("/assets/app.js").text == "console.log('ultron')"
    assert client.get("/favicon.svg").text == "<svg/>"
    for path in ("/", "/assets-page", "/activity"):
        response = client.get(path)
        assert response.status_code == 200
        assert "<title>Ultron</title>" in response.text


def test_does_not_serve_files_outside_the_build(client: TestClient):
    response = client.get("/%2e%2e/secret.txt")
    assert "outside dist" not in response.text


def test_missing_build_explains_how_to_build(tmp_path: Path):
    app = create_app(Settings(frontend_dist=tmp_path / "missing"), clock=clock)
    response = TestClient(app, base_url="http://127.0.0.1").get("/")
    assert response.status_code == 503
    assert "npm run build" in response.text


def test_settings_default_to_loopback_and_reject_unbuilt_sources():
    assert Settings.from_env({}).host == "127.0.0.1"
    assert Settings.from_env({}).data_source == DataSource.FIXTURE
    with pytest.raises(ValueError, match="not available"):
        Settings.from_env({"ULTRON_DATA_SOURCE": "giottus"})
