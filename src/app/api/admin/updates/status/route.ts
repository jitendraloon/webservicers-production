import { NextResponse } from "next/server";
import { ReleaseBootstrapManager } from "@/server/updater/bootstrap";
import { UpdateRunner } from "@/server/updater/runner";
import { prisma } from "@/server/db";
import fs from "node:fs";
import path from "node:path";

export async function GET() {
  const bootstrap = new ReleaseBootstrapManager();
  const active = bootstrap.resolveActiveRelease();
  const runner = new UpdateRunner();
  let runnerState = runner.getState();

  // Check if update lock is active and auto-reclaim stale locks
  const lockPath = path.join(process.cwd(), "updater", "update.lock");
  let isLocked = false;
  let lockInfo: any = null;

  if (fs.existsSync(lockPath)) {
    try {
      lockInfo = JSON.parse(fs.readFileSync(lockPath, "utf8"));
      const lockAgeMs = Date.now() - new Date(lockInfo.timestamp || 0).getTime();
      const heartbeatAgeMs = Date.now() - new Date(runnerState.heartbeatAt || 0).getTime();
      const isTerminal = ["IDLE", "COMPLETED", "FAILED", "ROLLED_BACK", "CANCELED"].includes(runnerState.status);

      // Auto-reclaim if lock is older than 90s, heartbeat is stale, or status is terminal
      if (isTerminal || lockAgeMs > 90 * 1000 || heartbeatAgeMs > 90 * 1000) {
        try {
          fs.unlinkSync(lockPath);
        } catch (_) {}
        isLocked = false;
        lockInfo = null;

        if (!["IDLE", "COMPLETED", "FAILED", "ROLLED_BACK", "CANCELED"].includes(runnerState.status)) {
          runnerState = {
            ...runnerState,
            status: "FAILED",
            errorMessage: "Update process stalled or timed out. Lock was automatically reclaimed.",
          };
        }
      } else {
        isLocked = true;
      }
    } catch (_) {
      try {
        fs.unlinkSync(lockPath);
      } catch (_) {}
      isLocked = false;
    }
  }

  // Get recent backups (safely serializing BigInt sizeBytes)
  let recentBackups: any[] = [];
  try {
    if (prisma && prisma.systemBackup) {
      const rawBackups = await prisma.systemBackup.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
      });
      recentBackups = rawBackups.map((b) => ({
        ...b,
        sizeBytes: b.sizeBytes ? Number(b.sizeBytes) : 0,
      }));
    }
  } catch (_) {}

  return NextResponse.json({
    currentVersion: active.version,
    releasePath: active.releasePath,
    releaseSource: active.source,
    isLocked,
    lockInfo,
    runnerState,
    recentBackups,
  });
}
