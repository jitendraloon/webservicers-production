import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { ReleaseBootstrapManager } from "@/server/updater/bootstrap";
import fs from "node:fs";
import path from "node:path";

export async function GET() {
  const bootstrap = new ReleaseBootstrapManager();
  const active = bootstrap.resolveActiveRelease();

  let dbOk = false;
  let dbLatencyMs = 0;
  let dbError: string | undefined;

  const dbStart = Date.now();
  try {
    if (prisma) {
      await prisma.$queryRaw`SELECT 1`;
      dbOk = true;
      dbLatencyMs = Date.now() - dbStart;
    }
  } catch (err: any) {
    dbError = err.message || "Database connection error";
  }

  // Check persistent storage writable
  let storageWritable = false;
  try {
    const testFile = path.join(process.cwd(), "shared", "storage", `.test_${Date.now()}`);
    fs.mkdirSync(path.dirname(testFile), { recursive: true });
    fs.writeFileSync(testFile, "ok", "utf8");
    fs.unlinkSync(testFile);
    storageWritable = true;
  } catch (_) {}

  const isHealthy = dbOk && storageWritable;

  return NextResponse.json(
    {
      status: isHealthy ? "healthy" : "unhealthy",
      version: active.version,
      releaseSource: active.source,
      database: {
        connected: dbOk,
        latencyMs: dbLatencyMs,
        error: dbError,
      },
      storage: {
        writable: storageWritable,
      },
      nodeVersion: process.version,
      timestamp: new Date().toISOString(),
    },
    { status: isHealthy ? 200 : 503 }
  );
}
