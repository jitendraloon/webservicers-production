import { NextResponse } from "next/server";
import { z } from "zod";
import QRCode from "qrcode";
import { getSessionFromCookies } from "@/server/auth/session";
import {
  generateTotpSecret,
  getTotpUri,
  verifyTotpToken,
} from "@/server/auth/totp";
import { decrypt, encrypt } from "@/server/crypto";
import { db } from "@/server/db";

const twoFactorActionSchema = z.object({
  action: z.enum(["enable", "disable"]),
  token: z.string().trim().min(6, "Verification code is required"),
  secret: z.string().trim().optional(),
});

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

export async function GET() {
  try {
    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: session.session.userId },
      select: {
        id: true,
        email: true,
        twoFactorEnabled: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const secret = generateTotpSecret();
    const uri = getTotpUri(user.email, secret);
    const qrDataUrl = await QRCode.toDataURL(uri, {
      errorCorrectionLevel: "M",
      width: 256,
      margin: 1,
      color: {
        dark: "#14232b",
        light: "#ffffff",
      },
    });

    return NextResponse.json(
      {
        secret,
        uri,
        qrDataUrl,
        twoFactorEnabled: user.twoFactorEnabled,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[auth/2fa] GET error:", error);
    return NextResponse.json(
      { error: "Unable to generate 2FA setup details." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body." },
      { status: 400 }
    );
  }

  const parsed = twoFactorActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Invalid 2FA request.",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const { action, token, secret } = parsed.data;

  try {
    const user = await db.user.findUnique({
      where: { id: session.session.userId },
      select: {
        id: true,
        role: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    if (action === "enable") {
      if (!secret) {
        return NextResponse.json(
          { error: "TOTP secret is required to enable 2FA." },
          { status: 400 }
        );
      }

      if (!verifyTotpToken(secret, token)) {
        return NextResponse.json(
          { error: "Invalid verification code." },
          { status: 400 }
        );
      }

      await db.user.update({
        where: { id: user.id },
        data: {
          twoFactorSecret: encrypt(secret),
          twoFactorEnabled: true,
        },
      });

      await db.auditLog
        .create({
          data: {
            actorType: user.role === "ADMIN" ? "ADMIN" : "USER",
            actorId: user.id,
            action: "AUTH_2FA_ENABLED",
            targetType: "User",
            targetId: user.id,
          },
        })
        .catch(() => undefined);

      return NextResponse.json(
        { ok: true, twoFactorEnabled: true },
        { status: 200 }
      );
    }

    // action === "disable"
    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return NextResponse.json(
        { error: "Two-factor authentication is not currently enabled." },
        { status: 400 }
      );
    }

    const storedSecret = resolveTotpSecret(user.twoFactorSecret);
    if (!verifyTotpToken(storedSecret, token)) {
      return NextResponse.json(
        { error: "Invalid verification code." },
        { status: 400 }
      );
    }

    await db.user.update({
      where: { id: user.id },
      data: {
        twoFactorSecret: null,
        twoFactorEnabled: false,
      },
    });

    await db.auditLog
      .create({
        data: {
          actorType: user.role === "ADMIN" ? "ADMIN" : "USER",
          actorId: user.id,
          action: "AUTH_2FA_DISABLED",
          targetType: "User",
          targetId: user.id,
        },
      })
      .catch(() => undefined);

    return NextResponse.json(
      { ok: true, twoFactorEnabled: false },
      { status: 200 }
    );
  } catch (error) {
    console.error("[auth/2fa] POST error:", error);
    return NextResponse.json(
      { error: "Unable to update two-factor authentication settings." },
      { status: 500 }
    );
  }
}
