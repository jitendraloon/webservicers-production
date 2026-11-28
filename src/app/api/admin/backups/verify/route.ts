import { NextRequest, NextResponse } from "next/server";
import { BackupManager } from "@/server/updater/backup-manager";

export async function POST(req: NextRequest) {
  try {
    const { filename } = await req.json();
    if (!filename) {
      return NextResponse.json({ error: "Missing filename." }, { status: 400 });
    }

    const manager = new BackupManager();
    const result = manager.verifyBackup(filename);

    return NextResponse.json({
      ok: true,
      message: `Integrity verified for ${filename}. SHA-256 Checksum: ${result.checksum.slice(0, 16)}...`,
      checksum: result.checksum,
      sizeBytes: result.sizeBytes,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Verification failed." }, { status: 500 });
  }
}
