import { NextResponse } from "next/server";
import { destroySession } from "@/server/auth/session";

export async function POST() {
  try {
    await destroySession();
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("[auth/logout] Error destroying session:", error);
    return NextResponse.json(
      { error: "Unable to complete logout." },
      { status: 500 }
    );
  }
}
