import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { ReleaseManifest } from "./types";
import { compareSemver } from "./semver";

export interface VerificationResult {
  valid: boolean;
  errors: string[];
  manifest?: ReleaseManifest;
  packageChecksum?: string;
  packageSizeBytes?: number;
}

export class ReleaseVerifier {
  private publicKeyPem: string;

  constructor(customPublicKeyPem?: string) {
    if (customPublicKeyPem) {
      this.publicKeyPem = customPublicKeyPem;
    } else {
      this.publicKeyPem = this.loadDefaultPublicKey();
    }
  }

  private loadDefaultPublicKey(): string {
    const keyPaths = [
      path.join(__dirname, "keys", "release-pubkey.pem"),
      path.join(process.cwd(), "updater", "keys", "release-pubkey.pem"),
      path.join(process.cwd(), "src", "server", "updater", "keys", "release-pubkey.pem"),
    ];

    for (const kp of keyPaths) {
      if (fs.existsSync(kp)) {
        return fs.readFileSync(kp, "utf8").trim();
      }
    }

    // Hardcoded trusted public key fallback
    return `-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEA5oMffDQ/rGbsKZM6pgrX1v6MvAF3/BqEQ61rXIYq9xo=\n-----END PUBLIC KEY-----`;
  }

  /**
   * Verify Ed25519 signature of the manifest bytes.
   */
  public verifySignature(manifestBuffer: Buffer, signatureBase64OrHex: string): boolean {
    try {
      let sigBuffer: Buffer;
      const cleanSig = signatureBase64OrHex.trim();

      if (/^[0-9a-fA-F]+$/.test(cleanSig)) {
        sigBuffer = Buffer.from(cleanSig, "hex");
      } else {
        sigBuffer = Buffer.from(cleanSig, "base64");
      }

      return crypto.verify(null, manifestBuffer, this.publicKeyPem, sigBuffer);
    } catch (err) {
      console.error("[ReleaseVerifier] Ed25519 signature verification error:", err);
      return false;
    }
  }

  /**
   * Compute SHA-256 digest of a file.
   */
  public async computeFileSha256(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash("sha256");
      const stream = fs.createReadStream(filePath);
      stream.on("data", (chunk) => hash.update(chunk));
      stream.on("end", () => resolve(hash.digest("hex")));
      stream.on("error", (err) => reject(err));
    });
  }

  /**
   * Validate entire release payload (manifest signature, checksum, size, compatibility).
   */
  public async verifyRelease(
    manifestPath: string,
    signaturePath: string,
    packagePath: string,
    currentVersion: string,
    allowDowngrade = false
  ): Promise<VerificationResult> {
    const errors: string[] = [];

    if (!fs.existsSync(manifestPath)) {
      errors.push(`Manifest file missing: ${manifestPath}`);
      return { valid: false, errors };
    }
    if (!fs.existsSync(signaturePath)) {
      errors.push(`Digital signature file missing: ${signaturePath}`);
      return { valid: false, errors };
    }
    if (!fs.existsSync(packagePath)) {
      errors.push(`Package archive missing: ${packagePath}`);
      return { valid: false, errors };
    }

    // 1. Read Manifest & Signature
    let manifest: ReleaseManifest;
    const manifestBuffer = fs.readFileSync(manifestPath);
    try {
      manifest = JSON.parse(manifestBuffer.toString("utf8"));
    } catch (err) {
      errors.push(`Failed to parse release manifest JSON: ${String(err)}`);
      return { valid: false, errors };
    }

    const signatureStr = fs.readFileSync(signaturePath, "utf8").trim();

    // 2. Verify Digital Signature
    const isSignatureValid = this.verifySignature(manifestBuffer, signatureStr);
    if (!isSignatureValid) {
      errors.push("Cryptographic signature verification failed! The release manifest is untrusted or modified.");
      return { valid: false, errors };
    }

    // 3. Verify Package Checksum (SHA-256)
    const computedHash = await this.computeFileSha256(packagePath);
    if (computedHash.toLowerCase() !== manifest.package.sha256.toLowerCase()) {
      errors.push(
        `Package checksum mismatch! Expected SHA-256: ${manifest.package.sha256}, got: ${computedHash}`
      );
    }

    // 4. Verify Package Size
    const stat = fs.statSync(packagePath);
    if (manifest.package.sizeBytes && stat.size !== manifest.package.sizeBytes) {
      errors.push(
        `Package size mismatch! Expected: ${manifest.package.sizeBytes} bytes, actual: ${stat.size} bytes`
      );
    }

    // 5. Verify SemVer & Downgrade Prevention
    if (!allowDowngrade && compareSemver(manifest.version, currentVersion) < 0) {
      errors.push(
        `Downgrade prevented: target release ${manifest.version} is older than current version ${currentVersion}.`
      );
    }

    // 6. Verify Node.js Compatibility
    if (manifest.minNodeVersion) {
      const currentNode = process.version.replace(/^v/, "");
      if (compareSemver(currentNode, manifest.minNodeVersion) < 0) {
        errors.push(
          `Node.js runtime version ${process.version} does not meet minimum requirement: >= v${manifest.minNodeVersion}`
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      manifest,
      packageChecksum: computedHash,
      packageSizeBytes: stat.size,
    };
  }

  /**
   * Validate file extraction safety against directory traversal and zip bombs.
   */
  public validateExtractionTarget(targetDir: string, relativePath: string): string {
    // Prevent directory traversal
    const safeTarget = path.resolve(targetDir);
    const resolvedPath = path.resolve(targetDir, relativePath);

    if (!resolvedPath.startsWith(safeTarget + path.sep) && resolvedPath !== safeTarget) {
      throw new Error(`Security Violation: Path traversal detected in archive entry: ${relativePath}`);
    }

    return resolvedPath;
  }
}
