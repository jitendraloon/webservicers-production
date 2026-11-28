"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  Bot,
  FileSearch,
  Globe,
  Link2,
  MapPin,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { fetchSeoWithFallback, formatCompactNumber } from "../_lib/seo-client";

interface OverviewData {
  projectName: string;
  domain: string;
  organicTraffic: number;
  organicTrafficDelta: string;
  domainAuthority: number;
  keywordsTop10: number;
  keywordsTotal: number;
  siteHealthScore: number;
  aiVisibilityScore: number;
  trafficSeries: { month: string; organic: number; aiCitations: number }[];
  recentAlerts: { id: string; title: string; severity: "success" | "warning" | "primary"; time: string }[];
}

const DEMO_OVERVIEW: OverviewData = {
  projectName: "WebServicers Growth",
  domain: "webservicers.io",
  organicTraffic: 48290,
  organicTrafficDelta: "+14.2%",
  domainAuthority: 54,
  keywordsTop10: 142,
  keywordsTotal: 618,
  siteHealthScore: 91,
  aiVisibilityScore: 68,
  trafficSeries: [
    { month: "Jun", organic: 31200, aiCitations: 42 },
    { month: "Jul", organic: 34800, aiCitations: 48 },
    { month: "Aug", organic: 37900, aiCitations: 53 },
    { month: "Sep", organic: 41400, aiCitations: 59 },
    { month: "Oct", organic: 44600, aiCitations: 64 },
    { month: "Nov", organic: 48290, aiCitations: 68 },
  ],
  recentAlerts: [
    { id: "1", title: "12 keywords entered Top 3 positions this week", severity: "success", time: "2h ago" },
    { id: "2", title: "Site Audit completed: 3 broken canonicals flagged", severity: "warning", time: "Yesterday" },
    { id: "3", title: "Brand mention rate rose +6% in Perplexity & ChatGPT", severity: "primary", time: "3d ago" },
  ],
};

const QUICK_LAUNCHERS = [
  {
    title: "Keyword Research",
    desc: "Discover high-intent keywords, KD%, CPC & SERP features.",
    href: "/dashboard/seo/workspace/keyword-research",
    icon: Search,
    badge: "Research",
  },
  {
    title: "Rank Tracking",
    desc: "Monitor daily SERP movements across target locations.",
    href: "/dashboard/seo/workspace/rank-tracking",
    icon: TrendingUp,
    badge: "Tracking",
  },
  {
    title: "Site Audit",
    desc: "Crawl pages for Core Web Vitals, meta & indexation issues.",
    href: "/dashboard/seo/workspace/site-audit",
    icon: FileSearch,
    badge: "Technical",
  },
  {
    title: "GEO Prompt Research",
    desc: "Test brand visibility in ChatGPT, Claude, Gemini & Perplexity.",
    href: "/dashboard/seo/workspace/prompt-research",
    icon: Sparkles,
    badge: "AI / GEO",
  },
  {
    title: "Backlink Profile",
    desc: "Analyze referring domains, anchor text & follow ratio.",
    href: "/dashboard/seo/workspace/backlinks",
    icon: Link2,
    badge: "Authority",
  },
  {
    title: "Local SEO Grid",
    desc: "Check Google Business Profile pack & NAP consistency.",
    href: "/dashboard/seo/workspace/local-seo",
    icon: MapPin,
    badge: "Local",
  },
];

export default function SeoWorkspaceDashboardPage() {
  const [data, setData] = useState<OverviewData>(DEMO_OVERVIEW);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(true);

  const loadOverview = async () => {
    setLoading(true);
    const res = await fetchSeoWithFallback<OverviewData>("/api/seo/overview", DEMO_OVERVIEW);
    setData(res.data);
    setIsDemo(!res.fromApi);
    setLoading(false);
  };

  useEffect(() => {
    void loadOverview();
  }, []);

  const maxTraffic = Math.max(...data.trafficSeries.map((d) => d.organic), 1);

  return (
    <div className="space-y-6">
      <PageHeader
        title="SEO Workspace Overview"
        subtitle={`Command center for ${data.projectName} (${data.domain})`}
        actions={
          <>
            {isDemo ? <Badge tone="lilac">Demo Data</Badge> : <Badge tone="success">Live API</Badge>}
            <Button variant="outline" size="sm" onClick={loadOverview} disabled={loading}>
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Link href="/dashboard/seo/workspace/reports" className="cpki-btn cpki-btn-primary cpki-btn-sm">
              <Bot className="h-3.5 w-3.5" />
              Executive Report
            </Link>
          </>
        }
      />

      {/* Primary KPI Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="cpki-card p-4">
          <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
            <span>Organic Traffic</span>
            <Globe className="h-4 w-4 text-[var(--primary-text)]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold tabular-nums">{formatCompactNumber(data.organicTraffic)}</span>
            <Badge tone="success">{data.organicTrafficDelta}</Badge>
          </div>
          <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">Est. monthly visits</p>
        </div>

        <div className="cpki-card p-4">
          <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
            <span>Domain Authority</span>
            <Link2 className="h-4 w-4 text-[var(--primary-text)]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold tabular-nums">{data.domainAuthority}</span>
            <span className="text-xs text-[var(--muted-foreground)]">/ 100</span>
          </div>
          <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">Root domain strength</p>
        </div>

        <div className="cpki-card p-4">
          <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
            <span>Keywords in Top 10</span>
            <TrendingUp className="h-4 w-4 text-[var(--success)]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold tabular-nums">{data.keywordsTop10}</span>
            <span className="text-xs text-[var(--muted-foreground)]">of {data.keywordsTotal}</span>
          </div>
          <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">Page 1 Google rankings</p>
        </div>

        <div className="cpki-card p-4">
          <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
            <span>Site Health Score</span>
            <Activity className="h-4 w-4 text-[var(--success)]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold tabular-nums">{data.siteHealthScore}%</span>
            <Badge tone={data.siteHealthScore >= 85 ? "success" : "warning"}>
              {data.siteHealthScore >= 85 ? "Healthy" : "Needs Review"}
            </Badge>
          </div>
          <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">Technical crawl status</p>
        </div>

        <div className="cpki-card-insight p-4">
          <div className="flex items-center justify-between text-xs text-[var(--insight-foreground)]">
            <span>AI Visibility (GEO)</span>
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold tabular-nums text-[var(--insight-foreground)]">
              {data.aiVisibilityScore}%
            </span>
            <Badge tone="success">4 LLMs</Badge>
          </div>
          <p className="mt-1 text-[11px] text-[var(--insight-foreground)] opacity-85">
            Brand citation share
          </p>
        </div>
      </div>

      {/* Traffic Trend + Alerts */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="cpki-card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[var(--foreground)]">
                Organic Traffic &amp; AI Visibility Trend
              </h2>
              <p className="text-xs text-[var(--muted-foreground)]">
                6-month organic clicks alongside LLM citation score
              </p>
            </div>
            <Badge tone="primary">Last 6 Months</Badge>
          </div>
          <div className="grid grid-cols-6 items-end gap-3 pt-4 h-44">
            {data.trafficSeries.map((pt) => {
              const heightPct = Math.max(18, Math.round((pt.organic / maxTraffic) * 100));
              return (
                <div key={pt.month} className="flex flex-col items-center gap-2 h-full justify-end">
                  <div className="text-[11px] font-medium tabular-nums text-[var(--muted-foreground)]">
                    {formatCompactNumber(pt.organic)}
                  </div>
                  <div
                    className="w-full max-w-[44px] rounded-t-md bg-[var(--primary)]/85 transition-all hover:bg-[var(--primary)]"
                    style={{ height: `${heightPct}%` }}
                    title={`${pt.month}: ${pt.organic.toLocaleString()} visits | AI Score ${pt.aiCitations}%`}
                  />
                  <div className="text-xs font-medium text-[var(--foreground)]">{pt.month}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="cpki-card p-5">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Recent Workspace Signals</h2>
          <p className="mb-4 text-xs text-[var(--muted-foreground)]">Automated SEO &amp; GEO alerts</p>
          <div className="space-y-3">
            {data.recentAlerts.map((alert) => (
              <div
                key={alert.id}
                className="rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--muted)]/50 p-3"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <Badge tone={alert.severity}>{alert.severity === "success" ? "Gain" : alert.severity === "warning" ? "Audit" : "GEO"}</Badge>
                  <span className="text-[11px] text-[var(--muted-foreground)]">{alert.time}</span>
                </div>
                <p className="text-xs text-[var(--foreground)] leading-relaxed">{alert.title}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Tool Launchers */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Quick Tool Launchers</h2>
          <Link
            href="/dashboard/seo/workspace/agent-setup"
            className="text-xs font-medium text-[var(--primary-text)] hover:underline"
          >
            Configure SEO MCP Agent →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_LAUNCHERS.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.href}
                href={tool.href}
                className="cpki-card group flex flex-col justify-between p-4 transition-colors hover:border-[var(--primary)]"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-control)] bg-[var(--accent)] text-[var(--primary-text)]">
                      <Icon className="h-4 w-4" />
                    </div>
                    <Badge tone="neutral">{tool.badge}</Badge>
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-[var(--foreground)] group-hover:text-[var(--primary-text)]">
                    {tool.title}
                  </h3>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)] leading-relaxed">
                    {tool.desc}
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs font-medium text-[var(--primary-text)]">
                  <span>Open tool</span>
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
