"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { formatDate, formatMoney } from "@/lib/formatters";
import type { AdminServiceUpDowngrade } from "@/lib/admin-types";

export default function AdminServiceUpDowngradesPage() {
  const [requests, setRequests] = useState<AdminServiceUpDowngrade[]>([]);

  useEffect(() => {
    fetch("/api/admin/services")
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setRequests(json.upDowngrades);
      });
  }, []);

  const handleDecision = async (id: string, status: "APPLIED" | "DECLINED") => {
    const res = await fetch("/api/admin/services", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "updowngrade", id, status }),
    });
    const json = await res.json();
    if (json.ok) {
      setRequests((prev) => prev.map((r) => (r.id === id ? json.request : r)));
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Upgrades & Downgrades"
        subtitle="Approve package tier changes and prorated billing adjustments."
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
                <th>Customer</th>
                <th>Tier Change</th>
                <th>Direction</th>
                <th className="text-right">Proration Delta</th>
                <th>Requested</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id}>
                  <td>
                    <div className="font-mono text-xs font-semibold">{req.serviceCode}</div>
                    <div className="text-[11px] text-[var(--muted-foreground)]">{req.productName}</div>
                  </td>
                  <td className="text-xs font-medium">{req.customerName}</td>
                  <td>
                    <div className="inline-flex items-center gap-1.5 text-xs">
                      <span>{req.currentPackage}</span>
                      <ArrowRight className="h-3 w-3 text-[var(--muted-foreground)]" />
                      <span className="font-semibold">{req.targetPackage}</span>
                    </div>
                  </td>
                  <td>
                    <Badge tone={req.direction === "UPGRADE" ? "primary" : "lilac"} variant="sm">
                      {req.direction}
                    </Badge>
                  </td>
                  <td className="text-right text-xs font-semibold tabular-nums">
                    {req.prorationDeltaCents >= 0 ? "+" : ""}
                    {formatMoney(req.prorationDeltaCents)}
                  </td>
                  <td className="text-xs text-[var(--muted-foreground)]">
                    {formatDate(req.requestedAt)}
                  </td>
                  <td>
                    <Badge
                      tone={
                        req.status === "APPLIED"
                          ? "success"
                          : req.status === "DECLINED"
                            ? "danger"
                            : "warning"
                      }
                      variant="sm"
                    >
                      {req.status}
                    </Badge>
                  </td>
                  <td className="text-right">
                    {req.status === "PENDING" ? (
                      <div className="inline-flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleDecision(req.id, "APPLIED")}
                          className="cpki-btn cpki-btn-primary cpki-btn-xs"
                        >
                          <Check className="h-3 w-3" />
                          Apply
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDecision(req.id, "DECLINED")}
                          className="cpki-btn cpki-btn-outline cpki-btn-xs"
                        >
                          <X className="h-3 w-3" />
                          Decline
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-[var(--muted-foreground)]">Completed</span>
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
