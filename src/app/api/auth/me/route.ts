import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/server/auth/session";
import { db } from "@/server/db";

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
        name: true,
        email: true,
        role: true,
        roleGroupId: true,
        departmentId: true,
        trustScore: true,
        kycStatus: true,
        twoFactorEnabled: true,
        status: true,
        emailVerifiedAt: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user || user.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("[auth/me] Error loading user profile:", error);
    return NextResponse.json(
      { error: "Unable to load user profile." },
      { status: 500 }
    );
  }
}
