const { createServer } = require("http");
const { parse } = require("url");
const path = require("path");
const fs = require("fs");
const util = require("util");

// Ensure AsyncLocalStorage is globally available for Next.js App Router
try {
  const { AsyncLocalStorage } = require("node:async_hooks");
  if (!globalThis.AsyncLocalStorage) {
    globalThis.AsyncLocalStorage = AsyncLocalStorage;
  }
} catch (_) {}

// Ensure working directory is always the app root on cPanel/LiteSpeed
process.chdir(__dirname);

// Robust error formatter: handles Error objects, plain objects, strings, and custom rejection types
function formatError(err) {
  if (!err) return "Unknown error (null or undefined)";
  if (typeof err === "string") return err;

  const parts = [];
  if (err.name) parts.push(`[${err.name}]`);
  if (err.message) parts.push(err.message);
  if (err.code) parts.push(`Code: ${err.code}`);
  if (err.stack) parts.push(`Stack:\n${err.stack}`);

  try {
    const inspected = util.inspect(err, { showHidden: true, depth: 6, colors: false });
    if (inspected && inspected !== "{}" && !parts.some((p) => p.includes(inspected))) {
      parts.push(`Inspected:\n${inspected}`);
    }
  } catch (_) {}

  try {
    const jsonStr = JSON.stringify(err, Object.getOwnPropertyNames(err), 2);
    if (jsonStr && jsonStr !== "{}" && !parts.some((p) => p.includes(jsonStr))) {
      parts.push(`Properties:\n${jsonStr}`);
    }
  } catch (_) {}

  return parts.length > 0 ? parts.join("\n\n") : String(err);
}

// Robust file error logger for cPanel debugging
function logCpanelError(title, err) {
  const formatted = formatError(err);
  const line = `[${new Date().toISOString()}] ${title}:\n${formatted}\n\n`;
  console.error(line);
  try {
    fs.appendFileSync(path.join(__dirname, "cpanel_error.log"), line, "utf8");
  } catch (_) {}
}

process.on("uncaughtException", (err) => logCpanelError("Uncaught Exception", err));
process.on("unhandledRejection", (err) => logCpanelError("Unhandled Rejection", err));

// Load environment variables from .env and .env.local into process.env
try {
  const envFiles = [".env.local", ".env"];
  for (const file of envFiles) {
    const envPath = path.join(__dirname, file);
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");
      content.split(/\r?\n/).forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) return;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx > 0) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if (
            (val.startsWith('"') && val.endsWith('"')) ||
            (val.startsWith("'") && val.endsWith("'"))
          ) {
            val = val.slice(1, -1);
          }
          if (!process.env[key] || process.env[key].trim() === "") {
            process.env[key] = val;
          }
        }
      });
    }
  }
} catch (_) {}

// Fallback environment defaults for fresh subdomains (prior to /install)
if (!process.env.DATABASE_URL) {
  try {
    const schemaFile = path.join(__dirname, "prisma", "schema.prisma");
    const isMysql = fs.existsSync(schemaFile) && fs.readFileSync(schemaFile, "utf8").includes('provider = "mysql"');
    if (!isMysql) {
      process.env.DATABASE_URL = `file:${path.join(__dirname, "dev.db")}`;
    }
  } catch (_) {}
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "webservicers-super-secure-jwt-key-default-2026";
}
if (!process.env.NEXTAUTH_SECRET) {
  process.env.NEXTAUTH_SECRET = process.env.JWT_SECRET;
}

// Restore execute permissions on Linux/cPanel binaries in case zip extracted with stripped permissions
if (process.platform !== "win32") {
  try {
    const { execSync } = require("child_process");
    execSync("chmod -R +x node_modules/.bin node_modules/@prisma node_modules/prisma 2>/dev/null || true", {
      cwd: __dirname,
      stdio: "ignore",
    });
  } catch (_) {}
}

// Ensure shared persistent storage directories exist
try {
  const sharedStorage = path.join(__dirname, "shared", "storage");
  ["uploads", "backups", "logs"].forEach((dir) => {
    fs.mkdirSync(path.join(sharedStorage, dir), { recursive: true });
  });
} catch (_) {}

// Resolve active release directory (symlink 'current' or 'active-release.json')
let activeAppDir = __dirname;
try {
  const currentSymlink = path.join(__dirname, "current");
  if (fs.existsSync(currentSymlink) && fs.lstatSync(currentSymlink).isSymbolicLink()) {
    activeAppDir = fs.realpathSync(currentSymlink);
  } else {
    const pointerFile = path.join(__dirname, "active-release.json");
    if (fs.existsSync(pointerFile)) {
      const pointer = JSON.parse(fs.readFileSync(pointerFile, "utf8"));
      const resolved = path.isAbsolute(pointer.releaseDir)
        ? pointer.releaseDir
        : path.join(__dirname, pointer.releaseDir);
      if (fs.existsSync(resolved)) activeAppDir = resolved;
    }
  }
} catch (_) {}

// Self-healing function for Next.js App Router on cPanel / CloudLinux / LiteSpeed
function healNextArtifacts(baseDir) {
  // Remove legacy next.config.ts if next.config.mjs exists to prevent Next.js from triggering TypeScript auto-install
  try {
    const tsConfig = path.join(baseDir, "next.config.ts");
    const mjsConfig = path.join(baseDir, "next.config.mjs");
    if (fs.existsSync(tsConfig) && fs.existsSync(mjsConfig)) {
      fs.unlinkSync(tsConfig);
    }
  } catch (_) {}

  const nextDir = path.join(baseDir, ".next");
  if (!fs.existsSync(nextDir)) return;

  // 1. Ensure routes-manifest.json has required arrays and rewrites object
  try {
    const routesManifestPath = path.join(nextDir, "routes-manifest.json");
    if (fs.existsSync(routesManifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(routesManifestPath, "utf8"));
      manifest.dataRoutes = Array.isArray(manifest.dataRoutes) ? manifest.dataRoutes : [];
      manifest.dynamicRoutes = Array.isArray(manifest.dynamicRoutes) ? manifest.dynamicRoutes : [];
      manifest.redirects = Array.isArray(manifest.redirects) ? manifest.redirects : [];
      manifest.headers = Array.isArray(manifest.headers) ? manifest.headers : [];

      // NextNodeServer.getinterceptionRoutePatterns expects rewrites.beforeFiles to be an array
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
  } catch (e) {
    logCpanelError("Failed healing routes-manifest.json", e);
  }

  // 2. Normalize required-server-files.json (replaces Windows backslashes with forward slashes for Linux)
  try {
    const reqFilesPath = path.join(nextDir, "required-server-files.json");
    if (fs.existsSync(reqFilesPath)) {
      const reqFiles = JSON.parse(fs.readFileSync(reqFilesPath, "utf8"));
      reqFiles.appDir = baseDir;
      reqFiles.relativeAppDir = "";
      if (Array.isArray(reqFiles.files)) {
        reqFiles.files = reqFiles.files.map((f) => f.replace(/\\/g, "/"));
      }
      if (Array.isArray(reqFiles.ignore)) {
        reqFiles.ignore = reqFiles.ignore.map((f) => f.replace(/\\/g, "/"));
      }
      fs.writeFileSync(reqFilesPath, JSON.stringify(reqFiles, null, 2), "utf8");
    }
  } catch (e) {
    logCpanelError("Failed healing required-server-files.json", e);
  }

  // 3. Ensure preview-props.json exists in .next/server
  try {
    const serverDir = path.join(nextDir, "server");
    fs.mkdirSync(serverDir, { recursive: true });
    const previewPropsPath = path.join(serverDir, "preview-props.json");
    if (!fs.existsSync(previewPropsPath)) {
      let previewData = {
        previewModeId: "87a6983c344e1a516c690244e638afd8",
        previewModeSigningKey: "0601d94f4c324120c2954e8e25147d0be2967491af23c4e2d31d6b82c4fa1a92",
        previewModeEncryptionKey: "0dc0b0e97cdcf8af13087a2184693cab28689308c9322b957b1c6f6696084161",
      };
      const prerenderManifestPath = path.join(nextDir, "prerender-manifest.json");
      if (fs.existsSync(prerenderManifestPath)) {
        try {
          const pm = JSON.parse(fs.readFileSync(prerenderManifestPath, "utf8"));
          if (pm.preview) previewData = pm.preview;
        } catch (_) {}
      }
      fs.writeFileSync(previewPropsPath, JSON.stringify(previewData, null, 2), "utf8");
    }
  } catch (e) {
    logCpanelError("Failed healing preview-props.json", e);
  }
}

// Execute self-healing on active application directory
healNextArtifacts(activeAppDir);

// Always run in production mode on cPanel / Phusion Passenger to serve pre-built .next artifacts
const isPassenger = Boolean(
  typeof PhusionPassenger !== "undefined" ||
  process.env.PASSENGER_APP_ENV ||
  process.env.PORT
);
const dev = process.env.NODE_ENV === "development" && !isPassenger;
if (!dev) {
  process.env.NODE_ENV = "production";
}
const listenTarget = typeof PhusionPassenger !== "undefined" ? "passenger" : (process.env.PORT || 3000);

let nextApp = null;
let nextHandle = null;
let isPrepared = false;
let prepareError = null;
let preparePromise = null;

function prepareNext() {
  if (preparePromise) return preparePromise;
  preparePromise = (async () => {
    try {
      healNextArtifacts(activeAppDir);
      const next = require("next");
      nextApp = next({ dev, dir: activeAppDir });
      nextHandle = nextApp.getRequestHandler();
      await nextApp.prepare();
      isPrepared = true;
      console.log(`[WebServicers] Next.js engine ready in ${dev ? "dev" : "production"} mode.`);
    } catch (err) {
      prepareError = err;
      logCpanelError("Failed to prepare Next.js engine", err);
    }
  })();
  return preparePromise;
}

// Start Next.js engine in the background
prepareNext();

// Create HTTP server immediately so Phusion Passenger never times out or returns 503
const server = createServer(async (req, res) => {
  try {
    // Quick diagnostic endpoint
    if (req.url === "/health" || req.url === "/_health" || req.url === "/cpanel-status") {
      res.statusCode = isPrepared ? 200 : (prepareError ? 500 : 503);
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(
        JSON.stringify(
          {
            status: isPrepared ? "ready" : (prepareError ? "error" : "starting"),
            nodeVersion: process.version,
            platform: `${process.platform} (${process.arch})`,
            uptime: Math.round(process.uptime()),
            cwd: process.cwd(),
            activeAppDir,
            listenTarget,
            prepareError: prepareError ? formatError(prepareError) : null,
          },
          null,
          2
        )
      );
      return;
    }

    if (!isPrepared && !prepareError) {
      await preparePromise;
    }

    if (prepareError) {
      logCpanelError(`Serving Diagnostic Page for ${req.url}`, prepareError);
      res.statusCode = 500;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.end(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>WebServicers — Startup Diagnostic</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #fafafa; color: #181c1f; padding: 40px 20px; line-height: 1.6; }
    .card { max-width: 820px; margin: 0 auto; background: #fff; border: 1px solid #e4e4e7; border-radius: 16px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    h1 { color: #dc2626; font-size: 20px; margin-top: 0; }
    pre { background: #1e1e2e; color: #f8f8f2; border-radius: 8px; padding: 16px; font-size: 13px; overflow-x: auto; white-space: pre-wrap; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; line-height: 1.5; }
    .badge { display: inline-block; background: #fee2e2; color: #991b1b; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 16px; }
    .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
    .meta-table td { padding: 6px 12px; border-bottom: 1px solid #f4f4f5; }
    .meta-table td:first-child { font-weight: 600; width: 140px; color: #71717a; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">Application Initialization Diagnostic</div>
    <h1>WebServicers failed to start Next.js on this server</h1>
    <table class="meta-table">
      <tr><td>Node.js Version</td><td><code>${process.version}</code> (Recommended: Node 20.x or 22.x)</td></tr>
      <tr><td>Platform / Arch</td><td><code>${process.platform} (${process.arch})</code></td></tr>
      <tr><td>Working Directory</td><td><code>${process.cwd()}</code></td></tr>
      <tr><td>Target Directory</td><td><code>${activeAppDir}</code></td></tr>
    </table>
    <p>Detailed diagnostic information:</p>
    <pre>${escapeHtml(formatError(prepareError))}</pre>
    <p style="font-size: 13px; color: #71717a; margin-top: 24px;">
      Diagnostic log saved to <code>cpanel_error.log</code>. Once corrected, click <strong>Restart</strong> in cPanel "Setup Node.js App".
    </p>
  </div>
</body>
</html>`);
      return;
    }

    const parsedUrl = parse(req.url, true);
    await nextHandle(req, res, parsedUrl);
  } catch (err) {
    logCpanelError(`Error handling request (${req.url})`, err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("Internal Server Error");
  }
});

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

server.listen(listenTarget, (err) => {
  if (err) {
    logCpanelError("Server Listen Error", err);
    process.exit(1);
  }
  console.log(`> WebServicers ready and listening on target: ${listenTarget}`);
});

module.exports = server;
