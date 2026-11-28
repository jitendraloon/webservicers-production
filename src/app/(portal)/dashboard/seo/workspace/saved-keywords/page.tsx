"use client";

import React, { useEffect, useState } from "react";
import { Download, Search, Tag, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  SearchIntent,
  fetchSeoWithFallback,
  getIntentTone,
  getKdTone,
  mutateSeoWithFallback,
} from "../_lib/seo-client";

interface SavedKeyword {
  id: string;
  keyword: string;
  volume: number;
  cpc: number;
  kd: number;
  intent: SearchIntent;
  tags: string[];
  savedAt: string;
}

const DEMO_SAVED: SavedKeyword[] = [
  {
    id: "sk-1",
    keyword: "ai seo automation platform",
    volume: 6600,
    cpc: 8.4,
    kd: 42,
    intent: "Commercial",
    tags: ["q4-campaign", "pillar"],
    savedAt: "2026-11-20",
  },
  {
    id: "sk-2",
    keyword: "how to optimize for chatgpt search",
    volume: 9900,
    cpc: 4.9,
    kd: 31,
    intent: "Informational",
    tags: ["geo", "blog"],
    savedAt: "2026-11-21",
  },
  {
    id: "sk-3",
    keyword: "seo mcp server integration",
    volume: 1900,
    cpc: 6.2,
    kd: 22,
    intent: "Transactional",
    tags: ["mcp", "docs"],
    savedAt: "2026-11-22",
  },
  {
    id: "sk-4",
    keyword: "technical seo audit checklist",
    volume: 12100,
    cpc: 5.3,
    kd: 51,
    intent: "Informational",
    tags: ["lead-magnet"],
    savedAt: "2026-11-24",
  },
  {
    id: "sk-5",
    keyword: "webservicers seo dashboard",
    volume: 720,
    cpc: 2.1,
    kd: 14,
    intent: "Navigational",
    tags: ["brand"],
    savedAt: "2026-11-25",
  },
];

export default function SavedKeywordsPage() {
  const [items, setItems] = useState<SavedKeyword[]>(DEMO_SAVED);
  const [intentFilter, setIntentFilter] = useState<"ALL" | SearchIntent>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [isDemo, setIsDemo] = useState(true);

  useEffect(() => {
    void (async () => {
      const res = await fetchSeoWithFallback<SavedKeyword[]>("/api/seo/saved-keywords", DEMO_SAVED);
      setItems(res.data);
      setIsDemo(!res.fromApi);
    })();
  }, []);

  const filtered = items.filter((item) => {
    const matchesIntent = intentFilter === "ALL" || item.intent === intentFilter;
    const matchesQuery =
      !searchTerm.trim() ||
      item.keyword.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesIntent && matchesQuery;
  });

  const handleDelete = async (id: string) => {
    await mutateSeoWithFallback(`/api/seo/saved-keywords/${id}`, "DELETE", undefined, { ok: true });
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleExportCsv = () => {
    const header = ["Keyword", "Volume", "CPC", "KD%", "Intent", "Tags", "Saved At"];
    const csvRows = [
      header.join(","),
      ...filtered.map((r) =>
        [
          `"${r.keyword.replace(/"/g, '""')}"`,
          r.volume,
          r.cpc,
          r.kd,
          r.intent,
          `"${r.tags.join("; ")}"`,
          r.savedAt,
        ].join(",")
      ),
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "saved-keywords.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Saved Keywords"
        subtitle="Organize bookmarked keywords by tag and search intent, or export to CSV."
        actions={
          <>
            {isDemo ? <Badge tone="lilac">Demo Data</Badge> : <Badge tone="success">Live API</Badge>}
            <Button variant="outline" size="sm" onClick={handleExportCsv} disabled={filtered.length === 0}>
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>
          </>
        }
      />

      {/* Filter Bar */}
      <div className="cpki-card p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            type="text"
            className="cpki-input pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter by keyword or tag..."
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {(["ALL", "Commercial", "Transactional", "Informational", "Navigational"] as const).map(
            (intent) => (
              <Button
                key={intent}
                size="xs"
                variant={intentFilter === intent ? "primary" : "outline"}
                onClick={() => setIntentFilter(intent)}
              >
                {intent}
              </Button>
            )
          )}
        </div>
      </div>

      {/* Table */}
      <div className="cpki-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="cpki-table">
            <thead>
              <tr>
                <th>Keyword</th>
                <th>Volume</th>
                <th>CPC</th>
                <th>KD %</th>
                <th>Intent</th>
                <th>Tags</th>
                <th>Saved</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-xs text-[var(--muted-foreground)]">
                    No saved keywords match the current filter.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id}>
                    <td className="font-medium text-[var(--foreground)]">{item.keyword}</td>
                    <td className="tabular-nums">{item.volume.toLocaleString()}</td>
                    <td className="tabular-nums">${item.cpc.toFixed(2)}</td>
                    <td>
                      <Badge tone={getKdTone(item.kd)}>{item.kd}%</Badge>
                    </td>
                    <td>
                      <Badge tone={getIntentTone(item.intent)}>{item.intent}</Badge>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {item.tags.map((t) => (
                          <Badge key={t} variant="sm" tone="neutral">
                            <Tag className="h-2.5 w-2.5" />
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="text-xs text-[var(--muted-foreground)] tabular-nums">{item.savedAt}</td>
                    <td className="text-right">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => handleDelete(item.id)}
                        aria-label={`Delete ${item.keyword}`}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-[var(--destructive)]" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
