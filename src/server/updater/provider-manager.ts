import fs from "node:fs";
import path from "node:path";
import { IUpdateProvider, ReleaseInfo, UpdateProviderType } from "./types";
import { compareSemver } from "./semver";
import { GitHubReleaseProvider, GitHubProviderConfig } from "./providers/github-provider";
import { S3CompatibleReleaseProvider, S3ProviderConfig } from "./providers/s3-compatible-provider";
import { ManualSignedPackageProvider } from "./providers/manual-provider";
import { decrypt } from "../crypto";
import { prisma } from "../db";

export class UpdateProviderManager {
  private static instance: UpdateProviderManager;
  private providers: Map<UpdateProviderType, IUpdateProvider> = new Map();
  private manualProvider: ManualSignedPackageProvider;
  private initialized = false;

  private constructor() {
    this.manualProvider = new ManualSignedPackageProvider(99);
    this.registerProvider(this.manualProvider);

    // Register default GitHub provider based on environment
    const defaultGithub = new GitHubReleaseProvider({}, 1);
    this.registerProvider(defaultGithub);
  }

  public static getInstance(): UpdateProviderManager {
    if (!UpdateProviderManager.instance) {
      UpdateProviderManager.instance = new UpdateProviderManager();
    }
    return UpdateProviderManager.instance;
  }

  public registerProvider(provider: IUpdateProvider): void {
    this.providers.set(provider.type, provider);
  }

  public getManualProvider(): ManualSignedPackageProvider {
    return this.manualProvider;
  }

  /**
   * Initialize provider instances from DB configuration.
   * Gracefully degrades if DB is unavailable during early bootstrap.
   */
  public async loadFromDatabase(): Promise<void> {
    try {
      let loadedAny = false;
      if (prisma && prisma.updateProviderConfig) {
        const configs = await prisma.updateProviderConfig.findMany({
          where: { enabled: true },
          orderBy: { priority: "asc" },
        });

        for (const item of configs) {
          try {
            const decryptedJson = item.configEnc ? decrypt(item.configEnc) : "{}";
            const parsed = JSON.parse(decryptedJson);

            if (item.providerType === "GITHUB") {
              const ghConfig: GitHubProviderConfig = {
                owner: parsed.owner,
                repo: parsed.repo,
                token: parsed.token,
                baseUrl: parsed.baseUrl,
              };
              this.registerProvider(new GitHubReleaseProvider(ghConfig, item.priority));
              loadedAny = true;
            } else if (item.providerType === "CLOUDFLARE_R2" || item.providerType === "AMAZON_S3") {
              const s3Config: S3ProviderConfig = {
                type: item.providerType,
                name: item.name,
                bucket: parsed.bucket,
                region: parsed.region,
                endpoint: parsed.endpoint,
                accountId: parsed.accountId,
                accessKeyId: parsed.accessKeyId,
                secretAccessKey: parsed.secretAccessKey,
                prefix: parsed.prefix,
              };
              this.registerProvider(new S3CompatibleReleaseProvider(s3Config, item.priority));
              loadedAny = true;
            }
          } catch (itemErr) {
            console.warn(`[UpdateProviderManager] Failed to load provider config ${item.name}:`, itemErr);
          }
        }
      }

      if (!loadedAny) {
        this.loadFromFileFallback();
      } else {
        this.initialized = true;
      }
    } catch (err) {
      this.loadFromFileFallback();
    }
  }

  private loadFromFileFallback(): void {
    try {
      const filePath = path.join(process.cwd(), "storage", "updater-providers.json");
      if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
        if (data.GITHUB) {
          const ghConfig: GitHubProviderConfig = {
            owner: data.GITHUB.owner,
            repo: data.GITHUB.repo,
            token: data.GITHUB.token,
            baseUrl: data.GITHUB.baseUrl,
          };
          this.registerProvider(new GitHubReleaseProvider(ghConfig, 1));
          this.initialized = true;
        }
      }
    } catch (_) {}
  }

  public getProviders(): IUpdateProvider[] {
    return Array.from(this.providers.values()).sort((a, b) => a.priority - b.priority);
  }

  public getProvider(type: UpdateProviderType): IUpdateProvider | undefined {
    return this.providers.get(type);
  }

  public async testProvider(type: UpdateProviderType): Promise<{ ok: boolean; message: string; latencyMs?: number }> {
    const provider = this.providers.get(type);
    if (!provider) {
      return { ok: false, message: `Provider ${type} is not configured.` };
    }
    return provider.testConnection();
  }

  /**
   * Check for updates across registered providers in priority order.
   * If the primary provider fails, automatically falls back to secondary providers.
   */
  public async checkForUpdates(
    currentVersion: string,
    channel: string
  ): Promise<{ release: ReleaseInfo; provider: IUpdateProvider } | null> {
    const sorted = this.getProviders();
    const availableUpdates: Array<{ release: ReleaseInfo; provider: IUpdateProvider }> = [];

    for (const provider of sorted) {
      if (provider.type === "MANUAL") {
        const staged = await provider.checkForUpdates(currentVersion, channel);
        if (staged) {
          availableUpdates.push({ release: staged, provider });
        }
        continue;
      }

      try {
        const release = await provider.checkForUpdates(currentVersion, channel);
        if (release) {
          availableUpdates.push({ release, provider });
        }
      } catch (err) {
        console.warn(`[UpdateProviderManager] Provider ${provider.name} check failed:`, err);
      }
    }

    if (availableUpdates.length === 0) {
      return null;
    }

    // Always sort by semantic version descending so the user updates directly to the latest release
    availableUpdates.sort((a, b) => compareSemver(b.release.version, a.release.version));
    return availableUpdates[0];
  }

  /**
   * Download release assets using the specified provider or by fallback lookup.
   */
  public async downloadReleaseAssets(
    release: ReleaseInfo,
    targetDir: string,
    onProgress?: (percent: number, bytesDownloaded: number, totalBytes: number) => void
  ): Promise<{ packagePath: string; manifestPath: string; signaturePath: string }> {
    const primary = this.providers.get(release.providerType);
    if (primary) {
      try {
        return await primary.downloadReleaseAssets(release, targetDir, onProgress);
      } catch (err) {
        console.warn(`[UpdateProviderManager] Primary download failed on ${primary.name}, attempting fallback providers:`, err);
      }
    }

    // Attempt fallback providers if primary failed
    for (const provider of this.getProviders()) {
      if (provider.type === release.providerType || provider.type === "MANUAL") continue;
      try {
        return await provider.downloadReleaseAssets(release, targetDir, onProgress);
      } catch (err) {
        console.warn(`[UpdateProviderManager] Fallback download failed on ${provider.name}:`, err);
      }
    }

    throw new Error(`Failed to download release ${release.version} from any available update provider.`);
  }
}
