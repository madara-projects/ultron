"""Portfolio valuation and market enrichment derived from exchange-reported data.

Valuation fails closed: an asset without a direct quote-currency price is left
unvalued rather than counted as zero, and stale prices mark the total as an
incomplete estimate.
"""

from __future__ import annotations

from datetime import datetime, timedelta
from decimal import ROUND_HALF_EVEN, Decimal

from backend.models import (
    AccountBalances,
    Fill,
    FillRow,
    Holding,
    HoldingStatus,
    MarketRow,
    Portfolio,
    Ticker,
)

_CENT = Decimal("0.01")
_HUNDRED = Decimal(100)


def _money(value: Decimal) -> Decimal:
    return value.quantize(_CENT, rounding=ROUND_HALF_EVEN)


def _pct(value: Decimal) -> Decimal:
    return value.quantize(_CENT, rounding=ROUND_HALF_EVEN)


def format_age(age: timedelta) -> str:
    seconds = max(int(age.total_seconds()), 0)
    if seconds < 60:
        return f"{seconds}s"
    minutes = seconds // 60
    if minutes < 60:
        return f"{minutes}m"
    hours, minutes = divmod(minutes, 60)
    if hours < 48:
        return f"{hours}h {minutes}m" if minutes else f"{hours}h"
    return f"{hours // 24}d"


def is_stale(as_of: datetime, now: datetime, stale_after: timedelta) -> bool:
    return now - as_of > stale_after


def build_portfolio(
    balances: AccountBalances,
    tickers: list[Ticker],
    *,
    quote_currency: str,
    now: datetime,
    stale_after: timedelta,
) -> Portfolio:
    prices = {ticker.base: ticker for ticker in tickers if ticker.quote == quote_currency}
    rows: list[dict] = []
    warnings: list[str] = []
    change_available = True

    for balance in balances.balances:
        total = balance.total
        if total <= 0:
            continue
        row: dict = {"asset": balance.asset, "free": balance.free, "locked": balance.locked, "total": total}

        if balance.asset == quote_currency:
            row.update(
                status=HoldingStatus.QUOTE,
                price=Decimal(1),
                value=total,
                locked_value=balance.locked,
                change_24h_value=Decimal(0),
            )
            rows.append(row)
            continue

        ticker = prices.get(balance.asset)
        if ticker is None:
            row["status"] = HoldingStatus.UNPRICED
            warnings.append(f"{balance.asset} has no {quote_currency} price, so it is not included in the total.")
            rows.append(row)
            continue

        stale = is_stale(ticker.as_of, now, stale_after)
        if stale:
            warnings.append(
                f"{balance.asset} is valued with a price from {format_age(now - ticker.as_of)} ago."
            )

        change_value = None
        if ticker.change_24h_pct is None:
            change_available = False
        else:
            previous_price = ticker.last_price / (Decimal(1) + ticker.change_24h_pct / _HUNDRED)
            change_value = total * (ticker.last_price - previous_price)

        row.update(
            status=HoldingStatus.STALE_PRICE if stale else HoldingStatus.PRICED,
            price_symbol=ticker.symbol,
            price=ticker.last_price,
            price_as_of=ticker.as_of,
            value=total * ticker.last_price,
            locked_value=balance.locked * ticker.last_price,
            change_24h_pct=ticker.change_24h_pct,
            change_24h_value=change_value,
        )
        rows.append(row)

    valued = [row for row in rows if row.get("value") is not None]
    total_value = sum((row["value"] for row in valued), Decimal(0))
    locked_value = sum((row["locked_value"] for row in valued), Decimal(0))
    available_quote = next((row["free"] for row in rows if row["asset"] == quote_currency), Decimal(0))

    change_24h_value = change_24h_pct = None
    if change_available:
        change_24h_value = sum((row["change_24h_value"] for row in valued), Decimal(0))
        previous_total = total_value - change_24h_value
        if previous_total > 0:
            change_24h_pct = _pct(change_24h_value / previous_total * _HUNDRED)
        change_24h_value = _money(change_24h_value)

    holdings = []
    for row in rows:
        if row.get("value") is not None:
            if total_value > 0:
                row["allocation_pct"] = _pct(row["value"] / total_value * _HUNDRED)
            row["value"] = _money(row["value"])
            row["locked_value"] = _money(row["locked_value"])
            row["change_24h_value"] = _money(row["change_24h_value"]) if row.get("change_24h_value") is not None else None
        holdings.append(Holding(**row))

    holdings.sort(key=lambda holding: (holding.value is None, -(holding.value or Decimal(0)), holding.asset))

    return Portfolio(
        quote_currency=quote_currency,
        balances_as_of=balances.as_of,
        total_value=_money(total_value),
        available_quote=available_quote,
        locked_value=_money(locked_value),
        change_24h_value=change_24h_value,
        change_24h_pct=change_24h_pct,
        complete=not warnings,
        warnings=warnings,
        holdings=holdings,
    )


def build_market_rows(tickers: list[Ticker], *, now: datetime, stale_after: timedelta) -> list[MarketRow]:
    rows = []
    for ticker in tickers:
        spread_pct = None
        if ticker.bid is not None and ticker.ask is not None and ticker.bid > 0 and ticker.ask >= ticker.bid:
            midpoint = (ticker.bid + ticker.ask) / 2
            spread_pct = (ticker.ask - ticker.bid) / midpoint * _HUNDRED
            spread_pct = spread_pct.quantize(Decimal("0.001"), rounding=ROUND_HALF_EVEN)
        rows.append(
            MarketRow(
                **ticker.model_dump(),
                stale=is_stale(ticker.as_of, now, stale_after),
                spread_pct=spread_pct,
            )
        )
    return rows


def build_fill_rows(fills: list[Fill]) -> list[FillRow]:
    rows = [FillRow(**fill.model_dump(), value=_money(fill.price * fill.quantity)) for fill in fills]
    return sorted(rows, key=lambda row: row.executed_at, reverse=True)
