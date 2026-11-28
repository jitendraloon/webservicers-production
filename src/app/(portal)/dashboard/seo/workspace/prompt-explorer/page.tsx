"use client";

import React, { useEffect, useState } from "react";
import { Bookmark, ExternalLink, Search, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { fetchSeoWithFallback, mutateSeoWithFallback } from "../_lib/seo-client";

interface TrendingPrompt {
  id: string;
  topic: string;
  prompt: string;
  monthlyEstVolume: number;
  growth: string;
  topCitedDomains: string[];
  engines: string[];
}

const DEMO_EXPLORER: TrendingPrompt[] = [
  {
    id: "pe-1",
    topic: "AI SEO",
    prompt: "How do I track brand mentions in ChatGPT and Perplexity?",
    monthlyEstVolume: 18400,
    growth: "+142%",
    topCitedDomains: ["webservicers.io", "searchengineland.com", "ahrefs.com"],
    engines: ["ChatGPT", "Perplexity", "Gemini"],
  },
  {
    id: "pe-2",
    topic: "MCP & Agents",
    prompt: "Best MCP server for connecting Claude to SEO analytics",
    monthlyEstVolume: 6200,
    growth: "+210%",
    topCitedDomains: ["github.com", "webservicers.io", "modelcontextprotocol.io"],
    engines: ["Claude", "ChatGPT"],
  },
  {
    id: "pe-3",
    topic: "Technical SEO",
    prompt: "Core Web Vitals checklist for Next.js App Router sites",
    monthlyEstVolume: 14100,
    growth: "+38%",
    topCitedDomains: ["nextjs.org", "web.dev", "vercel.com"],
    engines: ["Gemini", "ChatGPT", "Claude"],
  },
  {
    id: "pe-4",
    topic: "Local SEO",
    prompt: "How to improve Google Business Profile local pack rankings",
    monthlyEstVolume: 22900,
    growth: "+24%",
    topCitedDomains: ["whitespark.ca", "brightlocal.com", "moz.com"],
    engines: ["Gemini", "Perplexity"],
  },
];

const TOPICS = ["All", "AI SEO", "MCP & Agents", "Technical SEO", "Local SEO"];

export default function PromptExplorerPage() {
  const [prompts, setPrompts] = useState<TrendingPrompt[]>(DEMO_EXPLORER);
  const [topic, setTopic] = useState("All");
  const [query, setQuery] = useState("");
  const [trackedIds, setTrackedIds] = useState<Record<string, boolean>>({});
  const [isDemo, setIsDemo] = useState(true);

  useEffect(() => {
    void (async () => {
      const res = await fetchSeoWithFallback<TrendingPrompt[]>(
        "/api/seo/prompt-explorer",
        DEMO_EXPLORER
      );
      setPrompts(res.data);
      setIsDemo(!res.fromApi);
    })();
  }, []);

  const filtered = prompts.filter((p) => {
    const matchTopic = topic === "All" || p.topic === topic;
    const matchQuery =
      !query.trim() || p.prompt.toLowerCase().includes(query.toLowerCase());
    return matchTopic && matchQuery;
  });

  const handleTrackPrompt = async (item: TrendingPrompt) => {
    await mutateSeoWithFallback("/api/seo/prompt-tracking", "POST", item, { ok: true });
    setTrackedIds((prev) => ({ ...prev, [item.id]: true }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="GEO Prompt Explorer"
        subtitle="Discover trending AI search prompts and see which domains earn the most LLM citations."
        actions={isDemo ? <Badge tone="lilac">Demo Data</Badge> : <Badge tone="success">Live API</Badge>}
      />

      {/* Filter Bar */}
      <div className="cpki-card p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            type="text"
            className="cpki-input pl-8"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search trending prompts..."
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {TOPICS.map((t) => (
            <Button
              key={t}
              size="xs"
              variant={topic === t ? "primary" : "outline"}
              onClick={() => setTopic(t)}
            >
              {t}
            </Button>
          ))}
        </div>
      </div>

      {/* Prompt Cards */}
      <div className="grid grid-cols-1 gap-4">
        {filtered.map((item) => {
          const isTracked = Boolean(trackedIds[item.id]);
          return (
            <div key={item.id} className="cpki-card p-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="primary">{item.topic}</Badge>
                  <Badge tone="success">{item.growth} trend</Badge>
                  <span className="text-xs text-[var(--muted-foreground)] tabular-nums">
                    ~{item.monthlyEstVolume.toLocaleString()} monthly queries
                  </span>
                </div>
                <p className="text-sm font-semibold text-[var(--foreground)] flex items-start gap-2">
                  <Sparkles className="h-4 w-4 shrink-0 text-[var(--primary-text)] mt-0.5" />
                  <span>{item.prompt}</span>
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted-foreground)]">
                  <span>Top cited:</span>
                  {item.topCitedDomains.map((d) => (
                    <span
                      key={d}
                      className="inline-flex items-center gap-1 rounded bg-[var(--muted)] px-2 py-0.5 font-mono text-[11px] text-[var(--foreground)]"
                    >
                      {d}
                      <ExternalLink className="h-2.5 w-2.5" />
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
                <div className="flex flex-wrap gap-1">
                  {item.engines.map((eng) => (
                    <Badge key={eng} variant="sm" tone="lilac">
                      {eng}
                    </Badge>
                  ))}
                </div>
                <Button
                  size="sm"
                  variant={isTracked ? "quiet" : "outline"}
                  onClick={() => handleTrackPrompt(item)}
                  disabled={isTracked}
                >
                  <Bookmark className="h-3.5 w-3.5" />
                  {isTracked ? "Tracking Weekly" : "Track Prompt"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
