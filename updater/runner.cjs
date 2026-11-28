#!/usr/bin/env node
/**
 * WebServicers Independent Update Runner
 * Standalone, cPanel cron and CLI compatible execution entrypoint.
 */
const path = require("path");
const fs = require("fs");

// Ensure execution directory is the application root
const appRoot = path.resolve(__dirname, "..");
process.chdir(appRoot);

// Load environment from shared/.env or .env
try {
  const envFiles = [
    path.join(appRoot, "shared", ".env"),
    path.join(appRoot, ".env.local"),
    path.join(appRoot, ".env"),
  ];
  for (const ef of envFiles) {
    if (fs.existsSync(ef)) {
      const content = fs.readFileSync(ef, "utf8");
      content.split(/\r?\n/).forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) return;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx > 0) {
          const k = trimmed.slice(0, eqIdx).trim();
          let v = trimmed.slice(eqIdx + 1).trim();
          if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
            v = v.slice(1, -1);
          }
          if (!process.env[k]) process.env[k] = v;
        }
      });
    }
  }
} catch (_) {}

async function run() {
  const args = process.argv.slice(2);
  const isCron = args.includes("--cron");
  const isCheckOnly = args.includes("--check-only");
  const channelArg = args.find((a) => a.startsWith("--channel="));
  const channel = channelArg ? channelArg.split("=")[1] : "stable";

  console.log(`[StandaloneUpdater] Starting updater (channel: ${channel}, cron: ${isCron})...`);

  // Dynamically import runner module via tsx or compiled output
  try {
    const { UpdateRunner } = require("../src/server/updater/runner");
    const runner = new UpdateRunner(appRoot);

    if (isCheckOnly) {
      const { UpdateProviderManager } = require("../src/server/updater/provider-manager");
      const pm = UpdateProviderManager.getInstance();
      await pm.loadFromDatabase();
      const current = runner.getState().previousVersion;
      const res = await pm.checkForUpdates(current, channel);
      if (res) {
        console.log(`[StandaloneUpdater] Update available: v${res.release.version} via ${res.provider.name}`);
        process.exit(0);
      } else {
        console.log("[StandaloneUpdater] System is already up to date.");
        process.exit(0);
      }
    }

    const success = await runner.executeUpdate(undefined, channel);
    if (success) {
      console.log("[StandaloneUpdater] Update finished successfully.");
      process.exit(0);
    } else {
      console.error("[StandaloneUpdater] Update encountered an error and aborted.");
      process.exit(1);
    }
  } catch (err) {
    console.error("[StandaloneUpdater] Unhandled execution error:", err);
    process.exit(1);
  }
}

run();
