'use client';

import * as React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, BadgeTone } from '@/components/ui/Badge';
import { Input, Select } from '@/components/ui/Input';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { UserPlus, CheckCircle2 } from 'lucide-react';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  department: 'Engineering' | 'Support' | 'Billing & Risk' | 'Operations';
  role: 'Super Admin' | 'Support Lead' | 'Billing Analyst' | 'Site Reliability';
  status: 'Active' | 'On Leave' | 'Suspended';
  mfaEnabled: boolean;
  lastActive: string;
}

const INITIAL_STAFF: StaffMember[] = [
  { id: 'ST-01', name: 'Sarah Jenkins', email: 'sarah@webservicers.io', department: 'Support', role: 'Support Lead', status: 'Active', mfaEnabled: true, lastActive: 'Online now' },
  { id: 'ST-02', name: 'Alex Rivera', email: 'alex@webservicers.io', department: 'Billing & Risk', role: 'Billing Analyst', status: 'Active', mfaEnabled: true, lastActive: '18m ago' },
  { id: 'ST-03', name: 'Marcus Chen', email: 'marcus@webservicers.io', department: 'Engineering', role: 'Site Reliability', status: 'Active', mfaEnabled: true, lastActive: '5m ago' },
  { id: 'ST-04', name: 'Nadia Kowalski', email: 'nadia@webservicers.io', department: 'Operations', role: 'Super Admin', status: 'On Leave', mfaEnabled: true, lastActive: '2d ago' },
];

const STATUS_TONE: Record<StaffMember['status'], BadgeTone> = {
  Active: 'success',
  'On Leave': 'warning',
  Suspended: 'danger',
};

export default function AdminStaffPage() {
  const [staff, setStaff] = React.useState<StaffMember[]>(INITIAL_STAFF);
  const [deptFilter, setDeptFilter] = React.useState('ALL');
  const [isInviteOpen, setIsInviteOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [department, setDepartment] = React.useState<StaffMember['department']>('Support');
  const [role, setRole] = React.useState<StaffMember['role']>('Support Lead');
  const [toast, setToast] = React.useState<string | null>(null);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = staff.filter((s) => deptFilter === 'ALL' || s.department === deptFilter);

  const toggleStatus = (id: string) => {
    setStaff((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, status: s.status === 'Suspended' ? 'Active' : 'Suspended' } : s
      )
    );
    notify(`Updated access status for ${id}`);
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    const created: StaffMember = {
      id: `ST-0${staff.length + 1}`,
      name: name.trim(),
      email: email.trim(),
      department,
      role,
      status: 'Active',
      mfaEnabled: false,
      lastActive: 'Invited',
    };
    setStaff((prev) => [created, ...prev]);
    setIsInviteOpen(false);
    setName('');
    setEmail('');
    notify(`Invitation sent to ${created.email}`);
  };

  const columns: Column<StaffMember>[] = [
    {
      key: 'name',
      header: 'Staff Member',
      render: (r) => (
        <div>
          <div className="font-medium text-[var(--foreground)]">{r.name}</div>
          <div className="text-[11px] text-[var(--muted-foreground)]">{r.id} · {r.email}</div>
        </div>
      ),
    },
    { key: 'department', header: 'Department' },
    {
      key: 'role',
      header: 'Assigned Role',
      render: (r) => <Badge tone="lilac" variant="sm">{r.role}</Badge>,
    },
    {
      key: 'mfaEnabled',
      header: '2FA',
      render: (r) => (
        <Badge tone={r.mfaEnabled ? 'success' : 'warning'} variant="sm">
          {r.mfaEnabled ? 'Enforced' : 'Pending'}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>,
    },
    { key: 'lastActive', header: 'Last Active' },
    {
      key: 'actions',
      header: '',
      cellClassName: 'text-right',
      render: (r) => (
        <Button size="xs" variant="outline" onClick={() => toggleStatus(r.id)}>
          {r.status === 'Suspended' ? 'Restore' : 'Suspend'}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff & Departments"
        subtitle="Manage internal team members, department assignments, 2FA enforcement, and access status."
        actions={
          <Button size="sm" onClick={() => setIsInviteOpen(true)}>
            <UserPlus className="w-3.5 h-3.5 mr-1.5" /> Invite Staff
          </Button>
        }
      />

      {toast && (
        <div className="cpki-card-insight px-4 py-2.5 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="w-48">
          <option value="ALL">All Departments</option>
          <option value="Engineering">Engineering</option>
          <option value="Support">Support</option>
          <option value="Billing & Risk">Billing & Risk</option>
          <option value="Operations">Operations</option>
        </Select>
        <span className="text-xs text-[var(--muted-foreground)]">{filtered.length} team members</span>
      </div>

      <Card className="p-0 overflow-hidden">
        <DataTable columns={columns} data={filtered} rowKey={(r) => r.id} />
      </Card>

      <Modal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} title="Invite Staff Member">
        <form onSubmit={handleInvite} className="space-y-3">
          <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Company Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Department" value={department} onChange={(e) => setDepartment(e.target.value as StaffMember['department'])}>
              <option value="Support">Support</option>
              <option value="Engineering">Engineering</option>
              <option value="Billing & Risk">Billing & Risk</option>
              <option value="Operations">Operations</option>
            </Select>
            <Select label="Role" value={role} onChange={(e) => setRole(e.target.value as StaffMember['role'])}>
              <option value="Support Lead">Support Lead</option>
              <option value="Billing Analyst">Billing Analyst</option>
              <option value="Site Reliability">Site Reliability</option>
              <option value="Super Admin">Super Admin</option>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
            <Button variant="outline" size="sm" onClick={() => setIsInviteOpen(false)}>Cancel</Button>
            <Button type="submit" size="sm">Send Invite</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
