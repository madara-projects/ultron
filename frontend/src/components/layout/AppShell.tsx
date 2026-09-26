import type { ComponentType, SVGProps } from "react";
import { NavLink, Outlet } from "react-router";

import { useStatus } from "../../api/client";
import { cn } from "../../lib/cn";
import {
  ActivityIcon,
  AlertIcon,
  InfoIcon,
  LockIcon,
  MarketsIcon,
  OverviewIcon,
  ResearchIcon,
  SettingsIcon,
  UltronMark,
  WalletIcon,
} from "../ui/icons";

interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  end?: boolean;
  tag?: string;
}

const NAV: NavItem[] = [
  { to: "/", label: "Overview", icon: OverviewIcon, end: true },
  { to: "/assets", label: "Assets", icon: WalletIcon },
  { to: "/markets", label: "Markets", icon: MarketsIcon },
  { to: "/activity", label: "Activity", icon: ActivityIcon },
  { to: "/research", label: "Research", icon: ResearchIcon, tag: "Off" },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

function Brand() {
  return (
    <NavLink to="/" className="flex items-center gap-2.5 rounded-lg px-2 py-1" aria-label="Ultron overview">
      <UltronMark className="size-8" />
      <span className="font-display text-lg font-bold tracking-tight text-ink">Ultron</span>
    </NavLink>
  );
}

function SourceBanner() {
  const status = useStatus();
  if (status.isPending) return null;

  if (status.isError) {
    return (
      <div role="note" className="flex items-center gap-2 border-b border-warn-line bg-warn-soft px-4 py-2 text-sm text-ink sm:px-6 lg:px-8">
        <AlertIcon className="shrink-0 text-warn" />
        <span>Ultron could not confirm where its data comes from. Treat every value as unverified.</span>
      </div>
    );
  }

  if (status.data.data.connected) return null;
  return (
    <div role="note" className="flex items-center gap-2 border-b border-line bg-accent-soft px-4 py-2 text-sm text-ink sm:px-6 lg:px-8">
      <InfoIcon className="shrink-0 text-accent-text" />
      <span>
        <strong className="font-semibold">Sample data.</strong> Ultron isn't connected to a Giottus account yet. Balances,
        prices, and orders on every page are illustrative, not yours.
      </span>
    </div>
  );
}

function SafetyFooter() {
  return (
    <div className="space-y-1.5 rounded-lg border border-line bg-surface-2 px-3 py-2.5 text-xs text-ink-2">
      <p className="flex items-center gap-1.5 font-semibold text-ink">
        <LockIcon className="size-3.5" /> Read-only
      </p>
      <p>Ultron can't place, cancel, or withdraw anything.</p>
    </div>
  );
}

export function AppShell() {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[236px_minmax(0,1fr)]">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-surface px-3 py-2 font-semibold text-ink shadow focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>

      <div className="hidden border-r border-line bg-surface lg:block">
        <aside className="sticky top-0 flex h-dvh flex-col px-3 py-4">
          <Brand />
          <nav aria-label="Primary" className="mt-6 flex-1">
            <ul className="space-y-0.5">
              {NAV.map(({ to, label, icon: Icon, end, tag }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                        isActive ? "bg-accent-soft text-accent-text" : "text-ink-2 hover:bg-surface-2 hover:text-ink",
                      )
                    }
                  >
                    <Icon />
                    <span className="flex-1">{label}</span>
                    {tag && <span className="rounded bg-surface-2 px-1.5 text-[0.6875rem] font-semibold text-ink-3 ring-1 ring-line">{tag}</span>}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <SafetyFooter />
        </aside>
      </div>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between px-4 pt-3 sm:px-6">
            <Brand />
            <span className="flex items-center gap-1 text-xs font-semibold text-ink-2">
              <LockIcon className="size-3.5" /> Read-only
            </span>
          </div>
          <nav aria-label="Primary" className="overflow-x-auto px-2 sm:px-4">
            <ul className="flex gap-1 py-2">
              {NAV.map(({ to, label, end }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      cn(
                        "block rounded-lg px-3 py-1.5 text-sm font-semibold whitespace-nowrap",
                        isActive ? "bg-accent-soft text-accent-text" : "text-ink-2 hover:bg-surface-2",
                      )
                    }
                  >
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </header>

        <SourceBanner />

        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-[1320px] flex-1 px-4 py-6 outline-none sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
