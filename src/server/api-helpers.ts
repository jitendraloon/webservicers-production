import { NextRequest, NextResponse } from "next/server";
import type { z } from "zod";
import type { ActorType, Prisma } from "@prisma/client";
import type { UserRole } from "@/lib/types";
import { db } from "@/server/db";
import { getSessionFromCookies, type ValidatedSession } from "@/server/auth/session";
import { AuthError, type SessionUserRecord } from "@/server/auth/rbac";

/**
 * Safely parse and Zod-validate a JSON request body.
 */
export async function parseJsonBody<T>(
  request: NextRequest,
  schema: z.ZodType<T>
): Promise<
  | { ok: true; data: T }
  | { ok: false; response: NextResponse }
> {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "Invalid JSON request body." },
        { status: 400 }
      ),
    };
  }

  const parsed = schema.safeParse(rawBody);
  if (!parsed.success) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          ok: false,
          error: "Validation failed.",
          issues: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      ),
    };
  }

  return { ok: true, data: parsed.data };
}

/**
 * Detect whether an error is caused by database connectivity / initialization issues.
 */
export function isDbUnavailableError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: string; name?: string; message?: string };
  if (
    e.name === "PrismaClientInitializationError" ||
    e.name === "PrismaClientRustPanicError"
  ) {
    return true;
  }
  if (
    typeof e.code === "string" &&
    ["P1001", "P1002", "P1003", "P1008", "P1017", "ECONNREFUSED", "ETIMEDOUT"].includes(
      e.code
    )
  ) {
    return true;
  }
  if (typeof e.message === "string") {
    const msg = e.message.toLowerCase();
    if (
      msg.includes("can't reach database server") ||
      msg.includes("connection refused") ||
      msg.includes("econnrefused") ||
      msg.includes("prismaclientinitializationerror") ||
      msg.includes("database") && msg.includes("unavailable")
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Get the current session without throwing if the database is unavailable.
 */
export async function getOptionalSession(): Promise<{
  session: ValidatedSession<SessionUserRecord> | null;
  dbUnavailable: boolean;
}> {
  try {
    const session = (await getSessionFromCookies()) as ValidatedSession<SessionUserRecord> | null;
    return { session, dbUnavailable: false };
  } catch (err) {
    if (isDbUnavailableError(err)) {
      return { session: null, dbUnavailable: true };
    }
    throw err;
  }
}

/**
 * Require an authenticated session (and optionally one of `allowedRoles`).
 * Returns a NextResponse on failure so route handlers can return early cleanly.
 */
export async function requireAuth(
  allowedRoles?: readonly UserRole[]
): Promise<
  | { ok: true; session: ValidatedSession<SessionUserRecord> }
  | { ok: false; response: NextResponse }
> {
  try {
    const session = (await getSessionFromCookies()) as ValidatedSession<SessionUserRecord> | null;
    if (!session) {
      return {
        ok: false,
        response: NextResponse.json(
          { ok: false, error: "Authentication required." },
          { status: 401 }
        ),
      };
    }

    if (allowedRoles && !allowedRoles.includes(session.user.role)) {
      return {
        ok: false,
        response: NextResponse.json(
          { ok: false, error: "Insufficient role permissions." },
          { status: 403 }
        ),
      };
    }

    return { ok: true, session };
  } catch (err) {
    if (err instanceof AuthError) {
      return {
        ok: false,
        response: NextResponse.json(
          { ok: false, error: err.message },
          { status: err.statusCode }
        ),
      };
    }
    if (isDbUnavailableError(err)) {
      return {
        ok: false,
        response: NextResponse.json(
          { ok: false, error: "Database unavailable.", fallback: true },
          { status: 503 }
        ),
      };
    }
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "Unable to verify session." },
        { status: 500 }
      ),
    };
  }
}

/**
 * Convert BigInt (and nested BigInt fields) into JSON-safe numbers/strings.
 */
export function toJsonSafe<T>(value: T): T {
  if (typeof value === "bigint") {
    const num = Number(value);
    return (Number.isSafeInteger(num) ? num : value.toString()) as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => toJsonSafe(item)) as unknown as T;
  }
  if (value && typeof value === "object" && !(value instanceof Date)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = toJsonSafe(v);
    }
    return out as T;
  }
  return value;
}

/**
 * Mask a secret string for safe display in admin responses.
 */
export function maskSecret(secret: string): string {
  const trimmed = secret.trim();
  if (!trimmed) return "";
  if (trimmed.length <= 8) return "••••••••";
  return `${trimmed.slice(0, 4)}••••${trimmed.slice(-4)}`;
}

/**
 * Mask sensitive keys inside a config object.
 */
export function maskConfigObject(
  config: Record<string, unknown>
): Record<string, unknown> {
  const sensitivePattern = /(key|secret|token|password|webhook|pass|auth|private)/i;
  const masked: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(config)) {
    if (typeof v === "string" && sensitivePattern.test(k)) {
      masked[k] = maskSecret(v);
    } else if (v && typeof v === "object" && !Array.isArray(v)) {
      masked[k] = maskConfigObject(v as Record<string, unknown>);
    } else {
      masked[k] = v;
    }
  }
  return masked;
}

/**
 * Extract client IP address from request headers.
 */
export function getClientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? null;
  }
  return request.headers.get("x-real-ip") ?? null;
}

/**
 * Best-effort audit log writer (never throws on DB unavailability).
 */
export async function writeAuditLog(params: {
  actorType: ActorType;
  actorId?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Prisma.InputJsonValue;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        actorType: params.actorType,
        actorId: params.actorId ?? null,
        action: params.action,
        targetType: params.targetType ?? null,
        targetId: params.targetId ?? null,
        metadata: params.metadata,
        ip: params.ip ?? null,
        userAgent: params.userAgent ?? null,
      },
    });
  } catch (err) {
    console.warn("[writeAuditLog] Skipped audit log write:", err);
  }
}

/**
 * Standard error response helper for API routes.
 */
export function handleApiError(err: unknown, context: string): NextResponse {
  if (err instanceof AuthError) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: err.statusCode }
    );
  }
  if (isDbUnavailableError(err)) {
    console.warn(`[${context}] Database unavailable:`, err);
    return NextResponse.json(
      { ok: false, error: "Database unavailable.", fallback: true },
      { status: 503 }
    );
  }
  console.error(`[${context}] Unexpected error:`, err);
  return NextResponse.json(
    { ok: false, error: "Internal server error." },
    { status: 500 }
  );
}
