"""Typed data models shared by sources, calculations, and the JSON API.

Decimal fields serialize as JSON strings so quantities and prices keep their
exact precision. Models are split into exchange-reported facts (what a source
returns) and Ultron-derived values (valuations computed from those facts).
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from enum import StrEnum
from typing import Annotated, Generic, Literal, TypeVar

from pydantic import BaseModel, ConfigDict, PlainSerializer

T = TypeVar("T")

# Always plain notation ("0.00000001", never "1E-8") so clients can format exactly.
Dec = Annotated[Decimal, PlainSerializer(lambda value: format(value, "f"), return_type=str, when_used="json")]


class DataSource(StrEnum):
    FIXTURE = "fixture"


class Side(StrEnum):
    BUY = "buy"
    SELL = "sell"


class _Model(BaseModel):
    model_config = ConfigDict(frozen=True)


# --- Exchange-reported facts -------------------------------------------------


class Balance(_Model):
    asset: str
    free: Dec
    locked: Dec

    @property
    def total(self) -> Decimal:
        return self.free + self.locked


class AccountBalances(_Model):
    balances: list[Balance]
    as_of: datetime


class Ticker(_Model):
    symbol: str
    base: str
    quote: str
    last_price: Dec
    change_24h_pct: Dec | None = None
    volume_24h_quote: Dec | None = None
    bid: Dec | None = None
    ask: Dec | None = None
    as_of: datetime


class OpenOrder(_Model):
    order_id: str
    symbol: str
    side: Side
    order_type: str
    price: Dec | None
    quantity: Dec
    filled_quantity: Dec
    status: str
    created_at: datetime


class Fill(_Model):
    fill_id: str
    order_id: str
    symbol: str
    side: Side
    price: Dec
    quantity: Dec
    fee: Dec
    fee_asset: str
    executed_at: datetime


# --- Ultron-derived values ---------------------------------------------------


class HoldingStatus(StrEnum):
    QUOTE = "quote"
    PRICED = "priced"
    STALE_PRICE = "stale_price"
    UNPRICED = "unpriced"


class Holding(_Model):
    asset: str
    free: Dec
    locked: Dec
    total: Dec
    status: HoldingStatus
    price_symbol: str | None = None
    price: Dec | None = None
    price_as_of: datetime | None = None
    value: Dec | None = None
    locked_value: Dec | None = None
    allocation_pct: Dec | None = None
    change_24h_pct: Dec | None = None
    change_24h_value: Dec | None = None


class Portfolio(_Model):
    quote_currency: str
    balances_as_of: datetime
    total_value: Dec
    available_quote: Dec
    locked_value: Dec
    change_24h_value: Dec | None
    change_24h_pct: Dec | None
    complete: bool
    warnings: list[str]
    holdings: list[Holding]


class MarketRow(Ticker):
    stale: bool
    spread_pct: Dec | None = None


class FillRow(Fill):
    value: Dec


class FeeInfo(_Model):
    inr_pair_pct: Dec
    crypto_pair_pct: Dec
    gst_pct: Dec
    inr_pair_effective_pct: Dec
    crypto_pair_effective_pct: Dec
    reviewed_on: str


class ConnectionStatus(_Model):
    source: DataSource
    connected: bool
    message: str
    read_only: Literal[True] = True
    live_orders: Literal["unavailable"] = "unavailable"
    quote_currency: str
    price_stale_after_seconds: int
    fees: FeeInfo


class Envelope(BaseModel, Generic[T]):
    """Every API payload carries where it came from and when it was produced."""

    source: DataSource
    generated_at: datetime
    data: T
