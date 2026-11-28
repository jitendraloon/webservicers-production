import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import http from "node:http";
import { URL } from "node:url";
import { IUpdateProvider, ReleaseInfo, ReleaseManifest, UpdateProviderType } from "../types";
import { isUpgradeAvailable } from "../semver";
import { signAwsV4Request } from "../../integrations/aws-sigv4";

export interface S3ProviderConfig {
  type: "CLOUDFLARE_R2" | "AMAZON_S3";
  name?: string;
  bucket: string;
  region?: string;
  endpoint?: string;
  accountId?: string;
  accessKeyId: string;
  secretAccessKey: string;
  prefix?: string;
}

export class S3CompatibleReleaseProvider implements IUpdateProvider {
  public readonly type: UpdateProviderType;
  public readonly name: string;
  public priority: number;

  private config: S3ProviderConfig;
  private prefix: string;

  constructor(config: S3ProviderConfig, priority = 2) {
    this.type = config.type;
    this.name = config.name || (config.type === "CLOUDFLARE_R2" ? "Cloudflare R2" : "Amazon S3");
    this.priority = priority;
    this.config = config;
    this.prefix = (config.prefix || "releases").replace(/^\/+|\/+$/g, "");
  }

  private resolveEndpoint(): { host: string; basePath: string; region: string } {
    if (this.type === "CLOUDFLARE_R2") {
      const endpoint = this.config.endpoint
        ? this.config.endpoint.replace(/^https?:\/\//, "").replace(/\/+$/, "")
        : `${this.config.accountId}.r2.cloudflarestorage.com`;
      return {
        host: endpoint,
        basePath: `/${this.config.bucket}`,
        region: "auto",
      };
    }

    const region = this.config.region || "us-east-1";
    const host = this.config.endpoint
      ? this.config.endpoint.replace(/^https?:\/\//, "").replace(/\/+$/, "")
      : `${this.config.bucket}.s3.${region}.amazonaws.com`;
    return {
      host,
      basePath: this.config.endpoint ? `/${this.config.bucket}` : "",
      region,
    };
  }

  private async executeSignedRequest(objectKey: string, method = "GET"): Promise<{ statusCode: number; body: Buffer }> {
    const { host, basePath, region } = this.resolveEndpoint();
    const cleanKey = objectKey.replace(/^\/+/, "");
    const pathname = `${basePath}/${cleanKey}`;

    const fullUrl = `https://${host}${pathname}`;
    const headers = signAwsV4Request({
      method,
      url: fullUrl,
      region,
      service: "s3",
      accessKeyId: this.config.accessKeyId,
      secretAccessKey: this.config.secretAccessKey,
    });

    return new Promise((resolve, reject) => {
      const req = https.request(
        {
          hostname: host,
          port: 443,
          path: pathname,
          method,
          headers,
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
          res.on("end", () => {
            resolve({
              statusCode: res.statusCode || 500,
              body: Buffer.concat(chunks),
            });
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
      const res = await this.executeSignedRequest(`${this.prefix}/releases-index.json`, "HEAD");
      const latencyMs = Date.now() - start;
      if (res.statusCode === 200 || res.statusCode === 404) {
        return {
          ok: true,
          message: `Connected successfully to bucket '${this.config.bucket}' on ${this.name}.`,
          latencyMs,
        };
      }
      return {
        ok: false,
        message: `HTTP ${res.statusCode} received from ${this.name} bucket.`,
        latencyMs,
      };
    } catch (err: any) {
      return {
        ok: false,
        message: `Connection failed: ${err.message}`,
        latencyMs: Date.now() - start,
      };
    }
  }

  public async listReleases(channel = "stable", limit = 10): Promise<ReleaseInfo[]> {
    try {
      const res = await this.executeSignedRequest(`${this.prefix}/releases-index.json`, "GET");
      if (res.statusCode !== 200) {
        return [];
      }
      const rawManifests = JSON.parse(res.body.toString("utf8")) as ReleaseManifest[];
      const results: ReleaseInfo[] = [];

      for (const m of rawManifests) {
        if (channel === "stable" && m.channel !== "stable") continue;
        const v = m.version.startsWith("v") ? m.version : `v${m.version}`;
        const basePath = `${this.prefix}/${v}`;

        results.push({
          id: `r2-${m.version}`,
          version: v,
          channel: m.channel,
          manifest: m,
          packageUrl: `${basePath}/${m.package.filename}`,
          manifestUrl: `${basePath}/release-manifest.json`,
          signatureUrl: `${basePath}/release-signature.sig`,
          publishedAt: new Date(m.releaseDate),
          providerType: this.type,
        });

        if (results.length >= limit) break;
      }
      return results;
    } catch {
      return [];
    }
  }

  public async checkForUpdates(currentVersion: string, channel = "stable"): Promise<ReleaseInfo | null> {
    const releases = await this.listReleases(channel, 5);
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
    const manifestRes = await this.executeSignedRequest(release.manifestUrl);
    if (manifestRes.statusCode !== 200) {
      fs.writeFileSync(manifestPath, JSON.stringify(release.manifest, null, 2), "utf8");
    } else {
      fs.writeFileSync(manifestPath, manifestRes.body);
    }

    // 2. Download Signature
    const sigRes = await this.executeSignedRequest(release.signatureUrl);
    fs.writeFileSync(signaturePath, sigRes.statusCode === 200 ? sigRes.body : Buffer.from(""));

    // 3. Download Package
    const pkgRes = await this.executeSignedRequest(release.packageUrl);
    if (pkgRes.statusCode !== 200) {
      throw new Error(`Failed to download package from S3/R2 (status ${pkgRes.statusCode})`);
    }
    fs.writeFileSync(packagePath, pkgRes.body);
    if (onProgress) onProgress(100, pkgRes.body.length, pkgRes.body.length);

    return { packagePath, manifestPath, signaturePath };
  }
}
