"use client";

import React, { useEffect, useState } from "react";
import { Plus, Tag, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { formatDate, formatMoney } from "@/lib/formatters";
import type { AdminCoupon } from "@/lib/admin-types";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENT" | "FIXED">("PERCENT");
  const [discountValue, setDiscountValue] = useState("15");
  const [minOrderUsd, setMinOrderUsd] = useState("250");
  const [maxUses, setMaxUses] = useState("100");
  const [appliesTo, setAppliesTo] = useState("All Services");

  useEffect(() => {
    fetch("/api/admin/commerce")
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setCoupons(json.coupons);
      });
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    const res = await fetch("/api/admin/commerce", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "coupon",
        code,
        description,
        discountType,
        discountValue: Number(discountValue),
        minOrderUsd: Number(minOrderUsd),
        maxUses: Number(maxUses),
        appliesTo,
      }),
    });
    const json = await res.json();
    if (json.ok) {
      setCoupons((prev) => [json.coupon, ...prev]);
      setCode("");
      setDescription("");
    }
  };

  const toggleActive = async (cpn: AdminCoupon) => {
    const res = await fetch("/api/admin/commerce", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "coupon", id: cpn.id, active: !cpn.active }),
    });
    const json = await res.json();
    if (json.ok) {
      setCoupons((prev) => prev.map((c) => (c.id === cpn.id ? json.coupon : c)));
    }
  };

  const deleteCoupon = async (id: string) => {
    const res = await fetch(`/api/admin/commerce?kind=coupon&id=${id}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (json.ok) setCoupons((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Coupons & Promos"
        subtitle="Create promotional discount codes, redemption caps, and category rules."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <form onSubmit={handleCreate} className="cpki-card p-5 h-fit space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Tag className="h-4 w-4 text-[var(--primary-text)]" />
            New Promo Code
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Coupon Code</label>
            <input
              required
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. SPRING25"
              className="cpki-input font-mono uppercase"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Type</label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as "PERCENT" | "FIXED")}
                className="cpki-select"
              >
                <option value="PERCENT">Percentage (%)</option>
                <option value="FIXED">Fixed USD ($)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Value</label>
              <input
                required
                type="number"
                min="1"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                className="cpki-input"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Min Order (USD)</label>
              <input
                type="number"
                min="0"
                value={minOrderUsd}
                onChange={(e) => setMinOrderUsd(e.target.value)}
                className="cpki-input"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Max Uses</label>
              <input
                type="number"
                min="1"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                className="cpki-input"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Applies To</label>
            <select
              value={appliesTo}
              onChange={(e) => setAppliesTo(e.target.value)}
              className="cpki-select"
            >
              <option value="All Services">All Services</option>
              <option value="Presence & Web">Presence & Web</option>
              <option value="Promote & Paid Ads">Promote & Paid Ads</option>
              <option value="Analytics & Intelligence">Analytics & Intelligence</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Internal note or campaign label"
              className="cpki-input"
            />
          </div>
          <button type="submit" className="cpki-btn cpki-btn-primary w-full">
            <Plus className="h-3.5 w-3.5" />
            Create Coupon
          </button>
        </form>

        <div className="lg:col-span-2 cpki-card overflow-hidden">
          <table className="cpki-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Scope</th>
                <th>Redemptions</th>
                <th>Expires</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="font-mono text-xs font-semibold">{c.code}</div>
                    <div className="text-[11px] text-[var(--muted-foreground)]">{c.description}</div>
                  </td>
                  <td className="text-xs font-semibold tabular-nums">
                    {c.discountType === "PERCENT"
                      ? `${c.discountValue}% OFF`
                      : `${formatMoney(c.discountValue)} OFF`}
                  </td>
                  <td className="text-xs">{c.appliesTo}</td>
                  <td className="text-xs tabular-nums">
                    {c.usedCount} / {c.maxUses}
                  </td>
                  <td className="text-xs text-[var(--muted-foreground)]">{formatDate(c.expiresAt)}</td>
                  <td>
                    <Badge tone={c.active ? "success" : "neutral"} variant="sm">
                      {c.active ? "Active" : "Paused"}
                    </Badge>
                  </td>
                  <td className="text-right">
                    <div className="inline-flex gap-1">
                      <button
                        type="button"
                        onClick={() => toggleActive(c)}
                        className="cpki-btn cpki-btn-outline cpki-btn-xs"
                      >
                        {c.active ? "Pause" : "Enable"}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteCoupon(c.id)}
                        className="cpki-btn cpki-btn-ghost cpki-btn-xs text-[var(--destructive)]"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
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
