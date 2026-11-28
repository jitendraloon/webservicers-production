'use client';

import * as React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, BadgeTone } from '@/components/ui/Badge';
import { DataTable, Column } from '@/components/ui/DataTable';
import { CheckCircle2, Briefcase } from 'lucide-react';

interface Candidate {
  id: string;
  name: string;
  roleApplied: string;
  department: string;
  experience: string;
  stage: 'Screening' | 'Technical' | 'Final' | 'Offer' | 'Archived';
  appliedAt: string;
}

const INITIAL_CANDIDATES: Candidate[] = [
  { id: 'APP-402', name: 'Devon Brooks', roleApplied: 'Senior Cloud SRE', department: 'Engineering', experience: '7 yrs', stage: 'Technical', appliedAt: '2026-11-25' },
  { id: 'APP-401', name: 'Clara Lindqvist', roleApplied: 'Technical Support Specialist', department: 'Support', experience: '4 yrs', stage: 'Final', appliedAt: '2026-11-24' },
  { id: 'APP-400', name: 'Omar Farooq', roleApplied: 'Risk & KYC Analyst', department: 'Billing & Risk', experience: '5 yrs', stage: 'Screening', appliedAt: '2026-11-23' },
  { id: 'APP-399', name: 'Mei-Ling Zhou', roleApplied: 'Full-Stack Next.js Engineer', department: 'Engineering', experience: '6 yrs', stage: 'Offer', appliedAt: '2026-11-20' },
];

const STAGE_TONE: Record<Candidate['stage'], BadgeTone> = {
  Screening: 'neutral',
  Technical: 'primary',
  Final: 'lilac',
  Offer: 'success',
  Archived: 'danger',
};

const NEXT_STAGE: Record<Candidate['stage'], Candidate['stage']> = {
  Screening: 'Technical',
  Technical: 'Final',
  Final: 'Offer',
  Offer: 'Offer',
  Archived: 'Screening',
};

export default function AdminStaffHiringPage() {
  const [candidates, setCandidates] = React.useState<Candidate[]>(INITIAL_CANDIDATES);
  const [toast, setToast] = React.useState<string | null>(null);

  const advance = (id: string) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, stage: NEXT_STAGE[c.stage] } : c))
    );
    setToast(`Advanced candidate ${id} to next interview stage`);
    setTimeout(() => setToast(null), 2500);
  };

  const archive = (id: string) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, stage: 'Archived' } : c))
    );
    setToast(`Archived candidate ${id}`);
    setTimeout(() => setToast(null), 2500);
  };

  const columns: Column<Candidate>[] = [
    {
      key: 'name',
      header: 'Candidate',
      render: (r) => (
        <div>
          <div className="font-medium text-[var(--foreground)]">{r.name}</div>
          <div className="text-[11px] text-[var(--muted-foreground)]">{r.id} · {r.experience} exp</div>
        </div>
      ),
    },
    { key: 'roleApplied', header: 'Open Position' },
    { key: 'department', header: 'Department' },
    {
      key: 'stage',
      header: 'Stage',
      render: (r) => <Badge tone={STAGE_TONE[r.stage]}>{r.stage}</Badge>,
    },
    { key: 'appliedAt', header: 'Applied' },
    {
      key: 'actions',
      header: '',
      cellClassName: 'text-right',
      render: (r) => (
        <div className="flex justify-end gap-1.5">
          {r.stage !== 'Offer' && r.stage !== 'Archived' && (
            <Button size="xs" onClick={() => advance(r.id)}>Advance</Button>
          )}
          {r.stage !== 'Archived' && (
            <Button size="xs" variant="outline" onClick={() => archive(r.id)}>Archive</Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hiring & Applications"
        subtitle="Review incoming job applications, track interview stages, and manage open department requisitions."
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
            <div className="text-xs text-[var(--muted-foreground)]">Active Candidates</div>
            <div className="mt-1 text-2xl font-semibold">{candidates.filter((c) => c.stage !== 'Archived').length}</div>
          </div>
          <Briefcase className="w-5 h-5 text-[var(--primary)]" />
        </Card>
        <Card className="p-4">
          <div className="text-xs text-[var(--muted-foreground)]">In Technical / Final</div>
          <div className="mt-1 text-2xl font-semibold">
            {candidates.filter((c) => c.stage === 'Technical' || c.stage === 'Final').length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-[var(--muted-foreground)]">Offers Extended</div>
          <div className="mt-1 text-2xl font-semibold">{candidates.filter((c) => c.stage === 'Offer').length}</div>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden">
        <DataTable columns={columns} data={candidates} rowKey={(r) => r.id} />
      </Card>
    </div>
  );
}
