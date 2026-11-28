import { NextRequest, NextResponse } from "next/server";
import { BackupManager } from "@/server/updater/backup-manager";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const manager = new BackupManager();
    const saved = manager.saveSettings(body);
    return NextResponse.json({ ok: true, settings: saved });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to save settings." }, { status: 500 });
  }
}
