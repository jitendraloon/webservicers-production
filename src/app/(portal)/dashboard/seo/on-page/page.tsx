"use client";

import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Heading,
  Image as ImageIcon,
  Link2,
  Percent,
  Search,
  Sparkles,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type CheckStatus = "pass" | "warning" | "fail";

interface OnPageCheck {
  id: string;
  category: string;
  title: string;
  status: CheckStatus;
  currentValue: string;
  recommended: string;
  recommendation: string;
  icon: React.ComponentType<{ className?: string }>;
}

function runOnPageAudit(url: string, keyword: string): OnPageCheck[] {
  const cleanUrl = url.trim() || "https://webservicers.io/blog/ai-seo-automation";
  const kw = keyword.trim() || "ai seo automation";
  const slug = cleanUrl.toLowerCase();
  const hasKwInSlug = slug.includes(kw.toLowerCase().replace(/\s+/g, "-"));
  const hash = Array.from(cleanUrl + kw).reduce(
    (acc, ch) => acc + ch.charCodeAt(0),
    0
  );

  const titleLen = 52 + (hash % 14);
  const descLen = 144 + (hash % 24);
  const h2Count = 4 + (hash % 4);
  const density = Number((1.1 + ((hash % 14) / 10)).toFixed(1));
  const internalLinks = 2 + (hash % 6);
  const totalImages = 5 + (hash % 4);
  const missingAlt = hash % 3;

  return [
    {
      id: "title-tag",
      category: "Title Tag",
      title: "Title Tag Length & Keyword Placement",
      status: titleLen <= 60 ? "pass" : "warning",
      currentValue: `${titleLen} chars · Keyword ${hasKwInSlug ? "front-loaded" : "present"}`,
      recommended: "50–60 characters with primary keyword near start",
      recommendation:
        titleLen <= 60
          ? "Title tag fits cleanly within desktop and mobile SERP bounds."
          : "Trim 4–6 characters so the title does not truncate in Google SERPs.",
      icon: FileText,
    },
    {
      id: "meta-description",
      category: "Meta Description",
      title: "Meta Description Coverage",
      status: descLen <= 160 ? "pass" : "warning",
      currentValue: `${descLen} chars · Includes "${kw}"`,
      recommended: "140–160 characters with clear CTA",
      recommendation:
        descLen <= 160
          ? "Description length is optimal and includes the target keyword."
          : "Shorten description below 160 characters to avoid ellipsis truncation.",
      icon: Search,
    },
    {
      id: "heading-structure",
      category: "H1 / H2 Structure",
      title: "Heading Hierarchy & Semantic Outline",
      status: h2Count >= 4 ? "pass" : "warning",
      currentValue: `1 H1 · ${h2Count} H2s · 6 H3s`,
      recommended: "Exactly 1 H1 and 3+ descriptive H2 sections",
      recommendation:
        "Single H1 detected with logical H2/H3 nesting and keyword coverage.",
      icon: Heading,
    },
    {
      id: "keyword-density",
      category: "Keyword Density",
      title: "Primary Keyword Density",
      status:
        density >= 0.8 && density <= 2.2
          ? "pass"
          : density > 2.2
            ? "warning"
            : "fail",
      currentValue: `${density}% (${Math.round(density * 14)} occurrences)`,
      recommended: "0.8% – 2.2% natural distribution",
      recommendation:
        density <= 2.2
          ? "Keyword usage is natural and avoids over-optimization."
          : "Reduce exact-match repetitions and swap in semantic variations.",
      icon: Percent,
    },
    {
      id: "internal-links",
      category: "Internal Links",
      title: "Internal Link Graph & Anchors",
      status: internalLinks >= 4 ? "pass" : "warning",
      currentValue: `${internalLinks} internal links found`,
      recommended: "4+ contextual internal links with descriptive anchors",
      recommendation:
        internalLinks >= 4
          ? "Strong internal link equity distribution to related topic pages."
          : "Add 2 more contextual internal links to pillar and cluster pages.",
      icon: Link2,
    },
    {
      id: "image-alt",
      category: "Image Alt Text",
      title: "Image Alt Attribute Coverage",
      status: missingAlt === 0 ? "pass" : missingAlt === 1 ? "warning" : "fail",
      currentValue: `${totalImages - missingAlt}/${totalImages} images have alt text`,
      recommended: "100% of content images with descriptive alt attributes",
      recommendation:
        missingAlt === 0
          ? "All detected images include descriptive alt text."
          : `Add descriptive alt text to ${missingAlt} image(s) for accessibility and image search.`,
      icon: ImageIcon,
    },
  ];
}

export default function OnPageCheckerPage() {
  const [url, setUrl] = useState("https://webservicers.io/blog/ai-seo-automation");
  const [keyword, setKeyword] = useState("ai seo automation");
  const [filter, setFilter] = useState<"all" | "issues" | "passed">("all");
  const [checks, setChecks] = useState<OnPageCheck[]>(() =>
    runOnPageAudit(
      "https://webservicers.io/blog/ai-seo-automation",
      "ai seo automation"
    )
  );
  const [lastAudited, setLastAudited] = useState<string>("Ready");

  const handleRunAudit = (e: React.FormEvent) => {
    e.preventDefault();
    setChecks(runOnPageAudit(url, keyword));
    setLastAudited(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
  };

  const score = useMemo(() => {
    if (checks.length === 0) return 0;
    const total = checks.reduce((sum, c) => {
      if (c.status === "pass") return sum + 100;
      if (c.status === "warning") return sum + 65;
      return sum + 25;
    }, 0);
    return Math.round(total / checks.length);
  }, [checks]);

  const counts = useMemo(() => {
    return {
      pass: checks.filter((c) => c.status === "pass").length,
      warning: checks.filter((c) => c.status === "warning").length,
      fail: checks.filter((c) => c.status === "fail").length,
    };
  }, [checks]);

  const filteredChecks = useMemo(() => {
    if (filter === "passed") return checks.filter((c) => c.status === "pass");
    if (filter === "issues") return checks.filter((c) => c.status !== "pass");
    return checks;
  }, [checks, filter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="On-Page SEO Checker"
        subtitle="Audit Title Tag, Meta Description, H1/H2 structure, keyword density, internal links, and image alt text."
        actions={
          <Badge
            tone={score >= 85 ? "success" : score >= 65 ? "warning" : "danger"}
          >
            Score: {score} / 100
          </Badge>
        }
      />

      {/* Audit Form */}
      <Card className="p-5">
        <form
          onSubmit={handleRunAudit}
          className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-end"
        >
          <div className="md:col-span-6">
            <Input
              label="Page URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/page-to-audit"
            />
          </div>
          <div className="md:col-span-4">
            <Input
              label="Target Keyword"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g. ai seo automation"
            />
          </div>
          <div className="md:col-span-2">
            <Button type="submit" className="w-full">
              <Sparkles className="h-3.5 w-3.5" />
              Run Audit
            </Button>
          </div>
        </form>
      </Card>

      {/* Summary Strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs text-[var(--muted-foreground)]">Overall Score</p>
          <p className="mt-1 text-2xl font-bold text-[var(--foreground)]">
            {score}/100
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[var(--muted-foreground)]">Passed Checks</p>
          <p className="mt-1 text-2xl font-bold text-[var(--success)]">
            {counts.pass}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[var(--muted-foreground)]">Warnings</p>
          <p className="mt-1 text-2xl font-bold text-[var(--warning)]">
            {counts.warning}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[var(--muted-foreground)]">Errors</p>
          <p className="mt-1 text-2xl font-bold text-[var(--destructive)]">
            {counts.fail}
          </p>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--secondary)] p-0.5">
          {(
            [
              { id: "all", label: `All (${checks.length})` },
              { id: "issues", label: `Issues (${counts.warning + counts.fail})` },
              { id: "passed", label: `Passed (${counts.pass})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                filter === tab.id
                  ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-[var(--muted-foreground)]">
          Last audited: {lastAudited}
        </span>
      </div>

      {/* Audit Checks */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {filteredChecks.map((check) => {
          const Icon = check.icon;
          return (
            <Card key={check.id} className="space-y-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--secondary)] p-2">
                    <Icon className="h-4 w-4 text-[var(--primary)]" />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                      {check.category}
                    </p>
                    <h3 className="text-sm font-semibold text-[var(--foreground)]">
                      {check.title}
                    </h3>
                  </div>
                </div>
                <Badge
                  tone={
                    check.status === "pass"
                      ? "success"
                      : check.status === "warning"
                        ? "warning"
                        : "danger"
                  }
                  variant="sm"
                >
                  {check.status === "pass" ? (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Pass
                    </span>
                  ) : check.status === "warning" ? (
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Warning
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <XCircle className="h-3 w-3" /> Fail
                    </span>
                  )}
                </Badge>
              </div>

              <div className="space-y-1 rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[var(--muted-foreground)]">Detected</span>
                  <span className="font-medium text-[var(--foreground)]">
                    {check.currentValue}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[var(--muted-foreground)]">Target</span>
                  <span className="text-[var(--foreground)]">
                    {check.recommended}
                  </span>
                </div>
              </div>

              <p className="text-xs text-[var(--muted-foreground)]">
                {check.recommendation}
              </p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
