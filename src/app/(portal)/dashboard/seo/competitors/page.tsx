"use client";

import React, { useMemo, useState } from "react";
import {
  ArrowUpRight,
  BarChart3,
  Globe,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type GapCategory = "All" | "Missing" | "Shared";

interface KeywordOpportunity {
  keyword: string;
  volume: number;
  kd: number;
  yourRank: number | null;
  competitorRanks: number[];
  category: "Missing" | "Shared";
  cpc: string;
}

interface DomainProfile {
  domain: string;
  isSelf?: boolean;
  dr: number;
  refDomains: number;
  organicKeywords: number;
  organicTraffic: number;
  trafficValue: string;
}

const BASE_KEYWORDS: Omit<KeywordOpportunity, "competitorRanks">[] = [
  {
    keyword: "ai seo automation platform",
    volume: 5400,
    kd: 42,
    yourRank: null,
    category: "Missing",
    cpc: "$8.40",
  },
  {
    keyword: "enterprise rank tracker api",
    volume: 2900,
    kd: 51,
    yourRank: null,
    category: "Missing",
    cpc: "$11.20",
  },
  {
    keyword: "local citation audit tool",
    volume: 3600,
    kd: 34,
    yourRank: 6,
    category: "Shared",
    cpc: "$6.10",
  },
  {
    keyword: "llm brand visibility checker",
    volume: 4200,
    kd: 29,
    yourRank: null,
    category: "Missing",
    cpc: "$7.80",
  },
  {
    keyword: "technical seo site audit checklist",
    volume: 8100,
    kd: 48,
    yourRank: 4,
    category: "Shared",
    cpc: "$4.90",
  },
  {
    keyword: "competitor keyword gap analysis",
    volume: 6700,
    kd: 56,
    yourRank: 9,
    category: "Shared",
    cpc: "$9.30",
  },
  {
    keyword: "automated backlink monitoring",
    volume: 2400,
    kd: 39,
    yourRank: null,
    category: "Missing",
    cpc: "$7.15",
  },
];

function hashDomain(domain: string): number {
  let h = 0;
  for (let i = 0; i < domain.length; i += 1) {
    h = (h * 31 + domain.charCodeAt(i)) % 10000;
  }
  return h;
}

function buildDomainProfile(domain: string, isSelf = false): DomainProfile {
  if (isSelf) {
    return {
      domain,
      isSelf: true,
      dr: 68,
      refDomains: 2840,
      organicKeywords: 14200,
      organicTraffic: 84500,
      trafficValue: "$112,400",
    };
  }
  const h = hashDomain(domain);
  const dr = 58 + (h % 34);
  const refDomains = 1900 + (h % 9500);
  const organicKeywords = 11000 + (h % 48000);
  const organicTraffic = 45000 + (h % 210000);
  const trafficValue = `$${Math.round(organicTraffic * 1.35).toLocaleString()}`;
  return {
    domain,
    dr,
    refDomains,
    organicKeywords,
    organicTraffic,
    trafficValue,
  };
}

export default function CompetitorsPage() {
  const [domain, setDomain] = useState("webservicers.io");
  const [competitors, setCompetitors] = useState<string[]>([
    "ahrefs.com",
    "semrush.com",
  ]);
  const [newCompetitor, setNewCompetitor] = useState("");
  const [gapFilter, setGapFilter] = useState<GapCategory>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [analyzedNonce, setAnalyzedNonce] = useState(0);

  const profiles = useMemo(() => {
    void analyzedNonce;
    const selfProfile = buildDomainProfile(domain.trim() || "webservicers.io", true);
    const compProfiles = competitors.map((c) => buildDomainProfile(c));
    return [selfProfile, ...compProfiles];
  }, [domain, competitors, analyzedNonce]);

  const maxTraffic = useMemo(
    () => Math.max(...profiles.map((p) => p.organicTraffic), 1),
    [profiles]
  );

  const keywordRows: KeywordOpportunity[] = useMemo(() => {
    return BASE_KEYWORDS.map((kw, idx) => ({
      ...kw,
      competitorRanks: competitors.map((comp, cIdx) => {
        const h = hashDomain(comp + kw.keyword);
        return ((h + idx * 3 + cIdx * 2) % 12) + 1;
      }),
    }));
  }, [competitors]);

  const filteredKeywords = useMemo(() => {
    return keywordRows.filter((row) => {
      if (gapFilter !== "All" && row.category !== gapFilter) return false;
      if (searchQuery.trim()) {
        return row.keyword.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true;
    });
  }, [keywordRows, gapFilter, searchQuery]);

  const missingCount = keywordRows.filter((k) => k.category === "Missing").length;
  const sharedCount = keywordRows.filter((k) => k.category === "Shared").length;

  const handleAddCompetitor = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = newCompetitor.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!cleaned || competitors.length >= 3 || competitors.includes(cleaned)) return;
    setCompetitors((prev) => [...prev, cleaned]);
    setNewCompetitor("");
  };

  const handleRemoveCompetitor = (comp: string) => {
    setCompetitors((prev) => prev.filter((c) => c !== comp));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Competitor Gap Analyzer"
        subtitle="Compare keyword opportunities, organic traffic, and Domain Rating against up to 3 competitors."
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setAnalyzedNonce((n) => n + 1)}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Analyze Gap
          </Button>
        }
      />

      {/* Domain + Competitor Inputs */}
      <Card className="p-5">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-4">
            <Input
              label="Your Domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="yourdomain.com"
            />
          </div>
          <form onSubmit={handleAddCompetitor} className="lg:col-span-5 flex items-end gap-2">
            <div className="flex-1">
              <Input
                label={`Add Competitor (${competitors.length}/3)`}
                value={newCompetitor}
                onChange={(e) => setNewCompetitor(e.target.value)}
                placeholder="competitor.com"
                disabled={competitors.length >= 3}
              />
            </div>
            <Button
              type="submit"
              variant="outline"
              size="sm"
              disabled={competitors.length >= 3 || !newCompetitor.trim()}
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          </form>
          <div className="lg:col-span-3 flex flex-wrap gap-1.5">
            {competitors.map((comp) => (
              <Badge key={comp} tone="neutral" className="gap-1.5 py-1">
                <Globe className="h-3 w-3 text-[var(--primary)]" />
                {comp}
                <button
                  type="button"
                  onClick={() => handleRemoveCompetitor(comp)}
                  className="ml-0.5 text-[var(--muted-foreground)] hover:text-[var(--destructive)]"
                  aria-label={`Remove ${comp}`}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      </Card>

      {/* Organic Traffic Comparison + Domain Rating Gap Table */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[var(--foreground)]">
                Organic Traffic Comparison
              </h2>
              <p className="text-xs text-[var(--muted-foreground)]">
                Estimated monthly organic visits
              </p>
            </div>
            <BarChart3 className="h-4 w-4 text-[var(--primary)]" />
          </div>
          <div className="space-y-3.5">
            {profiles.map((p) => {
              const pct = Math.round((p.organicTraffic / maxTraffic) * 100);
              return (
                <div key={p.domain} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className={p.isSelf ? "font-semibold text-[var(--foreground)]" : "text-[var(--muted-foreground)]"}>
                      {p.domain} {p.isSelf ? "(You)" : ""}
                    </span>
                    <span className="font-semibold tabular-nums text-[var(--foreground)]">
                      {p.organicTraffic.toLocaleString()}/mo
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--secondary)]">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        p.isSelf ? "bg-[var(--primary)]" : "bg-[var(--muted-foreground)]/50"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="overflow-hidden lg:col-span-3">
          <div className="border-b border-[var(--border)] p-4">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">
              Domain Rating Gap Table
            </h2>
            <p className="text-xs text-[var(--muted-foreground)]">
              Authority and backlink footprint relative to your domain.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="cpki-table w-full text-left text-sm">
              <thead>
                <tr>
                  <th>Domain</th>
                  <th className="text-right">DR</th>
                  <th className="text-right">Ref. Domains</th>
                  <th className="text-right">Keywords</th>
                  <th className="text-right">Traffic Value</th>
                  <th className="text-right">DR Gap</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((p) => {
                  const selfDr = profiles[0]?.dr ?? 68;
                  const gap = p.dr - selfDr;
                  return (
                    <tr key={p.domain}>
                      <td className="font-medium text-[var(--foreground)]">
                        {p.domain}{" "}
                        {p.isSelf && (
                          <Badge tone="primary" variant="sm" className="ml-1">
                            You
                          </Badge>
                        )}
                      </td>
                      <td className="text-right font-semibold tabular-nums">{p.dr}</td>
                      <td className="text-right tabular-nums text-xs text-[var(--muted-foreground)]">
                        {p.refDomains.toLocaleString()}
                      </td>
                      <td className="text-right tabular-nums text-xs text-[var(--muted-foreground)]">
                        {p.organicKeywords.toLocaleString()}
                      </td>
                      <td className="text-right tabular-nums text-xs font-medium">
                        {p.trafficValue}
                      </td>
                      <td className="text-right">
                        {p.isSelf ? (
                          <span className="text-xs text-[var(--muted-foreground)]">—</span>
                        ) : (
                          <Badge
                            variant="sm"
                            tone={gap > 0 ? "danger" : gap < 0 ? "success" : "neutral"}
                          >
                            {gap > 0 ? `+${gap}` : gap}
                          </Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Shared vs Missing Keyword Opportunities */}
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[var(--border)] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[var(--foreground)]">
              Keyword Opportunities (Shared vs Missing)
            </h2>
            <p className="text-xs text-[var(--muted-foreground)]">
              {missingCount} missing keywords competitors rank for &bull; {sharedCount} shared keywords
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(["All", "Missing", "Shared"] as const).map((tab) => (
              <Button
                key={tab}
                size="xs"
                variant={gapFilter === tab ? "primary" : "outline"}
                onClick={() => setGapFilter(tab)}
              >
                {tab}
              </Button>
            ))}
            <div className="relative w-52">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[var(--muted-foreground)]" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search keywords..."
                className="pl-8"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="cpki-table w-full text-left text-sm">
            <thead>
              <tr>
                <th>Keyword</th>
                <th>Type</th>
                <th className="text-right">Volume</th>
                <th className="text-right">KD</th>
                <th className="text-right">CPC</th>
                <th className="text-right">Your Rank</th>
                {competitors.map((comp) => (
                  <th key={comp} className="text-right">
                    {comp}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredKeywords.map((kw) => (
                <tr key={kw.keyword}>
                  <td className="font-medium text-[var(--foreground)]">
                    <span className="inline-flex items-center gap-1.5">
                      {kw.keyword}
                      <ArrowUpRight className="h-3 w-3 text-[var(--muted-foreground)]" />
                    </span>
                  </td>
                  <td>
                    <Badge
                      variant="sm"
                      tone={kw.category === "Missing" ? "warning" : "success"}
                    >
                      {kw.category}
                    </Badge>
                  </td>
                  <td className="text-right tabular-nums text-xs">
                    {kw.volume.toLocaleString()}
                  </td>
                  <td className="text-right tabular-nums text-xs">{kw.kd}</td>
                  <td className="text-right tabular-nums text-xs text-[var(--muted-foreground)]">
                    {kw.cpc}
                  </td>
                  <td className="text-right tabular-nums text-xs">
                    {kw.yourRank ? (
                      <Badge variant="sm" tone="primary">
                        #{kw.yourRank}
                      </Badge>
                    ) : (
                      <span className="text-[var(--muted-foreground)]">—</span>
                    )}
                  </td>
                  {kw.competitorRanks.map((rank, i) => (
                    <td key={`${kw.keyword}-${i}`} className="text-right tabular-nums text-xs">
                      #{rank}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
