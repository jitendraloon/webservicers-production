import { NextResponse } from "next/server";
import { UpdateRunner } from "@/server/updater/runner";

export async function POST() {
  try {
    const runner = new UpdateRunner();
    runner.resetState();

    return NextResponse.json({
      ok: true,
      message: "Update runner state reset to IDLE and deployment lock released.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || "Failed to reset update state." },
      { status: 500 }
    );
  }
}
