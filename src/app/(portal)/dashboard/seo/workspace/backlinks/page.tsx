"use client";

import React, { useEffect, useState } from "react";
import { ExternalLink, Filter, Link2, RefreshCw, Shield } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { fetchSeoWithFallback, formatCompactNumber } from "../_lib/seo-client";

interface BacklinkItem {
  id: string;
  sourceUrl: string;
  sourceDomain: string;
  targetUrl: string;
  anchorText: string;
  dr: number;
  type: "Follow" | "Nofollow";
  firstSeen: string;
}

interface BacklinksPayload {
  referringDomains: number;
  totalBacklinks: number;
  followCount: number;
  nofollowCount: number;
  backlinks: BacklinkItem[];
}

const DEMO_BACKLINKS: BacklinksPayload = {
  referringDomains: 412,
  totalBacklinks: 6840,
  followCount: 5198,
  nofollowCount: 1642,
  backlinks: [
    {
      id: "bl-1",
      sourceUrl: "https://techcrunch.com/2026/08/ai-seo-automation-tools",
      sourceDomain: "techcrunch.com",
      targetUrl: "/seo-workspace",
      anchorText: "WebServicers SEO Workspace",
      dr: 93,
      type: "Follow",
      firstSeen: "2026-08-14",
    },
    {
      id: "bl-2",
      sourceUrl: "https://github.com/modelcontextprotocol/servers",
      sourceDomain: "github.com",
      targetUrl: "/docs/seo-mcp",
      anchorText: "OpenSEO MCP Endpoint",
      dr: 96,
      type: "Nofollow",
      firstSeen: "2026-09-02",
    },
    {
      id: "bl-3",
      sourceUrl: "https://searchengineland.com/geo-tracking-guide",
      sourceDomain: "searchengineland.com",
      targetUrl: "/geo-tracking",
      anchorText: "GEO visibility monitoring",
      dr: 89,
      type: "Follow",
      firstSeen: "2026-10-11",
    },
    {
      id: "bl-4",
      sourceUrl: "https://indiehackers.com/post/scaling-organic-traffic",
      sourceDomain: "indiehackers.com",
      targetUrl: "/",
      anchorText: "webservicers.io",
      dr: 81,
      type: "Follow",
      firstSeen: "2026-10-29",
    },
    {
      id: "bl-5",
      sourceUrl: "https://dev.to/seo-engineering/technical-crawl-automation",
      sourceDomain: "dev.to",
      targetUrl: "/site-audit",
      anchorText: "automated technical audit",
      dr: 84,
      type: "Follow",
      firstSeen: "2026-11-08",
    },
  ],
};

export default function BacklinksPage() {
  const [data, setData] = useState<BacklinksPayload>(DEMO_BACKLINKS);
  const [filterType, setFilterType] = useState<"ALL" | "Follow" | "Nofollow">("ALL");
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(true);

  const loadBacklinks = async () => {
    setLoading(true);
    const res = await fetchSeoWithFallback<BacklinksPayload>("/api/seo/backlinks", DEMO_BACKLINKS);
    setData(res.data);
    setIsDemo(!res.fromApi);
    setLoading(false);
  };

  useEffect(() => {
    void loadBacklinks();
  }, []);

  const totalTyped = Math.max(data.followCount + data.nofollowCount, 1);
  const followPct = Math.round((data.followCount / totalTyped) * 100);
  const nofollowPct = 100 - followPct;

  const filteredRows = data.backlinks.filter((b) =>
    filterType === "ALL" ? true : b.type === filterType
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Backlink Profile"
        subtitle="Monitor referring domains, total backlinks, anchor text distribution, and Follow/Nofollow ratio."
        actions={
          <>
            {isDemo ? <Badge tone="lilac">Demo Data</Badge> : <Badge tone="success">Live API</Badge>}
            <Button variant="outline" size="sm" onClick={loadBacklinks} disabled={loading}>
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Sync Links
            </Button>
          </>
        }
      />

      {/* Profile Summary */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="cpki-card p-4">
          <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
            <span>Referring Domains</span>
            <Shield className="h-4 w-4 text-[var(--primary-text)]" />
          </div>
          <div className="mt-2 text-2xl font-semibold tabular-nums">
            {data.referringDomains.toLocaleString()}
          </div>
          <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">Unique root domains linking</p>
        </div>

        <div className="cpki-card p-4">
          <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
            <span>Total Backlinks</span>
            <Link2 className="h-4 w-4 text-[var(--primary-text)]" />
          </div>
          <div className="mt-2 text-2xl font-semibold tabular-nums">
            {formatCompactNumber(data.totalBacklinks)}
          </div>
          <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
            {data.totalBacklinks.toLocaleString()} live inbound links
          </p>
        </div>

        <div className="cpki-card p-4">
          <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
            <span>Follow / Nofollow Ratio</span>
            <span className="font-mono text-[11px] font-semibold text-[var(--foreground)]">
              {followPct}% / {nofollowPct}%
            </span>
          </div>
          <div className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full bg-[var(--muted)]">
            <div className="bg-[var(--success)]" style={{ width: `${followPct}%` }} />
            <div className="bg-[var(--brand-lilac)]" style={{ width: `${nofollowPct}%` }} />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--muted-foreground)]">
            <span>Follow: {data.followCount.toLocaleString()}</span>
            <span>Nofollow: {data.nofollowCount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Filter Bar + Table */}
      <div className="cpki-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Filter className="h-4 w-4 text-[var(--muted-foreground)]" />
            <span>Inbound Backlinks ({filteredRows.length})</span>
          </div>
          <div className="flex items-center gap-1.5">
            {(["ALL", "Follow", "Nofollow"] as const).map((t) => (
              <Button
                key={t}
                size="xs"
                variant={filterType === t ? "primary" : "outline"}
                onClick={() => setFilterType(t)}
              >
                {t}
              </Button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="cpki-table">
            <thead>
              <tr>
                <th>Source Domain &amp; Page</th>
                <th>DR</th>
                <th>Anchor Text</th>
                <th>Target URL</th>
                <th>Attribute</th>
                <th>First Seen</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="font-medium text-[var(--foreground)]">{item.sourceDomain}</div>
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-mono text-[11px] text-[var(--primary-text)] hover:underline"
                    >
                      <span className="max-w-[240px] truncate">{item.sourceUrl}</span>
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  </td>
                  <td>
                    <Badge tone={item.dr >= 80 ? "success" : "primary"}>{item.dr}</Badge>
                  </td>
                  <td className="text-xs">{item.anchorText}</td>
                  <td className="font-mono text-xs text-[var(--muted-foreground)]">{item.targetUrl}</td>
                  <td>
                    <Badge tone={item.type === "Follow" ? "success" : "neutral"}>{item.type}</Badge>
                  </td>
                  <td className="text-xs text-[var(--muted-foreground)] tabular-nums">{item.firstSeen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
