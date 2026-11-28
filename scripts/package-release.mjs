import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Packages a production release of WebServicers for the Automated Updater.
 * Usage: node scripts/package-release.mjs [version] [channel] [format]
 */
async function main() {
  const rootDir = path.resolve(__dirname, "..");
  const pkgJson = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf8"));

  const version = process.argv[2] || pkgJson.version || "1.0.1";
  const channel = process.argv[3] || (version.includes("-") ? "beta" : "stable");
  const format = (process.argv[4] || (process.platform === "win32" ? "zip" : "tar.gz")).toLowerCase();
  const outputDir = path.join(rootDir, "dist-release", `v${version}`);

  console.log(`[PackageRelease] Packaging WebServicers v${version} (${channel}, format: ${format})...`);

  fs.mkdirSync(outputDir, { recursive: true });

  const archiveName = `webservicers-v${version}.${format === "zip" ? "zip" : "tar.gz"}`;
  const archivePath = path.join(outputDir, archiveName);

  const stagingDir = path.join(outputDir, "staging");
  if (fs.existsSync(stagingDir)) {
    fs.rmSync(stagingDir, { recursive: true, force: true });
  }
  fs.mkdirSync(stagingDir, { recursive: true });

  const includePaths = [
    ".next",
    "prisma",
    "server.js",
    "app.js",
    "next.config.mjs",
    "package.json",
    "src",
    "scripts",
  ];

  for (const item of includePaths) {
    const src = path.join(rootDir, item);
    if (fs.existsSync(src)) {
      const dest = path.join(stagingDir, item);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.cpSync(src, dest, {
        recursive: true,
        filter: (srcPath) =>
          !srcPath.includes("cache") &&
          !srcPath.includes(".git") &&
          !srcPath.includes("package-release.mjs") &&
          !srcPath.includes("build-cpanel-zip.mjs"),
      });
    }
  }

  // Ensure production release uses native MariaDB/MySQL Prisma schema
  const stagingSchemaMysql = path.join(stagingDir, "prisma", "schema.mysql.prisma");
  const stagingSchema = path.join(stagingDir, "prisma", "schema.prisma");
  if (fs.existsSync(stagingSchemaMysql)) {
    fs.copyFileSync(stagingSchemaMysql, stagingSchema);
    console.log("[PackageRelease] Configured prisma/schema.prisma for native MariaDB/MySQL.");
  }

  // Pre-harden Next.js artifacts in release staging (prevents cPanel/Passenger errors)
  try {
    const stagingNext = path.join(stagingDir, ".next");
    const routesManifestPath = path.join(stagingNext, "routes-manifest.json");
    if (fs.existsSync(routesManifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(routesManifestPath, "utf8"));
      manifest.dataRoutes = Array.isArray(manifest.dataRoutes) ? manifest.dataRoutes : [];
      manifest.dynamicRoutes = Array.isArray(manifest.dynamicRoutes) ? manifest.dynamicRoutes : [];
      manifest.redirects = Array.isArray(manifest.redirects) ? manifest.redirects : [];
      manifest.headers = Array.isArray(manifest.headers) ? manifest.headers : [];

      if (!manifest.rewrites || Array.isArray(manifest.rewrites)) {
        manifest.rewrites = {
          beforeFiles: [],
          afterFiles: Array.isArray(manifest.rewrites) ? manifest.rewrites : [],
          fallback: [],
        };
      } else {
        manifest.rewrites.beforeFiles = Array.isArray(manifest.rewrites.beforeFiles) ? manifest.rewrites.beforeFiles : [];
        manifest.rewrites.afterFiles = Array.isArray(manifest.rewrites.afterFiles) ? manifest.rewrites.afterFiles : [];
        manifest.rewrites.fallback = Array.isArray(manifest.rewrites.fallback) ? manifest.rewrites.fallback : [];
      }
      fs.writeFileSync(routesManifestPath, JSON.stringify(manifest, null, 2), "utf8");
    }

    const reqFilesPath = path.join(stagingNext, "required-server-files.json");
    if (fs.existsSync(reqFilesPath)) {
      const reqFiles = JSON.parse(fs.readFileSync(reqFilesPath, "utf8"));
      reqFiles.appDir = "";
      reqFiles.relativeAppDir = "";
      if (Array.isArray(reqFiles.files)) {
        reqFiles.files = reqFiles.files.map((f) => f.replace(/\\/g, "/"));
      }
      if (Array.isArray(reqFiles.ignore)) {
        reqFiles.ignore = reqFiles.ignore.map((f) => f.replace(/\\/g, "/"));
      }
      fs.writeFileSync(reqFilesPath, JSON.stringify(reqFiles, null, 2), "utf8");
    }

    const serverDir = path.join(stagingNext, "server");
    fs.mkdirSync(serverDir, { recursive: true });
    const previewPropsPath = path.join(serverDir, "preview-props.json");
    let previewData = {
      previewModeId: "87a6983c344e1a516c690244e638afd8",
      previewModeSigningKey: "0601d94f4c324120c2954e8e25147d0be2967491af23c4e2d31d6b82c4fa1a92",
      previewModeEncryptionKey: "0dc0b0e97cdcf8af13087a2184693cab28689308c9322b957b1c6f6696084161",
    };
    const prerenderManifestPath = path.join(stagingNext, "prerender-manifest.json");
    if (fs.existsSync(prerenderManifestPath)) {
      try {
        const pm = JSON.parse(fs.readFileSync(prerenderManifestPath, "utf8"));
        if (pm.preview) previewData = pm.preview;
      } catch (_) {}
    }
    fs.writeFileSync(previewPropsPath, JSON.stringify(previewData, null, 2), "utf8");
    console.log("[PackageRelease] Hardened .next artifacts with required files and forward slashes.");
  } catch (err) {
    console.warn("[PackageRelease] Warning during Next.js artifacts hardening:", err);
  }

  console.log(`[PackageRelease] Compressing staging into: ${archivePath}...`);

  if (format === "zip" && process.platform === "win32") {
    try {
      execSync(`tar -a -cf "${archivePath}" *`, { cwd: stagingDir, stdio: "ignore" });
    } catch (_) {
      execSync(
        `powershell -NoProfile -Command "Compress-Archive -Path '${stagingDir}\\*' -DestinationPath '${archivePath}' -Force"`,
        { stdio: "ignore" }
      );
    }
  } else {
    try {
      execSync(`tar -czf "${archivePath}" -C "${stagingDir}" .`, { stdio: "ignore" });
    } catch (_) {
      // Fallback powershell zip if tar fails
      execSync(
        `powershell -NoProfile -Command "Compress-Archive -Path '${stagingDir}\\*' -DestinationPath '${archivePath}' -Force"`,
        { stdio: "ignore" }
      );
    }
  }

  if (!fs.existsSync(archivePath)) {
    throw new Error(`Failed to create release archive at: ${archivePath}`);
  }

  // Compute Checksum & Size
  const stat = fs.statSync(archivePath);
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(archivePath));
  const sha256 = hash.digest("hex");

  // Generate release-manifest.json
  const manifest = {
    app: "webservicers",
    version,
    channel,
    releaseDate: new Date().toISOString(),
    minAppVersion: "1.0.0",
    minNodeVersion: "18.0.0",
    minUpdaterVersion: "1.0.0",
    package: {
      filename: archiveName,
      sizeBytes: stat.size,
      sha256,
      format: format === "zip" ? "zip" : "tar.gz",
    },
    migrations: {
      hasMigrations: fs.existsSync(path.join(rootDir, "prisma", "migrations")),
      migrationType: "safe",
      targetEngines: ["mysql", "mariadb", "sqlite"],
    },
    maintenance: {
      requiresRestart: true,
      estimatedDowntimeSeconds: 5,
    },
    changelog: `### WebServicers v${version}
- Streamlined Providers & APIs navigation: consolidated under SMM Panel Manager (/admin/smm/providers) and removed redundant duplicate /admin/providers.
- Complete Product Catalog Suite: Products with full edit/manage modal, Create Product, Product Categories with edit/sort, and Product Requirements bank.
- Full Orders Suite: Browse Orders, Custom Order Creation, Cancellation Requests queue with refund controls, Abandoned Checkout recovery with automated background nudges.
- Dedicated Order Workspace (/admin/orders/[id] & /dashboard/orders/[id]): Interactive Project Requirements fulfillment and real-time bidirectional customer/admin order conversations.`,
    security: {
      isSecurityPatch: false,
    },
  };

  const manifestPath = path.join(outputDir, "release-manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
  console.log(`[PackageRelease] Generated release manifest: ${manifestPath}`);

  // Sign the manifest
  const privKeyPath = path.join(rootDir, "src", "server", "updater", "keys", "release-privkey-dev.pem");
  if (fs.existsSync(privKeyPath) || process.env.UPDATER_RELEASE_PRIVATE_KEY) {
    const privKey = process.env.UPDATER_RELEASE_PRIVATE_KEY || fs.readFileSync(privKeyPath, "utf8");
    const sig = crypto.sign(null, fs.readFileSync(manifestPath), privKey);
    const sigPath = path.join(outputDir, "release-manifest.json.sig");
    fs.writeFileSync(sigPath, sig.toString("base64"), "utf8");
    console.log(`[PackageRelease] Generated digital signature: ${sigPath}`);
  }

  // Clean staging
  fs.rmSync(stagingDir, { recursive: true, force: true });
  console.log(`[PackageRelease] Release v${version} packaged successfully!`);
}

main().catch((err) => {
  console.error("[PackageRelease] Packaging failed:", err);
  process.exit(1);
});
