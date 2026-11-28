"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, PlusCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatMoney } from "@/lib/formatters";
import type { AdminCustomer, AdminProduct } from "@/lib/admin-types";

export default function AdminCreateOrderPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);

  const [customerId, setCustomerId] = useState("");
  const [productId, setProductId] = useState("");
  const [packageName, setPackageName] = useState<"Standard" | "Growth" | "Enterprise">("Growth");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "quarterly" | "annual" | "one_time">("monthly");
  const [paymentMethod, setPaymentMethod] = useState("Stripe");
  const [markPaid, setMarkPaid] = useState(true);
  const [domain, setDomain] = useState("");
  const [targetMarket, setTargetMarket] = useState("");
  const [goals, setGoals] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/admin/orders")
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) {
          setCustomers(json.customers);
          setProducts(json.products);
          if (json.customers[0]) setCustomerId(json.customers[0].id);
          if (json.products[0]) setProductId(json.products[0].id);
        }
      });
  }, []);

  const selectedProduct = products.find((p) => p.id === productId);
  const selectedTier = selectedProduct?.tiers.find((t) => t.name === packageName) ?? selectedProduct?.tiers[0];

  const estimatedCents = (() => {
    if (!selectedTier) return 0;
    if (billingCycle === "quarterly") return Math.round(selectedTier.priceCents * 3 * 0.9);
    if (billingCycle === "annual") return Math.round(selectedTier.priceCents * 12 * 0.8);
    return selectedTier.priceCents;
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          productId,
          packageName,
          billingCycle,
          paymentMethod,
          markPaid,
          domain,
          targetMarket,
          goals,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        router.push("/admin/orders");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Order"
        subtitle="Manually provision a service order, invoice, and fulfillment brief."
        actions={
          <Link href="/admin/orders" className="cpki-btn cpki-btn-outline cpki-btn-sm">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Orders
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 cpki-card p-5 space-y-5">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Customer & Service</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Customer Account</label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="cpki-select"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.company})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">Service / Product</label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="cpki-select"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">Package Tier</label>
              <select
                value={packageName}
                onChange={(e) => setPackageName(e.target.value as "Standard" | "Growth" | "Enterprise")}
                className="cpki-select"
              >
                <option value="Standard">Standard</option>
                <option value="Growth">Growth</option>
                <option value="Enterprise">Enterprise</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">Billing Cycle</label>
              <select
                value={billingCycle}
                onChange={(e) =>
                  setBillingCycle(e.target.value as "monthly" | "quarterly" | "annual" | "one_time")
                }
                className="cpki-select"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly (10% off)</option>
                <option value="annual">Annual (20% off)</option>
                <option value="one_time">One-Time</option>
              </select>
            </div>
          </div>

          <div className="border-t border-[var(--border)] pt-4 space-y-4">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">Fulfillment Brief</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Target Domain / URL</label>
                <input
                  type="url"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="https://clientdomain.com"
                  className="cpki-input"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Target Market / Geo</label>
                <input
                  type="text"
                  value={targetMarket}
                  onChange={(e) => setTargetMarket(e.target.value)}
                  placeholder="US, UK, DACH..."
                  className="cpki-input"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Campaign Goals & Notes</label>
              <textarea
                rows={3}
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                placeholder="Describe deliverables, KPIs, or onboarding context..."
                className="cpki-textarea"
              />
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <div className="cpki-card p-5 h-fit space-y-4">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Payment & Summary</h2>

          <div className="space-y-1.5">
            <label className="text-xs font-medium">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="cpki-select"
            >
              <option value="Stripe">Stripe (Card)</option>
              <option value="PayPal">PayPal Commerce</option>
              <option value="Wise / Bank Transfer">Wise / Bank Wire</option>
              <option value="Razorpay">Razorpay</option>
              <option value="Cash / Manual">Cash / Manual Vault</option>
            </select>
          </div>

          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={markPaid}
              onChange={(e) => setMarkPaid(e.target.checked)}
              className="rounded border-[var(--border)]"
            />
            <span>Mark invoice paid & start fulfillment immediately</span>
          </label>

          <div className="rounded-lg bg-[var(--muted)] p-3.5 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Selected Service</span>
              <span className="font-medium">{selectedProduct?.shortName ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Tier & Cycle</span>
              <span className="font-medium capitalize">
                {packageName} · {billingCycle.replace("_", " ")}
              </span>
            </div>
            <div className="border-t border-[var(--border)] pt-2 flex justify-between text-sm font-semibold">
              <span>Order Total</span>
              <span className="tabular-nums">{formatMoney(estimatedCents)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="cpki-btn cpki-btn-primary w-full"
          >
            {submitting ? (
              "Creating Order..."
            ) : (
              <>
                <PlusCircle className="h-4 w-4" />
                Create Order & Invoice
              </>
            )}
          </button>

          <div className="flex items-center gap-1.5 text-[11px] text-[var(--muted-foreground)]">
            <CheckCircle2 className="h-3.5 w-3.5 text-[var(--success)]" />
            <span>Automatically generates an invoice in Billing.</span>
          </div>
        </div>
      </form>
    </div>
  );
}
