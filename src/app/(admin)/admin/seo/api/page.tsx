'use client';

import * as React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { CheckCircle2, KeyRound, Activity } from 'lucide-react';

interface SeoProvider {
  id: string;
  name: string;
  type: 'SEO Data' | 'AI Engine';
  enabled: boolean;
  creditsLeft: string;
  latencyMs: number;
  apiKey: string;
}

const INITIAL_PROVIDERS: SeoProvider[] = [
  { id: 'dataforseo', name: 'DataForSEO', type: 'SEO Data', enabled: true, creditsLeft: '$412.80', latencyMs: 148, apiKey: 'dfs_live_••••901' },
  { id: 'serper', name: 'Serper.dev', type: 'SEO Data', enabled: true, creditsLeft: '184,200 queries', latencyMs: 82, apiKey: 'srp_live_••••44b' },
  { id: 'seranking', name: 'SE Ranking', type: 'SEO Data', enabled: true, creditsLeft: '92,000 units', latencyMs: 210, apiKey: 'ser_live_••••12c' },
  { id: 'mangools', name: 'Mangools', type: 'SEO Data', enabled: false, creditsLeft: '—', latencyMs: 0, apiKey: '' },
  { id: 'semrush', name: 'Semrush API', type: 'SEO Data', enabled: true, creditsLeft: '410,000 units', latencyMs: 195, apiKey: 'smr_••••883' },
  { id: 'ahrefs', name: 'Ahrefs Enterprise', type: 'SEO Data', enabled: false, creditsLeft: '—', latencyMs: 0, apiKey: '' },
  { id: 'openai', name: 'OpenAI GPT-4o', type: 'AI Engine', enabled: true, creditsLeft: '$285.00', latencyMs: 420, apiKey: 'sk-proj-••••9k2' },
  { id: 'gemini', name: 'Google Gemini 2.5 Pro', type: 'AI Engine', enabled: true, creditsLeft: 'Tier 3 Quota', latencyMs: 310, apiKey: 'AIzaSy••••77x' },
];

export default function AdminSeoApiPage() {
  const [providers, setProviders] = React.useState<SeoProvider[]>(INITIAL_PROVIDERS);
  const [editing, setEditing] = React.useState<SeoProvider | null>(null);
  const [keyInput, setKeyInput] = React.useState('');
  const [toast, setToast] = React.useState<string | null>(null);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const toggle = (id: string) => {
    setProviders((prev) => prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p)));
  };

  const saveKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setProviders((prev) =>
      prev.map((p) => (p.id === editing.id ? { ...p, apiKey: keyInput || 'configured_••••', enabled: true } : p))
    );
    notify(`Updated API credentials for ${editing.name}`);
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="SEO Provider Integrations"
        subtitle="Manage API keys, credit balances, and status for SE Ranking, DataForSEO, Mangools, Serper, Semrush, Ahrefs, and AI engines."
      />

      {toast && (
        <div className="cpki-card-insight px-4 py-2.5 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {providers.map((p) => (
          <Card key={p.id} className="p-4 flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--foreground)]">{p.name}</h3>
                  <span className="text-[11px] text-[var(--muted-foreground)]">{p.type}</span>
                </div>
                <Badge tone={p.enabled ? 'success' : 'neutral'} variant="sm">
                  {p.enabled ? 'Active' : 'Disabled'}
                </Badge>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-[var(--radius-control)] bg-[var(--muted)] p-2">
                  <div className="text-[10px] text-[var(--muted-foreground)]">Credits</div>
                  <div className="font-mono font-semibold mt-0.5">{p.creditsLeft}</div>
                </div>
                <div className="rounded-[var(--radius-control)] bg-[var(--muted)] p-2">
                  <div className="text-[10px] text-[var(--muted-foreground)]">Avg Latency</div>
                  <div className="font-mono font-semibold mt-0.5 flex items-center gap-1">
                    <Activity className="w-3 h-3 text-[var(--primary)]" />
                    {p.latencyMs ? `${p.latencyMs}ms` : '—'}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
              <Button size="xs" variant="outline" onClick={() => { setEditing(p); setKeyInput(p.apiKey); }}>
                <KeyRound className="w-3.5 h-3.5 mr-1" /> Configure Key
              </Button>
              <Button size="xs" variant="ghost" onClick={() => toggle(p.id)}>
                {p.enabled ? 'Disable' : 'Enable'}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={Boolean(editing)} onClose={() => setEditing(null)} title={editing ? `${editing.name} API Key` : 'API Key'}>
        <form onSubmit={saveKey} className="space-y-4">
          <Input label="API Key / Auth Token" value={keyInput} onChange={(e) => setKeyInput(e.target.value)} required />
          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
            <Button variant="outline" size="sm" onClick={() => setEditing(null)}>Cancel</Button>
            <Button type="submit" size="sm">Save Key</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
