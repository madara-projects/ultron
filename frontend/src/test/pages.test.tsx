import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { mockApi, renderRoute } from "./render";

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-09-25T12:00:10Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("Overview", () => {
  it("labels sample data and shows the estimate with what it leaves out", async () => {
    mockApi();
    renderRoute("/");

    expect(await screen.findByText("₹9,64,976.38")).toBeInTheDocument();
    expect(screen.getByRole("note")).toHaveTextContent("Sample data");
    expect(screen.getByText("Incomplete")).toBeInTheDocument();
    expect(screen.getByText(/ARB has no INR price/)).toBeInTheDocument();
    expect(screen.getByText(/XRP is valued with a price from 1h 30m ago/)).toBeInTheDocument();

    const allocation = screen.getByRole("list", { name: "Allocation by asset" });
    expect(within(allocation).getByText("BTC").closest("li")).toHaveTextContent("41.4%");
    expect(within(allocation).queryByText("ARB")).not.toBeInTheDocument();
  });

  it("shows an error instead of a zero balance when the portfolio fails", async () => {
    mockApi({ "/api/portfolio": { status: 503, body: { error: { code: "source_unavailable", message: "Exchange timed out." } } } });
    renderRoute("/");

    expect(await screen.findByRole("alert")).toHaveTextContent("Exchange timed out.");
    expect(screen.queryByText(/₹0\.00/)).not.toBeInTheDocument();
    // Other sections load independently of the failed one.
    expect(await screen.findByText("SOL/INR")).toBeInTheDocument();
  });

  it("warns when the data source cannot be confirmed", async () => {
    mockApi({ "/api/status": { status: 500 } });
    renderRoute("/");

    expect(await screen.findByText(/could not confirm where its data comes from/)).toBeInTheDocument();
  });
});

describe("Assets", () => {
  it("filters holdings and marks unvalued assets", async () => {
    mockApi();
    renderRoute("/assets");
    const user = userEvent.setup();

    await screen.findByRole("table", { name: "Assets" });
    await user.type(screen.getByRole("searchbox", { name: "Filter assets" }), "ar");

    const table = screen.getByRole("table", { name: "Assets" });
    expect(within(table).getByRole("row", { name: /ARB/ })).toHaveTextContent("Not valued");
    expect(within(table).queryByRole("row", { name: /BTC/ })).not.toBeInTheDocument();
  });
});

describe("Markets", () => {
  it("filters by quote currency and flags stale prices", async () => {
    mockApi();
    renderRoute("/markets");
    const user = userEvent.setup();

    const table = await screen.findByRole("table", { name: "Spot markets" });
    expect(within(table).getByRole("row", { name: /XRP/ })).toHaveTextContent("Stale");

    await user.click(screen.getByRole("button", { name: "USDT" }));
    expect(screen.getByText("3 spot pairs")).toBeInTheDocument();
  });
});

describe("Research", () => {
  it("offers no recommendations or order actions", () => {
    mockApi();
    renderRoute("/research");

    expect(screen.getByText("Recommendations are off")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /buy|sell|order/i })).not.toBeInTheDocument();
  });
});

describe("Settings", () => {
  it("shows read-only status, fee assumptions, and switches theme", async () => {
    mockApi();
    renderRoute("/settings");
    const user = userEvent.setup();

    expect(await screen.findByText("Not available in this version.")).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Fee assumptions" })).toHaveTextContent("0.472%");

    await user.click(screen.getByRole("radio", { name: /dark/i }));
    expect(document.documentElement.dataset.theme).toBe("dark");
  });
});
