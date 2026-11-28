import crypto from "node:crypto";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const TOTP_STEP_SECONDS = 30;
const TOTP_DIGITS = 6;

/**
 * Encode a Buffer into an RFC 4648 Base32 string (without padding).
 */
export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 0x1f];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 0x1f];
  }

  return output;
}

/**
 * Decode an RFC 4648 Base32 string into a Buffer.
 */
export function base32Decode(input: string): Buffer {
  const cleaned = input.toUpperCase().replace(/[\s=-]+/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < cleaned.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(cleaned[i]);
    if (idx === -1) {
      throw new Error("Invalid Base32 character in TOTP secret.");
    }

    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/**
 * Generate a random Base32-encoded TOTP secret (default 20 bytes / 160 bits).
 */
export function generateTotpSecret(byteLength = 20): string {
  return base32Encode(crypto.randomBytes(byteLength));
}

/**
 * Compute an RFC 6238 TOTP token for a given secret and counter offset.
 */
function generateTotpAtCounter(secretKey: Buffer, counter: number): string {
  const counterBuffer = Buffer.alloc(8);
  const high = Math.floor(counter / 0x100000000);
  const low = counter >>> 0;
  counterBuffer.writeUInt32BE(high, 0);
  counterBuffer.writeUInt32BE(low, 4);

  const hmac = crypto.createHmac("sha1", secretKey).update(counterBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binaryCode =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = binaryCode % 10 ** TOTP_DIGITS;
  return otp.toString().padStart(TOTP_DIGITS, "0");
}

/**
 * Verify a 6-digit TOTP token against a Base32-encoded secret within ±window steps.
 */
export function verifyTotpToken(
  secret: string,
  token: string,
  window = 1
): boolean {
  const normalizedToken = token.replace(/[\s-]+/g, "");
  if (!/^\d{6}$/.test(normalizedToken) || !secret) {
    return false;
  }

  let secretKey: Buffer;
  try {
    secretKey = base32Decode(secret);
  } catch {
    return false;
  }

  if (secretKey.length === 0) {
    return false;
  }

  const currentCounter = Math.floor(Date.now() / 1000 / TOTP_STEP_SECONDS);
  const tokenBuffer = Buffer.from(normalizedToken, "utf8");

  for (let offset = -window; offset <= window; offset++) {
    const candidate = generateTotpAtCounter(secretKey, currentCounter + offset);
    const candidateBuffer = Buffer.from(candidate, "utf8");
    if (
      candidateBuffer.length === tokenBuffer.length &&
      crypto.timingSafeEqual(candidateBuffer, tokenBuffer)
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Build an `otpauth://` URI for authenticator apps.
 */
export function getTotpUri(
  email: string,
  secret: string,
  issuer = "Webservicers"
): string {
  const label = `${encodeURIComponent(issuer)}:${encodeURIComponent(email)}`;
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: "SHA1",
    digits: String(TOTP_DIGITS),
    period: String(TOTP_STEP_SECONDS),
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}
