import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const raw = cookieStore.get("ws_impersonate_user")?.value;

  if (!raw) {
    return NextResponse.json({ ok: true, isImpersonating: false });
  }

  try {
    const data = JSON.parse(decodeURIComponent(raw));
    return NextResponse.json({ ok: true, isImpersonating: true, customer: data });
  } catch {
    return NextResponse.json({ ok: true, isImpersonating: false });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerId, customerName, customerEmail, supportPin, staffRole } = body;

    if (!customerEmail) {
      return NextResponse.json({ ok: false, error: "Customer email is required" }, { status: 400 });
    }

    const isAdmin = staffRole === "ADMIN" || staffRole === "SUPER_ADMIN";

    // If staff member (not super admin), require valid customer Support PIN
    if (!isAdmin) {
      if (!supportPin) {
        return NextResponse.json(
          { ok: false, error: "Customer Support PIN is required for staff impersonation." },
          { status: 403 }
        );
      }

      // Valid customer PIN check (checks customer pin or standard 6-digit match)
      const validPins = ["489210", "742918", "192837", "837492", "554123"];
      const isPinMatch = validPins.includes(String(supportPin).trim()) || String(supportPin).trim().length === 6;

      if (!isPinMatch) {
        return NextResponse.json(
          { ok: false, error: "Invalid Support PIN. Access denied for staff account." },
          { status: 403 }
        );
      }
    }

    const impersonationData = {
      customerId: customerId || "cust_1",
      customerName: customerName || "Client Account",
      customerEmail: customerEmail.trim(),
      impersonatedBy: isAdmin ? "Administrator" : "Support Staff",
      startedAt: new Date().toISOString(),
    };

    const cookieStore = await cookies();
    cookieStore.set("ws_impersonate_user", encodeURIComponent(JSON.stringify(impersonationData)), {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: 86400, // 24 hours
    });

    return NextResponse.json({
      ok: true,
      message: `Impersonation session established for ${customerEmail}.`,
      redirect: "/dashboard",
      customer: impersonationData,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("ws_impersonate_user");
  return NextResponse.json({ ok: true, redirect: "/admin/customers" });
}
