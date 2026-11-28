'use client';

import * as React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { CheckCircle2, Save, Headphones } from 'lucide-react';

export default function AdminSettingsSupportPage() {
  const [departments, setDepartments] = React.useState('Technical Support, Billing & Accounts, SMM Order Inquiries, Enterprise Custom Solutions');
  const [defaultPriority, setDefaultPriority] = React.useState('medium');
  const [slaFirstResponseHours, setSlaFirstResponseHours] = React.useState('4');
  const [slaResolutionHours, setSlaResolutionHours] = React.useState('24');
  const [autoCloseInactiveDays, setAutoCloseInactiveDays] = React.useState('5');
  const [businessHours, setBusinessHours] = React.useState('Mon - Fri: 08:00 - 20:00 UTC, Sat: 10:00 - 16:00 UTC');
  const [customerSatisfactionSurvey, setCustomerSatisfactionSurvey] = React.useState(true);

  const [toast, setToast] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/settings?section=support');
        if (res.ok) {
          const json = await res.json();
          if (json.data && Object.keys(json.data).length > 0) {
            const d = json.data;
            if (d.departments) setDepartments(d.departments);
            if (d.defaultPriority) setDefaultPriority(d.defaultPriority);
            if (d.slaFirstResponseHours) setSlaFirstResponseHours(d.slaFirstResponseHours);
            if (d.slaResolutionHours) setSlaResolutionHours(d.slaResolutionHours);
            if (d.autoCloseInactiveDays) setAutoCloseInactiveDays(d.autoCloseInactiveDays);
            if (d.businessHours) setBusinessHours(d.businessHours);
            if (d.customerSatisfactionSurvey !== undefined) setCustomerSatisfactionSurvey(d.customerSatisfactionSurvey);
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
        departments,
        defaultPriority,
        slaFirstResponseHours,
        slaResolutionHours,
        autoCloseInactiveDays,
        businessHours,
        customerSatisfactionSurvey,
      };
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'support', data: payload }),
      });
      if (res.ok) {
        setToast('Support & SLA settings saved successfully.');
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
            <Headphones className="w-4 h-4 text-primary" />
            <span>6. Support & SLA Escalation Rules</span>
          </h3>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            Configure support departments, first response targets, resolution SLAs, and ticket lifecycle automation.
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
        <Textarea
          label="Active Support Departments (comma separated)"
          value={departments}
          onChange={(e) => setDepartments(e.target.value)}
          rows={2}
          placeholder="Technical Support, Billing, Sales..."
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select
            label="Default Ticket Priority"
            value={defaultPriority}
            onChange={(e) => setDefaultPriority(e.target.value)}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </Select>

          <Input
            label="SLA First Response Target (Hours)"
            type="number"
            value={slaFirstResponseHours}
            onChange={(e) => setSlaFirstResponseHours(e.target.value)}
          />

          <Input
            label="SLA Full Resolution Target (Hours)"
            type="number"
            value={slaResolutionHours}
            onChange={(e) => setSlaResolutionHours(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Auto-Close Inactive Resolved Tickets (Days)"
            type="number"
            value={autoCloseInactiveDays}
            onChange={(e) => setAutoCloseInactiveDays(e.target.value)}
          />

          <Input
            label="Declared Support Operating Hours"
            value={businessHours}
            onChange={(e) => setBusinessHours(e.target.value)}
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={customerSatisfactionSurvey}
            onChange={(e) => setCustomerSatisfactionSurvey(e.target.checked)}
            className="rounded border-[var(--border)] text-primary focus:ring-primary"
          />
          <div>
            <div className="font-medium text-[var(--foreground)]">Send CSAT Survey on Ticket Resolution</div>
            <div className="text-[11px] text-[var(--muted-foreground)]">Emails a 1-5 star feedback questionnaire to customer once resolved</div>
          </div>
        </label>

        <div className="flex justify-end pt-3 border-t border-[var(--border)]">
          <Button size="sm" type="submit">
            <Save className="w-3.5 h-3.5 mr-1.5" /> Save Support & SLA Settings
          </Button>
        </div>
      </form>
    </Card>
  );
}
