import crypto from "node:crypto";

export interface SigV4SignParams {
  method: string;
  url: string;
  region: string;
  service: string;
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  headers?: Record<string, string>;
  body?: Buffer | string;
}

function sha256Hex(data: Buffer | string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

function hmacSha256(key: Buffer | string, data: string): Buffer {
  return crypto.createHmac("sha256", key).update(data, "utf8").digest();
}

function formatAmzDates(date: Date): { amzDate: string; dateStamp: string } {
  const iso = date.toISOString().replace(/[:-]|\.\d{3}/g, "");
  return {
    amzDate: iso,
    dateStamp: iso.slice(0, 8),
  };
}

function getSigningKey(
  secretAccessKey: string,
  dateStamp: string,
  region: string,
  service: string
): Buffer {
  const kDate = hmacSha256(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmacSha256(kDate, region);
  const kService = hmacSha256(kRegion, service);
  return hmacSha256(kService, "aws4_request");
}

function encodeRfc3986(str: string): string {
  return encodeURIComponent(str).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

/**
 * Sign an HTTP request with AWS Signature Version 4.
 */
export function signAwsV4Request(
  params: SigV4SignParams
): Record<string, string> {
  const parsed = new URL(params.url);
  const { amzDate, dateStamp } = formatAmzDates(new Date());
  const payloadHash = sha256Hex(params.body ?? "");

  const baseHeaders: Record<string, string> = {};
  for (const [k, v] of Object.entries(params.headers ?? {})) {
    baseHeaders[k.toLowerCase()] = v.trim();
  }
  baseHeaders["host"] = parsed.host;
  baseHeaders["x-amz-date"] = amzDate;
  baseHeaders["x-amz-content-sha256"] = payloadHash;
  if (params.sessionToken) {
    baseHeaders["x-amz-security-token"] = params.sessionToken;
  }

  const sortedHeaderKeys = Object.keys(baseHeaders).sort();
  const canonicalHeaders = sortedHeaderKeys
    .map((k) => `${k}:${baseHeaders[k]}\n`)
    .join("");
  const signedHeaders = sortedHeaderKeys.join(";");

  const canonicalQuery = Array.from(parsed.searchParams.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${encodeRfc3986(k)}=${encodeRfc3986(v)}`)
    .join("&");

  const canonicalUri =
    parsed.pathname
      .split("/")
      .map((seg) => encodeRfc3986(decodeURIComponent(seg)))
      .join("/") || "/";

  const canonicalRequest = [
    params.method.toUpperCase(),
    canonicalUri,
    canonicalQuery,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const credentialScope = `${dateStamp}/${params.region}/${params.service}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n");

  const signingKey = getSigningKey(
    params.secretAccessKey,
    dateStamp,
    params.region,
    params.service
  );
  const signature = hmacSha256(signingKey, stringToSign).toString("hex");

  return {
    ...baseHeaders,
    authorization: `AWS4-HMAC-SHA256 Credential=${params.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
  };
}

/**
 * Generate an AWS Signature Version 4 presigned URL (for S3 / R2).
 */
export function createAwsV4PresignedUrl(params: {
  method?: string;
  url: string;
  region: string;
  service: string;
  accessKeyId: string;
  secretAccessKey: string;
  expiresInSeconds?: number;
}): string {
  const parsed = new URL(params.url);
  const { amzDate, dateStamp } = formatAmzDates(new Date());
  const expires = Math.min(Math.max(params.expiresInSeconds ?? 900, 1), 604800);
  const credentialScope = `${dateStamp}/${params.region}/${params.service}/aws4_request`;

  parsed.searchParams.set("X-Amz-Algorithm", "AWS4-HMAC-SHA256");
  parsed.searchParams.set(
    "X-Amz-Credential",
    `${params.accessKeyId}/${credentialScope}`
  );
  parsed.searchParams.set("X-Amz-Date", amzDate);
  parsed.searchParams.set("X-Amz-Expires", String(expires));
  parsed.searchParams.set("X-Amz-SignedHeaders", "host");

  const canonicalQuery = Array.from(parsed.searchParams.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${encodeRfc3986(k)}=${encodeRfc3986(v)}`)
    .join("&");

  const canonicalUri =
    parsed.pathname
      .split("/")
      .map((seg) => encodeRfc3986(decodeURIComponent(seg)))
      .join("/") || "/";

  const canonicalRequest = [
    (params.method ?? "GET").toUpperCase(),
    canonicalUri,
    canonicalQuery,
    `host:${parsed.host}\n`,
    "host",
    "UNSIGNED-PAYLOAD",
  ].join("\n");

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n");

  const signingKey = getSigningKey(
    params.secretAccessKey,
    dateStamp,
    params.region,
    params.service
  );
  const signature = hmacSha256(signingKey, stringToSign).toString("hex");

  return `${parsed.origin}${canonicalUri}?${canonicalQuery}&X-Amz-Signature=${signature}`;
}
