import { NextRequest, NextResponse } from "next/server";
import { BackupManager } from "@/server/updater/backup-manager";
import { prisma } from "@/server/db";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execSync } from "node:child_process";
import { dumpDatabaseToSql } from "@/server/database/db-dumper";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const destination = body.destination || "Local Only";
    const contents: string[] = body.contents || ["Database"];

    const rootDir = process.cwd();
    const manager = new BackupManager();
    const backupsDir = manager.getBackupsDir();
    fs.mkdirSync(backupsDir, { recursive: true });

    const filename = `wsn-${new Date().toISOString().slice(0, 10)}-${Date.now().toString().slice(-4)}.zip`;
    const archivePath = path.join(backupsDir, filename);

    const stagingDir = path.join(backupsDir, `staging-${Date.now()}`);
    fs.mkdirSync(stagingDir, { recursive: true });

    // 1. If Database selected, snapshot database using the robust SQL dump engine
    if (contents.includes("Database")) {
      const dbDir = path.join(stagingDir, "database");
      fs.mkdirSync(dbDir, { recursive: true });
      const dumpSql = path.join(dbDir, "database-dump.sql");
      await dumpDatabaseToSql(dumpSql);
    }

    // 2. If Uploads selected, copy uploads
    if (contents.includes("Uploads")) {
      const uploadsSrc = path.join(rootDir, "shared", "storage", "uploads");
      const uploadsDest = path.join(stagingDir, "uploads");
      if (fs.existsSync(uploadsSrc)) {
        fs.cpSync(uploadsSrc, uploadsDest, { recursive: true });
      }
    }

    // 3. If Files selected, copy configuration, public assets, templates, and storage
    if (contents.includes("Files")) {
      const configDest = path.join(stagingDir, "config");
      fs.mkdirSync(configDest, { recursive: true });
      const filesToCopy = [".env", ".env.local", "package.json", "tsconfig.json", "server.js", "app.js", "next.config.mjs"];
      for (const fc of filesToCopy) {
        const fp = path.join(rootDir, fc);
        if (fs.existsSync(fp)) {
          fs.copyFileSync(fp, path.join(configDest, fc));
        }
      }

      // Copy public assets if exists
      const publicSrc = path.join(rootDir, "public");
      const publicDest = path.join(stagingDir, "public");
      if (fs.existsSync(publicSrc)) {
        fs.cpSync(publicSrc, publicDest, { recursive: true });
      }

      // Copy user storage directory
      const storageSrc = path.join(rootDir, "storage");
      const storageDest = path.join(stagingDir, "storage");
      if (fs.existsSync(storageSrc)) {
        fs.cpSync(storageSrc, storageDest, { recursive: true });
      }
    }

    // Manifest
    const manifest = {
      filename,
      destination,
      contents,
      createdAt: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform,
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

    // Clean staging
    fs.rmSync(stagingDir, { recursive: true, force: true });

    const stat = fs.statSync(archivePath);
    const hash = crypto.createHash("sha256").update(fs.readFileSync(archivePath)).digest("hex");

    // Save to DB if available
    try {
      if (prisma && prisma.systemBackup) {
        await prisma.systemBackup.create({
          data: {
            label: `On-Demand Snapshot (${contents.join(", ")})`,
            type: "MANUAL",
            version: "1.0.0",
            storageArchive: archivePath,
            manifestJson: JSON.stringify(manifest),
            checksum: hash,
            sizeBytes: BigInt(stat.size),
            storageTarget: destination === "Local Only" ? "LOCAL_SHARED" : destination,
            status: "COMPLETED",
          },
        });
      }
    } catch (_) {}

    return NextResponse.json({
      ok: true,
      message: `Backup ${filename} created successfully (${manager.formatBytes(stat.size)}).`,
      backup: {
        id: `file-${filename}`,
        filename,
        sizeBytes: stat.size,
        sizeFormatted: manager.formatBytes(stat.size),
        destination,
        contents,
        createdAt: new Date().toISOString(),
        status: "COMPLETED",
        checksum: hash,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || "Failed to create backup snapshot." },
      { status: 500 }
    );
  }
}
