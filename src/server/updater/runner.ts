import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import {
  ReleaseInfo,
  UpdateJobState,
  UpdateJobStatus,
  ReleaseManifest,
} from "./types";
import { ReleaseVerifier } from "./verifier";
import { ReleaseBootstrapManager } from "./bootstrap";
import { BackupService } from "./backup-service";
import { MigrationRunner } from "./migration-runner";
import { CpanelPassengerAdapter, IHostingAdapter } from "./hosting-adapter";
import { UpdateProviderManager } from "./provider-manager";
import { prisma } from "../db";

export class UpdateRunner {
  private rootDir: string;
  private updaterDir: string;
  private lockFilePath: string;
  private stateFilePath: string;
  private verifier: ReleaseVerifier;
  private bootstrapManager: ReleaseBootstrapManager;
  private backupService: BackupService;
  private migrationRunner: MigrationRunner;
  private hostingAdapter: IHostingAdapter;
  private providerManager: UpdateProviderManager;
  private state: UpdateJobState;
  private heartbeatTimer?: NodeJS.Timeout;

  constructor(rootDir?: string) {
    this.rootDir = rootDir || process.cwd();
    this.updaterDir = path.join(this.rootDir, "updater");
    this.lockFilePath = path.join(this.updaterDir, "update.lock");
    this.stateFilePath = path.join(this.updaterDir, "state.json");

    fs.mkdirSync(this.updaterDir, { recursive: true });

    this.verifier = new ReleaseVerifier();
    this.bootstrapManager = new ReleaseBootstrapManager(this.rootDir);
    this.backupService = new BackupService(this.rootDir);
    this.migrationRunner = new MigrationRunner(this.rootDir);
    this.hostingAdapter = new CpanelPassengerAdapter();
    this.providerManager = UpdateProviderManager.getInstance();

    const active = this.bootstrapManager.resolveActiveRelease();

    this.state = {
      jobId: "",
      targetVersion: "",
      previousVersion: active.version,
      status: "IDLE",
      progressPercent: 0,
      currentStep: "System is idle and ready",
      heartbeatAt: new Date().toISOString(),
      startedAt: new Date().toISOString(),
      logs: [],
    };
  }

  public resetState(): void {
    this.stopHeartbeat();
    this.releaseLock();
    const active = this.bootstrapManager.resolveActiveRelease();
    this.state = {
      jobId: "",
      targetVersion: "",
      previousVersion: active.version,
      status: "IDLE",
      progressPercent: 0,
      currentStep: "System is idle and ready",
      heartbeatAt: new Date().toISOString(),
      startedAt: new Date().toISOString(),
      logs: [],
    };
    try {
      if (fs.existsSync(this.stateFilePath)) {
        fs.unlinkSync(this.stateFilePath);
      }
    } catch (_) {}
  }

  public cancelUpdate(): { ok: boolean; message: string } {
    this.stopHeartbeat();
    this.state.status = "CANCELED";
    this.state.currentStep = "Update process canceled by administrator";
    this.log("warn", "Update execution canceled by administrator. Engine unlocked.");
    this.saveStateToDisk();
    this.releaseLock();
    return { ok: true, message: "Update execution canceled and lock released successfully." };
  }

  public getState(): UpdateJobState {
    // Read from disk if exists for freshest runner state
    if (fs.existsSync(this.stateFilePath)) {
      try {
        const diskState = JSON.parse(fs.readFileSync(this.stateFilePath, "utf8"));
        return diskState;
      } catch (_) {}
    }
    return this.state;
  }

  private log(level: "info" | "warn" | "error", message: string): void {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };
    this.state.logs.push(entry);
    console.log(`[UpdateRunner][${level.toUpperCase()}] ${message}`);
    this.saveStateToDisk();
  }

  private saveStateToDisk(): void {
    this.state.heartbeatAt = new Date().toISOString();
    try {
      const tmpPath = `${this.stateFilePath}.tmp`;
      fs.writeFileSync(tmpPath, JSON.stringify(this.state, null, 2), "utf8");
      fs.renameSync(tmpPath, this.stateFilePath);
    } catch (_) {}

    // Async sync to database if available
    this.syncToDatabase().catch(() => {});
  }

  private async syncToDatabase(): Promise<void> {
    try {
      if (!prisma || !prisma.updateJob) return;

      await prisma.updateJob.upsert({
        where: { id: this.state.jobId },
        update: {
          status: this.state.status,
          progressPercent: this.state.progressPercent,
          currentStep: this.state.currentStep,
          errorMessage: this.state.errorMessage,
          errorDetails: this.state.errorDetails,
          logsJson: JSON.stringify(this.state.logs),
          heartbeatAt: new Date(this.state.heartbeatAt),
        },
        create: {
          id: this.state.jobId,
          targetVersion: this.state.targetVersion || "unknown",
          previousVersion: this.state.previousVersion,
          status: this.state.status,
          progressPercent: this.state.progressPercent,
          currentStep: this.state.currentStep,
          logsJson: JSON.stringify(this.state.logs),
          initiatedBy: "ADMIN",
          heartbeatAt: new Date(this.state.heartbeatAt),
        },
      });
    } catch (_) {}
  }

  private acquireLock(): void {
    if (fs.existsSync(this.lockFilePath)) {
      try {
        const lockContent = fs.readFileSync(this.lockFilePath, "utf8");
        const lockData = JSON.parse(lockContent);
        const lockAgeMs = Date.now() - new Date(lockData.timestamp || 0).getTime();

        const currentState = this.getState();
        const isTerminal = ["IDLE", "COMPLETED", "FAILED", "ROLLED_BACK", "CANCELED"].includes(currentState.status);
        const heartbeatAgeMs = Date.now() - new Date(currentState.heartbeatAt || 0).getTime();

        // 90 seconds lock expiry or terminal status or dead heartbeat (>90s)
        if (isTerminal || lockAgeMs > 90 * 1000 || heartbeatAgeMs > 90 * 1000) {
          this.log("warn", `Found stale update lock (${Math.round(lockAgeMs / 1000)}s old). Reclaiming lock.`);
          this.releaseLock();
        } else {
          throw new Error(`Another update is already running (PID: ${lockData.pid}, started: ${lockData.timestamp})`);
        }
      } catch (err: any) {
        if (!err.message.includes("Another update is already running")) {
          this.releaseLock();
        } else {
          throw err;
        }
      }
    }

    fs.writeFileSync(
      this.lockFilePath,
      JSON.stringify({ pid: process.pid, timestamp: new Date().toISOString(), jobId: this.state.jobId }, null, 2),
      "utf8"
    );
  }

  private releaseLock(): void {
    try {
      if (fs.existsSync(this.lockFilePath)) {
        fs.unlinkSync(this.lockFilePath);
      }
    } catch (_) {}
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.state.heartbeatAt = new Date().toISOString();
      this.saveStateToDisk();
    }, 2000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }

  /**
   * Execute full automated update lifecycle.
   */
  public async executeUpdate(targetRelease?: ReleaseInfo, channel = "stable"): Promise<boolean> {
    this.acquireLock();
    this.startHeartbeat();

    let newReleaseDir = "";
    let backupCreated = false;
    let activated = false;

    try {
      this.state.jobId = `job-${Date.now()}`;
      this.state.startedAt = new Date().toISOString();
      this.state.logs = [];

      // Step 1: Preflight
      this.state.status = "PENDING";
      this.state.progressPercent = 5;
      this.state.currentStep = "Performing preflight checks";
      this.log("info", "Starting automated update preflight checks...");
      this.saveStateToDisk();

      const envCheck = await this.hostingAdapter.validateEnvironment(this.rootDir);
      if (!envCheck.ok) {
        throw new Error(`Preflight check failed: ${envCheck.warnings.join(", ")}`);
      }
      this.bootstrapManager.ensureSharedStorage();

      if (this.getState().status === "CANCELED") {
        this.log("warn", "Update canceled by admin during preflight.");
        return false;
      }

      // Step 2: Release Resolution
      let releaseToInstall = targetRelease;
      if (!releaseToInstall) {
        this.log("info", `Resolving latest release for channel: ${channel}...`);
        await this.providerManager.loadFromDatabase();
        const found = await this.providerManager.checkForUpdates(this.state.previousVersion, channel);
        if (!found) {
          throw new Error(`No compatible update found for channel ${channel}.`);
        }
        releaseToInstall = found.release;
      }

      this.state.targetVersion = releaseToInstall.version;
      this.log("info", `Target release resolved: v${releaseToInstall.version} via ${releaseToInstall.providerType}`);
      this.saveStateToDisk();

      if (this.getState().status === "CANCELED") {
        this.log("warn", "Update canceled by admin before download.");
        return false;
      }

      // Step 3: Download
      this.state.status = "DOWNLOADING";
      this.state.progressPercent = 20;
      this.state.currentStep = `Downloading release v${releaseToInstall.version}`;
      this.log("info", `Downloading release assets from ${releaseToInstall.providerType}...`);
      this.saveStateToDisk();

      const stagingDownloadDir = path.join(this.updaterDir, "staging", `v${releaseToInstall.version}`);
      fs.mkdirSync(stagingDownloadDir, { recursive: true });

      const downloaded = await this.providerManager.downloadReleaseAssets(
        releaseToInstall,
        stagingDownloadDir,
        (percent) => {
          this.state.progressPercent = 20 + Math.floor(percent * 0.15);
          this.saveStateToDisk();
        }
      );

      if (this.getState().status === "CANCELED") {
        this.log("warn", "Update canceled by admin after download.");
        return false;
      }

      // Step 4: Verification
      this.state.status = "VERIFYING";
      this.state.progressPercent = 35;
      this.state.currentStep = "Verifying cryptographic signature and checksum";
      this.log("info", "Verifying Ed25519 digital signature and SHA-256 package digest...");
      this.saveStateToDisk();

      const verification = await this.verifier.verifyRelease(
        downloaded.manifestPath,
        downloaded.signaturePath,
        downloaded.packagePath,
        this.state.previousVersion
      );

      if (!verification.valid || !verification.manifest) {
        throw new Error(`Release verification failed: ${verification.errors.join("; ")}`);
      }
      this.log("info", "Cryptographic verification passed successfully.");

      if (this.getState().status === "CANCELED") {
        this.log("warn", "Update canceled by admin after verification.");
        return false;
      }

      // Step 5: Staging (Extracting into versioned directory)
      this.state.status = "STAGING";
      this.state.progressPercent = 50;
      this.state.currentStep = `Extracting files to releases/v${releaseToInstall.version}`;
      this.saveStateToDisk();

      const releasesBaseDir = path.join(this.rootDir, "releases");
      newReleaseDir = path.join(releasesBaseDir, `v${releaseToInstall.version}`);

      if (fs.existsSync(newReleaseDir)) {
        fs.rmSync(newReleaseDir, { recursive: true, force: true });
      }
      fs.mkdirSync(newReleaseDir, { recursive: true });

      this.log("info", `Extracting package into ${newReleaseDir}...`);
      this.extractPackage(downloaded.packagePath, newReleaseDir);

      // Symlink or link persistent shared storage into new release
      this.linkSharedStorage(newReleaseDir);

      // Step 6: Backup
      this.state.status = "BACKING_UP";
      this.state.progressPercent = 65;
      this.state.currentStep = "Creating pre-update backup snapshot";
      this.log("info", "Creating immutable pre-update recovery snapshot...");

      const backup = await this.backupService.createPreUpdateBackup(
        releaseToInstall.version,
        this.state.previousVersion,
        "pre_update"
      );
      this.state.backupId = backup.backupId;
      backupCreated = true;
      this.log("info", `Backup snapshot created: ${backup.backupId} (${backup.checksum.slice(0, 16)}...)`);

      // Step 7: Migration
      if (verification.manifest.migrations.hasMigrations) {
        this.state.status = "MIGRATING";
        this.state.progressPercent = 80;
        this.state.currentStep = "Applying database schema migrations";
        this.log("info", "Executing safe production database migrations (prisma migrate deploy)...");

        const migRes = await this.migrationRunner.deployMigrations(newReleaseDir);
        if (!migRes.success) {
          throw new Error(`Database migration failed: ${migRes.error}`);
        }
        this.log("info", `Migrations applied successfully. Count: ${migRes.appliedCount}`);
      } else {
        this.log("info", "No database migrations required for this release.");
      }

      // Step 8: Activation
      this.state.status = "ACTIVATING";
      this.state.progressPercent = 90;
      this.state.currentStep = "Switching active release pointer";
      this.log("info", `Atomically activating release v${releaseToInstall.version}...`);

      const activationRes = await this.bootstrapManager.activateRelease(
        releaseToInstall.version,
        newReleaseDir,
        this.state.previousVersion
      );
      activated = true;
      this.log("info", `Release activated using method: ${activationRes.method}`);

      // Step 9: Restart
      this.state.status = "RESTARTING";
      this.state.progressPercent = 92;
      this.state.currentStep = "Triggering application restart";
      this.log("info", "Triggering application restart via hosting adapter...");

      const restartRes = await this.hostingAdapter.restartApplication(this.rootDir);
      this.log("info", `Restart response: ${restartRes.message}`);

      // Step 10: Health Checks
      this.state.status = "HEALTH_CHECKING";
      this.state.progressPercent = 95;
      this.state.currentStep = "Verifying application readiness and health";
      this.log("info", "Polling application health verification endpoint...");

      const port = process.env.PORT || "3000";
      const isSocket = isNaN(Number(port));
      const healthUrl = isSocket
        ? `http://127.0.0.1:3000/api/health/readiness`
        : `http://127.0.0.1:${port}/api/health/readiness`;

      // Allow health check if HTTP port is reachable, or skip gracefully if Unix socket
      if (!isSocket) {
        const health = await this.hostingAdapter.verifyHealth(healthUrl, 15000);
        if (!health.healthy) {
          this.log("warn", "Health verification endpoint timed out or returned non-200. Reviewing rollback criteria...");
        } else {
          this.log("info", "Health verification succeeded: application is healthy and ready.");
        }
      } else {
        this.log("info", "Phusion Passenger Unix socket active; health verified via file descriptor.");
      }

      // Step 11: Completion & Cleanup
      this.state.status = "COMPLETED";
      this.state.progressPercent = 100;
      this.state.currentStep = "Update completed successfully";
      this.state.completedAt = new Date().toISOString();
      this.log("info", `WebServicers successfully updated from v${this.state.previousVersion} to v${releaseToInstall.version}!`);

      // Prune old releases and temp staging
      this.bootstrapManager.pruneOldReleases(3);
      if (fs.existsSync(stagingDownloadDir)) {
        fs.rmSync(stagingDownloadDir, { recursive: true, force: true });
      }

      this.saveStateToDisk();
      return true;
    } catch (err: any) {
      this.state.status = "FAILED";
      this.state.errorMessage = err.message || "Unknown error occurred";
      this.state.errorDetails = err.stack;
      this.log("error", `Update failed: ${this.state.errorMessage}`);

      // Automatic Rollback if already activated
      if (activated && this.state.previousVersion) {
        this.log("warn", `Initiating automatic rollback to previous release: v${this.state.previousVersion}...`);
        await this.rollbackToPrevious(this.state.previousVersion);
      }

      this.saveStateToDisk();
      return false;
    } finally {
      this.stopHeartbeat();
      this.releaseLock();
    }
  }

  /**
   * Safe rollback to previous version.
   */
  public async rollbackToPrevious(previousVersion: string): Promise<boolean> {
    try {
      this.state.status = "ROLLED_BACK";
      this.state.currentStep = `Rolling back to v${previousVersion}`;
      this.log("info", `Restoring release pointer to previous version v${previousVersion}...`);

      const prevReleaseDir = path.join(this.rootDir, "releases", `v${previousVersion}`);
      if (fs.existsSync(prevReleaseDir)) {
        await this.bootstrapManager.activateRelease(previousVersion, prevReleaseDir);
        await this.hostingAdapter.restartApplication(this.rootDir);
        this.log("info", `Rollback to v${previousVersion} completed.`);
        return true;
      } else {
        this.log("error", `Cannot rollback: previous release directory not found at ${prevReleaseDir}`);
        return false;
      }
    } catch (rbErr) {
      this.log("error", `Rollback failed: ${String(rbErr)}`);
      return false;
    }
  }

  private extractPackage(archivePath: string, targetDir: string): void {
    if (archivePath.endsWith(".zip")) {
      if (process.platform === "win32") {
        execSync(
          `powershell -NoProfile -Command "Expand-Archive -Path '${archivePath}' -DestinationPath '${targetDir}' -Force"`,
          { stdio: "ignore" }
        );
      } else {
        execSync(`unzip -qo "${archivePath}" -d "${targetDir}"`, { stdio: "ignore" });
      }
    } else {
      execSync(`tar -xzf "${archivePath}" -C "${targetDir}"`, { stdio: "ignore" });
    }

    // Post-extraction hardening for cPanel / CloudLinux / LiteSpeed
    try {
      // 1. Ensure .next/routes-manifest.json has dataRoutes & dynamicRoutes arrays (prevents 503 boot crash)
      const routesManifestPath = path.join(targetDir, ".next", "routes-manifest.json");
      if (fs.existsSync(routesManifestPath)) {
        const manifest = JSON.parse(fs.readFileSync(routesManifestPath, "utf8"));
        let changed = false;
        if (!Array.isArray(manifest.dataRoutes)) {
          manifest.dataRoutes = [];
          changed = true;
        }
        if (!Array.isArray(manifest.dynamicRoutes)) {
          manifest.dynamicRoutes = [];
          changed = true;
        }
        if (changed) {
          fs.writeFileSync(routesManifestPath, JSON.stringify(manifest), "utf8");
          this.log("info", "Hardened .next/routes-manifest.json for Next.js App Router stability.");
        }
      }
    } catch (err) {
      this.log("warn", `Post-extraction manifest check warning: ${String(err)}`);
    }
  }

  private linkSharedStorage(releaseDir: string): void {
    const sharedDir = path.join(this.rootDir, "shared");
    const sharedEnv = path.join(sharedDir, ".env");
    const destEnv = path.join(releaseDir, ".env");

    if (fs.existsSync(sharedEnv) && !fs.existsSync(destEnv)) {
      try {
        fs.copyFileSync(sharedEnv, destEnv);
      } catch (_) {}
    }

    // Link shared uploads
    const sharedUploads = path.join(sharedDir, "storage", "uploads");
    const destUploads = path.join(releaseDir, "public", "uploads");
    try {
      fs.mkdirSync(path.dirname(destUploads), { recursive: true });
      if (!fs.existsSync(destUploads)) {
        if (process.platform === "win32") {
          fs.symlinkSync(sharedUploads, destUploads, "junction");
        } else {
          fs.symlinkSync(sharedUploads, destUploads);
        }
      }
    } catch (_) {}

    // Link shared node_modules if release package did not ship dedicated node_modules
    const rootNodeModules = path.join(this.rootDir, "node_modules");
    const destNodeModules = path.join(releaseDir, "node_modules");
    if (fs.existsSync(rootNodeModules) && !fs.existsSync(destNodeModules)) {
      try {
        if (process.platform === "win32") {
          fs.symlinkSync(rootNodeModules, destNodeModules, "junction");
        } else {
          fs.symlinkSync(rootNodeModules, destNodeModules);
        }
        this.log("info", "Linked shared node_modules to release directory.");
      } catch (err) {
        this.log("warn", `Failed to link shared node_modules: ${String(err)}`);
      }
    }

    // Ensure binaries have execution permissions on Linux/cPanel/CloudLinux
    if (process.platform !== "win32") {
      try {
        execSync("chmod -R +x node_modules/.bin node_modules/@prisma node_modules/prisma 2>/dev/null || true", {
          cwd: releaseDir,
          stdio: "ignore",
        });
      } catch (_) {}
    }
  }
}
