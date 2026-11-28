"use client";

import React, { useEffect, useState } from "react";
import { Download, FileText, Plus, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { fetchSeoWithFallback, mutateSeoWithFallback } from "../_lib/seo-client";

interface ExecutiveReport {
  id: string;
  title: string;
  period: string;
  scope: "SEO + GEO" | "Technical Audit" | "GEO Visibility";
  createdAt: string;
  markdown: string;
}

const DEMO_REPORTS: ExecutiveReport[] = [
  {
    id: "rep-2026-11",
    title: "November 2026 SEO & GEO Executive Summary",
    period: "Nov 1 – Nov 26, 2026",
    scope: "SEO + GEO",
    createdAt: "2026-11-26",
    markdown: `# November 2026 SEO & GEO Executive Summary

## Key Highlights
- **Organic Traffic:** 48,290 visits (+14.2% MoM)
- **Keywords in Top 10:** 142 (+18 new Page-1 rankings)
- **Site Health Score:** 91% (3 errors remaining)
- **AI Visibility (GEO):** 68% brand mention rate across ChatGPT, Claude, Gemini & Perplexity

## Top Wins
1. \`/docs/seo-mcp\` reached **#1** for *"seo mcp server"* (1,900/mo).
2. Brand citations in Claude & ChatGPT increased by **+12%** after publishing structured comparison guides.

## Next 30-Day Priorities
- Fix 3 broken canonical tags identified in the latest crawl.
- Expand GEO comparison content targeting Perplexity citations.
- Build 15+ high-DR referring domains to \`/geo-tracking\`.`,
  },
  {
    id: "rep-2026-10",
    title: "October 2026 Technical & Content Audit Report",
    period: "Oct 1 – Oct 31, 2026",
    scope: "Technical Audit",
    createdAt: "2026-10-31",
    markdown: `# October 2026 Technical & Content Audit Report

## Crawl Summary
- **Pages Crawled:** 118
- **Health Score:** 86%
- **Core Web Vitals:** 92% URLs passing LCP < 2.5s

## Recommendations
- Compress hero assets on \`/pricing\` to reduce LCP by 420ms.
- Add FAQPage schema to top 10 commercial landing pages.`,
  },
];

export default function ReportsPage() {
  const [reports, setReports] = useState<ExecutiveReport[]>(DEMO_REPORTS);
  const [selectedId, setSelectedId] = useState<string>(DEMO_REPORTS[0].id);
  const [modalOpen, setModalOpen] = useState(false);
  const [reportTitle, setReportTitle] = useState("Q4 Executive SEO & GEO Brief");
  const [reportScope, setReportScope] = useState<ExecutiveReport["scope"]>("SEO + GEO");
  const [generating, setGenerating] = useState(false);
  const [isDemo, setIsDemo] = useState(true);

  useEffect(() => {
    void (async () => {
      const res = await fetchSeoWithFallback<ExecutiveReport[]>("/api/seo/reports", DEMO_REPORTS);
      setReports(res.data);
      if (res.data.length > 0) setSelectedId(res.data[0].id);
      setIsDemo(!res.fromApi);
    })();
  }, []);

  const activeReport = reports.find((r) => r.id === selectedId) ?? reports[0];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    const created: ExecutiveReport = {
      id: `rep-${Date.now()}`,
      title: reportTitle.trim() || "Executive SEO Report",
      period: "Last 30 Days",
      scope: reportScope,
      createdAt: new Date().toISOString().slice(0, 10),
      markdown: `# ${reportTitle.trim() || "Executive SEO Report"}

## Scope: ${reportScope}
- **Generated:** ${new Date().toLocaleDateString()}
- **Organic Traffic:** 48,290 (+14.2%)
- **AI Visibility Score:** 68%

## Action Items
- Continue monitoring Top 10 keyword velocity.
- Update Brand Context document with Q1 product positioning.`,
    };
    await mutateSeoWithFallback("/api/seo/reports", "POST", created, created);
    setReports((prev) => [created, ...prev]);
    setSelectedId(created.id);
    setGenerating(false);
    setModalOpen(false);
  };

  const handleDownloadMd = () => {
    if (!activeReport) return;
    const blob = new Blob([activeReport.markdown], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeReport.id}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Executive SEO &amp; GEO Reports"
        subtitle="AI-generated executive summaries combining organic search performance and LLM citation metrics."
        actions={
          <>
            {isDemo ? <Badge tone="lilac">Demo Data</Badge> : <Badge tone="success">Live API</Badge>}
            <Button variant="outline" size="sm" onClick={handleDownloadMd} disabled={!activeReport}>
              <Download className="h-3.5 w-3.5" />
              Export .md
            </Button>
            <Button size="sm" onClick={() => setModalOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              Generate Report
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Report List */}
        <div className="cpki-card p-3 space-y-2">
          <div className="px-2 py-1 text-xs font-semibold text-[var(--muted-foreground)]">
            Saved Reports ({reports.length})
          </div>
          {reports.map((rep) => {
            const active = rep.id === activeReport?.id;
            return (
              <button
                key={rep.id}
                type="button"
                onClick={() => setSelectedId(rep.id)}
                className={`w-full text-left rounded-[var(--radius-control)] border p-3 transition-colors ${
                  active
                    ? "border-[var(--primary)] bg-[var(--accent)]"
                    : "border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <FileText className="h-3.5 w-3.5 text-[var(--primary-text)] shrink-0" />
                  <Badge variant="sm" tone="neutral">{rep.scope}</Badge>
                </div>
                <div className="mt-1.5 text-xs font-semibold text-[var(--foreground)] line-clamp-2">
                  {rep.title}
                </div>
                <div className="mt-1 text-[11px] text-[var(--muted-foreground)]">
                  {rep.period} · {rep.createdAt}
                </div>
              </button>
            );
          })}
        </div>

        {/* Markdown Preview */}
        <div className="cpki-card p-5 lg:col-span-2">
          {activeReport ? (
            <>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
                <div>
                  <h2 className="text-sm font-semibold">{activeReport.title}</h2>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {activeReport.period} · Created {activeReport.createdAt}
                  </p>
                </div>
                <Badge tone="primary">Markdown Preview</Badge>
              </div>
              <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-[var(--foreground)] bg-[var(--muted)]/45 p-4 rounded-[var(--radius-control)] border border-[var(--border)] overflow-x-auto">
                {activeReport.markdown}
              </pre>
            </>
          ) : null}
        </div>
      </div>

      {/* Generate Report Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Generate AI Executive Report">
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium">Report Title</label>
            <input
              type="text"
              required
              className="cpki-input"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Report Scope</label>
            <select
              className="cpki-select"
              value={reportScope}
              onChange={(e) => setReportScope(e.target.value as ExecutiveReport["scope"])}
            >
              <option value="SEO + GEO">SEO + GEO Executive Summary</option>
              <option value="Technical Audit">Technical Audit Breakdown</option>
              <option value="GEO Visibility">GEO AI Visibility Report</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={generating}>
              <Sparkles className="h-3.5 w-3.5" />
              {generating ? "Generating..." : "Generate Report"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
