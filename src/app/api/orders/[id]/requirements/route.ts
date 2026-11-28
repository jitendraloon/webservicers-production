import { NextRequest, NextResponse } from "next/server";
import { getAdminStore } from "@/server/admin-store";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const store = getAdminStore();
  const order = store.orders.find((o) => o.id === id || o.reference === id);

  if (!order) {
    return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
  }

  // Find product requirements relevant to items in this order
  const productIds = order.items.map((i) => i.productId);
  const orderedProducts = store.products.filter((p) => productIds.includes(p.id));

  const attachedReqIds = new Set<string>();
  orderedProducts.forEach((p) => {
    (p.requirementIds || []).forEach((rid) => attachedReqIds.add(rid));
  });

  let applicableFields = store.requirements.filter((r) => attachedReqIds.has(r.id));
  if (applicableFields.length === 0) {
    // Default standard fields bank if no specific assigned
    applicableFields = store.requirements.slice(0, 4);
  }

  return NextResponse.json({
    ok: true,
    orderId: order.id,
    reference: order.reference,
    fields: applicableFields,
    responses: order.requirementResponses || {},
    status: order.requirementsStatus || "PENDING",
    revisionNotes: order.requirementsRevisionNotes,
  });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const store = getAdminStore();
  const order = store.orders.find((o) => o.id === id || o.reference === id);

  if (!order) {
    return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
  }

  const body = await request.json();
  const responses = body.responses || {};
  const now = new Date().toISOString();

  order.requirementResponses = {
    ...(order.requirementResponses || {}),
    ...responses,
  };
  order.requirementsStatus = "SUBMITTED";
  order.requirementsRevisionNotes = undefined;

  order.lifecycle.push({
    id: `lc_${Date.now()}`,
    at: now,
    actor: body.submittedBy || order.customerName,
    action: "Project Requirements Submitted",
    note: "Customer submitted / updated requirement inputs.",
  });

  order.updatedAt = now;

  return NextResponse.json({
    ok: true,
    responses: order.requirementResponses,
    status: order.requirementsStatus,
  });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const store = getAdminStore();
  const order = store.orders.find((o) => o.id === id || o.reference === id);

  if (!order) {
    return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
  }

  const body = await request.json();
  const { action, notes } = body;
  const now = new Date().toISOString();

  if (action === "approve") {
    order.requirementsStatus = "APPROVED";
    order.requirementsRevisionNotes = undefined;
    if (order.status === "AWAITING_BRIEF" || order.status === "PENDING") {
      order.status = "IN_PROGRESS";
    }

    order.lifecycle.push({
      id: `lc_${Date.now()}`,
      at: now,
      actor: "Operations Specialist",
      action: "Requirements Approved",
      note: notes || "Requirements verified; fulfillment initiated.",
    });

    if (!order.conversations) order.conversations = [];
    order.conversations.push({
      id: `msg_${Date.now()}`,
      orderId: order.id,
      senderId: "system",
      senderName: "Operations Desk",
      senderRole: "SYSTEM",
      message: `Project requirements approved by our team. Fulfillment is now proceeding. ${notes ? `Note: ${notes}` : ""}`,
      createdAt: now,
    });
  } else if (action === "request_revision") {
    order.requirementsStatus = "REVISION_REQUESTED";
    order.requirementsRevisionNotes = notes || "Additional project details needed.";

    order.lifecycle.push({
      id: `lc_${Date.now()}`,
      at: now,
      actor: "Operations Specialist",
      action: "Requirements Revision Requested",
      note: notes,
    });

    if (!order.conversations) order.conversations = [];
    order.conversations.push({
      id: `msg_${Date.now()}`,
      orderId: order.id,
      senderId: "staff",
      senderName: "Operations Specialist",
      senderRole: "ADMIN",
      message: `We reviewed your project requirements and need a few clarifications before we can proceed: ${notes || "Please check the Requirements tab and update the requested fields."}`,
      createdAt: now,
    });
  }

  order.updatedAt = now;
  return NextResponse.json({
    ok: true,
    status: order.requirementsStatus,
    revisionNotes: order.requirementsRevisionNotes,
  });
}
