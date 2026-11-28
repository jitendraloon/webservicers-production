'use client';

import * as React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { Download, TrendingUp, CheckCircle2 } from 'lucide-react';

const MONTHLY_REVENUE = [
  { month: 'Jun', revenue: 42100, orders: 312 },
  { month: 'Jul', revenue: 46800, orders: 349 },
  { month: 'Aug', revenue: 51200, orders: 381 },
  { month: 'Sep', revenue: 55900, orders: 410 },
  { month: 'Oct', revenue: 63400, orders: 468 },
  { month: 'Nov', revenue: 71850, orders: 524 },
];

export default function AdminReportsPage() {
  const [range, setRange] = React.useState('6m');
  const [toast, setToast] = React.useState<string | null>(null);

  const exportCsv = () => {
    setToast(`Exported financial & cohort report (${range}) as CSV`);
    setTimeout(() => setToast(null), 3000);
  };

  const maxRev = Math.max(...MONTHLY_REVENUE.map((m) => m.revenue));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Analytics"
        subtitle="Revenue recognition, MRR growth, churn cohorts, and service margin performance."
        actions={
          <div className="flex items-center gap-2">
            <Select value={range} onChange={(e) => setRange(e.target.value)} className="w-36">
              <option value="30d">Last 30 Days</option>
              <option value="6m">Last 6 Months</option>
              <option value="12m">Last 12 Months</option>
            </Select>
            <Button size="sm" variant="outline" onClick={exportCsv}>
              <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
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

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-xs text-[var(--muted-foreground)]">Gross Revenue (Nov)</div>
          <div className="mt-1 text-2xl font-semibold font-mono">$71,850</div>
          <div className="mt-1 text-[11px] text-[var(--success)] flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +13.3% MoM
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-[var(--muted-foreground)]">Net MRR</div>
          <div className="mt-1 text-2xl font-semibold font-mono">$58,400</div>
          <div className="mt-1 text-[11px] text-[var(--success)]">97.4% net retention</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-[var(--muted-foreground)]">Avg Order Value</div>
          <div className="mt-1 text-2xl font-semibold font-mono">$137.12</div>
          <div className="mt-1 text-[11px] text-[var(--muted-foreground)]">524 orders</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-[var(--muted-foreground)]">Gross Margin</div>
          <div className="mt-1 text-2xl font-semibold font-mono">68.4%</div>
          <div className="mt-1 text-[11px] text-[var(--muted-foreground)]">After API & infra costs</div>
        </Card>
      </div>

      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Monthly Revenue Trend</h3>
          <span className="text-xs text-[var(--muted-foreground)]">USD · Gross Settled</span>
        </div>
        <div className="space-y-3">
          {MONTHLY_REVENUE.map((m) => (
            <div key={m.month} className="flex items-center gap-3 text-xs">
              <span className="w-10 font-mono text-[var(--muted-foreground)]">{m.month}</span>
              <div className="flex-1 h-6 rounded-[var(--radius-control)] bg-[var(--muted)] overflow-hidden">
                <div
                  className="h-full bg-[var(--primary)] flex items-center justify-end pr-2 text-[11px] font-mono text-[var(--primary-foreground)]"
                  style={{ width: `${Math.round((m.revenue / maxRev) * 100)}%` }}
                >
                  ${m.revenue.toLocaleString()}
                </div>
              </div>
              <span className="w-20 text-right text-[var(--muted-foreground)]">{m.orders} orders</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
