import { useQuery } from "@tanstack/react-query";

import type { ConnectionStatus, Envelope, FillRow, MarketRow, OpenOrder, Portfolio } from "./types";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function getJson<T>(path: string, signal?: AbortSignal): Promise<Envelope<T>> {
  let response: Response;
  try {
    response = await fetch(path, { headers: { Accept: "application/json" }, signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError("Ultron's local server is not reachable. Is it running?", 0, "network_error");
  }

  if (!response.ok) {
    let message = `The server returned an error (${response.status}).`;
    let code = "http_error";
    try {
      const body = (await response.json()) as { error?: { code?: string; message?: string } };
      if (body.error?.message) message = body.error.message;
      if (body.error?.code) code = body.error.code;
    } catch {
      // Keep the generic message when the body is not JSON.
    }
    throw new ApiError(message, response.status, code);
  }
  return (await response.json()) as Envelope<T>;
}

function useApi<T>(key: readonly unknown[], path: string) {
  return useQuery({
    queryKey: key,
    queryFn: ({ signal }) => getJson<T>(path, signal),
  });
}

export const useStatus = () => useApi<ConnectionStatus>(["status"], "/api/status");
export const usePortfolio = () => useApi<Portfolio>(["portfolio"], "/api/portfolio");
export const useMarkets = () => useApi<MarketRow[]>(["markets"], "/api/markets");
export const useOpenOrders = () => useApi<OpenOrder[]>(["orders", "open"], "/api/orders/open");
export const useFills = (limit = 100) => useApi<FillRow[]>(["fills", limit], `/api/fills?limit=${limit}`);
