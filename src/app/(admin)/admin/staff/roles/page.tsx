'use client';

import * as React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Shield, CheckCircle2 } from 'lucide-react';

const ROLES = ['Super Admin', 'Support Lead', 'Billing Analyst', 'Site Reliability'] as const;
type RoleName = (typeof ROLES)[number];

const PERMISSIONS = [
  { key: 'customers.read', label: 'View Client 360 & Leads' },
  { key: 'customers.impersonate', label: 'Impersonate Customer Sessions' },
  { key: 'billing.refund', label: 'Issue Refunds & Wallet Credits' },
  { key: 'kyc.approve', label: 'Approve / Reject KYC & GDPR' },
  { key: 'support.tickets', label: 'Manage Support Tickets & Inbox' },
  { key: 'seo.providers', label: 'Configure SEO API & Data Sources' },
  { key: 'smm.providers', label: 'Configure SMM Providers & Margins' },
  { key: 'settings.system', label: 'Modify Platform Settings & Backups' },
];

const INITIAL_MATRIX: Record<RoleName, Record<string, boolean>> = {
  'Super Admin': Object.fromEntries(PERMISSIONS.map((p) => [p.key, true])),
  'Support Lead': {
    'customers.read': true,
    'customers.impersonate': true,
    'billing.refund': false,
    'kyc.approve': false,
    'support.tickets': true,
    'seo.providers': false,
    'smm.providers': false,
    'settings.system': false,
  },
  'Billing Analyst': {
    'customers.read': true,
    'customers.impersonate': false,
    'billing.refund': true,
    'kyc.approve': true,
    'support.tickets': true,
    'seo.providers': false,
    'smm.providers': false,
    'settings.system': false,
  },
  'Site Reliability': {
    'customers.read': true,
    'customers.impersonate': false,
    'billing.refund': false,
    'kyc.approve': false,
    'support.tickets': false,
    'seo.providers': true,
    'smm.providers': true,
    'settings.system': true,
  },
};

export default function AdminStaffRolesPage() {
  const [matrix, setMatrix] = React.useState(INITIAL_MATRIX);
  const [toast, setToast] = React.useState<string | null>(null);

  const toggle = (role: RoleName, permKey: string) => {
    if (role === 'Super Admin') return;
    setMatrix((prev) => ({
      ...prev,
      [role]: { ...prev[role], [permKey]: !prev[role][permKey] },
    }));
  };

  const saveMatrix = () => {
    setToast('RBAC privileges matrix saved and propagated to active sessions.');
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & Privileges Matrix"
        subtitle="Fine-grained RBAC capability matrix across administrative and operational roles."
        actions={
          <Button size="sm" onClick={saveMatrix}>
            <Shield className="w-3.5 h-3.5 mr-1.5" /> Save Privileges
          </Button>
        }
      />

      {toast && (
        <div className="cpki-card-insight px-4 py-2.5 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      <Card className="p-0 overflow-x-auto">
        <table className="cpki-table">
          <thead>
            <tr>
              <th>Capability</th>
              {ROLES.map((r) => (
                <th key={r} className="text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span>{r}</span>
                    {r === 'Super Admin' && <Badge tone="lilac" variant="sm">Locked</Badge>}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSIONS.map((perm) => (
              <tr key={perm.key}>
                <td>
                  <div className="font-medium text-xs text-[var(--foreground)]">{perm.label}</div>
                  <div className="text-[11px] font-mono text-[var(--muted-foreground)]">{perm.key}</div>
                </td>
                {ROLES.map((role) => {
                  const checked = Boolean(matrix[role][perm.key]);
                  return (
                    <td key={role} className="text-center">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={role === 'Super Admin'}
                        onChange={() => toggle(role, perm.key)}
                        className="h-4 w-4 accent-[var(--primary)] cursor-pointer disabled:opacity-60"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
