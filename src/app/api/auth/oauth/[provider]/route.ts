import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import {
  getOAuthCredentials,
  isOAuthProvider,
  resolveAppOrigin,
  type OAuthProvider,
} from "@/server/auth/oauth";

const OAUTH_STATE_COOKIE = "ws_oauth_state";

function buildAuthorizationUrl(
  provider: OAuthProvider,
  clientId: string,
  redirectUri: string,
  state: string,
  tenantId?: string
): string {
  if (provider === "google") {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      state,
      access_type: "offline",
      prompt: "consent",
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  if (provider === "microsoft") {
    const tenant = tenantId || "common";
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid profile email User.Read",
      state,
      response_mode: "query",
    });
    return `https://login.microsoftonline.com/${encodeURIComponent(tenant)}/oauth2/v2.0/authorize?${params.toString()}`;
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "read:user user:email",
    state,
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ provider: string }> }
) {
  const { provider: rawProvider } = await context.params;
  const provider = rawProvider.toLowerCase();

  if (!isOAuthProvider(provider)) {
    return NextResponse.json(
      { error: `Unsupported OAuth provider: ${rawProvider}` },
      { status: 400 }
    );
  }

  try {
    const credentials = await getOAuthCredentials(provider);
    if (!credentials) {
      return NextResponse.json(
        { error: `OAuth provider '${provider}' is not configured.` },
        { status: 503 }
      );
    }

    const state = crypto.randomBytes(32).toString("hex");
    const origin = resolveAppOrigin(request.url);
    const redirectUri = `${origin}/api/auth/oauth/${provider}/callback`;
    const authUrl = buildAuthorizationUrl(
      provider,
      credentials.clientId,
      redirectUri,
      state,
      credentials.tenantId
    );

    const response = NextResponse.redirect(authUrl);
    response.cookies.set(OAUTH_STATE_COOKIE, `${provider}:${state}`, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 10,
    });

    return response;
  } catch (error) {
    console.error(`[auth/oauth/${provider}] Failed to initiate OAuth:`, error);
    return NextResponse.json(
      { error: "Unable to initiate OAuth sign-in." },
      { status: 500 }
    );
  }
}
