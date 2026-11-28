'use client';

import * as React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, BadgeTone } from '@/components/ui/Badge';
import { Input, Select } from '@/components/ui/Input';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import {
  Search,
  ShieldCheck,
  Wallet,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Minus,
  Key,
  Lock,
  ExternalLink,
  Shield,
  Eye,
} from 'lucide-react';

interface ClientAccount {
  id: string;
  name: string;
  email: string;
  organization: string;
  tier: 'Starter' | 'Growth' | 'Enterprise' | 'Agency';
  balance: number;
  trustScore: number;
  kycStatus: 'Verified' | 'Pending' | 'Unverified';
  activeServices: number;
  mrr: number;
  status: 'Active' | 'Suspended' | 'Review';
  lastLogin: string;
  supportPin: string;
}

const INITIAL_ACCOUNTS: ClientAccount[] = [
  {
    id: 'AC-8812',
    name: 'David Thorne',
    email: 'd.thorne@oakridge.uk',
    organization: 'Oakridge Financial Ltd',
    tier: 'Enterprise',
    balance: 4250.0,
    trustScore: 96,
    kycStatus: 'Verified',
    activeServices: 14,
    mrr: 1290,
    status: 'Active',
    lastLogin: '12 mins ago',
    supportPin: '489210',
  },
  {
    id: 'AC-8809',
    name: 'Aisha Patel',
    email: 'aisha@brightstack.dev',
    organization: 'BrightStack Studio',
    tier: 'Agency',
    balance: 680.5,
    trustScore: 88,
    kycStatus: 'Verified',
    activeServices: 9,
    mrr: 540,
    status: 'Active',
    lastLogin: '2 hours ago',
    supportPin: '742918',
  },
  {
    id: 'AC-8804',
    name: 'Lucas Meyer',
    email: 'lucas@meyer-ventures.de',
    organization: 'Meyer Ventures GmbH',
    tier: 'Growth',
    balance: 120.0,
    trustScore: 62,
    kycStatus: 'Pending',
    activeServices: 3,
    mrr: 199,
    status: 'Review',
    lastLogin: '1 day ago',
    supportPin: '192837',
  },
  {
    id: 'AC-8798',
    name: 'Hannah Kim',
    email: 'hannah@lumina-ai.kr',
    organization: 'Lumina AI',
    tier: 'Enterprise',
    balance: 8900.0,
    trustScore: 99,
    kycStatus: 'Verified',
    activeServices: 22,
    mrr: 2450,
    status: 'Active',
    lastLogin: '5 mins ago',
    supportPin: '837492',
  },
  {
    id: 'AC-8791',
    name: 'Victor Alvarez',
    email: 'victor@fastpromo.net',
    organization: 'FastPromo Network',
    tier: 'Starter',
    balance: 0.0,
    trustScore: 34,
    kycStatus: 'Unverified',
    activeServices: 1,
    mrr: 29,
    status: 'Suspended',
    lastLogin: '6 days ago',
    supportPin: '554123',
  },
];

const STATUS_TONE: Record<ClientAccount['status'], BadgeTone> = {
  Active: 'success',
  Suspended: 'danger',
  Review: 'warning',
};

const TIER_TONE: Record<ClientAccount['tier'], BadgeTone> = {
  Enterprise: 'primary',
  Agency: 'lilac',
  Growth: 'neutral',
  Starter: 'neutral',
};

export default function AdminCustomersRegisteredPage() {
  const [accounts, setAccounts] = React.useState<ClientAccount[]>(INITIAL_ACCOUNTS);
  const [search, setSearch] = React.useState('');
  const [tierFilter, setTierFilter] = React.useState('ALL');
  const [selected, setSelected] = React.useState<ClientAccount | null>(null);
  const [balanceDelta, setBalanceDelta] = React.useState('100');
  const [toast, setToast] = React.useState<string | null>(null);

  // Current Actor Mode: Admin (direct login) vs Staff (requires customer Support PIN)
  const [currentStaffRole, setCurrentStaffRole] = React.useState<'ADMIN' | 'STAFF'>('ADMIN');

  // Staff Support PIN Prompt Modal
  const [isPinModalOpen, setIsPinModalOpen] = React.useState(false);
  const [enteredPin, setEnteredPin] = React.useState('');
  const [pinError, setPinError] = React.useState<string | null>(null);
  const [loggingIn, setLoggingIn] = React.useState(false);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = React.useMemo(() => {
    return accounts.filter((a) => {
      const q = search.toLowerCase();
      const matchesQ =
        !q ||
        a.name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.organization.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q);
      const matchesTier = tierFilter === 'ALL' || a.tier === tierFilter;
      return matchesQ && matchesTier;
    });
  }, [accounts, search, tierFilter]);

  const adjustBalance = (id: string, delta: number) => {
    setAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, balance: Math.max(0, a.balance + delta) } : a))
    );
    notify(`Wallet balance updated by $${delta.toFixed(2)}`);
  };

  const updateTrustScore = (id: string, score: number) => {
    setAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, trustScore: Math.min(100, Math.max(0, score)) } : a))
    );
  };

  const updateStatus = (id: string, status: ClientAccount['status']) => {
    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    notify(`Account status changed to ${status}`);
  };

  // Impersonate / Login as Client Handler
  const handleInitiateLoginAsClient = (account: ClientAccount) => {
    if (currentStaffRole === 'ADMIN') {
      // Super Admin: Direct one-click login without PIN prompt
      executeImpersonation(account);
    } else {
      // Support Staff: Require Customer Support PIN
      setEnteredPin('');
      setPinError(null);
      setIsPinModalOpen(true);
    }
  };

  const handleVerifyPinAndLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    if (enteredPin.trim() !== selected.supportPin) {
      setPinError('Invalid Support PIN. Please request the 6-digit Support PIN from the client.');
      return;
    }
    setIsPinModalOpen(false);
    executeImpersonation(selected, enteredPin.trim());
  };

  const executeImpersonation = async (account: ClientAccount, pin?: string) => {
    setLoggingIn(true);
    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: account.id,
          customerName: account.name,
          customerEmail: account.email,
          supportPin: pin,
          staffRole: currentStaffRole,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        notify(`Impersonation session established. Redirecting to client portal...`);
        setTimeout(() => {
          window.location.href = json.redirect || '/dashboard';
        }, 800);
      } else {
        notify(json.error || 'Failed to authenticate impersonation session.');
      }
    } catch {
      notify('Network error starting impersonation session.');
    } finally {
      setLoggingIn(false);
    }
  };

  const columns: Column<ClientAccount>[] = [
    {
      key: 'name',
      header: 'Customer / Organization',
      render: (row) => (
        <div>
          <div className="font-semibold text-xs text-[var(--foreground)]">{row.name}</div>
          <div className="text-[11px] text-[var(--muted-foreground)]">
            {row.organization} · {row.email}
          </div>
        </div>
      ),
    },
    {
      key: 'tier',
      header: 'Tier',
      render: (row) => <Badge tone={TIER_TONE[row.tier]}>{row.tier}</Badge>,
    },
    {
      key: 'supportPin',
      header: 'Support PIN',
      render: (row) => (
        <span className="font-mono text-xs font-bold bg-[var(--muted)]/60 px-2 py-0.5 rounded border border-[var(--border)]">
          {row.supportPin}
        </span>
      ),
    },
    {
      key: 'balance',
      header: 'Wallet Balance',
      render: (row) => (
        <span className="font-mono text-xs font-semibold tabular-nums">
          ${row.balance.toFixed(2)}
        </span>
      ),
    },
    {
      key: 'trustScore',
      header: 'Trust Score',
      render: (row) => {
        const tone =
          row.trustScore >= 80
            ? 'text-[var(--success)]'
            : row.trustScore >= 50
            ? 'text-[var(--warning)]'
            : 'text-[var(--destructive)]';
        return (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-16 rounded-full bg-[var(--muted)] overflow-hidden">
              <div
                className="h-full bg-[var(--primary)]"
                style={{ width: `${row.trustScore}%` }}
              />
            </div>
            <span className={`font-mono text-xs font-semibold ${tone}`}>{row.trustScore}</span>
          </div>
        );
      },
    },
    {
      key: 'mrr',
      header: 'MRR / Services',
      render: (row) => (
        <div className="text-xs">
          <span className="font-mono font-semibold">${row.mrr}/mo</span>
          <span className="text-[var(--muted-foreground)]"> · {row.activeServices} active</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge tone={STATUS_TONE[row.status]}>{row.status}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="inline-flex items-center gap-1.5">
          <Button
            size="xs"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              handleInitiateLoginAsClient(row);
            }}
            title="Log in directly to client dashboard"
          >
            <UserCheck className="w-3 h-3 mr-1" />
            Login as Client
          </Button>
          <Button
            size="xs"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              setSelected(row);
            }}
          >
            Client 360
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        title="Registered Users"
        subtitle="Universal registry of all customer accounts (staff and administrators are strictly stored on an isolated system and excluded here)."
        actions={
          <div className="flex items-center gap-2 bg-[var(--muted)]/50 p-1.5 rounded-lg border border-[var(--border)]">
            <span className="text-[11px] font-semibold text-[var(--muted-foreground)] px-1">
              Active Admin Role:
            </span>
            <div className="inline-flex rounded-md p-0.5 bg-[var(--card)] border border-[var(--border)]">
              <button
                type="button"
                onClick={() => setCurrentStaffRole('ADMIN')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                  currentStaffRole === 'ADMIN'
                    ? 'bg-[var(--primary)] text-white shadow-xs'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                Super Admin (Direct Login)
              </button>
              <button
                type="button"
                onClick={() => setCurrentStaffRole('STAFF')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                  currentStaffRole === 'STAFF'
                    ? 'bg-[var(--primary)] text-white shadow-xs'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                Support Staff (Requires PIN)
              </button>
            </div>
          </div>
        }
      />

      {toast && (
        <div className="cpki-card-insight px-4 py-2.5 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="relative w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <Input
              placeholder="Search client, email, org, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-xs"
            />
          </div>
          <Select value={tierFilter} onChange={(e) => setTierFilter(e.target.value)} className="w-40 text-xs">
            <option value="ALL">All Tiers</option>
            <option value="Enterprise">Enterprise</option>
            <option value="Agency">Agency</option>
            <option value="Growth">Growth</option>
            <option value="Starter">Starter</option>
          </Select>
        </div>
        <div className="text-xs text-[var(--muted-foreground)]">
          Showing {filtered.length} of {accounts.length} registered accounts
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <DataTable
          columns={columns}
          data={filtered}
          rowKey={(r) => r.id}
          onRowClick={(r) => setSelected(r)}
        />
      </Card>

      {/* Client 360 Full Profile Modal */}
      <Modal
        isOpen={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? `Client 360 · ${selected.organization}` : 'Client 360'}
        maxWidth="660px"
      >
        {selected && (
          <div className="space-y-5 text-sm">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div>
                <div className="font-semibold text-[var(--foreground)] text-base">
                  {selected.name}{' '}
                  <span className="text-xs font-normal text-[var(--muted-foreground)]">
                    ({selected.id})
                  </span>
                </div>
                <div className="text-xs text-[var(--muted-foreground)]">
                  {selected.email} · Last login {selected.lastLogin}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge tone={STATUS_TONE[selected.status]}>{selected.status}</Badge>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleInitiateLoginAsClient(selected)}
                  disabled={loggingIn}
                >
                  <UserCheck className="w-4 h-4 mr-1.5" />
                  {loggingIn ? 'Connecting...' : 'Login as Client'}
                </Button>
              </div>
            </div>

            {/* Support PIN & Credentials Card */}
            <div className="rounded-xl border border-[var(--primary)]/30 bg-[var(--primary)]/5 p-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-[var(--primary-text)] flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" /> Customer Support PIN
                </div>
                <p className="text-[11px] text-[var(--muted-foreground)]">
                  Customers provide this PIN when contacting phone or ticket support. Required for staff impersonation.
                </p>
              </div>
              <div className="font-mono text-base font-bold tracking-widest bg-[var(--card)] px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--foreground)]">
                {selected.supportPin}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-[var(--radius-control)] border border-[var(--border)] p-3.5 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-medium text-[var(--muted-foreground)]">
                  <span className="flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5" /> Account Balance
                  </span>
                  <span className="font-mono text-base font-semibold text-[var(--foreground)]">
                    ${selected.balance.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={balanceDelta}
                    onChange={(e) => setBalanceDelta(e.target.value)}
                    className="h-8 text-xs font-semibold"
                  />
                  <Button
                    size="xs"
                    onClick={() => adjustBalance(selected.id, Math.abs(Number(balanceDelta) || 0))}
                  >
                    <Plus className="w-3 h-3 mr-1" /> Credit
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => adjustBalance(selected.id, -Math.abs(Number(balanceDelta) || 0))}
                  >
                    <Minus className="w-3 h-3 mr-1" /> Debit
                  </Button>
                </div>
              </div>

              <div className="rounded-[var(--radius-control)] border border-[var(--border)] p-3.5 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-medium text-[var(--muted-foreground)]">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" /> Trust &amp; Risk Score
                  </span>
                  <span className="font-mono text-base font-semibold text-[var(--foreground)]">
                    {selected.trustScore}/100
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={selected.trustScore}
                  onChange={(e) => updateTrustScore(selected.id, Number(e.target.value))}
                  className="w-full accent-[var(--primary)]"
                />
                <div className="flex justify-between text-[11px] text-[var(--muted-foreground)]">
                  <span>High Risk (0)</span>
                  <span>Trusted (100)</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
              <Button
                size="xs"
                variant="outline"
                onClick={() =>
                  updateStatus(selected.id, selected.status === 'Suspended' ? 'Active' : 'Suspended')
                }
              >
                <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                {selected.status === 'Suspended' ? 'Reactivate Account' : 'Suspend Account'}
              </Button>
              <Button size="sm" onClick={() => setSelected(null)}>
                Done
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Staff Support PIN Verification Modal */}
      <Modal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        title="Staff Authorization · Customer Support PIN Required"
        maxWidth="460px"
      >
        <form onSubmit={handleVerifyPinAndLogin} className="space-y-4">
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-300 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> Staff Security Gate
            </div>
            <p>
              Support staff members must enter the customer&apos;s verified 6-digit Support PIN before logging in as client <strong>{selected?.name}</strong>.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--foreground)]">
              6-Digit Support PIN *
            </label>
            <Input
              required
              autoFocus
              type="password"
              maxLength={6}
              placeholder="e.g. 489210"
              value={enteredPin}
              onChange={(e) => {
                setEnteredPin(e.target.value);
                setPinError(null);
              }}
              className="text-center font-mono text-base tracking-widest font-bold"
            />
            {pinError && <p className="text-xs text-rose-500 font-semibold">{pinError}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsPinModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={loggingIn}>
              {loggingIn ? 'Authenticating...' : 'Verify PIN &amp; Login'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
