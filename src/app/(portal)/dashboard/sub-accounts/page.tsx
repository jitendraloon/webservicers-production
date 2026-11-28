"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Edit3,
  Eye,
  Lock,
  Mail,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import type { SubAccount, SubAccountPermission } from "@/app/api/user/sub-accounts/route";

type SectionKey = keyof SubAccount["permissions"];

interface SectionConfigItem {
  key: SectionKey;
  label: string;
  description: string;
}

const SECTIONS_CONFIG: SectionConfigItem[] = [
  {
    key: "orders",
    label: "Orders & Fulfillment",
    description: "View project deliverables, browse orders, place new orders, and submit requirements.",
  },
  {
    key: "billing",
    label: "Invoices, Billing & Funds",
    description: "Access transaction receipts, invoice PDF downloads, and add funds via payment gateways.",
  },
  {
    key: "support",
    label: "Support Tickets & Helpdesk",
    description: "Communicate with account managers, open priority support tickets, and review SLA responses.",
  },
  {
    key: "smm",
    label: "SMM Panel & Services",
    description: "Browse social media catalogs, submit automated orders, and view order execution logs.",
  },
  {
    key: "seo",
    label: "Growth & SEO Workspace",
    description: "Access keyword tracker, audit reports, SERP analyzers, and AI visibility tools.",
  },
  {
    key: "integrations",
    label: "API Keys & Integrations",
    description: "View API credentials, manage webhook endpoints, and connect third-party platforms.",
  },
  {
    key: "settings",
    label: "Account & Profile Settings",
    description: "Edit company profile, manage notification preferences, and view general workspace details.",
  },
];

export default function SubAccountsPage() {
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([]);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  // Invite / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [permissions, setPermissions] = useState<SubAccount["permissions"]>({
    orders: { enabled: true, level: "manage" },
    billing: { enabled: false, level: "view" },
    support: { enabled: true, level: "manage" },
    smm: { enabled: true, level: "view" },
    seo: { enabled: true, level: "view" },
    integrations: { enabled: false, level: "view" },
    settings: { enabled: false, level: "view" },
  });
  const [saving, setSaving] = useState(false);

  const fetchSubAccounts = async () => {
    try {
      const res = await fetch("/api/user/sub-accounts");
      const json = await res.json();
      if (json.ok && Array.isArray(json.subAccounts)) {
        setSubAccounts(json.subAccounts);
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchSubAccounts();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return subAccounts;
    const q = search.toLowerCase();
    return subAccounts.filter(
      (s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
    );
  }, [subAccounts, search]);

  const handleOpenInvite = () => {
    setEditingId(null);
    setName("");
    setEmail("");
    setPermissions({
      orders: { enabled: true, level: "manage" },
      billing: { enabled: false, level: "view" },
      support: { enabled: true, level: "manage" },
      smm: { enabled: true, level: "view" },
      seo: { enabled: true, level: "view" },
      integrations: { enabled: false, level: "view" },
      settings: { enabled: false, level: "view" },
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sub: SubAccount) => {
    setEditingId(sub.id);
    setName(sub.name);
    setEmail(sub.email);
    setPermissions(sub.permissions);
    setIsModalOpen(true);
  };

  const handleTogglePermission = (secKey: string) => {
    setPermissions((prev: any) => ({
      ...prev,
      [secKey]: {
        ...prev[secKey],
        enabled: !prev[secKey]?.enabled,
      },
    }));
  };

  const handleSetLevel = (secKey: string, level: "view" | "manage") => {
    setPermissions((prev: any) => ({
      ...prev,
      [secKey]: {
        ...prev[secKey],
        level,
      },
    }));
  };

  // Quick preset buttons
  const applyPresetAllManager = () => {
    const updated: any = {};
    SECTIONS_CONFIG.forEach((sec) => {
      updated[sec.key] = { enabled: true, level: "manage" };
    });
    setPermissions(updated);
  };

  const applyPresetAllViewer = () => {
    const updated: any = {};
    SECTIONS_CONFIG.forEach((sec) => {
      updated[sec.key] = { enabled: true, level: "view" };
    });
    setPermissions(updated);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        const res = await fetch("/api/user/sub-accounts", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingId,
            name: name.trim(),
            permissions,
          }),
        });
        const json = await res.json();
        if (json.ok) {
          setSubAccounts((prev) => prev.map((s) => (s.id === editingId ? json.subAccount : s)));
          setToast(`Permissions updated for ${name}.`);
          setIsModalOpen(false);
          setTimeout(() => setToast(null), 3000);
        } else {
          setToast(json.error || "Failed to update sub-account");
        }
      } else {
        const res = await fetch("/api/user/sub-accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            permissions,
          }),
        });
        const json = await res.json();
        if (json.ok) {
          setSubAccounts((prev) => [json.subAccount, ...prev]);
          setToast(`Invitation sent to ${email}.`);
          setIsModalOpen(false);
          setTimeout(() => setToast(null), 3000);
        } else {
          setToast(json.error || "Failed to invite sub-account");
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (sub: SubAccount) => {
    if (!confirm(`Revoke access for ${sub.name} (${sub.email})?`)) return;
    const res = await fetch(`/api/user/sub-accounts?id=${sub.id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.ok) {
      setSubAccounts((prev) => prev.filter((s) => s.id !== sub.id));
      setToast(`Sub-account ${sub.name} removed.`);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleToggleStatus = async (sub: SubAccount) => {
    const nextStatus = sub.status === "Active" ? "Suspended" : "Active";
    const res = await fetch("/api/user/sub-accounts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: sub.id, status: nextStatus }),
    });
    const json = await res.json();
    if (json.ok) {
      setSubAccounts((prev) => prev.map((s) => (s.id === sub.id ? json.subAccount : s)));
      setToast(`${sub.name} is now ${nextStatus}.`);
      setTimeout(() => setToast(null), 3000);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        title="Sub-Accounts & Team Access"
        subtitle="Invite team members or collaborators to manage or view specific areas of your account with granular permission controls."
        actions={
          <Button onClick={handleOpenInvite} variant="primary" size="sm">
            <UserPlus className="h-4 w-4 mr-1.5" />
            Invite Sub-Account
          </Button>
        }
      />

      {toast && (
        <div className="cpki-card-insight px-4 py-2.5 text-xs font-medium text-[var(--insight-foreground)] flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />
          {toast}
        </div>
      )}

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 space-y-1">
          <div className="text-xs text-[var(--muted-foreground)]">Active Sub-Accounts</div>
          <div className="text-2xl font-bold text-[var(--foreground)]">
            {subAccounts.filter((s) => s.status === "Active").length}
          </div>
          <div className="text-[11px] text-[var(--muted-foreground)]">Authorized team members</div>
        </Card>
        <Card className="p-4 space-y-1">
          <div className="text-xs text-[var(--muted-foreground)]">Pending Invites</div>
          <div className="text-2xl font-bold text-[var(--primary-text)]">
            {subAccounts.filter((s) => s.status === "Invited").length}
          </div>
          <div className="text-[11px] text-[var(--muted-foreground)]">Awaiting email confirmation</div>
        </Card>
        <Card className="p-4 space-y-1">
          <div className="text-xs text-[var(--muted-foreground)]">Access Control</div>
          <div className="text-2xl font-bold text-[var(--foreground)]">Granular</div>
          <div className="text-[11px] text-[var(--muted-foreground)]">View-Only &amp; Manager modes</div>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <Input
            placeholder="Search team member by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="!pl-9 text-xs"
          />
        </div>
        <div className="text-xs text-[var(--muted-foreground)]">
          Showing {filtered.length} of {subAccounts.length} team members
        </div>
      </div>

      {/* Sub-Accounts List Cards */}
      <div className="space-y-3.5">
        {filtered.length === 0 ? (
          <Card className="p-8 text-center text-xs text-[var(--muted-foreground)] space-y-2">
            <div>No sub-accounts found matching your search.</div>
            <Button onClick={handleOpenInvite} variant="outline" size="xs">
              Invite your first team member
            </Button>
          </Card>
        ) : (
          filtered.map((sub) => {
            const perms = sub.permissions || ({} as any);
            const activePermsCount = Object.values(perms).filter((p: any) => p?.enabled).length;

            return (
              <Card key={sub.id} className="p-5 hover:border-[var(--primary)]/40 transition-colors space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[var(--primary-text)] font-bold text-sm">
                      {sub.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[var(--foreground)]">
                          {sub.name}
                        </span>
                        <Badge
                          tone={
                            sub.status === "Active"
                              ? "success"
                              : sub.status === "Invited"
                              ? "lilac"
                              : "neutral"
                          }
                          variant="sm"
                        >
                          {sub.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-[var(--muted-foreground)] flex items-center gap-2 mt-0.5">
                        <span>{sub.email}</span>
                        <span>&bull;</span>
                        <span>{sub.lastActive}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => handleOpenEdit(sub)}
                      title="Edit permissions"
                    >
                      <Edit3 className="h-3 w-3 mr-1" />
                      Configure Access
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => handleToggleStatus(sub)}
                    >
                      {sub.status === "Active" ? "Suspend" : "Activate"}
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleDelete(sub)}
                      title="Revoke access"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Permissions Breakdown Badges */}
                <div className="pt-2 border-t border-[var(--border)]">
                  <div className="text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">
                    Authorized Sections ({activePermsCount} of {SECTIONS_CONFIG.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {SECTIONS_CONFIG.map((sec) => {
                      const p = (perms as Record<string, SubAccountPermission | undefined>)[sec.key];
                      if (!p || !p.enabled) return null;
                      const isManager = p.level === "manage";

                      return (
                        <span
                          key={sec.key}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${
                            isManager
                              ? "bg-[var(--primary)]/10 text-[var(--primary-text)] border-[var(--primary)]/30 font-semibold"
                              : "bg-[var(--muted)]/60 text-[var(--foreground)] border-[var(--border)]"
                          }`}
                        >
                          {isManager ? (
                            <ShieldCheck className="h-3 w-3 text-[var(--primary)]" />
                          ) : (
                            <Eye className="h-3 w-3 text-[var(--muted-foreground)]" />
                          )}
                          <span>{sec.label}</span>
                          <span
                            className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                              isManager
                                ? "bg-[var(--primary)] text-white"
                                : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                            }`}
                          >
                            {isManager ? "MANAGER" : "VIEW ONLY"}
                          </span>
                        </span>
                      );
                    })}
                    {activePermsCount === 0 && (
                      <span className="text-xs text-[var(--muted-foreground)] italic">
                        No active permissions assigned.
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Invite / Edit Sub-Account Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? `Edit Access Permissions · ${name}` : "Invite New Sub-Account"}
        maxWidth="680px"
      >
        <form onSubmit={handleSaveModal} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2 border-b border-[var(--border)]">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--foreground)]">Full Name *</label>
              <Input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Elena Rostova"
                className="text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--foreground)]">Email Address *</label>
              <Input
                required
                type="email"
                disabled={Boolean(editingId)}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. elena@company.com"
                className="text-xs"
              />
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-[var(--muted)]/30 p-2.5 rounded-lg border border-[var(--border)]">
            <div className="text-xs font-semibold text-[var(--foreground)]">
              Quick Role Templates:
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="xs"
                variant="outline"
                onClick={applyPresetAllManager}
              >
                <ShieldCheck className="h-3 w-3 mr-1" />
                All Full Manager
              </Button>
              <Button
                type="button"
                size="xs"
                variant="outline"
                onClick={applyPresetAllViewer}
              >
                <Eye className="h-3 w-3 mr-1" />
                All View Only
              </Button>
            </div>
          </div>

          {/* Granular Section Permission Toggles */}
          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
              Section Permissions &amp; Access Level
            </div>

            {SECTIONS_CONFIG.map((sec) => {
              const current = (permissions as any)[sec.key] || { enabled: false, level: "view" };
              const isEnabled = Boolean(current.enabled);
              const level = current.level || "view";

              return (
                <div
                  key={sec.key}
                  className={`rounded-xl border p-3 transition-colors ${
                    isEnabled
                      ? "border-[var(--primary)]/40 bg-[var(--background)] shadow-xs"
                      : "border-[var(--border)] bg-[var(--muted)]/20 opacity-70"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={() => handleTogglePermission(sec.key)}
                        className="h-4 w-4 rounded accent-[var(--primary)] cursor-pointer"
                        id={`perm_${sec.key}`}
                      />
                      <label
                        htmlFor={`perm_${sec.key}`}
                        className="text-xs font-bold text-[var(--foreground)] cursor-pointer select-none"
                      >
                        {sec.label}
                      </label>
                    </div>

                    {/* Access Level Selector (View Only vs Manager) */}
                    {isEnabled ? (
                      <div className="inline-flex rounded-lg border border-[var(--border)] p-0.5 bg-[var(--muted)]/40">
                        <button
                          type="button"
                          onClick={() => handleSetLevel(sec.key, "view")}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1 ${
                            level === "view"
                              ? "bg-[var(--card)] text-[var(--foreground)] shadow-xs"
                              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                          }`}
                        >
                          <Eye className="h-3 w-3" />
                          View only
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetLevel(sec.key, "manage")}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1 ${
                            level === "manage"
                              ? "bg-[var(--primary)] text-white shadow-xs"
                              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                          }`}
                        >
                          <ShieldCheck className="h-3 w-3" />
                          Manager
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] font-mono text-[var(--muted-foreground)]">
                        Access Disabled
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-[var(--muted-foreground)] pl-6 mt-1">
                    {sec.description}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Save Permissions" : "Send Team Invite"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
