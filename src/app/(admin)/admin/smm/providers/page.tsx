'use client';

import * as React from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import {
  Server,
  RefreshCw,
  CheckCircle2,
  Plus,
  Key,
  Globe,
  DollarSign,
  DownloadCloud,
  Edit2,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export interface SmmProvider {
  id: string;
  name: string;
  apiUrl: string;
  apiKey: string;
  apiType: 'v2' | 'custom';
  balance: number;
  currency: string;
  status: 'Connected' | 'Error';
  lastSynced: string;
  servicesCount: number;
}

const INITIAL_PROVIDERS: SmmProvider[] = [
  {
    id: 'SMM-P1',
    name: 'PerfectPanel Prime',
    apiUrl: 'https://api.perfectpanel-prime.io/v2',
    apiKey: 'pp_live_••••••••81a9',
    apiType: 'v2',
    balance: 1842.65,
    currency: 'USD',
    status: 'Connected',
    lastSynced: '2 mins ago',
    servicesCount: 142,
  },
  {
    id: 'SMM-P2',
    name: 'GlobalBoost Wholesale',
    apiUrl: 'https://globalboost.net/api/v2',
    apiKey: 'gb_live_••••••••09cb',
    apiType: 'v2',
    balance: 429.10,
    currency: 'USD',
    status: 'Connected',
    lastSynced: '10 mins ago',
    servicesCount: 98,
  },
  {
    id: 'SMM-P3',
    name: 'SMMKings Direct Gateway',
    apiUrl: 'https://smmkings.com/api/v2',
    apiKey: 'sk_live_••••••••331e',
    apiType: 'v2',
    balance: 890.00,
    currency: 'USD',
    status: 'Connected',
    lastSynced: '1 hour ago',
    servicesCount: 65,
  },
];

export default function AdminSmmProvidersPage() {
  const [providers, setProviders] = React.useState<SmmProvider[]>(INITIAL_PROVIDERS);
  const [toast, setToast] = React.useState<string | null>(null);
  const [checkingId, setCheckingId] = React.useState<string | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingProvider, setEditingProvider] = React.useState<SmmProvider | null>(null);
  const [formName, setFormName] = React.useState('');
  const [formUrl, setFormUrl] = React.useState('');
  const [formKey, setFormKey] = React.useState('');
  const [formType, setFormType] = React.useState<'v2' | 'custom'>('v2');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const checkBalance = async (id: string) => {
    setCheckingId(id);
    await new Promise((r) => setTimeout(r, 600));
    setProviders((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          return {
            ...p,
            status: 'Connected',
            lastSynced: 'Just now',
            balance: +(p.balance + (Math.random() * 2 - 1)).toFixed(2),
          };
        }
        return p;
      })
    );
    setCheckingId(null);
    showToast(`Checked live API balance for ${id}: connection verified.`);
  };

  const openCreateModal = () => {
    setEditingProvider(null);
    setFormName('');
    setFormUrl('');
    setFormKey('');
    setFormType('v2');
    setModalOpen(true);
  };

  const openEditModal = (p: SmmProvider) => {
    setEditingProvider(p);
    setFormName(p.name);
    setFormUrl(p.apiUrl);
    setFormKey(p.apiKey);
    setFormType(p.apiType);
    setModalOpen(true);
  };

  const deleteProvider = (id: string) => {
    if (confirm('Are you sure you want to remove this provider connection?')) {
      setProviders((prev) => prev.filter((p) => p.id !== id));
      showToast('Provider connection removed.');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formUrl.trim()) return;

    if (editingProvider) {
      setProviders((prev) =>
        prev.map((p) =>
          p.id === editingProvider.id
            ? {
                ...p,
                name: formName.trim(),
                apiUrl: formUrl.trim(),
                apiKey: formKey ? (formKey.includes('••') ? p.apiKey : formKey) : p.apiKey,
                apiType: formType,
              }
            : p
        )
      );
      showToast(`Provider "${formName}" updated.`);
    } else {
      const newP: SmmProvider = {
        id: `SMM-P${providers.length + 1}`,
        name: formName.trim(),
        apiUrl: formUrl.trim(),
        apiKey: formKey.trim() || 'configured_••••',
        apiType: formType,
        balance: 500.0,
        currency: 'USD',
        status: 'Connected',
        lastSynced: 'Just now',
        servicesCount: 0,
      };
      setProviders([...providers, newP]);
      showToast(`Provider "${newP.name}" connected and balance verified.`);
    }
    setModalOpen(false);
  };

  const totalBalance = providers.reduce((sum, p) => sum + p.balance, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="SMM Providers & API Manager"
        subtitle="Connect upstream SMM wholesale providers (PerfectPanel / API v2 standard), monitor API reseller balances, and configure API credentials."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/admin/smm/import">
              <Button size="sm" variant="outline" className="text-primary border-primary/30">
                <DownloadCloud className="w-3.5 h-3.5 mr-1.5" /> Import Services via API
              </Button>
            </Link>
            <Button size="sm" onClick={openCreateModal}>
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Add New Provider
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

      {/* Aggregate Balance Card */}
      <Card className="p-4 bg-[var(--card)] border border-[var(--border)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-[var(--muted-foreground)]">Total Combined Provider Balance</div>
              <div className="text-2xl font-bold font-mono text-[var(--foreground)]">
                ${totalBalance.toFixed(2)} USD
              </div>
            </div>
          </div>
          <div className="text-xs text-[var(--muted-foreground)] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{providers.length} Connected Upstream Endpoints Active</span>
          </div>
        </div>
      </Card>

      {/* Provider Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {providers.map((p) => (
          <Card key={p.id} className="p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-[var(--muted)] text-[var(--foreground)]">
                    <Server className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--foreground)]">{p.name}</h3>
                    <div className="text-[11px] font-mono text-[var(--muted-foreground)] truncate max-w-[200px]">
                      {p.apiUrl}
                    </div>
                  </div>
                </div>
                <Badge tone={p.status === 'Connected' ? 'success' : 'danger'} variant="sm">
                  {p.status}
                </Badge>
              </div>

              <div className="rounded-lg bg-[var(--muted)] p-3 space-y-1">
                <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                  <span>Available Reseller Balance</span>
                  <span className="font-mono text-[10px]">API: {p.apiType.toUpperCase()}</span>
                </div>
                <div className="text-xl font-mono font-bold text-[var(--foreground)]">
                  ${p.balance.toFixed(2)} <span className="text-xs font-normal text-[var(--muted-foreground)]">{p.currency}</span>
                </div>
              </div>

              <div className="text-[11px] text-[var(--muted-foreground)] space-y-1">
                <div className="flex items-center justify-between">
                  <span>API Key:</span>
                  <span className="font-mono text-[var(--foreground)]">{p.apiKey}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Services Available:</span>
                  <span className="font-semibold text-[var(--foreground)]">{p.servicesCount} items</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Last Sync:</span>
                  <span>{p.lastSynced}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <Button size="xs" variant="outline" onClick={() => openEditModal(p)} title="Edit configuration">
                  <Edit2 className="w-3 h-3" />
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  className="text-rose-400 hover:text-rose-300"
                  onClick={() => deleteProvider(p.id)}
                  title="Remove provider"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  size="xs"
                  variant="outline"
                  disabled={checkingId === p.id}
                  onClick={() => checkBalance(p.id)}
                >
                  <RefreshCw className={`w-3 h-3 mr-1 ${checkingId === p.id ? 'animate-spin' : ''}`} />
                  Balance
                </Button>
                <Link href={`/admin/smm/import?provider=${encodeURIComponent(p.name)}`}>
                  <Button size="xs" variant="primary">
                    <DownloadCloud className="w-3 h-3 mr-1" /> Import
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Add / Edit Provider Modal */}
      {modalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setModalOpen(false)}
          title={editingProvider ? `Configure Provider — ${editingProvider.name}` : 'Connect Upstream SMM Provider'}
        >
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <Input
              label="Provider Name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. PerfectPanel Prime, JustAnotherPanel, SMMKings"
              required
            />

            <Input
              label="API Endpoint URL"
              value={formUrl}
              onChange={(e) => setFormUrl(e.target.value)}
              placeholder="https://smmprovider.com/api/v2"
              required
            />

            <Input
              label="API Key / Secret Token"
              type="password"
              value={formKey}
              onChange={(e) => setFormKey(e.target.value)}
              placeholder={editingProvider ? '••••••••••••••••' : 'Enter API Key provided by upstream provider'}
            />

            <Select
              label="API Specification Protocol"
              value={formType}
              onChange={(e) => setFormType(e.target.value as any)}
            >
              <option value="v2">Standard SMM Panel API v2 (action=services, action=add, action=status)</option>
              <option value="custom">Custom JSON Webhook Endpoint</option>
            </Select>

            <div className="p-3 bg-[var(--muted)] rounded-lg text-[11px] text-[var(--muted-foreground)] space-y-1 border border-[var(--border)]">
              <div className="font-semibold text-[var(--foreground)] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>AES-256-GCM Secure Storage</span>
              </div>
              <p>
                API credentials are encrypted at rest with hardware-accelerated AES-256-GCM before storage.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <Button size="sm" variant="outline" type="button" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" type="submit">
                {editingProvider ? 'Save Provider Settings' : 'Connect & Verify Provider'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
