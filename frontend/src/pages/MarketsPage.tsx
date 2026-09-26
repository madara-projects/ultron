import { useState } from "react";

import { useMarkets } from "../api/client";
import type { MarketRow } from "../api/types";
import { PageHeader } from "../components/layout/PageHeader";
import { AssetMark } from "../components/portfolio";
import { Badge, Card, Delta, EmptyState, ErrorState, LoadingRows, SearchField } from "../components/ui/primitives";
import { Table, Td, Th, Tr } from "../components/ui/table";
import { cn } from "../lib/cn";
import { formatAge, formatCompactMoney, formatPercent, formatPrice, toNumber, trendOf } from "../lib/format";
import { useNow } from "../lib/useNow";

const ALL = "All";

function MarketsCard({ rows }: { rows: MarketRow[] }) {
  const [quote, setQuote] = useState(ALL);
  const [query, setQuery] = useState("");
  const now = useNow();

  const quotes = [ALL, ...new Set(rows.map((row) => row.quote))];
  const needle = query.trim().toUpperCase();
  const visible = rows
    .filter((row) => quote === ALL || row.quote === quote)
    .filter((row) => !needle || row.symbol.includes(needle))
    .sort(
      (a, b) =>
        a.quote.localeCompare(b.quote) || (toNumber(b.volume_24h_quote) ?? 0) - (toNumber(a.volume_24h_quote) ?? 0),
    );

  return (
    <Card
      title={`${visible.length} spot pairs`}
      description="Sorted by 24h volume within each quote currency."
      action={
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Quote currency" className="flex rounded-lg border border-line-strong p-0.5">
            {quotes.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={quote === option}
                onClick={() => setQuote(option)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-sm font-semibold",
                  quote === option ? "bg-accent-soft text-accent-text" : "text-ink-2 hover:text-ink",
                )}
              >
                {option}
              </button>
            ))}
          </div>
          <SearchField label="Filter pairs" value={query} onChange={setQuery} />
        </div>
      }
    >
      {visible.length === 0 ? (
        <EmptyState title="No matching pairs">Try another search or quote currency.</EmptyState>
      ) : (
        <Table label="Spot markets">
          <thead>
            <tr>
              <Th>Pair</Th>
              <Th numeric>Last price</Th>
              <Th numeric>24h</Th>
              <Th numeric>24h volume</Th>
              <Th numeric>Spread</Th>
              <Th numeric>Price age</Th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <Tr key={row.symbol}>
                <Td>
                  <span className="flex items-center gap-2.5">
                    <AssetMark asset={row.base} />
                    <span>
                      <span className="font-semibold text-ink">{row.base}</span>
                      <span className="text-ink-3">/{row.quote}</span>
                    </span>
                  </span>
                </Td>
                <Td numeric className="font-semibold text-ink">
                  {formatPrice(row.last_price, row.quote)}
                </Td>
                <Td numeric>
                  {row.change_24h_pct === null ? (
                    <span className="text-ink-3">—</span>
                  ) : (
                    <Delta value={trendOf(row.change_24h_pct)}>{formatPercent(row.change_24h_pct, { signed: true })}</Delta>
                  )}
                </Td>
                <Td numeric>{row.volume_24h_quote === null ? "—" : formatCompactMoney(row.volume_24h_quote, row.quote)}</Td>
                <Td numeric>{row.spread_pct === null ? "—" : formatPercent(row.spread_pct, { digits: 3 })}</Td>
                <Td numeric>
                  {row.stale ? (
                    <Badge tone="warn">Stale · {formatAge(row.as_of, now)}</Badge>
                  ) : (
                    <span className="text-ink-3">{formatAge(row.as_of, now)}</span>
                  )}
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </Card>
  );
}

export function MarketsPage() {
  const markets = useMarkets();

  return (
    <>
      <PageHeader
        title="Markets"
        description="Spot pairs with their latest price, spread, and 24-hour movement."
        asOf={markets.data?.generated_at}
      />
      {markets.isPending ? (
        <Card>
          <LoadingRows rows={8} label="Loading markets" />
        </Card>
      ) : markets.isError ? (
        <ErrorState error={markets.error} onRetry={() => markets.refetch()} />
      ) : (
        <MarketsCard rows={markets.data.data} />
      )}
    </>
  );
}
