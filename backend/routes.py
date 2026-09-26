"""Read-only JSON API consumed by the web UI."""

from __future__ import annotations

from collections.abc import Callable
from datetime import datetime, timedelta
from typing import Annotated, TypeVar

from fastapi import APIRouter, Depends, Query, Request

from backend import __version__
from backend.models import (
    ConnectionStatus,
    DataSource,
    Envelope,
    FeeInfo,
    FillRow,
    MarketRow,
    OpenOrder,
    Portfolio,
)
from backend.portfolio import build_fill_rows, build_market_rows, build_portfolio
from backend.settings import Settings
from backend.sources.base import ReadOnlySource

router = APIRouter(prefix="/api")
T = TypeVar("T")


class Context:
    def __init__(self, settings: Settings, source: ReadOnlySource, clock: Callable[[], datetime]) -> None:
        self.settings = settings
        self.source = source
        self.clock = clock

    @property
    def stale_after(self) -> timedelta:
        return timedelta(seconds=self.settings.price_stale_after_seconds)

    def envelope(self, data: T) -> Envelope[T]:
        return Envelope(source=self.source.source, generated_at=self.clock(), data=data)


def get_context(request: Request) -> Context:
    return request.app.state.context


Ctx = Annotated[Context, Depends(get_context)]


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "version": __version__}


@router.get("/status")
def status(ctx: Ctx) -> Envelope[ConnectionStatus]:
    fees = ctx.settings.fees
    connected = ctx.source.source is not DataSource.FIXTURE
    message = (
        "Showing sample data. Ultron is not connected to an exchange account."
        if not connected
        else "Connected with read-only access."
    )
    return ctx.envelope(
        ConnectionStatus(
            source=ctx.source.source,
            connected=connected,
            message=message,
            quote_currency=ctx.settings.quote_currency,
            price_stale_after_seconds=ctx.settings.price_stale_after_seconds,
            fees=FeeInfo(
                inr_pair_pct=fees.inr_pair_pct,
                crypto_pair_pct=fees.crypto_pair_pct,
                gst_pct=fees.gst_pct,
                inr_pair_effective_pct=fees.effective_pct(fees.inr_pair_pct),
                crypto_pair_effective_pct=fees.effective_pct(fees.crypto_pair_pct),
                reviewed_on=fees.reviewed_on,
            ),
        )
    )


@router.get("/portfolio")
def portfolio(ctx: Ctx) -> Envelope[Portfolio]:
    return ctx.envelope(
        build_portfolio(
            ctx.source.balances(),
            ctx.source.tickers(),
            quote_currency=ctx.settings.quote_currency,
            now=ctx.clock(),
            stale_after=ctx.stale_after,
        )
    )


@router.get("/markets")
def markets(ctx: Ctx) -> Envelope[list[MarketRow]]:
    return ctx.envelope(build_market_rows(ctx.source.tickers(), now=ctx.clock(), stale_after=ctx.stale_after))


@router.get("/orders/open")
def open_orders(ctx: Ctx) -> Envelope[list[OpenOrder]]:
    orders = sorted(ctx.source.open_orders(), key=lambda order: order.created_at, reverse=True)
    return ctx.envelope(orders)


@router.get("/fills")
def fills(ctx: Ctx, limit: Annotated[int, Query(ge=1, le=500)] = 100) -> Envelope[list[FillRow]]:
    return ctx.envelope(build_fill_rows(ctx.source.fills())[:limit])
