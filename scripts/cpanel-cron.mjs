#!/usr/bin/env node
/**
 * cPanel Cron Runner for WebServicers
 * Schedule in cPanel Cron Jobs (* * * * *):
 *   /usr/local/bin/node /home/webinf/dash.webservicers.com/scripts/cpanel-cron.mjs
 */
import fs from "node:fs";
import path from "node:path";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dash.webservicers.com";
const envPath = path.join(process.cwd(), ".env");
let cronSecret = process.env.CRON_SECRET || "";

if (!cronSecret && fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  const match = envContent.match(/^CRON_SECRET="?([^"\r\n]+)"?/m);
  if (match) cronSecret = match[1];
}

async function run() {
  const endpoint = `${appUrl.replace(/\/$/, "")}/api/cron/tick`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cronSecret ? { "x-cron-secret": cronSecret } : {}),
    },
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`[cron] HTTP ${res.status}: ${text}`);
    process.exit(1);
  }
  console.log(`[cron] OK:`, text);
}

run().catch((err) => {
  console.error("[cron] Failed:", err);
  process.exit(1);
});
