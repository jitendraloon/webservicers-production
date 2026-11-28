'use client';

import * as React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ArrowUp, ArrowDown, CheckCircle2 } from 'lucide-react';

interface WaterfallRule {
  tool: string;
  chain: string[];
  cacheTtl: string;
}

const INITIAL_RULES: WaterfallRule[] = [
  { tool: 'SERP Live Checker', chain: ['Serper.dev', 'DataForSEO', 'SE Ranking'], cacheTtl: '15m' },
  { tool: 'Keyword Volume & Difficulty', chain: ['DataForSEO', 'Semrush API', 'SE Ranking'], cacheTtl: '24h' },
  { tool: 'Backlink Profile & DR', chain: ['Semrush API', 'DataForSEO', 'Ahrefs Enterprise'], cacheTtl: '12h' },
  { tool: 'AI Content & Schema Brief', chain: ['Google Gemini 2.5 Pro', 'OpenAI GPT-4o'], cacheTtl: '7d' },
];

export default function AdminSeoDataSourcesPage() {
  const [rules, setRules] = React.useState<WaterfallRule[]>(INITIAL_RULES);
  const [toast, setToast] = React.useState<string | null>(null);

  const moveProvider = (toolIdx: number, provIdx: number, dir: -1 | 1) => {
    setRules((prev) =>
      prev.map((r, idx) => {
        if (idx !== toolIdx) return r;
        const target = provIdx + dir;
        if (target < 0 || target >= r.chain.length) return r;
        const next = [...r.chain];
        [next[provIdx], next[target]] = [next[target], next[provIdx]];
        return { ...r, chain: next };
      })
    );
  };

  const save = () => {
    setToast('SEO data source waterfall order saved.');
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tool Data Sources Waterfall"
        subtitle="Define primary, secondary, and fallback provider priority for each SEO tool."
        actions={<Button size="sm" onClick={save}>Save Waterfall</Button>}
      />

      {toast && (
        <div className="cpki-card-insight px-4 py-2.5 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      <div className="space-y-4">
        {rules.map((rule, tIdx) => (
          <Card key={rule.tool} className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">{rule.tool}</h3>
              <Badge tone="lilac" variant="sm">Cache TTL: {rule.cacheTtl}</Badge>
            </div>
            <div className="space-y-2">
              {rule.chain.map((prov, pIdx) => (
                <div
                  key={prov}
                  className="flex items-center justify-between rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Badge tone={pIdx === 0 ? 'primary' : 'neutral'} variant="sm">
                      {pIdx === 0 ? 'Primary' : `Fallback #${pIdx}`}
                    </Badge>
                    <span className="font-medium text-[var(--foreground)]">{prov}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="xs" variant="ghost" disabled={pIdx === 0} onClick={() => moveProvider(tIdx, pIdx, -1)}>
                      <ArrowUp className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="xs" variant="ghost" disabled={pIdx === rule.chain.length - 1} onClick={() => moveProvider(tIdx, pIdx, 1)}>
                      <ArrowDown className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
