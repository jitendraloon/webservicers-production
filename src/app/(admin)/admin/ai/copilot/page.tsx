'use client';

import * as React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Sparkles, CheckCircle2 } from 'lucide-react';

export default function AdminAiCopilotPage() {
  const [enabled, setEnabled] = React.useState(true);
  const [model, setModel] = React.useState('gemini-2.5-pro');
  const [temperature, setTemperature] = React.useState('0.3');
  const [maxTokens, setMaxTokens] = React.useState('4096');
  const [systemPrompt, setSystemPrompt] = React.useState(
    'You are Loon AI Copilot for WebServicers. Help users configure cloud infrastructure, inspect SEO metrics, and resolve billing questions concisely.'
  );
  const [toast, setToast] = React.useState<string | null>(null);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    setToast('Loon AI Copilot configuration saved.');
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Loon AI Copilot Configuration"
        subtitle="Configure CopilotKit runtime model, temperature, tool permissions, and system instructions."
        actions={
          <Button
            size="sm"
            variant={enabled ? 'primary' : 'outline'}
            onClick={() => setEnabled((v) => !v)}
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            {enabled ? 'Copilot: Enabled' : 'Copilot: Disabled'}
          </Button>
        }
      />

      {toast && (
        <div className="cpki-card-insight px-4 py-2.5 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      <Card className="p-5">
        <form onSubmit={save} className="space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <span className="text-sm font-semibold">Runtime Parameters</span>
            <Badge tone={enabled ? 'success' : 'neutral'} variant="sm">
              {enabled ? 'Active on Storefront & Dashboard' : 'Paused'}
            </Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select label="Primary LLM" value={model} onChange={(e) => setModel(e.target.value)}>
              <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
              <option value="gpt-4o">OpenAI GPT-4o</option>
              <option value="claude-3.7-sonnet">Claude 3.7 Sonnet</option>
            </Select>
            <Input label="Temperature" type="number" step="0.1" min="0" max="1" value={temperature} onChange={(e) => setTemperature(e.target.value)} />
            <Input label="Max Output Tokens" type="number" value={maxTokens} onChange={(e) => setMaxTokens(e.target.value)} />
          </div>
          <Textarea label="System Instructions" value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} rows={4} />
          <div className="flex justify-end pt-2 border-t border-[var(--border)]">
            <Button type="submit" size="sm">Save Copilot Config</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
