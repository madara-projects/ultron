"""Runtime settings for the Ultron server, read from environment variables."""

from __future__ import annotations

import os
from collections.abc import Mapping
from dataclasses import dataclass, field
from decimal import Decimal
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parent.parent
DEFAULT_FRONTEND_DIST = PROJECT_DIR / "frontend" / "dist"

# Only sample data is wired up in this build. "giottus" arrives with the
# read-only exchange adapter (ROADMAP Phase 2).
SUPPORTED_SOURCES = ("fixture",)
LOOPBACK_HOSTS = ("127.0.0.1", "localhost", "::1")


@dataclass(frozen=True)
class FeeSchedule:
    """Spot fee assumptions used for estimates, never for exchange-reported fees.

    Giottus fees depend on rolling trade volume and change over time, so these
    defaults must be re-checked against the published fee page before use.
    """

    inr_pair_pct: Decimal = Decimal("0.4")
    crypto_pair_pct: Decimal = Decimal("0.3")
    gst_pct: Decimal = Decimal("18")
    reviewed_on: str = "2026-09-25"

    def effective_pct(self, fee_pct: Decimal) -> Decimal:
        """Fee percentage including GST charged on the fee."""
        return fee_pct * (Decimal(1) + self.gst_pct / Decimal(100))


@dataclass(frozen=True)
class Settings:
    host: str = "127.0.0.1"
    port: int = 8765
    data_source: str = "fixture"
    quote_currency: str = "INR"
    price_stale_after_seconds: int = 300
    allowed_hosts: tuple[str, ...] = LOOPBACK_HOSTS
    frontend_dist: Path = DEFAULT_FRONTEND_DIST
    fees: FeeSchedule = field(default_factory=FeeSchedule)

    @classmethod
    def from_env(cls, env: Mapping[str, str] | None = None) -> Settings:
        env = os.environ if env is None else env
        defaults = cls()

        data_source = env.get("ULTRON_DATA_SOURCE", defaults.data_source).strip().lower()
        if data_source not in SUPPORTED_SOURCES:
            raise ValueError(
                f"ULTRON_DATA_SOURCE={data_source!r} is not available in this build; "
                f"supported: {', '.join(SUPPORTED_SOURCES)}"
            )

        allowed_hosts = tuple(
            host.strip() for host in env.get("ULTRON_ALLOWED_HOSTS", "").split(",") if host.strip()
        ) or defaults.allowed_hosts

        fees = FeeSchedule(
            inr_pair_pct=Decimal(env.get("ULTRON_FEE_INR_PAIR_PCT", str(defaults.fees.inr_pair_pct))),
            crypto_pair_pct=Decimal(env.get("ULTRON_FEE_CRYPTO_PAIR_PCT", str(defaults.fees.crypto_pair_pct))),
            gst_pct=Decimal(env.get("ULTRON_FEE_GST_PCT", str(defaults.fees.gst_pct))),
            reviewed_on=env.get("ULTRON_FEE_REVIEWED_ON", defaults.fees.reviewed_on),
        )

        return cls(
            host=env.get("ULTRON_HOST", defaults.host),
            port=int(env.get("ULTRON_PORT", defaults.port)),
            data_source=data_source,
            quote_currency=env.get("ULTRON_QUOTE_CURRENCY", defaults.quote_currency).strip().upper(),
            price_stale_after_seconds=int(
                env.get("ULTRON_PRICE_STALE_AFTER_SECONDS", defaults.price_stale_after_seconds)
            ),
            allowed_hosts=allowed_hosts,
            frontend_dist=Path(env.get("ULTRON_FRONTEND_DIST", str(defaults.frontend_dist))),
            fees=fees,
        )
