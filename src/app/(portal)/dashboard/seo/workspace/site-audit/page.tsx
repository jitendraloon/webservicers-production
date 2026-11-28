"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, Play, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { fetchSeoWithFallback, mutateSeoWithFallback } from "../_lib/seo-client";

interface AuditHistoryItem {
  id: string;
  targetUrl: string;
  score: number;
  pagesCrawled: number;
  errors: number;
  warnings: number;
  notices: number;
  ranAt: string;
}

interface CrawledPage {
  url: string;
  statusCode: number;
  loadMs: number;
  title: string;
  issues: number;
  severity: "Error" | "Warning" | "Healthy";
}

interface SiteAuditData {
  history: AuditHistoryItem[];
  pages: CrawledPage[];
}

const DEMO_AUDIT: SiteAuditData = {
  history: [
    {
      id: "aud-104",
      targetUrl: "https://webservicers.io",
      score: 91,
      pagesCrawled: 120,
      errors: 3,
      warnings: 14,
      notices: 28,
      ranAt: "2026-11-26 08:30",
    },
    {
      id: "aud-103",
      targetUrl: "https://webservicers.io",
      score: 86,
      pagesCrawled: 118,
      errors: 7,
      warnings: 19,
      notices: 31,
      ranAt: "2026-11-19 08:30",
    },
  ],
  pages: [
    { url: "/", statusCode: 200, loadMs: 410, title: "WebServicers — AI SEO & Digital Growth", issues: 0, severity: "Healthy" },
    { url: "/seo-workspace", statusCode: 200, loadMs: 520, title: "OpenSEO Workspace Suite", issues: 1, severity: "Warning" },
    { url: "/docs/seo-mcp", statusCode: 200, loadMs: 380, title: "SEO MCP Server Documentation", issues: 0, severity: "Healthy" },
    { url: "/blog/old-guide", statusCode: 404, loadMs: 190, title: "Not Found", issues: 2, severity: "Error" },
    { url: "/pricing", statusCode: 200, loadMs: 640, title: "Plans & Enterprise Pricing", issues: 1, severity: "Warning" },
  ],
};

export default function SiteAuditPage() {
  const [targetUrl, setTargetUrl] = useState("https://webservicers.io");
  const [maxPages, setMaxPages] = useState(100);
  const [jsRendering, setJsRendering] = useState(true);
  const [lighthouse, setLighthouse] = useState(true);
  const [data, setData] = useState<SiteAuditData>(DEMO_AUDIT);
  const [running, setRunning] = useState(false);
  const [isDemo, setIsDemo] = useState(true);

  useEffect(() => {
    void (async () => {
      const res = await fetchSeoWithFallback<SiteAuditData>("/api/seo/site-audit", DEMO_AUDIT);
      setData(res.data);
      setIsDemo(!res.fromApi);
    })();
  }, []);

  const handleLaunchCrawl = async (e: React.FormEvent) => {
    e.preventDefault();
    setRunning(true);
    const newAudit: AuditHistoryItem = {
      id: `aud-${Date.now().toString().slice(-4)}`,
      targetUrl,
      score: 93,
      pagesCrawled: maxPages,
      errors: 2,
      warnings: 11,
      notices: 24,
      ranAt: "Just now",
    };
    await mutateSeoWithFallback("/api/seo/site-audit", "POST", {
      targetUrl,
      maxPages,
      jsRendering,
      lighthouse,
    }, newAudit);
    setData((prev) => ({ ...prev, history: [newAudit, ...prev.history] }));
    setRunning(false);
  };

  const latest = data.history[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Technical Site Audit"
        subtitle="Launch full-site crawls with optional JS rendering & Lighthouse checks, and inspect page-level issues."
        actions={isDemo ? <Badge tone="lilac">Demo Data</Badge> : <Badge tone="success">Live API</Badge>}
      />

      {/* Crawl Launcher */}
      <form onSubmit={handleLaunchCrawl} className="cpki-card p-5 space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <div className="md:col-span-6">
            <label className="mb-1 block text-xs font-medium">Target URL</label>
            <input
              type="url"
              required
              className="cpki-input"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
            />
          </div>
          <div className="md:col-span-3">
            <label className="mb-1 block text-xs font-medium">Max Pages</label>
            <select
              className="cpki-select"
              value={maxPages}
              onChange={(e) => setMaxPages(Number(e.target.value))}
            >
              <option value={50}>50 pages</option>
              <option value={100}>100 pages</option>
              <option value={500}>500 pages</option>
              <option value={1000}>1,000 pages</option>
            </select>
          </div>
          <div className="flex items-end md:col-span-3">
            <Button type="submit" className="w-full" disabled={running}>
              <Play className="h-3.5 w-3.5" />
              {running ? "Crawling..." : "Launch Crawl"}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 pt-1 text-xs">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={jsRendering}
              onChange={(e) => setJsRendering(e.target.checked)}
              className="rounded border-[var(--border)]"
            />
            <span>Enable Headless JS Rendering</span>
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={lighthouse}
              onChange={(e) => setLighthouse(e.target.checked)}
              className="rounded border-[var(--border)]"
            />
            <span>Run Lighthouse Core Web Vitals</span>
          </label>
        </div>
      </form>

      {/* Issue Breakdown */}
      {latest && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="cpki-card p-4">
            <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
              <span>Health Score</span>
              <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />
            </div>
            <div className="mt-2 text-2xl font-semibold tabular-nums">{latest.score}%</div>
            <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">{latest.pagesCrawled} pages crawled</p>
          </div>
          <div className="cpki-card p-4">
            <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
              <span>Errors</span>
              <ShieldAlert className="h-4 w-4 text-[var(--destructive)]" />
            </div>
            <div className="mt-2 text-2xl font-semibold tabular-nums text-[var(--destructive)]">
              {latest.errors}
            </div>
            <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">4xx/5xx, broken canonicals</p>
          </div>
          <div className="cpki-card p-4">
            <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
              <span>Warnings</span>
              <AlertTriangle className="h-4 w-4 text-[var(--warning)]" />
            </div>
            <div className="mt-2 text-2xl font-semibold tabular-nums text-[var(--warning)]">
              {latest.warnings}
            </div>
            <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">Meta length, slow TTFB</p>
          </div>
          <div className="cpki-card p-4">
            <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
              <span>Notices</span>
              <Info className="h-4 w-4 text-[var(--primary-text)]" />
            </div>
            <div className="mt-2 text-2xl font-semibold tabular-nums">{latest.notices}</div>
            <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">Schema &amp; alt text hints</p>
          </div>
        </div>
      )}

      {/* Crawled Pages + Audit History */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="cpki-card overflow-hidden lg:col-span-2">
          <div className="border-b border-[var(--border)] px-4 py-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Crawled Pages</h2>
            <Badge tone="neutral">{data.pages.length} sample URLs</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="cpki-table">
              <thead>
                <tr>
                  <th>URL Path</th>
                  <th>Status</th>
                  <th>Load Time</th>
                  <th>Title</th>
                  <th>Issues</th>
                </tr>
              </thead>
              <tbody>
                {data.pages.map((p) => (
                  <tr key={p.url}>
                    <td className="font-mono text-xs font-medium">{p.url}</td>
                    <td>
                      <Badge tone={p.statusCode >= 400 ? "danger" : "success"}>{p.statusCode}</Badge>
                    </td>
                    <td className="tabular-nums text-xs">{p.loadMs} ms</td>
                    <td className="text-xs max-w-[200px] truncate">{p.title}</td>
                    <td>
                      <Badge
                        tone={
                          p.severity === "Error"
                            ? "danger"
                            : p.severity === "Warning"
                            ? "warning"
                            : "success"
                        }
                      >
                        {p.issues} {p.severity}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="cpki-card p-4">
          <h2 className="mb-3 text-sm font-semibold">Audit History</h2>
          <div className="space-y-3">
            {data.history.map((h) => (
              <div
                key={h.id}
                className="rounded-[var(--radius-control)] border border-[var(--border)] p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold">{h.id}</span>
                  <Badge tone={h.score >= 90 ? "success" : "warning"}>{h.score}%</Badge>
                </div>
                <div className="mt-1 text-xs text-[var(--muted-foreground)] truncate">{h.targetUrl}</div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--muted-foreground)]">
                  <span>{h.pagesCrawled} pages</span>
                  <span>{h.errors}E / {h.warnings}W</span>
                  <span>{h.ranAt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
