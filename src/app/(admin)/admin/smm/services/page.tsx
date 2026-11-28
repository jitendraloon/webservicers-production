'use client';

import * as React from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import {
  Download,
  CheckCircle2,
  Plus,
  Search,
  Filter,
  DollarSign,
  Percent,
  Sliders,
  Edit2,
  Trash2,
  Power,
  Layers,
  ArrowUpRight,
  Calculator,
} from 'lucide-react';

export interface SmmServiceItem {
  id: string;
  externalId: number;
  provider: string;
  name: string;
  category: string;
  type: 'Default' | 'Package' | 'Custom Comments' | 'Subscriptions';
  minQty: number;
  maxQty: number;
  costPer1k: number;
  marginPct: number;
  customFixed: number; // custom fixed addition e.g. +$0.50
  sellPer1k: number;
  status: 'ACTIVE' | 'DISABLED';
  dripfeed: boolean;
}

const INITIAL_SERVICES: SmmServiceItem[] = [
  {
    id: 'SVC-101',
    externalId: 4102,
    provider: 'PerfectPanel Prime',
    name: 'Instagram Followers [Real · Refill 30d · Speed 10k/d]',
    category: 'Instagram',
    type: 'Default',
    minQty: 100,
    maxQty: 500000,
    costPer1k: 1.40,
    marginPct: 60,
    customFixed: 0.20,
    sellPer1k: 2.44, // 1.40 * 1.6 + 0.20 = 2.44
    status: 'ACTIVE',
    dripfeed: true,
  },
  {
    id: 'SVC-102',
    externalId: 4189,
    provider: 'PerfectPanel Prime',
    name: 'YouTube High-Retention Views [Non-Drop · Monetizable]',
    category: 'YouTube',
    type: 'Default',
    minQty: 1000,
    maxQty: 1000000,
    costPer1k: 2.80,
    marginPct: 50,
    customFixed: 0.50,
    sellPer1k: 4.70, // 2.80 * 1.5 + 0.50 = 4.70
    status: 'ACTIVE',
    dripfeed: true,
  },
  {
    id: 'SVC-103',
    externalId: 4215,
    provider: 'GlobalBoost Wholesale',
    name: 'TikTok Views [Instant · Max 10M · Fast Delivery]',
    category: 'TikTok',
    type: 'Default',
    minQty: 500,
    maxQty: 10000000,
    costPer1k: 0.12,
    marginPct: 100,
    customFixed: 0.10,
    sellPer1k: 0.34, // 0.12 * 2.0 + 0.10 = 0.34
    status: 'ACTIVE',
    dripfeed: false,
  },
  {
    id: 'SVC-104',
    externalId: 4301,
    provider: 'PerfectPanel Prime',
    name: 'X / Twitter Impressions + Bookmarks [HQ Organic Mix]',
    category: 'Twitter',
    type: 'Default',
    minQty: 1000,
    maxQty: 2000000,
    costPer1k: 0.65,
    marginPct: 75,
    customFixed: 0.25,
    sellPer1k: 1.39, // 0.65 * 1.75 + 0.25 = 1.39
    status: 'ACTIVE',
    dripfeed: false,
  },
  {
    id: 'SVC-105',
    externalId: 4410,
    provider: 'GlobalBoost Wholesale',
    name: 'Spotify Track Plays [Tier 1 Countries · Royalty Eligible]',
    category: 'Spotify',
    type: 'Default',
    minQty: 1000,
    maxQty: 500000,
    costPer1k: 1.10,
    marginPct: 60,
    customFixed: 0.30,
    sellPer1k: 2.06, // 1.10 * 1.6 + 0.30 = 2.06
    status: 'ACTIVE',
    dripfeed: true,
  },
  {
    id: 'SVC-106',
    externalId: 4520,
    provider: 'PerfectPanel Prime',
    name: 'Telegram Channel Members [Zero Drop · 30d Warranty]',
    category: 'Telegram',
    type: 'Default',
    minQty: 100,
    maxQty: 100000,
    costPer1k: 1.80,
    marginPct: 50,
    customFixed: 0.50,
    sellPer1k: 3.20,
    status: 'ACTIVE',
    dripfeed: false,
  },
];

export default function AdminSmmServicesPage() {
  const [services, setServices] = React.useState<SmmServiceItem[]>(INITIAL_SERVICES);
  const [categoryFilter, setCategoryFilter] = React.useState('All');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [toast, setToast] = React.useState<string | null>(null);

  // Bulk Price Markup Tool State: {%} + {custom}
  const [bulkMarkupPct, setBulkMarkupPct] = React.useState('50');
  const [bulkCustomFixed, setBulkCustomFixed] = React.useState('0.25');
  const [bulkTargetCategory, setBulkTargetCategory] = React.useState('All');
  const [bulkToolOpen, setBulkToolOpen] = React.useState(false);

  // Create / Edit Service Modal State
  const [editingService, setEditingService] = React.useState<SmmServiceItem | null>(null);
  const [isNewService, setIsNewService] = React.useState(false);
  const [modalOpen, setModalOpen] = React.useState(false);

  // Form State
  const [formName, setFormName] = React.useState('');
  const [formCategory, setFormCategory] = React.useState('Instagram');
  const [formProvider, setFormProvider] = React.useState('PerfectPanel Prime');
  const [formExtId, setFormExtId] = React.useState('5001');
  const [formType, setFormType] = React.useState<'Default' | 'Package' | 'Custom Comments' | 'Subscriptions'>('Default');
  const [formMinQty, setFormMinQty] = React.useState('100');
  const [formMaxQty, setFormMaxQty] = React.useState('100000');
  const [formCost, setFormCost] = React.useState('1.50');
  const [formMarginPct, setFormMarginPct] = React.useState('60');
  const [formCustomFixed, setFormCustomFixed] = React.useState('0.25');
  const [formSellPrice, setFormSellPrice] = React.useState('2.65');
  const [formStatus, setFormStatus] = React.useState<'ACTIVE' | 'DISABLED'>('ACTIVE');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const categories = ['All', ...Array.from(new Set(services.map((s) => s.category)))];

  const filteredServices = services.filter((s) => {
    const matchCat = categoryFilter === 'All' || s.category === categoryFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchQ =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      s.provider.toLowerCase().includes(q) ||
      String(s.externalId).includes(q);
    return matchCat && matchQ;
  });

  // Calculate retail price automatically when cost, margin%, or custom fixed changes
  const calculateRetail = (cost: number, pct: number, fixed: number) => {
    return +(cost * (1 + pct / 100) + fixed).toFixed(2);
  };

  const applyBulkPricing = () => {
    const pct = parseFloat(bulkMarkupPct) || 0;
    const fixed = parseFloat(bulkCustomFixed) || 0;

    setServices((prev) =>
      prev.map((s) => {
        if (bulkTargetCategory === 'All' || s.category === bulkTargetCategory) {
          const newSell = calculateRetail(s.costPer1k, pct, fixed);
          return {
            ...s,
            marginPct: pct,
            customFixed: fixed,
            sellPer1k: newSell,
          };
        }
        return s;
      })
    );

    showToast(
      `Applied rule ({${pct}%} + \${fixed.toFixed(2)}) across ${
        bulkTargetCategory === 'All' ? 'all services' : bulkTargetCategory + ' services'
      }.`
    );
    setBulkToolOpen(false);
  };

  const toggleStatus = (id: string) => {
    setServices((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, status: s.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE' } : s
      )
    );
  };

  const deleteService = (id: string) => {
    if (confirm('Are you sure you want to remove this service from the catalog?')) {
      setServices((prev) => prev.filter((s) => s.id !== id));
      showToast('Service removed from catalog.');
    }
  };

  const openCreateModal = () => {
    setIsNewService(true);
    setEditingService(null);
    setFormName('');
    setFormCategory('Instagram');
    setFormProvider('PerfectPanel Prime');
    setFormExtId(String(Math.floor(4000 + Math.random() * 2000)));
    setFormType('Default');
    setFormMinQty('100');
    setFormMaxQty('100000');
    setFormCost('1.20');
    setFormMarginPct('50');
    setFormCustomFixed('0.20');
    setFormSellPrice('2.00');
    setFormStatus('ACTIVE');
    setModalOpen(true);
  };

  const openEditModal = (s: SmmServiceItem) => {
    setIsNewService(false);
    setEditingService(s);
    setFormName(s.name);
    setFormCategory(s.category);
    setFormProvider(s.provider);
    setFormExtId(String(s.externalId));
    setFormType(s.type);
    setFormMinQty(String(s.minQty));
    setFormMaxQty(String(s.maxQty));
    setFormCost(String(s.costPer1k));
    setFormMarginPct(String(s.marginPct));
    setFormCustomFixed(String(s.customFixed));
    setFormSellPrice(String(s.sellPer1k));
    setFormStatus(s.status);
    setModalOpen(true);
  };

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    const cost = parseFloat(formCost) || 0;
    const margin = parseFloat(formMarginPct) || 0;
    const custom = parseFloat(formCustomFixed) || 0;
    const sell = parseFloat(formSellPrice) || calculateRetail(cost, margin, custom);

    if (isNewService) {
      const newSvc: SmmServiceItem = {
        id: `SVC-${Math.floor(200 + Math.random() * 800)}`,
        externalId: parseInt(formExtId, 10) || 4000,
        provider: formProvider,
        name: formName.trim(),
        category: formCategory,
        type: formType,
        minQty: parseInt(formMinQty, 10) || 100,
        maxQty: parseInt(formMaxQty, 10) || 100000,
        costPer1k: cost,
        marginPct: margin,
        customFixed: custom,
        sellPer1k: sell,
        status: formStatus,
        dripfeed: true,
      };
      setServices([newSvc, ...services]);
      showToast(`Service "${newSvc.name}" created successfully.`);
    } else if (editingService) {
      setServices((prev) =>
        prev.map((s) =>
          s.id === editingService.id
            ? {
                ...s,
                name: formName.trim(),
                category: formCategory,
                provider: formProvider,
                externalId: parseInt(formExtId, 10) || s.externalId,
                type: formType,
                minQty: parseInt(formMinQty, 10) || s.minQty,
                maxQty: parseInt(formMaxQty, 10) || s.maxQty,
                costPer1k: cost,
                marginPct: margin,
                customFixed: custom,
                sellPer1k: sell,
                status: formStatus,
              }
            : s
        )
      );
      showToast(`Service "${formName}" updated.`);
    }
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="SMM Service Manager & Pricing"
        subtitle="Manage live catalog services, configure multi-tier '{%}+{custom}' profit margins, and assign upstream provider mapping."
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setBulkToolOpen(true)}>
              <Calculator className="w-3.5 h-3.5 mr-1.5" /> Bulk Markup Rules ({'{%}+{fixed}'})
            </Button>
            <Link href="/admin/smm/import">
              <Button size="sm" variant="outline" className="text-primary border-primary/30">
                <Download className="w-3.5 h-3.5 mr-1.5" /> Import from API
              </Button>
            </Link>
            <Button size="sm" onClick={openCreateModal}>
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Create Service
            </Button>
          </div>
        }
      />

      {toast && (
        <div className="cpki-card-insight px-4 py-3 text-xs font-medium flex items-center gap-2 border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 rounded-lg">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Bulk Markup Calculator Quick Bar */}
      {bulkToolOpen && (
        <Card className="p-4 border-primary/30 bg-primary/5 space-y-3">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--foreground)]">
              <Sliders className="w-4 h-4 text-primary" />
              <span>Bulk Pricing Formula: {'{cost} * (1 + % / 100) + {custom fixed}'}</span>
            </div>
            <button
              onClick={() => setBulkToolOpen(false)}
              className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end text-xs">
            <Select
              label="Target Categories"
              value={bulkTargetCategory}
              onChange={(e) => setBulkTargetCategory(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === 'All' ? 'All Categories (Global)' : c}
                </option>
              ))}
            </Select>

            <Input
              label="Markup Percentage (%)"
              type="number"
              value={bulkMarkupPct}
              onChange={(e) => setBulkMarkupPct(e.target.value)}
              placeholder="e.g. 50"
            />

            <Input
              label="Custom Fixed Add ($ / 1k)"
              type="number"
              step="0.05"
              value={bulkCustomFixed}
              onChange={(e) => setBulkCustomFixed(e.target.value)}
              placeholder="e.g. 0.25"
            />

            <div className="flex gap-2">
              <Button size="sm" onClick={applyBulkPricing} className="w-full">
                Apply Formula to {bulkTargetCategory}
              </Button>
            </div>
          </div>
          <div className="text-[11px] text-[var(--muted-foreground)]">
            Example: Upstream provider cost $1.50 with +{bulkMarkupPct}% margin and +${bulkCustomFixed} fixed fee = Retail $
            {(1.5 * (1 + (parseFloat(bulkMarkupPct) || 0) / 100) + (parseFloat(bulkCustomFixed) || 0)).toFixed(2)}/1k
          </div>
        </Card>
      )}

      {/* Filter and Search Bar */}
      <Card className="p-4 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  categoryFilter === cat
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search service, category, provider ID..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Services Table */}
        <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
          <table className="w-full text-xs text-left">
            <thead className="bg-[var(--muted)] text-[var(--muted-foreground)] font-medium border-b border-[var(--border)]">
              <tr>
                <th className="py-2.5 px-3">Service Name</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Provider</th>
                <th className="py-2.5 px-3 text-right">Min / Max Qty</th>
                <th className="py-2.5 px-3 text-right">Provider Cost</th>
                <th className="py-2.5 px-3 text-right">Markup Formula</th>
                <th className="py-2.5 px-3 text-right">Retail / 1k</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredServices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-[var(--muted-foreground)]">
                    No services found matching filter criteria.
                  </td>
                </tr>
              ) : (
                filteredServices.map((s) => (
                  <tr key={s.id} className="hover:bg-[var(--muted)]/50 transition-colors">
                    <td className="py-3 px-3 max-w-sm">
                      <div className="font-semibold text-[var(--foreground)]">{s.name}</div>
                      <div className="text-[10px] text-[var(--muted-foreground)]">
                        ID: {s.id} · Type: {s.type} {s.dripfeed && '· Dripfeed Supported'}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant="sm">{s.category}</Badge>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-[var(--foreground)]">{s.provider}</div>
                      <div className="text-[10px] font-mono text-[var(--muted-foreground)]">
                        Ext ID #{s.externalId}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-[11px]">
                      <div>Min: {s.minQty.toLocaleString()}</div>
                      <div className="text-[var(--muted-foreground)]">Max: {s.maxQty.toLocaleString()}</div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-[var(--muted-foreground)]">
                      ${s.costPer1k.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-xs">
                      <span className="text-primary font-semibold">+{s.marginPct}%</span>
                      {s.customFixed > 0 && (
                        <span className="text-emerald-400 font-semibold ml-1">+${s.customFixed.toFixed(2)}</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-sm text-[var(--foreground)]">
                      ${s.sellPer1k.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => toggleStatus(s.id)}
                        className="cursor-pointer"
                        title="Click to toggle status"
                      >
                        <Badge tone={s.status === 'ACTIVE' ? 'success' : 'neutral'} variant="sm">
                          {s.status}
                        </Badge>
                      </button>
                    </td>
                    <td className="py-3 px-3 text-right space-x-1">
                      <Button size="xs" variant="outline" onClick={() => openEditModal(s)}>
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        className="text-rose-400 hover:text-rose-300"
                        onClick={() => deleteService(s.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create / Edit Service Modal */}
      {modalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setModalOpen(false)}
          title={isNewService ? 'Create New SMM Service' : `Edit Service — ${formName}`}
        >
          <form onSubmit={handleSaveService} className="space-y-4 text-xs">
            <Input
              label="Service Name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Instagram Followers [Real · Refill 30d]"
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Category"
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                placeholder="e.g. Instagram, YouTube, TikTok"
                required
              />
              <Select
                label="Provider"
                value={formProvider}
                onChange={(e) => setFormProvider(e.target.value)}
              >
                <option value="PerfectPanel Prime">PerfectPanel Prime (API v2)</option>
                <option value="GlobalBoost Wholesale">GlobalBoost Wholesale (API v2)</option>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Provider External Service ID"
                type="number"
                value={formExtId}
                onChange={(e) => setFormExtId(e.target.value)}
                required
              />
              <Select
                label="Service Type"
                value={formType}
                onChange={(e) => setFormType(e.target.value as any)}
              >
                <option value="Default">Default</option>
                <option value="Package">Package</option>
                <option value="Custom Comments">Custom Comments</option>
                <option value="Subscriptions">Subscriptions</option>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Minimum Quantity"
                type="number"
                value={formMinQty}
                onChange={(e) => setFormMinQty(e.target.value)}
                required
              />
              <Input
                label="Maximum Quantity"
                type="number"
                value={formMaxQty}
                onChange={(e) => setFormMaxQty(e.target.value)}
                required
              />
            </div>

            {/* Custom Pricing Calculator */}
            <div className="p-3 bg-[var(--muted)] rounded-lg space-y-3 border border-[var(--border)]">
              <div className="font-semibold text-[var(--foreground)] flex items-center justify-between">
                <span>Dynamic Pricing Rule: {'{%} + {custom fixed}'}</span>
                <span className="text-[11px] text-primary">Formula Preview</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Input
                  label="Provider Cost ($)"
                  type="number"
                  step="0.01"
                  value={formCost}
                  onChange={(e) => {
                    const c = parseFloat(e.target.value) || 0;
                    setFormCost(e.target.value);
                    setFormSellPrice(
                      String(calculateRetail(c, parseFloat(formMarginPct) || 0, parseFloat(formCustomFixed) || 0))
                    );
                  }}
                  required
                />
                <Input
                  label="Margin (%)"
                  type="number"
                  value={formMarginPct}
                  onChange={(e) => {
                    const m = parseFloat(e.target.value) || 0;
                    setFormMarginPct(e.target.value);
                    setFormSellPrice(
                      String(calculateRetail(parseFloat(formCost) || 0, m, parseFloat(formCustomFixed) || 0))
                    );
                  }}
                  required
                />
                <Input
                  label="Custom Fixed ($)"
                  type="number"
                  step="0.05"
                  value={formCustomFixed}
                  onChange={(e) => {
                    const fix = parseFloat(e.target.value) || 0;
                    setFormCustomFixed(e.target.value);
                    setFormSellPrice(
                      String(calculateRetail(parseFloat(formCost) || 0, parseFloat(formMarginPct) || 0, fix))
                    );
                  }}
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-[var(--muted-foreground)]">Calculated Retail Price:</span>
                <div className="text-base font-bold font-mono text-emerald-400">
                  ${parseFloat(formSellPrice || '0').toFixed(2)} / 1k
                </div>
              </div>
            </div>

            <Select
              label="Catalog Status"
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value as any)}
            >
              <option value="ACTIVE">ACTIVE (Visible in Storefront)</option>
              <option value="DISABLED">DISABLED (Hidden from Storefront)</option>
            </Select>

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <Button size="sm" variant="outline" type="button" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" type="submit">
                {isNewService ? 'Create Service' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
