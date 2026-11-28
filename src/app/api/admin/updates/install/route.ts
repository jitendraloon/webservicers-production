import { NextRequest, NextResponse } from "next/server";
import { UpdateRunner } from "@/server/updater/runner";
import fs from "node:fs";
import path from "node:path";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const channel = body.channel || "stable";

    const lockPath = path.join(process.cwd(), "updater", "update.lock");
    const runner = new UpdateRunner();
    const currentState = runner.getState();

    if (fs.existsSync(lockPath)) {
      try {
        const lockContent = fs.readFileSync(lockPath, "utf8");
        const lockData = JSON.parse(lockContent);
        const lockAgeMs = Date.now() - new Date(lockData.timestamp || 0).getTime();
        const heartbeatAgeMs = Date.now() - new Date(currentState.heartbeatAt || 0).getTime();
        const isTerminal = ["IDLE", "COMPLETED", "FAILED", "ROLLED_BACK", "CANCELED"].includes(currentState.status);

        if (isTerminal || lockAgeMs > 90 * 1000 || heartbeatAgeMs > 90 * 1000) {
          try {
            fs.unlinkSync(lockPath);
          } catch (_) {}
        } else {
          return NextResponse.json(
            {
              ok: false,
              error: "An update or maintenance job is currently in progress. Please wait or cancel the active job.",
              jobId: currentState.jobId,
              status: currentState.status,
            },
            { status: 409 }
          );
        }
      } catch (_) {
        try {
          fs.unlinkSync(lockPath);
        } catch (_) {}
      }
    }

    // Trigger update execution asynchronously in background
    setImmediate(() => {
      runner.executeUpdate(undefined, channel).catch((err) => {
        console.error("[AdminInstallRoute] Background update execution error:", err);
      });
    });

    const state = runner.getState();

    return NextResponse.json({
      ok: true,
      message: "Update job initiated successfully.",
      jobId: state.jobId,
      channel,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || "Failed to initiate update job." },
      { status: 500 }
    );
  }
}
