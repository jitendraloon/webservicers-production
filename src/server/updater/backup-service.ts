import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execSync } from "node:child_process";
import { prisma } from "../db";
import { dumpDatabaseToSql } from "../database/db-dumper";

export interface BackupResult {
  backupId: string;
  archivePath: string;
  checksum: string;
  sizeBytes: number;
  timestamp: string;
  version: string;
}

export class BackupService {
  private rootDir: string;
  private backupsDir: string;

  constructor(rootDir?: string) {
    this.rootDir = rootDir || process.cwd();
    this.backupsDir = path.join(this.rootDir, "shared", "storage", "backups");
    fs.mkdirSync(this.backupsDir, { recursive: true });
  }

  /**
   * Create an immutable pre-update recovery point containing configuration,
   * database snapshot, and release pointer.
   */
  public async createPreUpdateBackup(
    targetVersion: string,
    previousVersion: string,
    label = "pre_update"
  ): Promise<BackupResult> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupId = `backup-${label}-v${previousVersion}-to-v${targetVersion}-${timestamp}`;
    const stagingDir = path.join(this.backupsDir, `${backupId}-staging`);

    fs.mkdirSync(stagingDir, { recursive: true });

    try {
      // 1. Snapshot Environment and Pointer Configurations
      const configSnapshotDir = path.join(stagingDir, "config");
      fs.mkdirSync(configSnapshotDir, { recursive: true });

      const envFiles = [".env", ".env.local", "shared/.env", "active-release.json"];
      for (const f of envFiles) {
        const fullPath = path.join(this.rootDir, f);
        if (fs.existsSync(fullPath)) {
          fs.copyFileSync(fullPath, path.join(configSnapshotDir, path.basename(f)));
        }
      }

      // 2. Snapshot Database via robust dump engine
      const dbSnapshotDir = path.join(stagingDir, "database");
      fs.mkdirSync(dbSnapshotDir, { recursive: true });
      const dumpSql = path.join(dbSnapshotDir, "database-dump.sql");
      const dumpResult = await dumpDatabaseToSql(dumpSql);
      console.log(`[BackupService] Database dump completed: ${dumpResult.sizeBytes} bytes, ${dumpResult.tableCount} tables`);

      // 3. Create Backup Manifest
      const manifest = {
        backupId,
        label,
        previousVersion,
        targetVersion,
        createdAt: new Date().toISOString(),
        nodeVersion: process.version,
        platform: process.platform,
      };
      fs.writeFileSync(path.join(stagingDir, "backup-manifest.json"), JSON.stringify(manifest, null, 2), "utf8");

      // 4. Compress Backup Archive
      const archivePath = path.join(this.backupsDir, `${backupId}.zip`);

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

      // Compute Checksum & Size
      const stat = fs.statSync(archivePath);
      const hash = crypto.createHash("sha256");
      hash.update(fs.readFileSync(archivePath));
      const checksum = hash.digest("hex");

      // 5. Record to Database if Available
      try {
        if (prisma && prisma.systemBackup) {
          await prisma.systemBackup.create({
            data: {
              label,
              type: "AUTO_PRE_UPDATE",
              version: previousVersion,
              storageArchive: archivePath,
              manifestJson: JSON.stringify(manifest),
              checksum,
              sizeBytes: BigInt(stat.size),
              storageTarget: "LOCAL_SHARED",
              status: "COMPLETED",
            },
          });
        }
      } catch (dbErr) {
        console.warn("[BackupService] Failed to record backup entry in database:", dbErr);
      }

      // Clean staging directory
      fs.rmSync(stagingDir, { recursive: true, force: true });

      // Rotate old backups keeping the 5 most recent
      this.pruneOldBackups(5);

      return {
        backupId,
        archivePath,
        checksum,
        sizeBytes: stat.size,
        timestamp,
        version: previousVersion,
      };
    } catch (err) {
      if (fs.existsSync(stagingDir)) {
        fs.rmSync(stagingDir, { recursive: true, force: true });
      }
      throw new Error(`Pre-update backup failed: ${String(err)}`);
    }
  }

  /**
   * Retention rotation: keeps only the last N backups.
   */
  public pruneOldBackups(maxKeep = 5): void {
    try {
      const files = fs.readdirSync(this.backupsDir)
        .filter((f) => f.endsWith(".zip") || f.endsWith(".tar.gz"))
        .map((f) => ({
          name: f,
          path: path.join(this.backupsDir, f),
          mtime: fs.statSync(path.join(this.backupsDir, f)).mtimeMs,
        }))
        .sort((a, b) => b.mtime - a.mtime);

      if (files.length > maxKeep) {
        const toDelete = files.slice(maxKeep);
        for (const file of toDelete) {
          try {
            fs.unlinkSync(file.path);
          } catch (_) {}
        }
      }
    } catch (err) {
      console.warn("[BackupService] Failed to prune old backups:", err);
    }
  }
}
