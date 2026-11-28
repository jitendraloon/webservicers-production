'use client';

import * as React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { CheckCircle2, Save, Receipt, Percent } from 'lucide-react';

export default function AdminSettingsBillingPage() {
  const [taxRate, setTaxRate] = React.useState('0');
  const [taxName, setTaxName] = React.useState('VAT / Sales Tax');
  const [taxNumber, setTaxNumber] = React.useState('US-EIN-98210491');
  const [taxMode, setTaxMode] = React.useState<'exclusive' | 'inclusive'>('exclusive');
  const [minDeposit, setMinDeposit] = React.useState('10');
  const [maxDeposit, setMaxDeposit] = React.useState('5000');
  const [passGatewayFees, setPassGatewayFees] = React.useState(false);
  const [feePercent, setFeePercent] = React.useState('2.9');
  const [feeFixed, setFeeFixed] = React.useState('0.30');
  const [autoInvoiceOnCheckout, setAutoInvoiceOnCheckout] = React.useState(true);

  const [toast, setToast] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/settings?section=billing');
        if (res.ok) {
          const json = await res.json();
          if (json.data && Object.keys(json.data).length > 0) {
            const d = json.data;
            if (d.taxRate) setTaxRate(d.taxRate);
            if (d.taxName) setTaxName(d.taxName);
            if (d.taxNumber) setTaxNumber(d.taxNumber);
            if (d.taxMode) setTaxMode(d.taxMode);
            if (d.minDeposit) setMinDeposit(d.minDeposit);
            if (d.maxDeposit) setMaxDeposit(d.maxDeposit);
            if (d.passGatewayFees !== undefined) setPassGatewayFees(d.passGatewayFees);
            if (d.feePercent) setFeePercent(d.feePercent);
            if (d.feeFixed) setFeeFixed(d.feeFixed);
            if (d.autoInvoiceOnCheckout !== undefined) setAutoInvoiceOnCheckout(d.autoInvoiceOnCheckout);
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
        taxRate,
        taxName,
        taxNumber,
        taxMode,
        minDeposit,
        maxDeposit,
        passGatewayFees,
        feePercent,
        feeFixed,
        autoInvoiceOnCheckout,
      };
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'billing', data: payload }),
      });
      if (res.ok) {
        setToast('Billing & Tax Rules saved successfully.');
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
            <Receipt className="w-4 h-4 text-primary" />
            <span>4. Billing & Tax Rules</span>
          </h3>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            Configure worldwide VAT / GST percentages, customer wallet deposit boundaries, and checkout invoice generation.
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
            label="Tax / VAT Rate (%)"
            type="number"
            step="0.1"
            value={taxRate}
            onChange={(e) => setTaxRate(e.target.value)}
          />

          <Input
            label="Tax Display Label"
            value={taxName}
            onChange={(e) => setTaxName(e.target.value)}
            placeholder="e.g. VAT, GST, Sales Tax"
          />

          <Select
            label="Tax Calculation Mode"
            value={taxMode}
            onChange={(e) => setTaxMode(e.target.value as any)}
          >
            <option value="exclusive">Exclusive (Added to subtotal at checkout)</option>
            <option value="inclusive">Inclusive (Prices already include tax)</option>
          </Select>
        </div>

        <Input
          label="Corporate Tax ID / VAT Registration Number"
          value={taxNumber}
          onChange={(e) => setTaxNumber(e.target.value)}
          placeholder="e.g. EU123456789 or EIN-XX-XXXXXXX"
        />

        <div className="p-3 bg-[var(--muted)] rounded-lg space-y-3 border border-[var(--border)]">
          <div className="font-semibold text-[var(--foreground)]">Customer Wallet Balance Limits</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Minimum Single Deposit ($)"
              type="number"
              value={minDeposit}
              onChange={(e) => setMinDeposit(e.target.value)}
            />
            <Input
              label="Maximum Single Deposit ($)"
              type="number"
              value={maxDeposit}
              onChange={(e) => setMaxDeposit(e.target.value)}
            />
          </div>
        </div>

        <div className="p-3 bg-[var(--muted)] rounded-lg space-y-3 border border-[var(--border)]">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[var(--foreground)]">Payment Gateway Processing Surcharge</span>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={passGatewayFees}
                onChange={(e) => setPassGatewayFees(e.target.checked)}
                className="rounded border-[var(--border)] text-primary focus:ring-primary"
              />
              <span className="text-[11px] text-[var(--foreground)]">Pass gateway fee to customer</span>
            </label>
          </div>
          {passGatewayFees && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <Input
                label="Percentage Surcharge (%)"
                type="number"
                step="0.1"
                value={feePercent}
                onChange={(e) => setFeePercent(e.target.value)}
              />
              <Input
                label="Fixed Transaction Fee ($)"
                type="number"
                step="0.05"
                value={feeFixed}
                onChange={(e) => setFeeFixed(e.target.value)}
              />
            </div>
          )}
        </div>

        <label className="flex items-center gap-2 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={autoInvoiceOnCheckout}
            onChange={(e) => setAutoInvoiceOnCheckout(e.target.checked)}
            className="rounded border-[var(--border)] text-primary focus:ring-primary"
          />
          <div>
            <div className="font-medium text-[var(--foreground)]">Automatically Generate PDF Invoices on Order Payment</div>
            <div className="text-[11px] text-[var(--muted-foreground)]">Emails PDF tax invoice copy to customer upon successful settlement</div>
          </div>
        </label>

        <div className="flex justify-end pt-3 border-t border-[var(--border)]">
          <Button size="sm" type="submit">
            <Save className="w-3.5 h-3.5 mr-1.5" /> Save Billing & Tax Rules
          </Button>
        </div>
      </form>
    </Card>
  );
}
