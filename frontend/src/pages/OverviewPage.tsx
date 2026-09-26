import type { ReactNode } from "react";
import { Link } from "react-router";

import { useFills, useOpenOrders, usePortfolio } from "../api/client";
import type { Portfolio } from "../api/types";
import { PageHeader } from "../components/layout/PageHeader";
import { AllocationChart, AssetMark, HoldingStatusBadge, SideBadge } from "../components/portfolio";
import { ArrowRightIcon } from "../components/ui/icons";
import { Badge, Callout, Card, Delta, EmptyState, ErrorState, Estimated, LoadingRows, Skeleton } from "../components/ui/primitives";
import { Table, Td, Th, Tr } from "../components/ui/table";
import {
  formatAge,
  formatMoney,
  formatPercent,
  formatPrice,
  formatQuantity,
  trendOf,
} from "../lib/format";
import { useNow } from "../lib/useNow";

function CardLink({ to, children }: { to: string; children: string }) {
  return (
    <Link to={to} className="inline-flex items-center gap-1 text-sm font-semibold text-accent-text hover:underline">
      {children} <ArrowRightIcon className="size-4" />
    </Link>
  );
}

function Stat({ label, value, note }: { label: string; value: ReactNode; note: ReactNode }) {
  return (
    <div className="min-w-0 border-line py-3 sm:px-5 sm:py-0 sm:not-first:border-l">
      <p className="text-sm font-medium text-ink-2">{label}</p>
      <p className="mt-1 text-xl font-bold tracking-tight text-ink">{value}</p>
      <p className="mt-0.5 text-xs text-ink-3">{note}</p>
    </div>
  );
}

function PortfolioHero({ portfolio }: { portfolio: Portfolio }) {
  const quote = portfolio.quote_currency;
  const unvalued = portfolio.holdings.filter((holding) => holding.status === "unpriced").length;
  const direction = trendOf(portfolio.change_24h_value);

  return (
    <Card className="overflow-hidden" bodyClassName="p-0">
      <div className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.5fr)]">
        <div className="border-b border-line p-5 lg:border-r lg:border-b-0 lg:p-6">
          <p className="flex items-center gap-2 text-sm font-medium text-ink-2">
            Portfolio estimate
            {portfolio.complete ? (
              <Badge tone="up">All holdings priced</Badge>
            ) : (
              <Badge tone="warn">Incomplete</Badge>
            )}
          </p>
          <p className="mt-2 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
            <Estimated markClassName="text-2xl font-semibold sm:text-3xl">{formatMoney(portfolio.total_value, quote)}</Estimated>
          </p>
          <p className="mt-2 text-sm text-ink-2">
            {portfolio.change_24h_value === null ? (
              "24h change unavailable: not every price has 24-hour data."
            ) : (
              <>
                <Delta value={direction}>
                  {formatMoney(portfolio.change_24h_value, quote, { signed: true })} (
                  {formatPercent(portfolio.change_24h_pct, { signed: true })})
                </Delta>{" "}
                over 24h, assuming current holdings
              </>
            )}
          </p>
        </div>
        <div className="grid content-center divide-y divide-line px-5 py-2 sm:grid-cols-3 sm:divide-y-0 sm:py-6 lg:px-1">
          <Stat
            label={`Available ${quote}`}
            value={formatMoney(portfolio.available_quote, quote)}
            note="Reported by exchange"
          />
          <Stat
            label="Locked in orders"
            value={<Estimated>{formatMoney(portfolio.locked_value, quote)}</Estimated>}
            note="Held by open orders"
          />
          <Stat
            label="Assets held"
            value={portfolio.holdings.length}
            note={unvalued ? `${unvalued} not valued in ${quote}` : "All valued"}
          />
        </div>
      </div>
    </Card>
  );
}

function HeroSkeleton() {
  return (
    <Card>
      <div role="status" aria-label="Loading portfolio" className="space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-4 w-56" />
      </div>
    </Card>
  );
}

function TopHoldings({ portfolio }: { portfolio: Portfolio }) {
  const quote = portfolio.quote_currency;
  return (
    <Card title="Top holdings" description="By estimated value" action={<CardLink to="/assets">All assets</CardLink>}>
      <Table label="Top holdings">
        <thead>
          <tr>
            <Th>Asset</Th>
            <Th numeric>Quantity</Th>
            <Th numeric>Value</Th>
            <Th numeric>24h</Th>
          </tr>
        </thead>
        <tbody>
          {portfolio.holdings.slice(0, 6).map((holding) => (
            <Tr key={holding.asset}>
              <Td>
                <span className="flex items-center gap-2.5">
                  <AssetMark asset={holding.asset} />
                  <span className="font-semibold text-ink">{holding.asset}</span>
                  <HoldingStatusBadge holding={holding} quote={quote} />
                </span>
              </Td>
              <Td numeric>{formatQuantity(holding.total)}</Td>
              <Td numeric className="font-semibold text-ink">
                {holding.value === null ? <span className="font-normal text-ink-3">Not valued</span> : formatMoney(holding.value, quote)}
              </Td>
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
      </Table>
    </Card>
  );
}

function RecentActivity() {
  const orders = useOpenOrders();
  const fills = useFills(4);
  const now = useNow();

  return (
    <Card title="Activity" description="Open orders and latest fills" action={<CardLink to="/activity">All activity</CardLink>}>
      <h3 className="text-xs font-semibold tracking-wide text-ink-3 uppercase">Open orders</h3>
      <div className="mt-2">
        {orders.isPending ? (
          <LoadingRows rows={2} label="Loading open orders" />
        ) : orders.isError ? (
          <ErrorState error={orders.error} onRetry={() => orders.refetch()} />
        ) : orders.data.data.length === 0 ? (
          <p className="text-sm text-ink-3">No open orders.</p>
        ) : (
          <ul className="divide-y divide-line">
            {orders.data.data.map((order) => (
              <li key={order.order_id} className="flex items-center gap-3 py-2 text-sm">
                <SideBadge side={order.side} />
                <span className="min-w-0 flex-1">
                  <span className="font-semibold text-ink">{order.symbol}</span>{" "}
                  <span className="num text-ink-2">
                    {formatQuantity(order.quantity)} @ {order.price ? formatPrice(order.price, order.symbol.split("/")[1]) : "market"}
                  </span>
                </span>
                <span className="text-xs text-ink-3">{formatAge(order.created_at, now)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <h3 className="mt-5 text-xs font-semibold tracking-wide text-ink-3 uppercase">Latest fills</h3>
      <div className="mt-2">
        {fills.isPending ? (
          <LoadingRows rows={3} label="Loading fills" />
        ) : fills.isError ? (
          <ErrorState error={fills.error} onRetry={() => fills.refetch()} />
        ) : fills.data.data.length === 0 ? (
          <p className="text-sm text-ink-3">No fills yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {fills.data.data.map((fill) => (
              <li key={fill.fill_id} className="flex items-center gap-3 py-2 text-sm">
                <SideBadge side={fill.side} />
                <span className="min-w-0 flex-1">
                  <span className="font-semibold text-ink">{fill.symbol}</span>{" "}
                  <span className="num text-ink-2">{formatQuantity(fill.quantity)}</span>
                </span>
                <span className="num text-ink-2">{formatMoney(fill.value, fill.symbol.split("/")[1])}</span>
                <span className="w-14 text-right text-xs text-ink-3">{formatAge(fill.executed_at, now)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}

export function OverviewPage() {
  const portfolio = usePortfolio();

  return (
    <>
      <PageHeader
        title="Overview"
        description="What you hold, what it is worth, and what is in flight."
        asOf={portfolio.data?.data.balances_as_of}
      />

      <div className="space-y-4">
        {portfolio.isPending ? (
          <HeroSkeleton />
        ) : portfolio.isError ? (
          <ErrorState error={portfolio.error} onRetry={() => portfolio.refetch()} />
        ) : (
          <>
            <PortfolioHero portfolio={portfolio.data.data} />

            {portfolio.data.data.warnings.length > 0 && (
              <Callout tone="warn" title="The estimate leaves some things out">
                <ul className="mt-1 list-disc space-y-0.5 pl-4">
                  {portfolio.data.data.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </Callout>
            )}

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
              <Card title="Allocation" description="Share of the estimated value">
                {portfolio.data.data.holdings.some((holding) => holding.value !== null) ? (
                  <AllocationChart portfolio={portfolio.data.data} />
                ) : (
                  <EmptyState title="Nothing to allocate">No holdings have a price yet.</EmptyState>
                )}
              </Card>
              <TopHoldings portfolio={portfolio.data.data} />
            </div>
          </>
        )}

        {/* Loads independently, so a portfolio failure doesn't hide orders and fills. */}
        <RecentActivity />
      </div>
    </>
  );
}
