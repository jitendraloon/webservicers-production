'use client';

import * as React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, BadgeTone } from '@/components/ui/Badge';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Download, Trash2, CheckCircle2, Clock } from 'lucide-react';

interface GdprRequest {
  id: string;
  accountId: string;
  email: string;
  type: 'Data Export (Art. 15)' | 'Right to Erasure (Art. 17)';
  status: 'Queued' | 'Processing' | 'Completed';
  requestedAt: string;
  slaDeadline: string;
}

const INITIAL_REQUESTS: GdprRequest[] = [
  {
    id: 'GDPR-904',
    accountId: 'AC-8741',
    email: 'j.weber@privacy-eu.de',
    type: 'Data Export (Art. 15)',
    status: 'Queued',
    requestedAt: '2026-11-26 07:45',
    slaDeadline: '2026-12-26',
  },
  {
    id: 'GDPR-903',
    accountId: 'AC-8690',
    email: 'm.dupont@lyon-tech.fr',
    type: 'Right to Erasure (Art. 17)',
    status: 'Processing',
    requestedAt: '2026-11-24 13:10',
    slaDeadline: '2026-12-24',
  },
  {
    id: 'GDPR-902',
    accountId: 'AC-8612',
    email: 'k.olsen@fjord.no',
    type: 'Data Export (Art. 15)',
    status: 'Completed',
    requestedAt: '2026-11-20 16:00',
    slaDeadline: '2026-12-20',
  },
];

const STATUS_TONE: Record<GdprRequest['status'], BadgeTone> = {
  Queued: 'warning',
  Processing: 'primary',
  Completed: 'success',
};

export default function AdminCustomersGdprPage() {
  const [requests, setRequests] = React.useState<GdprRequest[]>(INITIAL_REQUESTS);
  const [toast, setToast] = React.useState<string | null>(null);

  const processRequest = (id: string, actionLabel: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'Completed' } : r))
    );
    setToast(`${actionLabel} completed for ${id}`);
    setTimeout(() => setToast(null), 3000);
  };

  const columns: Column<GdprRequest>[] = [
    {
      key: 'id',
      header: 'Request ID',
      render: (r) => (
        <div>
          <div className="font-mono text-xs font-semibold">{r.id}</div>
          <div className="text-[11px] text-[var(--muted-foreground)]">{r.accountId}</div>
        </div>
      ),
    },
    { key: 'email', header: 'Data Subject' },
    { key: 'type', header: 'GDPR Article' },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>,
    },
    { key: 'slaDeadline', header: '30-Day SLA' },
    {
      key: 'actions',
      header: '',
      cellClassName: 'text-right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1.5">
          {r.status !== 'Completed' ? (
            r.type.includes('Export') ? (
              <Button size="xs" onClick={() => processRequest(r.id, 'Archive export')}>
                <Download className="w-3.5 h-3.5 mr-1" /> Generate Export
              </Button>
            ) : (
              <Button
                size="xs"
                variant="outline"
                className="text-[var(--destructive)]"
                onClick={() => processRequest(r.id, 'PII anonymization & erasure')}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Execute Erasure
              </Button>
            )
          ) : (
            <span className="text-xs text-[var(--muted-foreground)] flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[var(--success)]" /> Fulfilled
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="GDPR Export & Delete Queue"
        subtitle="Manage Article 15 data portability exports and Article 17 right-to-erasure anonymization jobs."
      />

      {toast && (
        <div className="cpki-card-insight px-4 py-2.5 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-xs text-[var(--muted-foreground)]">Open Requests</div>
          <div className="mt-1 text-2xl font-semibold">
            {requests.filter((r) => r.status !== 'Completed').length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-[var(--muted-foreground)]">Completed (30d)</div>
          <div className="mt-1 text-2xl font-semibold">
            {requests.filter((r) => r.status === 'Completed').length}
          </div>
        </Card>
        <Card className="p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-[var(--muted-foreground)]">Avg. Turnaround</div>
            <div className="mt-1 text-2xl font-semibold">4.2 hrs</div>
          </div>
          <Clock className="w-5 h-5 text-[var(--primary)]" />
        </Card>
      </div>

      <Card className="p-0 overflow-hidden">
        <DataTable columns={columns} data={requests} rowKey={(r) => r.id} />
      </Card>
    </div>
  );
}
