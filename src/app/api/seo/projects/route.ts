import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import {
  getClientIp,
  handleApiError,
  isDbUnavailableError,
  parseJsonBody,
  requireAuth,
  writeAuditLog,
} from "@/server/api-helpers";
import type { Prisma } from "@prisma/client";

const createProjectSchema = z.object({
  name: z.string().trim().min(2).max(160),
  domain: z
    .string()
    .trim()
    .min(3)
    .max(255)
    .transform((d) => d.replace(/^https?:\/\//i, "").replace(/\/.*$/, "").toLowerCase()),
  brandName: z.string().trim().max(160).optional(),
  locationCode: z.string().trim().min(2).max(10).default("us"),
  languageCode: z.string().trim().min(2).max(10).default("en"),
  context: z
    .object({
      businessOverview: z.string().trim().max(5000).optional(),
      currentGoal: z.string().trim().max(500).optional(),
      positioning: z.string().trim().max(2000).optional(),
      competitors: z.array(z.string().trim()).optional(),
      keyPages: z.array(z.string().trim()).optional(),
    })
    .optional(),
});

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const isStaffOrAdmin =
    auth.session.user.role === "ADMIN" || auth.session.user.role === "STAFF";

  try {
    const projects = await db.seoProject.findMany({
      where: isStaffOrAdmin ? {} : { userId: auth.session.user.id },
      include: {
        context: true,
        _count: {
          select: {
            savedKeywords: true,
            audits: true,
            rankDomains: true,
            promptTrackers: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ ok: true, projects });
  } catch (err) {
    if (isDbUnavailableError(err)) {
      return NextResponse.json({
        ok: true,
        projects: [],
        fallback: true,
      });
    }
    return handleApiError(err, "GET /api/seo/projects");
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody(request, createProjectSchema);
  if (!parsed.ok) return parsed.response;

  const { name, domain, brandName, locationCode, languageCode, context } =
    parsed.data;

  try {
    const project = await db.seoProject.create({
      data: {
        userId: auth.session.user.id,
        name,
        domain,
        brandName: brandName ?? null,
        locationCode,
        languageCode,
        context: context
          ? {
              create: {
                businessOverview: context.businessOverview ?? null,
                currentGoal: context.currentGoal ?? null,
                positioning: context.positioning ?? null,
                competitors: (context.competitors ?? undefined) as
                  | Prisma.InputJsonValue
                  | undefined,
                keyPages: (context.keyPages ?? undefined) as
                  | Prisma.InputJsonValue
                  | undefined,
              },
            }
          : undefined,
      },
      include: { context: true },
    });

    await writeAuditLog({
      actorType: "USER",
      actorId: auth.session.user.id,
      action: "SEO_PROJECT_CREATED",
      targetType: "SeoProject",
      targetId: project.id,
      metadata: { name, domain },
      ip: getClientIp(request),
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json({ ok: true, project }, { status: 201 });
  } catch (err) {
    return handleApiError(err, "POST /api/seo/projects");
  }
}
