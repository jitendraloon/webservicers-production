"use client";

import React, { useState } from "react";
import {
  Bookmark,
  Check,
  Copy,
  FileText,
  HelpCircle,
  ListTree,
  Sparkles,
  Tag,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";

type SearchIntent =
  | "Informational"
  | "Commercial"
  | "Transactional"
  | "Navigational";

interface OutlineItem {
  level: "H1" | "H2" | "H3";
  text: string;
}

interface NlpTerm {
  term: string;
  targetRange: string;
}

interface ContentBrief {
  id: string;
  keyword: string;
  audience: string;
  intent: SearchIntent;
  recommendedWordCount: number;
  readingLevel: string;
  outline: OutlineItem[];
  nlpTerms: NlpTerm[];
  paaQuestions: string[];
  createdAt: string;
}

function buildBrief(
  keyword: string,
  audience: string,
  intent: SearchIntent
): ContentBrief {
  const kw = keyword.trim() || "AI SEO Automation";
  const titleKw = kw.replace(/\b\w/g, (c) => c.toUpperCase());
  const aud = audience.trim() || "Growth & Marketing Teams";

  const wordCountMap: Record<SearchIntent, number> = {
    Informational: 2200,
    Commercial: 1850,
    Transactional: 1200,
    Navigational: 950,
  };

  return {
    id: `brief-${Date.now()}`,
    keyword: kw,
    audience: aud,
    intent,
    recommendedWordCount: wordCountMap[intent],
    readingLevel: "Grade 8–10 (Clear & Actionable)",
    outline: [
      { level: "H1", text: `${titleKw}: Complete Playbook for ${aud}` },
      { level: "H2", text: `What Is ${titleKw} and Why It Matters in 2026` },
      { level: "H3", text: "Key business outcomes and organic traffic impact" },
      { level: "H2", text: `Core Components of a High-Performing ${titleKw} Workflow` },
      { level: "H3", text: "1. Intent-first keyword clustering" },
      { level: "H3", text: "2. Structured briefs and semantic coverage" },
      { level: "H3", text: "3. Continuous on-page and SERP monitoring" },
      { level: "H2", text: `Step-by-Step Implementation Guide for ${aud}` },
      { level: "H2", text: "Common Pitfalls to Avoid & Benchmarks" },
      { level: "H2", text: "Frequently Asked Questions" },
    ],
    nlpTerms: [
      { term: kw.toLowerCase(), targetRange: "6–10x" },
      { term: "search intent", targetRange: "3–5x" },
      { term: "organic traffic", targetRange: "4–7x" },
      { term: "serp features", targetRange: "2–4x" },
      { term: "semantic keywords", targetRange: "2–4x" },
      { term: "internal linking", targetRange: "3–5x" },
      { term: "content optimization", targetRange: "3–6x" },
      { term: "conversion rate", targetRange: "2–3x" },
    ],
    paaQuestions: [
      `How does ${kw.toLowerCase()} improve organic search rankings?`,
      `What is the ideal workflow for ${kw.toLowerCase()} for ${aud.toLowerCase()}?`,
      `How long does it take to see ROI from ${kw.toLowerCase()}?`,
      `What metrics should you track when scaling ${kw.toLowerCase()}?`,
    ],
    createdAt: "Just now",
  };
}

const INITIAL_SAVED: ContentBrief[] = [
  {
    ...buildBrief("ai seo automation", "SaaS Marketing Leads", "Commercial"),
    id: "brief-1",
    createdAt: "Today, 10:15 AM",
  },
  {
    ...buildBrief("technical seo audit checklist", "Web Developers", "Informational"),
    id: "brief-2",
    createdAt: "Yesterday",
  },
];

export default function ContentBriefsPage() {
  const [keyword, setKeyword] = useState("ai seo automation");
  const [audience, setAudience] = useState("SaaS Marketing Leads");
  const [intent, setIntent] = useState<SearchIntent>("Commercial");
  const [activeBrief, setActiveBrief] = useState<ContentBrief>(INITIAL_SAVED[0]);
  const [savedBriefs, setSavedBriefs] = useState<ContentBrief[]>(INITIAL_SAVED);
  const [copiedOutline, setCopiedOutline] = useState(false);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    const generated = buildBrief(keyword, audience, intent);
    setActiveBrief(generated);
  };

  const handleSaveBrief = () => {
    setSavedBriefs((prev) => {
      const exists = prev.some((b) => b.id === activeBrief.id);
      if (exists) return prev;
      return [{ ...activeBrief, createdAt: "Saved just now" }, ...prev];
    });
  };

  const handleDeleteBrief = (id: string) => {
    setSavedBriefs((prev) => prev.filter((b) => b.id !== id));
  };

  const handleCopyOutline = async () => {
    const md = activeBrief.outline
      .map((item) => {
        const prefix = item.level === "H1" ? "#" : item.level === "H2" ? "##" : "###";
        return `${prefix} ${item.text}`;
      })
      .join("\n");
    try {
      await navigator.clipboard.writeText(md);
      setCopiedOutline(true);
      setTimeout(() => setCopiedOutline(false), 1800);
    } catch {
      // Ignore clipboard errors
    }
  };

  const isSaved = savedBriefs.some((b) => b.id === activeBrief.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Content Briefs"
        subtitle="Generate structured SEO briefs with H1/H2/H3 outlines, NLP terms, and People Also Ask questions."
        actions={
          <Button
            variant={isSaved ? "outline" : "primary"}
            size="sm"
            onClick={handleSaveBrief}
          >
            {isSaved ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Saved in Library
              </>
            ) : (
              <>
                <Bookmark className="h-3.5 w-3.5" />
                Save Brief
              </>
            )}
          </Button>
        }
      />

      {/* Generator Form */}
      <Card className="p-5">
        <form
          onSubmit={handleGenerate}
          className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-end"
        >
          <div className="md:col-span-4">
            <Input
              label="Target Keyword"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g. ai seo automation"
            />
          </div>
          <div className="md:col-span-4">
            <Input
              label="Target Audience"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="e.g. B2B SaaS Founders"
            />
          </div>
          <div className="md:col-span-2">
            <Select
              label="Search Intent"
              value={intent}
              onChange={(e) => setIntent(e.target.value as SearchIntent)}
            >
              <option value="Informational">Informational</option>
              <option value="Commercial">Commercial</option>
              <option value="Transactional">Transactional</option>
              <option value="Navigational">Navigational</option>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Button type="submit" className="w-full">
              <Sparkles className="h-3.5 w-3.5" />
              Generate Brief
            </Button>
          </div>
        </form>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Main Brief Output */}
        <div className="space-y-4 lg:col-span-8">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="p-4">
              <p className="text-xs text-[var(--muted-foreground)]">
                Recommended Length
              </p>
              <p className="mt-1 text-xl font-semibold text-[var(--foreground)]">
                {activeBrief.recommendedWordCount.toLocaleString()} words
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-[var(--muted-foreground)]">Search Intent</p>
              <div className="mt-1.5">
                <Badge tone="primary">{activeBrief.intent}</Badge>
              </div>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-[var(--muted-foreground)]">Readability</p>
              <p className="mt-1 text-sm font-medium text-[var(--foreground)]">
                {activeBrief.readingLevel}
              </p>
            </Card>
          </div>

          {/* H1/H2/H3 Outline */}
          <Card className="space-y-3 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListTree className="h-4 w-4 text-[var(--primary)]" />
                <h2 className="text-sm font-semibold text-[var(--foreground)]">
                  Recommended H1 / H2 / H3 Outline
                </h2>
              </div>
              <Button variant="outline" size="xs" onClick={handleCopyOutline}>
                {copiedOutline ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
                {copiedOutline ? "Copied" : "Copy Markdown"}
              </Button>
            </div>

            <div className="space-y-2">
              {activeBrief.outline.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 ${
                    item.level === "H3" ? "ml-6" : item.level === "H2" ? "ml-2" : ""
                  }`}
                >
                  <Badge
                    tone={
                      item.level === "H1"
                        ? "primary"
                        : item.level === "H2"
                          ? "lilac"
                          : "neutral"
                    }
                    variant="sm"
                  >
                    {item.level}
                  </Badge>
                  <span className="text-xs font-medium text-[var(--foreground)]">
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* NLP Terms + PAA */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card className="space-y-3 p-5">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-[var(--primary)]" />
                <h2 className="text-sm font-semibold text-[var(--foreground)]">
                  NLP & Semantic Terms
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {activeBrief.nlpTerms.map((item) => (
                  <div
                    key={item.term}
                    className="flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--secondary)] px-2.5 py-1 text-xs"
                  >
                    <span className="font-medium text-[var(--foreground)]">
                      {item.term}
                    </span>
                    <span className="text-[11px] text-[var(--muted-foreground)]">
                      ({item.targetRange})
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="space-y-3 p-5">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-[var(--primary)]" />
                <h2 className="text-sm font-semibold text-[var(--foreground)]">
                  People Also Ask
                </h2>
              </div>
              <ul className="space-y-2">
                {activeBrief.paaQuestions.map((q, idx) => (
                  <li
                    key={idx}
                    className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs text-[var(--foreground)]"
                  >
                    {q}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>

        {/* Saved Briefs Sidebar */}
        <div className="lg:col-span-4">
          <Card className="space-y-3 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[var(--primary)]" />
                <h2 className="text-sm font-semibold text-[var(--foreground)]">
                  Saved Briefs
                </h2>
              </div>
              <Badge tone="neutral" variant="sm">
                {savedBriefs.length}
              </Badge>
            </div>

            {savedBriefs.length === 0 ? (
              <p className="py-6 text-center text-xs text-[var(--muted-foreground)]">
                No saved briefs yet. Generate a brief and click Save Brief.
              </p>
            ) : (
              <div className="space-y-2.5">
                {savedBriefs.map((brief) => {
                  const isActive = brief.id === activeBrief.id;
                  return (
                    <div
                      key={brief.id}
                      onClick={() => {
                        setActiveBrief(brief);
                        setKeyword(brief.keyword);
                        setAudience(brief.audience);
                        setIntent(brief.intent);
                      }}
                      className={`cursor-pointer rounded-lg border p-3 transition ${
                        isActive
                          ? "border-[var(--primary)] bg-[var(--accent)]"
                          : "border-[var(--border)] bg-[var(--background)] hover:bg-[var(--secondary)]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-[var(--foreground)]">
                            {brief.keyword}
                          </p>
                          <p className="mt-0.5 truncate text-[11px] text-[var(--muted-foreground)]">
                            {brief.audience} · {brief.recommendedWordCount}w
                          </p>
                        </div>
                        <button
                          type="button"
                          aria-label="Delete brief"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteBrief(brief.id);
                          }}
                          className="rounded p-1 text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--destructive)]"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <Badge tone="neutral" variant="sm">
                          {brief.intent}
                        </Badge>
                        <span className="text-[10px] text-[var(--muted-foreground)]">
                          {brief.createdAt}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
