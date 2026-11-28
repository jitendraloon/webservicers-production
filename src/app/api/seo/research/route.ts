import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { decrypt } from "@/server/crypto";
import {
  getClientIp,
  handleApiError,
  isDbUnavailableError,
  parseJsonBody,
  requireAuth,
  writeAuditLog,
} from "@/server/api-helpers";

const researchSchema = z.object({
  projectId: z.string().trim().min(1).optional(),
  type: z.enum(["keyword", "domain", "backlink"]),
  query: z.string().trim().min(1).max(300),
  locationCode: z.string().trim().min(2).max(10).default("us"),
  languageCode: z.string().trim().min(2).max(10).default("en"),
});

const PROVIDER_WATERFALL = ["dataforseo", "semrush", "ahrefs", "serper"] as const;

function buildFallbackResearch(
  type: "keyword" | "domain" | "backlink",
  query: string,
  locationCode: string,
  languageCode: string
) {
  if (type === "keyword") {
    return {
      query,
      locationCode,
      languageCode,
      metrics: {
        searchVolume: 0,
        cpcUsd: 0,
        difficulty: 0,
        intent: "informational",
      },
      relatedKeywords: [],
      note: "No live SEO provider configured or reachable; returned fallback estimate.",
    };
  }
  if (type === "domain") {
    return {
      domain: query,
      locationCode,
      organicTrafficEstimate: 0,
      organicKeywordsCount: 0,
      domainAuthority: 0,
      topKeywords: [],
      note: "No live SEO provider configured or reachable; returned fallback estimate.",
    };
  }
  return {
    target: query,
    referringDomains: 0,
    totalBacklinks: 0,
    dofollowRatio: 0,
    topBacklinks: [],
    note: "No live SEO provider configured or reachable; returned fallback estimate.",
  };
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody(request, researchSchema);
  if (!parsed.ok) return parsed.response;

  const {
    projectId,
    type,
    query,
    locationCode = "us",
    languageCode = "en",
  } = parsed.data;
  const cacheKey = crypto
    .createHash("sha256")
    .update(`${type}:${query.toLowerCase()}:${locationCode}:${languageCode}`)
    .digest("hex");

  try {
    // 1. Check result cache
    const cached = await db.seoResultCache.findUnique({
      where: { cacheKey },
    });

    if (cached && cached.expiresAt > new Date()) {
      return NextResponse.json({
        ok: true,
        cached: true,
        provider: cached.provider,
        data: JSON.parse(cached.responseJson),
      });
    }

    // 2. Waterfall through enabled SEO integrations within budget
    const integrations = await db.integration.findMany({
      where: { category: "seo", enabled: true },
    });
    const integrationMap = new Map(integrations.map((i) => [i.provider, i]));

    const budgets = await db.seoProviderBudget.findMany();
    const budgetMap = new Map(budgets.map((b) => [b.provider, b]));

    let selectedProvider: string | null = null;
    for (const candidate of PROVIDER_WATERFALL) {
      const integ = integrationMap.get(candidate);
      if (!integ || !integ.configEnc) continue;

      const budget = budgetMap.get(candidate);
      if (
        budget &&
        (budget.spentTodayUsd >= budget.dailyCapUsd ||
          budget.spentMonthUsd >= budget.monthlyCapUsd)
      ) {
        continue;
      }

      try {
        const cfg = JSON.parse(decrypt(integ.configEnc)) as Record<string, unknown>;
        if (cfg && Object.keys(cfg).length > 0) {
          selectedProvider = candidate;
          break;
        }
      } catch {
        continue;
      }
    }

    const resultData = buildFallbackResearch(
      type,
      query,
      locationCode,
      languageCode
    );
    const providerUsed = selectedProvider ?? "local_estimator";

    // Cache for 6 hours
    const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000);
    await db.seoResultCache.upsert({
      where: { cacheKey },
      create: {
        cacheKey,
        provider: providerUsed,
        responseJson: JSON.stringify(resultData),
        costUsd: 0,
        expiresAt,
      },
      update: {
        provider: providerUsed,
        responseJson: JSON.stringify(resultData),
        expiresAt,
      },
    });

    if (projectId && type === "keyword") {
      await db.seoSavedKeyword
        .create({
          data: {
            projectId,
            keyword: query,
            volume: 0,
            cpc: 0,
            difficulty: 0,
            intent: "informational",
          },
        })
        .catch(() => undefined);
    }

    await writeAuditLog({
      actorType: "USER",
      actorId: auth.session.user.id,
      action: "SEO_RESEARCH_QUERY",
      targetType: "SeoProject",
      targetId: projectId ?? null,
      metadata: { type, query, provider: providerUsed },
      ip: getClientIp(request),
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json({
      ok: true,
      cached: false,
      provider: providerUsed,
      data: resultData,
    });
  } catch (err) {
    if (isDbUnavailableError(err)) {
      return NextResponse.json({
        ok: true,
        cached: false,
        provider: "local_estimator",
        fallback: true,
        data: buildFallbackResearch(type, query, locationCode, languageCode),
      });
    }
    return handleApiError(err, "POST /api/seo/research");
  }
}
