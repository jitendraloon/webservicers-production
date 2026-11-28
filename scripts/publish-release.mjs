import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const version = process.argv[2] || "1.0.11";
const rootDir = "C:/Users/jiten/Desktop/Gemini/Webservicers";
const src = path.join(rootDir, "dist-release", `v${version}`);
const repo = "C:/Users/jiten/Desktop/Gemini/webservicers-releases";
const dest = path.join(repo, "releases", `v${version}`);

console.log(`[PublishRelease] Packaging v${version}...`);
execSync(`node scripts/package-release.mjs ${version} stable zip`, { cwd: rootDir, stdio: "inherit" });

console.log(`[PublishRelease] Copying to ${dest}...`);
fs.mkdirSync(dest, { recursive: true });
for (const file of fs.readdirSync(src)) {
  fs.copyFileSync(path.join(src, file), path.join(dest, file));
}
fs.copyFileSync(path.join(src, "release-manifest.json"), path.join(repo, "manifests", "latest.json"));
fs.copyFileSync(path.join(src, "release-manifest.json"), path.join(repo, "manifests", "stable.json"));

execSync("git add .", { cwd: repo, stdio: "inherit" });
try {
  execSync(`git commit -m "release: v${version} - consolidated SMM providers, complete product catalog, and comprehensive orders management"`, { cwd: repo, stdio: "inherit" });
} catch (e) {
  console.log("Git commit output:", e.message);
}
execSync("git push origin main", { cwd: repo, stdio: "inherit" });
try {
  execSync(`git tag -a "v${version}" -m "Release v${version}" -f`, { cwd: repo, stdio: "inherit" });
  execSync(`git push origin "v${version}" --force`, { cwd: repo, stdio: "inherit" });
} catch (tagErr) {
  console.log("Git tag push notice:", tagErr.message);
}
console.log(`SUCCESS: webservicers-releases published v${version}!`);
