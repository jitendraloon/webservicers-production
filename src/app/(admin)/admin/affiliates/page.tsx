"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  DollarSign,
  Edit3,
  Gift,
  Key,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Share2,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import type { AffiliateRecord, PayoutRequest } from "@/app/api/affiliates/route";

export default function AdminAffiliatesManagerPage() {
  const [activeTab, setActiveTab] = useState<"partners" | "payouts" | "settings">("partners");
  const [partners, setPartners] = useState<AffiliateRecord[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [settings, setSettings] = useState({
    defaultCommissionPct: 15,
    cookieDurationDays: 60,
    minPayoutThreshold: 50,
    allowResellerWhiteLabel: true,
    autoApprovePayoutsUnder: 200,
  });
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  // New Partner Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newType, setNewType] = useState<"Affiliate" | "Reseller">("Affiliate");
  const [newCommission, setNewCommission] = useState("15");
  const [creating, setCreating] = useState(false);

  // Edit Rate Modal
  const [editingPartner, setEditingPartner] = useState<AffiliateRecord | null>(null);
  const [editRate, setEditRate] = useState("15");

  const fetchData = async () => {
    try {
      const res = await fetch("/api/affiliates");
      const json = await res.json();
      if (json.ok) {
        setPartners(json.affiliates || []);
        setPayouts(json.payouts || []);
        if (json.settings) setSettings(json.settings);
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredPartners = partners.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q)
    );
  });

  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/affiliates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_partner",
          name: newName.trim(),
          email: newEmail.trim(),
          type: newType,
          commissionPct: Number(newCommission),
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setPartners((prev) => [json.partner, ...prev]);
        setIsAddOpen(false);
        setNewName("");
        setNewEmail("");
        setToast(`Partner ${json.partner.name} created successfully!`);
        setTimeout(() => setToast(null), 3000);
      }
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateStatus = async (partner: AffiliateRecord) => {
    const nextStatus = partner.status === "Active" ? "Paused" : "Active";
    const res = await fetch("/api/affiliates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_partner",
        id: partner.id,
        status: nextStatus,
      }),
    });
    const json = await res.json();
    if (json.ok) {
      setPartners((prev) => prev.map((p) => (p.id === partner.id ? json.partner : p)));
      setToast(`${partner.name} status updated to ${nextStatus}.`);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleSaveRate = async () => {
    if (!editingPartner) return;
    const res = await fetch("/api/affiliates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_partner",
        id: editingPartner.id,
        commissionPct: Number(editRate),
      }),
    });
    const json = await res.json();
    if (json.ok) {
      setPartners((prev) => prev.map((p) => (p.id === editingPartner.id ? json.partner : p)));
      setToast(`Commission rate updated to ${editRate}% for ${editingPartner.name}.`);
      setEditingPartner(null);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleUpdatePayoutStatus = async (payoutId: string, status: PayoutRequest["status"]) => {
    const res = await fetch("/api/affiliates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_payout_status",
        payoutId,
        status,
      }),
    });
    const json = await res.json();
    if (json.ok) {
      setPayouts((prev) => prev.map((p) => (p.id === payoutId ? json.payout : p)));
      setToast(`Payout ${payoutId} marked as ${status}.`);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/affiliates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save_settings",
        settings,
      }),
    });
    const json = await res.json();
    if (json.ok) {
      setToast("Global affiliate & reseller settings saved.");
      setTimeout(() => setToast(null), 3000);
    }
  };

  const totalCommissionsPaid = payouts
    .filter((p) => p.status === "Paid")
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingPayoutsTotal = payouts
    .filter((p) => p.status === "Pending" || p.status === "Approved")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        title="Affiliates & Resellers Manager"
        subtitle="Manage referral partner commissions, approve payout withdrawal requests, and configure reseller wholesale programs."
        actions={
          <Button onClick={() => setIsAddOpen(true)} variant="primary" size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            New Partner / Reseller
          </Button>
        }
      />

      {toast && (
        <div className="cpki-card-insight px-4 py-2.5 text-xs font-medium text-[var(--insight-foreground)] flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />
          {toast}
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 space-y-1">
          <div className="text-xs text-[var(--muted-foreground)]">Registered Partners</div>
          <div className="text-2xl font-bold text-[var(--foreground)]">{partners.length}</div>
          <div className="text-[11px] text-[var(--muted-foreground)]">
            {partners.filter((p) => p.type === "Reseller").length} Resellers &bull;{" "}
            {partners.filter((p) => p.type === "Affiliate").length} Affiliates
          </div>
        </Card>

        <Card className="p-4 space-y-1">
          <div className="text-xs text-[var(--muted-foreground)]">Total Referrals Generated</div>
          <div className="text-2xl font-bold text-[var(--foreground)]">
            {partners.reduce((sum, p) => sum + p.referrals, 0)}
          </div>
          <div className="text-[11px] text-emerald-500 font-semibold">Active conversions</div>
        </Card>

        <Card className="p-4 space-y-1">
          <div className="text-xs text-[var(--muted-foreground)]">Pending Payouts Queue</div>
          <div className="text-2xl font-bold text-amber-500 font-mono">
            ${pendingPayoutsTotal.toFixed(2)}
          </div>
          <div className="text-[11px] text-[var(--muted-foreground)]">
            {payouts.filter((p) => p.status === "Pending").length} awaiting review
          </div>
        </Card>

        <Card className="p-4 space-y-1">
          <div className="text-xs text-[var(--muted-foreground)]">Total Commissions Paid</div>
          <div className="text-2xl font-bold text-[var(--primary-text)] font-mono">
            ${totalCommissionsPaid.toFixed(2)}
          </div>
          <div className="text-[11px] text-[var(--muted-foreground)]">All-time disbursements</div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("partners")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "partners"
              ? "bg-[var(--foreground)] text-[var(--background)] shadow-xs"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/40"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Partners &amp; Resellers ({partners.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("payouts")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "payouts"
              ? "bg-[var(--foreground)] text-[var(--background)] shadow-xs"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/40"
          }`}
        >
          <Wallet className="h-4 w-4" />
          <span>Payout Requests ({payouts.length})</span>
          {payouts.filter((p) => p.status === "Pending").length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500 text-white font-bold">
              {payouts.filter((p) => p.status === "Pending").length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("settings")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "settings"
              ? "bg-[var(--foreground)] text-[var(--background)] shadow-xs"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/40"
          }`}
        >
          <Settings className="h-4 w-4" />
          <span>Program Rules &amp; Tier Rates</span>
        </button>
      </div>

      {/* Tab 1: Partners & Resellers */}
      {activeTab === "partners" && (
        <div className="space-y-4">
          <div className="cpki-card p-3 flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted-foreground)]" />
              <Input
                placeholder="Search partner by name, email, code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="!pl-9 text-xs"
              />
            </div>
            <div className="text-xs text-[var(--muted-foreground)]">
              Showing {filteredPartners.length} of {partners.length} partners
            </div>
          </div>

          <div className="cpki-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="cpki-table">
                <thead>
                  <tr>
                    <th>Partner / Reseller</th>
                    <th>Type</th>
                    <th>Referral Code</th>
                    <th>Commission Rate</th>
                    <th>Clicks / Ref</th>
                    <th>Available Balance</th>
                    <th>Total Earned</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPartners.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div className="text-xs font-semibold text-[var(--foreground)]">{p.name}</div>
                        <div className="text-[11px] text-[var(--muted-foreground)]">{p.email}</div>
                      </td>
                      <td>
                        <Badge tone={p.type === "Reseller" ? "lilac" : "neutral"} variant="sm">
                          {p.type}
                        </Badge>
                      </td>
                      <td>
                        <code className="text-xs font-mono font-bold bg-[var(--muted)] px-2 py-0.5 rounded">
                          {p.code}
                        </code>
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPartner(p);
                            setEditRate(String(p.commissionPct));
                          }}
                          className="text-xs font-bold text-[var(--primary)] hover:underline flex items-center gap-1"
                        >
                          {p.commissionPct}%
                          <Edit3 className="h-3 w-3 opacity-60" />
                        </button>
                      </td>
                      <td className="text-xs text-[var(--muted-foreground)]">
                        {p.clicks} clicks &bull;{" "}
                        <span className="font-semibold text-[var(--foreground)]">
                          {p.referrals} orders
                        </span>
                      </td>
                      <td className="text-xs font-mono font-bold text-[var(--foreground)]">
                        ${p.availableBalance.toFixed(2)}
                      </td>
                      <td className="text-xs font-mono text-[var(--muted-foreground)]">
                        ${p.totalEarned.toFixed(2)}
                      </td>
                      <td>
                        <Badge tone={p.status === "Active" ? "success" : "warning"} variant="sm">
                          {p.status}
                        </Badge>
                      </td>
                      <td className="text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => handleUpdateStatus(p)}
                          >
                            {p.status === "Active" ? "Pause" : "Activate"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Payout Requests Queue */}
      {activeTab === "payouts" && (
        <Card className="p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[var(--foreground)]">Payout Requests Queue</h3>
            <p className="text-xs text-[var(--muted-foreground)]">
              Approve, process, and reconcile commission disbursements requested by affiliates.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="cpki-table">
              <thead>
                <tr>
                  <th>Payout ID</th>
                  <th>Affiliate</th>
                  <th>Amount</th>
                  <th>Payment Method</th>
                  <th>Payment Address / Details</th>
                  <th>Status</th>
                  <th className="text-right">Process Action</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((pay) => (
                  <tr key={pay.id}>
                    <td className="text-xs font-mono">{pay.id}</td>
                    <td>
                      <div className="text-xs font-semibold">{pay.affiliateName}</div>
                      <div className="text-[10.5px] text-[var(--muted-foreground)]">
                        {new Date(pay.createdAt).toLocaleString()}
                      </div>
                    </td>
                    <td className="text-xs font-mono font-bold text-emerald-500">
                      ${pay.amount.toFixed(2)}
                    </td>
                    <td className="text-xs font-medium">{pay.method}</td>
                    <td className="text-xs font-mono text-[var(--muted-foreground)]">
                      {pay.details}
                    </td>
                    <td>
                      <Badge
                        tone={
                          pay.status === "Paid"
                            ? "success"
                            : pay.status === "Approved"
                            ? "lilac"
                            : pay.status === "Rejected"
                            ? "danger"
                            : "warning"
                        }
                        variant="sm"
                      >
                        {pay.status}
                      </Badge>
                    </td>
                    <td className="text-right">
                      {pay.status === "Pending" && (
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            size="xs"
                            variant="primary"
                            onClick={() => handleUpdatePayoutStatus(pay.id, "Paid")}
                          >
                            Mark Paid
                          </Button>
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => handleUpdatePayoutStatus(pay.id, "Rejected")}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                      {pay.status === "Approved" && (
                        <Button
                          size="xs"
                          variant="primary"
                          onClick={() => handleUpdatePayoutStatus(pay.id, "Paid")}
                        >
                          Complete Payment
                        </Button>
                      )}
                      {pay.status === "Paid" && (
                        <span className="text-[11px] text-emerald-500 font-semibold flex items-center justify-end gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Disbursed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 3: Program & Tier Settings */}
      {activeTab === "settings" && (
        <Card className="p-6 max-w-2xl space-y-5">
          <div>
            <h3 className="text-sm font-bold text-[var(--foreground)]">
              Global Affiliate &amp; Reseller Configuration
            </h3>
            <p className="text-xs text-[var(--muted-foreground)]">
              Define standard commission defaults, attribution cookie lifetimes, and minimum withdrawal limits.
            </p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Default Affiliate Commission (%)</label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={settings.defaultCommissionPct}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      defaultCommissionPct: Number(e.target.value) || 15,
                    }))
                  }
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Cookie Attribution Window (Days)</label>
                <Input
                  type="number"
                  min={7}
                  max={180}
                  value={settings.cookieDurationDays}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      cookieDurationDays: Number(e.target.value) || 60,
                    }))
                  }
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Minimum Withdrawal Threshold ($ USD)</label>
                <Input
                  type="number"
                  min={10}
                  max={500}
                  value={settings.minPayoutThreshold}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      minPayoutThreshold: Number(e.target.value) || 50,
                    }))
                  }
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Auto-Approve Threshold ($ USD)</label>
                <Input
                  type="number"
                  min={0}
                  max={1000}
                  value={settings.autoApprovePayoutsUnder}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      autoApprovePayoutsUnder: Number(e.target.value) || 200,
                    }))
                  }
                  className="text-xs"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-[var(--foreground)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.allowResellerWhiteLabel}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      allowResellerWhiteLabel: e.target.checked,
                    }))
                  }
                  className="rounded"
                />
                Allow Resellers Custom White-Label Client Portal CNAME Domains
              </label>
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="submit" variant="primary" size="sm">
                Save Program Configuration
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* New Partner Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Partner / Reseller"
        maxWidth="500px"
      >
        <form onSubmit={handleCreatePartner} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Partner / Entity Name *</label>
            <Input
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Nordic Media Group"
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Email Address *</label>
            <Input
              required
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="e.g. partner@nordicmedia.io"
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Program Type</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as "Affiliate" | "Reseller")}
                className="cpki-select text-xs"
              >
                <option value="Affiliate">Affiliate (Referral Commissions)</option>
                <option value="Reseller">Reseller (Wholesale Discount &amp; White-label)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Commission / Discount (%)</label>
              <Input
                required
                type="number"
                min={5}
                max={50}
                value={newCommission}
                onChange={(e) => setNewCommission(e.target.value)}
                className="text-xs font-bold"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={creating}>
              {creating ? "Creating..." : "Create Partner"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Commission Rate Modal */}
      <Modal
        isOpen={Boolean(editingPartner)}
        onClose={() => setEditingPartner(null)}
        title={`Adjust Commission Rate · ${editingPartner?.name}`}
        maxWidth="420px"
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Commission Percentage (%)</label>
            <Input
              type="number"
              min={1}
              max={60}
              value={editRate}
              onChange={(e) => setEditRate(e.target.value)}
              className="text-xs font-bold"
            />
            <p className="text-[11px] text-[var(--muted-foreground)]">
              Applies to all upcoming orders referred by {editingPartner?.name}.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
            <Button variant="outline" size="sm" onClick={() => setEditingPartner(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveRate}>
              Update Rate
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
