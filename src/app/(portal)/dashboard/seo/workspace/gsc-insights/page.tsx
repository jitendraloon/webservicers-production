"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, Link2, MousePointerClick, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { fetchSeoWithFallback, formatCompactNumber } from "../_lib/seo-client";

interface GscQueryRow {
  query: string;
  clicks: number;
  impressions: number;
  ctr: string;
  position: number;
}

interface GscData {
  connected: boolean;
  property: string;
  lastSynced: string;
  totals: {
    impressions: number;
    clicks: number;
    ctr: string;
    avgPosition: number;
  };
  daily: { label: string; impressions: number; clicks: number }[];
  topQueries: GscQueryRow[];
}

const DEMO_GSC: GscData = {
  connected: true,
  property: "sc-domain:webservicers.io",
  lastSynced: "2026-11-26 07:45 UTC",
  totals: {
    impressions: 312400,
    clicks: 18420,
    ctr: "5.9%",
    avgPosition: 11.4,
  },
  daily: [
    { label: "Mon", impressions: 41200, clicks: 2380 },
    { label: "Tue", impressions: 44800, clicks: 2610 },
    { label: "Wed", impressions: 46900, clicks: 2790 },
    { label: "Thu", impressions: 48200, clicks: 2910 },
    { label: "Fri", impressions: 45100, clicks: 2640 },
    { label: "Sat", impressions: 42300, clicks: 2490 },
    { label: "Sun", impressions: 43900, clicks: 2600 },
  ],
  topQueries: [
    { query: "webservicers seo", clicks: 3420, impressions: 28900, ctr: "11.8%", position: 1.8 },
    { query: "ai seo workspace", clicks: 2190, impressions: 31400, ctr: "7.0%", position: 3.1 },
    { query: "seo mcp server", clicks: 1480, impressions: 14200, ctr: "10.4%", position: 2.2 },
    { query: "geo visibility tracking", clicks: 960, impressions: 19800, ctr: "4.8%", position: 5.4 },
    { query: "technical seo crawler", clicks: 710, impressions: 22100, ctr: "3.2%", position: 8.7 },
  ],
};

export default function GscInsightsPage() {
  const [data, setData] = useState<GscData>(DEMO_GSC);
  const [syncing, setSyncing] = useState(false);
  const [isDemo, setIsDemo] = useState(true);

  const loadGsc = async () => {
    setSyncing(true);
    const res = await fetchSeoWithFallback<GscData>("/api/seo/gsc", DEMO_GSC);
    setData(res.data);
    setIsDemo(!res.fromApi);
    setSyncing(false);
  };

  useEffect(() => {
    void loadGsc();
  }, []);

  const maxImpr = Math.max(...data.daily.map((d) => d.impressions), 1);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Google Search Console Insights"
        subtitle="Verified search performance metrics: impressions, clicks, CTR, average position, and top queries."
        actions={
          <>
            {isDemo ? <Badge tone="lilac">Demo Data</Badge> : <Badge tone="success">Live API</Badge>}
            <Button variant="outline" size="sm" onClick={loadGsc} disabled={syncing}>
              <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
              Sync GSC
            </Button>
          </>
        }
      />

      {/* Connection Card */}
      <div className="cpki-card-insight p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)] bg-[var(--success-subtle)] text-[var(--success)]">
            {data.connected ? <CheckCircle2 className="h-5 w-5" /> : <Link2 className="h-5 w-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[var(--foreground)]">
                {data.property}
              </span>
              <Badge tone={data.connected ? "success" : "warning"}>
                {data.connected ? "Connected" : "Not Connected"}
              </Badge>
            </div>
            <p className="text-xs text-[var(--muted-foreground)]">
              Last synced: {data.lastSynced}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setData((prev) => ({ ...prev, connected: !prev.connected }))}
        >
          {data.connected ? "Reconnect Property" : "Connect Google Search Console"}
        </Button>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="cpki-card p-4">
          <div className="text-xs text-[var(--muted-foreground)]">Total Impressions</div>
          <div className="mt-2 text-2xl font-semibold tabular-nums">
            {formatCompactNumber(data.totals.impressions)}
          </div>
          <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">Last 28 days</p>
        </div>
        <div className="cpki-card p-4">
          <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
            <span>Total Clicks</span>
            <MousePointerClick className="h-4 w-4 text-[var(--primary-text)]" />
          </div>
          <div className="mt-2 text-2xl font-semibold tabular-nums">
            {formatCompactNumber(data.totals.clicks)}
          </div>
          <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">Organic Google Search</p>
        </div>
        <div className="cpki-card p-4">
          <div className="text-xs text-[var(--muted-foreground)]">Average CTR</div>
          <div className="mt-2 text-2xl font-semibold tabular-nums text-[var(--success)]">
            {data.totals.ctr}
          </div>
          <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">Click-through rate</p>
        </div>
        <div className="cpki-card p-4">
          <div className="text-xs text-[var(--muted-foreground)]">Average Position</div>
          <div className="mt-2 text-2xl font-semibold tabular-nums">{data.totals.avgPosition}</div>
          <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">Across all queries</p>
        </div>
      </div>

      {/* Impressions & Clicks Chart */}
      <div className="cpki-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">7-Day Impressions vs Clicks</h2>
            <p className="text-xs text-[var(--muted-foreground)]">Daily search visibility &amp; click volume</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-[var(--primary)]" /> Impressions
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-[var(--success)]" /> Clicks
            </span>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-3 items-end h-40 pt-3">
          {data.daily.map((d) => {
            const imprH = Math.max(20, Math.round((d.impressions / maxImpr) * 100));
            const clicksH = Math.max(12, Math.round(((d.clicks * 12) / maxImpr) * 100));
            return (
              <div key={d.label} className="flex flex-col items-center gap-1.5 h-full justify-end">
                <div className="flex items-end gap-1 h-full w-full justify-center">
                  <div
                    className="w-4 rounded-t bg-[var(--primary)]/80"
                    style={{ height: `${imprH}%` }}
                    title={`Impressions: ${d.impressions.toLocaleString()}`}
                  />
                  <div
                    className="w-4 rounded-t bg-[var(--success)]"
                    style={{ height: `${clicksH}%` }}
                    title={`Clicks: ${d.clicks.toLocaleString()}`}
                  />
                </div>
                <span className="text-xs text-[var(--muted-foreground)]">{d.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Queries Table */}
      <div className="cpki-card overflow-hidden">
        <div className="border-b border-[var(--border)] px-4 py-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Top Search Queries</h2>
          <Badge tone="primary">{data.topQueries.length} queries</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="cpki-table">
            <thead>
              <tr>
                <th>Query</th>
                <th>Clicks</th>
                <th>Impressions</th>
                <th>CTR</th>
                <th>Avg. Position</th>
              </tr>
            </thead>
            <tbody>
              {data.topQueries.map((q) => (
                <tr key={q.query}>
                  <td className="font-medium">{q.query}</td>
                  <td className="tabular-nums">{q.clicks.toLocaleString()}</td>
                  <td className="tabular-nums">{q.impressions.toLocaleString()}</td>
                  <td className="tabular-nums text-[var(--success)] font-medium">{q.ctr}</td>
                  <td>
                    <Badge tone={q.position <= 3 ? "success" : "primary"}>{q.position.toFixed(1)}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
