"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, MapPin, RefreshCw, XCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { fetchSeoWithFallback } from "../_lib/seo-client";

interface NapCheckItem {
  directory: string;
  nameMatch: boolean;
  addressMatch: boolean;
  phoneMatch: boolean;
  status: "Consistent" | "Mismatch";
}

interface LocalPackKeyword {
  keyword: string;
  city: string;
  packPosition: number;
  avgGridRank: number;
  reviewsCount: number;
  rating: number;
}

interface LocalSeoData {
  businessName: string;
  primaryCategory: string;
  gridSize: string;
  gridRanks: number[];
  napChecks: NapCheckItem[];
  localPack: LocalPackKeyword[];
}

const DEMO_LOCAL_SEO: LocalSeoData = {
  businessName: "WebServicers Digital HQ",
  primaryCategory: "Internet Marketing Service",
  gridSize: "5x5 (10km radius)",
  gridRanks: [1, 2, 1, 3, 4, 2, 1, 1, 2, 5, 3, 2, 1, 3, 6, 4, 3, 2, 4, 7, 6, 5, 4, 5, 8],
  napChecks: [
    { directory: "Google Business Profile", nameMatch: true, addressMatch: true, phoneMatch: true, status: "Consistent" },
    { directory: "Apple Business Connect", nameMatch: true, addressMatch: true, phoneMatch: true, status: "Consistent" },
    { directory: "Bing Places", nameMatch: true, addressMatch: true, phoneMatch: false, status: "Mismatch" },
    { directory: "Yelp", nameMatch: true, addressMatch: true, phoneMatch: true, status: "Consistent" },
    { directory: "Clutch", nameMatch: true, addressMatch: false, phoneMatch: true, status: "Mismatch" },
  ],
  localPack: [
    { keyword: "seo agency near me", city: "Austin, TX", packPosition: 1, avgGridRank: 2.3, reviewsCount: 148, rating: 4.9 },
    { keyword: "technical seo consultant", city: "Austin, TX", packPosition: 2, avgGridRank: 3.1, reviewsCount: 148, rating: 4.9 },
    { keyword: "ai marketing automation", city: "Austin, TX", packPosition: 3, avgGridRank: 3.8, reviewsCount: 148, rating: 4.9 },
  ],
};

export default function LocalSeoPage() {
  const [data, setData] = useState<LocalSeoData>(DEMO_LOCAL_SEO);
  const [loading, setLoading] = useState(false);
  const [isDemo, setIsDemo] = useState(true);

  const loadLocal = async () => {
    setLoading(true);
    const res = await fetchSeoWithFallback<LocalSeoData>("/api/seo/local-seo", DEMO_LOCAL_SEO);
    setData(res.data);
    setIsDemo(!res.fromApi);
    setLoading(false);
  };

  useEffect(() => {
    void loadLocal();
  }, []);

  const getPinTone = (rank: number) => {
    if (rank <= 3) return "bg-[var(--success-subtle)] text-[var(--success)] border-[var(--insight-border)]";
    if (rank <= 5) return "bg-[var(--warning-subtle)] text-[var(--warning)] border-[var(--border)]";
    return "bg-[var(--danger-subtle)] text-[var(--destructive)] border-[var(--border)]";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Local SEO &amp; GMB Rankings"
        subtitle={`Geo-grid rankings, Local Pack positions, and NAP consistency for ${data.businessName}.`}
        actions={
          <>
            {isDemo ? <Badge tone="lilac">Demo Data</Badge> : <Badge tone="success">Live API</Badge>}
            <Button variant="outline" size="sm" onClick={loadLocal} disabled={loading}>
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh Grid
            </Button>
          </>
        }
      />

      {/* Geo-Grid + Local Pack */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="cpki-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">GMB Geo-Grid Map</h2>
              <p className="text-xs text-[var(--muted-foreground)]">{data.gridSize}</p>
            </div>
            <Badge tone="primary">
              <MapPin className="h-3 w-3" /> Austin, TX
            </Badge>
          </div>
          <div className="grid grid-cols-5 gap-2 py-2">
            {data.gridRanks.map((rank, idx) => (
              <div
                key={idx}
                className={`flex h-10 items-center justify-center rounded-md border text-xs font-semibold tabular-nums ${getPinTone(rank)}`}
                title={`Grid point #${idx + 1}: Rank ${rank}`}
              >
                {rank}
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-[var(--muted-foreground)]">
            <span>1–3: Top Pack</span>
            <span>4–5: Mid</span>
            <span>6+: Low Visibility</span>
          </div>
        </div>

        <div className="cpki-card overflow-hidden lg:col-span-2">
          <div className="border-b border-[var(--border)] px-4 py-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Local Pack Positions</h2>
            <Badge tone="neutral">{data.primaryCategory}</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="cpki-table">
              <thead>
                <tr>
                  <th>Local Keyword</th>
                  <th>Market</th>
                  <th>Pack Pos</th>
                  <th>Avg Grid Rank</th>
                  <th>GMB Rating</th>
                </tr>
              </thead>
              <tbody>
                {data.localPack.map((lp) => (
                  <tr key={lp.keyword}>
                    <td className="font-medium">{lp.keyword}</td>
                    <td className="text-xs text-[var(--muted-foreground)]">{lp.city}</td>
                    <td>
                      <Badge tone={lp.packPosition <= 3 ? "success" : "warning"}>#{lp.packPosition}</Badge>
                    </td>
                    <td className="tabular-nums text-xs">{lp.avgGridRank.toFixed(1)}</td>
                    <td className="text-xs tabular-nums">
                      {lp.rating} ★ ({lp.reviewsCount})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* NAP Consistency */}
      <div className="cpki-card overflow-hidden">
        <div className="border-b border-[var(--border)] px-4 py-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">NAP Consistency Check (Name, Address, Phone)</h2>
          <Badge tone="primary">
            {data.napChecks.filter((n) => n.status === "Consistent").length}/{data.napChecks.length} Consistent
          </Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="cpki-table">
            <thead>
              <tr>
                <th>Directory</th>
                <th>Business Name</th>
                <th>Address</th>
                <th>Phone</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.napChecks.map((nap) => (
                <tr key={nap.directory}>
                  <td className="font-medium">{nap.directory}</td>
                  <td>
                    {nap.nameMatch ? (
                      <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />
                    ) : (
                      <XCircle className="h-4 w-4 text-[var(--destructive)]" />
                    )}
                  </td>
                  <td>
                    {nap.addressMatch ? (
                      <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />
                    ) : (
                      <XCircle className="h-4 w-4 text-[var(--destructive)]" />
                    )}
                  </td>
                  <td>
                    {nap.phoneMatch ? (
                      <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />
                    ) : (
                      <XCircle className="h-4 w-4 text-[var(--destructive)]" />
                    )}
                  </td>
                  <td>
                    <Badge tone={nap.status === "Consistent" ? "success" : "warning"}>{nap.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
