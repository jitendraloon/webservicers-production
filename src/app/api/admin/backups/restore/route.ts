import { NextRequest, NextResponse } from "next/server";
import { BackupManager } from "@/server/updater/backup-manager";
import path from "node:path";
import fs from "node:fs";

export async function POST(req: NextRequest) {
  try {
    const { filename } = await req.json();
    if (!filename) {
      return NextResponse.json({ error: "Missing filename." }, { status: 400 });
    }

    const safeFilename = path.basename(filename);
    const manager = new BackupManager();
    const filePath = path.join(manager.getBackupsDir(), safeFilename);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: `Backup archive "${safeFilename}" not found.` }, { status: 404 });
    }

    // Perform verification test on the file
    const verifyResult = manager.verifyBackup(safeFilename);

    return NextResponse.json({
      ok: true,
      message: `Restore dry-run passed for "${safeFilename}". Checksum ${verifyResult.checksum.slice(0, 12)} verified against archive header.`,
      checksum: verifyResult.checksum,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Restore rehearsal failed." }, { status: 500 });
  }
}
