"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BellRing,
  CheckCircle2,
  Clock,
  Mail,
  Save,
  Settings,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { formatDate, formatMoney } from "@/lib/formatters";
import type { AbandonedCheckout, AbandonedCheckoutSettings } from "@/lib/admin-types";

export default function AdminAbandonedCheckoutsPage() {
  const [checkouts, setCheckouts] = useState<AbandonedCheckout[]>([]);
  const [settings, setSettings] = useState<AbandonedCheckoutSettings>({
    autoReminderEnabled: true,
    reminderDelayHours: 6,
    discountCode: "RECOVER10",
    discountPct: 10,
    maxNudges: 2,
    templateSubject: "Complete your order and receive 10% off your digital setup",
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/orders/abandoned")
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) {
          setCheckouts(json.checkouts);
          if (json.settings) setSettings(json.settings);
        }
      });
  }, []);

  const handleAction = async (id: string, action: "send_recovery" | "mark_recovered") => {
    const res = await fetch("/api/admin/orders/abandoned", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    const json = await res.json();
    if (json.ok) {
      setCheckouts((prev) => prev.map((c) => (c.id === id ? json.checkout : c)));
      setToast(
        action === "send_recovery"
          ? `Recovery email dispatched to ${json.checkout.customerEmail}`
          : `Marked ${json.checkout.sessionCode} as recovered`
      );
      setTimeout(() => setToast(null), 3500);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch("/api/admin/orders/abandoned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_settings", settings }),
      });
      const json = await res.json();
      if (json.ok) {
        setSettings(json.settings);
        setToast("Auto-Reminder configuration saved successfully.");
        setTimeout(() => setToast(null), 3500);
      }
    } finally {
      setSavingSettings(false);
    }
  };

  const openValueCents = checkouts
    .filter((c) => c.status === "OPEN")
    .reduce((s, c) => s + c.amountCents, 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Abandoned Checkouts"
        subtitle="Recover high-intent incomplete checkouts with manual and automated background reminders."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/admin/orders" className="cpki-btn cpki-btn-outline cpki-btn-sm">
              <ArrowLeft className="h-3.5 w-3.5" />
              All Orders
            </Link>
          </div>
        }
      />

      {toast && (
        <div className="cpki-card-insight px-4 py-2.5 text-xs font-medium text-[var(--insight-foreground)] flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />
          {toast}
        </div>
      )}

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="cpki-card p-4">
          <div className="text-xs text-[var(--muted-foreground)]">Open Abandoned Sessions</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">
            {checkouts.filter((c) => c.status === "OPEN").length}
          </div>
        </div>
        <div className="cpki-card p-4">
          <div className="text-xs text-[var(--muted-foreground)]">Recoverable Pipeline</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">
            {formatMoney(openValueCents)}
          </div>
        </div>
        <div className="cpki-card p-4">
          <div className="text-xs text-[var(--muted-foreground)]">Recovered Sessions</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums text-[var(--success)]">
            {checkouts.filter((c) => c.status === "RECOVERED").length}
          </div>
        </div>
      </div>

      {/* Auto-Reminder Engine Settings Card */}
      <div className="cpki-card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)] text-[var(--primary-text)]">
              <BellRing className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[var(--foreground)]">
                Automated Nudge & Recovery Dispatcher
              </div>
              <div className="text-xs text-[var(--muted-foreground)]">
                Schedule automatic email sequences when visitors leave uncompleted checkouts.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[var(--muted-foreground)]">
              Auto-Reminder Mode:
            </span>
            <button
              type="button"
              onClick={() =>
                setSettings((s) => ({ ...s, autoReminderEnabled: !s.autoReminderEnabled }))
              }
              className={`cpki-btn cpki-btn-xs ${
                settings.autoReminderEnabled
                  ? "bg-[var(--success-subtle)] text-[var(--success)] border-[var(--success)]"
                  : "cpki-btn-outline"
              }`}
            >
              {settings.autoReminderEnabled ? "● Enabled (Auto-Pilot)" : "○ Disabled"}
            </button>
          </div>
        </div>

        <form onSubmit={handleSaveSettings} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--foreground)]">
              Trigger Delay
            </label>
            <select
              value={settings.reminderDelayHours}
              onChange={(e) =>
                setSettings((s) => ({ ...s, reminderDelayHours: Number(e.target.value) }))
              }
              className="cpki-select"
            >
              <option value={1}>1 hour after abandonment</option>
              <option value={6}>6 hours after abandonment</option>
              <option value={12}>12 hours after abandonment</option>
              <option value={24}>24 hours after abandonment</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--foreground)]">
              Recovery Discount Incentive
            </label>
            <select
              value={settings.discountPct}
              onChange={(e) => {
                const pct = Number(e.target.value);
                setSettings((s) => ({
                  ...s,
                  discountPct: pct,
                  discountCode: pct > 0 ? `RECOVER${pct}` : "",
                }));
              }}
              className="cpki-select"
            >
              <option value={0}>No Discount (Direct Reminder)</option>
              <option value={5}>5% Off Coupon (RECOVER5)</option>
              <option value={10}>10% Off Coupon (RECOVER10)</option>
              <option value={15}>15% Off Coupon (RECOVER15)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--foreground)]">
              Max Follow-up Nudges
            </label>
            <select
              value={settings.maxNudges}
              onChange={(e) =>
                setSettings((s) => ({ ...s, maxNudges: Number(e.target.value) }))
              }
              className="cpki-select"
            >
              <option value={1}>1 Email nudge</option>
              <option value={2}>2 Email nudges (spaced 24h)</option>
              <option value={3}>3 Email nudges (1h, 24h, 72h)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={savingSettings}
              className="cpki-btn cpki-btn-primary w-full h-[38px]"
            >
              <Save className="h-3.5 w-3.5" />
              {savingSettings ? "Saving..." : "Save Auto-Reminder Settings"}
            </button>
          </div>
        </form>
      </div>

      {/* Abandoned Sessions Table */}
      <div className="cpki-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="cpki-table">
            <thead>
              <tr>
                <th>Session</th>
                <th>Customer</th>
                <th>Product & Tier</th>
                <th>Step Reached</th>
                <th>Status</th>
                <th>Nudges Dispatched</th>
                <th className="text-right">Value</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {checkouts.map((chk) => (
                <tr key={chk.id}>
                  <td className="font-mono text-xs font-semibold">{chk.sessionCode}</td>
                  <td>
                    <div className="text-xs font-medium">{chk.customerName}</div>
                    <div className="text-[11px] text-[var(--muted-foreground)]">
                      {chk.customerEmail}
                    </div>
                  </td>
                  <td>
                    <div className="text-xs font-medium">{chk.productName}</div>
                    <div className="text-[11px] text-[var(--muted-foreground)]">
                      {chk.packageName} · {formatDate(chk.abandonedAt)}
                    </div>
                  </td>
                  <td>
                    <Badge tone="neutral" variant="sm">
                      {chk.stepReached}
                    </Badge>
                  </td>
                  <td>
                    <Badge
                      tone={chk.status === "RECOVERED" ? "success" : "warning"}
                      variant="sm"
                    >
                      {chk.status}
                    </Badge>
                  </td>
                  <td className="text-xs tabular-nums">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-[var(--muted-foreground)]" />
                      <span>{chk.recoverySentCount} sent</span>
                    </div>
                    {chk.lastRecoveryAt && (
                      <div className="text-[10px] text-[var(--muted-foreground)]">
                        Last: {formatDate(chk.lastRecoveryAt)}
                      </div>
                    )}
                  </td>
                  <td className="text-right font-semibold tabular-nums">
                    {formatMoney(chk.amountCents, chk.currency)}
                  </td>
                  <td className="text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleAction(chk.id, "send_recovery")}
                        disabled={chk.status === "RECOVERED"}
                        className="cpki-btn cpki-btn-primary cpki-btn-xs disabled:opacity-50"
                        title="Dispatch immediate reminder email to customer"
                      >
                        <Mail className="h-3 w-3" />
                        Send Reminder
                      </button>
                      {chk.status === "OPEN" && (
                        <button
                          type="button"
                          onClick={() => handleAction(chk.id, "mark_recovered")}
                          className="cpki-btn cpki-btn-outline cpki-btn-xs"
                          title="Mark order completed manually"
                        >
                          <ShoppingBag className="h-3 w-3" />
                          Recovered
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
