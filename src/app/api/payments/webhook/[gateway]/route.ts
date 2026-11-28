import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { decrypt } from "@/server/crypto";
import {
  getClientIp,
  handleApiError,
  toJsonSafe,
  writeAuditLog,
} from "@/server/api-helpers";
import type { Prisma } from "@prisma/client";

const webhookPayloadSchema = z.object({
  eventId: z.string().trim().min(1).optional(),
  paymentEventId: z.string().trim().min(1).optional(),
  invoiceId: z.string().trim().min(1).optional(),
  status: z.enum(["SUCCESS", "FAILED", "REFUNDED"]),
  amountCents: z.number().int().min(0).optional(),
  currency: z.string().trim().length(3).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ gateway: string }> }
) {
  const { gateway: gatewaySlugRaw } = await context.params;
  const gatewaySlug = gatewaySlugRaw.toLowerCase();

  let rawText = "";
  let rawJson: unknown;
  try {
    rawText = await request.text();
    rawJson = JSON.parse(rawText);
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON webhook payload." },
      { status: 400 }
    );
  }

  const parsed = webhookPayloadSchema.safeParse(rawJson);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid webhook payload.",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const data = parsed.data;

  try {
    const gw = await db.paymentGateway.findUnique({
      where: { slug: gatewaySlug },
    });

    if (!gw) {
      return NextResponse.json(
        { ok: false, error: `Unknown payment gateway: ${gatewaySlug}` },
        { status: 404 }
      );
    }

    // Verify HMAC signature if gateway has a webhookSecret configured and signature header is sent
    const sigHeader =
      request.headers.get("x-webhook-signature") ??
      request.headers.get("x-signature");

    if (gw.configEnc && sigHeader) {
      try {
        const cfg = JSON.parse(decrypt(gw.configEnc)) as { webhookSecret?: string };
        if (cfg.webhookSecret) {
          const expected = crypto
            .createHmac("sha256", cfg.webhookSecret)
            .update(rawText)
            .digest("hex");
          if (sigHeader !== expected) {
            return NextResponse.json(
              { ok: false, error: "Invalid webhook signature." },
              { status: 401 }
            );
          }
        }
      } catch {
        return NextResponse.json(
          { ok: false, error: "Unable to verify webhook signature." },
          { status: 400 }
        );
      }
    }

    const result = await db.$transaction(async (tx) => {
      let paymentEvent = data.paymentEventId
        ? await tx.paymentEvent.findUnique({ where: { id: data.paymentEventId } })
        : null;

      if (paymentEvent) {
        paymentEvent = await tx.paymentEvent.update({
          where: { id: paymentEvent.id },
          data: {
            gatewayEventId: data.eventId ?? paymentEvent.gatewayEventId,
            status: data.status,
            metadata: (data.metadata ?? paymentEvent.metadata ?? undefined) as
              | Prisma.InputJsonValue
              | undefined,
          },
        });
      } else {
        paymentEvent = await tx.paymentEvent.create({
          data: {
            gatewaySlug,
            gatewayEventId: data.eventId ?? null,
            invoiceId: data.invoiceId ?? null,
            amountCents: BigInt(data.amountCents ?? 0),
            currency: (data.currency ?? "USD").toUpperCase(),
            status: data.status,
            metadata: (data.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
          },
        });
      }

      const targetInvoiceId = data.invoiceId ?? paymentEvent.invoiceId;
      if (targetInvoiceId && data.status === "SUCCESS") {
        const invoice = await tx.invoice.update({
          where: { id: targetInvoiceId },
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

        await tx.cashVault.create({
          data: {
            reference: invoice.invoiceNumber,
            amountCents: invoice.totalCents,
            currency: invoice.currency,
            type: "INCOME",
            notes: `Gateway ${gatewaySlug} payment (${paymentEvent.id})`,
          },
        });
      } else if (targetInvoiceId && data.status === "REFUNDED") {
        await tx.invoice.update({
          where: { id: targetInvoiceId },
          data: { status: "REFUNDED" },
        });
      }

      return paymentEvent;
    });

    await writeAuditLog({
      actorType: "SYSTEM",
      action: `PAYMENT_WEBHOOK_${data.status}`,
      targetType: "PaymentEvent",
      targetId: result.id,
      metadata: {
        gateway: gatewaySlug,
        invoiceId: result.invoiceId,
        status: data.status,
      },
      ip: getClientIp(request),
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json({
      ok: true,
      received: true,
      paymentEvent: toJsonSafe(result),
    });
  } catch (err) {
    return handleApiError(err, "POST /api/payments/webhook/[gateway]");
  }
}
