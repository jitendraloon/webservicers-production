import crypto from "node:crypto";
import fs from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import { createAwsV4PresignedUrl, signAwsV4Request } from "./aws-sigv4";
import {
  getActiveIntegrationForCategory,
  getIntegrationConfig,
} from "./vault";

export type StorageDriver = "local" | "ftp" | "r2" | "s3";

export interface UploadFileInput {
  key: string;
  body: Buffer | Uint8Array | string;
  contentType?: string;
  driver?: StorageDriver;
}

export interface UploadFileResult {
  driver: StorageDriver;
  key: string;
  url: string;
  sizeBytes: number;
}

interface StorageConfig extends Record<string, unknown> {
  baseDir?: string;
  publicBaseUrl?: string;
  signingSecret?: string;
  // S3 / R2
  bucket?: string;
  region?: string;
  endpoint?: string;
  accountId?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  // FTP
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  basePath?: string;
}

const LOCAL_UPLOAD_ROOT = path.resolve(process.cwd(), "storage", "uploads");

function sanitizeKey(key: string): string {
  const normalized = key.replace(/\\/g, "/").replace(/^\/+/, "");
  const segments = normalized.split("/").filter((s) => s && s !== "." && s !== "..");
  if (segments.length === 0) {
    throw new Error("Invalid storage object key.");
  }
  return segments.join("/");
}

function resolveLocalPath(key: string, baseDir?: string): string {
  const root = baseDir ? path.resolve(baseDir) : LOCAL_UPLOAD_ROOT;
  const safeKey = sanitizeKey(key);
  const fullPath = path.resolve(root, safeKey);
  if (!fullPath.startsWith(root + path.sep) && fullPath !== root) {
    throw new Error("Path traversal detected in storage key.");
  }
  return fullPath;
}

function resolveS3Endpoint(
  driver: "s3" | "r2",
  config: StorageConfig,
  key: string
): { url: string; region: string } {
  const bucket = config.bucket;
  if (!bucket) {
    throw new Error(`${driver.toUpperCase()} configuration requires bucket.`);
  }
  const safeKey = sanitizeKey(key);

  if (driver === "r2") {
    const endpoint =
      config.endpoint?.replace(/\/+$/, "") ??
      (config.accountId
        ? `https://${config.accountId}.r2.cloudflarestorage.com`
        : undefined);
    if (!endpoint) {
      throw new Error("Cloudflare R2 requires endpoint or accountId.");
    }
    return {
      url: `${endpoint}/${bucket}/${safeKey}`,
      region: config.region || "auto",
    };
  }

  const region = config.region || "us-east-1";
  const endpoint = config.endpoint?.replace(/\/+$/, "");
  const url = endpoint
    ? `${endpoint}/${bucket}/${safeKey}`
    : `https://${bucket}.s3.${region}.amazonaws.com/${safeKey}`;
  return { url, region };
}

async function withFtpClient<T>(
  config: StorageConfig,
  fn: (cmd: (line: string) => Promise<{ code: number; text: string }>) => Promise<T>
): Promise<T> {
  const host = config.host;
  const port = Number(config.port ?? 21);
  if (!host) {
    throw new Error("FTP configuration requires host.");
  }

  return new Promise<T>((resolve, reject) => {
    const socket = net.connect({ host, port });
    let buffer = "";

    socket.setTimeout(15_000);
    socket.on("timeout", () => {
      socket.destroy();
      reject(new Error("FTP connection timed out."));
    });
    socket.on("error", reject);

    const readResp = (): Promise<{ code: number; text: string }> =>
      new Promise((res, rej) => {
        const tryParse = () => {
          const lines = buffer.split(/\r?\n/);
          for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i];
            if (/^\d{3} /.test(line)) {
              const code = Number(line.slice(0, 3));
              const text = lines.slice(0, i + 1).join("\n");
              buffer = lines.slice(i + 1).join("\n");
              socket.off("data", onData);
              socket.off("error", rej);
              res({ code, text });
              return;
            }
          }
        };
        const onData = (chunk: Buffer) => {
          buffer += chunk.toString("utf8");
          tryParse();
        };
        socket.on("data", onData);
        socket.on("error", rej);
        tryParse();
      });

    const cmd = async (line: string) => {
      socket.write(`${line}\r\n`);
      return readResp();
    };

    (async () => {
      try {
        const greeting = await readResp();
        if (greeting.code !== 220) {
          throw new Error(`FTP greeting failed: ${greeting.text}`);
        }
        const userResp = await cmd(`USER ${config.username ?? "anonymous"}`);
        if (userResp.code === 331) {
          const passResp = await cmd(`PASS ${config.password ?? ""}`);
          if (passResp.code !== 230) {
            throw new Error(`FTP login failed: ${passResp.text}`);
          }
        } else if (userResp.code !== 230) {
          throw new Error(`FTP user failed: ${userResp.text}`);
        }
        await cmd("TYPE I");
        const result = await fn(cmd);
        await cmd("QUIT").catch(() => undefined);
        socket.end();
        resolve(result);
      } catch (err) {
        socket.destroy();
        reject(err);
      }
    })();
  });
}

function parsePasvHostPort(pasvText: string): { host: string; port: number } {
  const match = /\((\d+),(\d+),(\d+),(\d+),(\d+),(\d+)\)/.exec(pasvText);
  if (!match) {
    throw new Error(`Invalid FTP PASV response: ${pasvText}`);
  }
  return {
    host: `${match[1]}.${match[2]}.${match[3]}.${match[4]}`,
    port: Number(match[5]) * 256 + Number(match[6]),
  };
}

async function resolveStorageDriver(
  requested?: StorageDriver
): Promise<{ driver: StorageDriver; config: StorageConfig }> {
  if (requested) {
    if (requested === "local") {
      const cfg = await getIntegrationConfig<StorageConfig>("storage", "local");
      return { driver: "local", config: cfg?.config ?? {} };
    }
    const cfg = await getIntegrationConfig<StorageConfig>("storage", requested);
    if (!cfg || !cfg.enabled) {
      throw new Error(`Storage driver "${requested}" is not configured or enabled.`);
    }
    return { driver: requested, config: cfg.config };
  }

  const active = await getActiveIntegrationForCategory<StorageConfig>("storage");
  if (active) {
    const normalized = active.provider.toLowerCase() as StorageDriver;
    if (["local", "ftp", "r2", "s3"].includes(normalized)) {
      return { driver: normalized, config: active.config };
    }
  }

  return { driver: "local", config: {} };
}

/**
 * Upload a file to the active storage driver (Local, FTP, Cloudflare R2, or Amazon S3).
 */
export async function uploadFile(
  input: UploadFileInput
): Promise<UploadFileResult> {
  const { driver, config } = await resolveStorageDriver(input.driver);
  const safeKey = sanitizeKey(input.key);
  const buffer = Buffer.isBuffer(input.body)
    ? input.body
    : typeof input.body === "string"
      ? Buffer.from(input.body, "utf8")
      : Buffer.from(input.body);

  if (driver === "local") {
    const dest = resolveLocalPath(safeKey, config.baseDir);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest, buffer);
    const base = config.publicBaseUrl?.replace(/\/+$/, "") ?? "/api/media/file";
    return {
      driver: "local",
      key: safeKey,
      url: `${base}/${safeKey}`,
      sizeBytes: buffer.length,
    };
  }

  if (driver === "ftp") {
    const remotePath = [config.basePath?.replace(/\/+$/, ""), safeKey]
      .filter(Boolean)
      .join("/");
    await withFtpClient(config, async (cmd) => {
      const pasv = await cmd("PASV");
      if (pasv.code !== 227) {
        throw new Error(`FTP PASV failed: ${pasv.text}`);
      }
      const { host, port } = parsePasvHostPort(pasv.text);
      const dataSocket = net.connect({ host, port });
      const storResp = await cmd(`STOR ${remotePath}`);
      if (storResp.code !== 150 && storResp.code !== 125) {
        dataSocket.destroy();
        throw new Error(`FTP STOR failed: ${storResp.text}`);
      }
      await new Promise<void>((res, rej) => {
        dataSocket.on("error", rej);
        dataSocket.end(buffer, res);
      });
    });

    const base = config.publicBaseUrl?.replace(/\/+$/, "") ?? "";
    return {
      driver: "ftp",
      key: safeKey,
      url: base ? `${base}/${safeKey}` : remotePath,
      sizeBytes: buffer.length,
    };
  }

  // S3 / R2
  if (!config.accessKeyId || !config.secretAccessKey) {
    throw new Error(`${driver.toUpperCase()} requires accessKeyId and secretAccessKey.`);
  }
  const { url, region } = resolveS3Endpoint(driver, config, safeKey);
  const headers = signAwsV4Request({
    method: "PUT",
    url,
    region,
    service: "s3",
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    headers: {
      "content-type": input.contentType ?? "application/octet-stream",
    },
    body: buffer,
  });

  const resp = await fetch(url, {
    method: "PUT",
    headers,
    body: new Uint8Array(buffer),
  });
  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`${driver.toUpperCase()} upload failed (${resp.status}): ${errText}`);
  }

  const publicUrl = config.publicBaseUrl
    ? `${config.publicBaseUrl.replace(/\/+$/, "")}/${safeKey}`
    : url;

  return {
    driver,
    key: safeKey,
    url: publicUrl,
    sizeBytes: buffer.length,
  };
}

/**
 * Delete a file from the active storage driver.
 */
export async function deleteFile(
  key: string,
  driverOverride?: StorageDriver
): Promise<{ deleted: boolean; driver: StorageDriver; key: string }> {
  const { driver, config } = await resolveStorageDriver(driverOverride);
  const safeKey = sanitizeKey(key);

  if (driver === "local") {
    const target = resolveLocalPath(safeKey, config.baseDir);
    await fs.unlink(target).catch((err: NodeJS.ErrnoException) => {
      if (err.code !== "ENOENT") throw err;
    });
    return { deleted: true, driver, key: safeKey };
  }

  if (driver === "ftp") {
    const remotePath = [config.basePath?.replace(/\/+$/, ""), safeKey]
      .filter(Boolean)
      .join("/");
    await withFtpClient(config, async (cmd) => {
      const resp = await cmd(`DELE ${remotePath}`);
      if (resp.code >= 400 && resp.code !== 550) {
        throw new Error(`FTP DELE failed: ${resp.text}`);
      }
    });
    return { deleted: true, driver, key: safeKey };
  }

  if (!config.accessKeyId || !config.secretAccessKey) {
    throw new Error(`${driver.toUpperCase()} requires accessKeyId and secretAccessKey.`);
  }
  const { url, region } = resolveS3Endpoint(driver, config, safeKey);
  const headers = signAwsV4Request({
    method: "DELETE",
    url,
    region,
    service: "s3",
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
  });

  const resp = await fetch(url, { method: "DELETE", headers });
  if (!resp.ok && resp.status !== 404) {
    const errText = await resp.text();
    throw new Error(`${driver.toUpperCase()} delete failed (${resp.status}): ${errText}`);
  }

  return { deleted: true, driver, key: safeKey };
}

/**
 * Generate a time-limited signed URL for downloading an object.
 */
export async function getSignedUrl(
  key: string,
  expiresInSeconds = 900,
  driverOverride?: StorageDriver
): Promise<string> {
  const { driver, config } = await resolveStorageDriver(driverOverride);
  const safeKey = sanitizeKey(key);

  if (driver === "local" || driver === "ftp") {
    const base =
      config.publicBaseUrl?.replace(/\/+$/, "") ??
      `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/media/file`;
    const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const secret =
      config.signingSecret ?? process.env.ENCRYPTION_KEY ?? "webservicers-sign";
    const sig = crypto
      .createHmac("sha256", secret)
      .update(`${safeKey}:${exp}`)
      .digest("hex");
    return `${base}/${safeKey}?exp=${exp}&sig=${sig}`;
  }

  if (!config.accessKeyId || !config.secretAccessKey) {
    throw new Error(`${driver.toUpperCase()} requires accessKeyId and secretAccessKey.`);
  }
  const { url, region } = resolveS3Endpoint(driver, config, safeKey);
  return createAwsV4PresignedUrl({
    method: "GET",
    url,
    region,
    service: "s3",
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    expiresInSeconds,
  });
}
