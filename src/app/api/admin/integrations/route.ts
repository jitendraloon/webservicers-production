import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { decrypt, encrypt } from "@/server/crypto";
import {
  getClientIp,
  handleApiError,
  isDbUnavailableError,
  maskConfigObject,
  parseJsonBody,
  requireAuth,
  writeAuditLog,
} from "@/server/api-helpers";

const upsertIntegrationSchema = z.object({
  category: z.string().trim().min(1).max(64).toLowerCase(),
  provider: z.string().trim().min(1).max(64).toLowerCase(),
  enabled: z.boolean().default(true),
  config: z.record(z.unknown()).optional(),
});

export async function GET() {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.ok) return auth.response;

  try {
    const integrations = await db.integration.findMany({
      orderBy: [{ category: "asc" }, { provider: "asc" }],
    });

    const masked = integrations.map((item) => {
      let config: Record<string, unknown> | null = null;
      if (item.configEnc) {
        try {
          const raw = JSON.parse(decrypt(item.configEnc)) as Record<string, unknown>;
          config = maskConfigObject(raw);
        } catch {
          config = { _error: "Unable to decrypt stored configuration" };
        }
      }
      return {
        id: item.id,
        category: item.category,
        provider: item.provider,
        enabled: item.enabled,
        hasConfig: Boolean(item.configEnc),
        config,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };
    });

    return NextResponse.json({ ok: true, integrations: masked });
  } catch (err) {
    if (isDbUnavailableError(err)) {
      return NextResponse.json({
        ok: true,
        integrations: [],
        fallback: true,
      });
    }
    return handleApiError(err, "GET /api/admin/integrations");
  }
}

async function handleUpsert(request: NextRequest) {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody(request, upsertIntegrationSchema);
  if (!parsed.ok) return parsed.response;

  const { category, provider, enabled, config } = parsed.data;

  try {
    const configEnc = config ? encrypt(JSON.stringify(config)) : undefined;

    const integration = await db.integration.upsert({
      where: {
        category_provider: { category, provider },
      },
      create: {
        category,
        provider,
        enabled,
        configEnc: configEnc ?? null,
      },
      update: {
        enabled,
        ...(configEnc !== undefined ? { configEnc } : {}),
      },
    });

    await writeAuditLog({
      actorType: "ADMIN",
      actorId: auth.session.user.id,
      action: "INTEGRATION_SAVED",
      targetType: "Integration",
      targetId: integration.id,
      metadata: {
        category,
        provider,
        enabled,
        configUpdated: Boolean(configEnc),
      },
      ip: getClientIp(request),
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json({
      ok: true,
      integration: {
        id: integration.id,
        category: integration.category,
        provider: integration.provider,
        enabled: integration.enabled,
        hasConfig: Boolean(integration.configEnc),
        config: config ? maskConfigObject(config) : null,
        updatedAt: integration.updatedAt,
      },
    });
  } catch (err) {
    return handleApiError(err, "SAVE /api/admin/integrations");
  }
}

export async function POST(request: NextRequest) {
  return handleUpsert(request);
}

export async function PATCH(request: NextRequest) {
  return handleUpsert(request);
}
