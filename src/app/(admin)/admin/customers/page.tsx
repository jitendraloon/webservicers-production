'use client';

import * as React from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, BadgeTone } from '@/components/ui/Badge';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import {
  Search,
  UserPlus,
  Users,
  UserCheck,
  Mail,
  Phone,
  Building2,
  ArrowUpRight,
  CheckCircle2,
  Filter,
} from 'lucide-react';

interface LeadRecord {
  id: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  source: 'Organic' | 'Contact Form' | 'Referral' | 'Partner' | 'Webinar';
  stage: 'New' | 'Qualified' | 'Proposal' | 'Converted' | 'Archived';
  interest: string;
  estValue: number;
  createdAt: string;
  notes: string;
}

const INITIAL_LEADS: LeadRecord[] = [
  {
    id: 'LD-4091',
    name: 'Elena Rostova',
    email: 'elena@nordiccloud.io',
    company: 'NordicCloud AB',
    phone: '+46 70 123 4567',
    source: 'Contact Form',
    stage: 'Qualified',
    interest: 'Enterprise Cloud + SEO Suite',
    estValue: 4800,
    createdAt: '2026-11-26 09:14',
    notes: 'Requested custom SLA and multi-region failover.',
  },
  {
    id: 'LD-4090',
    name: 'Marcus Vance',
    email: 'mvance@vancemedia.co',
    company: 'Vance Media Group',
    phone: '+1 (415) 890-2311',
    source: 'Referral',
    stage: 'Proposal',
    interest: 'Agency Reseller Bundle (50 Seats)',
    estValue: 9600,
    createdAt: '2026-11-25 17:42',
    notes: 'Comparing annual vs quarterly billing.',
  },
  {
    id: 'LD-4089',
    name: 'Priya Nair',
    email: 'priya@kinetixlabs.in',
    company: 'Kinetix Labs',
    phone: '+91 98201 44120',
    source: 'Organic',
    stage: 'New',
    interest: 'Managed Kubernetes + CDN',
    estValue: 2400,
    createdAt: '2026-11-25 14:05',
    notes: 'Signed up via pricing calculator.',
  },
  {
    id: 'LD-4088',
    name: 'David Thorne',
    email: 'd.thorne@oakridge.uk',
    company: 'Oakridge Financial',
    phone: '+44 20 7946 0192',
    source: 'Webinar',
    stage: 'Converted',
    interest: 'Dedicated Security & Compliance',
    estValue: 12000,
    createdAt: '2026-11-24 11:30',
    notes: 'Converted to Client 360 account AC-8812.',
  },
  {
    id: 'LD-4087',
    name: 'Sofia Alvarez',
    email: 'sofia@solarisdigital.es',
    company: 'Solaris Digital',
    phone: '+34 612 889 012',
    source: 'Partner',
    stage: 'New',
    interest: 'SMM White-label + SEO API',
    estValue: 1850,
    createdAt: '2026-11-23 16:20',
    notes: 'Referred by Partner #PT-104.',
  },
];

const STAGE_TONE: Record<LeadRecord['stage'], BadgeTone> = {
  New: 'primary',
  Qualified: 'lilac',
  Proposal: 'warning',
  Converted: 'success',
  Archived: 'neutral',
};

export default function AdminCustomersPage() {
  const [leads, setLeads] = React.useState<LeadRecord[]>(INITIAL_LEADS);
  const [search, setSearch] = React.useState('');
  const [stageFilter, setStageFilter] = React.useState<string>('ALL');
  const [selectedLead, setSelectedLead] = React.useState<LeadRecord | null>(null);
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);

  const [newName, setNewName] = React.useState('');
  const [newEmail, setNewEmail] = React.useState('');
  const [newCompany, setNewCompany] = React.useState('');
  const [newInterest, setNewInterest] = React.useState('Enterprise Cloud + SEO Suite');
  const [newValue, setNewValue] = React.useState('2500');
  const [newSource, setNewSource] = React.useState<LeadRecord['source']>('Contact Form');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = React.useMemo(() => {
    return leads.filter((l) => {
      const q = search.toLowerCase();
      const matchesQ =
        !q ||
        l.name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.company.toLowerCase().includes(q) ||
        l.id.toLowerCase().includes(q);
      const matchesStage = stageFilter === 'ALL' || l.stage === stageFilter;
      return matchesQ && matchesStage;
    });
  }, [leads, search, stageFilter]);

  const stats = React.useMemo(() => {
    const totalPipeline = leads
      .filter((l) => l.stage !== 'Archived')
      .reduce((acc, l) => acc + l.estValue, 0);
    const qualifiedCount = leads.filter((l) => l.stage === 'Qualified' || l.stage === 'Proposal').length;
    const convertedCount = leads.filter((l) => l.stage === 'Converted').length;
    return { totalPipeline, qualifiedCount, convertedCount };
  }, [leads]);

  const handleStageChange = (id: string, stage: LeadRecord['stage']) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, stage } : l)));
    if (selectedLead?.id === id) {
      setSelectedLead((prev) => (prev ? { ...prev, stage } : null));
    }
    showToast(`Lead ${id} moved to ${stage}`);
  };

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;
    const created: LeadRecord = {
      id: `LD-${Math.floor(4100 + Math.random() * 899)}`,
      name: newName.trim(),
      email: newEmail.trim(),
      company: newCompany.trim() || 'Independent',
      phone: '+1 (555) 019-2834',
      source: newSource,
      stage: 'New',
      interest: newInterest,
      estValue: Number(newValue) || 1000,
      createdAt: 'Just now',
      notes: 'Manually added by admin.',
    };
    setLeads((prev) => [created, ...prev]);
    setIsAddOpen(false);
    setNewName('');
    setNewEmail('');
    setNewCompany('');
    showToast(`Added inbound lead ${created.name}`);
  };

  const columns: Column<LeadRecord>[] = [
    {
      key: 'id',
      header: 'Lead',
      render: (row) => (
        <div>
          <div className="font-medium text-[var(--foreground)]">{row.name}</div>
          <div className="text-[11px] text-[var(--muted-foreground)]">
            {row.id} · {row.company}
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (row) => (
        <div className="text-xs">
          <div className="text-[var(--foreground)]">{row.email}</div>
          <div className="text-[11px] text-[var(--muted-foreground)]">{row.phone}</div>
        </div>
      ),
    },
    {
      key: 'interest',
      header: 'Interest & Source',
      render: (row) => (
        <div>
          <div className="text-xs font-medium text-[var(--foreground)]">{row.interest}</div>
          <div className="text-[11px] text-[var(--muted-foreground)]">via {row.source}</div>
        </div>
      ),
    },
    {
      key: 'estValue',
      header: 'Est. ARR',
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-[var(--foreground)]">
          ${row.estValue.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'stage',
      header: 'Stage',
      render: (row) => <Badge tone={STAGE_TONE[row.stage]}>{row.stage}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          {row.stage !== 'Converted' && (
            <Button
              size="xs"
              variant="outline"
              onClick={() => handleStageChange(row.id, 'Converted')}
            >
              Convert
            </Button>
          )}
          <Button size="xs" variant="ghost" onClick={() => setSelectedLead(row)}>
            Inspect
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers &amp; Leads"
        subtitle="Universal registry of all visitors, form submissions, contact inquiries, and leads — whether registered as clients or not."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/admin/customers/registered">
              <Button size="sm" variant="outline">
                <Users className="w-3.5 h-3.5 mr-1.5" />
                View Registered Users
              </Button>
            </Link>
            <Button size="sm" onClick={() => setIsAddOpen(true)}>
              <UserPlus className="w-3.5 h-3.5 mr-1.5" />
              Add Inbound Lead
            </Button>
          </div>
        }
      />

      {toast && (
        <div className="cpki-card-insight px-4 py-2.5 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card className="p-4">
          <div className="text-xs text-[var(--muted-foreground)]">Total Leads</div>
          <div className="mt-1 text-2xl font-semibold text-[var(--foreground)]">{leads.length}</div>
          <div className="mt-1 text-[11px] text-[var(--success)]">+14% vs last 7d</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-[var(--muted-foreground)]">Qualified & Proposal</div>
          <div className="mt-1 text-2xl font-semibold text-[var(--foreground)]">{stats.qualifiedCount}</div>
          <div className="mt-1 text-[11px] text-[var(--muted-foreground)]">Active sales pipeline</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-[var(--muted-foreground)]">Converted Accounts</div>
          <div className="mt-1 text-2xl font-semibold text-[var(--foreground)]">{stats.convertedCount}</div>
          <div className="mt-1 text-[11px] text-[var(--success)]">Synced to Client 360</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-[var(--muted-foreground)]">Pipeline Value</div>
          <div className="mt-1 text-2xl font-semibold font-mono text-[var(--foreground)]">
            ${stats.totalPipeline.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-[var(--muted-foreground)]">Estimated ARR</div>
        </Card>
      </div>

      <Tabs defaultValue="all" onValueChange={(v) => setStageFilter(v === 'all' ? 'ALL' : v)}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="all">All Leads</TabsTrigger>
            <TabsTrigger value="New">New</TabsTrigger>
            <TabsTrigger value="Qualified">Qualified</TabsTrigger>
            <TabsTrigger value="Proposal">Proposal</TabsTrigger>
            <TabsTrigger value="Converted">Converted</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
              <Input
                placeholder="Search name, email, company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => { setSearch(''); setStageFilter('ALL'); }}>
              <Filter className="w-3.5 h-3.5 mr-1" />
              Reset
            </Button>
          </div>
        </div>

        <TabsContent value={stageFilter === 'ALL' ? 'all' : stageFilter} className="mt-4">
          <Card className="p-0 overflow-hidden">
            <DataTable
              columns={columns}
              data={filtered}
              rowKey={(r) => r.id}
              onRowClick={(r) => setSelectedLead(r)}
              emptyMessage="No inbound leads match your current filter."
            />
          </Card>
        </TabsContent>
      </Tabs>

      <Modal
        isOpen={Boolean(selectedLead)}
        onClose={() => setSelectedLead(null)}
        title={selectedLead ? `Lead Details · ${selectedLead.id}` : 'Lead Details'}
        maxWidth="560px"
      >
        {selectedLead && (
          <div className="space-y-4 text-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-[var(--foreground)]">{selectedLead.name}</h3>
                <p className="text-xs text-[var(--muted-foreground)] flex items-center gap-1.5 mt-0.5">
                  <Building2 className="w-3.5 h-3.5" />
                  {selectedLead.company} · Created {selectedLead.createdAt}
                </p>
              </div>
              <Badge tone={STAGE_TONE[selectedLead.stage]}>{selectedLead.stage}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--muted)] p-3 text-xs">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                <span>{selectedLead.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                <span>{selectedLead.phone}</span>
              </div>
              <div>
                <span className="text-[var(--muted-foreground)]">Interest: </span>
                <span className="font-medium">{selectedLead.interest}</span>
              </div>
              <div>
                <span className="text-[var(--muted-foreground)]">Est. ARR: </span>
                <span className="font-mono font-semibold">${selectedLead.estValue.toLocaleString()}</span>
              </div>
            </div>

            <Textarea
              label="Qualification Notes"
              value={selectedLead.notes}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedLead((prev) => (prev ? { ...prev, notes: val } : null));
                setLeads((prev) => prev.map((l) => (l.id === selectedLead.id ? { ...l, notes: val } : l)));
              }}
              rows={3}
            />

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--border)]">
              <Select
                value={selectedLead.stage}
                onChange={(e) => handleStageChange(selectedLead.id, e.target.value as LeadRecord['stage'])}
                className="w-40"
              >
                <option value="New">New</option>
                <option value="Qualified">Qualified</option>
                <option value="Proposal">Proposal</option>
                <option value="Converted">Converted</option>
                <option value="Archived">Archived</option>
              </Select>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedLead(null)}>
                  Close
                </Button>
                {selectedLead.stage !== 'Converted' && (
                  <Button
                    size="sm"
                    onClick={() => handleStageChange(selectedLead.id, 'Converted')}
                  >
                    Convert to Client 360
                    <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Inbound Lead"
      >
        <form onSubmit={handleCreateLead} className="space-y-3">
          <Input label="Full Name" value={newName} onChange={(e) => setNewName(e.target.value)} required placeholder="e.g. Liam Chen" />
          <Input label="Work Email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required placeholder="liam@company.com" />
          <Input label="Company / Organization" value={newCompany} onChange={(e) => setNewCompany(e.target.value)} placeholder="Acme Corp" />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Source" value={newSource} onChange={(e) => setNewSource(e.target.value as LeadRecord['source'])}>
              <option value="Contact Form">Contact Form</option>
              <option value="Organic">Organic</option>
              <option value="Referral">Referral</option>
              <option value="Partner">Partner</option>
              <option value="Webinar">Webinar</option>
            </Select>
            <Input label="Est. ARR ($)" type="number" value={newValue} onChange={(e) => setNewValue(e.target.value)} />
          </div>
          <Input label="Product / Service Interest" value={newInterest} onChange={(e) => setNewInterest(e.target.value)} />
          <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
            <Button variant="outline" size="sm" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button type="submit" size="sm">Create Lead</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
