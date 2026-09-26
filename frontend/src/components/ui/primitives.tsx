import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

import { cn } from "../../lib/cn";
import { AlertIcon, InfoIcon, SearchIcon } from "./icons";

export function Card({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
  ...props
}: {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  bodyClassName?: string;
} & HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cn("rounded-xl border border-line bg-surface shadow-[0_1px_2px_rgb(15_20_35/0.04)]", className)}
      {...props}
    >
      {(title || action) && (
        <header className="flex items-start justify-between gap-4 px-5 pt-4">
          <div className="min-w-0">
            {title && <h2 className="text-[0.9375rem] font-semibold text-ink">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-ink-3">{description}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={cn("px-5 pb-5", title || action ? "pt-4" : "pt-5", bodyClassName)}>{children}</div>
    </section>
  );
}

type Tone = "neutral" | "accent" | "up" | "down" | "warn";

const badgeTones: Record<Tone, string> = {
  neutral: "bg-surface-2 text-ink-2 ring-line",
  accent: "bg-accent-soft text-accent-text ring-transparent",
  up: "bg-up-soft text-up ring-transparent",
  down: "bg-down-soft text-down ring-transparent",
  warn: "bg-warn-soft text-warn ring-warn-line",
};

export function Badge({
  tone = "neutral",
  className,
  children,
  ...props
}: { tone?: Tone } & HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold whitespace-nowrap ring-1 ring-inset",
        badgeTones[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

const buttonVariants = {
  primary: "bg-accent text-accent-ink hover:bg-accent-hover",
  secondary: "border border-line-strong bg-surface text-ink hover:bg-surface-2",
  ghost: "text-ink-2 hover:bg-surface-2 hover:text-ink",
};

export function Button({
  variant = "secondary",
  className,
  type = "button",
  ...props
}: { variant?: keyof typeof buttonVariants } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        buttonVariants[variant],
        className,
      )}
      {...props}
    />
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn("block animate-pulse rounded-md bg-surface-2", className)} />;
}

export function LoadingRows({ rows = 4, label }: { rows?: number; label: string }) {
  return (
    <div role="status" aria-label={label} className="space-y-3">
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-9 w-full" />
      ))}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-line-strong px-4 py-8 text-center">
      <p className="font-semibold text-ink">{title}</p>
      {children && <p className="mx-auto mt-1 max-w-md text-sm text-ink-3">{children}</p>}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message = error instanceof Error ? error.message : "Something went wrong.";
  return (
    <div role="alert" className="flex items-start gap-3 rounded-lg border border-down/30 bg-down-soft px-4 py-3">
      <AlertIcon className="mt-0.5 shrink-0 text-down" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-ink">Couldn't load this data</p>
        <p className="text-sm text-ink-2">{message} No values are shown rather than showing possibly wrong ones.</p>
      </div>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry} className="shrink-0">
          Retry
        </Button>
      )}
    </div>
  );
}

export function Callout({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: "info" | "warn";
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const Icon = tone === "warn" ? AlertIcon : InfoIcon;
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border px-4 py-3",
        tone === "warn" ? "border-warn-line bg-warn-soft" : "border-line bg-surface-2",
        className,
      )}
    >
      <Icon className={cn("mt-0.5 shrink-0", tone === "warn" ? "text-warn" : "text-ink-3")} />
      <div className="min-w-0 text-sm text-ink-2">
        {title && <p className="font-semibold text-ink">{title}</p>}
        {children}
      </div>
    </div>
  );
}

export function SearchField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="relative block w-full sm:w-60">
      <span className="sr-only">{label}</span>
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={label}
        className="h-9 w-full rounded-lg border border-line-strong bg-surface pr-3 pl-9 text-sm text-ink placeholder:text-ink-3"
      />
    </label>
  );
}

/** Marks a value Ultron calculated, as opposed to one the exchange reported. */
export function Estimated({ children, markClassName }: { children?: ReactNode; markClassName?: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <abbr title="Estimated by Ultron from prices; not reported by the exchange" className={cn("text-ink-3 no-underline", markClassName)}>
        ≈
      </abbr>
      {children}
    </span>
  );
}

export function Delta({ value, children, className }: { value: "up" | "down" | "flat"; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "num font-semibold",
        value === "up" && "text-up",
        value === "down" && "text-down",
        value === "flat" && "text-ink-2",
        className,
      )}
    >
      {value === "up" ? "▲ " : value === "down" ? "▼ " : ""}
      {children}
    </span>
  );
}
