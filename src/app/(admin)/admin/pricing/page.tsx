"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, Globe, Save } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import type { PricingConsoleState, PricingCurrencyRule } from "@/lib/admin-types";

export default function AdminPricingPage() {
  const [pricing, setPricing] = useState<PricingConsoleState | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    fetch("/api/admin/commerce")
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setPricing(json.pricing);
      });
  }, []);

  const updateCurrency = (code: string, patch: Partial<PricingCurrencyRule>) => {
    if (!pricing) return;
    setPricing({
      ...pricing,
      currencies: pricing.currencies.map((c) => (c.currency === code ? { ...c, ...patch } : c)),
    });
  };

  const handleSave = async () => {
    if (!pricing) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/commerce", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "pricing", ...pricing }),
      });
      const json = await res.json();
      if (json.ok) {
        setPricing(json.pricing);
        setSavedToast(true);
        setTimeout(() => setSavedToast(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  if (!pricing) {
    return (
      <div className="space-y-5">
        <PageHeader title="Pricing Consoles" subtitle="Loading pricing rules..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pricing Consoles"
        subtitle="Control global billing cycle discounts, tier multipliers, FX conversion rates, and tax rules."
        actions={
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="cpki-btn cpki-btn-primary cpki-btn-sm"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Saving..." : "Save Pricing Rules"}
          </button>
        }
      />

      {savedToast && (
        <div className="cpki-card-insight px-4 py-2.5 text-xs font-medium text-[var(--insight-foreground)] flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Global pricing console settings saved and published.
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="cpki-card p-5 space-y-4">
          <h2 className="text-sm font-semibold">Billing Cycle Discounts & Tax</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Annual Billing Discount (%)</label>
              <input
                type="number"
                min="0"
                max="50"
                value={pricing.annualDiscountPct}
                onChange={(e) =>
                  setPricing({ ...pricing, annualDiscountPct: Number(e.target.value) })
                }
                className="cpki-input"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Quarterly Billing Discount (%)</label>
              <input
                type="number"
                min="0"
                max="50"
                value={pricing.quarterlyDiscountPct}
                onChange={(e) =>
                  setPricing({ ...pricing, quarterlyDiscountPct: Number(e.target.value) })
                }
                className="cpki-input"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={pricing.autoTaxEnabled}
              onChange={(e) => setPricing({ ...pricing, autoTaxEnabled: e.target.checked })}
            />
            <span>Automatically apply regional VAT / GST tax rules at checkout</span>
          </label>
        </div>

        <div className="cpki-card p-5 space-y-4">
          <h2 className="text-sm font-semibold">Default Tier Multipliers</h2>
          <div className="grid grid-cols-3 gap-3">
            {(["Standard", "Growth", "Enterprise"] as const).map((tier) => (
              <div key={tier} className="space-y-1.5">
                <label className="text-xs font-medium">{tier} (×)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  value={pricing.tierMultipliers[tier]}
                  onChange={(e) =>
                    setPricing({
                      ...pricing,
                      tierMultipliers: {
                        ...pricing.tierMultipliers,
                        [tier]: Number(e.target.value),
                      },
                    })
                  }
                  className="cpki-input"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Multi-currency FX & Tax Console */}
      <div className="cpki-card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-3">
          <Globe className="h-4 w-4 text-[var(--primary-text)]" />
          <h2 className="text-sm font-semibold">Multi-Currency & Regional Tax Matrix</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="cpki-table">
            <thead>
              <tr>
                <th>Currency</th>
                <th>FX Rate (vs USD)</th>
                <th>Rounding Rule</th>
                <th>Default Tax (%)</th>
                <th>Status</th>
                <th className="text-right">Toggle</th>
              </tr>
            </thead>
            <tbody>
              {pricing.currencies.map((cur) => (
                <tr key={cur.currency}>
                  <td className="font-mono text-xs font-semibold">
                    {cur.currency} ({cur.symbol})
                  </td>
                  <td className="w-36">
                    <input
                      type="number"
                      step="0.01"
                      value={cur.rateToUsd}
                      onChange={(e) =>
                        updateCurrency(cur.currency, { rateToUsd: Number(e.target.value) })
                      }
                      className="cpki-input !py-1"
                    />
                  </td>
                  <td className="w-40">
                    <select
                      value={cur.roundingRule}
                      onChange={(e) =>
                        updateCurrency(cur.currency, {
                          roundingRule: e.target.value as PricingCurrencyRule["roundingRule"],
                        })
                      }
                      className="cpki-select !py-1"
                    >
                      <option value="EXACT_99">Psychological (.99)</option>
                      <option value="NEAREST_5">Nearest 5</option>
                      <option value="NEAREST_1">Nearest Integer</option>
                    </select>
                  </td>
                  <td className="w-28">
                    <input
                      type="number"
                      min="0"
                      max="40"
                      value={cur.taxRatePct}
                      onChange={(e) =>
                        updateCurrency(cur.currency, { taxRatePct: Number(e.target.value) })
                      }
                      className="cpki-input !py-1"
                    />
                  </td>
                  <td>
                    <Badge tone={cur.enabled ? "success" : "neutral"} variant="sm">
                      {cur.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </td>
                  <td className="text-right">
                    <button
                      type="button"
                      onClick={() => updateCurrency(cur.currency, { enabled: !cur.enabled })}
                      className="cpki-btn cpki-btn-outline cpki-btn-xs"
                    >
                      {cur.enabled ? "Disable" : "Enable"}
                    </button>
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
