/**
 * Display formatting for financial values.
 *
 * The API sends decimals as strings. Quantities are formatted from the string
 * itself so no precision is lost; prices and values are converted to numbers
 * only for rounding to display precision.
 */

export type DecimalString = string;

const MINUS = "−";
const groupFormatter = new Intl.NumberFormat("en-IN");
const numberFormatters = new Map<string, Intl.NumberFormat>();

function numberFormat(minimumFractionDigits: number, maximumFractionDigits: number) {
  const key = `${minimumFractionDigits}:${maximumFractionDigits}`;
  let formatter = numberFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-IN", { minimumFractionDigits, maximumFractionDigits });
    numberFormatters.set(key, formatter);
  }
  return formatter;
}

export function toNumber(value: DecimalString | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function withSign(text: string, negative: boolean, signed: boolean, zero: boolean) {
  if (negative && !zero) return `${MINUS}${text}`;
  if (signed && !zero) return `+${text}`;
  return text;
}

/** Exact quantity with Indian digit grouping and trailing zeros removed. */
export function formatQuantity(value: DecimalString): string {
  if (!/^[-+]?\d*(\.\d*)?$/.test(value)) {
    const amount = toNumber(value);
    return amount === null ? "—" : numberFormat(0, 8).format(amount);
  }
  const negative = value.startsWith("-");
  const [whole = "0", fraction = ""] = value.replace(/^[-+]/, "").split(".");
  const trimmed = fraction.replace(/0+$/, "");
  const grouped = groupFormatter.format(BigInt(whole || "0"));
  const text = trimmed ? `${grouped}.${trimmed}` : grouped;
  return withSign(text, negative, false, /^0*(\.0*)?$/.test(value.replace(/^[-+]/, "")));
}

/** Money in the quote currency, e.g. ₹9,64,976.38 or 120.50 USDT. */
export function formatMoney(
  value: DecimalString | number,
  currency = "INR",
  options: { signed?: boolean } = {},
): string {
  const amount = typeof value === "number" ? value : toNumber(value);
  if (amount === null) return "—";
  const text = numberFormat(2, 2).format(Math.abs(amount));
  const zero = Math.abs(amount) < 0.005;
  const body = currency === "INR" ? `₹${text}` : `${text} ${currency}`;
  return withSign(body, amount < 0, options.signed ?? false, zero);
}

/** Price with precision suited to its magnitude. */
export function formatPrice(value: DecimalString, quote = "INR"): string {
  const amount = toNumber(value);
  if (amount === null) return "—";
  const magnitude = Math.abs(amount);
  const digits = magnitude >= 1000 ? 2 : magnitude >= 1 ? 2 : magnitude >= 0.01 ? 4 : 8;
  const text = numberFormat(digits, digits).format(amount);
  return quote === "INR" ? `₹${text}` : `${text} ${quote}`;
}

export function formatPercent(
  value: DecimalString | number | null | undefined,
  options: { signed?: boolean; digits?: number } = {},
): string {
  const amount = typeof value === "number" ? value : toNumber(value);
  if (amount === null) return "—";
  const digits = options.digits ?? 2;
  const text = numberFormat(digits, digits).format(Math.abs(amount));
  const zero = Number(Math.abs(amount).toFixed(digits)) === 0;
  return withSign(`${text}%`, amount < 0, options.signed ?? false, zero);
}

/** Compact value for dense contexts, in lakh and crore: ₹41.25 Cr, 84.00 L USDT. */
export function formatCompactMoney(value: DecimalString | number, currency = "INR"): string {
  const amount = typeof value === "number" ? value : toNumber(value);
  if (amount === null) return "—";
  const magnitude = Math.abs(amount);
  const scaled =
    magnitude >= 1e7
      ? `${numberFormat(2, 2).format(magnitude / 1e7)} Cr`
      : magnitude >= 1e5
        ? `${numberFormat(2, 2).format(magnitude / 1e5)} L`
        : null;
  if (scaled === null) return formatMoney(amount, currency);
  const body = currency === "INR" ? `₹${scaled}` : `${scaled} ${currency}`;
  return withSign(body, amount < 0, false, false);
}

export function trendOf(value: DecimalString | number | null | undefined): "up" | "down" | "flat" {
  const amount = typeof value === "number" ? value : toNumber(value);
  if (amount === null || amount === 0) return "flat";
  return amount > 0 ? "up" : "down";
}

export function formatAge(iso: string, now: number = Date.now()): string {
  const seconds = Math.max(0, Math.round((now - Date.parse(iso)) / 1000));
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const dateTimeFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const fullDateTimeFormatter = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "medium",
});

export function formatDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso));
}

export function formatFullDateTime(iso: string): string {
  return fullDateTimeFormatter.format(new Date(iso));
}
