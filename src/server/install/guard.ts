import fs from "node:fs";
import path from "node:path";

const LOCK_FILE = path.join(process.cwd(), "storage", ".install-locked");

export function isInstallLocked(): boolean {
  return fs.existsSync(LOCK_FILE);
}

export function lockInstaller(meta: { domain?: string; adminEmail?: string } = {}): void {
  const dir = path.dirname(LOCK_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(
    LOCK_FILE,
    JSON.stringify(
      {
        locked: true,
        installedAt: new Date().toISOString(),
        ...meta,
      },
      null,
      2
    ),
    "utf8"
  );
}
