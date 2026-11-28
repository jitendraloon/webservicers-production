import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import {
  getOAuthCredentials,
  isOAuthProvider,
  resolveAppOrigin,
  type OAuthCredentials,
  type OAuthProvider,
} from "@/server/auth/oauth";
import { createSession } from "@/server/auth/session";
import { encrypt } from "@/server/crypto";
import { db } from "@/server/db";

const OAUTH_STATE_COOKIE = "ws_oauth_state";

interface OAuthTokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
}

interface OAuthUserProfile {
  providerAccountId: string;
  email: string;
  name: string;
}

function loginErrorRedirect(origin: string, code: string): NextResponse {
  const url = new URL("/login", origin);
  url.searchParams.set("error", code);
  const response = NextResponse.redirect(url);
  response.cookies.delete(OAUTH_STATE_COOKIE);
  return response;
}

function verifyStateCookie(
  cookieValue: string | undefined,
  provider: OAuthProvider,
  state: string
): boolean {
  if (!cookieValue || !state) {
    return false;
  }
  const expected = `${provider}:${state}`;
  const a = Buffer.from(cookieValue, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

async function exchangeCodeForToken(
  provider: OAuthProvider,
  credentials: OAuthCredentials,
  code: string,
  redirectUri: string
): Promise<OAuthTokenResponse> {
  const body = new URLSearchParams({
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
    code,
    redirect_uri: redirectUri,
  });

  let tokenUrl: string;
  if (provider === "google") {
    tokenUrl = "https://oauth2.googleapis.com/token";
    body.set("grant_type", "authorization_code");
  } else if (provider === "microsoft") {
    const tenant = credentials.tenantId || "common";
    tokenUrl = `https://login.microsoftonline.com/${encodeURIComponent(tenant)}/oauth2/v2.0/token`;
    body.set("grant_type", "authorization_code");
  } else {
    tokenUrl = "https://github.com/login/oauth/access_token";
  }

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: body.toString(),
  });

  if (!res.ok) {
    throw new Error(`Token exchange failed with status ${res.status}`);
  }

  return (await res.json()) as OAuthTokenResponse;
}

async function fetchOAuthProfile(
  provider: OAuthProvider,
  accessToken: string
): Promise<OAuthUserProfile | null> {
  if (provider === "google") {
    const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      id?: string;
      email?: string;
      name?: string;
    };
    if (!data.id || !data.email) return null;
    return {
      providerAccountId: String(data.id),
      email: data.email.trim().toLowerCase(),
      name: data.name?.trim() || data.email.split("@")[0],
    };
  }

  if (provider === "microsoft") {
    const res = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      id?: string;
      mail?: string;
      userPrincipalName?: string;
      displayName?: string;
    };
    const rawEmail = data.mail || data.userPrincipalName;
    if (!data.id || !rawEmail) return null;
    return {
      providerAccountId: String(data.id),
      email: rawEmail.trim().toLowerCase(),
      name: data.displayName?.trim() || rawEmail.split("@")[0],
    };
  }

  // GitHub
  const userRes = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
    },
  });
  if (!userRes.ok) return null;
  const userData = (await userRes.json()) as {
    id?: number | string;
    name?: string | null;
    login?: string;
    email?: string | null;
  };

  let email = userData.email?.trim().toLowerCase() ?? null;
  if (!email) {
    const emailsRes = await fetch("https://api.github.com/user/emails", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
      },
    });
    if (emailsRes.ok) {
      const emails = (await emailsRes.json()) as Array<{
        email: string;
        primary: boolean;
        verified: boolean;
      }>;
      const primary =
        emails.find((e) => e.primary && e.verified) ??
        emails.find((e) => e.verified) ??
        emails[0];
      email = primary?.email?.trim().toLowerCase() ?? null;
    }
  }

  if (!userData.id || !email) return null;
  return {
    providerAccountId: String(userData.id),
    email,
    name:
      userData.name?.trim() ||
      userData.login?.trim() ||
      email.split("@")[0],
  };
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ provider: string }> }
) {
  const origin = resolveAppOrigin(request.url);
  const { provider: rawProvider } = await context.params;
  const provider = rawProvider.toLowerCase();

  if (!isOAuthProvider(provider)) {
    return loginErrorRedirect(origin, "oauth_unsupported_provider");
  }

  const oauthError = request.nextUrl.searchParams.get("error");
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state") ?? "";
  const stateCookie = request.cookies.get(OAUTH_STATE_COOKIE)?.value;

  if (oauthError || !code || !verifyStateCookie(stateCookie, provider, state)) {
    return loginErrorRedirect(origin, "oauth_state_invalid");
  }

  try {
    const credentials = await getOAuthCredentials(provider);
    if (!credentials) {
      return loginErrorRedirect(origin, "oauth_not_configured");
    }

    const redirectUri = `${origin}/api/auth/oauth/${provider}/callback`;
    const tokenData = await exchangeCodeForToken(
      provider,
      credentials,
      code,
      redirectUri
    );

    if (!tokenData.access_token) {
      return loginErrorRedirect(origin, "oauth_token_missing");
    }

    const profile = await fetchOAuthProfile(provider, tokenData.access_token);
    if (!profile) {
      return loginErrorRedirect(origin, "oauth_profile_failed");
    }

    const accessTokenEnc = encrypt(tokenData.access_token);
    const refreshTokenEnc = tokenData.refresh_token
      ? encrypt(tokenData.refresh_token)
      : undefined;
    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000)
      : null;

    const existingOAuth = await db.oAuthAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider,
          providerAccountId: profile.providerAccountId,
        },
      },
      include: { user: true },
    });

    let user = existingOAuth?.user ?? null;

    if (existingOAuth) {
      await db.oAuthAccount.update({
        where: { id: existingOAuth.id },
        data: {
          accessTokenEnc,
          ...(refreshTokenEnc ? { refreshTokenEnc } : {}),
          expiresAt,
        },
      });
    } else {
      user = await db.user.findUnique({
        where: { email: profile.email },
      });

      if (!user) {
        user = await db.user.create({
          data: {
            name: profile.name,
            email: profile.email,
            role: "USER",
            status: "ACTIVE",
            emailVerifiedAt: new Date(),
          },
        });
      }

      await db.oAuthAccount.create({
        data: {
          userId: user.id,
          provider,
          providerAccountId: profile.providerAccountId,
          accessTokenEnc,
          refreshTokenEnc: refreshTokenEnc ?? null,
          expiresAt,
        },
      });
    }

    if (!user || user.status !== "ACTIVE") {
      return loginErrorRedirect(origin, "account_suspended");
    }

    await db.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        ...(user.emailVerifiedAt ? {} : { emailVerifiedAt: new Date() }),
      },
    });

    await createSession(user.id);

    await db.auditLog
      .create({
        data: {
          actorType: user.role === "ADMIN" ? "ADMIN" : "USER",
          actorId: user.id,
          action: "AUTH_OAUTH_LOGIN",
          targetType: "User",
          targetId: user.id,
          metadata: { provider },
          ip:
            request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
            null,
          userAgent: request.headers.get("user-agent") ?? null,
        },
      })
      .catch(() => undefined);

    const destination = user.role === "ADMIN" ? "/admin" : "/dashboard";
    const response = NextResponse.redirect(new URL(destination, origin));
    response.cookies.delete(OAUTH_STATE_COOKIE);
    return response;
  } catch (error) {
    console.error(`[auth/oauth/${provider}/callback] Error:`, error);
    return loginErrorRedirect(origin, "oauth_callback_failed");
  }
}
