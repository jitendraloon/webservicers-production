"use client";

import React, { useEffect, useState } from "react";
import { Check, FileCode2, Save } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { fetchSeoWithFallback, mutateSeoWithFallback } from "../_lib/seo-client";

interface BrandContextDoc {
  businessOverview: string;
  currentGoal: string;
  positioning: string;
  competitors: string;
  keyPages: string;
  updatedAt: string;
}

const DEMO_CONTEXT: BrandContextDoc = {
  businessOverview:
    "WebServicers is an AI-native SEO, GEO (Generative Engine Optimization), and digital growth platform built for modern SaaS and agency teams.",
  currentGoal:
    "Increase Page-1 commercial keyword rankings by 25% and achieve >75% brand mention rate across ChatGPT, Claude, Gemini, and Perplexity in Q4.",
  positioning:
    "Unlike legacy SEO suites, WebServicers combines technical crawling, rank tracking, and LLM citation monitoring with a native MCP server for autonomous AI agents.",
  competitors: "Ahrefs (ahrefs.com), Semrush (semrush.com), Mangools (mangools.com), BrightLocal (brightlocal.com)",
  keyPages: "/seo-workspace\n/docs/seo-mcp\n/geo-tracking\n/site-audit\n/pricing",
  updatedAt: "2026-11-25 14:20",
};

export default function BrandContextPage() {
  const [doc, setDoc] = useState<BrandContextDoc>(DEMO_CONTEXT);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isDemo, setIsDemo] = useState(true);

  useEffect(() => {
    void (async () => {
      const res = await fetchSeoWithFallback<BrandContextDoc>("/api/seo/context", DEMO_CONTEXT);
      setDoc(res.data);
      setIsDemo(!res.fromApi);
    })();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const nextDoc = { ...doc, updatedAt: new Date().toLocaleString() };
    await mutateSeoWithFallback("/api/seo/context", "PUT", nextDoc, nextDoc);
    setDoc(nextDoc);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Brand Context Document"
        subtitle="Structured business context read by AI report generators and your SEO MCP agent."
        actions={
          <>
            {isDemo ? <Badge tone="lilac">Demo Data</Badge> : <Badge tone="success">Live API</Badge>}
            <Badge tone="neutral">Updated: {doc.updatedAt}</Badge>
          </>
        }
      />

      <div className="cpki-card-learning p-4 flex items-start gap-3">
        <FileCode2 className="h-5 w-5 text-[var(--learning-foreground)] shrink-0 mt-0.5" />
        <p className="text-xs leading-relaxed text-[var(--learning-foreground)]">
          This Brand Context is automatically injected into MCP tool calls (<code>get_brand_context</code>) and
          AI Executive Reports so Claude, Cursor, and CopilotKit understand your positioning, competitors, and priority URLs.
        </p>
      </div>

      <form onSubmit={handleSave} className="cpki-card p-5 space-y-5">
        <div>
          <label className="mb-1.5 block text-xs font-semibold">Business Overview</label>
          <textarea
            rows={3}
            className="cpki-textarea"
            value={doc.businessOverview}
            onChange={(e) => setDoc({ ...doc, businessOverview: e.target.value })}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold">Current Quarter Goal</label>
          <textarea
            rows={2}
            className="cpki-textarea"
            value={doc.currentGoal}
            onChange={(e) => setDoc({ ...doc, currentGoal: e.target.value })}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold">Market Positioning &amp; Differentiators</label>
          <textarea
            rows={3}
            className="cpki-textarea"
            value={doc.positioning}
            onChange={(e) => setDoc({ ...doc, positioning: e.target.value })}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold">Primary Competitors</label>
          <input
            type="text"
            className="cpki-input"
            value={doc.competitors}
            onChange={(e) => setDoc({ ...doc, competitors: e.target.value })}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold">Key Priority Pages (one per line)</label>
          <textarea
            rows={4}
            className="cpki-textarea font-mono"
            value={doc.keyPages}
            onChange={(e) => setDoc({ ...doc, keyPages: e.target.value })}
          />
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] pt-4">
          {saved && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--success)]">
              <Check className="h-3.5 w-3.5" /> Saved to workspace
            </span>
          )}
          <Button type="submit" disabled={saving}>
            <Save className="h-3.5 w-3.5" />
            {saving ? "Saving..." : "Save Brand Context"}
          </Button>
        </div>
      </form>
    </div>
  );
}
