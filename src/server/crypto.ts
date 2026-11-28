import crypto from "node:crypto";
import { ensureEnvLoaded } from "./env";

ensureEnvLoaded();

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const DEV_FALLBACK_SECRET = "webservicers-local-dev-encryption-key";

function resolveEncryptionKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY?.trim();

  if (!raw || raw.startsWith("change-me-")) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "ENCRYPTION_KEY environment variable must be set to a valid 32-byte key in production."
      );
    }
    return crypto
      .createHash("sha256")
      .update(raw || DEV_FALLBACK_SECRET)
      .digest();
  }

  // 64-character hex string -> 32 raw bytes
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, "hex");
  }

  // Base64 string decoding to 32 bytes
  const base64Buf = Buffer.from(raw, "base64");
  if (base64Buf.length === KEY_LENGTH && base64Buf.toString("base64") === raw) {
    return base64Buf;
  }

  // Fallback: derive a 32-byte key deterministically via SHA-256
  return crypto.createHash("sha256").update(raw, "utf8").digest();
}

/**
 * Encrypt plaintext using AES-256-GCM.
 * Returns a string formatted as `iv:authTag:ciphertext` (each segment base64-encoded).
 */
export function encrypt(plaintext: string): string {
  const key = resolveEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    encrypted.toString("base64"),
  ].join(":");
}

/**
 * Decrypt a payload formatted as `iv:authTag:ciphertext` (base64-encoded)
 * using AES-256-GCM.
 */
export function decrypt(encrypted: string): string {
  const parts = encrypted.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted payload format. Expected iv:authTag:ciphertext.");
  }

  const [ivB64, authTagB64, ciphertextB64] = parts;
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const ciphertext = Buffer.from(ciphertextB64, "base64");

  if (iv.length !== IV_LENGTH) {
    throw new Error("Invalid initialization vector length.");
  }
  if (authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error("Invalid authentication tag length.");
  }

  const key = resolveEncryptionKey();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
