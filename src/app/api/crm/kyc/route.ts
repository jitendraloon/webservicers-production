import { NextRequest, NextResponse } from "next/server";
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
import type { Prisma } from "@prisma/client";

const submitKycSchema = z.object({
  documentType: z.string().trim().min(2).max(64),
  filePath: z.string().trim().min(2).max(500),
});

const reviewKycSchema = z.object({
  id: z.string().trim().min(1),
  decision: z.enum(["APPROVED", "REJECTED"]),
  rejectionReason: z.string().trim().max(1000).optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { session } = auth;
  const isStaffOrAdmin =
    session.user.role === "ADMIN" || session.user.role === "STAFF";
  const status = request.nextUrl.searchParams.get("status");

  const where: Prisma.KycDocumentWhereInput = {
    ...(isStaffOrAdmin ? {} : { userId: session.user.id }),
    ...(status ? { status: status as Prisma.EnumKycDocStatusFilter } : {}),
  };

  try {
    const [documents, currentUser] = await Promise.all([
      db.kycDocument.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, kycStatus: true } },
          reviewer: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      db.user.findUnique({
        where: { id: session.user.id },
        select: { kycStatus: true },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      kycStatus: currentUser?.kycStatus ?? "NONE",
      documents,
    });
  } catch (err) {
    if (isDbUnavailableError(err)) {
      return NextResponse.json({
        ok: true,
        kycStatus: "NONE",
        documents: [],
        fallback: true,
      });
    }
    return handleApiError(err, "GET /api/crm/kyc");
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody(request, submitKycSchema);
  if (!parsed.ok) return parsed.response;

  const { documentType, filePath } = parsed.data;
  const userId = auth.session.user.id;

  try {
    const document = await db.$transaction(async (tx) => {
      const doc = await tx.kycDocument.create({
        data: {
          userId,
          documentType,
          filePath,
          status: "PENDING",
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: { kycStatus: "PENDING" },
      });

      return doc;
    });

    await writeAuditLog({
      actorType: "USER",
      actorId: userId,
      action: "KYC_SUBMITTED",
      targetType: "KycDocument",
      targetId: document.id,
      metadata: { documentType },
      ip: getClientIp(request),
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json({ ok: true, document }, { status: 201 });
  } catch (err) {
    return handleApiError(err, "POST /api/crm/kyc");
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth(["ADMIN", "STAFF"]);
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody(request, reviewKycSchema);
  if (!parsed.ok) return parsed.response;

  const { id, decision, rejectionReason } = parsed.data;

  if (decision === "REJECTED" && !rejectionReason) {
    return NextResponse.json(
      { ok: false, error: "Rejection reason is required when rejecting KYC." },
      { status: 400 }
    );
  }

  try {
    const existing = await db.kycDocument.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "KYC document not found." },
        { status: 404 }
      );
    }

    const updated = await db.$transaction(async (tx) => {
      const doc = await tx.kycDocument.update({
        where: { id },
        data: {
          status: decision,
          reviewedBy: auth.session.user.id,
          reviewedAt: new Date(),
          rejectionReason: decision === "REJECTED" ? rejectionReason ?? null : null,
        },
      });

      await tx.user.update({
        where: { id: existing.userId },
        data: {
          kycStatus: decision === "APPROVED" ? "VERIFIED" : "REJECTED",
        },
      });

      return doc;
    });

    await writeAuditLog({
      actorType: "ADMIN",
      actorId: auth.session.user.id,
      action: `KYC_${decision}`,
      targetType: "KycDocument",
      targetId: id,
      metadata: { targetUserId: existing.userId, rejectionReason: rejectionReason ?? null },
      ip: getClientIp(request),
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json({ ok: true, document: updated });
  } catch (err) {
    return handleApiError(err, "PATCH /api/crm/kyc");
  }
}
