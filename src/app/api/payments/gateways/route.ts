import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { decrypt, encrypt } from "@/server/crypto";
import {
  getClientIp,
  getOptionalSession,
  handleApiError,
  isDbUnavailableError,
  maskConfigObject,
  parseJsonBody,
  requireAuth,
  toJsonSafe,
  writeAuditLog,
} from "@/server/api-helpers";

const patchGatewaySchema = z.object({
  slug: z.string().trim().min(1).max(64).toLowerCase(),
  name: z.string().trim().min(1).max(120).optional(),
  enabled: z.boolean().optional(),
  commissionRateBps: z.number().int().min(0).max(10000).optional(),
  providerFeeBps: z.number().int().min(0).max(10000).optional(),
  minAmountCents: z.number().int().min(0).optional(),
  maxAmountCents: z.number().int().min(0).optional(),
  acceptedCountries: z.array(z.string().trim().length(2)).optional(),
  config: z.record(z.unknown()).optional(),
});

const FALLBACK_GATEWAYS = [
  {
    id: "gw_wallet",
    slug: "wallet",
    name: "Account Wallet",
    isBuiltin: true,
    enabled: true,
    commissionRateBps: 0,
    providerFeeBps: 0,
    minAmountCents: 0,
    maxAmountCents: 0,
    sortOrder: 0,
  },
  {
    id: "gw_stripe",
    slug: "stripe",
    name: "Stripe",
    isBuiltin: true,
    enabled: true,
    commissionRateBps: 0,
    providerFeeBps: 290,
    minAmountCents: 100,
    maxAmountCents: 0,
    sortOrder: 1,
  },
  {
    id: "gw_paypal",
    slug: "paypal",
    name: "PayPal",
    isBuiltin: true,
    enabled: true,
    commissionRateBps: 0,
    providerFeeBps: 349,
    minAmountCents: 100,
    maxAmountCents: 0,
    sortOrder: 2,
  },
  {
    id: "gw_razorpay",
    slug: "razorpay",
    name: "Razorpay",
    isBuiltin: true,
    enabled: false,
    commissionRateBps: 0,
    providerFeeBps: 200,
    minAmountCents: 100,
    maxAmountCents: 0,
    sortOrder: 3,
  },
];

export async function GET() {
  const { session } = await getOptionalSession();
  const isAdmin = session?.user.role === "ADMIN";

  try {
    const gateways = await db.paymentGateway.findMany({
      where: isAdmin ? {} : { enabled: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    const sanitized = gateways.map((gw) => {
      let maskedConfig: Record<string, unknown> | null = null;
      if (isAdmin && gw.configEnc) {
        try {
          const raw = JSON.parse(decrypt(gw.configEnc)) as Record<string, unknown>;
          maskedConfig = maskConfigObject(raw);
        } catch {
          maskedConfig = { _error: "Unable to decrypt stored config" };
        }
      }

      return {
        id: gw.id,
        slug: gw.slug,
        name: gw.name,
        isBuiltin: gw.isBuiltin,
        enabled: gw.enabled,
        commissionRateBps: gw.commissionRateBps,
        providerFeeBps: gw.providerFeeBps,
        minAmountCents: Number(gw.minAmountCents),
        maxAmountCents: Number(gw.maxAmountCents),
        acceptedCountries: gw.acceptedCountries,
        sortOrder: gw.sortOrder,
        ...(isAdmin
          ? { hasConfig: Boolean(gw.configEnc), config: maskedConfig }
          : {}),
      };
    });

    return NextResponse.json({
      ok: true,
      gateways: sanitized,
    });
  } catch (err) {
    if (isDbUnavailableError(err)) {
      return NextResponse.json({
        ok: true,
        gateways: isAdmin
          ? FALLBACK_GATEWAYS
          : FALLBACK_GATEWAYS.filter((g) => g.enabled),
        fallback: true,
      });
    }
    return handleApiError(err, "GET /api/payments/gateways");
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody(request, patchGatewaySchema);
  if (!parsed.ok) return parsed.response;

  const data = parsed.data;

  try {
    const configEnc = data.config
      ? encrypt(JSON.stringify(data.config))
      : undefined;

    const gateway = await db.paymentGateway.upsert({
      where: { slug: data.slug },
      create: {
        slug: data.slug,
        name: data.name ?? data.slug.toUpperCase(),
        enabled: data.enabled ?? false,
        commissionRateBps: data.commissionRateBps ?? 0,
        providerFeeBps: data.providerFeeBps ?? 0,
        minAmountCents: BigInt(data.minAmountCents ?? 0),
        maxAmountCents: BigInt(data.maxAmountCents ?? 0),
        acceptedCountries: data.acceptedCountries ?? undefined,
        configEnc: configEnc ?? null,
      },
      update: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.enabled !== undefined ? { enabled: data.enabled } : {}),
        ...(data.commissionRateBps !== undefined
          ? { commissionRateBps: data.commissionRateBps }
          : {}),
        ...(data.providerFeeBps !== undefined
          ? { providerFeeBps: data.providerFeeBps }
          : {}),
        ...(data.minAmountCents !== undefined
          ? { minAmountCents: BigInt(data.minAmountCents) }
          : {}),
        ...(data.maxAmountCents !== undefined
          ? { maxAmountCents: BigInt(data.maxAmountCents) }
          : {}),
        ...(data.acceptedCountries !== undefined
          ? { acceptedCountries: data.acceptedCountries }
          : {}),
        ...(configEnc !== undefined ? { configEnc } : {}),
      },
    });

    await writeAuditLog({
      actorType: "ADMIN",
      actorId: auth.session.user.id,
      action: "PAYMENT_GATEWAY_UPDATED",
      targetType: "PaymentGateway",
      targetId: gateway.id,
      metadata: {
        slug: gateway.slug,
        enabled: gateway.enabled,
        configUpdated: Boolean(configEnc),
      },
      ip: getClientIp(request),
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json({
      ok: true,
      gateway: toJsonSafe({
        ...gateway,
        configEnc: undefined,
        hasConfig: Boolean(gateway.configEnc),
      }),
    });
  } catch (err) {
    return handleApiError(err, "PATCH /api/payments/gateways");
  }
}
