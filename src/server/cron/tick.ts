import { db } from "@/server/db";
import { sendMail } from "@/server/integrations/mail";
import { sendSms } from "@/server/integrations/sms";
import { processJobBatch, registerJobHandler } from "@/server/queue/worker";
import { syncOrders } from "@/server/smm/perfectpanel";

let builtInHandlersRegistered = false;

function ensureBuiltInHandlers(): void {
  if (builtInHandlersRegistered) return;
  builtInHandlersRegistered = true;

  registerJobHandler<{ to: string | string[]; subject: string; html: string }>(
    "mail.send",
    async (payload) => {
      await sendMail(payload);
    }
  );

  registerJobHandler<{ to: string; message: string }>(
    "sms.send",
    async (payload) => {
      await sendSms(payload);
    }
  );

  registerJobHandler<{ providerId?: string }>(
    "smm.sync",
    async (payload) => {
      await syncOrders(payload?.providerId);
    }
  );
}

export interface CronTickSummary {
  ranAt: string;
  durationMs: number;
  jobs: {
    claimed: number;
    completed: number;
    retried: number;
    dead: number;
  };
  smmSync: { checked: number; updated: number };
  scheduledServicesProcessed: number;
  expiredSeoCacheDeleted: number;
  overdueInvoicesMarked: number;
}

/**
 * cPanel / HTTP cron tick handler.
 * Intended to be invoked every 1-5 minutes via `/api/cron/tick` or CLI.
 */
export async function runCronTick(): Promise<CronTickSummary> {
  const startedAt = Date.now();
  ensureBuiltInHandlers();

  // 1. Process queued background jobs
  const jobs = await processJobBatch({ limit: 25 });

  // 2. Sync pending SMM orders
  let smmSync = { checked: 0, updated: 0 };
  try {
    smmSync = await syncOrders();
  } catch {
    // Non-fatal if no SMM providers are configured yet
  }

  // 3. Execute due scheduled client service actions (suspend / cancel)
  const now = new Date();
  const dueServices = await db.clientService.findMany({
    where: {
      scheduledAction: { not: null },
      scheduledActionAt: { lte: now },
    },
    take: 50,
  });

  for (const svc of dueServices) {
    const nextStatus =
      svc.scheduledAction === "CANCEL"
        ? "CANCELLED"
        : svc.scheduledAction === "SUSPEND"
          ? "SUSPENDED"
          : svc.status;

    await db.clientService.update({
      where: { id: svc.id },
      data: {
        status: nextStatus,
        scheduledAction: null,
        scheduledActionAt: null,
      },
    });
  }

  // 4. Mark past-due UNPAID invoices as OVERDUE
  const overdueResult = await db.invoice.updateMany({
    where: {
      status: "UNPAID",
      dueAt: { lt: now },
    },
    data: { status: "OVERDUE" },
  });

  // 5. Prune expired SEO result cache entries
  const cachePrune = await db.seoResultCache.deleteMany({
    where: { expiresAt: { lt: now } },
  });

  return {
    ranAt: now.toISOString(),
    durationMs: Date.now() - startedAt,
    jobs,
    smmSync,
    scheduledServicesProcessed: dueServices.length,
    expiredSeoCacheDeleted: cachePrune.count,
    overdueInvoicesMarked: overdueResult.count,
  };
}
