/** Mirrors backend/models.py. Decimal values arrive as strings to keep exact precision. */

import type { DecimalString } from "../lib/format";

export type DataSource = "fixture";
export type Side = "buy" | "sell";
export type HoldingStatus = "quote" | "priced" | "stale_price" | "unpriced";

export interface Envelope<T> {
  source: DataSource;
  generated_at: string;
  data: T;
}

export interface Holding {
  asset: string;
  free: DecimalString;
  locked: DecimalString;
  total: DecimalString;
  status: HoldingStatus;
  price_symbol: string | null;
  price: DecimalString | null;
  price_as_of: string | null;
  value: DecimalString | null;
  locked_value: DecimalString | null;
  allocation_pct: DecimalString | null;
  change_24h_pct: DecimalString | null;
  change_24h_value: DecimalString | null;
}

export interface Portfolio {
  quote_currency: string;
  balances_as_of: string;
  total_value: DecimalString;
  available_quote: DecimalString;
  locked_value: DecimalString;
  change_24h_value: DecimalString | null;
  change_24h_pct: DecimalString | null;
  complete: boolean;
  warnings: string[];
  holdings: Holding[];
}

export interface MarketRow {
  symbol: string;
  base: string;
  quote: string;
  last_price: DecimalString;
  change_24h_pct: DecimalString | null;
  volume_24h_quote: DecimalString | null;
  bid: DecimalString | null;
  ask: DecimalString | null;
  as_of: string;
  stale: boolean;
  spread_pct: DecimalString | null;
}

export interface OpenOrder {
  order_id: string;
  symbol: string;
  side: Side;
  order_type: string;
  price: DecimalString | null;
  quantity: DecimalString;
  filled_quantity: DecimalString;
  status: string;
  created_at: string;
}

export interface FillRow {
  fill_id: string;
  order_id: string;
  symbol: string;
  side: Side;
  price: DecimalString;
  quantity: DecimalString;
  fee: DecimalString;
  fee_asset: string;
  executed_at: string;
  value: DecimalString;
}

export interface FeeInfo {
  inr_pair_pct: DecimalString;
  crypto_pair_pct: DecimalString;
  gst_pct: DecimalString;
  inr_pair_effective_pct: DecimalString;
  crypto_pair_effective_pct: DecimalString;
  reviewed_on: string;
}

export interface ConnectionStatus {
  source: DataSource;
  connected: boolean;
  message: string;
  read_only: true;
  live_orders: "unavailable";
  quote_currency: string;
  price_stale_after_seconds: number;
  fees: FeeInfo;
}
