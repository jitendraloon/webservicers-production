"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, X } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/formatters";
import type { AdminServiceTransfer } from "@/lib/admin-types";

export default function AdminServiceTransfersPage() {
  const [transfers, setTransfers] = useState<AdminServiceTransfer[]>([]);

  useEffect(() => {
    fetch("/api/admin/services")
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setTransfers(json.transfers);
      });
  }, []);

  const updateTransfer = async (id: string, status: "COMPLETED" | "REJECTED") => {
    const res = await fetch("/api/admin/services", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "transfer", id, status }),
    });
    const json = await res.json();
    if (json.ok) {
      setTransfers((prev) => prev.map((t) => (t.id === id ? json.transfer : t)));
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Service Transfers"
        subtitle="Review and execute workspace and service ownership transfers."
        actions={
          <Link href="/admin/services" className="cpki-btn cpki-btn-outline cpki-btn-sm">
            <ArrowLeft className="h-3.5 w-3.5" />
            Active Services
          </Link>
        }
      />

      <div className="cpki-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="cpki-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>From Owner</th>
                <th>To Owner</th>
                <th>Reason</th>
                <th>Requested</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transfers.map((tr) => (
                <tr key={tr.id}>
                  <td>
                    <div className="font-mono text-xs font-semibold">{tr.serviceCode}</div>
                    <div className="text-[11px] text-[var(--muted-foreground)]">{tr.productName}</div>
                  </td>
                  <td>
                    <div className="text-xs font-medium">{tr.fromCustomerName}</div>
                    <div className="text-[11px] text-[var(--muted-foreground)]">{tr.fromCustomerEmail}</div>
                  </td>
                  <td>
                    <div className="text-xs font-medium">{tr.toCustomerName}</div>
                    <div className="text-[11px] text-[var(--muted-foreground)]">{tr.toCustomerEmail}</div>
                  </td>
                  <td className="text-xs max-w-xs truncate">{tr.reason}</td>
                  <td className="text-xs text-[var(--muted-foreground)]">{formatDate(tr.requestedAt)}</td>
                  <td>
                    <Badge
                      tone={
                        tr.status === "COMPLETED"
                          ? "success"
                          : tr.status === "REJECTED"
                            ? "danger"
                            : "warning"
                      }
                      variant="sm"
                    >
                      {tr.status}
                    </Badge>
                  </td>
                  <td className="text-right">
                    {tr.status === "PENDING" ? (
                      <div className="inline-flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => updateTransfer(tr.id, "COMPLETED")}
                          className="cpki-btn cpki-btn-primary cpki-btn-xs"
                        >
                          <Check className="h-3 w-3" />
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => updateTransfer(tr.id, "REJECTED")}
                          className="cpki-btn cpki-btn-outline cpki-btn-xs"
                        >
                          <X className="h-3 w-3" />
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-[var(--muted-foreground)]">Processed</span>
                    )}
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
