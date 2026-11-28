import { NextRequest, NextResponse } from "next/server";
import { getAdminStore } from "@/server/admin-store";
import type { AdminOrder, AdminOrderStatus } from "@/lib/admin-types";

export async function GET() {
  const store = getAdminStore();
  return NextResponse.json({
    ok: true,
    orders: store.orders,
    customers: store.customers,
    products: store.products,
  });
}

export async function POST(request: NextRequest) {
  const store = getAdminStore();
  const body = await request.json();

  const customer = store.customers.find((c) => c.id === body.customerId) ?? store.customers[0];
  const product = store.products.find((p) => p.id === body.productId) ?? store.products[0];
  const tier = product.tiers.find((t) => t.name === body.packageName) ?? product.tiers[0];
  const cycle = (body.billingCycle as "monthly" | "quarterly" | "annual" | "one_time") || "monthly";

  let unitPriceCents = tier.priceCents;
  if (cycle === "quarterly") unitPriceCents = Math.round(tier.priceCents * 3 * 0.9);
  if (cycle === "annual") unitPriceCents = Math.round(tier.priceCents * 12 * 0.8);

  const quantity = Math.max(1, Number(body.quantity || 1));
  const totalCents = unitPriceCents * quantity;
  const now = new Date().toISOString();
  const nextNum = 1049 + store.orders.length;
  const invNum = 892 + store.invoices.length;

  const newOrder: AdminOrder = {
    id: `ord_${Date.now()}`,
    reference: `WS-2026-${nextNum}`,
    customerId: customer.id,
    customerName: customer.name,
    customerEmail: customer.email,
    status: body.markPaid ? "IN_PROGRESS" : "PENDING",
    paymentMethod: body.paymentMethod || "Stripe",
    paymentStatus: body.markPaid ? "PAID" : "UNPAID",
    totalCents,
    currency: body.currency || "USD",
    invoiceId: `inv_${Date.now()}`,
    invoiceNumber: `INV-2026-0${invNum}`,
    items: [
      {
        id: `oi_${Date.now()}`,
        productId: product.id,
        productName: product.name,
        packageName: tier.name,
        billingCycle: cycle,
        quantity,
        unitPriceCents,
      },
    ],
    brief: {
      domain: body.domain || "",
      targetMarket: body.targetMarket || "",
      goals: body.goals || "",
      notes: body.notes || "",
    },
    lifecycle: [
      {
        id: `lc_${Date.now()}`,
        at: now,
        actor: "Admin Console",
        action: "Order created manually",
        note: body.markPaid ? "Marked paid at creation" : "Awaiting payment",
      },
    ],
    createdAt: now,
    updatedAt: now,
  };

  store.orders.unshift(newOrder);

  store.invoices.unshift({
    id: newOrder.invoiceId!,
    invoiceNumber: newOrder.invoiceNumber!,
    customerId: customer.id,
    customerName: customer.name,
    customerEmail: customer.email,
    orderReference: newOrder.reference,
    subtotalCents: totalCents,
    taxCents: 0,
    totalCents,
    currency: newOrder.currency,
    status: body.markPaid ? "PAID" : "UNPAID",
    formalization: "STANDARD",
    items: [
      {
        id: `ii_${Date.now()}`,
        description: `${product.name} — ${tier.name} (${cycle})`,
        quantity,
        unitPriceCents,
      },
    ],
    issuedAt: now,
    dueAt: now,
    paidAt: body.markPaid ? now : undefined,
  });

  return NextResponse.json({ ok: true, order: newOrder }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const store = getAdminStore();
  const body = await request.json();
  const order = store.orders.find((o) => o.id === body.id);
  if (!order) {
    return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
  }

  const now = new Date().toISOString();
  if (body.status && body.status !== order.status) {
    order.status = body.status as AdminOrderStatus;
    order.lifecycle.push({
      id: `lc_${Date.now()}`,
      at: now,
      actor: "Admin Console",
      action: `Status changed to ${body.status}`,
      note: body.note,
    });
  }
  if (body.paymentStatus) {
    order.paymentStatus = body.paymentStatus;
  }
  if (body.brief) {
    order.brief = { ...order.brief, ...body.brief };
    order.lifecycle.push({
      id: `lc_${Date.now()}_b`,
      at: now,
      actor: "Admin Console",
      action: "Order brief updated",
    });
  }
  order.updatedAt = now;

  return NextResponse.json({ ok: true, order });
}
