"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  FileCode2,
  Monitor,
  Search,
  Smartphone,
  Sparkles,
  Tag,
  Type,
} from "lucide-react";

type ToolId = "meta" | "serp" | "density" | "robots";

const STOP_WORDS = new Set([
  "the", "and", "for", "that", "this", "with", "you", "your", "are", "from",
  "have", "was", "were", "will", "can", "all", "not", "but", "what", "when",
  "where", "which", "who", "how", "why", "into", "out", "about", "our", "more",
  "than", "then", "they", "their", "them", "been", "being", "has", "had",
  "its", "it's", "one", "two", "also", "just", "like", "very", "such",
]);

function extractMetaFromHtml(html: string) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const descMatch = html.match(
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i
  ) || html.match(
    /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["'][^>]*>/i
  );
  const canonicalMatch = html.match(
    /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["'][^>]*>/i
  );
  const robotsMatch = html.match(
    /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["'][^>]*>/i
  );
  const ogTitleMatch = html.match(
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["'][^>]*>/i
  );
  const ogImageMatch = html.match(
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']*)["'][^>]*>/i
  );
  const viewportMatch = html.match(
    /<meta[^>]+name=["']viewport["'][^>]+content=["']([^"']*)["'][^>]*>/i
  );

  return {
    title: titleMatch?.[1]?.trim() || "",
    description: descMatch?.[1]?.trim() || "",
    canonical: canonicalMatch?.[1]?.trim() || "",
    robots: robotsMatch?.[1]?.trim() || "",
    ogTitle: ogTitleMatch?.[1]?.trim() || "",
    ogImage: ogImageMatch?.[1]?.trim() || "",
    viewport: viewportMatch?.[1]?.trim() || "",
  };
}

export default function FreeSeoToolsPage() {
  const [activeTool, setActiveTool] = useState<ToolId>("meta");

  // 1. Meta Tag Analyzer state
  const [rawHtml, setRawHtml] = useState(
    `<title>WebServicers — Websites, SEO & Digital Growth Agency</title>\n<meta name="description" content="Full-stack website design, technical SEO, and managed paid growth campaigns built to compound together." />\n<meta name="viewport" content="width=device-width, initial-scale=1" />\n<link rel="canonical" href="https://webservicers.com/" />\n<meta property="og:title" content="WebServicers — Websites, SEO & Digital Growth" />`
  );

  // 2. SERP Previewer state
  const [serpDevice, setSerpDevice] = useState<"desktop" | "mobile">("desktop");
  const [serpTitle, setSerpTitle] = useState(
    "Technical SEO & Organic Growth Agency | WebServicers"
  );
  const [serpUrl, setSerpUrl] = useState(
    "https://webservicers.com/services/seo"
  );
  const [serpDesc, setSerpDesc] = useState(
    "Scale qualified organic traffic with technical SEO audits, high-authority content architecture, and Core Web Vitals optimization. Launch in 7 days."
  );
  const [showRichDate, setShowRichDate] = useState(true);

  // 3. Keyword Density Checker state
  const [densityText, setDensityText] = useState(
    "Technical SEO is the foundation of sustainable organic growth. When your website architecture, Core Web Vitals, and internal linking work together, search engines crawl and index your highest-converting pages faster. A strong SEO strategy pairs technical SEO audits with intent-driven content."
  );
  const [targetKeyword, setTargetKeyword] = useState("technical seo");

  // 4. Robots.txt Generator state
  const [robotsPolicy, setRobotsPolicy] = useState<"allow" | "standard" | "strict">("standard");
  const [blockAiBots, setBlockAiBots] = useState(false);
  const [sitemapUrl, setSitemapUrl] = useState("https://yourdomain.com/sitemap.xml");
  const [customDisallow, setCustomDisallow] = useState("/admin/\n/api/\n/checkout/");
  const [crawlDelay, setCrawlDelay] = useState("");
  const [copiedRobots, setCopiedRobots] = useState(false);

  const metaAnalysis = useMemo(() => {
    const parsed = extractMetaFromHtml(rawHtml);
    const checks = [
      {
        label: "Title Tag",
        value: parsed.title || "Missing",
        status:
          !parsed.title
            ? "error"
            : parsed.title.length >= 30 && parsed.title.length <= 60
            ? "ok"
            : "warn",
        hint: !parsed.title
          ? "Add a unique <title> between 30–60 characters."
          : `${parsed.title.length} chars (ideal: 50–60 chars).`,
      },
      {
        label: "Meta Description",
        value: parsed.description || "Missing",
        status:
          !parsed.description
            ? "error"
            : parsed.description.length >= 110 && parsed.description.length <= 160
            ? "ok"
            : "warn",
        hint: !parsed.description
          ? "Add a <meta name='description'> between 120–160 characters."
          : `${parsed.description.length} chars (ideal: 120–160 chars).`,
      },
      {
        label: "Canonical URL",
        value: parsed.canonical || "Missing",
        status: parsed.canonical ? "ok" : "warn",
        hint: parsed.canonical
          ? "Canonical link prevents duplicate content issues."
          : "Recommended: add <link rel='canonical' href='...' />.",
      },
      {
        label: "Mobile Viewport",
        value: parsed.viewport || "Missing",
        status: parsed.viewport ? "ok" : "error",
        hint: parsed.viewport
          ? "Mobile viewport meta tag is configured."
          : "Required for mobile-first indexing.",
      },
      {
        label: "Open Graph Title",
        value: parsed.ogTitle || "Missing",
        status: parsed.ogTitle ? "ok" : "warn",
        hint: parsed.ogTitle
          ? "Social sharing title detected."
          : "Add og:title for richer LinkedIn & X previews.",
      },
      {
        label: "Open Graph Image",
        value: parsed.ogImage || "Missing",
        status: parsed.ogImage ? "ok" : "warn",
        hint: parsed.ogImage
          ? "Social preview image detected."
          : "Add og:image (1200×630px) to boost social CTR.",
      },
    ];
    const score = Math.round(
      (checks.filter((c) => c.status === "ok").length / checks.length) * 100
    );
    return { parsed, checks, score };
  }, [rawHtml]);

  const densityStats = useMemo(() => {
    const cleaned = densityText
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const words = cleaned ? cleaned.split(" ") : [];
    const totalWords = words.length;
    const charCount = densityText.length;
    const readingMinutes = Math.max(1, Math.ceil(totalWords / 200));

    const freqMap = new Map<string, number>();
    for (const w of words) {
      if (w.length < 3 || STOP_WORDS.has(w)) continue;
      freqMap.set(w, (freqMap.get(w) || 0) + 1);
    }

    const topKeywords = Array.from(freqMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([word, count]) => ({
        word,
        count,
        density: totalWords > 0 ? ((count / totalWords) * 100).toFixed(1) : "0.0",
      }));

    let targetCount = 0;
    let targetDensity = 0;
    const kw = targetKeyword.trim().toLowerCase();
    if (kw && cleaned) {
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const matches = cleaned.match(new RegExp(`\\b${escaped}\\b`, "g"));
      targetCount = matches ? matches.length : 0;
      const kwWordCount = kw.split(/\s+/).length;
      targetDensity =
        totalWords > 0 ? ((targetCount * kwWordCount) / totalWords) * 100 : 0;
    }

    return {
      totalWords,
      charCount,
      readingMinutes,
      topKeywords,
      targetCount,
      targetDensity: targetDensity.toFixed(2),
    };
  }, [densityText, targetKeyword]);

  const robotsOutput = useMemo(() => {
    const lines: string[] = ["# Generated by WebServicers Free SEO Tools", "User-agent: *"];

    if (robotsPolicy === "allow") {
      lines.push("Allow: /");
    } else if (robotsPolicy === "strict") {
      lines.push("Disallow: /");
    } else {
      lines.push("Allow: /");
      const customLines = customDisallow
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      for (const path of customLines) {
        lines.push(`Disallow: ${path.startsWith("/") ? path : `/${path}`}`);
      }
    }

    if (crawlDelay.trim()) {
      lines.push(`Crawl-delay: ${crawlDelay.trim()}`);
    }

    if (blockAiBots) {
      lines.push("");
      lines.push("# Block AI training crawlers");
      for (const bot of ["GPTBot", "CCBot", "Google-Extended", "anthropic-ai"]) {
        lines.push(`User-agent: ${bot}`);
        lines.push("Disallow: /");
      }
    }

    if (sitemapUrl.trim()) {
      lines.push("");
      lines.push(`Sitemap: ${sitemapUrl.trim()}`);
    }

    return lines.join("\n");
  }, [robotsPolicy, customDisallow, crawlDelay, blockAiBots, sitemapUrl]);

  function copyRobots() {
    navigator.clipboard?.writeText(robotsOutput);
    setCopiedRobots(true);
    setTimeout(() => setCopiedRobots(false), 1800);
  }

  function downloadRobots() {
    const blob = new Blob([robotsOutput], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "robots.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  const tools: { id: ToolId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "meta", label: "Meta Tag Analyzer", icon: Tag },
    { id: "serp", label: "SERP Previewer", icon: Search },
    { id: "density", label: "Keyword Density", icon: Type },
    { id: "robots", label: "Robots.txt Generator", icon: FileCode2 },
  ];

  const formattedSerpDomain = (() => {
    try {
      const u = new URL(serpUrl.startsWith("http") ? serpUrl : `https://${serpUrl}`);
      const path = u.pathname.split("/").filter(Boolean).join(" › ");
      return `${u.hostname}${path ? ` › ${path}` : ""}`;
    } catch {
      return serpUrl || "example.com";
    }
  })();

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-14 sm:py-20 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="max-w-2xl space-y-3">
          <span className="font-mono-label text-[var(--ws-brand-lilac-deep)]">
            Free Marketing Utilities
          </span>
          <h1 className="display-title text-4xl sm:text-5xl text-[var(--ws-text-primary)]">
            Interactive{" "}
            <span className="hero-emphasis">SEO Tools Hub</span>
          </h1>
          <p className="text-base sm:text-lg text-[var(--ws-text-secondary)]">
            Audit your meta tags, preview live Google search snippets, check
            keyword density, and generate clean robots.txt files — instant and
            100% client-side.
          </p>
        </div>
        <Link
          href="/talk-to-an-expert?ref=tools"
          className="inline-flex items-center gap-2 rounded-full bg-[var(--ws-foreground)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--ws-brand-lilac-deep)] transition-colors shrink-0"
        >
          Get a Full Site Audit
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Tool Tabs */}
      <div className="flex flex-wrap gap-2">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const active = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => setActiveTool(tool.id)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium border transition-all cursor-pointer ${
                active
                  ? "border-[var(--ws-brand-lilac-deep)] bg-[var(--ws-foreground)] text-white shadow-sm"
                  : "border-[var(--ws-border-color)] bg-white text-[var(--ws-text-primary)] hover:border-[var(--ws-brand-lilac)]"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tool.label}
            </button>
          );
        })}
      </div>

      {/* Tool 1: Meta Tag Analyzer */}
      {activeTool === "meta" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-6 surface-card rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--ws-text-primary)]">
                Paste HTML &lt;head&gt; Snippet
              </h2>
              <span className="text-xs font-mono text-[var(--ws-text-secondary)]">
                Live Parser
              </span>
            </div>
            <textarea
              rows={11}
              value={rawHtml}
              onChange={(e) => setRawHtml(e.target.value)}
              placeholder="Paste your <title>, <meta>, and <link rel='canonical'> tags here..."
              className="w-full rounded-xl border border-[var(--ws-border-color)] bg-white p-4 font-mono text-xs leading-relaxed text-[var(--ws-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ws-brand-lilac-deep)]/30"
            />
          </div>

          <div className="lg:col-span-6 surface-card rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[var(--ws-text-primary)]">
                  Meta Health Report
                </h2>
                <p className="text-xs text-[var(--ws-text-secondary)]">
                  Evaluated against Google Search &amp; Open Graph standards
                </p>
              </div>
              <div className="rounded-xl bg-[var(--ws-brand-lilac-soft)] px-3.5 py-2 text-center">
                <span className="block font-mono text-lg font-bold text-[var(--ws-brand-lilac-deep)]">
                  {metaAnalysis.score}%
                </span>
                <span className="block text-[10px] uppercase tracking-wider text-[var(--ws-brand-lilac-deep)]">
                  Score
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {metaAnalysis.checks.map((check) => (
                <div
                  key={check.label}
                  className="rounded-xl border border-[var(--ws-border-color)] bg-white p-3.5 flex items-start gap-3"
                >
                  {check.status === "ok" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle
                      className={`h-4 w-4 shrink-0 mt-0.5 ${
                        check.status === "error"
                          ? "text-red-500"
                          : "text-amber-500"
                      }`}
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-[var(--ws-text-primary)]">
                        {check.label}
                      </span>
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full ${
                          check.status === "ok"
                            ? "bg-emerald-50 text-emerald-700"
                            : check.status === "error"
                            ? "bg-red-50 text-red-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {check.status === "ok"
                          ? "Optimal"
                          : check.status === "error"
                          ? "Missing"
                          : "Needs Tuning"}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--ws-text-secondary)] truncate mt-0.5">
                      {check.value}
                    </p>
                    <p className="text-[11px] text-[var(--ws-text-secondary)] mt-1">
                      {check.hint}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tool 2: SERP Previewer */}
      {activeTool === "serp" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-6 surface-card rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-[var(--ws-text-primary)]">
              Snippet Editor
            </h2>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <label className="font-medium text-[var(--ws-text-primary)]">
                  SEO Title
                </label>
                <span
                  className={`font-mono ${
                    serpTitle.length > 60
                      ? "text-amber-600"
                      : "text-emerald-600"
                  }`}
                >
                  {serpTitle.length} / 60 chars
                </span>
              </div>
              <input
                type="text"
                value={serpTitle}
                onChange={(e) => setSerpTitle(e.target.value)}
                className="w-full rounded-xl border border-[var(--ws-border-color)] bg-white px-4 py-2.5 text-sm text-[var(--ws-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ws-brand-lilac-deep)]/30"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--ws-text-primary)] mb-1">
                Page URL
              </label>
              <input
                type="text"
                value={serpUrl}
                onChange={(e) => setSerpUrl(e.target.value)}
                className="w-full rounded-xl border border-[var(--ws-border-color)] bg-white px-4 py-2.5 text-sm text-[var(--ws-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ws-brand-lilac-deep)]/30"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <label className="font-medium text-[var(--ws-text-primary)]">
                  Meta Description
                </label>
                <span
                  className={`font-mono ${
                    serpDesc.length > 160
                      ? "text-amber-600"
                      : "text-emerald-600"
                  }`}
                >
                  {serpDesc.length} / 160 chars
                </span>
              </div>
              <textarea
                rows={4}
                value={serpDesc}
                onChange={(e) => setSerpDesc(e.target.value)}
                className="w-full rounded-xl border border-[var(--ws-border-color)] bg-white px-4 py-2.5 text-sm text-[var(--ws-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ws-brand-lilac-deep)]/30"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-[var(--ws-text-secondary)] cursor-pointer">
              <input
                type="checkbox"
                checked={showRichDate}
                onChange={(e) => setShowRichDate(e.target.checked)}
                className="h-4 w-4 rounded border-[var(--ws-border-color)] text-[var(--ws-brand-lilac-deep)]"
              />
              Show publish date prefix in snippet
            </label>
          </div>

          <div className="lg:col-span-6 surface-card rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--ws-text-primary)]">
                Live Google SERP Preview
              </h2>
              <div className="inline-flex rounded-full border border-[var(--ws-border-color)] bg-white p-1">
                <button
                  type="button"
                  onClick={() => setSerpDevice("desktop")}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium cursor-pointer ${
                    serpDevice === "desktop"
                      ? "bg-[var(--ws-foreground)] text-white"
                      : "text-[var(--ws-text-secondary)]"
                  }`}
                >
                  <Monitor className="h-3.5 w-3.5" />
                  Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setSerpDevice("mobile")}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium cursor-pointer ${
                    serpDevice === "mobile"
                      ? "bg-[var(--ws-foreground)] text-white"
                      : "text-[var(--ws-text-secondary)]"
                  }`}
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  Mobile
                </button>
              </div>
            </div>

            <div
              className={`rounded-xl border border-[var(--ws-border-color)] bg-white p-5 ${
                serpDevice === "mobile" ? "max-w-sm mx-auto" : "w-full"
              }`}
            >
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="h-6 w-6 rounded-full bg-[var(--ws-brand-lilac-soft)] text-[var(--ws-brand-lilac-deep)] text-xs font-bold flex items-center justify-center">
                  W
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[#202124] truncate">
                    {formattedSerpDomain}
                  </p>
                </div>
              </div>

              <h3 className="text-lg sm:text-xl font-medium text-[#1a0dab] leading-snug hover:underline cursor-pointer">
                {serpTitle.slice(0, 62) || "Your Page Title Appears Here"}
                {serpTitle.length > 62 ? "..." : ""}
              </h3>

              <p className="mt-1.5 text-sm text-[#4d5156] leading-relaxed">
                {showRichDate && (
                  <span className="text-[#70757a]">Nov 26, 2026 — </span>
                )}
                {serpDesc.slice(0, 160) ||
                  "Your meta description will appear here to summarize the page."}
                {serpDesc.length > 160 ? "..." : ""}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tool 3: Keyword Density Checker */}
      {activeTool === "density" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 surface-card rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-[var(--ws-text-primary)]">
              Content &amp; Target Keyword
            </h2>

            <div>
              <label className="block text-xs font-medium text-[var(--ws-text-primary)] mb-1">
                Target Keyword or Phrase
              </label>
              <input
                type="text"
                value={targetKeyword}
                onChange={(e) => setTargetKeyword(e.target.value)}
                placeholder="e.g. technical seo"
                className="w-full rounded-xl border border-[var(--ws-border-color)] bg-white px-4 py-2.5 text-sm text-[var(--ws-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ws-brand-lilac-deep)]/30"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--ws-text-primary)] mb-1">
                Page Copy / Article Text
              </label>
              <textarea
                rows={9}
                value={densityText}
                onChange={(e) => setDensityText(e.target.value)}
                placeholder="Paste your article or landing page copy here..."
                className="w-full rounded-xl border border-[var(--ws-border-color)] bg-white p-4 text-sm leading-relaxed text-[var(--ws-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ws-brand-lilac-deep)]/30"
              />
            </div>
          </div>

          <div className="lg:col-span-5 surface-card rounded-2xl p-6 space-y-5">
            <h2 className="text-lg font-semibold text-[var(--ws-text-primary)]">
              Density Breakdown
            </h2>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl border border-[var(--ws-border-color)] bg-white p-3">
                <span className="block font-mono text-xl font-bold text-[var(--ws-text-primary)]">
                  {densityStats.totalWords}
                </span>
                <span className="text-[11px] text-[var(--ws-text-secondary)]">
                  Words
                </span>
              </div>
              <div className="rounded-xl border border-[var(--ws-border-color)] bg-white p-3">
                <span className="block font-mono text-xl font-bold text-[var(--ws-text-primary)]">
                  {densityStats.charCount}
                </span>
                <span className="text-[11px] text-[var(--ws-text-secondary)]">
                  Characters
                </span>
              </div>
              <div className="rounded-xl border border-[var(--ws-border-color)] bg-white p-3">
                <span className="block font-mono text-xl font-bold text-[var(--ws-text-primary)]">
                  {densityStats.readingMinutes}m
                </span>
                <span className="text-[11px] text-[var(--ws-text-secondary)]">
                  Read Time
                </span>
              </div>
            </div>

            {targetKeyword.trim() && (
              <div className="rounded-xl border border-[var(--ws-brand-lilac)] bg-[var(--ws-brand-lilac-soft)]/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--ws-brand-lilac-deep)]">
                    Target: &ldquo;{targetKeyword.trim()}&rdquo;
                  </span>
                  <span className="font-mono text-sm font-bold text-[var(--ws-brand-lilac-deep)]">
                    {densityStats.targetDensity}% ({densityStats.targetCount}×)
                  </span>
                </div>
                <p className="text-[11px] text-[var(--ws-text-secondary)] mt-1">
                  Recommended natural keyword density is between 0.8% and 2.5%.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--ws-text-secondary)]">
                Top Terms (Excl. Stop Words)
              </h3>
              {densityStats.topKeywords.length === 0 ? (
                <p className="text-xs text-[var(--ws-text-secondary)]">
                  Enter at least a few words to analyze term frequency.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {densityStats.topKeywords.map((item) => (
                    <div
                      key={item.word}
                      className="flex items-center justify-between rounded-lg border border-[var(--ws-border-color)] bg-white px-3 py-2 text-xs"
                    >
                      <span className="font-medium text-[var(--ws-text-primary)]">
                        {item.word}
                      </span>
                      <span className="font-mono text-[var(--ws-text-secondary)]">
                        {item.count}× ({item.density}%)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tool 4: Robots.txt Generator */}
      {activeTool === "robots" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-6 surface-card rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-[var(--ws-text-primary)]">
              Crawler Rules Builder
            </h2>

            <div>
              <label className="block text-xs font-medium text-[var(--ws-text-primary)] mb-1.5">
                Default Indexing Policy
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "standard", label: "Standard" },
                  { id: "allow", label: "Allow All" },
                  { id: "strict", label: "Block All" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      setRobotsPolicy(opt.id as "allow" | "standard" | "strict")
                    }
                    className={`rounded-xl border px-3 py-2 text-xs font-medium cursor-pointer ${
                      robotsPolicy === opt.id
                        ? "border-[var(--ws-brand-lilac-deep)] bg-[var(--ws-brand-lilac-soft)] text-[var(--ws-brand-lilac-deep)]"
                        : "border-[var(--ws-border-color)] bg-white text-[var(--ws-text-secondary)]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {robotsPolicy === "standard" && (
              <div>
                <label className="block text-xs font-medium text-[var(--ws-text-primary)] mb-1">
                  Disallowed Paths (one per line)
                </label>
                <textarea
                  rows={4}
                  value={customDisallow}
                  onChange={(e) => setCustomDisallow(e.target.value)}
                  className="w-full rounded-xl border border-[var(--ws-border-color)] bg-white p-3 font-mono text-xs text-[var(--ws-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ws-brand-lilac-deep)]/30"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--ws-text-primary)] mb-1">
                  XML Sitemap URL
                </label>
                <input
                  type="text"
                  value={sitemapUrl}
                  onChange={(e) => setSitemapUrl(e.target.value)}
                  placeholder="https://yourdomain.com/sitemap.xml"
                  className="w-full rounded-xl border border-[var(--ws-border-color)] bg-white px-3.5 py-2 text-xs text-[var(--ws-text-primary)]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--ws-text-primary)] mb-1">
                  Crawl Delay (Seconds, optional)
                </label>
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={crawlDelay}
                  onChange={(e) => setCrawlDelay(e.target.value)}
                  placeholder="e.g. 5"
                  className="w-full rounded-xl border border-[var(--ws-border-color)] bg-white px-3.5 py-2 text-xs text-[var(--ws-text-primary)]"
                />
              </div>
            </div>

            <label className="flex items-center gap-2.5 text-xs text-[var(--ws-text-secondary)] cursor-pointer">
              <input
                type="checkbox"
                checked={blockAiBots}
                onChange={(e) => setBlockAiBots(e.target.checked)}
                className="h-4 w-4 rounded border-[var(--ws-border-color)] text-[var(--ws-brand-lilac-deep)]"
              />
              Add Disallow rules for AI training crawlers (GPTBot, CCBot,
              Google-Extended)
            </label>
          </div>

          <div className="lg:col-span-6 surface-card rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[var(--ws-brand-lilac-deep)]" />
                <h2 className="text-lg font-semibold text-[var(--ws-text-primary)]">
                  Generated robots.txt
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={copyRobots}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--ws-border-color)] bg-white px-3.5 py-1.5 text-xs font-medium text-[var(--ws-text-primary)] hover:border-[var(--ws-brand-lilac)] cursor-pointer"
                >
                  {copiedRobots ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={downloadRobots}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[var(--ws-foreground)] px-3.5 py-1.5 text-xs font-medium text-white hover:bg-[var(--ws-brand-lilac-deep)] cursor-pointer"
                >
                  Download .txt
                </button>
              </div>
            </div>

            <pre className="rounded-xl border border-[var(--ws-border-color)] bg-[#14232b] text-[#e8fbf4] p-5 font-mono text-xs leading-relaxed overflow-x-auto">
              {robotsOutput}
            </pre>
          </div>
        </div>
      )}
    </section>
  );
}
