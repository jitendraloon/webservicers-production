import { getIntegrationConfig } from "./vault";

export type CaptchaProvider =
  | "recaptcha"
  | "google_recaptcha"
  | "turnstile"
  | "cloudflare_turnstile"
  | "hcaptcha";

export interface CaptchaVerificationResult {
  success: boolean;
  provider: string;
  score?: number;
  errorCodes?: string[];
}

interface CaptchaConfig extends Record<string, unknown> {
  secretKey?: string;
  siteKey?: string;
  minScore?: number;
}

const ENDPOINTS: Record<string, string> = {
  recaptcha: "https://www.google.com/recaptcha/api/siteverify",
  google_recaptcha: "https://www.google.com/recaptcha/api/siteverify",
  turnstile: "https://challenges.cloudflare.com/turnstile/v0/siteverify",
  cloudflare_turnstile: "https://challenges.cloudflare.com/turnstile/v0/siteverify",
  hcaptcha: "https://api.hcaptcha.com/siteverify",
};

/**
 * Verify a CAPTCHA challenge token against Google reCAPTCHA, Cloudflare Turnstile,
 * or hCaptcha using credentials stored in the integration vault.
 */
export async function verifyCaptcha(
  provider: CaptchaProvider | string,
  token: string,
  remoteIp?: string
): Promise<CaptchaVerificationResult> {
  const normalized = provider.toLowerCase();
  const endpoint = ENDPOINTS[normalized];
  if (!endpoint) {
    throw new Error(`Unsupported CAPTCHA provider: ${provider}`);
  }

  if (!token) {
    return {
      success: false,
      provider: normalized,
      errorCodes: ["missing-input-response"],
    };
  }

  const integration = await getIntegrationConfig<CaptchaConfig>(
    "captcha",
    normalized
  );

  if (!integration || !integration.enabled) {
    throw new Error(
      `CAPTCHA provider "${provider}" is not configured or enabled.`
    );
  }

  const secretKey = integration.config.secretKey;
  if (!secretKey) {
    throw new Error(`CAPTCHA provider "${provider}" is missing secretKey.`);
  }

  const body = new URLSearchParams();
  body.set("secret", secretKey);
  body.set("response", token);
  if (remoteIp) {
    body.set("remoteip", remoteIp);
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error(
      `CAPTCHA verification request failed (${response.status}).`
    );
  }

  const data = (await response.json()) as {
    success?: boolean;
    score?: number;
    "error-codes"?: string[];
  };

  let success = Boolean(data.success);
  if (
    success &&
    typeof data.score === "number" &&
    typeof integration.config.minScore === "number"
  ) {
    success = data.score >= integration.config.minScore;
  }

  return {
    success,
    provider: normalized,
    score: data.score,
    errorCodes: data["error-codes"],
  };
}
