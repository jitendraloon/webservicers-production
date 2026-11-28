import { decrypt } from "@/server/crypto";
import { db } from "@/server/db";
import type { SmmOrderStatus } from "@prisma/client";

export interface PerfectPanelService {
  service: string | number;
  name: string;
  type?: string;
  category: string;
  rate: string | number;
  min: string | number;
  max: string | number;
  refill?: boolean;
  cancel?: boolean;
}

export interface PerfectPanelOrderStatus {
  charge?: string;
  start_count?: string;
  status: string;
  remains?: string;
  currency?: string;
}

async function callPerfectPanel<T>(
  apiUrl: string,
  apiKey: string,
  params: Record<string, string | number>
): Promise<T> {
  const form = new URLSearchParams();
  form.set("key", apiKey);
  for (const [k, v] of Object.entries(params)) {
    form.set(k, String(v));
  }

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });

  if (!response.ok) {
    throw new Error(
      `PerfectPanel API HTTP ${response.status}: ${await response.text()}`
    );
  }

  const data = (await response.json()) as T & { error?: string };
  if (data && typeof data === "object" && "error" in data && data.error) {
    throw new Error(`PerfectPanel API error: ${data.error}`);
  }

  return data;
}

async function resolveProvider(providerId: string) {
  const provider = await db.smmProvider.findUnique({
    where: { id: providerId },
  });
  if (!provider) {
    throw new Error(`SMM provider ${providerId} not found.`);
  }
  const apiKey = decrypt(provider.apiKeyEnc);
  return { provider, apiKey };
}

function mapPerfectPanelStatus(rawStatus: string): SmmOrderStatus {
  const normalized = rawStatus.trim().toLowerCase();
  if (normalized === "completed") return "COMPLETED";
  if (normalized === "in progress" || normalized === "processing") {
    return "IN_PROGRESS";
  }
  if (normalized === "partial") return "PARTIAL";
  if (normalized === "canceled" || normalized === "cancelled") {
    return "CANCELLED";
  }
  if (normalized === "refunded") return "REFUNDED";
  return "PENDING";
}

/**
 * Fetch current account balance from a PerfectPanel v2 provider and update DB.
 */
export async function getBalance(
  providerId: string
): Promise<{ balance: number; currency: string }> {
  const { provider, apiKey } = await resolveProvider(providerId);
  const res = await callPerfectPanel<{ balance: string; currency?: string }>(
    provider.apiUrl,
    apiKey,
    { action: "balance" }
  );

  const balance = Number(res.balance ?? 0);
  await db.smmProvider.update({
    where: { id: provider.id },
    data: { balanceUsd: Number.isFinite(balance) ? balance : 0 },
  });

  return {
    balance,
    currency: res.currency ?? "USD",
  };
}

/**
 * Fetch available services from a PerfectPanel v2 provider and upsert into `smm_services`.
 */
export async function getServices(
  providerId: string,
  defaultMarginPercent = 20
): Promise<PerfectPanelService[]> {
  const { provider, apiKey } = await resolveProvider(providerId);
  const services = await callPerfectPanel<PerfectPanelService[]>(
    provider.apiUrl,
    apiKey,
    { action: "services" }
  );

  for (const svc of services) {
    const externalId = String(svc.service);
    await db.smmService.upsert({
      where: {
        providerId_externalId: {
          providerId: provider.id,
          externalId,
        },
      },
      update: {
        name: svc.name,
        category: svc.category,
        ratePerThousand: Number(svc.rate) || 0,
        minQty: Number(svc.min) || 1,
        maxQty: Number(svc.max) || 100000,
      },
      create: {
        providerId: provider.id,
        externalId,
        name: svc.name,
        category: svc.category,
        ratePerThousand: Number(svc.rate) || 0,
        minQty: Number(svc.min) || 1,
        maxQty: Number(svc.max) || 100000,
        marginPercent: defaultMarginPercent,
        status: "ACTIVE",
      },
    });
  }

  await db.smmProvider.update({
    where: { id: provider.id },
    data: { lastSyncedAt: new Date() },
  });

  return services;
}

/**
 * Place an order on a PerfectPanel v2 provider.
 */
export async function createOrder(params: {
  providerId: string;
  externalServiceId: string;
  link: string;
  quantity: number;
}): Promise<{ externalOrderId: string }> {
  const { provider, apiKey } = await resolveProvider(params.providerId);
  const res = await callPerfectPanel<{ order: string | number }>(
    provider.apiUrl,
    apiKey,
    {
      action: "add",
      service: params.externalServiceId,
      link: params.link,
      quantity: params.quantity,
    }
  );

  return { externalOrderId: String(res.order) };
}

/**
 * Query a single order's status from a PerfectPanel v2 provider.
 */
export async function getOrderStatus(
  providerId: string,
  externalOrderId: string
): Promise<PerfectPanelOrderStatus> {
  const { provider, apiKey } = await resolveProvider(providerId);
  return callPerfectPanel<PerfectPanelOrderStatus>(provider.apiUrl, apiKey, {
    action: "status",
    order: externalOrderId,
  });
}

/**
 * Sync all pending/in-progress SMM orders for a specific provider (or all active providers).
 */
export async function syncOrders(providerId?: string): Promise<{
  checked: number;
  updated: number;
}> {
  const providers = providerId
    ? await db.smmProvider.findMany({ where: { id: providerId } })
    : await db.smmProvider.findMany({ where: { status: "ACTIVE" } });

  let checked = 0;
  let updated = 0;

  for (const provider of providers) {
    const apiKey = decrypt(provider.apiKeyEnc);
    const pendingOrders = await db.smmOrder.findMany({
      where: {
        service: { providerId: provider.id },
        status: { in: ["PENDING", "IN_PROGRESS"] },
        externalOrderId: { not: null },
      },
      take: 100,
    });

    if (pendingOrders.length === 0) continue;

    const orderIds = pendingOrders
      .map((o) => o.externalOrderId!)
      .join(",");

    const statuses = await callPerfectPanel<
      Record<string, PerfectPanelOrderStatus>
    >(provider.apiUrl, apiKey, {
      action: "status",
      orders: orderIds,
    });

    for (const order of pendingOrders) {
      checked += 1;
      const extId = order.externalOrderId!;
      const info = statuses[extId];
      if (!info) continue;

      const mappedStatus = mapPerfectPanelStatus(info.status);
      const startCount =
        info.start_count !== undefined ? Number(info.start_count) : undefined;
      const remains =
        info.remains !== undefined ? Number(info.remains) : undefined;

      await db.smmOrder.update({
        where: { id: order.id },
        data: {
          status: mappedStatus,
          ...(Number.isFinite(startCount) ? { startCount } : {}),
          ...(Number.isFinite(remains) ? { remains } : {}),
        },
      });
      updated += 1;
    }
  }

  return { checked, updated };
}
