import { NextRequest, NextResponse } from "next/server";
import { getAdminStore } from "@/server/admin-store";
import type { AdminOrderConversationMessage } from "@/lib/admin-types";

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

  return NextResponse.json({
    ok: true,
    conversations: order.conversations || [],
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
  const text = (body.message || "").trim();
  if (!text) {
    return NextResponse.json({ ok: false, error: "Message cannot be empty" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const newMessage: AdminOrderConversationMessage = {
    id: `msg_${Date.now()}`,
    orderId: order.id,
    senderId: body.senderId || "user",
    senderName: body.senderName || (body.senderRole === "ADMIN" ? "Admin Support" : order.customerName),
    senderRole: (body.senderRole as "ADMIN" | "CLIENT" | "SYSTEM") || "CLIENT",
    message: text,
    isInternalNote: Boolean(body.isInternalNote),
    attachments: Array.isArray(body.attachments) ? body.attachments : undefined,
    createdAt: now,
  };

  if (!order.conversations) order.conversations = [];
  order.conversations.push(newMessage);
  order.updatedAt = now;

  return NextResponse.json({ ok: true, message: newMessage });
}
