import crypto from "node:crypto";
import { db } from "@/server/db";
import { getIntegrationConfig } from "@/server/integrations/vault";

export const SEO_PROVIDER_WATERFALL = [
  "seranking",
  "dataforseo",
  "mangools",
  "serper",
  "semrush",
  "ahrefs",
] as const;

export type SeoProviderName = (typeof SEO_PROVIDER_WATERFALL)[number];

export interface SeoQueryParams {
  operation:
    | "keyword_metrics"
    | "serp_check"
    | "domain_overview"
    | "backlinks"
    | "site_audit";
  payload: Record<string, unknown>;
  ttlSeconds?: number;
  preferredProviders?: SeoProviderName[];
}

export interface SeoQueryResult<T = unknown> {
  provider: string;
  cached: boolean;
  cacheKey: string;
  costUsd: number;
  data: T;
}

interface SeoProviderConfig extends Record<string, unknown> {
  apiKey?: string;
  login?: string;
  password?: string;
  baseUrl?: string;
  estimatedCostUsd?: number;
}

const DEFAULT_PROVIDER_COSTS: Record<SeoProviderName, number> = {
  seranking: 0.005,
  dataforseo: 0.008,
  mangools: 0.01,
  serper: 0.002,
  semrush: 0.02,
  ahrefs: 0.03,
};

function computeCacheKey(
  operation: string,
  payload: Record<string, unknown>
): string {
  const canonical = JSON.stringify({
    operation,
    payload: Object.keys(payload)
      .sort()
      .reduce<Record<string, unknown>>((acc, k) => {
        acc[k] = payload[k];
        return acc;
      }, {}),
  });
  return crypto.createHash("sha256").update(canonical, "utf8").digest("hex");
}

function isSameUtcDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

function isSameUtcMonth(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth()
  );
}

async function checkAndResetBudget(
  provider: SeoProviderName,
  estimatedCostUsd: number
): Promise<boolean> {
  const now = new Date();
  const budget = await db.seoProviderBudget.upsert({
    where: { provider },
    update: {},
    create: {
      provider,
      dailyCapUsd: 10,
      monthlyCapUsd: 200,
      spentTodayUsd: 0,
      spentMonthUsd: 0,
      lastResetAt: now,
    },
  });

  let spentToday = budget.spentTodayUsd;
  let spentMonth = budget.spentMonthUsd;
  let needsReset = false;

  if (!isSameUtcDay(budget.lastResetAt, now)) {
    spentToday = 0;
    needsReset = true;
  }
  if (!isSameUtcMonth(budget.lastResetAt, now)) {
    spentMonth = 0;
    needsReset = true;
  }

  if (needsReset) {
    await db.seoProviderBudget.update({
      where: { provider },
      data: {
        spentTodayUsd: spentToday,
        spentMonthUsd: spentMonth,
        lastResetAt: now,
      },
    });
  }

  if (spentToday + estimatedCostUsd > budget.dailyCapUsd) {
    return false;
  }
  if (spentMonth + estimatedCostUsd > budget.monthlyCapUsd) {
    return false;
  }
  return true;
}

async function recordProviderSpend(
  provider: SeoProviderName,
  costUsd: number
): Promise<void> {
  await db.seoProviderBudget.update({
    where: { provider },
    data: {
      spentTodayUsd: { increment: costUsd },
      spentMonthUsd: { increment: costUsd },
    },
  });
}

async function executeProviderCall(
  provider: SeoProviderName,
  config: SeoProviderConfig,
  operation: SeoQueryParams["operation"],
  payload: Record<string, unknown>
): Promise<unknown> {
  switch (provider) {
    case "seranking": {
      if (!config.apiKey) throw new Error("SE Ranking apiKey missing.");
      const base = config.baseUrl ?? "https://api4.seranking.com";
      const res = await fetch(`${base}/research/overview`, {
        method: "POST",
        headers: {
          Authorization: `Token ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ operation, ...payload }),
      });
      if (!res.ok) throw new Error(`SE Ranking HTTP ${res.status}`);
      return res.json();
    }

    case "dataforseo": {
      if (!config.login || !config.password) {
        throw new Error("DataForSEO login/password missing.");
      }
      const auth = Buffer.from(`${config.login}:${config.password}`).toString(
        "base64"
      );
      const endpoint =
        operation === "serp_check"
          ? "https://api.dataforseo.com/v3/serp/google/organic/live/advanced"
          : "https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([payload]),
      });
      if (!res.ok) throw new Error(`DataForSEO HTTP ${res.status}`);
      return res.json();
    }

    case "mangools": {
      if (!config.apiKey) throw new Error("Mangools apiKey missing.");
      const base = config.baseUrl ?? "https://api.mangools.com/v1";
      const res = await fetch(`${base}/${operation}`, {
        method: "POST",
        headers: {
          "X-Access-Token": config.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Mangools HTTP ${res.status}`);
      return res.json();
    }

    case "serper": {
      if (!config.apiKey) throw new Error("Serper.dev apiKey missing.");
      const res = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: {
          "X-API-KEY": config.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q: payload.keyword ?? payload.query ?? payload.domain ?? "",
          gl: payload.locationCode ?? "us",
          hl: payload.languageCode ?? "en",
        }),
      });
      if (!res.ok) throw new Error(`Serper.dev HTTP ${res.status}`);
      return res.json();
    }

    case "semrush": {
      if (!config.apiKey) throw new Error("Semrush apiKey missing.");
      const url = new URL("https://api.semrush.com/");
      url.searchParams.set("key", config.apiKey);
      url.searchParams.set("type", String(payload.type ?? "domain_ranks"));
      if (payload.domain) url.searchParams.set("domain", String(payload.domain));
      if (payload.keyword) url.searchParams.set("phrase", String(payload.keyword));
      url.searchParams.set("database", String(payload.locationCode ?? "us"));
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`Semrush HTTP ${res.status}`);
      return { raw: await res.text() };
    }

    case "ahrefs": {
      if (!config.apiKey) throw new Error("Ahrefs apiKey missing.");
      const url = new URL(
        `https://api.ahrefs.com/v3/site-explorer/${operation === "backlinks" ? "all-backlinks" : "metrics"}`
      );
      if (payload.domain) url.searchParams.set("target", String(payload.domain));
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${config.apiKey}` },
      });
      if (!res.ok) throw new Error(`Ahrefs HTTP ${res.status}`);
      return res.json();
    }
  }
}

/**
 * Query SEO data through the provider waterfall:
 * SE Ranking -> DataForSEO -> Mangools -> Serper.dev -> Semrush -> Ahrefs.
 * Enforces SHA-256 `seo_result_cache` and `seo_provider_budgets` USD caps.
 */
export async function querySeoWaterfall<T = unknown>(
  params: SeoQueryParams
): Promise<SeoQueryResult<T>> {
  const cacheKey = computeCacheKey(params.operation, params.payload);
  const now = new Date();

  const cached = await db.seoResultCache.findUnique({
    where: { cacheKey },
  });

  if (cached && cached.expiresAt > now) {
    return {
      provider: cached.provider,
      cached: true,
      cacheKey,
      costUsd: 0,
      data: JSON.parse(cached.responseJson) as T,
    };
  }

  const order = params.preferredProviders ?? SEO_PROVIDER_WATERFALL;
  const errors: string[] = [];

  for (const provider of order) {
    const integration = await getIntegrationConfig<SeoProviderConfig>(
      "seo",
      provider
    );
    if (!integration || !integration.enabled) {
      continue;
    }

    const estimatedCost =
      typeof integration.config.estimatedCostUsd === "number"
        ? integration.config.estimatedCostUsd
        : DEFAULT_PROVIDER_COSTS[provider];

    const withinBudget = await checkAndResetBudget(provider, estimatedCost);
    if (!withinBudget) {
      errors.push(`${provider}: budget cap exceeded`);
      continue;
    }

    try {
      const data = await executeProviderCall(
        provider,
        integration.config,
        params.operation,
        params.payload
      );

      await recordProviderSpend(provider, estimatedCost);

      const ttlSeconds = params.ttlSeconds ?? 86_400;
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

      await db.seoResultCache.upsert({
        where: { cacheKey },
        update: {
          provider,
          responseJson: JSON.stringify(data),
          costUsd: estimatedCost,
          expiresAt,
        },
        create: {
          cacheKey,
          provider,
          responseJson: JSON.stringify(data),
          costUsd: estimatedCost,
          expiresAt,
        },
      });

      return {
        provider,
        cached: false,
        cacheKey,
        costUsd: estimatedCost,
        data: data as T,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${provider}: ${msg}`);
    }
  }

  throw new Error(
    `All SEO providers failed or were skipped (${errors.join("; ") || "no enabled providers"}).`
  );
}
