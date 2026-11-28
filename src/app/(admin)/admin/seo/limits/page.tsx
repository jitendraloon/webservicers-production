'use client';

import * as React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CheckCircle2 } from 'lucide-react';

interface PlanLimit {
  tier: string;
  dailySerp: number;
  dailyKeywords: number;
  aiBriefsMonthly: number;
  projectsMax: number;
}

const INITIAL_LIMITS: PlanLimit[] = [
  { tier: 'Free / Trial', dailySerp: 20, dailyKeywords: 50, aiBriefsMonthly: 3, projectsMax: 1 },
  { tier: 'Starter', dailySerp: 200, dailyKeywords: 1000, aiBriefsMonthly: 25, projectsMax: 5 },
  { tier: 'Growth', dailySerp: 1500, dailyKeywords: 10000, aiBriefsMonthly: 150, projectsMax: 25 },
  { tier: 'Enterprise', dailySerp: 15000, dailyKeywords: 100000, aiBriefsMonthly: 2000, projectsMax: 250 },
];

export default function AdminSeoLimitsPage() {
  const [plans, setPlans] = React.useState<PlanLimit[]>(INITIAL_LIMITS);
  const [toast, setToast] = React.useState<string | null>(null);

  const updateVal = (idx: number, field: keyof PlanLimit, value: number) => {
    setPlans((prev) => prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p)));
  };

  const save = () => {
    setToast('SEO quota limits & plan entitlements updated.');
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="SEO Limits & Plans"
        subtitle="Configure daily SERP lookups, keyword quotas, AI brief allowances, and project caps per subscription tier."
        actions={<Button size="sm" onClick={save}>Save Quotas</Button>}
      />

      {toast && (
        <div className="cpki-card-insight px-4 py-2.5 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {plans.map((p, idx) => (
          <Card key={p.tier} className="p-4 space-y-3">
            <h3 className="text-sm font-semibold text-[var(--foreground)] border-b border-[var(--border)] pb-2">{p.tier}</h3>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Daily SERP Lookups"
                type="number"
                value={p.dailySerp}
                onChange={(e) => updateVal(idx, 'dailySerp', Number(e.target.value))}
              />
              <Input
                label="Daily Keyword Rows"
                type="number"
                value={p.dailyKeywords}
                onChange={(e) => updateVal(idx, 'dailyKeywords', Number(e.target.value))}
              />
              <Input
                label="AI Briefs / Month"
                type="number"
                value={p.aiBriefsMonthly}
                onChange={(e) => updateVal(idx, 'aiBriefsMonthly', Number(e.target.value))}
              />
              <Input
                label="Max Projects"
                type="number"
                value={p.projectsMax}
                onChange={(e) => updateVal(idx, 'projectsMax', Number(e.target.value))}
              />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
