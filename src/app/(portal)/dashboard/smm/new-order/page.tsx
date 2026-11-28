"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Layers,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatMoney } from "@/lib/formatters";
import { usePortalStore } from "../../_data/portal-store";

function SmmNewOrderContent() {
  const searchParams = useSearchParams();
  const initialServiceId = searchParams?.get("serviceId") ?? "";

  const { state, walletBalanceCents, placeSmmOrder } = usePortalStore();

  const categories = useMemo(
    () => Array.from(new Set(state.smmServices.map((s) => s.category))),
    [state.smmServices]
  );

  const initialService =
    state.smmServices.find((s) => s.id === initialServiceId) ?? state.smmServices[0];

  const [category, setCategory] = useState<string>(
    initialService?.category ?? categories[0] ?? "Instagram"
  );
  const [serviceId, setServiceId] = useState<string>(initialService?.id ?? "");
  const [link, setLink] = useState("");
  const [quantity, setQuantity] = useState<string>(
    String(initialService?.minQty ?? 1000)
  );
  const [error, setError] = useState<string | null>(null);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);

  const servicesInCategory = useMemo(
    () => state.smmServices.filter((s) => s.category === category),
    [state.smmServices, category]
  );

  // Keep serviceId synced if category changes manually
  useEffect(() => {
    if (!servicesInCategory.some((s) => s.id === serviceId)) {
      const first = servicesInCategory[0];
      if (first) {
        setServiceId(first.id);
        setQuantity(String(first.minQty));
      }
    }
  }, [servicesInCategory, serviceId]);

  // Sync if ?serviceId changes
  useEffect(() => {
    if (!initialServiceId) return;
    const target = state.smmServices.find((s) => s.id === initialServiceId);
    if (target) {
      setCategory(target.category);
      setServiceId(target.id);
      setQuantity(String(target.minQty));
    }
  }, [initialServiceId, state.smmServices]);

  const selectedService =
    state.smmServices.find((s) => s.id === serviceId) ?? servicesInCategory[0];

  const parsedQty = Number.parseInt(quantity, 10) || 0;
  const chargeCents = selectedService
    ? Math.max(
        0,
        Math.round((parsedQty / 1000) * selectedService.ratePerThousand * 100)
      )
    : 0;
  const remainingBalanceCents = walletBalanceCents - chargeCents;
  const insufficientFunds = chargeCents > walletBalanceCents;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPlacedOrderId(null);

    if (!selectedService) {
      setError("Please select a service.");
      return;
    }
    if (!link.trim()) {
      setError("Please enter a valid target link or username URL.");
      return;
    }

    const res = placeSmmOrder({
      serviceId: selectedService.id,
      link: link.trim(),
      quantity: parsedQty,
    });

    if (!res.ok) {
      setError(res.error ?? "Unable to place SMM order.");
      return;
    }

    setPlacedOrderId(res.order?.id ?? "SMM");
    setLink("");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="New SMM Order"
        subtitle="Select a category and service, enter your target link, and pay instantly from your wallet balance."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/dashboard/smm/services">
              <Button variant="outline" size="sm">
                <Layers className="h-3.5 w-3.5" />
                Browse Services
              </Button>
            </Link>
            <Link href="/dashboard/balance">
              <Button variant="quiet" size="sm">
                <Wallet className="h-3.5 w-3.5" />
                Wallet: {formatMoney(walletBalanceCents, "USD")}
              </Button>
            </Link>
          </div>
        }
      />

      {placedOrderId ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-[var(--radius-surface)] border border-[var(--insight-border)] bg-[var(--insight-surface)] p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--insight-foreground)]">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>
              SMM Order <strong className="font-mono">{placedOrderId}</strong> submitted and queued for delivery!
            </span>
          </div>
          <Link href="/dashboard/smm/orders">
            <Button variant="primary" size="xs">
              View Order History
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Order Form */}
        <Card className="p-5 lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </Select>

            <Select
              label="Service"
              value={serviceId}
              onChange={(e) => {
                const nextId = e.target.value;
                setServiceId(nextId);
                const svc = state.smmServices.find((s) => s.id === nextId);
                if (svc) setQuantity(String(svc.minQty));
              }}
            >
              {servicesInCategory.map((svc) => (
                <option key={svc.id} value={svc.id}>
                  #{svc.externalId} — {svc.name} (${svc.ratePerThousand.toFixed(2)}/1k)
                </option>
              ))}
            </Select>

            <Input
              label="Target Link"
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://instagram.com/yourhandle or post URL"
              required
            />

            <Input
              label="Quantity"
              type="number"
              min={selectedService?.minQty ?? 1}
              max={selectedService?.maxQty ?? 1000000}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              hint={
                selectedService
                  ? `Min: ${selectedService.minQty.toLocaleString()} · Max: ${selectedService.maxQty.toLocaleString()}`
                  : undefined
              }
              required
            />

            {insufficientFunds ? (
              <div className="flex items-center justify-between gap-3 rounded-[var(--radius-control)] border border-[var(--destructive)]/30 bg-[var(--danger-subtle)] px-3.5 py-2.5 text-xs text-[var(--destructive)]">
                <span className="flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  Insufficient wallet balance for this order.
                </span>
                <Link href="/dashboard/balance" className="font-semibold underline shrink-0">
                  Add Funds →
                </Link>
              </div>
            ) : null}

            {error ? (
              <div className="rounded-[var(--radius-control)] bg-[var(--danger-subtle)] px-3 py-2 text-xs text-[var(--destructive)]">
                {error}
              </div>
            ) : null}

            <div className="flex items-center justify-between border-t border-[var(--border)] pt-4">
              <div>
                <span className="text-[11px] text-[var(--muted-foreground)] block">
                  Live Charge
                </span>
                <span className="font-mono text-xl font-bold text-[var(--foreground)]">
                  {formatMoney(chargeCents, "USD")}
                </span>
              </div>
              <Button
                type="submit"
                variant="primary"
                disabled={insufficientFunds || !selectedService}
              >
                Place SMM Order
              </Button>
            </div>
          </form>
        </Card>

        {/* Service Details & Wallet Summary */}
        <div className="space-y-4">
          <Card className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">
                Service Summary
              </h3>
              {selectedService ? (
                <Badge tone="primary" variant="sm">
                  #{selectedService.externalId}
                </Badge>
              ) : null}
            </div>
            {selectedService ? (
              <div className="space-y-2.5 text-xs">
                <div className="font-medium text-[var(--foreground)]">
                  {selectedService.name}
                </div>
                <p className="text-[var(--muted-foreground)] leading-relaxed">
                  {selectedService.description}
                </p>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border)]">
                  <div>
                    <span className="text-[10px] text-[var(--muted-foreground)] block">
                      Rate / 1,000
                    </span>
                    <span className="font-mono font-semibold text-[var(--foreground)]">
                      ${selectedService.ratePerThousand.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--muted-foreground)] block">
                      Avg. Start Time
                    </span>
                    <span className="font-semibold text-[var(--foreground)]">
                      {selectedService.avgTime}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--muted-foreground)] block">
                      Min / Max
                    </span>
                    <span className="font-mono font-semibold text-[var(--foreground)]">
                      {selectedService.minQty.toLocaleString()} /{" "}
                      {selectedService.maxQty.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--muted-foreground)] block">
                      Refill Guarantee
                    </span>
                    <span className="font-semibold text-[var(--foreground)]">
                      {selectedService.refillSupported ? "30-Day Refill" : "No Refill"}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}
          </Card>

          <Card className="p-5 space-y-2.5 text-xs">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">
              Wallet Impact
            </h3>
            <div className="flex items-center justify-between text-[var(--muted-foreground)]">
              <span>Current Balance</span>
              <span className="font-mono font-medium text-[var(--foreground)]">
                {formatMoney(walletBalanceCents, "USD")}
              </span>
            </div>
            <div className="flex items-center justify-between text-[var(--muted-foreground)]">
              <span>Order Charge</span>
              <span className="font-mono font-medium text-[var(--foreground)]">
                -{formatMoney(chargeCents, "USD")}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-[var(--border)] pt-2 font-semibold">
              <span>Remaining Balance</span>
              <span
                className={`font-mono ${
                  remainingBalanceCents < 0
                    ? "text-[var(--destructive)]"
                    : "text-[var(--success)]"
                }`}
              >
                {formatMoney(remainingBalanceCents, "USD")}
              </span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function PortalSmmNewOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-xs text-[var(--muted-foreground)]">
          Loading SMM order form...
        </div>
      }
    >
      <SmmNewOrderContent />
    </Suspense>
  );
}
