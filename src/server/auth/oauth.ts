import { decrypt } from "@/server/crypto";
import { db } from "@/server/db";

export const OAUTH_PROVIDERS = ["google", "microsoft", "github"] as const;
export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

export interface OAuthCredentials {
  clientId: string;
  clientSecret: string;
  tenantId?: string;
}

export function isOAuthProvider(value: string): value is OAuthProvider {
  return (OAUTH_PROVIDERS as readonly string[]).includes(value);
}

/**
 * Resolve OAuth client credentials from the `Integration` table first,
 * falling back to environment variables when not configured in the database.
 */
export async function getOAuthCredentials(
  provider: OAuthProvider
): Promise<OAuthCredentials | null> {
  const integration = await db.integration
    .findUnique({
      where: {
        category_provider: {
          category: "oauth",
          provider,
        },
      },
    })
    .catch(() => null);

  if (integration?.enabled && integration.configEnc) {
    try {
      const parsed = JSON.parse(decrypt(integration.configEnc)) as Partial<OAuthCredentials>;
      if (parsed.clientId && parsed.clientSecret) {
        return {
          clientId: parsed.clientId,
          clientSecret: parsed.clientSecret,
          tenantId: parsed.tenantId,
        };
      }
    } catch {
      // Fall through to environment variables if stored config cannot be parsed
    }
  }

  if (provider === "google") {
    const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
    if (clientId && clientSecret) {
      return { clientId, clientSecret };
    }
  } else if (provider === "microsoft") {
    const clientId = process.env.MICROSOFT_CLIENT_ID?.trim();
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET?.trim();
    const tenantId = process.env.MICROSOFT_TENANT_ID?.trim() || "common";
    if (clientId && clientSecret) {
      return { clientId, clientSecret, tenantId };
    }
  } else if (provider === "github") {
    const clientId = process.env.GITHUB_CLIENT_ID?.trim();
    const clientSecret = process.env.GITHUB_CLIENT_SECRET?.trim();
    if (clientId && clientSecret) {
      return { clientId, clientSecret };
    }
  }

  return null;
}

export function resolveAppOrigin(requestUrl: string): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (envUrl) {
    return envUrl.replace(/\/+$/, "");
  }
  return new URL(requestUrl).origin;
}
