"use client";

import React, { useState } from "react";
import { ArrowUpRight, Globe, Search, ShieldCheck, TrendingUp, Users } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { fetchSeoWithFallback, formatCompactNumber, getKdTone } from "../_lib/seo-client";

interface DomainOverviewData {
  domain: string;
  trafficEstimate: number;
  trafficValueUsd: number;
  authorityScore: number;
  organicKeywordsCount: number;
  referringDomains: number;
  topKeywords: { keyword: string; position: number; volume: number; kd: number; trafficShare: string; url: string }[];
  competitors: { domain: string; overlap: number; commonKeywords: number; authority: number; traffic: number }[];
}

const DEMO_DOMAIN: DomainOverviewData = {
  domain: "webservicers.io",
  trafficEstimate: 48290,
  trafficValueUsd: 34120,
  authorityScore: 54,
  organicKeywordsCount: 1840,
  referringDomains: 412,
  topKeywords: [
    { keyword: "ai seo workspace", position: 2, volume: 4400, kd: 38, trafficShare: "14.2%", url: "/seo-workspace" },
    { keyword: "mcp seo server", position: 1, volume: 1900, kd: 24, trafficShare: "11.8%", url: "/docs/seo-mcp" },
    { keyword: "geo brand visibility tracker", position: 3, volume: 2900, kd: 41, trafficShare: "9.4%", url: "/geo-tracking" },
    { keyword: "automated site audit tool", position: 5, volume: 8100, kd: 57, trafficShare: "7.1%", url: "/site-audit" },
    { keyword: "keyword clustering api", position: 4, volume: 2400, kd: 34, trafficShare: "5.3%", url: "/api/keywords" },
  ],
  competitors: [
    { domain: "ahrefs.com", overlap: 64, commonKeywords: 512, authority: 91, traffic: 2400000 },
    { domain: "semrush.com", overlap: 59, commonKeywords: 478, authority: 92, traffic: 3100000 },
    { domain: "seobility.net", overlap: 48, commonKeywords: 320, authority: 74, traffic: 420000 },
    { domain: "mangools.com", overlap: 41, commonKeywords: 265, authority: 76, traffic: 310000 },
  ],
};

export default function DomainOverviewPage() {
  const [domainInput, setDomainInput] = useState("webservicers.io");
  const [data, setData] = useState<DomainOverviewData>(DEMO_DOMAIN);
  const [loading, setLoading] = useState(false);
  const [isDemo, setIsDemo] = useState(true);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = domainInput.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!cleaned) return;
    setLoading(true);
    const res = await fetchSeoWithFallback<DomainOverviewData>(
      `/api/seo/domain?domain=${encodeURIComponent(cleaned)}`,
      { ...DEMO_DOMAIN, domain: cleaned }
    );
    setData(res.data);
    setIsDemo(!res.fromApi);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Domain Overview"
        subtitle="Inspect organic traffic estimates, authority score, top-ranking keywords, and SERP competitors."
        actions={isDemo ? <Badge tone="lilac">Demo Data</Badge> : <Badge tone="success">Live API</Badge>}
      />

      {/* Domain Lookup Bar */}
      <form onSubmit={handleLookup} className="cpki-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Globe className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              type="text"
              className="cpki-input pl-8"
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
              placeholder="Enter domain (e.g. webservicers.io)"
            />
          </div>
          <Button type="submit" disabled={loading}>
            <Search className="h-3.5 w-3.5" />
            {loading ? "Looking up..." : "Analyze Domain"}
          </Button>
        </div>
      </form>

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="cpki-card p-4">
          <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
            <span>Est. Organic Traffic</span>
            <TrendingUp className="h-4 w-4 text-[var(--success)]" />
          </div>
          <div className="mt-2 text-2xl font-semibold tabular-nums">
            {formatCompactNumber(data.trafficEstimate)}
          </div>
          <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
            Traffic value: ${data.trafficValueUsd.toLocaleString()}/mo
          </p>
        </div>

        <div className="cpki-card p-4">
          <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
            <span>Authority Score</span>
            <ShieldCheck className="h-4 w-4 text-[var(--primary-text)]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold tabular-nums">{data.authorityScore}</span>
            <span className="text-xs text-[var(--muted-foreground)]">/ 100</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--muted)]">
            <div
              className="h-full rounded-full bg-[var(--primary)]"
              style={{ width: `${data.authorityScore}%` }}
            />
          </div>
        </div>

        <div className="cpki-card p-4">
          <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
            <span>Organic Keywords</span>
            <Search className="h-4 w-4 text-[var(--primary-text)]" />
          </div>
          <div className="mt-2 text-2xl font-semibold tabular-nums">
            {data.organicKeywordsCount.toLocaleString()}
          </div>
          <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">Indexed top-100 terms</p>
        </div>

        <div className="cpki-card p-4">
          <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
            <span>Referring Domains</span>
            <Users className="h-4 w-4 text-[var(--primary-text)]" />
          </div>
          <div className="mt-2 text-2xl font-semibold tabular-nums">
            {data.referringDomains.toLocaleString()}
          </div>
          <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">Unique linking hosts</p>
        </div>
      </div>

      {/* Top Organic Keywords & Top Competitors */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="cpki-card overflow-hidden lg:col-span-2">
          <div className="border-b border-[var(--border)] px-4 py-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Top Organic Keywords for {data.domain}</h2>
            <Badge tone="primary">{data.topKeywords.length} shown</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="cpki-table">
              <thead>
                <tr>
                  <th>Keyword</th>
                  <th>Pos</th>
                  <th>Volume</th>
                  <th>KD %</th>
                  <th>Share</th>
                  <th>Ranking URL</th>
                </tr>
              </thead>
              <tbody>
                {data.topKeywords.map((kw) => (
                  <tr key={kw.keyword}>
                    <td className="font-medium">{kw.keyword}</td>
                    <td>
                      <Badge tone={kw.position <= 3 ? "success" : "primary"}>#{kw.position}</Badge>
                    </td>
                    <td className="tabular-nums">{kw.volume.toLocaleString()}</td>
                    <td>
                      <Badge tone={getKdTone(kw.kd)}>{kw.kd}%</Badge>
                    </td>
                    <td className="tabular-nums text-xs">{kw.trafficShare}</td>
                    <td className="font-mono text-xs text-[var(--muted-foreground)]">{kw.url}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="cpki-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Top Organic Competitors</h2>
            <Badge tone="neutral">SERP Overlap</Badge>
          </div>
          <div className="space-y-3">
            {data.competitors.map((comp) => (
              <div
                key={comp.domain}
                className="rounded-[var(--radius-control)] border border-[var(--border)] p-3"
              >
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setDomainInput(comp.domain)}
                    className="flex items-center gap-1 text-xs font-semibold text-[var(--primary-text)] hover:underline"
                  >
                    {comp.domain}
                    <ArrowUpRight className="h-3 w-3" />
                  </button>
                  <Badge tone="lilac">{comp.overlap}% overlap</Badge>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--muted-foreground)]">
                  <span>{comp.commonKeywords} common KWs</span>
                  <span>DA {comp.authority}</span>
                  <span>{formatCompactNumber(comp.traffic)}/mo</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
