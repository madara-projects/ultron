"""API responses used as frontend test data, generated from the real app with a fixed clock.

Regenerate after changing an API response (run from the project root):

    docker build --target backend-test -t ultron-test .
    docker run --rm ultron-test python -m backend.tests.api_samples > frontend/src/test/api-samples.json
"""

from __future__ import annotations

import json
from datetime import UTC, datetime
from pathlib import Path

from fastapi.testclient import TestClient

from backend.main import create_app
from backend.settings import Settings

SAMPLE_CLOCK = datetime(2026, 9, 25, 12, 0, tzinfo=UTC)
SAMPLE_PATHS = ("/api/status", "/api/portfolio", "/api/markets", "/api/orders/open", "/api/fills")
SAMPLES_FILE = Path(__file__).resolve().parents[2] / "frontend" / "src" / "test" / "api-samples.json"


def build_samples() -> dict:
    app = create_app(Settings(frontend_dist=Path("/nonexistent")), clock=lambda: SAMPLE_CLOCK)
    client = TestClient(app, base_url="http://127.0.0.1")
    return {path: client.get(path).json() for path in SAMPLE_PATHS}


if __name__ == "__main__":
    print(json.dumps(build_samples(), indent=2, ensure_ascii=False))
