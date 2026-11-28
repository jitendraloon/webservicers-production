"use client";

import React, { useMemo, useState } from "react";
import {
  CheckCircle2,
  Copy,
  Check,
  Monitor,
  Smartphone,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  Globe,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";

function estimatePixelWidth(text: string, fontSizePx: number): number {
  let width = 0;
  const scale = fontSizePx / 20;
  for (const ch of text) {
    if ("ilI.,!|:;'` ".includes(ch)) width += 5.5 * scale;
    else if ("mwMW@%#".includes(ch)) width += 15.5 * scale;
    else if (ch >= "A" && ch <= "Z") width += 12.5 * scale;
    else width += 9.8 * scale;
  }
  return Math.round(width);
}

function truncateToPixels(text: string, maxPx: number, fontSizePx: number): string {
  if (!text) return "";
  if (estimatePixelWidth(text, fontSizePx) <= maxPx) return text;
  let result = "";
  for (const ch of text) {
    if (estimatePixelWidth(result + ch + "...", fontSizePx) > maxPx) break;
    result += ch;
  }
  return result.trimEnd() + "...";
}

function highlightKeyword(text: string, keyword: string): React.ReactNode {
  const trimmed = keyword.trim();
  if (!trimmed || !text) return text;
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return parts.map((part, idx) =>
    part.toLowerCase() === trimmed.toLowerCase() ? (
      <strong key={idx} className="font-semibold text-[var(--foreground)]">
        {part}
      </strong>
    ) : (
      <React.Fragment key={idx}>{part}</React.Fragment>
    )
  );
}

const DEFAULT_STATE = {
  url: "https://webservicers.io/blog/ai-seo-automation-guide",
  keyword: "ai seo automation",
  title: "AI SEO Automation: Complete Guide to Scaling Organic Growth",
  description:
    "Discover how AI SEO automation streamlines keyword research, content briefs, and technical audits to boost organic rankings faster in 2026.",
};

export default function MetaStudioPage() {
  const [url, setUrl] = useState(DEFAULT_STATE.url);
  const [keyword, setKeyword] = useState(DEFAULT_STATE.keyword);
  const [title, setTitle] = useState(DEFAULT_STATE.title);
  const [description, setDescription] = useState(DEFAULT_STATE.description);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [copied, setCopied] = useState(false);

  const titleChars = title.length;
  const titlePx = useMemo(() => estimatePixelWidth(title, 20), [title]);
  const descChars = description.length;
  const descPx = useMemo(() => estimatePixelWidth(description, 14), [description]);

  const titleMaxPx = device === "desktop" ? 580 : 520;
  const descMaxPx = device === "desktop" ? 920 : 680;

  const titleStatus =
    titleChars === 0
      ? { tone: "neutral" as const, label: "Empty" }
      : titleChars <= 60 && titlePx <= 580
        ? titleChars >= 45
          ? { tone: "success" as const, label: "Optimal" }
          : { tone: "warning" as const, label: "Short" }
        : { tone: "danger" as const, label: "Too Long" };

  const descStatus =
    descChars === 0
      ? { tone: "neutral" as const, label: "Empty" }
      : descChars <= 160 && descPx <= 920
        ? descChars >= 120
          ? { tone: "success" as const, label: "Optimal" }
          : { tone: "warning" as const, label: "Short" }
        : { tone: "danger" as const, label: "Too Long" };

  const parsedUrl = useMemo(() => {
    try {
      const normalized = url.startsWith("http") ? url : `https://${url}`;
      const u = new URL(normalized);
      const segments = u.pathname.split("/").filter(Boolean);
      return {
        origin: u.hostname,
        breadcrumb:
          segments.length > 0
            ? `${u.hostname} › ${segments.join(" › ")}`
            : u.hostname,
      };
    } catch {
      return {
        origin: "example.com",
        breadcrumb: url || "example.com",
      };
    }
  }, [url]);

  const checks = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const titleLower = title.toLowerCase();
    const descLower = description.toLowerCase();
    const urlLower = url.toLowerCase();

    return [
      {
        label: "Target keyword in Meta Title",
        passed: Boolean(kw) && titleLower.includes(kw),
        detail: kw ? `Looking for "${keyword.trim()}"` : "Enter a target keyword",
      },
      {
        label: "Keyword front-loaded in Title",
        passed: Boolean(kw) && titleLower.indexOf(kw) >= 0 && titleLower.indexOf(kw) <= 20,
        detail: "Best when placed within the first 20 characters",
      },
      {
        label: "Target keyword in Meta Description",
        passed: Boolean(kw) && descLower.includes(kw),
        detail: "Bolded in Google SERP when matching user query",
      },
      {
        label: "Target keyword in URL slug",
        passed: Boolean(kw) && urlLower.includes(kw.replace(/\s+/g, "-")),
        detail: "Clean hyphenated slug improves relevance",
      },
      {
        label: "Title fits desktop SERP (≤ 580px)",
        passed: titleChars > 0 && titlePx <= 580,
        detail: `${titlePx}px / 580px`,
      },
      {
        label: "Description fits SERP (≤ 160 chars)",
        passed: descChars >= 110 && descChars <= 160,
        detail: `${descChars} / 160 chars`,
      },
    ];
  }, [keyword, title, description, url, titleChars, titlePx, descChars]);

  const handleAiOptimize = () => {
    const kw = keyword.trim() || "SEO Strategy";
    const titleCaseKw = kw.replace(/\b\w/g, (c) => c.toUpperCase());
    setTitle(`${titleCaseKw}: Proven Playbook & Checklist (2026)`);
    setDescription(
      `Master ${kw} with step-by-step workflows, real benchmarks, and actionable templates to rank higher and drive qualified organic traffic.`
    );
  };

  const handleCopyTags = async () => {
    const html = `<title>${title}</title>\n<meta name="description" content="${description}" />`;
    try {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard may be unavailable in restricted contexts
    }
  };

  const handleReset = () => {
    setUrl(DEFAULT_STATE.url);
    setKeyword(DEFAULT_STATE.keyword);
    setTitle(DEFAULT_STATE.title);
    setDescription(DEFAULT_STATE.description);
  };

  const previewTitle = truncateToPixels(
    title || "Enter a meta title to preview...",
    titleMaxPx,
    20
  );
  const previewDesc = truncateToPixels(
    description || "Enter a meta description to see how Google renders your snippet.",
    descMaxPx,
    14
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meta Studio"
        subtitle="Craft click-worthy title tags and meta descriptions with live Google SERP pixel width previews."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopyTags}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied HTML" : "Copy Meta Tags"}
            </Button>
            <Button size="sm" onClick={handleAiOptimize}>
              <Sparkles className="h-3.5 w-3.5" />
              AI Optimize
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Metadata Editor */}
        <div className="space-y-4 lg:col-span-6">
          <Card className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--foreground)]">
                Metadata Inputs
              </h2>
              <Badge tone="primary" variant="sm">
                Live Sync
              </Badge>
            </div>

            <Input
              label="Page URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/your-page-slug"
            />

            <Input
              label="Target Keyword"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g. ai seo automation"
              hint="Used for SERP keyword highlighting and readiness checks."
            />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[var(--foreground)]">
                  Meta Title
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {titleChars} / 60 chars · {titlePx}px / 580px
                  </span>
                  <Badge tone={titleStatus.tone} variant="sm">
                    {titleStatus.label}
                  </Badge>
                </div>
              </div>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter your SEO title tag..."
              />
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--secondary)]">
                <div
                  className={`h-full transition-all ${
                    titleStatus.tone === "success"
                      ? "bg-[var(--success)]"
                      : titleStatus.tone === "warning"
                        ? "bg-[var(--warning)]"
                        : titleStatus.tone === "danger"
                          ? "bg-[var(--destructive)]"
                          : "bg-[var(--muted-foreground)]"
                  }`}
                  style={{ width: `${Math.min(100, Math.round((titlePx / 580) * 100))}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[var(--foreground)]">
                  Meta Description
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {descChars} / 160 chars · {descPx}px / 920px
                  </span>
                  <Badge tone={descStatus.tone} variant="sm">
                    {descStatus.label}
                  </Badge>
                </div>
              </div>
              <Textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write a compelling meta description..."
              />
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--secondary)]">
                <div
                  className={`h-full transition-all ${
                    descStatus.tone === "success"
                      ? "bg-[var(--success)]"
                      : descStatus.tone === "warning"
                        ? "bg-[var(--warning)]"
                        : descStatus.tone === "danger"
                          ? "bg-[var(--destructive)]"
                          : "bg-[var(--muted-foreground)]"
                  }`}
                  style={{ width: `${Math.min(100, Math.round((descPx / 920) * 100))}%` }}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Right: SERP Preview & Readiness */}
        <div className="space-y-4 lg:col-span-6">
          <Card className="space-y-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-[var(--foreground)]">
                Google SERP Preview
              </h2>
              <div className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--secondary)] p-0.5">
                <button
                  type="button"
                  onClick={() => setDevice("desktop")}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition ${
                    device === "desktop"
                      ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  <Monitor className="h-3.5 w-3.5" />
                  Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setDevice("mobile")}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition ${
                    device === "mobile"
                      ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  Mobile
                </button>
              </div>
            </div>

            <div
              className={`rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 transition-all ${
                device === "mobile" ? "mx-auto max-w-[360px]" : "w-full"
              }`}
            >
              <div className="mb-1.5 flex items-center gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--secondary)]">
                  <Globe className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-xs font-medium text-[var(--foreground)]">
                    {parsedUrl.origin}
                  </div>
                  <div className="truncate text-[11px] text-[var(--muted-foreground)]">
                    {parsedUrl.breadcrumb}
                  </div>
                </div>
              </div>

              <h3 className="cursor-pointer text-[19px] leading-snug font-normal text-[#1a0dab] hover:underline dark:text-[#8ab4f8]">
                {previewTitle}
              </h3>

              <p className="mt-1 text-[13px] leading-relaxed text-[var(--muted-foreground)]">
                {highlightKeyword(previewDesc, keyword)}
              </p>
            </div>
          </Card>

          <Card className="space-y-3 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--foreground)]">
                SERP Readiness Checklist
              </h2>
              <Badge tone="neutral" variant="sm">
                {checks.filter((c) => c.passed).length} / {checks.length} passed
              </Badge>
            </div>

            <div className="divide-y divide-[var(--border)]">
              {checks.map((check) => (
                <div
                  key={check.label}
                  className="flex items-start justify-between gap-3 py-2.5 first:pt-1 last:pb-1"
                >
                  <div className="flex items-start gap-2.5">
                    {check.passed ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--success)]" />
                    ) : (
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--warning)]" />
                    )}
                    <div>
                      <p className="text-xs font-medium text-[var(--foreground)]">
                        {check.label}
                      </p>
                      <p className="text-[11px] text-[var(--muted-foreground)]">
                        {check.detail}
                      </p>
                    </div>
                  </div>
                  <Badge tone={check.passed ? "success" : "warning"} variant="sm">
                    {check.passed ? "Pass" : "Review"}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
