import fs from "node:fs";
import path from "node:path";

export interface ActiveReleasePointer {
  version: string;
  releaseDir: string;
  activatedAt: string;
  previousVersion?: string;
}

export class ReleaseBootstrapManager {
  private rootDir: string;

  constructor(rootDir?: string) {
    this.rootDir = rootDir || process.cwd();
  }

  /**
   * Resolves the active application release directory.
   * Priority:
   * 1. Symlink: `current` pointing to `releases/vX.Y.Z`
   * 2. Atomic Pointer: `active-release.json`
   * 3. Fallback: application root directory (legacy unmigrated layout)
   */
  public resolveActiveRelease(): {
    version: string;
    releasePath: string;
    source: "symlink" | "pointer" | "legacy_root";
  } {
    // 1. Check symlink `current`
    const currentSymlink = path.join(this.rootDir, "current");
    try {
      if (fs.existsSync(currentSymlink)) {
        const stat = fs.lstatSync(currentSymlink);
        if (stat.isSymbolicLink()) {
          const resolved = fs.realpathSync(currentSymlink);
          const pkgPath = path.join(resolved, "package.json");
          let version = "1.0.0";
          if (fs.existsSync(pkgPath)) {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
            version = pkg.version || version;
          }
          return { version, releasePath: resolved, source: "symlink" };
        }
      }
    } catch (_) {}

    // 2. Check atomic pointer file `active-release.json`
    const pointerFile = path.join(this.rootDir, "active-release.json");
    if (fs.existsSync(pointerFile)) {
      try {
        const pointer: ActiveReleasePointer = JSON.parse(fs.readFileSync(pointerFile, "utf8"));
        const releasePath = path.isAbsolute(pointer.releaseDir)
          ? pointer.releaseDir
          : path.join(this.rootDir, pointer.releaseDir);

        if (fs.existsSync(releasePath)) {
          return {
            version: pointer.version,
            releasePath,
            source: "pointer",
          };
        }
      } catch (err) {
        console.warn("[BootstrapManager] Warning: failed to parse active-release.json:", err);
      }
    }

    // 3. Fallback to legacy unmigrated app root
    let version = "1.0.0";
    const rootPkg = path.join(this.rootDir, "package.json");
    if (fs.existsSync(rootPkg)) {
      try {
        version = JSON.parse(fs.readFileSync(rootPkg, "utf8")).version || version;
      } catch (_) {}
    }

    return {
      version,
      releasePath: this.rootDir,
      source: "legacy_root",
    };
  }

  /**
   * Initializes and ensures the shared persistent storage structure.
   */
  public ensureSharedStorage(): {
    sharedDir: string;
    uploadsDir: string;
    backupsDir: string;
    logsDir: string;
  } {
    const sharedDir = path.join(this.rootDir, "shared");
    const uploadsDir = path.join(sharedDir, "storage", "uploads");
    const backupsDir = path.join(sharedDir, "storage", "backups");
    const logsDir = path.join(sharedDir, "storage", "logs");

    fs.mkdirSync(uploadsDir, { recursive: true });
    fs.mkdirSync(backupsDir, { recursive: true });
    fs.mkdirSync(logsDir, { recursive: true });

    // Sync .env to shared/.env if shared/.env does not exist yet
    const sharedEnv = path.join(sharedDir, ".env");
    const rootEnv = path.join(this.rootDir, ".env");
    if (!fs.existsSync(sharedEnv) && fs.existsSync(rootEnv)) {
      fs.copyFileSync(rootEnv, sharedEnv);
    }

    return { sharedDir, uploadsDir, backupsDir, logsDir };
  }

  /**
   * Atomically swaps the active release pointer.
   * Tries symlink first, then falls back to atomic active-release.json.
   */
  public async activateRelease(
    version: string,
    releaseDir: string,
    previousVersion?: string
  ): Promise<{ ok: boolean; method: "symlink" | "pointer"; activePath: string }> {
    const currentSymlink = path.join(this.rootDir, "current");
    const pointerFile = path.join(this.rootDir, "active-release.json");
    const tempPointerFile = path.join(this.rootDir, "active-release.json.tmp");

    let symlinkSuccess = false;

    // 1. Try atomic symlink swap
    try {
      const tempSymlink = path.join(this.rootDir, `current.tmp.${Date.now()}`);
      if (process.platform === "win32") {
        fs.symlinkSync(releaseDir, tempSymlink, "junction");
      } else {
        fs.symlinkSync(releaseDir, tempSymlink);
      }

      // Rename temp symlink to current atomically
      if (fs.existsSync(currentSymlink)) {
        fs.unlinkSync(currentSymlink);
      }
      fs.renameSync(tempSymlink, currentSymlink);
      symlinkSuccess = true;
    } catch (symlinkErr) {
      console.warn("[BootstrapManager] Symlink swap unsupported or failed, using atomic JSON pointer fallback:", symlinkErr);
    }

    // 2. Always write atomic active-release.json pointer (write temp + atomic rename)
    const pointerData: ActiveReleasePointer = {
      version,
      releaseDir: path.relative(this.rootDir, releaseDir).replace(/\\/g, "/"),
      activatedAt: new Date().toISOString(),
      previousVersion,
    };

    fs.writeFileSync(tempPointerFile, JSON.stringify(pointerData, null, 2), "utf8");
    fs.renameSync(tempPointerFile, pointerFile);

    return {
      ok: true,
      method: symlinkSuccess ? "symlink" : "pointer",
      activePath: releaseDir,
    };
  }

  /**
   * Retention rotation: Prunes old releases, keeping the active release and the last N releases.
   */
  public pruneOldReleases(maxKeep = 3): string[] {
    const releasesDir = path.join(this.rootDir, "releases");
    if (!fs.existsSync(releasesDir)) return [];

    const active = this.resolveActiveRelease();
    const entries = fs.readdirSync(releasesDir, { withFileTypes: true });
    const releaseFolders = entries
      .filter((e) => e.isDirectory() && e.name.startsWith("v"))
      .map((e) => ({
        name: e.name,
        path: path.join(releasesDir, e.name),
        mtime: fs.statSync(path.join(releasesDir, e.name)).mtimeMs,
      }))
      .sort((a, b) => b.mtime - a.mtime);

    const deleted: string[] = [];

    // Keep active release and last (maxKeep - 1) releases
    const toKeep = new Set<string>();
    toKeep.add(path.resolve(active.releasePath));

    let keptCount = 0;
    for (const rel of releaseFolders) {
      const resolved = path.resolve(rel.path);
      if (toKeep.has(resolved)) {
        keptCount++;
        continue;
      }
      if (keptCount < maxKeep) {
        toKeep.add(resolved);
        keptCount++;
      } else {
        try {
          fs.rmSync(rel.path, { recursive: true, force: true });
          deleted.push(rel.name);
        } catch (delErr) {
          console.warn(`[BootstrapManager] Failed to prune release directory ${rel.name}:`, delErr);
        }
      }
    }

    return deleted;
  }
}
