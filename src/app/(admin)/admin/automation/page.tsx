'use client';

import * as React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, BadgeTone } from '@/components/ui/Badge';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Play, Pause, CheckCircle2 } from 'lucide-react';

interface CronJob {
  id: string;
  name: string;
  schedule: string;
  queue: string;
  lastRun: string;
  status: 'Active' | 'Paused';
}

const INITIAL_JOBS: CronJob[] = [
  { id: 'CRON-1', name: 'Invoice Dunning & Auto-Charge', schedule: '0 */2 * * *', queue: 'billing-high', lastRun: '12 mins ago', status: 'Active' },
  { id: 'CRON-2', name: 'SMM PerfectPanel Status Sync', schedule: '*/5 * * * *', queue: 'smm-sync', lastRun: '2 mins ago', status: 'Active' },
  { id: 'CRON-3', name: 'SEO SERP Cache Warmup', schedule: '0 3 * * *', queue: 'seo-workers', lastRun: '15 hrs ago', status: 'Active' },
  { id: 'CRON-4', name: 'GDPR Expired Token Cleanup', schedule: '30 1 * * *', queue: 'compliance', lastRun: '17 hrs ago', status: 'Paused' },
];

const STATUS_TONE: Record<CronJob['status'], BadgeTone> = {
  Active: 'success',
  Paused: 'warning',
};

export default function AdminAutomationPage() {
  const [jobs, setJobs] = React.useState<CronJob[]>(INITIAL_JOBS);
  const [toast, setToast] = React.useState<string | null>(null);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const runNow = (id: string, name: string) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, lastRun: 'Just now' } : j)));
    notify(`Triggered "${name}" immediately`);
  };

  const toggle = (id: string) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === id ? { ...j, status: j.status === 'Active' ? 'Paused' : 'Active' } : j))
    );
  };

  const columns: Column<CronJob>[] = [
    {
      key: 'name',
      header: 'Scheduled Job',
      render: (r) => (
        <div>
          <div className="font-medium text-[var(--foreground)]">{r.name}</div>
          <div className="text-[11px] font-mono text-[var(--muted-foreground)]">Queue: {r.queue}</div>
        </div>
      ),
    },
    { key: 'schedule', header: 'Cron', render: (r) => <span className="font-mono text-xs">{r.schedule}</span> },
    { key: 'lastRun', header: 'Last Execution' },
    { key: 'status', header: 'State', render: (r) => <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge> },
    {
      key: 'actions',
      header: '',
      cellClassName: 'text-right',
      render: (r) => (
        <div className="flex justify-end gap-1.5">
          <Button size="xs" variant="outline" onClick={() => runNow(r.id, r.name)}>
            <Play className="w-3 h-3 mr-1" /> Run Now
          </Button>
          <Button size="xs" variant="ghost" onClick={() => toggle(r.id)}>
            <Pause className="w-3 h-3 mr-1" /> {r.status === 'Active' ? 'Pause' : 'Resume'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cron & Queue Manager"
        subtitle="Inspect recurring background workers, trigger manual job runs, and pause/resume queues."
      />

      {toast && (
        <div className="cpki-card-insight px-4 py-2.5 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      <Card className="p-0 overflow-hidden">
        <DataTable columns={columns} data={jobs} rowKey={(r) => r.id} />
      </Card>
    </div>
  );
}
