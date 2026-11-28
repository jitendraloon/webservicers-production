import { NextRequest, NextResponse } from "next/server";
import { BackupManager } from "@/server/updater/backup-manager";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { execSync } from "node:child_process";
import { prisma } from "@/server/db";

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Schedule ID required." }, { status: 400 });
    }

    const manager = new BackupManager();
    const schedules = manager.getSchedules();
    const schedule = schedules.find((s) => s.id === id);

    if (!schedule) {
      return NextResponse.json({ error: "Schedule not found." }, { status: 404 });
    }

    const rootDir = process.cwd();
    const backupsDir = manager.getBackupsDir();
    const contents = schedule.contents || ["Database"];

    const filename = `sch-${schedule.id}-${new Date().toISOString().slice(0, 10)}-${Date.now().toString().slice(-4)}.zip`;
    const archivePath = path.join(backupsDir, filename);
    const stagingDir = path.join(backupsDir, `staging-${Date.now()}`);
    fs.mkdirSync(stagingDir, { recursive: true });

    // Database
    if (contents.includes("Database")) {
      const dbDir = path.join(stagingDir, "database");
      fs.mkdirSync(dbDir, { recursive: true });
      const sqlitePaths = [path.join(rootDir, "dev.db"), path.join(rootDir, "prisma", "dev.db")];
      for (const sp of sqlitePaths) {
        if (fs.existsSync(sp)) {
          fs.copyFileSync(sp, path.join(dbDir, path.basename(sp)));
        }
      }
    }

    // Uploads
    if (contents.includes("Uploads")) {
      const uploadsSrc = path.join(rootDir, "shared", "storage", "uploads");
      const uploadsDest = path.join(stagingDir, "uploads");
      if (fs.existsSync(uploadsSrc)) {
        fs.cpSync(uploadsSrc, uploadsDest, { recursive: true });
      }
    }

    // Files
    if (contents.includes("Files")) {
      const configDest = path.join(stagingDir, "config");
      fs.mkdirSync(configDest, { recursive: true });
      for (const fc of [".env", ".env.local", "package.json"]) {
        const fp = path.join(rootDir, fc);
        if (fs.existsSync(fp)) {
          fs.copyFileSync(fp, path.join(configDest, fc));
        }
      }
    }

    // Manifest
    const manifest = {
      scheduleId: schedule.id,
      scheduleName: schedule.name,
      filename,
      destination: schedule.destination,
      contents,
      createdAt: new Date().toISOString(),
    };
    fs.writeFileSync(path.join(stagingDir, "backup-manifest.json"), JSON.stringify(manifest, null, 2), "utf8");

    // Compress
    if (process.platform === "win32") {
      execSync(
        `powershell -NoProfile -Command "Compress-Archive -Path '${stagingDir}\\*' -DestinationPath '${archivePath}' -Force"`,
        { stdio: "ignore" }
      );
    } else {
      try {
        execSync(`zip -rq "${archivePath}" .`, { cwd: stagingDir, stdio: "ignore" });
      } catch (_) {
        execSync(`tar -czf "${archivePath}" -C "${stagingDir}" .`, { stdio: "ignore" });
      }
    }

    fs.rmSync(stagingDir, { recursive: true, force: true });
    const stat = fs.statSync(archivePath);
    const hash = crypto.createHash("sha256").update(fs.readFileSync(archivePath)).digest("hex");

    if (prisma && prisma.systemBackup) {
      await prisma.systemBackup.create({
        data: {
          label: `Scheduled Snapshot: ${schedule.name}`,
          type: "SCHEDULED",
          version: "1.0.0",
          storageArchive: archivePath,
          manifestJson: JSON.stringify(manifest),
          checksum: hash,
          sizeBytes: BigInt(stat.size),
          storageTarget: schedule.destination === "Local Only" ? "LOCAL_SHARED" : schedule.destination,
          status: "COMPLETED",
        },
      }).catch(() => {});
    }

    manager.updateSchedule(schedule.id, {
      lastRunAt: new Date().toISOString(),
      nextRun: manager.calculateNextRun(schedule.frequency),
    });

    return NextResponse.json({
      ok: true,
      message: `Schedule "${schedule.name}" executed successfully. Backup "${filename}" created (${(stat.size / 1024).toFixed(1)} KB).`,
      filename,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to execute schedule." }, { status: 500 });
  }
}
