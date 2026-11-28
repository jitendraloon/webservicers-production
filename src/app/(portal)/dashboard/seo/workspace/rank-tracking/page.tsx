"use client";

import React, { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Minus, Play, Plus, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { fetchSeoWithFallback, getKdTone, mutateSeoWithFallback } from "../_lib/seo-client";

interface TrackedKeyword {
  id: string;
  domain: string;
  keyword: string;
  position: number;
  change: number;
  volume: number;
  kd: number;
  url: string;
  lastChecked: string;
}

const DEMO_RANKS: TrackedKeyword[] = [
  {
    id: "rk-1",
    domain: "webservicers.io",
    keyword: "ai seo workspace",
    position: 2,
    change: 3,
    volume: 4400,
    kd: 38,
    url: "/seo-workspace",
    lastChecked: "Today, 09:15",
  },
  {
    id: "rk-2",
    domain: "webservicers.io",
    keyword: "seo mcp server",
    position: 1,
    change: 0,
    volume: 1900,
    kd: 24,
    url: "/docs/seo-mcp",
    lastChecked: "Today, 09:15",
  },
  {
    id: "rk-3",
    domain: "webservicers.io",
    keyword: "geo visibility tracker",
    position: 4,
    change: 2,
    volume: 2900,
    kd: 41,
    url: "/geo-tracking",
    lastChecked: "Today, 09:15",
  },
  {
    id: "rk-4",
    domain: "webservicers.io",
    keyword: "automated site audit tool",
    position: 8,
    change: -1,
    volume: 8100,
    kd: 57,
    url: "/site-audit",
    lastChecked: "Today, 09:15",
  },
  {
    id: "rk-5",
    domain: "webservicers.io",
    keyword: "rank tracking api",
    position: 11,
    change: 4,
    volume: 3200,
    kd: 49,
    url: "/api/ranks",
    lastChecked: "Today, 09:15",
  },
];

export default function RankTrackingPage() {
  const [rows, setRows] = useState<TrackedKeyword[]>(DEMO_RANKS);
  const [checking, setChecking] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");
  const [newDomain, setNewDomain] = useState("webservicers.io");
  const [newUrl, setNewUrl] = useState("/");
  const [isDemo, setIsDemo] = useState(true);

  useEffect(() => {
    void (async () => {
      const res = await fetchSeoWithFallback<TrackedKeyword[]>("/api/seo/ranks", DEMO_RANKS);
      setRows(res.data);
      setIsDemo(!res.fromApi);
    })();
  }, []);

  const handleRunCheck = async () => {
    setChecking(true);
    const updated = rows.map((r) => ({ ...r, lastChecked: "Just now" }));
    const res = await mutateSeoWithFallback<TrackedKeyword[]>(
      "/api/seo/ranks/check",
      "POST",
      { ids: rows.map((r) => r.id) },
      updated
    );
    setRows(res.data);
    setChecking(false);
  };

  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;
    const item: TrackedKeyword = {
      id: `rk-${Date.now()}`,
      domain: newDomain.trim() || "webservicers.io",
      keyword: newKeyword.trim().toLowerCase(),
      position: Math.floor(Math.random() * 18) + 3,
      change: Math.floor(Math.random() * 5) - 1,
      volume: 1400,
      kd: 36,
      url: newUrl.trim() || "/",
      lastChecked: "Just now",
    };
    await mutateSeoWithFallback("/api/seo/ranks", "POST", item, item);
    setRows((prev) => [item, ...prev]);
    setNewKeyword("");
    setNewUrl("/");
    setModalOpen(false);
  };

  const avgPos = (
    rows.reduce((sum, r) => sum + r.position, 0) / Math.max(rows.length, 1)
  ).toFixed(1);
  const top3Count = rows.filter((r) => r.position <= 3).length;
  const top10Count = rows.filter((r) => r.position <= 10).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rank Tracking"
        subtitle="Track daily Google SERP positions, movement deltas, and ranking landing pages."
        actions={
          <>
            {isDemo ? <Badge tone="lilac">Demo Data</Badge> : <Badge tone="success">Live API</Badge>}
            <Button variant="outline" size="sm" onClick={handleRunCheck} disabled={checking}>
              <Play className={`h-3.5 w-3.5 ${checking ? "animate-pulse" : ""}`} />
              {checking ? "Checking..." : "Run Check"}
            </Button>
            <Button size="sm" onClick={() => setModalOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              Add Keyword
            </Button>
          </>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="cpki-card p-4">
          <div className="text-xs text-[var(--muted-foreground)]">Tracked Keywords</div>
          <div className="mt-1.5 text-2xl font-semibold tabular-nums">{rows.length}</div>
        </div>
        <div className="cpki-card p-4">
          <div className="text-xs text-[var(--muted-foreground)]">Average Position</div>
          <div className="mt-1.5 flex items-center gap-2 text-2xl font-semibold tabular-nums">
            <span>#{avgPos}</span>
            <TrendingUp className="h-4 w-4 text-[var(--success)]" />
          </div>
        </div>
        <div className="cpki-card p-4">
          <div className="text-xs text-[var(--muted-foreground)]">Top 3 Positions</div>
          <div className="mt-1.5 text-2xl font-semibold tabular-nums text-[var(--success)]">{top3Count}</div>
        </div>
        <div className="cpki-card p-4">
          <div className="text-xs text-[var(--muted-foreground)]">Top 10 Positions</div>
          <div className="mt-1.5 text-2xl font-semibold tabular-nums">{top10Count}</div>
        </div>
      </div>

      {/* Table */}
      <div className="cpki-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="cpki-table">
            <thead>
              <tr>
                <th>Keyword</th>
                <th>Domain</th>
                <th>Position</th>
                <th>Change</th>
                <th>Volume</th>
                <th>KD %</th>
                <th>Ranking URL</th>
                <th>Last Checked</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="font-medium text-[var(--foreground)]">{row.keyword}</td>
                  <td className="text-xs text-[var(--muted-foreground)]">{row.domain}</td>
                  <td>
                    <Badge tone={row.position <= 3 ? "success" : row.position <= 10 ? "primary" : "neutral"}>
                      #{row.position}
                    </Badge>
                  </td>
                  <td>
                    {row.change > 0 ? (
                      <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-[var(--success)] tabular-nums">
                        <ArrowUp className="h-3.5 w-3.5" />+{row.change}
                      </span>
                    ) : row.change < 0 ? (
                      <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-[var(--destructive)] tabular-nums">
                        <ArrowDown className="h-3.5 w-3.5" />
                        {row.change}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 text-xs text-[var(--muted-foreground)]">
                        <Minus className="h-3.5 w-3.5" />0
                      </span>
                    )}
                  </td>
                  <td className="tabular-nums">{row.volume.toLocaleString()}</td>
                  <td>
                    <Badge tone={getKdTone(row.kd)}>{row.kd}%</Badge>
                  </td>
                  <td className="font-mono text-xs text-[var(--muted-foreground)]">{row.url}</td>
                  <td className="text-xs text-[var(--muted-foreground)]">{row.lastChecked}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Keyword Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Tracked Keyword">
        <form onSubmit={handleAddKeyword} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium">Keyword</label>
            <input
              type="text"
              required
              className="cpki-input"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="e.g. enterprise seo software"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Domain</label>
            <input
              type="text"
              className="cpki-input"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Target URL Path</label>
            <input
              type="text"
              className="cpki-input"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="/features/seo"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Add Keyword
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
