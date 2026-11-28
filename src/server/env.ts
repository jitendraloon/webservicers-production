import fs from "node:fs";
import path from "node:path";

let envLoaded = false;

/**
 * Ensure environment variables from .env and .env.local are actively populated
 * in process.env, even if the Node server process was not yet restarted after /install.
 */
export function ensureEnvLoaded(force = false): void {
  if (
    !force &&
    envLoaded &&
    process.env.DATABASE_URL &&
    !process.env.DATABASE_URL.includes("cpanel_installer") &&
    !process.env.DATABASE_URL.includes("placeholder") &&
    process.env.ENCRYPTION_KEY
  ) {
    return;
  }

  try {
    const rootDir = process.cwd();
    const candidates = [
      path.join(rootDir, ".env.local"),
      path.join(rootDir, ".env"),
    ];

    for (const file of candidates) {
      if (fs.existsSync(file)) {
        const text = fs.readFileSync(file, "utf8");
        const lines = text.split(/\r?\n/);
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) continue;
          const eq = trimmed.indexOf("=");
          if (eq > 0) {
            const key = trimmed.slice(0, eq).trim();
            let val = trimmed.slice(eq + 1).trim();
            if (
              (val.startsWith('"') && val.endsWith('"')) ||
              (val.startsWith("'") && val.endsWith("'"))
            ) {
              val = val.slice(1, -1);
            }
            const curVal = process.env[key];
            if (
              force ||
              !curVal ||
              curVal.trim() === "" ||
              curVal.includes("cpanel_installer") ||
              curVal.includes("placeholder")
            ) {
              process.env[key] = val;
            }
          }
        }
      }
    }
    envLoaded = true;
  } catch (err) {
    console.error("[env] Error loading environment files:", err);
  }
}

// Automatically execute upon module evaluation
ensureEnvLoaded();
