'use client';

import * as React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Trash2, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function AdminSeoOperationsPage() {
  const [dailyBudget, setDailyBudget] = React.useState('250');
  const [cacheHits, setCacheHits] = React.useState('84.6%');
  const [queueDepth, setQueueDepth] = React.useState(14);
  const [toast, setToast] = React.useState<string | null>(null);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="SEO Operations: Budgets, Cache & Queues"
        subtitle="Control daily upstream API spend caps, Redis SERP cache invalidation, and background crawl queues."
      />

      {toast && (
        <div className="cpki-card-insight px-4 py-2.5 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 space-y-3">
          <div className="text-xs text-[var(--muted-foreground)]">Daily Spend Cap ($)</div>
          <Input type="number" value={dailyBudget} onChange={(e) => setDailyBudget(e.target.value)} />
          <div className="text-[11px] text-[var(--muted-foreground)]">Current spend today: $94.18</div>
          <Button size="xs" onClick={() => notify(`Daily spend cap updated to $${dailyBudget}`)}>Update Cap</Button>
        </Card>

        <Card className="p-4 space-y-3">
          <div className="text-xs text-[var(--muted-foreground)]">SERP & Keyword Cache</div>
          <div className="text-2xl font-semibold font-mono">{cacheHits} <span className="text-xs font-normal text-[var(--muted-foreground)]">hit rate</span></div>
          <Button
            size="xs"
            variant="outline"
            onClick={() => {
              setCacheHits('0.0% (warming)');
              notify('Purged Redis SEO cache keys');
            }}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" /> Purge Cache
          </Button>
        </Card>

        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--muted-foreground)]">Crawl Worker Queue</span>
            <Badge tone="success" variant="sm">Healthy</Badge>
          </div>
          <div className="text-2xl font-semibold font-mono">{queueDepth} <span className="text-xs font-normal text-[var(--muted-foreground)]">jobs pending</span></div>
          <Button
            size="xs"
            variant="outline"
            onClick={() => {
              setQueueDepth(0);
              notify('Flushed & processed pending crawl jobs');
            }}
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Drain Queue
          </Button>
        </Card>
      </div>
    </div>
  );
}
