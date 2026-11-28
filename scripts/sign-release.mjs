import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

/**
 * Signs a release manifest JSON file using an Ed25519 private key.
 * Usage: node scripts/sign-release.mjs <manifestPath> [privateKeyPath]
 */
async function main() {
  const args = process.argv.slice(2);
  const manifestPath = args[0] || "release-manifest.json";
  const privKeyPath = args[1] || process.env.UPDATER_PRIVATE_KEY_PATH || "src/server/updater/keys/release-privkey-dev.pem";

  if (!fs.existsSync(manifestPath)) {
    console.error(`Error: Manifest file not found at: ${manifestPath}`);
    process.exit(1);
  }

  let privateKeyPem = process.env.UPDATER_RELEASE_PRIVATE_KEY;
  if (!privateKeyPem) {
    if (!fs.existsSync(privKeyPath)) {
      console.error(`Error: Private key not found at: ${privKeyPath} and UPDATER_RELEASE_PRIVATE_KEY not set in env.`);
      process.exit(1);
    }
    privateKeyPem = fs.readFileSync(privKeyPath, "utf8").trim();
  }

  const manifestBuffer = fs.readFileSync(manifestPath);
  const signature = crypto.sign(null, manifestBuffer, privateKeyPem);
  const signatureBase64 = signature.toString("base64");

  const sigPath = `${manifestPath}.sig`;
  fs.writeFileSync(sigPath, signatureBase64, "utf8");

  console.log(`[SignRelease] Successfully signed ${manifestPath} -> ${sigPath}`);
  console.log(`[SignRelease] Signature (base64): ${signatureBase64.slice(0, 32)}...`);
}

main().catch((err) => {
  console.error("[SignRelease] Error:", err);
  process.exit(1);
});
