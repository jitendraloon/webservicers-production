import { NextRequest, NextResponse } from "next/server";
import { getAdminStore } from "@/server/admin-store";

export async function GET() {
  const store = getAdminStore();
  return NextResponse.json({
    ok: true,
    checkouts: store.abandonedCheckouts,
    settings: store.abandonedSettings,
  });
}

export async function POST(request: NextRequest) {
  const store = getAdminStore();
  const body = await request.json();

  if (body.action === "update_settings" || body.settings) {
    const newSettings = body.settings || body;
    store.abandonedSettings = {
      ...store.abandonedSettings,
      autoReminderEnabled: newSettings.autoReminderEnabled !== undefined ? Boolean(newSettings.autoReminderEnabled) : store.abandonedSettings.autoReminderEnabled,
      reminderDelayHours: Number(newSettings.reminderDelayHours || store.abandonedSettings.reminderDelayHours),
      discountCode: String(newSettings.discountCode || store.abandonedSettings.discountCode),
      discountPct: Number(newSettings.discountPct ?? store.abandonedSettings.discountPct),
      maxNudges: Number(newSettings.maxNudges || store.abandonedSettings.maxNudges),
      templateSubject: String(newSettings.templateSubject || store.abandonedSettings.templateSubject),
    };
    return NextResponse.json({ ok: true, settings: store.abandonedSettings });
  }

  const checkout = store.abandonedCheckouts.find((c) => c.id === body.id);
  if (!checkout) {
    return NextResponse.json({ ok: false, error: "Checkout not found" }, { status: 404 });
  }

  if (body.action === "send_recovery") {
    checkout.recoverySentCount += 1;
    checkout.lastRecoveryAt = new Date().toISOString();
  } else if (body.action === "mark_recovered") {
    checkout.status = "RECOVERED";
  } else if (body.action === "expire") {
    checkout.status = "EXPIRED";
  }

  return NextResponse.json({ ok: true, checkout });
}
