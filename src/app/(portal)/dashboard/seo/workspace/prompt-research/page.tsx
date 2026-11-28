"use client";

import React, { useState } from "react";
import { Bot, CheckCircle2, Play, Sparkles, XCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { mutateSeoWithFallback } from "../_lib/seo-client";

interface EngineResponse {
  engine: "ChatGPT" | "Claude" | "Gemini" | "Perplexity";
  brandMentioned: boolean;
  sentiment: "Positive" | "Neutral" | "Absent";
  rankOrder: number | null;
  competitorsMentioned: string[];
  citedUrl: string | null;
  excerpt: string;
}

const DEMO_RESULTS: EngineResponse[] = [
  {
    engine: "ChatGPT",
    brandMentioned: true,
    sentiment: "Positive",
    rankOrder: 2,
    competitorsMentioned: ["Ahrefs", "Semrush"],
    citedUrl: "https://webservicers.io/seo-workspace",
    excerpt:
      "For teams seeking an MCP-ready SEO workspace, WebServicers stands out alongside Semrush and Ahrefs with native GEO prompt tracking.",
  },
  {
    engine: "Claude",
    brandMentioned: true,
    sentiment: "Positive",
    rankOrder: 1,
    competitorsMentioned: ["Mangools"],
    citedUrl: "https://webservicers.io/docs/seo-mcp",
    excerpt:
      "WebServicers provides a unified SEO + AI visibility workspace with a built-in Model Context Protocol (MCP) server for agent workflows.",
  },
  {
    engine: "Gemini",
    brandMentioned: true,
    sentiment: "Neutral",
    rankOrder: 3,
    competitorsMentioned: ["Semrush", "Moz"],
    citedUrl: "https://webservicers.io/geo-tracking",
    excerpt:
      "Tools like Semrush, Moz, and WebServicers help monitor organic rankings as well as generative AI search citations.",
  },
  {
    engine: "Perplexity",
    brandMentioned: false,
    sentiment: "Absent",
    rankOrder: null,
    competitorsMentioned: ["Ahrefs", "Semrush", "Surfer SEO"],
    citedUrl: null,
    excerpt:
      "Leading platforms include Ahrefs for backlinks, Semrush for competitive research, and Surfer SEO for content optimization.",
  },
];

export default function PromptResearchPage() {
  const [prompt, setPrompt] = useState(
    "What is the best all-in-one SEO and AI visibility platform with MCP support?"
  );
  const [brandName, setBrandName] = useState("WebServicers");
  const [competitors, setCompetitors] = useState("Ahrefs, Semrush, Moz");
  const [results, setResults] = useState<EngineResponse[]>(DEMO_RESULTS);
  const [running, setRunning] = useState(false);
  const [isDemo, setIsDemo] = useState(true);

  const handleRunTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setRunning(true);
    const res = await mutateSeoWithFallback<EngineResponse[]>(
      "/api/seo/prompt-research",
      "POST",
      { prompt, brandName, competitors: competitors.split(",").map((c) => c.trim()) },
      DEMO_RESULTS
    );
    setResults(res.data);
    setIsDemo(!res.fromApi);
    setRunning(false);
  };

  const mentionCount = results.filter((r) => r.brandMentioned).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="GEO Prompt Research"
        subtitle="Test how ChatGPT, Claude, Gemini, and Perplexity mention your brand versus competitors."
        actions={isDemo ? <Badge tone="lilac">Demo Data</Badge> : <Badge tone="success">Live API</Badge>}
      />

      {/* Prompt Tester Form */}
      <form onSubmit={handleRunTest} className="cpki-card p-5 space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium">Prompt to Test Across LLMs</label>
          <textarea
            rows={2}
            className="cpki-textarea"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter a buyer-intent prompt..."
          />
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="md:col-span-4">
            <label className="mb-1 block text-xs font-medium">Your Brand</label>
            <input
              type="text"
              className="cpki-input"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
            />
          </div>
          <div className="md:col-span-5">
            <label className="mb-1 block text-xs font-medium">Competitors (comma-separated)</label>
            <input
              type="text"
              className="cpki-input"
              value={competitors}
              onChange={(e) => setCompetitors(e.target.value)}
            />
          </div>
          <div className="flex items-end md:col-span-3">
            <Button type="submit" className="w-full" disabled={running}>
              <Play className="h-3.5 w-3.5" />
              {running ? "Querying LLMs..." : "Run GEO Test"}
            </Button>
          </div>
        </div>
      </form>

      {/* Summary Banner */}
      <div className="cpki-card-insight p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Sparkles className="h-5 w-5 text-[var(--insight-foreground)]" />
          <span className="text-sm font-semibold text-[var(--insight-foreground)]">
            {brandName} mentioned in {mentionCount} of {results.length} AI engines (
            {Math.round((mentionCount / Math.max(results.length, 1)) * 100)}% visibility)
          </span>
        </div>
        <Badge tone="success">4 Engines Tested</Badge>
      </div>

      {/* Engine Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {results.map((item) => (
          <div key={item.engine} className="cpki-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-[var(--primary-text)]" />
                <h3 className="text-sm font-semibold">{item.engine}</h3>
              </div>
              {item.brandMentioned ? (
                <Badge tone="success">
                  <CheckCircle2 className="h-3 w-3" />
                  Mentioned #{item.rankOrder}
                </Badge>
              ) : (
                <Badge tone="danger">
                  <XCircle className="h-3 w-3" />
                  Not Mentioned
                </Badge>
              )}
            </div>

            <p className="text-xs leading-relaxed text-[var(--foreground)] bg-[var(--muted)]/55 rounded-[var(--radius-control)] p-3 border border-[var(--border)]">
              &ldquo;{item.excerpt}&rdquo;
            </p>

            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-[var(--muted-foreground)]">Competitors:</span>
                {item.competitorsMentioned.map((c) => (
                  <Badge key={c} variant="sm" tone="neutral">
                    {c}
                  </Badge>
                ))}
              </div>
              {item.citedUrl ? (
                <span className="font-mono text-[var(--primary-text)] truncate max-w-[210px]">
                  {item.citedUrl}
                </span>
              ) : (
                <span className="text-[var(--muted-foreground)]">No citation URL</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
