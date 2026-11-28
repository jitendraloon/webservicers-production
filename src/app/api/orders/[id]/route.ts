import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { getAdminStore } from "@/server/admin-store";
import {
  getClientIp,
  handleApiError,
  parseJsonBody,
  requireAuth,
  toJsonSafe,
  writeAuditLog,
} from "@/server/api-helpers";

const patchOrderSchema = z.object({
  status: z
    .enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED", "REFUNDED"])
    .optional(),
  notes: z.string().trim().max(2000).optional(),
  assignedTo: z.string().trim().min(1).nullable().optional(),
});

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const { session } = auth;
  const isStaffOrAdmin =
    session.user.role === "ADMIN" || session.user.role === "STAFF";

  try {
    const order = await db.order.findFirst({
      where: {
        OR: [{ id }, { reference: id }],
      },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, slug: true, type: true } },
            package: { select: { id: true, name: true, tier: true, billingCycle: true } },
          },
        },
        invoices: {
          include: { items: true },
        },
        clientServices: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!order) {
      const store = getAdminStore();
      const storeOrder = store.orders.find((o) => o.id === id || o.reference === id);
      if (storeOrder) {
        return NextResponse.json({
          ok: true,
          order: storeOrder,
        });
      }
      return NextResponse.json(
        { ok: false, error: "Order not found." },
        { status: 404 }
      );
    }

    if (!isStaffOrAdmin && order.userId !== session.user.id) {
      return NextResponse.json(
        { ok: false, error: "Insufficient permissions to view this order." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      ok: true,
      order: toJsonSafe(order),
    });
  } catch (err) {
    return handleApiError(err, "GET /api/orders/[id]");
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody(request, patchOrderSchema);
  if (!parsed.ok) return parsed.response;

  const { id } = await context.params;
  const { session } = auth;
  const isStaffOrAdmin =
    session.user.role === "ADMIN" || session.user.role === "STAFF";

  try {
    const existing = await db.order.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Order not found." },
        { status: 404 }
      );
    }

    if (!isStaffOrAdmin) {
      if (existing.userId !== session.user.id) {
        return NextResponse.json(
          { ok: false, error: "Insufficient permissions." },
          { status: 403 }
        );
      }
      if (
        parsed.data.status !== "CANCELLED" ||
        existing.status !== "PENDING" ||
        parsed.data.assignedTo !== undefined
      ) {
        return NextResponse.json(
          { ok: false, error: "Users may only cancel their own pending orders." },
          { status: 403 }
        );
      }
    }

    const updated = await db.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id },
        data: {
          ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
          ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes } : {}),
          ...(parsed.data.assignedTo !== undefined
            ? { assignedTo: parsed.data.assignedTo }
            : {}),
        },
        include: { items: true, clientServices: true, invoices: true },
      });

      if (parsed.data.status === "COMPLETED") {
        await tx.clientService.updateMany({
          where: { orderId: id, status: "PENDING" },
          data: { status: "ACTIVE", activatedAt: new Date() },
        });
      } else if (parsed.data.status === "CANCELLED") {
        await tx.clientService.updateMany({
          where: { orderId: id },
          data: { status: "CANCELLED" },
        });
      }

      return order;
    });

    await writeAuditLog({
      actorType: isStaffOrAdmin ? "ADMIN" : "USER",
      actorId: session.user.id,
      action: "ORDER_UPDATED",
      targetType: "Order",
      targetId: id,
      metadata: parsed.data,
      ip: getClientIp(request),
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json({
      ok: true,
      order: toJsonSafe(updated),
    });
  } catch (err) {
    return handleApiError(err, "PATCH /api/orders/[id]");
  }
}
