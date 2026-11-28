import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { decrypt, encrypt } from "@/server/crypto";
import {
  getClientIp,
  handleApiError,
  isDbUnavailableError,
  maskSecret,
  parseJsonBody,
  requireAuth,
  writeAuditLog,
} from "@/server/api-helpers";

const createProviderSchema = z.object({
  name: z.string().trim().min(2).max(120),
  apiUrl: z.string().trim().url(),
  apiKey: z.string().trim().min(1),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

const updateProviderSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(2).max(120).optional(),
  apiUrl: z.string().trim().url().optional(),
  apiKey: z.string().trim().min(1).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  balanceUsd: z.number().min(0).optional(),
});

export async function GET() {
  const auth = await requireAuth(["ADMIN", "STAFF"]);
  if (!auth.ok) return auth.response;

  try {
    const providers = await db.smmProvider.findMany({
      include: {
        _count: { select: { services: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const sanitized = providers.map((p) => {
      let maskedKey = "••••••••";
      try {
        maskedKey = maskSecret(decrypt(p.apiKeyEnc));
      } catch {
        maskedKey = "••••••••";
      }
      return {
        id: p.id,
        name: p.name,
        apiUrl: p.apiUrl,
        apiKeyMasked: maskedKey,
        balanceUsd: p.balanceUsd,
        status: p.status,
        serviceCount: p._count.services,
        lastSyncedAt: p.lastSyncedAt,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      };
    });

    return NextResponse.json({ ok: true, providers: sanitized });
  } catch (err) {
    if (isDbUnavailableError(err)) {
      return NextResponse.json({
        ok: true,
        providers: [],
        fallback: true,
      });
    }
    return handleApiError(err, "GET /api/smm/providers");
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody(request, createProviderSchema);
  if (!parsed.ok) return parsed.response;

  const { name, apiUrl, apiKey, status } = parsed.data;

  try {
    const provider = await db.smmProvider.create({
      data: {
        name,
        apiUrl,
        apiKeyEnc: encrypt(apiKey),
        status,
      },
    });

    await writeAuditLog({
      actorType: "ADMIN",
      actorId: auth.session.user.id,
      action: "SMM_PROVIDER_CREATED",
      targetType: "SmmProvider",
      targetId: provider.id,
      metadata: { name, apiUrl },
      ip: getClientIp(request),
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json(
      {
        ok: true,
        provider: {
          id: provider.id,
          name: provider.name,
          apiUrl: provider.apiUrl,
          apiKeyMasked: maskSecret(apiKey),
          balanceUsd: provider.balanceUsd,
          status: provider.status,
          createdAt: provider.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    return handleApiError(err, "POST /api/smm/providers");
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody(request, updateProviderSchema);
  if (!parsed.ok) return parsed.response;

  const { id, name, apiUrl, apiKey, status, balanceUsd } = parsed.data;

  try {
    const existing = await db.smmProvider.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "SMM provider not found." },
        { status: 404 }
      );
    }

    const updated = await db.smmProvider.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(apiUrl !== undefined ? { apiUrl } : {}),
        ...(apiKey !== undefined ? { apiKeyEnc: encrypt(apiKey) } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(balanceUsd !== undefined ? { balanceUsd } : {}),
      },
    });

    await writeAuditLog({
      actorType: "ADMIN",
      actorId: auth.session.user.id,
      action: "SMM_PROVIDER_UPDATED",
      targetType: "SmmProvider",
      targetId: id,
      metadata: { name, status, keyUpdated: Boolean(apiKey) },
      ip: getClientIp(request),
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json({
      ok: true,
      provider: {
        id: updated.id,
        name: updated.name,
        apiUrl: updated.apiUrl,
        balanceUsd: updated.balanceUsd,
        status: updated.status,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (err) {
    return handleApiError(err, "PATCH /api/smm/providers");
  }
}
