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

const gdprSchema = z.object({
  type: z.enum(["EXPORT", "DELETE"]),
});

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const isAdmin = auth.session.user.role === "ADMIN";

  try {
    const requests = await db.gdprRequest.findMany({
      where: isAdmin ? {} : { userId: auth.session.user.id },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ ok: true, requests });
  } catch (err) {
    if (isDbUnavailableError(err)) {
      return NextResponse.json({
        ok: true,
        requests: [],
        fallback: true,
      });
    }
    return handleApiError(err, "GET /api/crm/gdpr");
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody(request, gdprSchema);
  if (!parsed.ok) return parsed.response;

  const userId = auth.session.user.id;
  const { type } = parsed.data;

  try {
    if (type === "EXPORT") {
      const [user, orders, invoices, tickets, seoProjects, smmOrders, gdprRequest] =
        await Promise.all([
          db.user.findUnique({
            where: { id: userId },
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              kycStatus: true,
              status: true,
              createdAt: true,
            },
          }),
          db.order.findMany({ where: { userId }, include: { items: true } }),
          db.invoice.findMany({ where: { userId }, include: { items: true } }),
          db.ticket.findMany({ where: { userId }, include: { messages: true } }),
          db.seoProject.findMany({ where: { userId } }),
          db.smmOrder.findMany({ where: { userId } }),
          db.gdprRequest.create({
            data: {
              userId,
              type: "EXPORT",
              status: "COMPLETED",
              completedAt: new Date(),
            },
          }),
        ]);

      await writeAuditLog({
        actorType: "USER",
        actorId: userId,
        action: "GDPR_EXPORT_COMPLETED",
        targetType: "GdprRequest",
        targetId: gdprRequest.id,
        ip: getClientIp(request),
        userAgent: request.headers.get("user-agent"),
      });

      return NextResponse.json(
        {
          ok: true,
          request: gdprRequest,
          exportData: toJsonSafe({
            exportedAt: new Date().toISOString(),
            user,
            orders,
            invoices,
            tickets,
            seoProjects,
            smmOrders,
          }),
        },
        { status: 201 }
      );
    }

    // DELETE request: create pending request and queue async erasure job
    const gdprRequest = await db.$transaction(async (tx) => {
      const reqRecord = await tx.gdprRequest.create({
        data: {
          userId,
          type: "DELETE",
          status: "PENDING",
        },
      });

      await tx.jobQueue.create({
        data: {
          queueName: "gdpr_delete",
          payload: {
            gdprRequestId: reqRecord.id,
            userId,
          },
          status: "PENDING",
        },
      });

      return reqRecord;
    });

    await writeAuditLog({
      actorType: "USER",
      actorId: userId,
      action: "GDPR_DELETE_REQUESTED",
      targetType: "GdprRequest",
      targetId: gdprRequest.id,
      ip: getClientIp(request),
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json(
      {
        ok: true,
        request: gdprRequest,
        message: "Account deletion request queued for processing.",
      },
      { status: 201 }
    );
  } catch (err) {
    return handleApiError(err, "POST /api/crm/gdpr");
  }
}
