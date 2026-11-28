import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { SERVICES } from "@/data/services";
import {
  getClientIp,
  getOptionalSession,
  handleApiError,
  isDbUnavailableError,
  parseJsonBody,
  requireAuth,
  toJsonSafe,
  writeAuditLog,
} from "@/server/api-helpers";
import type { Prisma } from "@prisma/client";

const packageInputSchema = z.object({
  tier: z.enum(["STANDARD", "GROWTH", "ENTERPRISE"]).default("STANDARD"),
  name: z.string().trim().min(1).max(120),
  priceCents: z.number().int().min(0),
  currency: z.string().trim().length(3).default("USD"),
  billingCycle: z.enum(["MONTHLY", "QUARTERLY", "ANNUALLY", "ONCE"]).default("MONTHLY"),
  features: z.array(z.string()).optional(),
  deliverables: z.array(z.string()).optional(),
  setupFeeCents: z.number().int().min(0).default(0),
  isPopular: z.boolean().default(false),
});

const createServiceSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(160)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  categoryId: z.string().trim().min(1).optional(),
  type: z.enum(["SERVICE", "DIGITAL", "SMM"]).default("SERVICE"),
  description: z.string().trim().max(10000).optional(),
  shortDescription: z.string().trim().max(500).optional(),
  imageUrl: z.string().trim().url().optional(),
  status: z.enum(["ACTIVE", "DRAFT", "ARCHIVED"]).default("ACTIVE"),
  featured: z.boolean().default(false),
  packages: z.array(packageInputSchema).optional(),
});

export async function GET(request: NextRequest) {
  const { session } = await getOptionalSession();
  const isStaffOrAdmin =
    session?.user.role === "ADMIN" || session?.user.role === "STAFF";

  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get("category");
  const type = searchParams.get("type");
  const includeDrafts =
    isStaffOrAdmin && searchParams.get("includeDrafts") === "true";

  const where: Prisma.ProductWhereInput = {
    ...(includeDrafts ? {} : { status: "ACTIVE" }),
    ...(category ? { category: { slug: category } } : {}),
    ...(type ? { type: type as Prisma.EnumProductTypeFilter } : {}),
  };

  try {
    const products = await db.product.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        packages: { orderBy: { sortOrder: "asc" } },
        addons: true,
        requirements: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({
      ok: true,
      services: toJsonSafe(products),
    });
  } catch (err) {
    if (isDbUnavailableError(err)) {
      const fallback = SERVICES.map((svc, idx) => ({
        id: `svc_${svc.slug}`,
        name: svc.name,
        slug: svc.slug,
        type: "SERVICE",
        shortDescription: svc.tagline,
        description: svc.description,
        status: "ACTIVE",
        featured: idx < 4,
        category: {
          id: `cat_${svc.category.toLowerCase()}`,
          name: svc.category,
          slug: svc.category.toLowerCase(),
        },
        packages: svc.tiers.map((tier, tIdx) => ({
          id: `pkg_${svc.slug}_${tier.name.toLowerCase()}`,
          tier: tier.name.toUpperCase(),
          name: tier.name,
          priceCents: tier.priceUsd * 100,
          currency: "USD",
          billingCycle: "MONTHLY",
          features: tier.features,
          isPopular: Boolean(tier.popular),
          sortOrder: tIdx,
        })),
      }));

      return NextResponse.json({
        ok: true,
        services: fallback,
        fallback: true,
      });
    }
    return handleApiError(err, "GET /api/services");
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody(request, createServiceSchema);
  if (!parsed.ok) return parsed.response;

  const data = parsed.data;

  try {
    const existing = await db.product.findUnique({ where: { slug: data.slug } });
    if (existing) {
      return NextResponse.json(
        { ok: false, error: `A product with slug "${data.slug}" already exists.` },
        { status: 409 }
      );
    }

    const product = await db.product.create({
      data: {
        name: data.name,
        slug: data.slug,
        categoryId: data.categoryId ?? null,
        type: data.type,
        description: data.description ?? null,
        shortDescription: data.shortDescription ?? null,
        imageUrl: data.imageUrl ?? null,
        status: data.status,
        featured: data.featured,
        packages: data.packages?.length
          ? {
              create: data.packages.map((pkg, idx) => ({
                tier: pkg.tier ?? "STANDARD",
                name: pkg.name,
                priceCents: BigInt(pkg.priceCents),
                currency: (pkg.currency ?? "USD").toUpperCase(),
                billingCycle: pkg.billingCycle ?? "MONTHLY",
                features: pkg.features ?? undefined,
                deliverables: pkg.deliverables ?? undefined,
                setupFeeCents: BigInt(pkg.setupFeeCents ?? 0),
                isPopular: pkg.isPopular ?? false,
                sortOrder: idx,
              })),
            }
          : undefined,
      },
      include: {
        category: true,
        packages: true,
      },
    });

    await writeAuditLog({
      actorType: "ADMIN",
      actorId: auth.session.user.id,
      action: "PRODUCT_CREATED",
      targetType: "Product",
      targetId: product.id,
      metadata: { slug: product.slug, name: product.name },
      ip: getClientIp(request),
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json(
      { ok: true, service: toJsonSafe(product) },
      { status: 201 }
    );
  } catch (err) {
    return handleApiError(err, "POST /api/services");
  }
}
