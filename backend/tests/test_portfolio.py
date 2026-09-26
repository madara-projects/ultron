from datetime import UTC, datetime, timedelta
from decimal import Decimal

from backend.models import AccountBalances, Balance, HoldingStatus, Ticker
from backend.portfolio import build_market_rows, build_portfolio
from backend.settings import FeeSchedule

NOW = datetime(2026, 9, 25, 12, 0, tzinfo=UTC)
STALE_AFTER = timedelta(minutes=5)


def balances(*items: tuple[str, str, str]) -> AccountBalances:
    return AccountBalances(
        balances=[Balance(asset=asset, free=Decimal(free), locked=Decimal(locked)) for asset, free, locked in items],
        as_of=NOW,
    )


def ticker(base: str, price: str, *, quote: str = "INR", change: str | None = "0", age: int = 5) -> Ticker:
    return Ticker(
        symbol=f"{base}/{quote}",
        base=base,
        quote=quote,
        last_price=Decimal(price),
        change_24h_pct=None if change is None else Decimal(change),
        as_of=NOW - timedelta(seconds=age),
    )


def value(balances_: AccountBalances, tickers: list[Ticker]):
    return build_portfolio(balances_, tickers, quote_currency="INR", now=NOW, stale_after=STALE_AFTER)


def test_values_holdings_and_allocations_sum_to_100():
    result = value(
        balances(("INR", "1000", "250"), ("BTC", "0.5", "0.25")),
        [ticker("BTC", "10000")],
    )

    btc, inr = result.holdings
    assert btc.asset == "BTC" and btc.value == Decimal("7500.00")
    assert btc.locked_value == Decimal("2500.00")
    assert inr.status is HoldingStatus.QUOTE and inr.value == Decimal("1250.00")
    assert result.total_value == Decimal("8750.00")
    assert result.available_quote == Decimal("1000")
    assert result.locked_value == Decimal("2750.00")
    assert sum(h.allocation_pct for h in result.holdings) == Decimal("100.00")
    assert result.complete and result.warnings == []


def test_asset_without_quote_price_is_unvalued_not_zero():
    result = value(balances(("INR", "100", "0"), ("ARB", "85", "0")), [ticker("ARB", "0.62", quote="USDT")])

    arb = next(h for h in result.holdings if h.asset == "ARB")
    assert arb.status is HoldingStatus.UNPRICED
    assert arb.value is None and arb.allocation_pct is None
    assert result.total_value == Decimal("100.00")
    assert not result.complete
    assert "ARB has no INR price" in result.warnings[0]
    assert result.holdings[-1].asset == "ARB"


def test_stale_price_is_valued_but_marks_estimate_incomplete():
    result = value(balances(("XRP", "10", "0")), [ticker("XRP", "250", age=90 * 60)])

    (xrp,) = result.holdings
    assert xrp.status is HoldingStatus.STALE_PRICE
    assert xrp.value == Decimal("2500.00")
    assert not result.complete
    assert result.warnings == ["XRP is valued with a price from 1h 30m ago."]


def test_zero_balances_are_omitted():
    result = value(balances(("DOGE", "0", "0"), ("INR", "5", "0")), [ticker("DOGE", "20")])
    assert [h.asset for h in result.holdings] == ["INR"]


def test_24h_change_uses_previous_price_of_current_holdings():
    result = value(
        balances(("INR", "100", "0"), ("BTC", "2", "0")),
        [ticker("BTC", "110", change="10")],
    )

    assert result.change_24h_value == Decimal("20.00")
    # 320 now vs 300 a day ago for the same holdings.
    assert result.change_24h_pct == Decimal("6.67")


def test_24h_change_is_unavailable_when_any_price_lacks_it():
    result = value(
        balances(("BTC", "1", "0"), ("ETH", "1", "0")),
        [ticker("BTC", "100", change="1"), ticker("ETH", "50", change=None)],
    )
    assert result.change_24h_value is None
    assert result.change_24h_pct is None


def test_market_rows_report_spread_and_staleness():
    fresh = ticker("BTC", "100").model_copy(update={"bid": Decimal("99"), "ask": Decimal("101")})
    stale = ticker("ETH", "50", age=3600)

    rows = build_market_rows([fresh, stale], now=NOW, stale_after=STALE_AFTER)

    assert rows[0].spread_pct == Decimal("2.000") and not rows[0].stale
    assert rows[1].spread_pct is None and rows[1].stale


def test_decimals_serialize_in_plain_notation():
    balance = Balance(asset="BTC", free=Decimal("0.00000001"), locked=Decimal("0E-8"))
    assert balance.model_dump(mode="json") == {"asset": "BTC", "free": "0.00000001", "locked": "0.00000000"}


def test_effective_fee_includes_gst():
    fees = FeeSchedule()
    assert fees.effective_pct(fees.inr_pair_pct) == Decimal("0.472")
    assert fees.effective_pct(fees.crypto_pair_pct) == Decimal("0.354")
