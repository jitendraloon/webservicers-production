import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import {
  getClientIp,
  handleApiError,
  parseJsonBody,
  requireAuth,
  toJsonSafe,
  writeAuditLog,
} from "@/server/api-helpers";

const checkoutSchema = z.object({
  invoiceId: z.string().trim().min(1, "Invoice ID is required"),
  gateway: z.string().trim().min(1, "Payment gateway is required").toLowerCase(),
  returnUrl: z.string().trim().url().optional(),
});

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody(request, checkoutSchema);
  if (!parsed.ok) return parsed.response;

  const { invoiceId, gateway, returnUrl } = parsed.data;
  const userId = auth.session.user.id;
  const isStaffOrAdmin =
    auth.session.user.role === "ADMIN" || auth.session.user.role === "STAFF";

  try {
    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
      include: { order: true },
    });

    if (!invoice) {
      return NextResponse.json(
        { ok: false, error: "Invoice not found." },
        { status: 404 }
      );
    }

    if (!isStaffOrAdmin && invoice.userId !== userId) {
      return NextResponse.json(
        { ok: false, error: "Insufficient permissions for this invoice." },
        { status: 403 }
      );
    }

    if (invoice.status === "PAID") {
      return NextResponse.json(
        { ok: false, error: "Invoice is already paid." },
        { status: 400 }
      );
    }

    if (invoice.status === "CANCELLED" || invoice.status === "REFUNDED") {
      return NextResponse.json(
        { ok: false, error: `Cannot pay an invoice with status ${invoice.status}.` },
        { status: 400 }
      );
    }

    if (gateway === "wallet") {
      const movements = await db.balanceMovement.findMany({
        where: { userId: invoice.userId, currency: invoice.currency },
        select: { type: true, amountCents: true },
      });

      let balanceCents = BigInt(0);
      for (const m of movements) {
        balanceCents =
          m.type === "CREDIT"
            ? balanceCents + m.amountCents
            : balanceCents - m.amountCents;
      }

      if (balanceCents < invoice.totalCents) {
        return NextResponse.json(
          {
            ok: false,
            error: "Insufficient wallet balance.",
            balanceCents: Number(balanceCents),
            requiredCents: Number(invoice.totalCents),
          },
          { status: 400 }
        );
      }

      const result = await db.$transaction(async (tx) => {
        const movement = await tx.balanceMovement.create({
          data: {
            userId: invoice.userId,
            type: "DEBIT",
            amountCents: invoice.totalCents,
            currency: invoice.currency,
            reference: invoice.invoiceNumber,
            description: `Payment for invoice ${invoice.invoiceNumber}`,
          },
        });

        const updatedInvoice = await tx.invoice.update({
          where: { id: invoice.id },
          data: { status: "PAID", paidAt: new Date() },
        });

        if (invoice.orderId) {
          await tx.order.updateMany({
            where: { id: invoice.orderId, status: "PENDING" },
            data: { status: "IN_PROGRESS" },
          });
          await tx.clientService.updateMany({
            where: { orderId: invoice.orderId, status: "PENDING" },
            data: { status: "ACTIVE", activatedAt: new Date() },
          });
        }

        return { movement, invoice: updatedInvoice };
      });

      await writeAuditLog({
        actorType: "USER",
        actorId: userId,
        action: "INVOICE_PAID_WALLET",
        targetType: "Invoice",
        targetId: invoice.id,
        metadata: {
          amountCents: Number(invoice.totalCents),
          currency: invoice.currency,
        },
        ip: getClientIp(request),
        userAgent: request.headers.get("user-agent"),
      });

      return NextResponse.json({
        ok: true,
        mode: "wallet",
        paid: true,
        invoice: toJsonSafe(result.invoice),
        movement: toJsonSafe(result.movement),
        remainingBalanceCents: Number(balanceCents - invoice.totalCents),
      });
    }

    // External gateway checkout initiation
    const gw = await db.paymentGateway.findUnique({
      where: { slug: gateway },
    });

    if (!gw || !gw.enabled) {
      return NextResponse.json(
        { ok: false, error: `Payment gateway "${gateway}" is not enabled.` },
        { status: 400 }
      );
    }

    if (gw.minAmountCents > BigInt(0) && invoice.totalCents < gw.minAmountCents) {
      return NextResponse.json(
        { ok: false, error: "Invoice amount is below gateway minimum." },
        { status: 400 }
      );
    }
    if (gw.maxAmountCents > BigInt(0) && invoice.totalCents > gw.maxAmountCents) {
      return NextResponse.json(
        { ok: false, error: "Invoice amount exceeds gateway maximum." },
        { status: 400 }
      );
    }

    const paymentEvent = await db.paymentEvent.create({
      data: {
        gatewaySlug: gw.slug,
        invoiceId: invoice.id,
        amountCents: invoice.totalCents,
        currency: invoice.currency,
        status: "INITIATED",
        metadata: {
          returnUrl: returnUrl ?? null,
          initiatedBy: userId,
        },
      },
    });

    const baseAppUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const checkoutUrl = `${baseAppUrl}/dashboard/billing?checkout=${paymentEvent.id}&gateway=${gw.slug}&invoice=${invoice.invoiceNumber}`;

    await writeAuditLog({
      actorType: "USER",
      actorId: userId,
      action: "CHECKOUT_INITIATED",
      targetType: "PaymentEvent",
      targetId: paymentEvent.id,
      metadata: { gateway: gw.slug, invoiceId: invoice.id },
      ip: getClientIp(request),
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json({
      ok: true,
      mode: "gateway",
      gateway: gw.slug,
      paymentEventId: paymentEvent.id,
      checkoutUrl,
      amountCents: Number(invoice.totalCents),
      currency: invoice.currency,
    });
  } catch (err) {
    return handleApiError(err, "POST /api/payments/checkout");
  }
}
