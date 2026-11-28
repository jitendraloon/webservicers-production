import { Prisma } from "@prisma/client";
import { db } from "@/server/db";

export interface QueuedJob {
  id: bigint;
  queueName: string;
  payload: unknown;
  status: string;
  attempts: number;
  maxAttempts: number;
  runAfter: Date;
}

export type JobHandler<T = Record<string, unknown>> = (
  payload: T,
  job: QueuedJob
) => Promise<void>;

const handlers = new Map<string, JobHandler<never>>();

/**
 * Register a handler function for a given `queueName`.
 */
export function registerJobHandler<T = Record<string, unknown>>(
  queueName: string,
  handler: JobHandler<T>
): void {
  handlers.set(queueName, handler as JobHandler<never>);
}

/**
 * Enqueue a background job into the MySQL `job_queue` table.
 */
export async function enqueueJob<T extends Record<string, unknown>>(
  queueName: string,
  payload: T,
  options?: { maxAttempts?: number; runAfter?: Date }
): Promise<bigint> {
  const job = await db.jobQueue.create({
    data: {
      queueName,
      payload: payload as Prisma.InputJsonValue,
      maxAttempts: options?.maxAttempts ?? 3,
      runAfter: options?.runAfter ?? new Date(),
      status: "PENDING",
    },
    select: { id: true },
  });
  return job.id;
}

/**
 * Atomically claim up to `limit` due jobs using MySQL `FOR UPDATE SKIP LOCKED`.
 */
async function claimJobs(
  limit: number,
  queueName?: string
): Promise<QueuedJob[]> {
  return db.$transaction(async (tx) => {
    const queueFilter = queueName
      ? Prisma.sql`AND queueName = ${queueName}`
      : Prisma.empty;

    const rows = await tx.$queryRaw<QueuedJob[]>(Prisma.sql`
      SELECT id, queueName, payload, status, attempts, maxAttempts, runAfter
      FROM job_queue
      WHERE status = 'PENDING'
        AND runAfter <= NOW(3)
        ${queueFilter}
      ORDER BY runAfter ASC, id ASC
      LIMIT ${limit}
      FOR UPDATE SKIP LOCKED
    `);

    if (rows.length === 0) {
      return [];
    }

    const ids = rows.map((r) => r.id);
    await tx.jobQueue.updateMany({
      where: { id: { in: ids } },
      data: {
        status: "RUNNING",
        lockedAt: new Date(),
        attempts: { increment: 1 },
      },
    });

    return rows.map((r) => ({
      ...r,
      attempts: r.attempts + 1,
    }));
  });
}

/**
 * Claim and process a batch of due jobs from `job_queue`.
 */
export async function processJobBatch(options?: {
  limit?: number;
  queueName?: string;
}): Promise<{
  claimed: number;
  completed: number;
  retried: number;
  dead: number;
}> {
  const limit = Math.min(Math.max(options?.limit ?? 20, 1), 100);
  const jobs = await claimJobs(limit, options?.queueName);

  let completed = 0;
  let retried = 0;
  let dead = 0;

  for (const job of jobs) {
    const handler = handlers.get(job.queueName);
    if (!handler) {
      await db.jobQueue.update({
        where: { id: job.id },
        data: {
          status: "DEAD",
          lastError: `No handler registered for queue "${job.queueName}".`,
          lockedAt: null,
        },
      });
      dead += 1;
      continue;
    }

    try {
      const parsedPayload =
        typeof job.payload === "string" ? JSON.parse(job.payload) : job.payload;
      await handler(parsedPayload as never, job);

      await db.jobQueue.update({
        where: { id: job.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          lockedAt: null,
          lastError: null,
        },
      });
      completed += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const exhausted = job.attempts >= job.maxAttempts;

      if (exhausted) {
        await db.jobQueue.update({
          where: { id: job.id },
          data: {
            status: "DEAD",
            lastError: message,
            lockedAt: null,
          },
        });
        dead += 1;
      } else {
        const backoffSeconds = Math.min(30 * Math.pow(2, job.attempts - 1), 3600);
        await db.jobQueue.update({
          where: { id: job.id },
          data: {
            status: "PENDING",
            lastError: message,
            lockedAt: null,
            runAfter: new Date(Date.now() + backoffSeconds * 1000),
          },
        });
        retried += 1;
      }
    }
  }

  return {
    claimed: jobs.length,
    completed,
    retried,
    dead,
  };
}
