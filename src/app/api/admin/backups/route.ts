import { NextRequest, NextResponse } from "next/server";
import { BackupManager } from "@/server/updater/backup-manager";

export async function GET() {
  try {
    const manager = new BackupManager();

    const [compatibility, diskUsage, rootPaths, dbTables, backups, schedules] = await Promise.all([
      manager.getCompatibility(),
      manager.getDiskUsage(),
      manager.getRootPaths(),
      manager.getDatabaseTables(),
      manager.getBackupsList(),
      manager.getSchedules(),
    ]);

    const settings = manager.getSettings();

    return NextResponse.json({
      backups,
      compatibility,
      diskUsage,
      schedules,
      exclusions: rootPaths,
      databaseTables: dbTables,
      settings,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to load backup telemetry." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filename = searchParams.get("filename");
    const id = searchParams.get("id") || undefined;

    if (!filename) {
      return NextResponse.json({ error: "Missing filename parameter." }, { status: 400 });
    }

    const manager = new BackupManager();
    const deleted = manager.deleteBackup(filename, id);

    return NextResponse.json({
      ok: true,
      message: deleted ? `Backup "${filename}" deleted successfully.` : "Backup record removed.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete backup." }, { status: 500 });
  }
}
