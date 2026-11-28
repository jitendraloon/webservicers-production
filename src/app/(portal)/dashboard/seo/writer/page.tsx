"use client";

import React, { useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  Circle,
  Copy,
  Download,
  Eye,
  FileEdit,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";

type ToneOption =
  | "Professional"
  | "Conversational"
  | "Authoritative"
  | "Technical"
  | "Persuasive";

function generateDraftMarkdown(
  topic: string,
  keywordsRaw: string,
  tone: ToneOption
): string {
  const cleanTopic = topic.trim() || "AI SEO Automation Playbook";
  const keywords = keywordsRaw
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  const primary = keywords[0] || "ai seo automation";
  const secondary = keywords[1] || "content optimization";
  const tertiary = keywords[2] || "organic traffic";

  const introByTone: Record<ToneOption, string> = {
    Professional: `Modern search teams rely on **${primary}** to scale research, structured content briefs, and technical execution without sacrificing editorial quality.`,
    Conversational: `If you've ever felt buried under spreadsheets, **${primary}** is the shortcut that lets your team focus on strategy while automating the busywork.`,
    Authoritative: `Organizations that lead competitive SERPs treat **${primary}** as core infrastructure for repeatable **${secondary}** and compounding **${tertiary}**.`,
    Technical: `Implementing **${primary}** requires connecting keyword clustering pipelines, semantic entity scoring, and automated schema validation into a single workflow.`,
    Persuasive: `Ready to turn search into your highest-ROI acquisition channel? **${primary}** helps teams publish faster, rank higher, and capture more **${tertiary}**.`,
  };

  return `# ${cleanTopic}

${introByTone[tone]}

## Why ${primary} Matters Now

Search engines and AI answer engines reward pages that demonstrate clear topical depth, strong internal linking, and clean on-page structure. Pairing **${primary}** with disciplined **${secondary}** ensures every article answers real user intent.

## 3-Step Execution Framework

1. **Map Search Intent First**: Group queries by informational, commercial, and transactional intent before drafting.
2. **Build Semantic Coverage**: Include supporting entities and People Also Ask questions naturally across H2 and H3 sections.
3. **Measure & Iterate**: Track impressions, click-through rate, and **${tertiary}** growth every 14 days.

## Key Benchmarks to Track

- **Title & Meta CTR**: Aim for 45–60 characters on titles and 140–160 characters on descriptions.
- **Content Depth**: Match or exceed the semantic breadth of top-5 ranking pages.
- **Internal Links**: Add 3–5 contextual internal links pointing to and from pillar pages.

## Conclusion

When applied consistently, **${primary}** transforms content production from guesswork into a predictable engine for **${tertiary}**.`;
}

function renderSimpleMarkdown(md: string): React.ReactNode {
  const lines = md.split("\n");
  return lines.map((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={idx} className="h-2" />;
    if (trimmed.startsWith("### ")) {
      return (
        <h3
          key={idx}
          className="mt-4 mb-1.5 text-sm font-semibold text-[var(--foreground)]"
        >
          {formatInline(trimmed.slice(4))}
        </h3>
      );
    }
    if (trimmed.startsWith("## ")) {
      return (
        <h2
          key={idx}
          className="mt-5 mb-2 text-base font-semibold text-[var(--foreground)]"
        >
          {formatInline(trimmed.slice(3))}
        </h2>
      );
    }
    if (trimmed.startsWith("# ")) {
      return (
        <h1
          key={idx}
          className="mb-3 text-xl font-bold text-[var(--foreground)]"
        >
          {formatInline(trimmed.slice(2))}
        </h1>
      );
    }
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      return (
        <li
          key={idx}
          className="ml-5 list-disc text-sm leading-relaxed text-[var(--foreground)]"
        >
          {formatInline(trimmed.slice(2))}
        </li>
      );
    }
    if (/^\d+\.\s/.test(trimmed)) {
      return (
        <li
          key={idx}
          className="ml-5 list-decimal text-sm leading-relaxed text-[var(--foreground)]"
        >
          {formatInline(trimmed.replace(/^\d+\.\s/, ""))}
        </li>
      );
    }
    return (
      <p key={idx} className="text-sm leading-relaxed text-[var(--foreground)]">
        {formatInline(trimmed)}
      </p>
    );
  });
}

function formatInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-semibold">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  );
}

export default function SeoWriterPage() {
  const [topic, setTopic] = useState("How to Build an AI SEO Automation Workflow");
  const [targetKeywords, setTargetKeywords] = useState(
    "ai seo automation, content optimization, organic traffic"
  );
  const [tone, setTone] = useState<ToneOption>("Professional");
  const [markdown, setMarkdown] = useState(() =>
    generateDraftMarkdown(
      "How to Build an AI SEO Automation Workflow",
      "ai seo automation, content optimization, organic traffic",
      "Professional"
    )
  );
  const [viewMode, setViewMode] = useState<"split" | "edit" | "preview">("split");
  const [copied, setCopied] = useState(false);

  const stats = useMemo(() => {
    const words = markdown.trim() ? markdown.trim().split(/\s+/).length : 0;
    const chars = markdown.length;
    const headings = (markdown.match(/^#{1,3}\s+/gm) || []).length;
    const readingMinutes = Math.max(1, Math.ceil(words / 200));
    return { words, chars, headings, readingMinutes };
  }, [markdown]);

  const keywordChecks = useMemo(() => {
    const list = targetKeywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
    const lower = markdown.toLowerCase();
    const firstLine = (markdown.split("\n")[0] || "").toLowerCase();

    return list.map((kw) => {
      const escaped = kw.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const matches = lower.match(new RegExp(escaped, "g"));
      const count = matches ? matches.length : 0;
      const inH1 = firstLine.includes(kw.toLowerCase());
      return { keyword: kw, count, inH1 };
    });
  }, [targetKeywords, markdown]);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    setMarkdown(generateDraftMarkdown(topic, targetKeywords, tone));
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Ignore clipboard errors
    }
  };

  const handleDownload = () => {
    const slug =
      topic
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || "seo-article";
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI SEO Writer"
        subtitle="Draft and refine search-optimized Markdown articles with live word count and keyword coverage."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy Markdown"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-3.5 w-3.5" />
              Export .md
            </Button>
          </div>
        }
      />

      {/* Prompt Controls */}
      <Card className="p-5">
        <form
          onSubmit={handleGenerate}
          className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-end"
        >
          <div className="md:col-span-4">
            <Input
              label="Article Topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. How to Build an AI SEO Automation Workflow"
            />
          </div>
          <div className="md:col-span-4">
            <Input
              label="Target Keywords (comma-separated)"
              value={targetKeywords}
              onChange={(e) => setTargetKeywords(e.target.value)}
              placeholder="keyword 1, keyword 2, keyword 3"
            />
          </div>
          <div className="md:col-span-2">
            <Select
              label="Tone"
              value={tone}
              onChange={(e) => setTone(e.target.value as ToneOption)}
            >
              <option value="Professional">Professional</option>
              <option value="Conversational">Conversational</option>
              <option value="Authoritative">Authoritative</option>
              <option value="Technical">Technical</option>
              <option value="Persuasive">Persuasive</option>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Button type="submit" className="w-full">
              <Sparkles className="h-3.5 w-3.5" />
              Generate Draft
            </Button>
          </div>
        </form>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Editor / Preview */}
        <div className="space-y-3 lg:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge tone="neutral" variant="sm">
                {stats.words} words
              </Badge>
              <Badge tone="neutral" variant="sm">
                {stats.headings} headings
              </Badge>
              <Badge tone="neutral" variant="sm">
                ~{stats.readingMinutes} min read
              </Badge>
            </div>

            <div className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--secondary)] p-0.5">
              {(
                [
                  { id: "split", label: "Split", icon: FileEdit },
                  { id: "edit", label: "Markdown", icon: FileEdit },
                  { id: "preview", label: "Preview", icon: Eye },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setViewMode(tab.id)}
                  className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition ${
                    viewMode === tab.id
                      ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div
            className={`grid grid-cols-1 gap-4 ${
              viewMode === "split" ? "md:grid-cols-2" : ""
            }`}
          >
            {viewMode !== "preview" && (
              <Card className="p-4">
                <Textarea
                  aria-label="Markdown article draft"
                  rows={20}
                  value={markdown}
                  onChange={(e) => setMarkdown(e.target.value)}
                  className="font-mono text-xs leading-relaxed"
                />
              </Card>
            )}

            {viewMode !== "edit" && (
              <Card className="max-h-[520px] overflow-y-auto p-5">
                {markdown.trim() ? (
                  <article className="space-y-1">
                    {renderSimpleMarkdown(markdown)}
                  </article>
                ) : (
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Start typing or generate a draft to preview formatted Markdown.
                  </p>
                )}
              </Card>
            )}
          </div>
        </div>

        {/* Keyword Checklist Sidebar */}
        <div className="space-y-4 lg:col-span-4">
          <Card className="space-y-3 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--foreground)]">
                Keyword Checklist
              </h2>
              <Badge tone="primary" variant="sm">
                {keywordChecks.filter((k) => k.count > 0).length} /{" "}
                {keywordChecks.length} used
              </Badge>
            </div>

            {keywordChecks.length === 0 ? (
              <p className="text-xs text-[var(--muted-foreground)]">
                Add target keywords above to track coverage in real time.
              </p>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {keywordChecks.map((item) => (
                  <div
                    key={item.keyword}
                    className="flex items-center justify-between gap-2 py-2.5 first:pt-1 last:pb-1"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {item.count > 0 ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--success)]" />
                      ) : (
                        <Circle className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-[var(--foreground)]">
                          {item.keyword}
                        </p>
                        <p className="text-[11px] text-[var(--muted-foreground)]">
                          {item.inH1 ? "Present in H1" : "Not in H1"}
                        </p>
                      </div>
                    </div>
                    <Badge
                      tone={
                        item.count === 0
                          ? "warning"
                          : item.count > 8
                            ? "danger"
                            : "success"
                      }
                      variant="sm"
                    >
                      {item.count}x
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="space-y-2 p-5">
            <h3 className="text-xs font-semibold text-[var(--foreground)]">
              Draft Metrics
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3">
                <p className="text-[var(--muted-foreground)]">Words</p>
                <p className="mt-0.5 text-base font-semibold text-[var(--foreground)]">
                  {stats.words}
                </p>
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3">
                <p className="text-[var(--muted-foreground)]">Characters</p>
                <p className="mt-0.5 text-base font-semibold text-[var(--foreground)]">
                  {stats.chars}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
