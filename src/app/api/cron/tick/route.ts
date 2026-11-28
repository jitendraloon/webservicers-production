import { NextResponse } from "next/server";
import { runCronTick } from "@/server/cron/tick";

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const provided = request.headers.get("x-cron-secret") || new URL(request.url).searchParams.get("secret");
    if (provided !== secret) {
      return NextResponse.json({ error: "Unauthorized cron tick" }, { status: 401 });
    }
  }

  try {
    const result = await runCronTick();
    return NextResponse.json({ ok: true, result, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error("[api/cron/tick] Error:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Cron tick failed" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return POST(request);
}
