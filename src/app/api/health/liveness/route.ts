import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    app: "webservicers",
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    pid: process.pid,
  });
}
