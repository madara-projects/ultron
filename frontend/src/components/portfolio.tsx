import { useRef, useState } from "react";

import type { Holding, Portfolio, Side } from "../api/types";
import { cn } from "../lib/cn";
import { formatMoney, formatPercent, toNumber } from "../lib/format";
import { Badge } from "./ui/primitives";

export function AssetMark({ asset, className }: { asset: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-grid size-7 shrink-0 place-items-center rounded-full bg-surface-2 text-[0.625rem] font-bold tracking-tight text-ink-2 ring-1 ring-line",
        className,
      )}
    >
      {asset.slice(0, 4)}
    </span>
  );
}

export function HoldingStatusBadge({ holding, quote }: { holding: Holding; quote: string }) {
  if (holding.status === "stale_price") return <Badge tone="warn">Stale price</Badge>;
  if (holding.status === "unpriced") return <Badge>No {quote} price</Badge>;
  if (holding.status === "quote") return <Badge>Cash</Badge>;
  return null;
}

export function SideBadge({ side }: { side: Side }) {
  return <Badge tone={side === "buy" ? "up" : "down"}>{side === "buy" ? "Buy" : "Sell"}</Badge>;
}

// --- Allocation -------------------------------------------------------------

const MAX_ASSET_SEGMENTS = 7;

export interface AllocationSegment {
  key: string;
  label: string;
  value: number;
  pct: number;
  color: string;
}

/**
 * Part-to-whole segments for valued holdings. Colours follow the asset
 * (assigned alphabetically), never its rank, so a price move does not repaint
 * the chart. Cash is neutral; assets past the categorical limit fold into Other.
 */
export function allocationSegments(portfolio: Portfolio): AllocationSegment[] {
  const valued = portfolio.holdings.filter((holding) => (toNumber(holding.value) ?? 0) > 0);
  const cash = valued.filter((holding) => holding.status === "quote");
  const assets = valued.filter((holding) => holding.status !== "quote");

  const shown = assets.slice(0, MAX_ASSET_SEGMENTS);
  const folded = assets.slice(MAX_ASSET_SEGMENTS);
  const slotByAsset = new Map(
    [...shown].sort((a, b) => a.asset.localeCompare(b.asset)).map((holding, index) => [holding.asset, index + 1]),
  );

  const segments: AllocationSegment[] = [...shown, ...cash].map((holding) => ({
    key: holding.asset,
    label: holding.status === "quote" ? `${holding.asset} cash` : holding.asset,
    value: toNumber(holding.value) ?? 0,
    pct: toNumber(holding.allocation_pct) ?? 0,
    color: holding.status === "quote" ? "var(--series-cash)" : `var(--series-${slotByAsset.get(holding.asset)})`,
  }));

  if (folded.length > 0) {
    segments.push({
      key: "__other",
      label: `Other (${folded.length})`,
      value: folded.reduce((sum, holding) => sum + (toNumber(holding.value) ?? 0), 0),
      pct: folded.reduce((sum, holding) => sum + (toNumber(holding.allocation_pct) ?? 0), 0),
      color: "var(--series-other)",
    });
  }

  return segments.sort((a, b) => b.value - a.value);
}

export function AllocationChart({ portfolio }: { portfolio: Portfolio }) {
  const segments = allocationSegments(portfolio);
  const [active, setActive] = useState<{ key: string; x: number } | null>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const activeSegment = segments.find((segment) => segment.key === active?.key);

  const showTooltip = (key: string, element: HTMLElement) => {
    setActive({ key, x: element.offsetLeft + element.offsetWidth / 2 });
  };

  return (
    <div>
      <div className="relative pt-1">
        {/* Visual only: the list below carries the same values for assistive tech. */}
        <div ref={barRef} aria-hidden="true" className="flex h-3.5 w-full gap-[2px]" onMouseLeave={() => setActive(null)}>
          {segments.map((segment) => (
            <div
              key={segment.key}
              className={cn(
                "h-full min-w-1 transition-opacity first:rounded-l-[4px] last:rounded-r-[4px]",
                active && active.key !== segment.key && "opacity-35",
              )}
              style={{ flexGrow: segment.pct, flexBasis: 0, backgroundColor: segment.color }}
              onMouseEnter={(event) => showTooltip(segment.key, event.currentTarget)}
            />
          ))}
        </div>
        {activeSegment && active && (
          <div
            role="tooltip"
            className="pointer-events-none absolute bottom-full z-10 mb-2 -translate-x-1/2 rounded-lg border border-line bg-surface px-3 py-2 text-sm whitespace-nowrap shadow-lg"
            style={{ left: Math.min(Math.max(active.x, 80), (barRef.current?.offsetWidth ?? 0) - 80) }}
          >
            <p className="font-semibold text-ink">{activeSegment.label}</p>
            <p className="num text-ink-2">
              {formatMoney(activeSegment.value, portfolio.quote_currency)} · {formatPercent(activeSegment.pct, { digits: 1 })}
            </p>
          </div>
        )}
      </div>

      <ul className="mt-4 divide-y divide-line" aria-label="Allocation by asset">
        {segments.map((segment, index) => (
          <li
            key={segment.key}
            className={cn(
              "flex items-center gap-3 py-2 text-sm transition-opacity",
              active && active.key !== segment.key && "opacity-60",
            )}
            onMouseEnter={() => {
              const bar = barRef.current?.children[index];
              if (bar instanceof HTMLElement) showTooltip(segment.key, bar);
            }}
            onMouseLeave={() => setActive(null)}
          >
            <span aria-hidden="true" className="size-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: segment.color }} />
            <span className="min-w-0 flex-1 truncate font-medium text-ink">{segment.label}</span>
            <span className="num text-ink-2">{formatMoney(segment.value, portfolio.quote_currency)}</span>
            <span className="num w-14 text-right font-semibold text-ink">{formatPercent(segment.pct, { digits: 1 })}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
