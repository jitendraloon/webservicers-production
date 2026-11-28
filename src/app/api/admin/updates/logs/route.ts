import { NextResponse } from "next/server";
import { UpdateRunner } from "@/server/updater/runner";

export async function GET() {
  const runner = new UpdateRunner();
  const state = runner.getState();

  return NextResponse.json({
    jobId: state.jobId,
    status: state.status,
    progressPercent: state.progressPercent,
    currentStep: state.currentStep,
    logs: state.logs,
    errorMessage: state.errorMessage,
    completedAt: state.completedAt,
  });
}
