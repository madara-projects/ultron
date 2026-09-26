import type { ComponentType, ReactNode, SVGProps } from "react";

import { useStatus } from "../api/client";
import type { ConnectionStatus } from "../api/types";
import { PageHeader } from "../components/layout/PageHeader";
import { MonitorIcon, MoonIcon, SunIcon } from "../components/ui/icons";
import { Badge, Card, ErrorState, LoadingRows } from "../components/ui/primitives";
import { Table, Td, Th, Tr } from "../components/ui/table";
import { cn } from "../lib/cn";
import { formatPercent } from "../lib/format";
import { useTheme, type ThemePreference } from "../lib/theme";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[200px_1fr] sm:gap-4">
      <dt className="text-sm font-medium text-ink-2">{label}</dt>
      <dd className="text-sm text-ink">{children}</dd>
    </div>
  );
}

function ConnectionCard({ status }: { status: ConnectionStatus }) {
  return (
    <Card title="Connection" description="How Ultron reaches your account.">
      <dl className="divide-y divide-line">
        <Row label="Data source">
          {status.connected ? "Giottus" : <Badge tone="accent">Sample data</Badge>}
          <p className="mt-1 text-ink-2">{status.message}</p>
        </Row>
        <Row label="Access">Read-only. Ultron has no code that places, cancels, or withdraws.</Row>
        <Row label="Live orders">Not available in this version.</Row>
        <Row label="API secret">
          Not configured. When added, it stays on the local server and is never sent to this browser.
        </Row>
        <Row label="Stale price after">
          {status.price_stale_after_seconds / 60} minutes. Older prices are flagged and make totals incomplete.
        </Row>
      </dl>
    </Card>
  );
}

function FeesCard({ fees }: { fees: ConnectionStatus["fees"] }) {
  const rows = [
    { label: "INR pairs", fee: fees.inr_pair_pct, effective: fees.inr_pair_effective_pct },
    { label: "Crypto pairs", fee: fees.crypto_pair_pct, effective: fees.crypto_pair_effective_pct },
  ];
  return (
    <Card
      title="Fee assumptions"
      description={`Used only for estimates. Reviewed ${fees.reviewed_on}; Giottus fees change with trading volume.`}
    >
      <Table label="Fee assumptions">
        <thead>
          <tr>
            <Th>Spot pair</Th>
            <Th numeric>Fee</Th>
            <Th numeric>GST on fee</Th>
            <Th numeric>Effective</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <Tr key={row.label}>
              <Td className="font-semibold text-ink">{row.label}</Td>
              <Td numeric>{formatPercent(row.fee)}</Td>
              <Td numeric>{formatPercent(fees.gst_pct, { digits: 0 })}</Td>
              <Td numeric className="font-semibold text-ink">
                {formatPercent(row.effective, { digits: 3 })}
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
      <p className="mt-3 text-xs text-ink-3">
        Change these with the <code className="font-semibold">ULTRON_FEE_*</code> server settings.
      </p>
    </Card>
  );
}

const THEMES: { value: ThemePreference; label: string; icon: ComponentType<SVGProps<SVGSVGElement>> }[] = [
  { value: "system", label: "System", icon: MonitorIcon },
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
];

function AppearanceCard() {
  const { preference, setPreference } = useTheme();
  return (
    <Card title="Appearance" description="Saved in this browser only.">
      <fieldset>
        <legend className="sr-only">Theme</legend>
        <div className="grid grid-cols-3 gap-2 sm:max-w-md">
          {THEMES.map(({ value, label, icon: Icon }) => (
            <label
              key={value}
              className={cn(
                "flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border px-3 py-3 text-sm font-semibold has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus",
                preference === value ? "border-accent bg-accent-soft text-accent-text" : "border-line-strong text-ink-2 hover:bg-surface-2",
              )}
            >
              <input
                type="radio"
                name="theme"
                value={value}
                checked={preference === value}
                onChange={() => setPreference(value)}
                className="sr-only"
              />
              <Icon />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
    </Card>
  );
}

export function SettingsPage() {
  const status = useStatus();

  return (
    <>
      <PageHeader title="Settings" description="Connection, estimate assumptions, and display." />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {status.isPending ? (
          <Card>
            <LoadingRows rows={5} label="Loading settings" />
          </Card>
        ) : status.isError ? (
          <ErrorState error={status.error} onRetry={() => status.refetch()} />
        ) : (
          <>
            <ConnectionCard status={status.data.data} />
            <div className="space-y-4">
              <FeesCard fees={status.data.data.fees} />
              <AppearanceCard />
            </div>
          </>
        )}
      </div>
    </>
  );
}
