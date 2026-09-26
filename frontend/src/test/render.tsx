import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { vi } from "vitest";

import { AppRoutes } from "../App";
import { ThemeProvider } from "../lib/theme";
import samples from "./api-samples.json";

type Samples = Record<string, { data: unknown }>;

/** Serves backend-generated sample responses; `overrides` replace a path with an error status. */
export function mockApi(overrides: Record<string, { status: number; body?: unknown }> = {}) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(String(input), "http://127.0.0.1");
    const override = overrides[url.pathname];
    if (override) {
      return new Response(JSON.stringify(override.body ?? {}), {
        status: override.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const sample = (samples as Samples)[url.pathname];
    if (!sample) return new Response("{}", { status: 404 });
    let body = sample;
    const limit = url.searchParams.get("limit");
    if (limit && Array.isArray(sample.data)) body = { ...sample, data: sample.data.slice(0, Number(limit)) };
    return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

export function renderRoute(route: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <MemoryRouter initialEntries={[route]}>
          <AppRoutes />
        </MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>,
  );
}
