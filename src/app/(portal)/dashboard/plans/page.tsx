"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, CheckCircle2, Search, Sparkles } from "lucide-react";
import {
  SERVICES,
  SERVICE_FILTER_CATEGORIES,
  type ServiceCatalogItem,
  type ServiceFilterCategory,
  type ServiceTier,
} from "@/data/services";
import { ServiceIcon } from "@/components/marketing/ServiceIcon";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { formatMoney } from "@/lib/formatters";
import { usePortalStore } from "../_data/portal-store";

type BillingCycle = "MONTHLY" | "QUARTERLY" | "ANNUALLY" | "ONCE";

const CYCLE_DISCOUNT: Record<BillingCycle, { label: string; multiplier: number; discountNote?: string }> = {
  MONTHLY: { label: "Monthly", multiplier: 1 },
  QUARTERLY: { label: "Quarterly", multiplier: 3 * 0.9, discountNote: "Save 10%" },
  ANNUALLY: { label: "Annually", multiplier: 12 * 0.8, discountNote: "Save 20%" },
  ONCE: { label: "One-Time Setup", multiplier: 1 },
};

export default function PortalPlansPage() {
  const { placeServiceOrder } = usePortalStore();
  const [category, setCategory] = useState<ServiceFilterCategory>("All");
  const [query, setQuery] = useState("");

  const [selectedService, setSelectedService] = useState<ServiceCatalogItem | null>(null);
  const [selectedTierIndex, setSelectedTierIndex] = useState<number>(1); // Growth default
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("MONTHLY");
  const [targetUrl, setTargetUrl] = useState("");
  const [briefNotes, setBriefNotes] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [placedResult, setPlacedResult] = useState<{
    orderId: string;
    orderRef: string;
    invoiceId: string;
  } | null>(null);

  const filteredServices = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SERVICES.filter((svc) => {
      if (category !== "All" && svc.category !== category) return false;
      if (!q) return true;
      return (
        svc.name.toLowerCase().includes(q) ||
        svc.tagline.toLowerCase().includes(q) ||
        svc.category.toLowerCase().includes(q)
      );
    });
  }, [category, query]);

  const activeTier: ServiceTier | null = selectedService
    ? selectedService.tiers[selectedTierIndex] ?? selectedService.tiers[0]
    : null;

  const computedTotalCents = useMemo(() => {
    if (!activeTier) return 0;
    const baseCents = activeTier.priceUsd * 100;
    const cycleMult = CYCLE_DISCOUNT[billingCycle].multiplier;
    let total = Math.round(baseCents * cycleMult);
    if (couponCode.trim().toUpperCase() === "GROWTH10") {
      total = Math.round(total * 0.9);
    }
    return total;
  }, [activeTier, billingCycle, couponCode]);

  const openConfigure = (svc: ServiceCatalogItem, tierIdx = 1) => {
    setSelectedService(svc);
    setSelectedTierIndex(tierIdx);
    setBillingCycle("MONTHLY");
    setTargetUrl("");
    setBriefNotes("");
    setCouponCode("");
    setPlacedResult(null);
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !activeTier) return;

    const result = placeServiceOrder({
      serviceName: selectedService.name,
      serviceSlug: selectedService.slug,
      tierName: activeTier.name,
      billingCycle,
      totalCents: computedTotalCents,
      brief: {
        "Target Website / URL": targetUrl.trim() || "https://webservicers.io",
        "Selected Tier": activeTier.name,
        "Billing Cycle": billingCycle,
        ...(couponCode.trim() ? { "Coupon Applied": couponCode.trim().toUpperCase() } : {}),
      },
      notes: briefNotes.trim() || `Configured ${selectedService.name} (${activeTier.name}).`,
    });

    setPlacedResult({
      orderId: result.order.id,
      orderRef: result.order.reference,
      invoiceId: result.invoice.id,
    });
    setSelectedService(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plans & Agency Services"
        subtitle="Browse all 14 managed agency services across 3 flexible tiers, configure your brief, and place an order."
        actions={
          <Link href="/dashboard/orders">
            <Button variant="outline" size="sm">
              View My Orders
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        }
      />

      {placedResult ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-[var(--radius-surface)] border border-[var(--insight-border)] bg-[var(--insight-surface)] p-4">
          <div className="flex items-center gap-2.5 text-xs font-medium text-[var(--insight-foreground)]">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>
              Order <strong className="font-mono">{placedResult.orderRef}</strong> created! Settle the generated invoice to begin fulfillment.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/orders/${placedResult.orderId}`}>
              <Button variant="outline" size="xs">
                View Order
              </Button>
            </Link>
            <Link href={`/dashboard/billing/${placedResult.invoiceId}?pay=1`}>
              <Button variant="primary" size="xs">
                Pay Invoice
              </Button>
            </Link>
          </div>
        </div>
      ) : null}

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={category}
          onValueChange={(v) => setCategory(v as ServiceFilterCategory)}
        >
          <TabsList>
            {SERVICE_FILTER_CATEGORIES.map((cat) => (
              <TabsTrigger key={cat} value={cat}>
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[var(--muted-foreground)]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search 14 services..."
            className="pl-8"
          />
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredServices.map((svc) => (
          <Card key={svc.slug} className="p-5 flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-control)] bg-[var(--accent)] text-[var(--primary-text)]">
                  <ServiceIcon name={svc.iconName} className="h-5 w-5" />
                </span>
                <Badge tone="neutral" variant="sm">
                  {svc.category}
                </Badge>
              </div>

              <h3 className="mt-3 text-sm font-semibold text-[var(--foreground)]">
                {svc.name}
              </h3>
              <p className="mt-1 text-xs text-[var(--muted-foreground)] leading-relaxed">
                {svc.tagline}
              </p>

              {/* 3 Tiers Quick Preview */}
              <div className="mt-4 grid grid-cols-3 gap-1.5 rounded-[var(--radius-control)] bg-[var(--muted)] p-1.5 border border-[var(--border)]">
                {svc.tiers.map((tier, idx) => (
                  <button
                    key={tier.name}
                    type="button"
                    onClick={() => openConfigure(svc, idx)}
                    className="rounded-[6px] px-2 py-1.5 text-center transition-colors hover:bg-[var(--card)]"
                  >
                    <div className="text-[10px] font-medium text-[var(--muted-foreground)]">
                      {tier.name}
                    </div>
                    <div className="font-mono text-xs font-semibold text-[var(--foreground)]">
                      ${tier.priceUsd}
                    </div>
                  </button>
                ))}
              </div>

              <ul className="mt-3 space-y-1.5">
                {svc.highlights.slice(0, 3).map((hl) => (
                  <li
                    key={hl}
                    className="flex items-start gap-1.5 text-[11px] text-[var(--muted-foreground)]"
                  >
                    <Check className="h-3.5 w-3.5 text-[var(--success)] shrink-0 mt-0.5" />
                    <span>{hl}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[var(--muted-foreground)] block">
                  Starting at
                </span>
                <span className="font-mono text-sm font-semibold text-[var(--foreground)]">
                  ${svc.priceUsd}
                  <span className="text-[11px] font-normal text-[var(--muted-foreground)]">
                    /mo
                  </span>
                </span>
              </div>
              <Button variant="primary" size="sm" onClick={() => openConfigure(svc, 1)}>
                Configure Plan
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Configure & Place Order Modal */}
      <Modal
        isOpen={Boolean(selectedService)}
        onClose={() => setSelectedService(null)}
        title={selectedService ? `Configure ${selectedService.name}` : "Configure Plan"}
        maxWidth="620px"
      >
        {selectedService && activeTier ? (
          <form onSubmit={handlePlaceOrder} className="space-y-4">
            {/* Tier Selector */}
            <div>
              <label className="text-xs font-medium text-[var(--foreground)] block mb-2">
                Select Tier (3 Tiers)
              </label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {selectedService.tiers.map((tier, idx) => {
                  const active = idx === selectedTierIndex;
                  return (
                    <button
                      key={tier.name}
                      type="button"
                      onClick={() => setSelectedTierIndex(idx)}
                      className={`rounded-[var(--radius-control)] border p-3 text-left transition-colors ${
                        active
                          ? "border-[var(--primary)] bg-[var(--accent)]"
                          : "border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[var(--foreground)]">
                          {tier.name}
                        </span>
                        {tier.popular ? (
                          <Sparkles className="h-3 w-3 text-[var(--primary-text)]" />
                        ) : null}
                      </div>
                      <div className="mt-1 font-mono text-sm font-bold text-[var(--foreground)]">
                        ${tier.priceUsd}
                        <span className="text-[10px] font-normal text-[var(--muted-foreground)]">
                          /mo
                        </span>
                      </div>
                      <p className="mt-1 text-[10px] text-[var(--muted-foreground)] line-clamp-2">
                        {tier.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Tier Features */}
            <div className="rounded-[var(--radius-control)] bg-[var(--muted)]/50 border border-[var(--border)] p-3">
              <div className="text-[11px] font-semibold text-[var(--foreground)] mb-1.5">
                Included in {activeTier.name}:
              </div>
              <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                {activeTier.features.slice(0, 6).map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-1.5 text-[11px] text-[var(--muted-foreground)]"
                  >
                    <Check className="h-3 w-3 text-[var(--success)] shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Select
                label="Billing Cycle"
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value as BillingCycle)}
              >
                {Object.entries(CYCLE_DISCOUNT).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {meta.label} {meta.discountNote ? `(${meta.discountNote})` : ""}
                  </option>
                ))}
              </Select>

              <Input
                label="Coupon Code (optional)"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Try GROWTH10"
              />
            </div>

            <Input
              label="Target Domain or Project URL"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://yourcompany.com"
              required
            />

            <Textarea
              label="Campaign Brief & Goals"
              rows={3}
              value={briefNotes}
              onChange={(e) => setBriefNotes(e.target.value)}
              placeholder="Share target regions, competitors, KPIs, or access details..."
            />

            <div className="flex items-center justify-between border-t border-[var(--border)] pt-3">
              <div>
                <span className="text-[11px] text-[var(--muted-foreground)] block">
                  Estimated Order Total
                </span>
                <span className="font-mono text-lg font-bold text-[var(--foreground)]">
                  {formatMoney(computedTotalCents, "USD")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedService(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Place Order
                </Button>
              </div>
            </div>
          </form>
        ) : null}
      </Modal>
    </div>
  );
}
