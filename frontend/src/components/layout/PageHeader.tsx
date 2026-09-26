import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { cn } from "../../lib/cn";
import { formatAge, formatFullDateTime } from "../../lib/format";
import { useNow } from "../../lib/useNow";
import { RefreshIcon } from "../ui/icons";
import { Button } from "../ui/primitives";

export function PageHeader({
  title,
  description,
  asOf,
  refreshable = true,
}: {
  title: string;
  description?: ReactNode;
  asOf?: string;
  refreshable?: boolean;
}) {
  const queryClient = useQueryClient();
  const fetching = useIsFetching() > 0;
  const now = useNow();

  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-[1.75rem]">{title}</h1>
        {description && <p className="mt-1 text-ink-2">{description}</p>}
      </div>
      <div className="flex items-center gap-3">
        {asOf && (
          <p className="text-sm text-ink-3">
            Updated <time dateTime={asOf} title={formatFullDateTime(asOf)}>{formatAge(asOf, now)}</time>
          </p>
        )}
        {refreshable && (
          <Button onClick={() => queryClient.invalidateQueries()} disabled={fetching}>
            <RefreshIcon className={cn("size-4", fetching && "animate-spin")} />
            <span>Refresh</span>
          </Button>
        )}
      </div>
    </div>
  );
}
