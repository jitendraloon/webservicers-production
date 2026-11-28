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

const createSmmOrderSchema = z.object({
  serviceId: z.string().trim().min(1, "Service ID is required"),
  link: z.string().trim().url("A valid target URL is required"),
  quantity: z.number().int().min(1),
});

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const isStaffOrAdmin =
    auth.session.user.role === "ADMIN" || auth.session.user.role === "STAFF";

  try {
    const orders = await db.smmOrder.findMany({
      where: isStaffOrAdmin ? {} : { userId: auth.session.user.id },
      include: {
        service: {
          select: { id: true, name: true, category: true, externalId: true },
        },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ ok: true, orders: toJsonSafe(orders) });
  } catch (err) {
    if (isDbUnavailableError(err)) {
      return NextResponse.json({
        ok: true,
        orders: [],
        fallback: true,
      });
    }
    return handleApiError(err, "GET /api/smm/orders");
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody(request, createSmmOrderSchema);
  if (!parsed.ok) return parsed.response;

  const { serviceId, link, quantity } = parsed.data;
  const userId = auth.session.user.id;

  try {
    const service = await db.smmService.findUnique({
      where: { id: serviceId },
      include: { provider: true },
    });

    if (!service || service.status !== "ACTIVE" || service.provider.status !== "ACTIVE") {
      return NextResponse.json(
        { ok: false, error: "SMM service is not available." },
        { status: 400 }
      );
    }

    if (quantity < service.minQty || quantity > service.maxQty) {
      return NextResponse.json(
        {
          ok: false,
          error: `Quantity must be between ${service.minQty} and ${service.maxQty}.`,
        },
        { status: 400 }
      );
    }

    const effectiveRateUsd =
      service.ratePerThousand * (1 + service.marginPercent / 100);
    const chargeCents = BigInt(
      Math.max(1, Math.ceil((quantity / 1000) * effectiveRateUsd * 100))
    );

    const movements = await db.balanceMovement.findMany({
      where: { userId, currency: "USD" },
      select: { type: true, amountCents: true },
    });

    let balanceCents = BigInt(0);
    for (const m of movements) {
      balanceCents =
        m.type === "CREDIT"
          ? balanceCents + m.amountCents
          : balanceCents - m.amountCents;
    }

    if (balanceCents < chargeCents) {
      return NextResponse.json(
        {
          ok: false,
          error: "Insufficient USD wallet balance for this SMM order.",
          balanceCents: Number(balanceCents),
          chargeCents: Number(chargeCents),
        },
        { status: 400 }
      );
    }

    const created = await db.$transaction(async (tx) => {
      await tx.balanceMovement.create({
        data: {
          userId,
          type: "DEBIT",
          amountCents: chargeCents,
          currency: "USD",
          reference: `SMM-${service.externalId}`,
          description: `SMM Order: ${service.name} x${quantity}`,
        },
      });

      const smmOrder = await tx.smmOrder.create({
        data: {
          userId,
          serviceId: service.id,
          link,
          quantity,
          chargeCents,
          currency: "USD",
          status: "PENDING",
          remains: quantity,
        },
      });

      await tx.jobQueue.create({
        data: {
          queueName: "smm_dispatch",
          payload: { smmOrderId: smmOrder.id, providerId: service.providerId },
          status: "PENDING",
        },
      });

      return smmOrder;
    });

    await writeAuditLog({
      actorType: "USER",
      actorId: userId,
      action: "SMM_ORDER_PLACED",
      targetType: "SmmOrder",
      targetId: created.id,
      metadata: {
        serviceId: service.id,
        quantity,
        chargeCents: Number(chargeCents),
      },
      ip: getClientIp(request),
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json(
      { ok: true, order: toJsonSafe(created) },
      { status: 201 }
    );
  } catch (err) {
    return handleApiError(err, "POST /api/smm/orders");
  }
}
