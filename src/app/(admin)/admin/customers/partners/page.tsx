'use client';

import * as React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Select } from '@/components/ui/Input';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Plus, CheckCircle2, DollarSign } from 'lucide-react';

interface PartnerRecord {
  id: string;
  name: string;
  type: 'Affiliate' | 'Reseller';
  code: string;
  commissionPct: number;
  referrals: number;
  unpaidPayout: number;
  totalEarned: number;
  status: 'Active' | 'Paused';
}

const INITIAL_PARTNERS: PartnerRecord[] = [
  {
    id: 'PT-104',
    name: 'CloudScale Media',
    type: 'Reseller',
    code: 'CLOUDSCALE20',
    commissionPct: 20,
    referrals: 48,
    unpaidPayout: 1420.0,
    totalEarned: 18450.0,
    status: 'Active',
  },
  {
    id: 'PT-103',
    name: 'SaaS Weekly Newsletter',
    type: 'Affiliate',
    code: 'SAASWEEKLY',
    commissionPct: 15,
    referrals: 112,
    unpaidPayout: 890.5,
    totalEarned: 9320.5,
    status: 'Active',
  },
  {
    id: 'PT-102',
    name: 'DevOps Collective',
    type: 'Reseller',
    code: 'DEVOPSPRO',
    commissionPct: 25,
    referrals: 19,
    unpaidPayout: 0,
    totalEarned: 6100.0,
    status: 'Paused',
  },
];

export default function AdminCustomersPartnersPage() {
  const [partners, setPartners] = React.useState<PartnerRecord[]>(INITIAL_PARTNERS);
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  const [type, setType] = React.useState<'Affiliate' | 'Reseller'>('Affiliate');
  const [commissionPct, setCommissionPct] = React.useState('15');
  const [toast, setToast] = React.useState<string | null>(null);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const releasePayout = (id: string) => {
    setPartners((prev) =>
      prev.map((p) => (p.id === id ? { ...p, unpaidPayout: 0 } : p))
    );
    notify(`Released pending payout for ${id}`);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const newPartner: PartnerRecord = {
      id: `PT-${Math.floor(105 + Math.random() * 800)}`,
      name: name.trim(),
      type,
      code: name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) || 'PARTNER15',
      commissionPct: Number(commissionPct) || 15,
      referrals: 0,
      unpaidPayout: 0,
      totalEarned: 0,
      status: 'Active',
    };
    setPartners((prev) => [newPartner, ...prev]);
    setIsAddOpen(false);
    setName('');
    notify(`Created partner ${newPartner.name}`);
  };

  const columns: Column<PartnerRecord>[] = [
    {
      key: 'name',
      header: 'Partner',
      render: (r) => (
        <div>
          <div className="font-medium text-[var(--foreground)]">{r.name}</div>
          <div className="text-[11px] text-[var(--muted-foreground)]">{r.id} · Code: <span className="font-mono">{r.code}</span></div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Program',
      render: (r) => <Badge tone={r.type === 'Reseller' ? 'lilac' : 'primary'} variant="sm">{r.type}</Badge>,
    },
    {
      key: 'commissionPct',
      header: 'Commission',
      render: (r) => <span className="font-mono text-xs">{r.commissionPct}%</span>,
    },
    { key: 'referrals', header: 'Referrals' },
    {
      key: 'unpaidPayout',
      header: 'Unpaid Payout',
      render: (r) => (
        <span className="font-mono text-xs font-semibold text-[var(--foreground)]">
          ${r.unpaidPayout.toFixed(2)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <Badge tone={r.status === 'Active' ? 'success' : 'neutral'}>{r.status}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      cellClassName: 'text-right',
      render: (r) => (
        <Button
          size="xs"
          variant={r.unpaidPayout > 0 ? 'primary' : 'outline'}
          disabled={r.unpaidPayout <= 0}
          onClick={() => releasePayout(r.id)}
        >
          <DollarSign className="w-3 h-3 mr-1" /> Pay Out
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Affiliates & Resellers"
        subtitle="Manage partner commission tiers, referral codes, and automated payout disbursements."
        actions={
          <Button size="sm" onClick={() => setIsAddOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Partner
          </Button>
        }
      />

      {toast && (
        <div className="cpki-card-insight px-4 py-2.5 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      <Card className="p-0 overflow-hidden">
        <DataTable columns={columns} data={partners} rowKey={(r) => r.id} />
      </Card>

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Onboard Partner">
        <form onSubmit={handleCreate} className="space-y-3">
          <Input label="Partner Name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Apex Digital" />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Program Type" value={type} onChange={(e) => setType(e.target.value as 'Affiliate' | 'Reseller')}>
              <option value="Affiliate">Affiliate</option>
              <option value="Reseller">Reseller</option>
            </Select>
            <Input label="Commission (%)" type="number" value={commissionPct} onChange={(e) => setCommissionPct(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
            <Button variant="outline" size="sm" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button type="submit" size="sm">Create Partner</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
