import { NextResponse } from "next/server";
import { loginSchema } from "@/lib/validators";
import { verifyPassword } from "@/server/auth/password";
import { createSession } from "@/server/auth/session";
import { verifyTotpToken } from "@/server/auth/totp";
import { decrypt } from "@/server/crypto";
import { db } from "@/server/db";
import { ensureEnvLoaded } from "@/server/env";

ensureEnvLoaded();

function resolveTotpSecret(storedSecret: string): string {
  if (storedSecret.includes(":")) {
    try {
      return decrypt(storedSecret);
    } catch {
      return storedSecret;
    }
  }
  return storedSecret;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body." },
      { status: 400 }
    );
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Invalid login credentials.",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const { email, password, totpCode, rememberMe } = parsed.data;

  try {
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        passwordHash: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
      },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const passwordValid = await verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Account is suspended or inactive." },
        { status: 403 }
      );
    }

    if (user.twoFactorEnabled) {
      if (!totpCode) {
        return NextResponse.json(
          {
            error: "Two-factor authentication code is required.",
            requiresTwoFactor: true,
          },
          { status: 401 }
        );
      }

      if (!user.twoFactorSecret) {
        return NextResponse.json(
          { error: "Two-factor authentication is misconfigured." },
          { status: 500 }
        );
      }

      const secret = resolveTotpSecret(user.twoFactorSecret);
      if (!verifyTotpToken(secret, totpCode)) {
        return NextResponse.json(
          {
            error: "Invalid two-factor authentication code.",
            requiresTwoFactor: true,
          },
          { status: 401 }
        );
      }
    }

    const ttlSeconds = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7;
    await createSession(user.id, { ttlSeconds });

    await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await db.auditLog
      .create({
        data: {
          actorType: user.role === "ADMIN" ? "ADMIN" : "USER",
          actorId: user.id,
          action: "AUTH_LOGIN",
          targetType: "User",
          targetId: user.id,
          ip:
            request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
            null,
          userAgent: request.headers.get("user-agent") ?? null,
        },
      })
      .catch(() => undefined);

    return NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[auth/login] Database or session error:", error);
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: "Unable to process login at this time.",
        detail: detail,
      },
      { status: 500 }
    );
  }
}
