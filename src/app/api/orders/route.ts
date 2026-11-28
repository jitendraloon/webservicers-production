import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { orderSchema } from "@/lib/validators";
import {
  getClientIp,
  handleApiError,
  isDbUnavailableError,
  parseJsonBody,
  requireAuth,
  toJsonSafe,
  writeAuditLog,
} from "@/server/api-helpers";
import type { Prisma } from "@prisma/client";

const createOrderBodySchema = orderSchema.extend({
  notes: z.string().trim().max(2000).optional(),
});

function generateReference(prefix: string): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${ts}-${rand}`;
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { session } = auth;
  const isStaffOrAdmin =
    session.user.role === "ADMIN" || session.user.role === "STAFF";

  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status");
  const requestedUserId = searchParams.get("userId");
  const limit = Math.min(Math.max(Number(searchParams.get("limit") || 50), 1), 100);
  const offset = Math.max(Number(searchParams.get("offset") || 0), 0);

  const where: Prisma.OrderWhereInput = {
    ...(isStaffOrAdmin
      ? requestedUserId
        ? { userId: requestedUserId }
        : {}
      : { userId: session.user.id }),
    ...(status ? { status: status as Prisma.EnumOrderStatusFilter } : {}),
  };

  try {
    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: { select: { id: true, name: true, slug: true, type: true } },
              package: { select: { id: true, name: true, tier: true, billingCycle: true } },
            },
          },
          invoices: {
            select: {
              id: true,
              invoiceNumber: true,
              status: true,
              totalCents: true,
              currency: true,
              dueAt: true,
              paidAt: true,
            },
          },
          clientServices: {
            select: {
              id: true,
              status: true,
              cycle: true,
              nextDueAt: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      db.order.count({ where }),
    ]);

    return NextResponse.json({
      ok: true,
      orders: toJsonSafe(orders),
      total,
      limit,
      offset,
    });
  } catch (err) {
    if (isDbUnavailableError(err)) {
      return NextResponse.json({
        ok: true,
        orders: [],
        total: 0,
        limit,
        offset,
        fallback: true,
      });
    }
    return handleApiError(err, "GET /api/orders");
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody(request, createOrderBodySchema);
  if (!parsed.ok) return parsed.response;

  const { items, currency, couponCode, briefJson, notes } = parsed.data;
  const userId = auth.session.user.id;

  try {
    const productIds = Array.from(new Set(items.map((i) => i.productId)));
    const packageIds = Array.from(
      new Set(items.map((i) => i.packageId).filter((id): id is string => Boolean(id)))
    );

    const [products, packages] = await Promise.all([
      db.product.findMany({
        where: { id: { in: productIds } },
        include: { packages: { orderBy: { sortOrder: "asc" } } },
      }),
      packageIds.length > 0
        ? db.productPackage.findMany({ where: { id: { in: packageIds } } })
        : Promise.resolve([]),
    ]);

    const productMap = new Map(products.map((p) => [p.id, p]));
    const packageMap = new Map(packages.map((pkg) => [pkg.id, pkg]));

    let subtotalCents = BigInt(0);
    const resolvedItems: Array<{
      productId: string;
      productName: string;
      packageId: string | null;
      cycle: "MONTHLY" | "QUARTERLY" | "ANNUALLY" | "ONCE";
      quantity: number;
      unitPriceCents: bigint;
    }> = [];

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product || product.status !== "ACTIVE") {
        return NextResponse.json(
          { ok: false, error: `Product not found or inactive: ${item.productId}` },
          { status: 400 }
        );
      }

      const pkg = item.packageId
        ? packageMap.get(item.packageId)
        : product.packages[0];

      if (item.packageId && (!pkg || pkg.productId !== product.id)) {
        return NextResponse.json(
          { ok: false, error: `Invalid package ${item.packageId} for product ${product.name}` },
          { status: 400 }
        );
      }

      const qty = item.quantity ?? 1;
      const unitPriceCents = pkg
        ? pkg.priceCents + pkg.setupFeeCents
        : BigInt(0);
      subtotalCents += unitPriceCents * BigInt(qty);

      resolvedItems.push({
        productId: product.id,
        productName: pkg ? `${product.name} (${pkg.name})` : product.name,
        packageId: pkg?.id ?? null,
        cycle: pkg?.billingCycle ?? "ONCE",
        quantity: qty,
        unitPriceCents,
      });
    }

    let discountCents = BigInt(0);
    let appliedCouponId: string | null = null;

    if (couponCode) {
      const coupon = await db.coupon.findUnique({
        where: { code: couponCode.toUpperCase() },
      });
      if (!coupon || !coupon.enabled) {
        return NextResponse.json(
          { ok: false, error: "Invalid or disabled coupon code." },
          { status: 400 }
        );
      }
      if (coupon.expiresAt && coupon.expiresAt < new Date()) {
        return NextResponse.json(
          { ok: false, error: "Coupon code has expired." },
          { status: 400 }
        );
      }
      if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
        return NextResponse.json(
          { ok: false, error: "Coupon usage limit reached." },
          { status: 400 }
        );
      }
      if (subtotalCents < coupon.minOrderCents) {
        return NextResponse.json(
          { ok: false, error: "Order subtotal does not meet coupon minimum." },
          { status: 400 }
        );
      }

      if (coupon.type === "PERCENT") {
        discountCents = BigInt(
          Math.floor((Number(subtotalCents) * coupon.value) / 100)
        );
      } else {
        discountCents = BigInt(Math.round(coupon.value * 100));
      }
      if (discountCents > subtotalCents) {
        discountCents = subtotalCents;
      }
      appliedCouponId = coupon.id;
    }

    const totalCents = subtotalCents - discountCents;
    const orderReference = generateReference("ORD");
    const invoiceNumber = generateReference("INV");
    const dueAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const created = await db.$transaction(async (tx) => {
      if (appliedCouponId) {
        await tx.coupon.update({
          where: { id: appliedCouponId },
          data: { usedCount: { increment: 1 } },
        });
      }

      const order = await tx.order.create({
        data: {
          reference: orderReference,
          userId,
          status: "PENDING",
          totalCents,
          currency,
          briefJson: (briefJson ?? undefined) as Prisma.InputJsonValue | undefined,
          notes: notes ?? null,
          items: {
            create: resolvedItems.map((ri) => ({
              productId: ri.productId,
              packageId: ri.packageId,
              quantity: ri.quantity,
              unitPriceCents: ri.unitPriceCents,
            })),
          },
        },
        include: { items: true },
      });

      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          userId,
          orderId: order.id,
          subtotalCents,
          taxCents: BigInt(0),
          discountCents,
          totalCents,
          currency,
          status: totalCents === BigInt(0) ? "PAID" : "UNPAID",
          paidAt: totalCents === BigInt(0) ? new Date() : null,
          dueAt,
          items: {
            create: resolvedItems.map((ri) => ({
              description: ri.productName,
              amountCents: ri.unitPriceCents,
              quantity: ri.quantity,
            })),
          },
        },
        include: { items: true },
      });

      const services = await Promise.all(
        resolvedItems.map((ri) =>
          tx.clientService.create({
            data: {
              orderId: order.id,
              userId,
              productId: ri.productId,
              packageId: ri.packageId,
              cycle: ri.cycle,
              status: totalCents === BigInt(0) ? "ACTIVE" : "PENDING",
              activatedAt: totalCents === BigInt(0) ? new Date() : null,
            },
          })
        )
      );

      return { order, invoice, services };
    });

    await writeAuditLog({
      actorType: "USER",
      actorId: userId,
      action: "ORDER_CREATED",
      targetType: "Order",
      targetId: created.order.id,
      metadata: {
        reference: orderReference,
        invoiceNumber,
        totalCents: Number(totalCents),
        currency,
      },
      ip: getClientIp(request),
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json(
      {
        ok: true,
        order: toJsonSafe(created.order),
        invoice: toJsonSafe(created.invoice),
        services: toJsonSafe(created.services),
      },
      { status: 201 }
    );
  } catch (err) {
    return handleApiError(err, "POST /api/orders");
  }
}
