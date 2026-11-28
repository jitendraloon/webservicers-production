/**
 * Universal Site URL & Domain Configuration Helper
 * Ensures all generated URLs, webhooks, referral links, and brand assets
 * strictly follow the website's installed domain rather than static hardcoded subdomains.
 */

/**
 * Returns the base website URL without trailing slash.
 * In browser: uses window.location.origin.
 * On server: reads NEXT_PUBLIC_APP_URL, APP_URL, or fallback.
 */
export function getSiteUrl(path = ""): string {
  let base = "";

  if (typeof window !== "undefined" && window.location && window.location.origin) {
    base = window.location.origin;
  } else if (process.env.NEXT_PUBLIC_APP_URL) {
    base = process.env.NEXT_PUBLIC_APP_URL;
  } else if (process.env.APP_URL) {
    base = process.env.APP_URL;
  } else {
    base = "http://localhost:3000";
  }

  // Clean trailing slashes
  base = base.replace(/\/+$/, "");

  if (!path) return base;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

/**
 * Returns the clean hostname (e.g. "example.com" or "localhost")
 */
export function getSiteDomain(): string {
  try {
    const full = getSiteUrl();
    const parsed = new URL(full);
    return parsed.hostname;
  } catch {
    return "localhost";
  }
}

/**
 * Generates an email address matching the current installed domain.
 * e.g. getDynamicEmail("support") -> "support@yourdomain.com"
 */
export function getDynamicEmail(prefix = "support"): string {
  const domain = getSiteDomain();
  if (domain === "localhost" || domain === "127.0.0.1") {
    return `${prefix}@webservicers.com`;
  }
  return `${prefix}@${domain}`;
}

/**
 * Generates a full referral or promotional URL based on current installed domain.
 */
export function getReferralUrl(referralCode: string): string {
  return getSiteUrl(`/?ref=${encodeURIComponent(referralCode)}`);
}
