import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { decrypt } from "@/server/crypto";
import {
  getClientIp,
  getOptionalSession,
  handleApiError,
  isDbUnavailableError,
  parseJsonBody,
  requireAuth,
  writeAuditLog,
} from "@/server/api-helpers";
import type { Prisma } from "@prisma/client";

const syncServiceItemSchema = z.object({
  externalId: z.string().trim().min(1),
  name: z.string().trim().min(1).max(255),
  category: z.string().trim().min(1).max(120).default("General"),
  ratePerThousand: z.number().min(0),
  minQty: z.number().int().min(1).default(10),
  maxQty: z.number().int().min(1).default(100000),
});

const syncServicesSchema = z.object({
  providerId: z.string().trim().min(1),
  marginPercent: z.number().min(0).max(500).default(25),
  services: z.array(syncServiceItemSchema).optional(),
});

export async function GET(request: NextRequest) {
  const { session } = await getOptionalSession();
  const isStaffOrAdmin =
    session?.user.role === "ADMIN" || session?.user.role === "STAFF";

  const category = request.nextUrl.searchParams.get("category");
  const providerId = request.nextUrl.searchParams.get("providerId");
  const includeInactive =
    isStaffOrAdmin && request.nextUrl.searchParams.get("includeInactive") === "true";

  const where: Prisma.SmmServiceWhereInput = {
    ...(includeInactive ? {} : { status: "ACTIVE" }),
    ...(category ? { category } : {}),
    ...(providerId ? { providerId } : {}),
  };

  try {
    const services = await db.smmService.findMany({
      where,
      include: {
        provider: { select: { id: true, name: true, status: true } },
      },
      orderBy: [{ category: "asc" }, { name: "asc" }],
      take: 500,
    });

    const mapped = services.map((s) => ({
      ...s,
      clientRatePerThousand: Number(
        (s.ratePerThousand * (1 + s.marginPercent / 100)).toFixed(4)
      ),
    }));

    return NextResponse.json({ ok: true, services: mapped });
  } catch (err) {
    if (isDbUnavailableError(err)) {
      return NextResponse.json({
        ok: true,
        services: [],
        fallback: true,
      });
    }
    return handleApiError(err, "GET /api/smm/services");
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody(request, syncServicesSchema);
  if (!parsed.ok) return parsed.response;

  const { providerId, marginPercent, services: providedServices } = parsed.data;

  try {
    const provider = await db.smmProvider.findUnique({
      where: { id: providerId },
    });
    if (!provider) {
      return NextResponse.json(
        { ok: false, error: "SMM provider not found." },
        { status: 404 }
      );
    }

    let itemsToSync = providedServices ?? [];

    if (!providedServices || providedServices.length === 0) {
      let apiKey = "";
      try {
        apiKey = decrypt(provider.apiKeyEnc);
      } catch {
        return NextResponse.json(
          { ok: false, error: "Failed to decrypt provider API key." },
          { status: 500 }
        );
      }

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const body = new URLSearchParams({ key: apiKey, action: "services" });
        const resp = await fetch(provider.apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: body.toString(),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!resp.ok) {
          return NextResponse.json(
            {
              ok: false,
              error: `Provider API responded with HTTP ${resp.status}.`,
            },
            { status: 502 }
          );
        }

        const rawList = (await resp.json()) as Array<Record<string, unknown>>;
        if (!Array.isArray(rawList)) {
          return NextResponse.json(
            { ok: false, error: "Unexpected response format from SMM provider." },
            { status: 502 }
          );
        }

        itemsToSync = rawList.slice(0, 500).map((item) => ({
          externalId: String(item.service ?? item.id ?? ""),
          name: String(item.name ?? "Unnamed Service"),
          category: String(item.category ?? "General"),
          ratePerThousand: Number(item.rate ?? 0),
          minQty: Math.max(1, Number(item.min ?? 10)),
          maxQty: Math.max(1, Number(item.max ?? 100000)),
        }));
      } catch (fetchErr) {
        return NextResponse.json(
          {
            ok: false,
            error: "Unable to reach SMM provider API for live sync. Pass `services` array for manual import.",
            details: fetchErr instanceof Error ? fetchErr.message : "Network error",
          },
          { status: 502 }
        );
      }
    }

    let syncedCount = 0;
    const effectiveMargin = marginPercent ?? 25;
    await db.$transaction(async (tx) => {
      for (const item of itemsToSync) {
        if (!item.externalId) continue;
        const cat = item.category ?? "General";
        const minQ = item.minQty ?? 10;
        const maxQ = item.maxQty ?? 100000;
        await tx.smmService.upsert({
          where: {
            providerId_externalId: {
              providerId: provider.id,
              externalId: item.externalId,
            },
          },
          create: {
            providerId: provider.id,
            externalId: item.externalId,
            name: item.name,
            category: cat,
            ratePerThousand: item.ratePerThousand,
            minQty: minQ,
            maxQty: maxQ,
            marginPercent: effectiveMargin,
            status: "ACTIVE",
          },
          update: {
            name: item.name,
            category: cat,
            ratePerThousand: item.ratePerThousand,
            minQty: minQ,
            maxQty: maxQ,
            marginPercent: effectiveMargin,
          },
        });
        syncedCount += 1;
      }

      await tx.smmProvider.update({
        where: { id: provider.id },
        data: { lastSyncedAt: new Date() },
      });
    });

    await writeAuditLog({
      actorType: "ADMIN",
      actorId: auth.session.user.id,
      action: "SMM_SERVICES_SYNCED",
      targetType: "SmmProvider",
      targetId: provider.id,
      metadata: { syncedCount, marginPercent },
      ip: getClientIp(request),
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json({
      ok: true,
      providerId: provider.id,
      syncedCount,
    });
  } catch (err) {
    return handleApiError(err, "POST /api/smm/services");
  }
}
