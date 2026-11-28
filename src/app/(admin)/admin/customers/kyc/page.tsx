'use client';

import * as React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, BadgeTone } from '@/components/ui/Badge';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Input';
import { CheckCircle2, XCircle, FileCheck2, ShieldAlert, Eye } from 'lucide-react';

interface KycSubmission {
  id: string;
  accountId: string;
  customerName: string;
  country: string;
  docType: 'Passport' | 'National ID' | 'Corporate Registry';
  riskLevel: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'Approved' | 'Rejected';
  submittedAt: string;
  notes: string;
}

const INITIAL_KYC: KycSubmission[] = [
  {
    id: 'KYC-3019',
    accountId: 'AC-8804',
    customerName: 'Lucas Meyer',
    country: 'Germany',
    docType: 'Corporate Registry',
    riskLevel: 'Medium',
    status: 'Pending',
    submittedAt: '2026-11-26 08:12',
    notes: 'Handelsregister extract + UBO declaration attached.',
  },
  {
    id: 'KYC-3018',
    accountId: 'AC-8815',
    customerName: 'Tariq Al-Mansoor',
    country: 'UAE',
    docType: 'Passport',
    riskLevel: 'Low',
    status: 'Pending',
    submittedAt: '2026-11-25 21:40',
    notes: 'Automated liveness check passed (99.2% match).',
  },
  {
    id: 'KYC-3017',
    accountId: 'AC-8791',
    customerName: 'Victor Alvarez',
    country: 'Panama',
    docType: 'National ID',
    riskLevel: 'High',
    status: 'Pending',
    submittedAt: '2026-11-25 15:02',
    notes: 'IP geolocation mismatch with submitted document.',
  },
  {
    id: 'KYC-3016',
    accountId: 'AC-8812',
    customerName: 'David Thorne',
    country: 'United Kingdom',
    docType: 'Corporate Registry',
    riskLevel: 'Low',
    status: 'Approved',
    submittedAt: '2026-11-24 10:19',
    notes: 'Companies House verified.',
  },
];

const STATUS_TONE: Record<KycSubmission['status'], BadgeTone> = {
  Pending: 'warning',
  Approved: 'success',
  Rejected: 'danger',
};

const RISK_TONE: Record<KycSubmission['riskLevel'], BadgeTone> = {
  Low: 'success',
  Medium: 'warning',
  High: 'danger',
};

export default function AdminCustomersKycPage() {
  const [queue, setQueue] = React.useState<KycSubmission[]>(INITIAL_KYC);
  const [inspecting, setInspecting] = React.useState<KycSubmission | null>(null);
  const [reason, setReason] = React.useState('');
  const [toast, setToast] = React.useState<string | null>(null);

  const decide = (id: string, status: 'Approved' | 'Rejected', note?: string) => {
    setQueue((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status, notes: note ? `${item.notes} | Decision: ${note}` : item.notes }
          : item
      )
    );
    setInspecting(null);
    setReason('');
    setToast(`KYC ${id} marked as ${status}`);
    setTimeout(() => setToast(null), 3000);
  };

  const pendingCount = queue.filter((q) => q.status === 'Pending').length;

  const columns: Column<KycSubmission>[] = [
    {
      key: 'id',
      header: 'Submission',
      render: (r) => (
        <div>
          <div className="font-medium text-[var(--foreground)]">{r.customerName}</div>
          <div className="text-[11px] text-[var(--muted-foreground)]">{r.id} · {r.accountId}</div>
        </div>
      ),
    },
    { key: 'country', header: 'Jurisdiction' },
    { key: 'docType', header: 'Document' },
    {
      key: 'riskLevel',
      header: 'AML Risk',
      render: (r) => <Badge tone={RISK_TONE[r.riskLevel]} variant="sm">{r.riskLevel}</Badge>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>,
    },
    { key: 'submittedAt', header: 'Submitted' },
    {
      key: 'actions',
      header: '',
      cellClassName: 'text-right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button size="xs" variant="ghost" onClick={() => setInspecting(r)}>
            <Eye className="w-3.5 h-3.5 mr-1" /> Review
          </Button>
          {r.status === 'Pending' && (
            <>
              <Button size="xs" onClick={() => decide(r.id, 'Approved')}>
                Approve
              </Button>
              <Button size="xs" variant="outline" onClick={() => setInspecting(r)}>
                Reject
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="KYC Verification Queue"
        subtitle="Review identity & corporate documents, assess AML risk, and approve or reject verification requests."
      />

      {toast && (
        <div className="cpki-card-insight px-4 py-2.5 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-[var(--muted-foreground)]">Pending Review</div>
            <div className="mt-1 text-2xl font-semibold">{pendingCount}</div>
          </div>
          <FileCheck2 className="w-5 h-5 text-[var(--warning)]" />
        </Card>
        <Card className="p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-[var(--muted-foreground)]">Approved (24h)</div>
            <div className="mt-1 text-2xl font-semibold">
              {queue.filter((q) => q.status === 'Approved').length}
            </div>
          </div>
          <CheckCircle2 className="w-5 h-5 text-[var(--success)]" />
        </Card>
        <Card className="p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-[var(--muted-foreground)]">High Risk Flagged</div>
            <div className="mt-1 text-2xl font-semibold">
              {queue.filter((q) => q.riskLevel === 'High').length}
            </div>
          </div>
          <ShieldAlert className="w-5 h-5 text-[var(--destructive)]" />
        </Card>
      </div>

      <Card className="p-0 overflow-hidden">
        <DataTable columns={columns} data={queue} rowKey={(r) => r.id} />
      </Card>

      <Modal
        isOpen={Boolean(inspecting)}
        onClose={() => setInspecting(null)}
        title={inspecting ? `Review ${inspecting.id} · ${inspecting.customerName}` : 'Review KYC'}
      >
        {inspecting && (
          <div className="space-y-4 text-sm">
            <div className="rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--muted)] p-3.5 space-y-1.5 text-xs">
              <div><strong>Account:</strong> {inspecting.accountId} ({inspecting.country})</div>
              <div><strong>Document:</strong> {inspecting.docType}</div>
              <div><strong>System Notes:</strong> {inspecting.notes}</div>
            </div>
            <Textarea
              label="Reviewer Decision Note (optional for approval, recommended for rejection)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Document expired or mismatch in registered address..."
              rows={3}
            />
            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <Button variant="outline" size="sm" onClick={() => setInspecting(null)}>
                Cancel
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-[var(--destructive)]"
                onClick={() => decide(inspecting.id, 'Rejected', reason || 'Verification failed')}
              >
                <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
              </Button>
              <Button size="sm" onClick={() => decide(inspecting.id, 'Approved', reason)}>
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve KYC
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
