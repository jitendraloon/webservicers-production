import { NextResponse } from "next/server";
import { registerSchema } from "@/lib/validators";
import { hashPassword } from "@/server/auth/password";
import { createSession } from "@/server/auth/session";
import { db } from "@/server/db";

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

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Invalid registration data.",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const { name, email, password } = parsed.data;

  try {
    const existing = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await db.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "USER",
        status: "ACTIVE",
        lastLoginAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    await createSession(user.id);

    await db.auditLog
      .create({
        data: {
          actorType: "USER",
          actorId: user.id,
          action: "AUTH_REGISTER",
          targetType: "User",
          targetId: user.id,
          ip:
            request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
            null,
          userAgent: request.headers.get("user-agent") ?? null,
        },
      })
      .catch(() => undefined);

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("[auth/register] Database or session error:", error);
    return NextResponse.json(
      { error: "Unable to create account at this time." },
      { status: 500 }
    );
  }
}
