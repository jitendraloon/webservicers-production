import { NextRequest, NextResponse } from "next/server";
import { BackupManager } from "@/server/updater/backup-manager";
import path from "node:path";
import fs from "node:fs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const file = searchParams.get("file");

    if (!file) {
      return NextResponse.json({ error: "Missing file parameter." }, { status: 400 });
    }

    const safeFilename = path.basename(file);
    const manager = new BackupManager();
    const filePath = path.join(manager.getBackupsDir(), safeFilename);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: `File "${safeFilename}" not found.` }, { status: 404 });
    }

    const stat = fs.statSync(filePath);
    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${safeFilename}"`,
        "Content-Length": stat.size.toString(),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Download failed." }, { status: 500 });
  }
}
