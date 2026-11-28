"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeftRight,
  ArrowUpDown,
  PauseCircle,
  PlayCircle,
  Server,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { formatDate, formatMoney } from "@/lib/formatters";
import type { AdminActiveService } from "@/lib/admin-types";

const SERVICE_TONE: Record<AdminActiveService["status"], BadgeTone> = {
  ACTIVE: "success",
  SUSPENDED: "warning",
  PENDING_PROVISION: "primary",
  CANCELLED: "danger",
};

export default function AdminServicesPage() {
  const [services, setServices] = useState<AdminActiveService[]>([]);
  const [upgradeTarget, setUpgradeTarget] = useState<AdminActiveService | null>(null);
  const [nextPackage, setNextPackage] = useState<"Standard" | "Growth" | "Enterprise">("Growth");
  const [transferTarget, setTransferTarget] = useState<AdminActiveService | null>(null);
  const [toName, setToName] = useState("");
  const [toEmail, setToEmail] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    fetch("/api/admin/services")
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setServices(json.services);
      });
  }, []);

  const handleLifecycle = async (id: string, action: "ACTIVATE" | "SUSPEND" | "CANCEL") => {
    const res = await fetch("/api/admin/services", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "lifecycle", id, action }),
    });
    const json = await res.json();
    if (json.ok) {
      setServices((prev) => prev.map((s) => (s.id === id ? json.service : s)));
    }
  };

  const submitUpDowngrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!upgradeTarget) return;
    await fetch("/api/admin/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "updowngrade",
        serviceId: upgradeTarget.id,
        targetPackage: nextPackage,
      }),
    });
    setUpgradeTarget(null);
  };

  const submitTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferTarget) return;
    await fetch("/api/admin/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "transfer",
        serviceId: transferTarget.id,
        toCustomerName: toName,
        toCustomerEmail: toEmail,
        reason,
      }),
    });
    setTransferTarget(null);
    setToName("");
    setToEmail("");
    setReason("");
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Active Services"
        subtitle="Manage provisioned client services: suspend, activate, cancel, upgrade, or transfer."
        actions={
          <>
            <Link href="/admin/services/updowngrades" className="cpki-btn cpki-btn-outline cpki-btn-sm">
              <ArrowUpDown className="h-3.5 w-3.5" />
              Up / Downgrades
            </Link>
            <Link href="/admin/services/transfers" className="cpki-btn cpki-btn-outline cpki-btn-sm">
              <ArrowLeftRight className="h-3.5 w-3.5" />
              Transfers
            </Link>
          </>
        }
      />

      <div className="cpki-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="cpki-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Client & Domain</th>
                <th>Service & Tier</th>
                <th>Cycle</th>
                <th>Next Renewal</th>
                <th>Status</th>
                <th className="text-right">Price</th>
                <th className="text-right">Lifecycle Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.map((svc) => (
                <tr key={svc.id}>
                  <td className="font-mono text-xs font-semibold">{svc.serviceCode}</td>
                  <td>
                    <div className="text-xs font-medium">{svc.customerName}</div>
                    <div className="text-[11px] text-[var(--muted-foreground)]">
                      {svc.domain || svc.customerEmail}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5 text-xs font-medium">
                      <Server className="h-3.5 w-3.5 text-[var(--primary-text)]" />
                      {svc.productName}
                    </div>
                    <div className="text-[11px] text-[var(--muted-foreground)]">
                      {svc.packageName} Tier
                    </div>
                  </td>
                  <td className="text-xs capitalize">{svc.billingCycle}</td>
                  <td className="text-xs text-[var(--muted-foreground)]">
                    {formatDate(svc.nextRenewalAt)}
                  </td>
                  <td>
                    <Badge tone={SERVICE_TONE[svc.status]} variant="sm">
                      {svc.status}
                    </Badge>
                  </td>
                  <td className="text-right text-xs font-semibold tabular-nums">
                    {formatMoney(svc.priceCents, svc.currency)}
                  </td>
                  <td className="text-right">
                    <div className="inline-flex flex-wrap items-center justify-end gap-1">
                      {svc.status === "ACTIVE" ? (
                        <button
                          type="button"
                          onClick={() => handleLifecycle(svc.id, "SUSPEND")}
                          className="cpki-btn cpki-btn-outline cpki-btn-xs"
                          title="Suspend Service"
                        >
                          <PauseCircle className="h-3 w-3" />
                          Suspend
                        </button>
                      ) : svc.status !== "CANCELLED" ? (
                        <button
                          type="button"
                          onClick={() => handleLifecycle(svc.id, "ACTIVATE")}
                          className="cpki-btn cpki-btn-primary cpki-btn-xs"
                        >
                          <PlayCircle className="h-3 w-3" />
                          Activate
                        </button>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => {
                          setUpgradeTarget(svc);
                          setNextPackage(svc.packageName);
                        }}
                        className="cpki-btn cpki-btn-outline cpki-btn-xs"
                      >
                        <ArrowUpDown className="h-3 w-3" />
                        Tier
                      </button>

                      <button
                        type="button"
                        onClick={() => setTransferTarget(svc)}
                        className="cpki-btn cpki-btn-outline cpki-btn-xs"
                      >
                        <ArrowLeftRight className="h-3 w-3" />
                        Transfer
                      </button>

                      {svc.status !== "CANCELLED" && (
                        <button
                          type="button"
                          onClick={() => handleLifecycle(svc.id, "CANCEL")}
                          className="cpki-btn cpki-btn-ghost cpki-btn-xs text-[var(--destructive)]"
                        >
                          <XCircle className="h-3 w-3" />
                          Cancel
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

      {/* Upgrade/Downgrade Modal */}
      <Modal
        isOpen={Boolean(upgradeTarget)}
        onClose={() => setUpgradeTarget(null)}
        title="Queue Package Upgrade / Downgrade"
      >
        {upgradeTarget && (
          <form onSubmit={submitUpDowngrade} className="space-y-4">
            <div className="text-xs text-[var(--muted-foreground)]">
              Service <strong className="text-[var(--foreground)]">{upgradeTarget.serviceCode}</strong>{" "}
              is currently on <strong>{upgradeTarget.packageName}</strong>.
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Target Package Tier</label>
              <select
                value={nextPackage}
                onChange={(e) => setNextPackage(e.target.value as "Standard" | "Growth" | "Enterprise")}
                className="cpki-select"
              >
                <option value="Standard">Standard</option>
                <option value="Growth">Growth</option>
                <option value="Enterprise">Enterprise</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setUpgradeTarget(null)}
                className="cpki-btn cpki-btn-outline cpki-btn-sm"
              >
                Cancel
              </button>
              <button type="submit" className="cpki-btn cpki-btn-primary cpki-btn-sm">
                Queue Request
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Transfer Modal */}
      <Modal
        isOpen={Boolean(transferTarget)}
        onClose={() => setTransferTarget(null)}
        title="Initiate Service Ownership Transfer"
      >
        {transferTarget && (
          <form onSubmit={submitTransfer} className="space-y-4">
            <div className="text-xs text-[var(--muted-foreground)]">
              Transferring <strong className="text-[var(--foreground)]">{transferTarget.serviceCode}</strong>{" "}
              from {transferTarget.customerName}.
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Recipient Name</label>
              <input
                required
                type="text"
                value={toName}
                onChange={(e) => setToName(e.target.value)}
                placeholder="New account owner name"
                className="cpki-input"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Recipient Email</label>
              <input
                required
                type="email"
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                placeholder="owner@company.com"
                className="cpki-input"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Reason</label>
              <textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="cpki-textarea"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setTransferTarget(null)}
                className="cpki-btn cpki-btn-outline cpki-btn-sm"
              >
                Cancel
              </button>
              <button type="submit" className="cpki-btn cpki-btn-primary cpki-btn-sm">
                Submit Transfer
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
