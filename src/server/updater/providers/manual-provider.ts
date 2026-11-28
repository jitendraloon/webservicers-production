import fs from "node:fs";
import path from "node:path";
import { IUpdateProvider, ReleaseInfo, ReleaseManifest } from "../types";

export interface ManualPackageStaging {
  packagePath: string;
  manifestPath: string;
  signaturePath: string;
  manifest: ReleaseManifest;
}

export class ManualSignedPackageProvider implements IUpdateProvider {
  public readonly type = "MANUAL" as const;
  public readonly name = "Manual Signed Package";
  public priority: number;

  private stagedPackage: ManualPackageStaging | null = null;

  constructor(priority = 99) {
    this.priority = priority;
  }

  public setStagedPackage(staging: ManualPackageStaging): void {
    this.stagedPackage = staging;
  }

  public clearStagedPackage(): void {
    this.stagedPackage = null;
  }

  public async testConnection(): Promise<{ ok: boolean; message: string; latencyMs?: number }> {
    return {
      ok: true,
      message: "Manual package provider is ready to receive verified signed archives.",
      latencyMs: 1,
    };
  }

  public async checkForUpdates(currentVersion: string, channel: string): Promise<ReleaseInfo | null> {
    if (!this.stagedPackage) {
      return null;
    }
    const manifest = this.stagedPackage.manifest;
    return {
      id: `manual-${manifest.version}`,
      version: manifest.version,
      channel: manifest.channel,
      manifest,
      packageUrl: `file://${this.stagedPackage.packagePath}`,
      manifestUrl: `file://${this.stagedPackage.manifestPath}`,
      signatureUrl: `file://${this.stagedPackage.signaturePath}`,
      publishedAt: new Date(manifest.releaseDate || Date.now()),
      providerType: "MANUAL",
    };
  }

  public async listReleases(channel?: string, limit = 10): Promise<ReleaseInfo[]> {
    if (!this.stagedPackage) return [];
    const info = await this.checkForUpdates("0.0.0", channel || "stable");
    return info ? [info] : [];
  }

  public async downloadReleaseAssets(
    release: ReleaseInfo,
    targetDir: string,
    onProgress?: (percent: number, bytesDownloaded: number, totalBytes: number) => void
  ): Promise<{ packagePath: string; manifestPath: string; signaturePath: string }> {
    if (!this.stagedPackage) {
      throw new Error("No manual package staged for installation.");
    }

    fs.mkdirSync(targetDir, { recursive: true });
    const destPackage = path.join(targetDir, path.basename(this.stagedPackage.packagePath));
    const destManifest = path.join(targetDir, "release-manifest.json");
    const destSig = path.join(targetDir, "release-manifest.json.sig");

    if (this.stagedPackage.packagePath !== destPackage) {
      fs.copyFileSync(this.stagedPackage.packagePath, destPackage);
    }
    if (this.stagedPackage.manifestPath !== destManifest) {
      fs.copyFileSync(this.stagedPackage.manifestPath, destManifest);
    }
    if (this.stagedPackage.signaturePath !== destSig) {
      fs.copyFileSync(this.stagedPackage.signaturePath, destSig);
    }

    const stat = fs.statSync(destPackage);
    if (onProgress) {
      onProgress(100, stat.size, stat.size);
    }

    return {
      packagePath: destPackage,
      manifestPath: destManifest,
      signaturePath: destSig,
    };
  }
}
