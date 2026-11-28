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

const createPromptTrackerSchema = z.object({
  projectId: z.string().trim().min(1),
  frequency: z.enum(["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY"]).default("WEEKLY"),
  engines: z
    .array(z.string().trim().min(1))
    .min(1)
    .default(["chatgpt", "perplexity", "gemini"]),
  topicName: z.string().trim().min(1).max(160),
  prompts: z
    .array(
      z.object({
        queryText: z.string().trim().min(3).max(1000),
        isBranded: z.boolean().default(false),
      })
    )
    .min(1),
});

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const projectId = request.nextUrl.searchParams.get("projectId");
  const isStaffOrAdmin =
    auth.session.user.role === "ADMIN" || auth.session.user.role === "STAFF";

  try {
    const trackers = await db.seoPromptTracker.findMany({
      where: {
        ...(projectId ? { projectId } : {}),
        ...(isStaffOrAdmin ? {} : { project: { userId: auth.session.user.id } }),
      },
      include: {
        project: { select: { id: true, name: true, domain: true, brandName: true } },
        topics: {
          include: {
            prompts: {
              include: {
                observations: {
                  orderBy: { createdAt: "desc" },
                  take: 10,
                },
              },
            },
          },
        },
        runs: {
          orderBy: { executedAt: "desc" },
          take: 5,
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ ok: true, trackers });
  } catch (err) {
    if (isDbUnavailableError(err)) {
      return NextResponse.json({
        ok: true,
        trackers: [],
        fallback: true,
      });
    }
    return handleApiError(err, "GET /api/seo/prompts");
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody(request, createPromptTrackerSchema);
  if (!parsed.ok) return parsed.response;

  const { projectId, frequency, engines, topicName, prompts } = parsed.data;
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

    const tracker = await db.seoPromptTracker.create({
      data: {
        projectId,
        frequency,
        engines,
        nextRunAt: new Date(Date.now() + 60 * 60 * 1000),
        topics: {
          create: {
            name: topicName,
            prompts: {
              create: prompts.map((p) => ({
                queryText: p.queryText,
                isBranded: p.isBranded,
              })),
            },
          },
        },
      },
      include: {
        topics: { include: { prompts: true } },
      },
    });

    await writeAuditLog({
      actorType: "USER",
      actorId: auth.session.user.id,
      action: "SEO_GEO_TRACKER_CREATED",
      targetType: "SeoPromptTracker",
      targetId: tracker.id,
      metadata: { projectId, topicName, promptCount: prompts.length },
      ip: getClientIp(request),
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json({ ok: true, tracker }, { status: 201 });
  } catch (err) {
    return handleApiError(err, "POST /api/seo/prompts");
  }
}
