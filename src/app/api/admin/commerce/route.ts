import { NextRequest, NextResponse } from "next/server";
import { getAdminStore } from "@/server/admin-store";

export async function GET() {
  const store = getAdminStore();
  return NextResponse.json({
    ok: true,
    transactions: store.transactions,
    paymentLinks: store.paymentLinks,
    gateways: store.gateways,
    checkoutModules: store.checkoutModules,
    coupons: store.coupons,
    pricing: store.pricing,
    products: store.products,
  });
}

export async function POST(request: NextRequest) {
  const store = getAdminStore();
  const body = await request.json();

  if (body.kind === "payment_link") {
    const code = `pay_${Math.random().toString(36).slice(2, 9)}`;
    const link = {
      id: `pl_${Date.now()}`,
      code,
      title: body.title || "Custom Payment Request",
      customerEmail: body.customerEmail || undefined,
      productName: body.productName || undefined,
      amountCents: Math.round(Number(body.amountUsd || 199) * 100),
      currency: body.currency || "USD",
      url: `https://pay.webservicers.com/l/${code}`,
      clicks: 0,
      status: "ACTIVE" as const,
      createdAt: new Date().toISOString(),
    };
    store.paymentLinks.unshift(link);
    return NextResponse.json({ ok: true, paymentLink: link }, { status: 201 });
  }

  if (body.kind === "checkout_module") {
    const fileName = String(body.fileName || "custom-gateway-v1.0.0.zip");
    const mod = {
      id: `mod_${Date.now()}`,
      fileName,
      moduleName: body.moduleName || fileName.replace(/\.zip$/i, ""),
      version: body.version || "1.0.0",
      sizeKb: Number(body.sizeKb || 128),
      uploadedAt: new Date().toISOString(),
      status: "ACTIVE" as const,
    };
    store.checkoutModules.unshift(mod);
    return NextResponse.json({ ok: true, module: mod }, { status: 201 });
  }

  if (body.kind === "coupon") {
    const coupon = {
      id: `cpn_${Date.now()}`,
      code: String(body.code || "PROMO10").toUpperCase().trim(),
      description: body.description || "Promotional discount",
      discountType: (body.discountType || "PERCENT") as "PERCENT" | "FIXED",
      discountValue:
        body.discountType === "FIXED"
          ? Math.round(Number(body.discountValue || 50) * 100)
          : Number(body.discountValue || 10),
      minOrderCents: Math.round(Number(body.minOrderUsd || 0) * 100),
      maxUses: Number(body.maxUses || 100),
      usedCount: 0,
      appliesTo: body.appliesTo || "All Services",
      expiresAt: body.expiresAt || "2027-12-31T23:59:59Z",
      active: true,
    };
    store.coupons.unshift(coupon);
    return NextResponse.json({ ok: true, coupon }, { status: 201 });
  }

  return NextResponse.json({ ok: false, error: "Invalid kind" }, { status: 400 });
}

export async function PATCH(request: NextRequest) {
  const store = getAdminStore();
  const body = await request.json();

  if (body.kind === "gateway") {
    const gw = store.gateways.find((g) => g.id === body.id);
    if (!gw) return NextResponse.json({ ok: false, error: "Gateway not found" }, { status: 404 });
    if (body.enabled !== undefined) gw.enabled = body.enabled;
    if (body.mode) gw.mode = body.mode;
    if (body.feePercent !== undefined) gw.feePercent = Number(body.feePercent);
    if (body.webhookUrl) gw.webhookUrl = body.webhookUrl;
    if (body.publicKeyMasked) {
      gw.publicKeyMasked = body.publicKeyMasked;
      gw.credentialsConfigured = true;
    }
    gw.lastHealthCheck = new Date().toISOString();
    return NextResponse.json({ ok: true, gateway: gw });
  }

  if (body.kind === "coupon") {
    const cpn = store.coupons.find((c) => c.id === body.id);
    if (!cpn) return NextResponse.json({ ok: false, error: "Coupon not found" }, { status: 404 });
    if (body.active !== undefined) cpn.active = body.active;
    return NextResponse.json({ ok: true, coupon: cpn });
  }

  if (body.kind === "pricing") {
    if (body.annualDiscountPct !== undefined) store.pricing.annualDiscountPct = Number(body.annualDiscountPct);
    if (body.quarterlyDiscountPct !== undefined) store.pricing.quarterlyDiscountPct = Number(body.quarterlyDiscountPct);
    if (body.autoTaxEnabled !== undefined) store.pricing.autoTaxEnabled = Boolean(body.autoTaxEnabled);
    if (body.currencies) store.pricing.currencies = body.currencies;
    if (body.tierMultipliers) store.pricing.tierMultipliers = body.tierMultipliers;
    return NextResponse.json({ ok: true, pricing: store.pricing });
  }

  if (body.kind === "transaction_refund") {
    const tx = store.transactions.find((t) => t.id === body.id);
    if (!tx) return NextResponse.json({ ok: false, error: "Transaction not found" }, { status: 404 });
    tx.status = "REFUNDED";
    return NextResponse.json({ ok: true, transaction: tx });
  }

  return NextResponse.json({ ok: false, error: "Invalid kind" }, { status: 400 });
}

export async function DELETE(request: NextRequest) {
  const store = getAdminStore();
  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind");
  const id = searchParams.get("id");

  if (kind === "coupon" && id) {
    store.coupons = store.coupons.filter((c) => c.id !== id);
    return NextResponse.json({ ok: true });
  }
  if (kind === "payment_link" && id) {
    store.paymentLinks = store.paymentLinks.filter((p) => p.id !== id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, error: "Invalid delete" }, { status: 400 });
}
