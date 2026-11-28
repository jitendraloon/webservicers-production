import { NextRequest, NextResponse } from "next/server";
import { getAdminStore } from "@/server/admin-store";

export async function GET() {
  const store = getAdminStore();
  const cancellationRequests = store.orders.filter(
    (o) => o.cancellationRequested || o.status === "CANCELLED" || o.status === "REFUNDED"
  );
  return NextResponse.json({
    ok: true,
    requests: cancellationRequests,
    totalCount: cancellationRequests.length,
    pendingCount: cancellationRequests.filter((o) => o.cancellationStatus === "PENDING").length,
  });
}

export async function POST(request: NextRequest) {
  const store = getAdminStore();
  const body = await request.json();
  const { orderId, action, note, refundAmountCents } = body;

  const order = store.orders.find((o) => o.id === orderId || o.reference === orderId);
  if (!order) {
    return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
  }

  const now = new Date().toISOString();

  if (action === "approve") {
    order.status = "CANCELLED";
    order.paymentStatus = "REFUNDED";
    order.cancellationStatus = "APPROVED";
    order.cancellationDecisionNote = note || "Cancellation approved and full refund scheduled.";

    order.lifecycle.push({
      id: `lc_${Date.now()}`,
      at: now,
      actor: "Admin Console",
      action: "Cancellation Request Approved",
      note: note || "Refund processed to original payment method.",
    });

    if (order.invoiceId) {
      const inv = store.invoices.find((i) => i.id === order.invoiceId);
      if (inv) inv.status = "REFUNDED";
    }

    if (!order.conversations) order.conversations = [];
    order.conversations.push({
      id: `msg_${Date.now()}`,
      orderId: order.id,
      senderId: "system",
      senderName: "Billing & Fulfillment Team",
      senderRole: "SYSTEM",
      message: `Your cancellation request has been approved. Status: Cancelled & Refunded (${note || "Processed successfully"}).`,
      createdAt: now,
    });
  } else if (action === "reject") {
    order.cancellationStatus = "REJECTED";
    order.cancellationRequested = false;
    order.cancellationDecisionNote = note || "Cancellation declined; service fulfillment proceeding.";

    order.lifecycle.push({
      id: `lc_${Date.now()}`,
      at: now,
      actor: "Admin Console",
      action: "Cancellation Request Declined",
      note: note || "Customer notified. Order resumed.",
    });

    if (!order.conversations) order.conversations = [];
    order.conversations.push({
      id: `msg_${Date.now()}`,
      orderId: order.id,
      senderId: "admin",
      senderName: "Operations Desk",
      senderRole: "ADMIN",
      message: `Cancellation request was declined: ${note || "Your service is currently active and within delivery terms. Please contact support if you need revisions."}`,
      createdAt: now,
    });
  }

  order.updatedAt = now;
  return NextResponse.json({ ok: true, order });
}
