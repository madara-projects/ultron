"""The read-only interface every account/market data source implements."""

from __future__ import annotations

from typing import Protocol

from backend.models import AccountBalances, DataSource, Fill, OpenOrder, Ticker


class SourceUnavailable(RuntimeError):
    """The source could not return trustworthy data; callers must not substitute zeros."""


class ReadOnlySource(Protocol):
    """Account and market reads only.

    There are deliberately no methods that place, cancel, or withdraw anything.
    Order submission is a separately gated milestone (ROADMAP Phase 5).
    """

    source: DataSource

    def balances(self) -> AccountBalances: ...

    def tickers(self) -> list[Ticker]: ...

    def open_orders(self) -> list[OpenOrder]: ...

    def fills(self) -> list[Fill]: ...
