"""Sample account data for designing and testing the UI without exchange access.

Timestamps in the fixture file are stored as ages ("seconds ago") and resolved
against the injected clock, so freshness states look realistic in the demo and
are deterministic in tests.
"""

from __future__ import annotations

import json
from collections.abc import Callable
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

from backend.models import AccountBalances, Balance, DataSource, Fill, OpenOrder, Ticker
from backend.sources.base import SourceUnavailable

DEFAULT_FIXTURE_PATH = Path(__file__).resolve().parent.parent / "fixtures" / "sample_account.json"


class FixtureSource:
    source = DataSource.FIXTURE

    def __init__(self, clock: Callable[[], datetime], path: Path = DEFAULT_FIXTURE_PATH) -> None:
        self._clock = clock
        self._path = path

    def _load(self) -> dict[str, Any]:
        try:
            return json.loads(self._path.read_text(encoding="utf-8"))
        except (OSError, ValueError) as error:
            raise SourceUnavailable(f"Sample data could not be read: {error}") from error

    def _at(self, seconds_ago: float) -> datetime:
        return self._clock() - timedelta(seconds=seconds_ago)

    def balances(self) -> AccountBalances:
        data = self._load()["balances"]
        return AccountBalances(
            balances=[Balance(**item) for item in data["items"]],
            as_of=self._at(data["seconds_ago"]),
        )

    def tickers(self) -> list[Ticker]:
        return [
            Ticker(**{key: value for key, value in item.items() if key != "seconds_ago"}, as_of=self._at(item["seconds_ago"]))
            for item in self._load()["tickers"]
        ]

    def open_orders(self) -> list[OpenOrder]:
        return [
            OpenOrder(**{key: value for key, value in item.items() if key != "seconds_ago"}, created_at=self._at(item["seconds_ago"]))
            for item in self._load()["open_orders"]
        ]

    def fills(self) -> list[Fill]:
        return [
            Fill(**{key: value for key, value in item.items() if key != "seconds_ago"}, executed_at=self._at(item["seconds_ago"]))
            for item in self._load()["fills"]
        ]
