import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import {
  getClientIp,
  handleApiError,
  isDbUnavailableError,
  parseJsonBody,
  requireAuth,
  toJsonSafe,
  writeAuditLog,
} from "@/server/api-helpers";

const createCouponSchema = z.object({
  code: z.string().trim().min(2).max(64).toUpperCase(),
  type: z.enum(["PERCENT", "FIXED"]),
  value: z.number().positive(),
  maxUses: z.number().int().positive().nullable().optional(),
  minOrderCents: z.number().int().min(0).default(0),
  applicableProductIds: z.array(z.string().trim().min(1)).optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  enabled: z.boolean().default(true),
});

export async function GET() {
  const auth = await requireAuth(["ADMIN", "STAFF"]);
  if (!auth.ok) return auth.response;

  try {
    const coupons = await db.coupon.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      ok: true,
      coupons: toJsonSafe(coupons),
    });
  } catch (err) {
    if (isDbUnavailableError(err)) {
      return NextResponse.json({
        ok: true,
        coupons: [],
        fallback: true,
      });
    }
    return handleApiError(err, "GET /api/admin/coupons");
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody(request, createCouponSchema);
  if (!parsed.ok) return parsed.response;

  const data = parsed.data;

  if (data.type === "PERCENT" && data.value > 100) {
    return NextResponse.json(
      { ok: false, error: "Percentage coupon value cannot exceed 100." },
      { status: 400 }
    );
  }

  try {
    const existing = await db.coupon.findUnique({ where: { code: data.code } });
    if (existing) {
      return NextResponse.json(
        { ok: false, error: `Coupon code "${data.code}" already exists.` },
        { status: 409 }
      );
    }

    const coupon = await db.coupon.create({
      data: {
        code: data.code,
        type: data.type,
        value: data.value,
        maxUses: data.maxUses ?? null,
        minOrderCents: BigInt(data.minOrderCents ?? 0),
        applicableProductIds: data.applicableProductIds ?? undefined,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        enabled: data.enabled ?? true,
      },
    });

    await writeAuditLog({
      actorType: "ADMIN",
      actorId: auth.session.user.id,
      action: "COUPON_CREATED",
      targetType: "Coupon",
      targetId: coupon.id,
      metadata: { code: coupon.code, type: coupon.type, value: coupon.value },
      ip: getClientIp(request),
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json(
      { ok: true, coupon: toJsonSafe(coupon) },
      { status: 201 }
    );
  } catch (err) {
    return handleApiError(err, "POST /api/admin/coupons");
  }
}
