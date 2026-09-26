import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";

import { cn } from "../../lib/cn";

export function Table({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("-mx-5 overflow-x-auto", className)} role="region" aria-label={label} tabIndex={0}>
      <table className="w-full min-w-max border-collapse text-sm">
        <caption className="sr-only">{label}</caption>
        {children}
      </table>
    </div>
  );
}

export function Th({ numeric, className, ...props }: { numeric?: boolean } & ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope="col"
      className={cn(
        "border-b border-line px-3 py-2 text-xs font-semibold tracking-wide text-ink-3 uppercase first:pl-5 last:pr-5",
        numeric ? "text-right" : "text-left",
        className,
      )}
      {...props}
    />
  );
}

export function Td({ numeric, className, ...props }: { numeric?: boolean } & TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn(
        "border-b border-line px-3 py-2.5 align-middle first:pl-5 last:pr-5",
        numeric && "num text-right whitespace-nowrap",
        className,
      )}
      {...props}
    />
  );
}

export function Tr({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("transition-colors last:[&>td]:border-b-0 hover:bg-surface-2/60", className)} {...props} />;
}
