import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import http from "node:http";
import { URL } from "node:url";
import { IUpdateProvider, ReleaseInfo, ReleaseManifest } from "../types";
import { isUpgradeAvailable, compareSemver } from "../semver";

export interface GitHubProviderConfig {
  owner: string;
  repo: string;
  token?: string;
  baseUrl?: string;
}

export class GitHubReleaseProvider implements IUpdateProvider {
  public readonly type = "GITHUB" as const;
  public readonly name = "GitHub Releases";
  public priority: number;

  private owner: string;
  private repo: string;
  private token?: string;
  private baseUrl: string;

  constructor(config: Partial<GitHubProviderConfig> = {}, priority = 1) {
    this.owner = config.owner || process.env.UPDATER_GITHUB_OWNER || "jitendraloon";
    this.repo = config.repo || process.env.UPDATER_GITHUB_REPO || "webservicers-releases";
    this.token = config.token || process.env.UPDATER_GITHUB_TOKEN || process.env.GITHUB_TOKEN;
    this.baseUrl = (config.baseUrl || "https://api.github.com").replace(/\/+$/, "");
    this.priority = priority;
  }

  private getHeaders(hostname?: string): Record<string, string> {
    const isGitHubApi = hostname === "api.github.com";
    const headers: Record<string, string> = {
      "User-Agent": "WebServicers-Updater/1.0",
      Accept: isGitHubApi ? "application/vnd.github.v3+json" : "application/json, text/plain, */*",
    };
    if (this.token && isGitHubApi) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    return headers;
  }

  private fetchJson<T>(endpointUrl: string): Promise<T> {
    return new Promise((resolve, reject) => {
      const u = new URL(endpointUrl);
      const options: https.RequestOptions = {
        hostname: u.hostname,
        port: u.port || 443,
        path: `${u.pathname}${u.search}`,
        method: "GET",
        headers: this.getHeaders(u.hostname),
      };

      const req = https.request(options, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return this.fetchJson<T>(res.headers.location).then(resolve).catch(reject);
        }

        if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
          let errBody = "";
          res.on("data", (chunk) => (errBody += chunk));
          res.on("end", () => {
            reject(new Error(`GitHub API error ${res.statusCode}: ${errBody || res.statusMessage}`));
          });
          return;
        }

        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(body) as T);
          } catch (e) {
            reject(new Error(`Failed to parse GitHub JSON response: ${(e as Error).message}`));
          }
        });
      });

      req.on("error", reject);
      req.end();
    });
  }

  private downloadFile(
    fileUrl: string,
    destPath: string,
    onProgress?: (bytes: number, total: number) => void,
    redirectCount = 0
  ): Promise<void> {
    if (redirectCount > 5) {
      return Promise.reject(new Error("Too many redirects while downloading asset"));
    }

    return new Promise((resolve, reject) => {
      const u = new URL(fileUrl);
      const isHttps = u.protocol === "https:";
      const client = isHttps ? https : http;

      // Only send Authorization header if requesting directly from api.github.com
      // Sending Authorization to AWS S3 (objects.githubusercontent.com) causes HTTP 400 Bad Request
      const headers: Record<string, string> = {
        "User-Agent": "WebServicers-Updater/1.0",
        Accept: "*/*",
      };

      if (u.hostname === "api.github.com") {
        if (this.token) {
          headers.Authorization = `Bearer ${this.token}`;
        }
        if (fileUrl.includes("/assets/")) {
          headers.Accept = "application/octet-stream";
        }
      }

      const req = client.request(
        fileUrl,
        {
          headers,
          method: "GET",
        },
        (res) => {
          if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            return this.downloadFile(res.headers.location, destPath, onProgress, redirectCount + 1)
              .then(resolve)
              .catch(reject);
          }

          if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
            return reject(new Error(`Download failed with status ${res.statusCode}: ${res.statusMessage}`));
          }

          const totalBytes = parseInt(res.headers["content-length"] || "0", 10);
          let downloaded = 0;

          fs.mkdirSync(path.dirname(destPath), { recursive: true });
          const fileStream = fs.createWriteStream(destPath);

          res.on("data", (chunk) => {
            downloaded += chunk.length;
            if (onProgress) onProgress(downloaded, totalBytes);
          });

          res.pipe(fileStream);

          fileStream.on("finish", () => {
            fileStream.close(() => resolve());
          });

          fileStream.on("error", (err) => {
            try {
              fs.unlinkSync(destPath);
            } catch {}
            reject(err);
          });
        }
      );

      req.on("error", reject);
      req.end();
    });
  }

  public async testConnection(): Promise<{ ok: boolean; message: string; latencyMs?: number }> {
    const start = Date.now();
    try {
      const url = `${this.baseUrl}/repos/${this.owner}/${this.repo}`;
      await this.fetchJson<any>(url);
      const latencyMs = Date.now() - start;
      return {
        ok: true,
        message: `Successfully connected to GitHub repository ${this.owner}/${this.repo}.`,
        latencyMs,
      };
    } catch (err: any) {
      return {
        ok: false,
        message: `GitHub connection failed: ${err.message}`,
        latencyMs: Date.now() - start,
      };
    }
  }

  public async listReleases(channel = "stable", limit = 10): Promise<ReleaseInfo[]> {
    const results: ReleaseInfo[] = [];
    const candidateRepos = Array.from(new Set([this.repo, "webservicers-releases"]));

    // 1. Query GitHub Releases API (wrapped in try/catch to gracefully handle rate limits or missing repo)
    for (const repoName of candidateRepos) {
      try {
        const url = `${this.baseUrl}/repos/${this.owner}/${repoName}/releases?per_page=${limit}`;
        const rawReleases = await this.fetchJson<any[]>(url);

        for (const raw of rawReleases) {
          if (raw.draft) continue;

          const isPrerelease = Boolean(raw.prerelease);
          if (channel === "stable" && isPrerelease) continue;

          const assets: any[] = raw.assets || [];
          const manifestAsset = assets.find((a) => a.name === "release-manifest.json");
          const signatureAsset = assets.find(
            (a) => a.name === "release-signature.sig" || a.name === "release-manifest.json.sig"
          );
          const packageAsset = assets.find(
            (a) => a.name.endsWith(".tar.gz") || a.name.endsWith(".zip")
          );

          if (!packageAsset) continue;

          let manifest: ReleaseManifest;
          if (manifestAsset) {
            try {
              manifest = await this.fetchJson<ReleaseManifest>(manifestAsset.browser_download_url);
            } catch {
              manifest = this.createFallbackManifest(raw, packageAsset);
            }
          } else {
            manifest = this.createFallbackManifest(raw, packageAsset);
          }

          const cleanVer = (raw.tag_name || manifest.version || "").replace(/^v+/i, "");
          if (!results.some((r) => r.version === cleanVer)) {
            results.push({
              id: String(raw.id),
              version: cleanVer,
              channel: isPrerelease ? "beta" : "stable",
              manifest,
              packageUrl: packageAsset.browser_download_url || packageAsset.url,
              manifestUrl: manifestAsset?.browser_download_url || "",
              signatureUrl: signatureAsset?.browser_download_url || "",
              publishedAt: new Date(raw.published_at || raw.created_at || Date.now()),
              providerType: this.type,
            });
          }
        }
      } catch (_) {
        // Proceed to direct git distribution manifests
      }
    }

    // 2. Query upstream distribution repository manifests & version directories
    const timestamp = Date.now();
    for (const repoName of candidateRepos) {
      try {
        const channelManifestUrl = `https://raw.githubusercontent.com/${this.owner}/${repoName}/main/manifests/${channel}.json?t=${timestamp}`;
        const fallbackUrl = `https://raw.githubusercontent.com/${this.owner}/${repoName}/main/manifests/latest.json?t=${timestamp}`;
        let rawManifest: ReleaseManifest | null = null;
        try {
          rawManifest = await this.fetchJson<ReleaseManifest>(channelManifestUrl);
        } catch {
          try {
            rawManifest = await this.fetchJson<ReleaseManifest>(fallbackUrl);
          } catch (_) {}
        }

        if (rawManifest && rawManifest.version) {
          const pkgFormat = rawManifest.package?.format === "zip" ? "zip" : "tar.gz";
          const pkgName = rawManifest.package?.filename || `webservicers-v${rawManifest.version}.${pkgFormat}`;
          const rawPackageUrl = `https://raw.githubusercontent.com/${this.owner}/${repoName}/main/releases/v${rawManifest.version}/${pkgName}`;
          const rawManifestFileUrl = `https://raw.githubusercontent.com/${this.owner}/${repoName}/main/releases/v${rawManifest.version}/release-manifest.json`;
          const rawSigUrl = `https://raw.githubusercontent.com/${this.owner}/${repoName}/main/releases/v${rawManifest.version}/release-manifest.json.sig`;

          const alreadyExists = results.some((r) => r.version === rawManifest!.version);
          if (!alreadyExists) {
            results.push({
              id: `git-v${rawManifest.version}`,
              version: rawManifest.version,
              channel: (rawManifest.channel as any) || channel,
              manifest: rawManifest,
              packageUrl: rawPackageUrl,
              manifestUrl: rawManifestFileUrl,
              signatureUrl: rawSigUrl,
              publishedAt: new Date(rawManifest.releaseDate || Date.now()),
              providerType: this.type,
            });
          }
        }

        // 3. Inspect releases directory contents from GitHub API to discover all version increments
        try {
          const contentsUrl = `${this.baseUrl}/repos/${this.owner}/${repoName}/contents/releases`;
          const dirEntries = await this.fetchJson<Array<{ name: string; type: string }>>(contentsUrl);
          if (Array.isArray(dirEntries)) {
            const versionDirs = dirEntries
              .filter((e) => e.type === "dir" && /^v?\d+\.\d+\.\d+/i.test(e.name))
              .map((e) => e.name.replace(/^v+/i, ""));

            // Check highest 3 versions if not already in results
            for (const v of versionDirs.slice(-3)) {
              if (!results.some((r) => r.version === v)) {
                try {
                  const itemManifestUrl = `https://raw.githubusercontent.com/${this.owner}/${repoName}/main/releases/v${v}/release-manifest.json?t=${timestamp}`;
                  const itemManifest = await this.fetchJson<ReleaseManifest>(itemManifestUrl);
                  if (itemManifest && itemManifest.version) {
                    const itemFormat = itemManifest.package?.format === "zip" ? "zip" : "tar.gz";
                    const itemPkgName = itemManifest.package?.filename || `webservicers-v${v}.${itemFormat}`;
                    results.push({
                      id: `git-v${v}`,
                      version: v,
                      channel: (itemManifest.channel as any) || channel,
                      manifest: itemManifest,
                      packageUrl: `https://raw.githubusercontent.com/${this.owner}/${repoName}/main/releases/v${v}/${itemPkgName}`,
                      manifestUrl: itemManifestUrl,
                      signatureUrl: `https://raw.githubusercontent.com/${this.owner}/${repoName}/main/releases/v${v}/release-manifest.json.sig`,
                      publishedAt: new Date(itemManifest.releaseDate || Date.now()),
                      providerType: this.type,
                    });
                  }
                } catch (_) {}
              }
            }
          }
        } catch (_) {}
      } catch (_) {}
    }

    // Sort descending by semantic version so highest release is always prioritized
    results.sort((a, b) => compareSemver(b.version, a.version));
    return results;
  }

  public async checkForUpdates(currentVersion: string, channel = "stable"): Promise<ReleaseInfo | null> {
    const releases = await this.listReleases(channel, 20);
    // Sort descending by semantic version so the latest/highest release is picked directly
    releases.sort((a, b) => compareSemver(b.version, a.version));

    for (const rel of releases) {
      if (isUpgradeAvailable(currentVersion, rel.version)) {
        return rel;
      }
    }
    return null;
  }

  public async downloadReleaseAssets(
    release: ReleaseInfo,
    targetDir: string,
    onProgress?: (percent: number, bytesDownloaded: number, totalBytes: number) => void
  ): Promise<{ packagePath: string; manifestPath: string; signaturePath: string }> {
    fs.mkdirSync(targetDir, { recursive: true });

    const packageExt = release.manifest.package.format === "zip" ? ".zip" : ".tar.gz";
    const packagePath = path.join(targetDir, `release-${release.version}${packageExt}`);
    const manifestPath = path.join(targetDir, "release-manifest.json");
    const signaturePath = path.join(targetDir, "release-signature.sig");

    // 1. Download Manifest
    if (release.manifestUrl) {
      await this.downloadFile(release.manifestUrl, manifestPath);
    } else {
      fs.writeFileSync(manifestPath, JSON.stringify(release.manifest, null, 2), "utf8");
    }

    // 2. Download Signature
    if (release.signatureUrl) {
      await this.downloadFile(release.signatureUrl, signaturePath);
    } else {
      fs.writeFileSync(signaturePath, "", "utf8");
    }

    // 3. Download Main Package with progress
    await this.downloadFile(release.packageUrl, packagePath, (downloaded, total) => {
      const pct = total > 0 ? Math.min(100, Math.round((downloaded / total) * 100)) : 50;
      if (onProgress) onProgress(pct, downloaded, total);
    });

    return { packagePath, manifestPath, signaturePath };
  }

  private createFallbackManifest(raw: any, packageAsset: any): ReleaseManifest {
    const version = (raw.tag_name || "v1.0.0").replace(/^v/i, "");
    return {
      app: "webservicers",
      version,
      channel: raw.prerelease ? "beta" : "stable",
      releaseDate: raw.published_at || new Date().toISOString(),
      package: {
        filename: packageAsset.name,
        sizeBytes: packageAsset.size || 0,
        sha256: "",
        format: packageAsset.name.endsWith(".zip") ? "zip" : "tar.gz",
      },
      migrations: {
        hasMigrations: false,
        migrationType: "safe",
        targetEngines: ["mysql", "sqlite"],
      },
      maintenance: {
        requiresRestart: true,
        estimatedDowntimeSeconds: 5,
      },
      changelog: raw.body || "Regular updates and maintenance.",
      security: {
        isSecurityPatch: false,
      },
    };
  }
}
