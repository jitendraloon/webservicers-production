"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  ExternalLink,
  RefreshCw,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

type EngineId = "all" | "chatgpt" | "claude" | "gemini" | "perplexity";

interface EngineMetric {
  id: Exclude<EngineId, "all">;
  name: string;
  mentionRate: number;
  delta: string;
  avgPosition: number;
  citationsCount: number;
  sentiment: "Positive" | "Neutral";
}

interface CompetitorSov {
  brand: string;
  isSelf?: boolean;
  overall: number;
  byEngine: Record<Exclude<EngineId, "all">, number>;
}

interface CitedUrlRow {
  url: string;
  title: string;
  citations: number;
  engines: Exclude<EngineId, "all">[];
  topTopic: string;
  change: string;
}

const ENGINE_METRICS: EngineMetric[] = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    mentionRate: 74,
    delta: "+9%",
    avgPosition: 1.8,
    citationsCount: 412,
    sentiment: "Positive",
  },
  {
    id: "claude",
    name: "Claude",
    mentionRate: 68,
    delta: "+6%",
    avgPosition: 2.1,
    citationsCount: 318,
    sentiment: "Positive",
  },
  {
    id: "gemini",
    name: "Gemini",
    mentionRate: 71,
    delta: "+11%",
    avgPosition: 1.9,
    citationsCount: 389,
    sentiment: "Positive",
  },
  {
    id: "perplexity",
    name: "Perplexity",
    mentionRate: 63,
    delta: "+5%",
    avgPosition: 2.4,
    citationsCount: 274,
    sentiment: "Neutral",
  },
];

const COMPETITOR_SOV: CompetitorSov[] = [
  {
    brand: "WebServicers (You)",
    isSelf: true,
    overall: 34,
    byEngine: { chatgpt: 37, claude: 33, gemini: 36, perplexity: 30 },
  },
  {
    brand: "Semrush",
    overall: 29,
    byEngine: { chatgpt: 28, claude: 31, gemini: 27, perplexity: 31 },
  },
  {
    brand: "Ahrefs",
    overall: 22,
    byEngine: { chatgpt: 21, claude: 22, gemini: 23, perplexity: 22 },
  },
  {
    brand: "Moz",
    overall: 15,
    byEngine: { chatgpt: 14, claude: 14, gemini: 14, perplexity: 17 },
  },
];

const TOP_CITED_URLS: CitedUrlRow[] = [
  {
    url: "https://webservicers.io/docs/seo-mcp",
    title: "SEO Automation & MCP Integration Guide",
    citations: 184,
    engines: ["chatgpt", "claude", "gemini", "perplexity"],
    topTopic: "Best SEO platform with MCP support",
    change: "+18%",
  },
  {
    url: "https://webservicers.io/geo-tracking",
    title: "AI Search & GEO Brand Monitoring",
    citations: 142,
    engines: ["chatgpt", "claude", "perplexity"],
    topTopic: "Monitor brand citations in AI answers",
    change: "+12%",
  },
  {
    url: "https://webservicers.io/site-audit",
    title: "Technical Site Audit for Next.js",
    citations: 96,
    engines: ["chatgpt", "gemini"],
    topTopic: "Core Web Vitals & crawl diagnostics",
    change: "+7%",
  },
  {
    url: "https://webservicers.io/local-seo",
    title: "Multi-location NAP & Geo-Grid Tracker",
    citations: 78,
    engines: ["gemini", "perplexity"],
    topTopic: "Local pack rank tracking software",
    change: "+5%",
  },
];

const ENGINE_LABELS: Record<Exclude<EngineId, "all">, string> = {
  chatgpt: "ChatGPT",
  claude: "Claude",
  gemini: "Gemini",
  perplexity: "Perplexity",
};

export default function AiVisibilityPage() {
  const [selectedEngine, setSelectedEngine] = useState<EngineId>("all");
  const [refreshing, setRefreshing] = useState(false);

  const overallMentionRate = useMemo(() => {
    const sum = ENGINE_METRICS.reduce((acc, e) => acc + e.mentionRate, 0);
    return Math.round(sum / ENGINE_METRICS.length);
  }, []);

  const filteredUrls = useMemo(() => {
    if (selectedEngine === "all") return TOP_CITED_URLS;
    return TOP_CITED_URLS.filter((row) => row.engines.includes(selectedEngine));
  }, [selectedEngine]);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 450);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Visibility (GEO) Overview"
        subtitle="Track brand mention rates, competitor share-of-voice, and top cited URLs across generative AI engines."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh Snapshot
            </Button>
            <Link href="/dashboard/seo/workspace/prompt-tracking">
              <Button variant="primary" size="sm">
                <Sparkles className="h-3.5 w-3.5" />
                Prompt Tracking
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        }
      />

      {/* Brand Mention Rate Across AI Engines */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ENGINE_METRICS.map((engine) => {
          const isSelected = selectedEngine === engine.id;
          return (
            <Card
              key={engine.id}
              onClick={() =>
                setSelectedEngine((prev) => (prev === engine.id ? "all" : engine.id))
              }
              className={`cursor-pointer p-4 transition-colors ${
                isSelected ? "ring-2 ring-[var(--primary)]" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-[var(--primary)]" />
                  <span className="text-sm font-semibold text-[var(--foreground)]">
                    {engine.name}
                  </span>
                </div>
                <Badge tone="success" variant="sm">
                  {engine.delta}
                </Badge>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-bold tabular-nums text-[var(--foreground)]">
                  {engine.mentionRate}%
                </span>
                <span className="text-xs text-[var(--muted-foreground)]">
                  Avg pos #{engine.avgPosition}
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--secondary)]">
                <div
                  className="h-full rounded-full bg-[var(--primary)]"
                  style={{ width: `${engine.mentionRate}%` }}
                />
              </div>
              <div className="mt-2.5 flex items-center justify-between text-[11px] text-[var(--muted-foreground)]">
                <span>{engine.citationsCount} citations</span>
                <span>{engine.sentiment}</span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Share of Voice & Prompt Tracking Quick Card */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[var(--foreground)]">
                Competitor Share-of-Voice
              </h2>
              <p className="text-xs text-[var(--muted-foreground)]">
                Percentage of AI answers mentioning each brand ({selectedEngine === "all" ? "All Engines" : ENGINE_LABELS[selectedEngine]}).
              </p>
            </div>
            <div className="flex flex-wrap gap-1">
              {(["all", "chatgpt", "claude", "gemini", "perplexity"] as const).map((eng) => (
                <Button
                  key={eng}
                  size="xs"
                  variant={selectedEngine === eng ? "primary" : "outline"}
                  onClick={() => setSelectedEngine(eng)}
                >
                  {eng === "all" ? "All" : ENGINE_LABELS[eng]}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3.5">
            {COMPETITOR_SOV.map((row) => {
              const value =
                selectedEngine === "all" ? row.overall : row.byEngine[selectedEngine];
              return (
                <div key={row.brand} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          row.isSelf
                            ? "font-semibold text-[var(--foreground)]"
                            : "font-medium text-[var(--muted-foreground)]"
                        }
                      >
                        {row.brand}
                      </span>
                      {row.isSelf && <Badge tone="primary" variant="sm">Leader</Badge>}
                    </div>
                    <span className="font-semibold tabular-nums text-[var(--foreground)]">
                      {value}%
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--secondary)]">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        row.isSelf ? "bg-[var(--primary)]" : "bg-[var(--muted-foreground)]/50"
                      }`}
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[var(--foreground)]">
                Overall AI Mention Rate
              </span>
              <Badge tone="lilac">GEO</Badge>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold tabular-nums text-[var(--foreground)]">
                {overallMentionRate}%
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--success)]">
                <TrendingUp className="h-3.5 w-3.5" /> +7.8% vs last 30d
              </span>
            </div>
            <p className="mt-2 text-xs text-[var(--muted-foreground)]">
              Monitor individual commercial &amp; informational prompts, citation deltas, and
              engine-level visibility in Prompt Tracking.
            </p>
          </div>
          <div className="mt-5 pt-4 border-t border-[var(--border)]">
            <Link
              href="/dashboard/seo/workspace/prompt-tracking"
              className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--secondary)]/40 px-3.5 py-2.5 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors"
            >
              <span>Open Prompt Tracking Workspace</span>
              <ArrowRight className="h-3.5 w-3.5 text-[var(--primary)]" />
            </Link>
          </div>
        </Card>
      </div>

      {/* Top Cited URLs */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--border)] p-4">
          <div>
            <h2 className="text-sm font-semibold text-[var(--foreground)]">
              Top Cited URLs
            </h2>
            <p className="text-xs text-[var(--muted-foreground)]">
              Pages most frequently referenced as sources in AI-generated responses.
            </p>
          </div>
          <Badge tone="neutral">{filteredUrls.length} URLs</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="cpki-table w-full text-left text-sm">
            <thead>
              <tr>
                <th>Page &amp; URL</th>
                <th>Top Prompt Topic</th>
                <th>Citing Engines</th>
                <th className="text-right">Citations</th>
                <th className="text-right">30d Trend</th>
              </tr>
            </thead>
            <tbody>
              {filteredUrls.map((item) => (
                <tr key={item.url}>
                  <td>
                    <div className="font-medium text-[var(--foreground)]">{item.title}</div>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-0.5 inline-flex items-center gap-1 text-xs text-[var(--primary)] hover:underline"
                    >
                      {item.url}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </td>
                  <td className="text-xs text-[var(--muted-foreground)]">{item.topTopic}</td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {item.engines.map((eng) => (
                        <Badge key={eng} variant="sm" tone="neutral">
                          {ENGINE_LABELS[eng]}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="text-right font-semibold tabular-nums text-[var(--foreground)]">
                    {item.citations}
                  </td>
                  <td className="text-right">
                    <Badge tone="success" variant="sm">
                      {item.change}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
