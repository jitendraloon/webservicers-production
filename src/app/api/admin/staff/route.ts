import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/server/db";
import {
  getClientIp,
  handleApiError,
  isDbUnavailableError,
  parseJsonBody,
  requireAuth,
  writeAuditLog,
} from "@/server/api-helpers";

const createStaffSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8).max(128).optional(),
  role: z.enum(["STAFF", "ADMIN"]).default("STAFF"),
  roleGroupId: z.string().trim().min(1).nullable().optional(),
  departmentId: z.string().trim().min(1).nullable().optional(),
});

export async function GET() {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.ok) return auth.response;

  try {
    const [staff, roles, departments] = await Promise.all([
      db.user.findMany({
        where: { role: { in: ["ADMIN", "STAFF"] } },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          roleGroupId: true,
          departmentId: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
          roleGroup: { select: { id: true, name: true } },
          department: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      db.role.findMany({ orderBy: { name: "asc" } }),
      db.department.findMany({ orderBy: { name: "asc" } }),
    ]);

    return NextResponse.json({
      ok: true,
      staff,
      roles,
      departments,
    });
  } catch (err) {
    if (isDbUnavailableError(err)) {
      return NextResponse.json({
        ok: true,
        staff: [],
        roles: [],
        departments: [],
        fallback: true,
      });
    }
    return handleApiError(err, "GET /api/admin/staff");
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody(request, createStaffSchema);
  if (!parsed.ok) return parsed.response;

  const { name, email, password, role, roleGroupId, departmentId } = parsed.data;

  try {
    const existing = await db.user.findUnique({ where: { email } });

    let staffUser;
    if (existing) {
      staffUser = await db.user.update({
        where: { id: existing.id },
        data: {
          name,
          role,
          roleGroupId: roleGroupId ?? existing.roleGroupId,
          departmentId: departmentId ?? existing.departmentId,
          status: "ACTIVE",
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          roleGroupId: true,
          departmentId: true,
          status: true,
          createdAt: true,
        },
      });
    } else {
      if (!password) {
        return NextResponse.json(
          { ok: false, error: "Password is required when creating a new staff account." },
          { status: 400 }
        );
      }
      const passwordHash = await bcrypt.hash(password, 12);
      staffUser = await db.user.create({
        data: {
          name,
          email,
          passwordHash,
          role,
          roleGroupId: roleGroupId ?? null,
          departmentId: departmentId ?? null,
          status: "ACTIVE",
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          roleGroupId: true,
          departmentId: true,
          status: true,
          createdAt: true,
        },
      });
    }

    await writeAuditLog({
      actorType: "ADMIN",
      actorId: auth.session.user.id,
      action: existing ? "STAFF_UPDATED" : "STAFF_CREATED",
      targetType: "User",
      targetId: staffUser.id,
      metadata: { email, role },
      ip: getClientIp(request),
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json(
      { ok: true, staff: staffUser },
      { status: existing ? 200 : 201 }
    );
  } catch (err) {
    return handleApiError(err, "POST /api/admin/staff");
  }
}
