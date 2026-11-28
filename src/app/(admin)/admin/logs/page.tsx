'use client';

import * as React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge, BadgeTone } from '@/components/ui/Badge';
import { Input, Select } from '@/components/ui/Input';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Search } from 'lucide-react';

interface AuditEntry {
  id: string;
  actor: string;
  action: string;
  target: string;
  severity: 'Info' | 'Warning' | 'Critical';
  ip: string;
  timestamp: string;
}

const LOGS: AuditEntry[] = [
  { id: 'AUD-881', actor: 'nadia@webservicers.io', action: 'ROLE_MATRIX_UPDATED', target: 'Billing Analyst', severity: 'Warning', ip: '185.44.12.9', timestamp: '2026-11-26 18:04:11' },
  { id: 'AUD-880', actor: 'sarah@webservicers.io', action: 'IMPERSONATION_START', target: 'AC-8812 (Oakridge)', severity: 'Critical', ip: '91.204.88.14', timestamp: '2026-11-26 17:52:03' },
  { id: 'AUD-879', actor: 'alex@webservicers.io', action: 'KYC_APPROVED', target: 'KYC-3016', severity: 'Info', ip: '172.16.4.22', timestamp: '2026-11-26 16:40:19' },
  { id: 'AUD-878', actor: 'system-cron', action: 'BACKUP_SNAPSHOT_OK', target: 'ws-prod-db-20261126', severity: 'Info', ip: '10.0.0.5', timestamp: '2026-11-26 04:00:02' },
];

const SEV_TONE: Record<AuditEntry['severity'], BadgeTone> = {
  Info: 'neutral',
  Warning: 'warning',
  Critical: 'danger',
};

export default function AdminLogsPage() {
  const [search, setSearch] = React.useState('');
  const [sev, setSev] = React.useState('ALL');

  const filtered = LOGS.filter((l) => {
    const q = search.toLowerCase();
    const matchQ = !q || l.actor.toLowerCase().includes(q) || l.action.toLowerCase().includes(q) || l.target.toLowerCase().includes(q);
    const matchSev = sev === 'ALL' || l.severity === sev;
    return matchQ && matchSev;
  });

  const columns: Column<AuditEntry>[] = [
    { key: 'timestamp', header: 'Timestamp', render: (r) => <span className="font-mono text-xs">{r.timestamp}</span> },
    { key: 'actor', header: 'Actor' },
    { key: 'action', header: 'Event', render: (r) => <span className="font-mono text-xs font-semibold">{r.action}</span> },
    { key: 'target', header: 'Target' },
    { key: 'severity', header: 'Severity', render: (r) => <Badge tone={SEV_TONE[r.severity]} variant="sm">{r.severity}</Badge> },
    { key: 'ip', header: 'Source IP', render: (r) => <span className="font-mono text-xs">{r.ip}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        subtitle="Immutable security & administrative audit trail across staff actions, impersonations, and system jobs."
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <Input placeholder="Search actor, event, target..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
        </div>
        <Select value={sev} onChange={(e) => setSev(e.target.value)} className="w-40">
          <option value="ALL">All Severities</option>
          <option value="Info">Info</option>
          <option value="Warning">Warning</option>
          <option value="Critical">Critical</option>
        </Select>
      </div>

      <Card className="p-0 overflow-hidden">
        <DataTable columns={columns} data={filtered} rowKey={(r) => r.id} />
      </Card>
    </div>
  );
}
