'use client';

import * as React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { CheckCircle2, Save, FileText } from 'lucide-react';

export default function AdminSettingsInvoicingPage() {
  const [invoicePrefix, setInvoicePrefix] = React.useState('INV-');
  const [nextInvoiceNumber, setNextInvoiceNumber] = React.useState('1001');
  const [dueDays, setDueDays] = React.useState('7');
  const [dunningGraceDays, setDunningGraceDays] = React.useState('3');
  const [dunningRetryIntervals, setDunningRetryIntervals] = React.useState('1, 3, 5, 7');
  const [autoCancelUnpaidDays, setAutoCancelUnpaidDays] = React.useState('14');
  const [invoiceFooterNotes, setInvoiceFooterNotes] = React.useState(
    'Payment is due within 7 days. Thank you for partnering with WebServicers Technologies.'
  );
  const [bankWireInstructions, setBankWireInstructions] = React.useState(
    'Bank: JPMorgan Chase\nAccount Name: WebServicers Technologies Inc.\nRouting/ABA: 021000021\nAccount #: 98210491024\nSWIFT: CHASUS33'
  );

  const [toast, setToast] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/settings?section=invoicing');
        if (res.ok) {
          const json = await res.json();
          if (json.data && Object.keys(json.data).length > 0) {
            const d = json.data;
            if (d.invoicePrefix) setInvoicePrefix(d.invoicePrefix);
            if (d.nextInvoiceNumber) setNextInvoiceNumber(d.nextInvoiceNumber);
            if (d.dueDays) setDueDays(d.dueDays);
            if (d.dunningGraceDays) setDunningGraceDays(d.dunningGraceDays);
            if (d.dunningRetryIntervals) setDunningRetryIntervals(d.dunningRetryIntervals);
            if (d.autoCancelUnpaidDays) setAutoCancelUnpaidDays(d.autoCancelUnpaidDays);
            if (d.invoiceFooterNotes) setInvoiceFooterNotes(d.invoiceFooterNotes);
            if (d.bankWireInstructions) setBankWireInstructions(d.bankWireInstructions);
          }
        }
      } catch (_) {}
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        invoicePrefix,
        nextInvoiceNumber,
        dueDays,
        dunningGraceDays,
        dunningRetryIntervals,
        autoCancelUnpaidDays,
        invoiceFooterNotes,
        bankWireInstructions,
      };
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'invoicing', data: payload }),
      });
      if (res.ok) {
        setToast('Invoicing & Dunning settings saved successfully.');
        setTimeout(() => setToast(null), 3000);
      }
    } catch (_) {
      setToast('Failed to save settings.');
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div>
          <h3 className="text-base font-semibold text-[var(--foreground)] flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <span>5. Invoicing & Dunning Automation</span>
          </h3>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            Configure sequential tax invoice formatting, payment terms, dunning retry policies, and bank transfer memos.
          </p>
        </div>
      </div>

      {toast && (
        <div className="px-4 py-2.5 text-xs font-medium flex items-center gap-2 border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 rounded-lg">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Invoice Prefix"
            value={invoicePrefix}
            onChange={(e) => setInvoicePrefix(e.target.value)}
            placeholder="e.g. INV-"
          />
          <Input
            label="Next Sequential Invoice #"
            type="number"
            value={nextInvoiceNumber}
            onChange={(e) => setNextInvoiceNumber(e.target.value)}
          />
          <Input
            label="Default Payment Terms (Days)"
            type="number"
            value={dueDays}
            onChange={(e) => setDueDays(e.target.value)}
          />
        </div>

        <div className="p-3 bg-[var(--muted)] rounded-lg space-y-3 border border-[var(--border)]">
          <div className="font-semibold text-[var(--foreground)]">Automated Dunning & Overdue Retries</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Grace Period Before First Dunning (Days)"
              type="number"
              value={dunningGraceDays}
              onChange={(e) => setDunningGraceDays(e.target.value)}
            />
            <Input
              label="Dunning Retry Intervals (Days)"
              value={dunningRetryIntervals}
              onChange={(e) => setDunningRetryIntervals(e.target.value)}
              placeholder="1, 3, 5, 7"
            />
            <Input
              label="Auto-Cancel Unpaid After (Days)"
              type="number"
              value={autoCancelUnpaidDays}
              onChange={(e) => setAutoCancelUnpaidDays(e.target.value)}
            />
          </div>
        </div>

        <Textarea
          label="Default Invoice Footer / Legal Terms"
          value={invoiceFooterNotes}
          onChange={(e) => setInvoiceFooterNotes(e.target.value)}
          rows={2}
        />

        <Textarea
          label="Offline Bank Wire / SWIFT Payment Instructions"
          value={bankWireInstructions}
          onChange={(e) => setBankWireInstructions(e.target.value)}
          rows={3}
        />

        <div className="flex justify-end pt-3 border-t border-[var(--border)]">
          <Button size="sm" type="submit">
            <Save className="w-3.5 h-3.5 mr-1.5" /> Save Invoicing & Dunning Settings
          </Button>
        </div>
      </form>
    </Card>
  );
}
