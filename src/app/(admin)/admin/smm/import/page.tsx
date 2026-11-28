'use client';

import * as React from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Select } from '@/components/ui/Input';
import {
  DownloadCloud,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter,
  Sliders,
  DollarSign,
  Percent,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckSquare,
  Square,
  Sparkles,
} from 'lucide-react';

interface UpstreamService {
  id: number;
  name: string;
  category: string;
  type: string;
  rate: number; // cost per 1k from upstream provider
  min: number;
  max: number;
  dripfeed: boolean;
  alreadyImported?: boolean;
}

const UPSTREAM_MOCK_SERVICES: Record<string, UpstreamService[]> = {
  'PerfectPanel Prime': [
    { id: 4102, name: 'Instagram Followers [Real · Refill 30d · Speed 10k/d]', category: 'Instagram', type: 'Default', rate: 1.40, min: 100, max: 500000, dripfeed: true, alreadyImported: true },
    { id: 4103, name: 'Instagram Likes [High Quality · Instant Start]', category: 'Instagram', type: 'Default', rate: 0.45, min: 50, max: 200000, dripfeed: false },
    { id: 4104, name: 'Instagram Reels Views [Organic Reach · Non-Drop]', category: 'Instagram', type: 'Default', rate: 0.18, min: 500, max: 10000000, dripfeed: false },
    { id: 4189, name: 'YouTube High-Retention Views [Non-Drop · Monetizable]', category: 'YouTube', type: 'Default', rate: 2.80, min: 1000, max: 1000000, dripfeed: true, alreadyImported: true },
    { id: 4190, name: 'YouTube Subscribers [Real Accounts · 30d Refill]', category: 'YouTube', type: 'Default', rate: 8.50, min: 100, max: 50000, dripfeed: true },
    { id: 4191, name: 'YouTube Likes [Speed 5k/d · Safe for Ads]', category: 'YouTube', type: 'Default', rate: 1.20, min: 100, max: 100000, dripfeed: false },
    { id: 4301, name: 'X / Twitter Impressions + Bookmarks [HQ Mix]', category: 'Twitter', type: 'Default', rate: 0.65, min: 1000, max: 2000000, dripfeed: false, alreadyImported: true },
    { id: 4302, name: 'X / Twitter Followers [Real NFT/Crypto Profiles]', category: 'Twitter', type: 'Default', rate: 4.20, min: 100, max: 100000, dripfeed: true },
    { id: 4520, name: 'Telegram Channel Members [Zero Drop · 30d Warranty]', category: 'Telegram', type: 'Default', rate: 1.80, min: 100, max: 100000, dripfeed: false, alreadyImported: true },
  ],
  'GlobalBoost Wholesale': [
    { id: 5201, name: 'TikTok Views [Instant · High Speed · Max 10M]', category: 'TikTok', type: 'Default', rate: 0.12, min: 500, max: 10000000, dripfeed: false, alreadyImported: true },
    { id: 5202, name: 'TikTok Followers [Real Look · Instant Delivery]', category: 'TikTok', type: 'Default', rate: 2.10, min: 100, max: 200000, dripfeed: true },
    { id: 5203, name: 'TikTok Likes [For You Page Boost · Fast]', category: 'TikTok', type: 'Default', rate: 0.85, min: 100, max: 500000, dripfeed: false },
    { id: 5410, name: 'Spotify Track Plays [Tier 1 Countries · Royalty Eligible]', category: 'Spotify', type: 'Default', rate: 1.10, min: 1000, max: 500000, dripfeed: true, alreadyImported: true },
    { id: 5411, name: 'Spotify Monthly Listeners [30 Days Active]', category: 'Spotify', type: 'Default', rate: 3.40, min: 500, max: 200000, dripfeed: true },
    { id: 5501, name: 'Facebook Page Likes + Followers [Worldwide]', category: 'Facebook', type: 'Default', rate: 3.10, min: 200, max: 100000, dripfeed: false },
    { id: 5601, name: 'Website Traffic [Google Organic · 1-2 Min Session]', category: 'Website Traffic', type: 'Default', rate: 0.80, min: 1000, max: 1000000, dripfeed: true },
  ],
  'SMMKings Direct Gateway': [
    { id: 6101, name: 'LinkedIn Company Page Followers [B2B Verified]', category: 'LinkedIn', type: 'Default', rate: 14.50, min: 100, max: 25000, dripfeed: true },
    { id: 6102, name: 'LinkedIn Post Likes & Reactions [Corporate]', category: 'LinkedIn', type: 'Default', rate: 9.00, min: 50, max: 10000, dripfeed: false },
    { id: 6201, name: 'Discord Server Members [Offline Mix · Instant]', category: 'Discord', type: 'Default', rate: 4.80, min: 100, max: 50000, dripfeed: false },
  ],
};

export default function AdminSmmImportPage() {
  const [selectedProvider, setSelectedProvider] = React.useState('PerfectPanel Prime');
  const [fetching, setFetching] = React.useState(false);
  const [services, setServices] = React.useState<UpstreamService[]>([]);
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(new Set());
  const [search, setSearch] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState('All');
  const [toast, setToast] = React.useState<string | null>(null);

  // Dynamic Pricing Rule: {%} + {custom fixed}
  const [markupPct, setMarkupPct] = React.useState('50');
  const [customFixed, setCustomFixed] = React.useState('0.25');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const fetchServicesFromProvider = async (providerName: string) => {
    setFetching(true);
    await new Promise((r) => setTimeout(r, 600));
    const items = UPSTREAM_MOCK_SERVICES[providerName] || [];
    setServices(items);
    setSelectedIds(new Set());
    setFetching(false);
    showToast(`Fetched ${items.length} live services from ${providerName} via API v2.`);
  };

  React.useEffect(() => {
    fetchServicesFromProvider(selectedProvider);
  }, [selectedProvider]);

  // Calculate retail price with rule: {rate} * (1 + markupPct / 100) + customFixed
  const calculateRetailPrice = (upstreamRate: number) => {
    const pct = parseFloat(markupPct) || 0;
    const fixed = parseFloat(customFixed) || 0;
    return +(upstreamRate * (1 + pct / 100) + fixed).toFixed(2);
  };

  const categories = ['All', ...Array.from(new Set(services.map((s) => s.category)))];

  const filteredServices = services.filter((s) => {
    const matchCat = categoryFilter === 'All' || s.category === categoryFilter;
    const q = search.toLowerCase().trim();
    const matchQ =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      String(s.id).includes(q);
    return matchCat && matchQ;
  });

  const toggleSelect = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const selectAll = () => {
    const next = new Set<number>();
    filteredServices.forEach((s) => next.add(s.id));
    setSelectedIds(next);
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const selectOnlyNew = () => {
    const next = new Set<number>();
    filteredServices.forEach((s) => {
      if (!s.alreadyImported) next.add(s.id);
    });
    setSelectedIds(next);
  };

  const handleImport = () => {
    if (selectedIds.size === 0) {
      alert('Please select at least one service to import.');
      return;
    }

    setServices((prev) =>
      prev.map((s) => (selectedIds.has(s.id) ? { ...s, alreadyImported: true } : s))
    );

    const count = selectedIds.size;
    setSelectedIds(new Set());
    showToast(
      `Successfully imported ${count} services into catalog with formula ({${markupPct}%} + $${customFixed})!`
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="API Service Import & Dynamic Pricing"
        subtitle="Fetch upstream service catalogs from connected providers via API v2 and apply '{%}+{custom}' price rules before importing into your live catalog."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/admin/smm/services">
              <Button size="sm" variant="outline">
                View Catalog Services <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        }
      />

      {toast && (
        <div className="cpki-card-insight px-4 py-3 text-xs font-medium flex items-center gap-2 border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 rounded-lg">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Provider Selector and Pricing Formula Panel */}
      <Card className="p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-4">
            <Select
              label="Select Upstream Provider"
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
            >
              <option value="PerfectPanel Prime">PerfectPanel Prime (142 services)</option>
              <option value="GlobalBoost Wholesale">GlobalBoost Wholesale (98 services)</option>
              <option value="SMMKings Direct Gateway">SMMKings Direct Gateway (65 services)</option>
            </Select>
          </div>

          <div className="md:col-span-3">
            <Input
              label="Custom Markup Margin (%)"
              type="number"
              value={markupPct}
              onChange={(e) => setMarkupPct(e.target.value)}
              placeholder="e.g. 50"
            />
          </div>

          <div className="md:col-span-3">
            <Input
              label="Custom Fixed Fee ($ / 1k)"
              type="number"
              step="0.05"
              value={customFixed}
              onChange={(e) => setCustomFixed(e.target.value)}
              placeholder="e.g. 0.25"
            />
          </div>

          <div className="md:col-span-2">
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              disabled={fetching}
              onClick={() => fetchServicesFromProvider(selectedProvider)}
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${fetching ? 'animate-spin' : ''}`} />
              Re-fetch API
            </Button>
          </div>
        </div>

        {/* Pricing Formula Explanation Box */}
        <div className="rounded-lg p-3 bg-[var(--muted)] border border-[var(--border)] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-primary shrink-0" />
            <span className="text-[var(--foreground)] font-semibold">Active Pricing Formula:</span>
            <span className="font-mono text-primary font-semibold">
              Retail Price = Provider Rate * (1 + {markupPct}% / 100) + ${customFixed}
            </span>
          </div>
          <div className="text-[11px] text-[var(--muted-foreground)]">
            Example: Provider cost $2.00 → Retail: ${(2.0 * (1 + (parseFloat(markupPct) || 0) / 100) + (parseFloat(customFixed) || 0)).toFixed(2)} / 1k
          </div>
        </div>
      </Card>

      {/* Services List Card */}
      <Card className="p-4 space-y-4">
        {/* Filter and Selection Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button size="xs" variant="outline" onClick={selectAll}>
              Select All
            </Button>
            <Button size="xs" variant="outline" onClick={selectOnlyNew}>
              Select Only New
            </Button>
            <Button size="xs" variant="outline" onClick={deselectAll}>
              Deselect
            </Button>
            <span className="text-xs text-[var(--muted-foreground)] ml-2">
              Selected: <strong className="text-[var(--foreground)]">{selectedIds.size}</strong> services
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs py-1 w-40"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>

            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search services..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Upstream Table */}
        <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
          <table className="w-full text-xs text-left">
            <thead className="bg-[var(--muted)] text-[var(--muted-foreground)] font-medium border-b border-[var(--border)]">
              <tr>
                <th className="py-2.5 px-3 w-8 text-center">#</th>
                <th className="py-2.5 px-3">Service ID & Name</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-right">Min / Max Qty</th>
                <th className="py-2.5 px-3 text-right">Upstream Cost</th>
                <th className="py-2.5 px-3 text-right">Applied Rule</th>
                <th className="py-2.5 px-3 text-right">Calculated Retail</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredServices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-[var(--muted-foreground)]">
                    {fetching ? 'Connecting to provider API...' : 'No services found.'}
                  </td>
                </tr>
              ) : (
                filteredServices.map((svc) => {
                  const isChecked = selectedIds.has(svc.id);
                  const retailPrice = calculateRetailPrice(svc.rate);
                  return (
                    <tr
                      key={svc.id}
                      onClick={() => toggleSelect(svc.id)}
                      className={`cursor-pointer transition-colors ${
                        isChecked ? 'bg-primary/5' : 'hover:bg-[var(--muted)]/50'
                      }`}
                    >
                      <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelect(svc.id)}
                          className="rounded border-[var(--border)] text-primary focus:ring-primary cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-3 max-w-sm">
                        <div className="font-semibold text-[var(--foreground)]">{svc.name}</div>
                        <div className="text-[10px] font-mono text-[var(--muted-foreground)]">
                          Provider ID: #{svc.id} · Type: {svc.type}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant="sm">{svc.category}</Badge>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-[11px] text-[var(--muted-foreground)]">
                        {svc.min.toLocaleString()} / {svc.max.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-medium text-[var(--foreground)]">
                        ${svc.rate.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-[11px]">
                        <span className="text-primary font-semibold">+{markupPct}%</span>
                        <span className="text-emerald-400 font-semibold ml-1">+${customFixed}</span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-sm text-emerald-400">
                        ${retailPrice.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Badge tone={svc.alreadyImported ? 'success' : 'neutral'} variant="sm">
                          {svc.alreadyImported ? 'Imported' : 'Available'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Import Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[var(--border)]">
          <div className="text-xs text-[var(--muted-foreground)]">
            Ready to import <strong className="text-[var(--foreground)]">{selectedIds.size}</strong> services with active pricing rules into catalog.
          </div>

          <Button
            size="sm"
            disabled={selectedIds.size === 0}
            onClick={handleImport}
            className="w-full sm:w-auto"
          >
            <DownloadCloud className="w-3.5 h-3.5 mr-1.5" /> Import {selectedIds.size} Services into Catalog
          </Button>
        </div>
      </Card>
    </div>
  );
}
