import { DEFAULT_CURRENCY } from "./constants";

/**
 * Format an integer amount in minor units (cents) as a localized currency string.
 */
export function formatMoney(
  cents: number | bigint,
  currency: string = DEFAULT_CURRENCY,
  locale = "en-US"
): string {
  const numericAmount = typeof cents === "bigint" ? Number(cents) / 100 : cents / 100;
  const normalizedCurrency = (currency || DEFAULT_CURRENCY).toUpperCase();

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: normalizedCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericAmount);
  } catch {
    return `${normalizedCurrency} ${numericAmount.toFixed(2)}`;
  }
}

/**
 * Format a Date, ISO string, or timestamp into a localized date string.
 */
export function formatDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  },
  locale = "en-US"
): string {
  const parsed = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat(locale, options).format(parsed);
}

/**
 * Format a numeric value with localized grouping and decimal separators.
 */
export function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions,
  locale = "en-US"
): string {
  if (!Number.isFinite(value)) {
    return "0";
  }
  return new Intl.NumberFormat(locale, options).format(value);
}
