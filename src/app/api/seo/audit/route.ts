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

const launchAuditSchema = z.object({
  projectId: z.string().trim().min(1),
  targetUrl: z.string().trim().url("A valid target URL is required"),
  maxPages: z.number().int().min(1).max(5000).default(100),
  renderJs: z.boolean().default(false),
  includeLighthouse: z.boolean().default(false),
});

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const projectId = request.nextUrl.searchParams.get("projectId");
  const isStaffOrAdmin =
    auth.session.user.role === "ADMIN" || auth.session.user.role === "STAFF";

  try {
    const audits = await db.seoAudit.findMany({
      where: {
        ...(projectId ? { projectId } : {}),
        ...(isStaffOrAdmin ? {} : { project: { userId: auth.session.user.id } }),
      },
      include: {
        project: { select: { id: true, name: true, domain: true } },
        issues: { orderBy: { pagesAffectedCount: "desc" }, take: 50 },
        _count: { select: { pages: true, issues: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ ok: true, audits });
  } catch (err) {
    if (isDbUnavailableError(err)) {
      return NextResponse.json({
        ok: true,
        audits: [],
        fallback: true,
      });
    }
    return handleApiError(err, "GET /api/seo/audit");
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody(request, launchAuditSchema);
  if (!parsed.ok) return parsed.response;

  const { projectId, targetUrl, maxPages, renderJs, includeLighthouse } =
    parsed.data;
  const isStaffOrAdmin =
    auth.session.user.role === "ADMIN" || auth.session.user.role === "STAFF";

  try {
    const project = await db.seoProject.findUnique({ where: { id: projectId } });
    if (!project) {
      return NextResponse.json(
        { ok: false, error: "SEO project not found." },
        { status: 404 }
      );
    }

    if (!isStaffOrAdmin && project.userId !== auth.session.user.id) {
      return NextResponse.json(
        { ok: false, error: "Insufficient permissions for this SEO project." },
        { status: 403 }
      );
    }

    const audit = await db.$transaction(async (tx) => {
      const createdAudit = await tx.seoAudit.create({
        data: {
          projectId,
          targetUrl,
          status: "PENDING",
          maxPages,
          renderJs,
          includeLighthouse,
        },
      });

      await tx.jobQueue.create({
        data: {
          queueName: "seo_audit",
          payload: {
            auditId: createdAudit.id,
            projectId,
            targetUrl,
            maxPages,
          },
          status: "PENDING",
        },
      });

      return createdAudit;
    });

    await writeAuditLog({
      actorType: "USER",
      actorId: auth.session.user.id,
      action: "SEO_AUDIT_LAUNCHED",
      targetType: "SeoAudit",
      targetId: audit.id,
      metadata: { projectId, targetUrl, maxPages },
      ip: getClientIp(request),
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json({ ok: true, audit }, { status: 201 });
  } catch (err) {
    return handleApiError(err, "POST /api/seo/audit");
  }
}
