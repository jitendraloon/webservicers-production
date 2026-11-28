export const SESSION_COOKIE_NAME = "ws_session" as const;

export const CSRF_HEADER = "x-csrf-token" as const;

export const DEFAULT_CURRENCY = "USD" as const;

export const SUPPORTED_CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "INR",
  "AUD",
  "CAD",
] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const SUPPORTED_LANGUAGES = [
  "en",
  "es",
  "fr",
  "de",
  "pt",
  "hi",
  "ar",
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const SERVICE_CATEGORIES = [
  "WEB_DESIGN",
  "SEO",
  "SOCIAL_MEDIA",
  "PAID_ADS",
  "SMM_PANEL",
  "CONTENT_MARKETING",
  "BRANDING",
  "ANALYTICS",
  "DIGITAL_PRODUCTS",
] as const;

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

export const ORDER_STATUSES = [
  "PENDING",
  "AWAITING_BRIEF",
  "IN_PROGRESS",
  "IN_REVIEW",
  "COMPLETED",
  "CANCELLED",
  "REFUNDED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const INVOICE_STATUSES = [
  "UNPAID",
  "PAID",
  "OVERDUE",
  "CANCELLED",
  "REFUNDED",
] as const;

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];
