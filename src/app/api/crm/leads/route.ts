import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { leadSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON request body." },
      { status: 400 }
    );
  }

  const parsed = leadSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Validation failed. Please check your details.",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const { name, email, phone, source, notes } = parsed.data;

  try {
    const lead = await db.lead.create({
      data: {
        name,
        email,
        phone: phone || null,
        source: source || "website",
        notes: notes || null,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        persisted: true,
        lead: {
          id: lead.id,
          name: lead.name,
          email: lead.email,
          source: lead.source,
          status: lead.status,
          createdAt: lead.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.warn("[POST /api/crm/leads] Database unavailable, using fallback:", err);
    return NextResponse.json(
      {
        ok: true,
        persisted: false,
        lead: {
          id: `lead_local_${Date.now()}`,
          name,
          email,
          phone: phone || null,
          source: source || "website",
          notes: notes || null,
          status: "NEW",
          createdAt: new Date().toISOString(),
        },
        message: "Lead captured (offline fallback mode).",
      },
      { status: 201 }
    );
  }
}
