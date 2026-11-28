"use client";

import React, { useEffect, useState } from "react";
import { Bot, ExternalLink, RefreshCw, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { fetchSeoWithFallback } from "../_lib/seo-client";

interface TrackedPromptRow {
  id: string;
  prompt: string;
  mentionRate: number;
  delta: string;
  engines: { name: string; cited: boolean }[];
  citedUrl: string;
  lastRun: string;
}

interface PromptTrackingPayload {
  overallMentionRate: number;
  weeklySeries: { week: string; rate: number }[];
  prompts: TrackedPromptRow[];
}

const DEMO_TRACKING: PromptTrackingPayload = {
  overallMentionRate: 68,
  weeklySeries: [
    { week: "W1", rate: 49 },
    { week: "W2", rate: 54 },
    { week: "W3", rate: 58 },
    { week: "W4", rate: 62 },
    { week: "W5", rate: 65 },
    { week: "W6", rate: 68 },
  ],
  prompts: [
    {
      id: "pt-1",
      prompt: "Best all-in-one SEO platform with MCP support",
      mentionRate: 88,
      delta: "+12%",
      engines: [
        { name: "ChatGPT", cited: true },
        { name: "Claude", cited: true },
        { name: "Gemini", cited: true },
        { name: "Perplexity", cited: false },
      ],
      citedUrl: "https://webservicers.io/docs/seo-mcp",
      lastRun: "2026-11-24",
    },
    {
      id: "pt-2",
      prompt: "How to monitor brand citations in AI search engines",
      mentionRate: 75,
      delta: "+8%",
      engines: [
        { name: "ChatGPT", cited: true },
        { name: "Claude", cited: true },
        { name: "Gemini", cited: false },
        { name: "Perplexity", cited: true },
      ],
      citedUrl: "https://webservicers.io/geo-tracking",
      lastRun: "2026-11-24",
    },
    {
      id: "pt-3",
      prompt: "Automated technical site audit tool for Next.js",
      mentionRate: 50,
      delta: "+4%",
      engines: [
        { name: "ChatGPT", cited: true },
        { name: "Claude", cited: false },
        { name: "Gemini", cited: true },
        { name: "Perplexity", cited: false },
      ],
      citedUrl: "https://webservicers.io/site-audit",
      lastRun: "2026-11-24",
    },
  ],
};

export default function PromptTrackingPage() {
  const [data, setData] = useState<PromptTrackingPayload>(DEMO_TRACKING);
  const [loading, setLoading] = useState(false);
  const [isDemo, setIsDemo] = useState(true);

  const loadTracking = async () => {
    setLoading(true);
    const res = await fetchSeoWithFallback<PromptTrackingPayload>(
      "/api/seo/prompt-tracking",
      DEMO_TRACKING
    );
    setData(res.data);
    setIsDemo(!res.fromApi);
    setLoading(false);
  };

  useEffect(() => {
    void loadTracking();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="GEO Prompt Tracking"
        subtitle="Weekly generative engine visibility monitoring across ChatGPT, Claude, Gemini, and Perplexity."
        actions={
          <>
            {isDemo ? <Badge tone="lilac">Demo Data</Badge> : <Badge tone="success">Live API</Badge>}
            <Button variant="outline" size="sm" onClick={loadTracking} disabled={loading}>
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Run Weekly Check
            </Button>
          </>
        }
      />

      {/* Weekly Trend + Overall Mention Rate */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="cpki-card-insight p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-[var(--insight-foreground)]">
              <span>Overall Brand Mention Rate</span>
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="mt-3 text-4xl font-semibold tabular-nums text-[var(--insight-foreground)]">
              {data.overallMentionRate}%
            </div>
            <p className="mt-1 text-xs text-[var(--insight-foreground)] opacity-85">
              Across {data.prompts.length} tracked prompts &amp; 4 LLM engines
            </p>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Badge tone="success">+19% over 6 weeks</Badge>
          </div>
        </div>

        <div className="cpki-card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Weekly Brand Citation Rate (%)</h2>
            <Badge tone="primary">6-Week Trend</Badge>
          </div>
          <div className="grid grid-cols-6 gap-3 items-end h-36 pt-2">
            {data.weeklySeries.map((pt) => (
              <div key={pt.week} className="flex flex-col items-center gap-1.5 h-full justify-end">
                <span className="text-[11px] font-medium tabular-nums">{pt.rate}%</span>
                <div
                  className="w-full max-w-[40px] rounded-t-md bg-[var(--success)]/85"
                  style={{ height: `${Math.max(15, pt.rate)}%` }}
                />
                <span className="text-xs text-[var(--muted-foreground)]">{pt.week}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tracked Prompts Table */}
      <div className="cpki-card overflow-hidden">
        <div className="border-b border-[var(--border)] px-4 py-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Tracked GEO Prompts</h2>
          <Badge tone="neutral">{data.prompts.length} active</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="cpki-table">
            <thead>
              <tr>
                <th>Prompt</th>
                <th>Mention Rate</th>
                <th>LLM Engines</th>
                <th>Primary Cited URL</th>
                <th>Last Run</th>
              </tr>
            </thead>
            <tbody>
              {data.prompts.map((p) => (
                <tr key={p.id}>
                  <td className="font-medium max-w-xs">{p.prompt}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Badge tone={p.mentionRate >= 70 ? "success" : "warning"}>{p.mentionRate}%</Badge>
                      <span className="text-xs font-medium text-[var(--success)]">{p.delta}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {p.engines.map((eng) => (
                        <Badge
                          key={eng.name}
                          variant="sm"
                          tone={eng.cited ? "success" : "neutral"}
                        >
                          <Bot className="h-2.5 w-2.5" />
                          {eng.name}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td>
                    <a
                      href={p.citedUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-mono text-xs text-[var(--primary-text)] hover:underline"
                    >
                      <span className="max-w-[200px] truncate">{p.citedUrl}</span>
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  </td>
                  <td className="text-xs text-[var(--muted-foreground)] tabular-nums">{p.lastRun}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
