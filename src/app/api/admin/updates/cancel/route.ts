import { NextResponse } from "next/server";
import { UpdateRunner } from "@/server/updater/runner";

export async function POST() {
  try {
    const runner = new UpdateRunner();
    const result = runner.cancelUpdate();

    return NextResponse.json({
      ok: true,
      message: result.message,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || "Failed to cancel update job." },
      { status: 500 }
    );
  }
}
