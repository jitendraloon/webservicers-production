import { NextRequest, NextResponse } from "next/server";
import { getAdminStore } from "@/server/admin-store";

export async function GET() {
  const store = getAdminStore();
  return NextResponse.json({
    ok: true,
    services: store.activeServices,
    transfers: store.serviceTransfers,
    upDowngrades: store.serviceUpDowngrades,
    customers: store.customers,
  });
}

export async function PATCH(request: NextRequest) {
  const store = getAdminStore();
  const body = await request.json();

  if (body.kind === "lifecycle") {
    const svc = store.activeServices.find((s) => s.id === body.id);
    if (!svc) return NextResponse.json({ ok: false, error: "Service not found" }, { status: 404 });
    if (body.action === "ACTIVATE") svc.status = "ACTIVE";
    if (body.action === "SUSPEND") svc.status = "SUSPENDED";
    if (body.action === "CANCEL") svc.status = "CANCELLED";
    if (body.packageName) svc.packageName = body.packageName;
    return NextResponse.json({ ok: true, service: svc });
  }

  if (body.kind === "transfer") {
    const tr = store.serviceTransfers.find((t) => t.id === body.id);
    if (!tr) return NextResponse.json({ ok: false, error: "Transfer not found" }, { status: 404 });
    tr.status = body.status;
    if (body.status === "COMPLETED") {
      tr.completedAt = new Date().toISOString();
      const svc = store.activeServices.find((s) => s.id === tr.serviceId);
      if (svc) {
        svc.customerName = tr.toCustomerName;
        svc.customerEmail = tr.toCustomerEmail;
      }
    }
    return NextResponse.json({ ok: true, transfer: tr });
  }

  if (body.kind === "updowngrade") {
    const ud = store.serviceUpDowngrades.find((u) => u.id === body.id);
    if (!ud) return NextResponse.json({ ok: false, error: "Request not found" }, { status: 404 });
    ud.status = body.status;
    if (body.status === "APPLIED") {
      const svc = store.activeServices.find((s) => s.id === ud.serviceId);
      if (svc) {
        svc.packageName = ud.targetPackage;
        svc.priceCents = Math.max(9900, svc.priceCents + ud.prorationDeltaCents);
      }
    }
    return NextResponse.json({ ok: true, request: ud });
  }

  return NextResponse.json({ ok: false, error: "Invalid kind" }, { status: 400 });
}

export async function POST(request: NextRequest) {
  const store = getAdminStore();
  const body = await request.json();

  if (body.kind === "transfer") {
    const svc = store.activeServices.find((s) => s.id === body.serviceId);
    if (!svc) return NextResponse.json({ ok: false, error: "Service not found" }, { status: 404 });
    const newTransfer = {
      id: `tr_${Date.now()}`,
      serviceId: svc.id,
      serviceCode: svc.serviceCode,
      productName: svc.productName,
      fromCustomerName: svc.customerName,
      fromCustomerEmail: svc.customerEmail,
      toCustomerName: body.toCustomerName || "New Owner",
      toCustomerEmail: body.toCustomerEmail || "owner@example.com",
      reason: body.reason || "Admin-initiated ownership transfer",
      status: "PENDING" as const,
      requestedAt: new Date().toISOString(),
    };
    store.serviceTransfers.unshift(newTransfer);
    return NextResponse.json({ ok: true, transfer: newTransfer }, { status: 201 });
  }

  if (body.kind === "updowngrade") {
    const svc = store.activeServices.find((s) => s.id === body.serviceId);
    if (!svc) return NextResponse.json({ ok: false, error: "Service not found" }, { status: 404 });
    const rank = { Standard: 1, Growth: 2, Enterprise: 3 };
    const target = (body.targetPackage || "Growth") as "Standard" | "Growth" | "Enterprise";
    const direction = rank[target] >= rank[svc.packageName] ? "UPGRADE" : "DOWNGRADE";
    const delta = (rank[target] - rank[svc.packageName]) * 50000;
    const newReq = {
      id: `ud_${Date.now()}`,
      serviceId: svc.id,
      serviceCode: svc.serviceCode,
      customerName: svc.customerName,
      productName: svc.productName,
      currentPackage: svc.packageName,
      targetPackage: target,
      direction: direction as "UPGRADE" | "DOWNGRADE",
      prorationDeltaCents: delta,
      status: "PENDING" as const,
      requestedAt: new Date().toISOString(),
    };
    store.serviceUpDowngrades.unshift(newReq);
    return NextResponse.json({ ok: true, request: newReq }, { status: 201 });
  }

  return NextResponse.json({ ok: false, error: "Invalid kind" }, { status: 400 });
}
