import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

console.log("[DeployCleanProduction] Starting clean production repository generation...");

const stagingDir = path.join(rootDir, "..", "webservicers-production-clean");
if (fs.existsSync(stagingDir)) {
  fs.rmSync(stagingDir, { recursive: true, force: true });
}
fs.mkdirSync(stagingDir, { recursive: true });

// 1. Copy source files into clean production staging
const itemsToCopy = [
  ".env.example",
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
  "public",
  "scripts",
  "src",
  "storage",
  "updater",
];

console.log("[DeployCleanProduction] Copying clean source files...");
for (const item of itemsToCopy) {
  const srcPath = path.join(rootDir, item);
  const destPath = path.join(stagingDir, item);
  if (!fs.existsSync(srcPath)) continue;
  fs.cpSync(srcPath, destPath, {
    recursive: true,
    filter: (src) => {
      const base = path.basename(src);
      if (
        base === ".git" ||
        base === "cache" ||
        base === "node_modules" ||
        base.endsWith(".zip") ||
        base.endsWith(".bak")
      ) {
        return false;
      }
      return true;
    },
  });
}

// 2. Configure native MariaDB/MySQL schema
console.log("[DeployCleanProduction] Configuring native MariaDB/MySQL schema...");
const stagingSchemaMysql = path.join(stagingDir, "prisma", "schema.mysql.prisma");
const stagingSchema = path.join(stagingDir, "prisma", "schema.prisma");
if (fs.existsSync(stagingSchemaMysql)) {
  fs.copyFileSync(stagingSchemaMysql, stagingSchema);
}

// 3. Prepare package.json with production start & postinstall hooks
console.log("[DeployCleanProduction] Configuring package.json for cPanel Passenger...");
const pkgPath = path.join(stagingDir, "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
pkg.scripts = {
  ...pkg.scripts,
  start: "node server.js",
  postinstall: "prisma generate",
};
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), "utf8");

// 4. Create .cpanel.yml for automated cPanel Git Versioning deployment
console.log("[DeployCleanProduction] Writing .cpanel.yml deployment descriptor...");
const cpanelYml = `---
deployment:
  tasks:
    - export DEPLOYPATH=/home/$USER/dev.webservicers.com/
    - /bin/cp -R * $DEPLOYPATH 2>/dev/null || true
    - /bin/cp -R .next $DEPLOYPATH 2>/dev/null || true
    - /bin/cp .env.example $DEPLOYPATH 2>/dev/null || true
`;
fs.writeFileSync(path.join(stagingDir, ".cpanel.yml"), cpanelYml, "utf8");

// 5. Create production .gitignore (NEVER ignore .next except .next/cache)
console.log("[DeployCleanProduction] Writing production .gitignore...");
const gitignoreContent = `# Production dependencies
node_modules/
.pnp
.pnp.*

# Local environment & databases
.env
.env*.local
.env.production
*.db
*.db-journal

# Next.js build cache only (KEEP prebuilt server, static, and manifests!)
.next/cache/

# Debug & temporary files
npm-debug.log*
yarn-debug.log*
yarn-error.log*
*.zip
*.tar
*.tar.gz
*.bak
tmp/
cpanel_error.log
`;
fs.writeFileSync(path.join(stagingDir, ".gitignore"), gitignoreContent, "utf8");

// 6. Copy pre-built production .next (excluding cache)
console.log("[DeployCleanProduction] Copying pre-built production .next build...");
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

// 7. Heal Next.js build manifests for Linux/cPanel Passenger
console.log("[DeployCleanProduction] Healing Next.js build manifests for Linux/cPanel...");

// 7a. routes-manifest.json
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

// 7b. required-server-files.json (normalize paths for Linux)
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

// 7c. preview-props.json
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

// 8. Initialize clean Git repository and force push to webservicers-production
console.log("[DeployCleanProduction] Initializing clean Git repository...");
execSync("git init -b main", { cwd: stagingDir, stdio: "inherit" });
execSync("git config user.name \"Jitendra Loon\"", { cwd: stagingDir, stdio: "inherit" });
execSync("git config user.email \"admin@webservicers.com\"", { cwd: stagingDir, stdio: "inherit" });

console.log("[DeployCleanProduction] Staging all files...");
execSync("git add .", { cwd: stagingDir, stdio: "inherit" });

console.log("[DeployCleanProduction] Committing clean release v1.0.14...");
execSync(
  "git commit -m \"feat(production): v1.0.14 - completely clean production release pre-built for cPanel LiteSpeed & CloudLinux\"",
  { cwd: stagingDir, stdio: "inherit" }
);

console.log("[DeployCleanProduction] Setting remote webservicers-production...");
const prodRepoUrl = "https://github.com/jitendraloon/webservicers-production.git";
execSync(`git remote add origin ${prodRepoUrl}`, { cwd: stagingDir, stdio: "inherit" });

console.log("[DeployCleanProduction] Force pushing clean repository to webservicers-production...");
execSync("git push --force origin main", { cwd: stagingDir, stdio: "inherit" });

console.log("\n========================================================");
console.log("[DeployCleanProduction] SUCCESS!");
console.log("webservicers-production is now a 100% clean production codebase!");
console.log("All old files, errors, and history have been wiped and replaced.");
console.log("Ready for direct zero-error cPanel Git Versioning import.");
console.log("========================================================\n");
