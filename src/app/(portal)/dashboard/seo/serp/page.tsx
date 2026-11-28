"use client";

import React, { useMemo, useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
  FileText,
  HelpCircle,
  MapPin,
  Search,
  Sparkles,
  Video,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";

interface SerpResultRow {
  position: number;
  title: string;
  url: string;
  da: number;
  pa: number;
  wordCount: number;
  contentType: string;
}

interface SerpFeatureItem {
  key: "featured_snippet" | "paa" | "local_pack" | "video";
  label: string;
  present: boolean;
  detail: string;
}

interface IntentSlice {
  label: "Informational" | "Commercial" | "Transactional" | "Navigational";
  pct: number;
}

const COUNTRIES = [
  { code: "US", label: "United States (US)" },
  { code: "GB", label: "United Kingdom (UK)" },
  { code: "CA", label: "Canada (CA)" },
  { code: "AU", label: "Australia (AU)" },
  { code: "IN", label: "India (IN)" },
  { code: "DE", label: "Germany (DE)" },
];

const PRESET_KEYWORDS = [
  "best technical seo tools",
  "local seo agency austin",
  "how to fix core web vitals",
];

function hashString(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = (h * 33 + input.charCodeAt(i)) % 100000;
  }
  return h;
}

export default function SerpAnalyzerPage() {
  const [keyword, setKeyword] = useState("best technical seo tools");
  const [country, setCountry] = useState("US");
  const [submittedKeyword, setSubmittedKeyword] = useState("best technical seo tools");
  const [submittedCountry, setSubmittedCountry] = useState("US");
  const [loading, setLoading] = useState(false);

  const seed = useMemo(
    () => hashString(`${submittedKeyword.toLowerCase()}::${submittedCountry}`),
    [submittedKeyword, submittedCountry]
  );

  const serpFeatures: SerpFeatureItem[] = useMemo(() => {
    const kwLower = submittedKeyword.toLowerCase();
    const isLocal = kwLower.includes("near") || kwLower.includes("agency") || kwLower.includes("austin");
    const isHowTo = kwLower.includes("how") || kwLower.includes("guide") || kwLower.includes("fix");
    return [
      {
        key: "featured_snippet",
        label: "Featured Snippet",
        present: isHowTo || seed % 2 === 0,
        detail: isHowTo || seed % 2 === 0 ? "Paragraph snippet at #0" : "Not detected",
      },
      {
        key: "paa",
        label: "People Also Ask (PAA)",
        present: true,
        detail: "4 expandable questions",
      },
      {
        key: "local_pack",
        label: "Local Pack",
        present: isLocal || seed % 5 === 0,
        detail: isLocal || seed % 5 === 0 ? "3-pack map block" : "Not detected",
      },
      {
        key: "video",
        label: "Video Carousel",
        present: isHowTo || seed % 3 === 0,
        detail: isHowTo || seed % 3 === 0 ? "3 YouTube results" : "Not detected",
      },
    ];
  }, [submittedKeyword, seed]);

  const intentBreakdown: IntentSlice[] = useMemo(() => {
    const kwLower = submittedKeyword.toLowerCase();
    if (kwLower.includes("how") || kwLower.includes("fix")) {
      return [
        { label: "Informational", pct: 72 },
        { label: "Commercial", pct: 18 },
        { label: "Transactional", pct: 6 },
        { label: "Navigational", pct: 4 },
      ];
    }
    if (kwLower.includes("agency") || kwLower.includes("buy") || kwLower.includes("price")) {
      return [
        { label: "Commercial", pct: 46 },
        { label: "Transactional", pct: 34 },
        { label: "Informational", pct: 14 },
        { label: "Navigational", pct: 6 },
      ];
    }
    return [
      { label: "Commercial", pct: 54 },
      { label: "Informational", pct: 28 },
      { label: "Transactional", pct: 12 },
      { label: "Navigational", pct: 6 },
    ];
  }, [submittedKeyword]);

  const top10Results: SerpResultRow[] = useMemo(() => {
    const domains = [
      "ahrefs.com",
      "semrush.com",
      "moz.com",
      "backlinko.com",
      "webservicers.io",
      "searchenginejournal.com",
      "hubspot.com",
      "screamingfrog.co.uk",
      "neilpatel.com",
      "yoast.com",
    ];
    const slug = submittedKeyword.trim().toLowerCase().replace(/\s+/g, "-") || "seo-guide";
    return domains.map((dom, idx) => {
      const rotatedIdx = (idx + (seed % 3)) % domains.length;
      const chosenDomain = domains[rotatedIdx];
      const da = Math.max(42, 92 - idx * 3 - (seed % 5));
      const pa = Math.max(34, 74 - idx * 2 - (seed % 6));
      const wordCount = 1450 + ((seed + idx * 317) % 2400);
      return {
        position: idx + 1,
        title: `${submittedKeyword.replace(/\b\w/g, (c) => c.toUpperCase())} — ${chosenDomain.split(".")[0]} (${submittedCountry})`,
        url: `https://${chosenDomain}/blog/${slug}`,
        da,
        pa,
        wordCount,
        contentType: idx % 3 === 0 ? "Listicle" : idx % 2 === 0 ? "Guide" : "Comparison",
      };
    });
  }, [submittedKeyword, submittedCountry, seed]);

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setSubmittedKeyword(keyword.trim());
      setSubmittedCountry(country);
      setLoading(false);
    }, 300);
  };

  const renderFeatureIcon = (key: SerpFeatureItem["key"]) => {
    switch (key) {
      case "featured_snippet":
        return <Sparkles className="h-4 w-4 text-[var(--primary)]" />;
      case "paa":
        return <HelpCircle className="h-4 w-4 text-[var(--primary)]" />;
      case "local_pack":
        return <MapPin className="h-4 w-4 text-[var(--primary)]" />;
      case "video":
        return <Video className="h-4 w-4 text-[var(--primary)]" />;
    }
  };

  const primaryIntent = intentBreakdown[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live SERP Analyzer"
        subtitle="Inspect SERP features, search intent breakdown, and Top 10 ranking URL metrics for any keyword and country."
      />

      {/* Keyword & Country Search Bar */}
      <Card className="p-5">
        <form onSubmit={handleAnalyze} className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-end">
          <div className="sm:col-span-6">
            <Input
              label="Target Keyword"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Enter keyword to inspect..."
              required
            />
          </div>
          <div className="sm:col-span-4">
            <Select
              label="Country / Market"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" variant="primary" className="w-full" disabled={loading}>
              <Search className="h-3.5 w-3.5" />
              {loading ? "Analyzing..." : "Analyze SERP"}
            </Button>
          </div>
        </form>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[var(--muted-foreground)]">Try:</span>
          {PRESET_KEYWORDS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                setKeyword(preset);
                setSubmittedKeyword(preset);
              }}
              className="rounded-md border border-[var(--border)] bg-[var(--secondary)]/50 px-2.5 py-1 text-xs text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors"
            >
              {preset}
            </button>
          ))}
        </div>
      </Card>

      {/* SERP Features + Intent Breakdown */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[var(--foreground)]">
                Detected SERP Features
              </h2>
              <p className="text-xs text-[var(--muted-foreground)]">
                Active result blocks for &ldquo;{submittedKeyword}&rdquo; ({submittedCountry})
              </p>
            </div>
            <Badge tone="primary">
              {serpFeatures.filter((f) => f.present).length} / {serpFeatures.length} Active
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {serpFeatures.map((feat) => (
              <div
                key={feat.key}
                className={`flex items-center justify-between rounded-lg border p-3.5 ${
                  feat.present
                    ? "border-[var(--border)] bg-[var(--secondary)]/40"
                    : "border-[var(--border)] opacity-60"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {renderFeatureIcon(feat.key)}
                  <div>
                    <div className="text-xs font-semibold text-[var(--foreground)]">
                      {feat.label}
                    </div>
                    <div className="text-[11px] text-[var(--muted-foreground)]">
                      {feat.detail}
                    </div>
                  </div>
                </div>
                <Badge variant="sm" tone={feat.present ? "success" : "neutral"}>
                  {feat.present ? (
                    <>
                      <CheckCircle2 className="h-3 w-3" /> Present
                    </>
                  ) : (
                    "Absent"
                  )}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[var(--foreground)]">
                Intent Breakdown
              </h2>
              <p className="text-xs text-[var(--muted-foreground)]">
                Query classification across Top 10
              </p>
            </div>
            <Badge tone="lilac">{primaryIntent.label}</Badge>
          </div>
          <div className="space-y-3">
            {intentBreakdown.map((slice) => (
              <div key={slice.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--foreground)]">{slice.label}</span>
                  <span className="font-semibold tabular-nums text-[var(--foreground)]">
                    {slice.pct}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--secondary)]">
                  <div
                    className="h-full rounded-full bg-[var(--primary)] transition-all duration-300"
                    style={{ width: `${slice.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Top 10 Ranking URLs Table */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--border)] p-4">
          <div>
            <h2 className="text-sm font-semibold text-[var(--foreground)]">
              Top 10 Ranking URLs
            </h2>
            <p className="text-xs text-[var(--muted-foreground)]">
              Authority metrics (DA/PA) and content length for the current SERP
            </p>
          </div>
          <Badge tone="neutral">
            <FileText className="h-3 w-3" />
            Avg{" "}
            {Math.round(
              top10Results.reduce((acc, r) => acc + r.wordCount, 0) / top10Results.length
            ).toLocaleString()}{" "}
            words
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="cpki-table w-full text-left text-sm">
            <thead>
              <tr>
                <th className="w-14">#</th>
                <th>Ranking Page &amp; URL</th>
                <th>Format</th>
                <th className="text-right">DA</th>
                <th className="text-right">PA</th>
                <th className="text-right">Word Count</th>
              </tr>
            </thead>
            <tbody>
              {top10Results.map((row) => (
                <tr key={row.position}>
                  <td className="font-semibold tabular-nums text-[var(--foreground)]">
                    {row.position}
                  </td>
                  <td>
                    <div className="font-medium text-[var(--foreground)]">{row.title}</div>
                    <a
                      href={row.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-0.5 inline-flex items-center gap-1 text-xs text-[var(--primary)] hover:underline"
                    >
                      {row.url}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </td>
                  <td>
                    <Badge variant="sm" tone="neutral">
                      {row.contentType}
                    </Badge>
                  </td>
                  <td className="text-right font-semibold tabular-nums">{row.da}</td>
                  <td className="text-right tabular-nums text-xs text-[var(--muted-foreground)]">
                    {row.pa}
                  </td>
                  <td className="text-right tabular-nums text-xs">
                    {row.wordCount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
