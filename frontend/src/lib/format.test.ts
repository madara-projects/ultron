import { describe, expect, it } from "vitest";

import { formatAge, formatCompactMoney, formatMoney, formatPercent, formatPrice, formatQuantity } from "./format";

describe("formatMoney", () => {
  it("uses Indian digit grouping for rupees", () => {
    expect(formatMoney("964976.38")).toBe("₹9,64,976.38");
  });

  it("signs changes with a true minus", () => {
    expect(formatMoney("7056.82", "INR", { signed: true })).toBe("+₹7,056.82");
    expect(formatMoney("-12.5", "INR", { signed: true })).toBe("−₹12.50");
    expect(formatMoney("0", "INR", { signed: true })).toBe("₹0.00");
  });

  it("suffixes non-ISO quote assets", () => {
    expect(formatMoney("59.67", "USDT")).toBe("59.67 USDT");
  });

  it("shows a dash rather than zero for missing values", () => {
    expect(formatMoney("")).toBe("—");
    expect(formatMoney("not-a-number")).toBe("—");
  });
});

describe("formatQuantity", () => {
  it("keeps every significant digit and drops trailing zeros", () => {
    expect(formatQuantity("0.04210000")).toBe("0.0421");
    expect(formatQuantity("1234567.00000001")).toBe("12,34,567.00000001");
    expect(formatQuantity("150.0")).toBe("150");
    expect(formatQuantity("0")).toBe("0");
  });

  it("tolerates scientific notation", () => {
    expect(formatQuantity("1E-8")).toBe("0.00000001");
  });
});

describe("formatPrice", () => {
  it("scales precision with magnitude", () => {
    expect(formatPrice("9480000")).toBe("₹94,80,000.00");
    expect(formatPrice("0.6184", "USDT")).toBe("0.6184 USDT");
  });
});

describe("formatPercent", () => {
  it("signs and rounds", () => {
    expect(formatPercent("-0.92", { signed: true })).toBe("−0.92%");
    expect(formatPercent("3.41", { signed: true })).toBe("+3.41%");
    expect(formatPercent("0.001", { signed: true })).toBe("0.00%");
  });
});

describe("formatCompactMoney", () => {
  it("uses lakh and crore", () => {
    expect(formatCompactMoney("412500000")).toBe("₹41.25 Cr");
    expect(formatCompactMoney("8400000", "USDT")).toBe("84.00 L USDT");
    expect(formatCompactMoney("50000")).toBe("₹50,000.00");
  });
});

describe("formatAge", () => {
  const now = Date.parse("2026-09-25T12:00:00Z");
  it("describes how old a value is", () => {
    expect(formatAge("2026-09-25T11:59:58Z", now)).toBe("just now");
    expect(formatAge("2026-09-25T11:58:30Z", now)).toBe("1m ago");
    expect(formatAge("2026-09-25T10:30:00Z", now)).toBe("1h ago");
    expect(formatAge("2026-09-22T12:00:00Z", now)).toBe("3d ago");
  });
});
