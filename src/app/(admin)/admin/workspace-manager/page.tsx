'use client';

import * as React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, BadgeTone } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { DataTable, Column } from '@/components/ui/DataTable';
import { CheckCircle2, Search } from 'lucide-react';

interface Workspace {
  id: string;
  name: string;
  ownerEmail: string;
  plan: 'Starter' | 'Growth' | 'Enterprise';
  seatsUsed: number;
  seatsLimit: number;
  storageGb: number;
  status: 'Active' | 'Suspended';
}

const INITIAL_WORKSPACES: Workspace[] = [
  { id: 'WS-901', name: 'Oakridge Production', ownerEmail: 'd.thorne@oakridge.uk', plan: 'Enterprise', seatsUsed: 18, seatsLimit: 50, storageGb: 142.5, status: 'Active' },
  { id: 'WS-900', name: 'BrightStack Agency', ownerEmail: 'aisha@brightstack.dev', plan: 'Growth', seatsUsed: 8, seatsLimit: 15, storageGb: 44.2, status: 'Active' },
  { id: 'WS-899', name: 'Lumina AI Research', ownerEmail: 'hannah@lumina-ai.kr', plan: 'Enterprise', seatsUsed: 34, seatsLimit: 50, storageGb: 289.0, status: 'Active' },
  { id: 'WS-898', name: 'FastPromo Sandbox', ownerEmail: 'victor@fastpromo.net', plan: 'Starter', seatsUsed: 1, seatsLimit: 3, storageGb: 2.1, status: 'Suspended' },
];

const STATUS_TONE: Record<Workspace['status'], BadgeTone> = {
  Active: 'success',
  Suspended: 'danger',
};

export default function AdminWorkspaceManagerPage() {
  const [workspaces, setWorkspaces] = React.useState<Workspace[]>(INITIAL_WORKSPACES);
  const [search, setSearch] = React.useState('');
  const [toast, setToast] = React.useState<string | null>(null);

  const toggleStatus = (id: string) => {
    setWorkspaces((prev) =>
      prev.map((w) => (w.id === id ? { ...w, status: w.status === 'Active' ? 'Suspended' : 'Active' } : w))
    );
    setToast(`Updated status for workspace ${id}`);
    setTimeout(() => setToast(null), 2500);
  };

  const filtered = workspaces.filter((w) => {
    const q = search.toLowerCase();
    return !q || w.name.toLowerCase().includes(q) || w.ownerEmail.toLowerCase().includes(q) || w.id.toLowerCase().includes(q);
  });

  const columns: Column<Workspace>[] = [
    {
      key: 'name',
      header: 'Workspace',
      render: (r) => (
        <div>
          <div className="font-medium text-[var(--foreground)]">{r.name}</div>
          <div className="text-[11px] text-[var(--muted-foreground)]">{r.id} · {r.ownerEmail}</div>
        </div>
      ),
    },
    { key: 'plan', header: 'Plan', render: (r) => <Badge tone="lilac" variant="sm">{r.plan}</Badge> },
    {
      key: 'seats',
      header: 'Seats',
      render: (r) => <span className="font-mono text-xs">{r.seatsUsed} / {r.seatsLimit}</span>,
    },
    {
      key: 'storageGb',
      header: 'Storage',
      render: (r) => <span className="font-mono text-xs">{r.storageGb} GB</span>,
    },
    { key: 'status', header: 'Status', render: (r) => <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge> },
    {
      key: 'actions',
      header: '',
      cellClassName: 'text-right',
      render: (r) => (
        <Button size="xs" variant="outline" onClick={() => toggleStatus(r.id)}>
          {r.status === 'Active' ? 'Suspend' : 'Activate'}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workspace Manager"
        subtitle="Oversee multi-tenant customer workspaces, seat utilization, storage quotas, and suspension controls."
      />

      {toast && (
        <div className="cpki-card-insight px-4 py-2.5 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      <div className="relative w-72">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
        <Input placeholder="Search workspace or owner..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
      </div>

      <Card className="p-0 overflow-hidden">
        <DataTable columns={columns} data={filtered} rowKey={(r) => r.id} />
      </Card>
    </div>
  );
}
