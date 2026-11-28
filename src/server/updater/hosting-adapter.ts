import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import https from "node:https";
import { URL } from "node:url";

export interface HostingEnvironmentCheck {
  ok: boolean;
  platform: string;
  nodeVersion: string;
  hasWritePermissions: boolean;
  freeSpaceBytes?: number;
  warnings: string[];
}

export interface IHostingAdapter {
  name: string;
  validateEnvironment(rootDir: string): Promise<HostingEnvironmentCheck>;
  restartApplication(rootDir: string): Promise<{ ok: boolean; method: string; message: string }>;
  verifyHealth(url: string, timeoutMs?: number): Promise<{ healthy: boolean; statusCode?: number; details?: any }>;
}

export class CpanelPassengerAdapter implements IHostingAdapter {
  public readonly name = "cPanel LiteSpeed / Phusion Passenger";

  public async validateEnvironment(rootDir: string): Promise<HostingEnvironmentCheck> {
    const warnings: string[] = [];
    let hasWritePermissions = false;

    try {
      const testFile = path.join(rootDir, `.write_test_${Date.now()}`);
      fs.writeFileSync(testFile, "test", "utf8");
      fs.unlinkSync(testFile);
      hasWritePermissions = true;
    } catch (err) {
      warnings.push(`Write permission check failed in root directory: ${String(err)}`);
    }

    // Ensure tmp directory exists for Passenger restarts
    const tmpDir = path.join(rootDir, "tmp");
    try {
      fs.mkdirSync(tmpDir, { recursive: true });
    } catch (err) {
      warnings.push(`Unable to create tmp directory for Passenger restart trigger: ${String(err)}`);
    }

    return {
      ok: hasWritePermissions,
      platform: process.platform,
      nodeVersion: process.version,
      hasWritePermissions,
      warnings,
    };
  }

  /**
   * Triggers a graceful reload in Phusion Passenger & LiteSpeed Web Server.
   * On cPanel / CloudLinux / LiteSpeed:
   * 1. Touches `tmp/restart.txt` (standard Phusion Passenger reload mechanism)
   * 2. Touches `.htaccess` (triggers LiteSpeed external application process recycle)
   */
  public async restartApplication(rootDir: string): Promise<{ ok: boolean; method: string; message: string }> {
    const tmpDir = path.join(rootDir, "tmp");
    const restartFile = path.join(tmpDir, "restart.txt");
    const htaccessFile = path.join(rootDir, ".htaccess");

    fs.mkdirSync(tmpDir, { recursive: true });

    const now = new Date();
    const touched: string[] = [];

    try {
      if (fs.existsSync(restartFile)) {
        fs.utimesSync(restartFile, now, now);
      } else {
        fs.writeFileSync(restartFile, `Restart triggered at ${now.toISOString()}\n`, "utf8");
      }
      touched.push("tmp/restart.txt");
    } catch (err) {
      console.warn("[HostingAdapter] Warning: failed to touch tmp/restart.txt:", err);
    }

    try {
      if (fs.existsSync(htaccessFile)) {
        fs.utimesSync(htaccessFile, now, now);
        touched.push(".htaccess");
      }
    } catch (err) {
      console.warn("[HostingAdapter] Warning: failed to touch .htaccess:", err);
    }

    if (touched.length > 0) {
      return {
        ok: true,
        method: "passenger_and_litespeed_reload",
        message: `Application restart signaled via ${touched.join(" and ")} for cPanel/LiteSpeed.`,
      };
    }

    return {
      ok: false,
      method: "passenger_restart_failed",
      message: "Failed to signal restart via tmp/restart.txt or .htaccess.",
    };
  }

  /**
   * Polls the health endpoint with exponential backoff.
   */
  public async verifyHealth(url: string, timeoutMs = 30000): Promise<{ healthy: boolean; statusCode?: number; details?: any }> {
    const start = Date.now();
    const parsed = new URL(url);
    const client = parsed.protocol === "https:" ? https : http;

    while (Date.now() - start < timeoutMs) {
      try {
        const res = await new Promise<{ statusCode: number; body: string }>((resolve, reject) => {
          const req = client.get(url, { timeout: 4000 }, (r) => {
            let data = "";
            r.on("data", (c) => (data += c));
            r.on("end", () => resolve({ statusCode: r.statusCode || 500, body: data }));
          });
          req.on("error", reject);
          req.on("timeout", () => {
            req.destroy();
            reject(new Error("Health check timeout"));
          });
        });

        if (res.statusCode >= 200 && res.statusCode < 300) {
          let details: any = null;
          try {
            details = JSON.parse(res.body);
          } catch (_) {}
          return { healthy: true, statusCode: res.statusCode, details };
        }
      } catch (_) {
        // Retry
      }

      // Wait 1.5s before next attempt
      await new Promise((r) => setTimeout(r, 1500));
    }

    return { healthy: false, statusCode: 504, details: "Health verification timed out." };
  }
}
