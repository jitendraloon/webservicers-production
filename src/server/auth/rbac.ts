import type { UserRole } from "@/lib/types";
import { db } from "@/server/db";
import { getSessionFromCookies, type ValidatedSession } from "./session";

export class AuthError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "AuthError";
    this.statusCode = statusCode;
  }
}

export interface SessionUserRecord {
  id: string;
  role: UserRole;
  roleGroupId?: string | null;
  status?: string;
}

/**
 * Ensure the current request has a valid authenticated session and that the
 * user holds one of the allowed roles. Throws `AuthError` (401/403) otherwise.
 */
export async function requireRole(
  allowedRoles: readonly UserRole[]
): Promise<ValidatedSession<SessionUserRecord>> {
  const result = await getSessionFromCookies();
  if (!result) {
    throw new AuthError("Authentication required.", 401);
  }

  const user = result.user as SessionUserRecord;
  if (!allowedRoles.includes(user.role)) {
    throw new AuthError("Insufficient role permissions.", 403);
  }

  return result as ValidatedSession<SessionUserRecord>;
}

/**
 * Check whether a user has permission to perform `action` on `module`.
 * Users with role `ADMIN` are granted all permissions automatically.
 */
export async function hasPermission(
  userId: string,
  module: string,
  action: string
): Promise<boolean> {
  if (!userId || !module || !action) {
    return false;
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      status: true,
      roleGroupId: true,
    },
  });

  if (!user || user.status === "SUSPENDED") {
    return false;
  }

  if (user.role === "ADMIN") {
    return true;
  }

  if (!user.roleGroupId) {
    return false;
  }

  const permission = await db.rolePermission.findFirst({
    where: {
      roleId: user.roleGroupId,
      OR: [
        { module, action },
        { module, action: "*" },
        { module: "*", action: "*" },
      ],
    },
    select: { id: true },
  });

  return Boolean(permission);
}
