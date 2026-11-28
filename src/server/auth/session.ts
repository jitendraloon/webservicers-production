import crypto from "node:crypto";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { db } from "@/server/db";

const DEFAULT_SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

function hashSessionToken(token: string): string {
  return crypto.createHash("sha256").update(token, "utf8").digest("hex");
}

export interface CreateSessionOptions {
  impersonatedByAdminId?: string | null;
  ttlSeconds?: number;
  setCookie?: boolean;
}

export interface ValidatedSession<TUser = unknown> {
  session: {
    id: string;
    userId: string;
    impersonatedByAdminId: string | null;
    expiresAt: Date;
  };
  user: TUser;
}

/**
 * Create a new database-backed session with a random 32-byte token,
 * store its SHA-256 hash in the Prisma `Session` table, and set the
 * `ws_session` HttpOnly cookie.
 */
export async function createSession(
  userId: string,
  options: CreateSessionOptions = {}
): Promise<{ token: string; expiresAt: Date }> {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashSessionToken(token);
  const ttlSeconds = options.ttlSeconds ?? DEFAULT_SESSION_TTL_SECONDS;
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

  await db.session.create({
    data: {
      userId,
      tokenHash,
      impersonatedByAdminId: options.impersonatedByAdminId ?? null,
      expiresAt,
    },
  });

  if (options.setCookie !== false) {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: expiresAt,
    });
  }

  return { token, expiresAt };
}

/**
 * Validate a raw session token against the Prisma `Session` table.
 * Expired sessions are deleted and treated as invalid.
 */
export async function validateSession(
  token: string
): Promise<ValidatedSession | null> {
  if (!token) {
    return null;
  }

  const tokenHash = hashSessionToken(token);
  const record = await db.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!record) {
    return null;
  }

  if (record.expiresAt <= new Date()) {
    await db.session.delete({ where: { id: record.id } }).catch(() => undefined);
    return null;
  }

  if (!record.user || record.user.status === "SUSPENDED") {
    return null;
  }

  return {
    session: {
      id: record.id,
      userId: record.userId,
      impersonatedByAdminId: record.impersonatedByAdminId ?? null,
      expiresAt: record.expiresAt,
    },
    user: record.user,
  };
}

/**
 * Destroy a session by token (or from the current request's `ws_session` cookie)
 * and clear the HttpOnly cookie.
 */
export async function destroySession(token?: string): Promise<void> {
  const cookieStore = await cookies();
  const activeToken = token ?? cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (activeToken) {
    const tokenHash = hashSessionToken(activeToken);
    await db.session.deleteMany({ where: { tokenHash } });
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Read the `ws_session` cookie from `next/headers` and validate the session.
 */
export async function getSessionFromCookies(): Promise<ValidatedSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }
  return validateSession(token);
}
