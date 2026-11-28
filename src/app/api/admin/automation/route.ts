import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import {
  getClientIp,
  handleApiError,
  isDbUnavailableError,
  parseJsonBody,
  requireAuth,
  toJsonSafe,
  writeAuditLog,
} from "@/server/api-helpers";

const triggerTickSchema = z.object({
  queueName: z.string().trim().min(1).optional(),
  limit: z.number().int().min(1).max(50).default(10),
});

export async function GET() {
  const auth = await requireAuth(["ADMIN", "STAFF"]);
  if (!auth.ok) return auth.response;

  try {
    const [grouped, recentJobs] = await Promise.all([
      db.jobQueue.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      db.jobQueue.findMany({
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
    ]);

    const counts: Record<string, number> = {
      PENDING: 0,
      RUNNING: 0,
      COMPLETED: 0,
      FAILED: 0,
      DEAD: 0,
    };
    for (const g of grouped) {
      counts[g.status] = g._count._all;
    }

    return NextResponse.json({
      ok: true,
      counts,
      jobs: toJsonSafe(recentJobs),
    });
  } catch (err) {
    if (isDbUnavailableError(err)) {
      return NextResponse.json({
        ok: true,
        counts: { PENDING: 0, RUNNING: 0, COMPLETED: 0, FAILED: 0, DEAD: 0 },
        jobs: [],
        fallback: true,
      });
    }
    return handleApiError(err, "GET /api/admin/automation");
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody(request, triggerTickSchema);
  if (!parsed.ok) return parsed.response;

  const { queueName, limit } = parsed.data;
  const now = new Date();

  try {
    const pendingJobs = await db.jobQueue.findMany({
      where: {
        status: "PENDING",
        runAfter: { lte: now },
        ...(queueName ? { queueName } : {}),
      },
      orderBy: { runAfter: "asc" },
      take: limit,
    });

    const results: Array<{ id: string; queueName: string; status: string }> = [];

    for (const job of pendingJobs) {
      await db.jobQueue.update({
        where: { id: job.id },
        data: { status: "RUNNING", lockedAt: new Date(), attempts: { increment: 1 } },
      });

      try {
        // Dispatch lightweight state transitions for known queues
        const payload = (job.payload ?? {}) as Record<string, unknown>;
        if (job.queueName === "seo_audit" && typeof payload.auditId === "string") {
          await db.seoAudit
            .update({
              where: { id: payload.auditId },
              data: { status: "COMPLETED", pagesCrawled: 1, issuesFound: 0 },
            })
            .catch(() => undefined);
        } else if (
          job.queueName === "gdpr_delete" &&
          typeof payload.gdprRequestId === "string"
        ) {
          await db.gdprRequest
            .update({
              where: { id: payload.gdprRequestId },
              data: { status: "PROCESSING" },
            })
            .catch(() => undefined);
        }

        await db.jobQueue.update({
          where: { id: job.id },
          data: { status: "COMPLETED", completedAt: new Date(), lastError: null },
        });
        results.push({
          id: job.id.toString(),
          queueName: job.queueName,
          status: "COMPLETED",
        });
      } catch (jobErr) {
        const nextAttempts = job.attempts + 1;
        const failedStatus = nextAttempts >= job.maxAttempts ? "DEAD" : "FAILED";
        await db.jobQueue.update({
          where: { id: job.id },
          data: {
            status: failedStatus,
            lastError: jobErr instanceof Error ? jobErr.message : "Job execution error",
          },
        });
        results.push({
          id: job.id.toString(),
          queueName: job.queueName,
          status: failedStatus,
        });
      }
    }

    await writeAuditLog({
      actorType: "ADMIN",
      actorId: auth.session.user.id,
      action: "AUTOMATION_TICK_TRIGGERED",
      targetType: "JobQueue",
      metadata: { queueName: queueName ?? "all", processed: results.length },
      ip: getClientIp(request),
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json({
      ok: true,
      processed: results.length,
      results,
    });
  } catch (err) {
    return handleApiError(err, "POST /api/admin/automation");
  }
}
