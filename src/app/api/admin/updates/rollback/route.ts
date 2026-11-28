import { NextRequest, NextResponse } from "next/server";
import { UpdateRunner } from "@/server/updater/runner";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const targetVersion = body.version;

    if (!targetVersion) {
      return NextResponse.json(
        { ok: false, error: "Target version parameter is required for rollback." },
        { status: 400 }
      );
    }

    const runner = new UpdateRunner();
    const success = await runner.rollbackToPrevious(targetVersion);

    if (success) {
      return NextResponse.json({
        ok: true,
        message: `System successfully rolled back to version v${targetVersion}.`,
      });
    } else {
      return NextResponse.json(
        { ok: false, error: `Rollback to v${targetVersion} failed.` },
        { status: 500 }
      );
    }
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || "Failed to trigger rollback." },
      { status: 500 }
    );
  }
}
