"use client";

import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ExternalLink,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type CitationStatus = "Match" | "Mismatch" | "Missing";

interface CanonicalNap {
  name: string;
  address: string;
  phone: string;
}

interface DirectoryCitation {
  id: string;
  directory: string;
  category: string;
  url: string;
  listedName: string;
  listedAddress: string;
  listedPhone: string;
  status: CitationStatus;
  lastSynced: string;
}

const INITIAL_NAP: CanonicalNap = {
  name: "WebServicers Digital HQ",
  address: "500 Congress Ave, Suite 1400, Austin, TX 78701",
  phone: "+1 (512) 555-0194",
};

const INITIAL_DIRECTORIES: DirectoryCitation[] = [
  {
    id: "gbp",
    directory: "Google Business Profile",
    category: "Primary Search & Maps",
    url: "https://business.google.com",
    listedName: "WebServicers Digital HQ",
    listedAddress: "500 Congress Ave, Suite 1400, Austin, TX 78701",
    listedPhone: "+1 (512) 555-0194",
    status: "Match",
    lastSynced: "2 hours ago",
  },
  {
    id: "bing",
    directory: "Bing Places",
    category: "Search Engine",
    url: "https://www.bingplaces.com",
    listedName: "WebServicers Digital HQ",
    listedAddress: "500 Congress Ave, Ste 1400, Austin, TX 78701",
    listedPhone: "+1 (512) 555-0100",
    status: "Mismatch",
    lastSynced: "14 days ago",
  },
  {
    id: "apple",
    directory: "Apple Maps",
    category: "Navigation & iOS",
    url: "https://businessconnect.apple.com",
    listedName: "WebServicers Digital HQ",
    listedAddress: "500 Congress Ave, Suite 1400, Austin, TX 78701",
    listedPhone: "+1 (512) 555-0194",
    status: "Match",
    lastSynced: "1 day ago",
  },
  {
    id: "yelp",
    directory: "Yelp",
    category: "Reviews & Local",
    url: "https://biz.yelp.com",
    listedName: "WebServicers Agency",
    listedAddress: "500 Congress Ave, Austin, TX 78701",
    listedPhone: "+1 (512) 555-0194",
    status: "Mismatch",
    lastSynced: "9 days ago",
  },
  {
    id: "facebook",
    directory: "Facebook",
    category: "Social Directory",
    url: "https://www.facebook.com",
    listedName: "WebServicers Digital HQ",
    listedAddress: "500 Congress Ave, Suite 1400, Austin, TX 78701",
    listedPhone: "+1 (512) 555-0194",
    status: "Match",
    lastSynced: "5 hours ago",
  },
  {
    id: "foursquare",
    directory: "Foursquare",
    category: "Location Data Aggregator",
    url: "https://foursquare.com",
    listedName: "",
    listedAddress: "",
    listedPhone: "",
    status: "Missing",
    lastSynced: "Never",
  },
];

function computeStatus(dir: DirectoryCitation, nap: CanonicalNap): CitationStatus {
  if (!dir.listedName && !dir.listedAddress && !dir.listedPhone) {
    return "Missing";
  }
  const normalize = (v: string) => v.trim().toLowerCase();
  const isMatch =
    normalize(dir.listedName) === normalize(nap.name) &&
    normalize(dir.listedAddress) === normalize(nap.address) &&
    normalize(dir.listedPhone) === normalize(nap.phone);
  return isMatch ? "Match" : "Mismatch";
}

export default function CitationsPage() {
  const [nap, setNap] = useState<CanonicalNap>(INITIAL_NAP);
  const [draftNap, setDraftNap] = useState<CanonicalNap>(INITIAL_NAP);
  const [editingNap, setEditingNap] = useState(false);
  const [directories, setDirectories] = useState<DirectoryCitation[]>(INITIAL_DIRECTORIES);
  const [filter, setFilter] = useState<"All" | CitationStatus>("All");
  const [query, setQuery] = useState("");
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);

  const evaluatedDirectories = useMemo(
    () =>
      directories.map((d) => ({
        ...d,
        status: computeStatus(d, nap),
      })),
    [directories, nap]
  );

  const stats = useMemo(() => {
    const total = evaluatedDirectories.length;
    const matched = evaluatedDirectories.filter((d) => d.status === "Match").length;
    const mismatched = evaluatedDirectories.filter((d) => d.status === "Mismatch").length;
    const missing = evaluatedDirectories.filter((d) => d.status === "Missing").length;
    const score = total > 0 ? Math.round((matched / total) * 100) : 0;
    return { total, matched, mismatched, missing, score };
  }, [evaluatedDirectories]);

  const filteredDirectories = useMemo(() => {
    return evaluatedDirectories.filter((d) => {
      if (filter !== "All" && d.status !== filter) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        return (
          d.directory.toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q) ||
          d.listedAddress.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [evaluatedDirectories, filter, query]);

  const handleSaveNap = (e: React.FormEvent) => {
    e.preventDefault();
    setNap({
      name: draftNap.name.trim() || INITIAL_NAP.name,
      address: draftNap.address.trim() || INITIAL_NAP.address,
      phone: draftNap.phone.trim() || INITIAL_NAP.phone,
    });
    setEditingNap(false);
  };

  const handleSyncCitation = (id: string) => {
    setSyncingId(id);
    setTimeout(() => {
      setDirectories((prev) =>
        prev.map((d) =>
          d.id === id
            ? {
                ...d,
                listedName: nap.name,
                listedAddress: nap.address,
                listedPhone: nap.phone,
                status: "Match",
                lastSynced: "Just now",
              }
            : d
        )
      );
      setSyncingId(null);
    }, 350);
  };

  const handleSyncAll = () => {
    setSyncingAll(true);
    setTimeout(() => {
      setDirectories((prev) =>
        prev.map((d) => ({
          ...d,
          listedName: nap.name,
          listedAddress: nap.address,
          listedPhone: nap.phone,
          status: "Match",
          lastSynced: "Just now",
        }))
      );
      setSyncingAll(false);
    }, 450);
  };

  const renderStatusBadge = (status: CitationStatus) => {
    if (status === "Match") {
      return (
        <Badge tone="success">
          <CheckCircle2 className="h-3 w-3" />
          Match
        </Badge>
      );
    }
    if (status === "Mismatch") {
      return (
        <Badge tone="warning">
          <AlertTriangle className="h-3 w-3" />
          Mismatch
        </Badge>
      );
    }
    return (
      <Badge tone="danger">
        <XCircle className="h-3 w-3" />
        Missing
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Local Citations & NAP Tracker"
        subtitle="Monitor canonical Name, Address, and Phone consistency across major local directories."
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={handleSyncAll}
            disabled={syncingAll || stats.matched === stats.total}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncingAll ? "animate-spin" : ""}`} />
            {syncingAll ? "Syncing All..." : "Sync All Citations"}
          </Button>
        }
      />

      {/* Business NAP Card + Consistency Summary */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-[var(--foreground)]">
                Canonical Business NAP
              </h2>
              <p className="text-xs text-[var(--muted-foreground)]">
                Source of truth used to validate and sync external directory listings.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDraftNap(nap);
                setEditingNap((prev) => !prev);
              }}
            >
              {editingNap ? "Cancel" : "Edit NAP"}
            </Button>
          </div>

          {editingNap ? (
            <form onSubmit={handleSaveNap} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Input
                label="Business Name"
                value={draftNap.name}
                onChange={(e) => setDraftNap((p) => ({ ...p, name: e.target.value }))}
                required
              />
              <Input
                label="Street Address"
                value={draftNap.address}
                onChange={(e) => setDraftNap((p) => ({ ...p, address: e.target.value }))}
                required
              />
              <Input
                label="Phone Number"
                value={draftNap.phone}
                onChange={(e) => setDraftNap((p) => ({ ...p, phone: e.target.value }))}
                required
              />
              <div className="sm:col-span-3 flex justify-end gap-2 pt-1">
                <Button type="submit" size="sm" variant="primary">
                  Save &amp; Re-check
                </Button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-[var(--border)] bg-[var(--secondary)]/40 p-3.5">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--muted-foreground)]">
                  <Building2 className="h-3.5 w-3.5 text-[var(--primary)]" />
                  Business Name
                </div>
                <p className="mt-1.5 text-sm font-semibold text-[var(--foreground)]">
                  {nap.name}
                </p>
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--secondary)]/40 p-3.5">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--muted-foreground)]">
                  <MapPin className="h-3.5 w-3.5 text-[var(--primary)]" />
                  Address
                </div>
                <p className="mt-1.5 text-sm font-semibold text-[var(--foreground)]">
                  {nap.address}
                </p>
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--secondary)]/40 p-3.5">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--muted-foreground)]">
                  <Phone className="h-3.5 w-3.5 text-[var(--primary)]" />
                  Phone
                </div>
                <p className="mt-1.5 text-sm font-semibold tabular-nums text-[var(--foreground)]">
                  {nap.phone}
                </p>
              </div>
            </div>
          )}
        </Card>

        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[var(--foreground)]">
              NAP Consistency Score
            </span>
            <Badge tone={stats.score === 100 ? "success" : stats.score >= 70 ? "warning" : "danger"}>
              {stats.score}%
            </Badge>
          </div>
          <div className="my-3 h-2.5 w-full overflow-hidden rounded-full bg-[var(--secondary)]">
            <div
              className="h-full rounded-full bg-[var(--primary)] transition-all duration-300"
              style={{ width: `${stats.score}%` }}
            />
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-md bg-[var(--success-subtle)] px-2 py-2">
              <div className="text-base font-bold tabular-nums text-[var(--success)]">
                {stats.matched}
              </div>
              <div className="text-[11px] text-[var(--muted-foreground)]">Matched</div>
            </div>
            <div className="rounded-md bg-[var(--warning-subtle)] px-2 py-2">
              <div className="text-base font-bold tabular-nums text-[var(--warning)]">
                {stats.mismatched}
              </div>
              <div className="text-[11px] text-[var(--muted-foreground)]">Mismatch</div>
            </div>
            <div className="rounded-md bg-[var(--danger-subtle)] px-2 py-2">
              <div className="text-base font-bold tabular-nums text-[var(--destructive)]">
                {stats.missing}
              </div>
              <div className="text-[11px] text-[var(--muted-foreground)]">Missing</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Directory Consistency Table */}
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[var(--border)] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            {(["All", "Match", "Mismatch", "Missing"] as const).map((tab) => (
              <Button
                key={tab}
                size="xs"
                variant={filter === tab ? "primary" : "outline"}
                onClick={() => setFilter(tab)}
              >
                {tab}
              </Button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[var(--muted-foreground)]" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter directories..."
              className="pl-8"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="cpki-table w-full text-left text-sm">
            <thead>
              <tr>
                <th>Directory</th>
                <th>Listed Name</th>
                <th>Listed Address</th>
                <th>Listed Phone</th>
                <th>Status</th>
                <th>Last Synced</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredDirectories.map((dir) => {
                const isSyncing = syncingId === dir.id;
                const nameMatches =
                  dir.listedName.trim().toLowerCase() === nap.name.trim().toLowerCase();
                const addrMatches =
                  dir.listedAddress.trim().toLowerCase() === nap.address.trim().toLowerCase();
                const phoneMatches =
                  dir.listedPhone.trim().toLowerCase() === nap.phone.trim().toLowerCase();

                return (
                  <tr key={dir.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="font-medium text-[var(--foreground)]">
                            {dir.directory}
                          </div>
                          <div className="text-[11px] text-[var(--muted-foreground)]">
                            {dir.category}
                          </div>
                        </div>
                        <a
                          href={dir.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                          title={`Open ${dir.directory}`}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </td>
                    <td
                      className={
                        dir.status === "Missing"
                          ? "text-xs italic text-[var(--muted-foreground)]"
                          : nameMatches
                            ? "text-xs text-[var(--foreground)]"
                            : "text-xs font-medium text-[var(--warning)]"
                      }
                    >
                      {dir.listedName || "Not listed"}
                    </td>
                    <td
                      className={
                        dir.status === "Missing"
                          ? "text-xs italic text-[var(--muted-foreground)]"
                          : addrMatches
                            ? "text-xs text-[var(--foreground)]"
                            : "text-xs font-medium text-[var(--warning)]"
                      }
                    >
                      {dir.listedAddress || "Not listed"}
                    </td>
                    <td
                      className={`tabular-nums ${
                        dir.status === "Missing"
                          ? "text-xs italic text-[var(--muted-foreground)]"
                          : phoneMatches
                            ? "text-xs text-[var(--foreground)]"
                            : "text-xs font-medium text-[var(--warning)]"
                      }`}
                    >
                      {dir.listedPhone || "Not listed"}
                    </td>
                    <td>{renderStatusBadge(dir.status)}</td>
                    <td className="text-xs text-[var(--muted-foreground)]">
                      {dir.lastSynced}
                    </td>
                    <td className="text-right">
                      <Button
                        size="xs"
                        variant={dir.status === "Match" ? "outline" : "primary"}
                        disabled={isSyncing || dir.status === "Match"}
                        onClick={() => handleSyncCitation(dir.id)}
                      >
                        <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin" : ""}`} />
                        {dir.status === "Match"
                          ? "Synced"
                          : isSyncing
                            ? "Syncing..."
                            : "Sync Citation"}
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {filteredDirectories.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="py-8 text-center text-xs text-[var(--muted-foreground)]"
                  >
                    No directories match the current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
