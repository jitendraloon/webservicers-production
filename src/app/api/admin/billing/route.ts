import { NextRequest, NextResponse } from "next/server";
import { getAdminStore } from "@/server/admin-store";

export async function GET() {
  const store = getAdminStore();
  return NextResponse.json({
    ok: true,
    invoices: store.invoices,
    subscriptions: store.subscriptions,
    cashVault: store.cashVault,
    customers: store.customers,
  });
}

export async function POST(request: NextRequest) {
  const store = getAdminStore();
  const body = await request.json();

  if (body.kind === "invoice") {
    const customer = store.customers.find((c) => c.id === body.customerId) ?? store.customers[0];
    const items = Array.isArray(body.items) && body.items.length > 0
      ? body.items.map((it: { description: string; quantity: number; unitPriceUsd: number }, idx: number) => ({
          id: `ii_${Date.now()}_${idx}`,
          description: it.description || "Consulting Service",
          quantity: Math.max(1, Number(it.quantity || 1)),
          unitPriceCents: Math.round(Number(it.unitPriceUsd || 0) * 100),
        }))
      : [{ id: `ii_${Date.now()}`, description: "Custom Retainer", quantity: 1, unitPriceCents: 49900 }];

    const subtotalCents = items.reduce((s: number, it: { quantity: number; unitPriceCents: number }) => s + it.quantity * it.unitPriceCents, 0);
    const taxRate = Number(body.taxRatePct || 0);
    const taxCents = Math.round((subtotalCents * taxRate) / 100);
    const totalCents = subtotalCents + taxCents;
    const now = new Date().toISOString();
    const num = 892 + store.invoices.length;

    const newInvoice = {
      id: `inv_${Date.now()}`,
      invoiceNumber: `INV-2026-0${num}`,
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      subtotalCents,
      taxCents,
      totalCents,
      currency: body.currency || "USD",
      status: (body.markPaid ? "PAID" : "UNPAID") as "PAID" | "UNPAID",
      formalization: (body.formalization || "STANDARD") as "STANDARD" | "VAT_EINVOICE" | "GST_TAX_INVOICE" | "PROFORMA",
      taxId: body.taxId || undefined,
      notes: body.notes || undefined,
      items,
      issuedAt: now,
      dueAt: body.dueAt || now,
      paidAt: body.markPaid ? now : undefined,
    };

    store.invoices.unshift(newInvoice);
    return NextResponse.json({ ok: true, invoice: newInvoice }, { status: 201 });
  }

  if (body.kind === "cash_entry") {
    const rawCents = Math.round(Number(body.amountUsd || 0) * 100);
    const signedCents = body.type === "PAYOUT" || body.type === "RESERVE" ? -Math.abs(rawCents) : Math.abs(rawCents);
    const entry = {
      id: `cv_${Date.now()}`,
      reference: `VLT-2026-${119 + store.cashVault.length}`,
      type: body.type || "INFLOW",
      method: body.method || "CASH_COUNTER",
      description: body.description || "Manual vault entry",
      amountCents: signedCents,
      currency: body.currency || "USD",
      recordedBy: "Admin Finance",
      createdAt: new Date().toISOString(),
    };
    store.cashVault.unshift(entry);
    return NextResponse.json({ ok: true, entry }, { status: 201 });
  }

  return NextResponse.json({ ok: false, error: "Invalid kind" }, { status: 400 });
}

export async function PATCH(request: NextRequest) {
  const store = getAdminStore();
  const body = await request.json();

  if (body.kind === "invoice") {
    const inv = store.invoices.find((i) => i.id === body.id);
    if (!inv) return NextResponse.json({ ok: false, error: "Invoice not found" }, { status: 404 });
    if (body.status) {
      inv.status = body.status;
      if (body.status === "PAID") inv.paidAt = new Date().toISOString();
    }
    if (body.formalization) inv.formalization = body.formalization;
    if (body.taxId !== undefined) inv.taxId = body.taxId;
    return NextResponse.json({ ok: true, invoice: inv });
  }

  if (body.kind === "subscription") {
    const sub = store.subscriptions.find((s) => s.id === body.id);
    if (!sub) return NextResponse.json({ ok: false, error: "Subscription not found" }, { status: 404 });
    if (body.status) sub.status = body.status;
    return NextResponse.json({ ok: true, subscription: sub });
  }

  return NextResponse.json({ ok: false, error: "Invalid kind" }, { status: 400 });
}
