export type UpdateProviderType = "GITHUB" | "CLOUDFLARE_R2" | "AMAZON_S3" | "MANUAL";

export type UpdateJobStatus =
  | "IDLE"
  | "PENDING"
  | "DOWNLOADING"
  | "VERIFYING"
  | "STAGING"
  | "BACKING_UP"
  | "MIGRATING"
  | "ACTIVATING"
  | "RESTARTING"
  | "HEALTH_CHECKING"
  | "COMPLETED"
  | "FAILED"
  | "ROLLED_BACK"
  | "CANCELED";

export interface ReleasePackageInfo {
  filename: string;
  sizeBytes: number;
  sha256: string;
  format: "tar.gz" | "zip";
}

export interface ReleaseMigrationInfo {
  hasMigrations: boolean;
  migrationType: "safe" | "expand_contract" | "requires_manual_check";
  targetEngines: string[];
}

export interface ReleaseMaintenanceInfo {
  requiresRestart: boolean;
  estimatedDowntimeSeconds: number;
}

export interface ReleaseSecurityInfo {
  isSecurityPatch: boolean;
  cveList?: string[];
}

export interface ReleaseManifest {
  app: "webservicers";
  version: string;
  channel: "stable" | "beta";
  releaseDate: string;
  minAppVersion?: string;
  minNodeVersion?: string;
  minUpdaterVersion?: string;
  package: ReleasePackageInfo;
  migrations: ReleaseMigrationInfo;
  maintenance: ReleaseMaintenanceInfo;
  changelog: string;
  security: ReleaseSecurityInfo;
}

export interface ReleaseInfo {
  id: string;
  version: string;
  channel: string;
  manifest: ReleaseManifest;
  packageUrl: string;
  manifestUrl: string;
  signatureUrl: string;
  publishedAt: Date;
  providerType: UpdateProviderType;
}

export interface IUpdateProvider {
  type: UpdateProviderType;
  name: string;
  priority: number;
  testConnection(): Promise<{ ok: boolean; message: string; latencyMs?: number }>;
  checkForUpdates(currentVersion: string, channel: string): Promise<ReleaseInfo | null>;
  listReleases(channel?: string, limit?: number): Promise<ReleaseInfo[]>;
  downloadReleaseAssets(
    release: ReleaseInfo,
    targetDir: string,
    onProgress?: (percent: number, bytesDownloaded: number, totalBytes: number) => void
  ): Promise<{ packagePath: string; manifestPath: string; signaturePath: string }>;
}

export interface StagedRelease {
  version: string;
  manifest: ReleaseManifest;
  packagePath: string;
  manifestPath: string;
  signaturePath: string;
  stagedDir: string;
}

export interface UpdateJobState {
  jobId: string;
  targetVersion: string;
  previousVersion: string;
  status: UpdateJobStatus;
  progressPercent: number;
  currentStep: string;
  errorMessage?: string;
  errorDetails?: string;
  backupId?: string;
  heartbeatAt: string;
  startedAt: string;
  completedAt?: string;
  logs: Array<{ timestamp: string; level: "info" | "warn" | "error"; message: string }>;
}
