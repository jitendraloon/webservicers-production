import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

console.log("[PackCpanelZip] Starting clean, optimized cPanel packaging...");

const stagingDir = path.join(rootDir, ".staging-cpanel-build");
if (fs.existsSync(stagingDir)) {
  fs.rmSync(stagingDir, { recursive: true, force: true });
}
fs.mkdirSync(stagingDir, { recursive: true });

// 1. Copy source files into staging
const itemsToCopy = [
  ".env.example",
  ".gitignore",
  "CPANEL_INSTALL_GUIDE.md",
  "CPANEL_UPDATER_INSTALLATION.md",
  "app.js",
  "next.config.mjs",
  "next-env.d.ts",
  "package.json",
  "package-lock.json",
  "postcss.config.mjs",
  "server.js",
  "tsconfig.json",
  "prisma",
  "scripts",
  "src",
  "storage",
  "updater",
];

console.log("[PackCpanelZip] Copying project files into staging...");
for (const item of itemsToCopy) {
  const srcPath = path.join(rootDir, item);
  const destPath = path.join(stagingDir, item);
  if (!fs.existsSync(srcPath)) continue;
  fs.cpSync(srcPath, destPath, {
    recursive: true,
    filter: (src) => {
      const base = path.basename(src);
      if (base === ".git" || base === "cache" || base.endsWith(".zip") || base.endsWith(".bak")) return false;
      return true;
    },
  });
}

// 2. Copy production .next build (excluding cache)
console.log("[PackCpanelZip] Copying .next production build...");
const nextDest = path.join(stagingDir, ".next");
fs.mkdirSync(nextDest, { recursive: true });
fs.cpSync(path.join(rootDir, ".next"), nextDest, {
  recursive: true,
  filter: (src) => {
    const rel = path.relative(path.join(rootDir, ".next"), src).replace(/\\/g, "/");
    if (rel.startsWith("cache")) return false;
    return true;
  },
});

// Self-healing fix for Next.js App Router on cPanel/Linux
console.log("[PackCpanelZip] Healing Next.js build artifacts for Linux/cPanel...");
// 2a. routes-manifest.json
const routesManifestPath = path.join(nextDest, "routes-manifest.json");
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

// 2b. required-server-files.json (normalize paths for Linux)
const reqFilesPath = path.join(nextDest, "required-server-files.json");
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

// 2c. preview-props.json
const serverDir = path.join(nextDest, "server");
fs.mkdirSync(serverDir, { recursive: true });
const previewPropsPath = path.join(serverDir, "preview-props.json");
let previewData = {
  previewModeId: "87a6983c344e1a516c690244e638afd8",
  previewModeSigningKey: "0601d94f4c324120c2954e8e25147d0be2967491af23c4e2d31d6b82c4fa1a92",
  previewModeEncryptionKey: "0dc0b0e97cdcf8af13087a2184693cab28689308c9322b957b1c6f6696084161",
};
const prerenderManifestPath = path.join(nextDest, "prerender-manifest.json");
if (fs.existsSync(prerenderManifestPath)) {
  try {
    const pm = JSON.parse(fs.readFileSync(prerenderManifestPath, "utf8"));
    if (pm.preview) previewData = pm.preview;
  } catch (_) {}
}
fs.writeFileSync(previewPropsPath, JSON.stringify(previewData, null, 2), "utf8");

// 3. Install production-only dependencies in staging
console.log("[PackCpanelZip] Running clean npm install --omit=dev in staging...");
const t0 = Date.now();
execSync("npm install --omit=dev --legacy-peer-deps --no-audit --no-fund", {
  cwd: stagingDir,
  stdio: "inherit",
});
console.log(`[PackCpanelZip] npm install finished in ${((Date.now() - t0) / 1000).toFixed(1)}s.`);

// 4. Configure native MariaDB/MySQL schema and generate Prisma Client with Linux targets
const stagingSchemaMysql = path.join(stagingDir, "prisma", "schema.mysql.prisma");
const stagingSchema = path.join(stagingDir, "prisma", "schema.prisma");
if (fs.existsSync(stagingSchemaMysql)) {
  fs.copyFileSync(stagingSchemaMysql, stagingSchema);
  console.log("[PackCpanelZip] Configured prisma/schema.prisma for native MariaDB/MySQL.");
}

console.log("[PackCpanelZip] Generating Prisma Client for MySQL with Linux targets...");
execSync("npx prisma generate", {
  cwd: stagingDir,
  stdio: "inherit",
});

// Copy Linux SWC binaries for Next.js 15 glibc/musl
const swcTargets = ["swc-linux-x64-gnu", "swc-linux-x64-musl"];
for (const target of swcTargets) {
  const swcSrc = path.join(rootDir, "node_modules", "@next", target);
  const swcDest = path.join(stagingDir, "node_modules", "@next", target);
  if (fs.existsSync(swcSrc)) {
    fs.mkdirSync(path.dirname(swcDest), { recursive: true });
    fs.cpSync(swcSrc, swcDest, { recursive: true });
    console.log(`[PackCpanelZip] Bundled @next/${target} native binary.`);
  }
}

// 5. Ensure storage directories exist in staging
const storageDir = path.join(stagingDir, "storage");
fs.mkdirSync(storageDir, { recursive: true });

// 6. Create production zip archive
const tempZip = path.join(rootDir, "Cpanel_dash_Webservicers_NextZen.temp.zip");
if (fs.existsSync(tempZip)) fs.unlinkSync(tempZip);

console.log("[PackCpanelZip] Creating zip archive with tar...");
const t1 = Date.now();

// Archive all files inside stagingDir
execSync(`tar -a -cf "${tempZip}" * .env.example .gitignore .next`, {
  cwd: stagingDir,
  stdio: "inherit",
  windowsHide: true,
  maxBuffer: 200 * 1024 * 1024,
});

console.log(`[PackCpanelZip] Tar completed in ${((Date.now() - t1) / 1000).toFixed(1)}s.`);

const finalZip = path.join(rootDir, "Cpanel_dash_Webservicers_NextZen.zip");
if (fs.existsSync(finalZip)) {
  const bakZip = path.join(rootDir, "Cpanel_dash_Webservicers_NextZen.old.bak");
  if (fs.existsSync(bakZip)) fs.unlinkSync(bakZip);
  fs.renameSync(finalZip, bakZip);
}
fs.renameSync(tempZip, finalZip);

// Clean up staging
try {
  fs.rmSync(stagingDir, { recursive: true, force: true });
} catch (_) {}

// Mirror to Kilo workspace
const altZip = path.join(
  "C:/Users/jiten/Desktop/Kilo/WebServicers_NextGen/Gemini",
  "Cpanel_dash_Webservicers_NextZen.zip"
);
try {
  fs.copyFileSync(finalZip, altZip);
  console.log(`[PackCpanelZip] Mirrored to workspace: ${altZip}`);
} catch (e) {
  console.warn(`[PackCpanelZip] Mirrored copy skipped: ${e.message}`);
}

const stat = fs.statSync(finalZip);
const sizeMB = (stat.size / (1024 * 1024)).toFixed(2);
console.log(`\n========================================`);
console.log(`[PackCpanelZip] SUCCESS!`);
console.log(`[PackCpanelZip] Final Archive Size: ${sizeMB} MB (${stat.size} bytes)`);
console.log(`========================================\n`);

// Verify contents
const entries = execSync(`tar -tf "${finalZip}"`, {
  maxBuffer: 100 * 1024 * 1024,
  encoding: "utf8",
})
  .split(/[\r\n]+/)
  .filter(Boolean);

console.log(`[PackCpanelZip] Total entries in archive: ${entries.length}`);

const keyChecks = [
  ".next/server/app/(marketing)/install/page.js",
  ".next/server/app/api/install/check/route.js",
  ".next/server/app/(portal)/dashboard/invoices/page.js",
  ".next/server/app/(portal)/dashboard/add-funds/page.js",
  ".next/server/app/(admin)/admin/maintenance/backups/page.js",
  ".next/server/app/(admin)/admin/maintenance/updates/page.js",
  "node_modules/@prisma/client",
  "node_modules/next",
  "node_modules/prisma",
  "node_modules/@next/swc-linux-x64-gnu",
  "server.js",
  "app.js",
  "package.json",
  "CPANEL_INSTALL_GUIDE.md",
];

let allPassed = true;
for (const item of keyChecks) {
  const found = entries.some(
    (e) => e === item || e.endsWith(item) || e.replace(/\\/g, "/").includes(item)
  );
  if (!found) allPassed = false;
  console.log(`  - [${found ? "OK" : "MISSING"}] ${item}`);
}

if (!allPassed) {
  throw new Error("Critical files missing from generated zip!");
}
console.log("[PackCpanelZip] All verification checks passed!");
