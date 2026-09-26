import { useState } from "react";

import { usePortfolio } from "../api/client";
import type { Portfolio } from "../api/types";
import { PageHeader } from "../components/layout/PageHeader";
import { AssetMark, HoldingStatusBadge } from "../components/portfolio";
import { Card, Delta, EmptyState, ErrorState, Estimated, LoadingRows, SearchField } from "../components/ui/primitives";
import { Table, Td, Th, Tr } from "../components/ui/table";
import { formatAge, formatMoney, formatPercent, formatPrice, formatQuantity, toNumber, trendOf } from "../lib/format";
import { useNow } from "../lib/useNow";

function AssetsCard({ portfolio }: { portfolio: Portfolio }) {
  const [query, setQuery] = useState("");
  const now = useNow();
  const { holdings, quote_currency: quote, total_value } = portfolio;
  const needle = query.trim().toUpperCase();
  const visible = needle ? holdings.filter((holding) => holding.asset.includes(needle)) : holdings;

  return (
    <Card
      title={`${holdings.length} assets`}
      description={
        <>
          Quantities are reported by the exchange. Values marked <Estimated /> are Ultron's estimates from {quote} prices.
        </>
      }
      action={<SearchField label="Filter assets" value={query} onChange={setQuery} />}
    >
      {visible.length === 0 ? (
        <EmptyState title="No matching assets">Nothing matches “{query}”.</EmptyState>
      ) : (
        <Table label="Assets">
          <thead>
            <tr>
              <Th>Asset</Th>
              <Th numeric>Total</Th>
              <Th numeric>Available</Th>
              <Th numeric>Locked</Th>
              <Th numeric>Price</Th>
              <Th numeric>
                <Estimated>Value</Estimated>
              </Th>
              <Th numeric>Share</Th>
              <Th numeric>24h</Th>
            </tr>
          </thead>
          <tbody>
            {visible.map((holding) => (
              <Tr key={holding.asset}>
                <Td>
                  <span className="flex items-center gap-2.5">
                    <AssetMark asset={holding.asset} />
                    <span className="font-semibold text-ink">{holding.asset}</span>
                    <HoldingStatusBadge holding={holding} quote={quote} />
                  </span>
                </Td>
                <Td numeric className="font-semibold text-ink">
                  {formatQuantity(holding.total)}
                </Td>
                <Td numeric>{formatQuantity(holding.free)}</Td>
                <Td numeric className={toNumber(holding.locked) === 0 ? "text-ink-3" : "text-ink"}>
                  {formatQuantity(holding.locked)}
                </Td>
                <Td numeric>
                  {holding.status === "quote" || holding.price === null ? (
                    <span className="text-ink-3">—</span>
                  ) : (
                    <span className="flex flex-col items-end">
                      <span>{formatPrice(holding.price, quote)}</span>
                      {holding.price_as_of && (
                        <span className={holding.status === "stale_price" ? "text-xs font-semibold text-warn" : "text-xs text-ink-3"}>
                          {formatAge(holding.price_as_of, now)}
                        </span>
                      )}
                    </span>
                  )}
                </Td>
                <Td numeric className="font-semibold text-ink">
                  {holding.value === null ? <span className="font-normal text-ink-3">Not valued</span> : formatMoney(holding.value, quote)}
                </Td>
                <Td numeric>{holding.allocation_pct === null ? "—" : formatPercent(holding.allocation_pct, { digits: 1 })}</Td>
                <Td numeric>
                  {holding.status === "quote" || holding.change_24h_pct === null ? (
                    <span className="text-ink-3">—</span>
                  ) : (
                    <Delta value={trendOf(holding.change_24h_pct)}>{formatPercent(holding.change_24h_pct, { signed: true })}</Delta>
                  )}
                </Td>
              </Tr>
            ))}
          </tbody>
          {!needle && (
            <tfoot className="[&_td]:border-b-0 [&_td]:border-t [&_td]:border-line-strong">
              <tr>
                <Td className="font-semibold text-ink">Total estimate</Td>
                <Td colSpan={4} />
                <Td numeric className="font-bold text-ink">
                  <Estimated>{formatMoney(total_value, quote)}</Estimated>
                </Td>
                <Td colSpan={2} />
              </tr>
            </tfoot>
          )}
        </Table>
      )}
    </Card>
  );
}

export function AssetsPage() {
  const portfolio = usePortfolio();

  return (
    <>
      <PageHeader
        title="Assets"
        description="Every balance on the account, split into available and locked."
        asOf={portfolio.data?.data.balances_as_of}
      />
      {portfolio.isPending ? (
        <Card>
          <LoadingRows rows={6} label="Loading assets" />
        </Card>
      ) : portfolio.isError ? (
        <ErrorState error={portfolio.error} onRetry={() => portfolio.refetch()} />
      ) : (
        <AssetsCard portfolio={portfolio.data.data} />
      )}
    </>
  );
}
