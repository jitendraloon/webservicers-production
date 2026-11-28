"use client";

import React, { useState } from "react";
import { Bookmark, Check, Globe, Search, Sparkles } from "lucide-react";
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

interface KeywordRow {
  keyword: string;
  volume: number;
  cpc: number;
  kd: number;
  intent: SearchIntent;
  serpFeatures: string[];
  trend: string;
}

const DEMO_KEYWORDS: KeywordRow[] = [
  {
    keyword: "ai seo automation platform",
    volume: 6600,
    cpc: 8.4,
    kd: 42,
    intent: "Commercial",
    serpFeatures: ["AI Overview", "Sitelinks", "FAQ"],
    trend: "+28%",
  },
  {
    keyword: "best rank tracking software",
    volume: 14800,
    cpc: 12.15,
    kd: 68,
    intent: "Commercial",
    serpFeatures: ["Featured Snippet", "Reviews", "Ads"],
    trend: "+9%",
  },
  {
    keyword: "how to optimize for chatgpt search",
    volume: 9900,
    cpc: 4.9,
    kd: 31,
    intent: "Informational",
    serpFeatures: ["AI Overview", "People Also Ask", "Video"],
    trend: "+64%",
  },
  {
    keyword: "technical seo audit checklist",
    volume: 12100,
    cpc: 5.3,
    kd: 51,
    intent: "Informational",
    serpFeatures: ["Featured Snippet", "People Also Ask"],
    trend: "+6%",
  },
  {
    keyword: "seo mcp server integration",
    volume: 1900,
    cpc: 6.2,
    kd: 22,
    intent: "Transactional",
    serpFeatures: ["Sitelinks", "Code Block"],
    trend: "+112%",
  },
  {
    keyword: "enterprise local seo tool",
    volume: 3600,
    cpc: 15.8,
    kd: 58,
    intent: "Transactional",
    serpFeatures: ["Local Pack", "Ads", "Reviews"],
    trend: "+11%",
  },
];

export default function KeywordResearchPage() {
  const [query, setQuery] = useState("ai seo automation");
  const [location, setLocation] = useState("US");
  const [language, setLanguage] = useState("en");
  const [rows, setRows] = useState<KeywordRow[]>(DEMO_KEYWORDS);
  const [loading, setLoading] = useState(false);
  const [savedKeys, setSavedKeys] = useState<Record<string, boolean>>({});
  const [isDemo, setIsDemo] = useState(true);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    const filteredDemo = DEMO_KEYWORDS.map((row, idx) =>
      idx === 0
        ? { ...row, keyword: query.trim().toLowerCase() }
        : row
    );
    const res = await fetchSeoWithFallback<KeywordRow[]>(
      `/api/seo/keywords?q=${encodeURIComponent(query)}&location=${location}&language=${language}`,
      filteredDemo
    );
    setRows(res.data);
    setIsDemo(!res.fromApi);
    setLoading(false);
  };

  const handleSave = async (row: KeywordRow) => {
    await mutateSeoWithFallback("/api/seo/saved-keywords", "POST", {
      ...row,
      location,
      language,
      tags: ["research"],
    }, { ok: true });
    setSavedKeys((prev) => ({ ...prev, [row.keyword]: true }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Keyword Research"
        subtitle="Uncover search volume, CPC, keyword difficulty, intent, and live SERP features."
        actions={isDemo ? <Badge tone="lilac">Demo Data</Badge> : <Badge tone="success">Live API</Badge>}
      />

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="cpki-card p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="md:col-span-6">
            <label className="mb-1 block text-[11px] font-medium text-[var(--muted-foreground)]">
              Seed Keyword or Topic
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted-foreground)]" />
              <input
                type="text"
                className="cpki-input pl-8"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. ai seo automation, rank tracker..."
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-[11px] font-medium text-[var(--muted-foreground)]">
              Location
            </label>
            <select
              className="cpki-select"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            >
              <option value="US">United States</option>
              <option value="GB">United Kingdom</option>
              <option value="IN">India</option>
              <option value="CA">Canada</option>
              <option value="DE">Germany</option>
              <option value="AU">Australia</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-[11px] font-medium text-[var(--muted-foreground)]">
              Language
            </label>
            <select
              className="cpki-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="de">German</option>
              <option value="fr">French</option>
            </select>
          </div>

          <div className="flex items-end md:col-span-2">
            <Button type="submit" className="w-full" disabled={loading}>
              <Sparkles className="h-3.5 w-3.5" />
              {loading ? "Analyzing..." : "Analyze"}
            </Button>
          </div>
        </div>
      </form>

      {/* Summary Strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="cpki-card p-3.5">
          <div className="text-[11px] text-[var(--muted-foreground)]">Keywords Found</div>
          <div className="mt-1 text-lg font-semibold tabular-nums">{rows.length}</div>
        </div>
        <div className="cpki-card p-3.5">
          <div className="text-[11px] text-[var(--muted-foreground)]">Total Monthly Volume</div>
          <div className="mt-1 text-lg font-semibold tabular-nums">
            {rows.reduce((sum, r) => sum + r.volume, 0).toLocaleString()}
          </div>
        </div>
        <div className="cpki-card p-3.5">
          <div className="text-[11px] text-[var(--muted-foreground)]">Avg. Keyword Difficulty</div>
          <div className="mt-1 text-lg font-semibold tabular-nums">
            {Math.round(rows.reduce((sum, r) => sum + r.kd, 0) / Math.max(rows.length, 1))}%
          </div>
        </div>
        <div className="cpki-card p-3.5">
          <div className="text-[11px] text-[var(--muted-foreground)]">Target Market</div>
          <div className="mt-1 flex items-center gap-1.5 text-sm font-semibold">
            <Globe className="h-3.5 w-3.5 text-[var(--primary-text)]" />
            {location} · {language.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="cpki-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="cpki-table">
            <thead>
              <tr>
                <th>Keyword</th>
                <th>Volume</th>
                <th>CPC (USD)</th>
                <th>KD %</th>
                <th>Search Intent</th>
                <th>SERP Features</th>
                <th>Trend</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isSaved = Boolean(savedKeys[row.keyword]);
                return (
                  <tr key={row.keyword}>
                    <td className="font-medium text-[var(--foreground)]">{row.keyword}</td>
                    <td className="tabular-nums">{row.volume.toLocaleString()}</td>
                    <td className="tabular-nums">${row.cpc.toFixed(2)}</td>
                    <td>
                      <Badge tone={getKdTone(row.kd)}>{row.kd}%</Badge>
                    </td>
                    <td>
                      <Badge tone={getIntentTone(row.intent)}>{row.intent}</Badge>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {row.serpFeatures.map((feat) => (
                          <Badge key={feat} variant="sm" tone="neutral">
                            {feat}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="text-xs font-medium text-[var(--success)] tabular-nums">{row.trend}</td>
                    <td className="text-right">
                      <Button
                        variant={isSaved ? "quiet" : "outline"}
                        size="xs"
                        onClick={() => handleSave(row)}
                        disabled={isSaved}
                      >
                        {isSaved ? <Check className="h-3 w-3" /> : <Bookmark className="h-3 w-3" />}
                        {isSaved ? "Saved" : "Save to project"}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
