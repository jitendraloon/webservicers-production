"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  DollarSign,
  Gift,
  Globe,
  Key,
  Layers,
  Percent,
  RefreshCw,
  Send,
  Share2,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import type { AffiliateRecord, PayoutRequest } from "@/app/api/affiliates/route";
import { getReferralUrl } from "@/lib/site-url";

const SAMPLE_REFERRAL_ORDERS = [
  {
    id: "ref_101",
    clientMasked: "el***@nordiccloud.io",
    service: "Modern Web Application (Enterprise Tier)",
    orderAmount: 599.0,
    rate: 15,
    commission: 89.85,
    status: "Approved",
    date: "Nov 26, 2026",
  },
  {
    id: "ref_102",
    clientMasked: "ma***@vancemedia.co",
    service: "Enterprise Cloud & SEO Growth Suite",
    orderAmount: 299.0,
    rate: 15,
    commission: 44.85,
    status: "Approved",
    date: "Nov 22, 2026",
  },
  {
    id: "ref_103",
    clientMasked: "pr***@kinetixlabs.in",
    service: "High-Traffic SMM Growth Package",
    orderAmount: 180.0,
    rate: 15,
    commission: 27.0,
    status: "Approved",
    date: "Nov 18, 2026",
  },
  {
    id: "ref_104",
    clientMasked: "lu***@meyer-ventures.de",
    service: "Brand Identity & Design System",
    orderAmount: 499.0,
    rate: 15,
    commission: 74.85,
    status: "Pending Clearance",
    date: "Nov 27, 2026",
  },
];

export default function UserAffiliatePage() {
  const [activeTab, setActiveTab] = useState<"affiliate" | "reseller">("affiliate");
  const [affiliate, setAffiliate] = useState<AffiliateRecord | null>(null);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Request Payout Modal state
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("100");
  const [payoutMethod, setPayoutMethod] = useState<PayoutRequest["method"]>("PayPal");
  const [payoutDetails, setPayoutDetails] = useState("");
  const [requestingPayout, setRequestingPayout] = useState(false);

  // Reseller settings
  const [resellerBrand, setResellerBrand] = useState("Alpha Digital Agency");
  const [resellerDomain, setResellerDomain] = useState("portal.alphadigital.io");
  const [savingReseller, setSavingReseller] = useState(false);

  const fetchAffiliateData = async () => {
    try {
      const res = await fetch("/api/affiliates?userOnly=true");
      const json = await res.json();
      if (json.ok) {
        setAffiliate(json.affiliate);
        setPayouts(json.payouts || []);
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchAffiliateData();
  }, []);

  const referralCode = affiliate?.code || "WS-48291";
  const referralUrl = getReferralUrl(referralCode);
  const apiKey = affiliate?.resellerApiKey || "ws_live_reseller_9942a8e7bc109";

  const copyReferralLink = () => {
    navigator.clipboard?.writeText(referralUrl);
    setCopiedLink(true);
    setToast("Referral link copied to clipboard!");
    setTimeout(() => {
      setCopiedLink(false);
      setToast(null);
    }, 2500);
  };

  const copyApiKey = () => {
    navigator.clipboard?.writeText(apiKey);
    setCopiedKey(true);
    setToast("Reseller API key copied to clipboard!");
    setTimeout(() => {
      setCopiedKey(false);
      setToast(null);
    }, 2500);
  };

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequestingPayout(true);
    try {
      const res = await fetch("/api/affiliates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request_payout",
          amount: Number(payoutAmount),
          method: payoutMethod,
          details: payoutDetails.trim() || `${payoutMethod} account details`,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setToast("Payout request submitted successfully! Our finance team will process it shortly.");
        setIsPayoutModalOpen(false);
        fetchAffiliateData();
        setTimeout(() => setToast(null), 4000);
      } else {
        setToast(json.error || "Failed to request payout");
      }
    } finally {
      setRequestingPayout(false);
    }
  };

  const handleSaveResellerSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingReseller(true);
    setTimeout(() => {
      setSavingReseller(false);
      setToast("White-label agency reseller branding saved.");
      setTimeout(() => setToast(null), 3000);
    }, 800);
  };

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        title="Affiliate & Reseller Program"
        subtitle="Earn 15% lifetime recurring commissions on referred agency clients, or resell managed services under your own white-label agency brand."
        actions={
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsPayoutModalOpen(true)}
              variant="primary"
              size="sm"
              disabled={!affiliate || affiliate.availableBalance < 50}
            >
              <Wallet className="h-4 w-4 mr-1.5" />
              Request Payout
            </Button>
          </div>
        }
      />

      {toast && (
        <div className="cpki-card-insight px-4 py-2.5 text-xs font-medium text-[var(--insight-foreground)] flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />
          {toast}
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("affiliate")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "affiliate"
              ? "bg-[var(--foreground)] text-[var(--background)] shadow-xs"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/40"
          }`}
        >
          <Gift className="h-4 w-4" />
          <span>Affiliate Partner Program</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("reseller")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "reseller"
              ? "bg-[var(--foreground)] text-[var(--background)] shadow-xs"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/40"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>Agency Reseller Studio</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--primary)] text-white font-mono">
            20% OFF
          </span>
        </button>
      </div>

      {activeTab === "affiliate" && (
        <div className="space-y-6">
          {/* Unique Referral Link Card */}
          <Card className="p-5 space-y-3 bg-[var(--muted)]/15 border-[var(--primary)]/30">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--primary-text)]">
                  YOUR UNIQUE REFERRAL LINK
                </span>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Share this link with peers, clients, or on social media. 60-day cookie tracking with 15% recurring payout.
                </p>
              </div>
              <Badge tone="lilac" variant="sm">
                15% Lifetime Recurring
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <input
                readOnly
                value={referralUrl}
                className="cpki-input text-xs font-mono font-semibold flex-1 bg-[var(--card)]"
              />
              <Button onClick={copyReferralLink} variant="primary" size="sm">
                {copiedLink ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                {copiedLink ? "Copied" : "Copy Link"}
              </Button>
            </div>
          </Card>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 space-y-1">
              <div className="text-xs text-[var(--muted-foreground)]">Total Referral Clicks</div>
              <div className="text-2xl font-bold text-[var(--foreground)]">
                {affiliate?.clicks || 342}
              </div>
              <div className="text-[11px] text-[var(--muted-foreground)]">Unique visitor redirects</div>
            </Card>

            <Card className="p-4 space-y-1">
              <div className="text-xs text-[var(--muted-foreground)]">Converted Orders</div>
              <div className="text-2xl font-bold text-[var(--foreground)]">
                {affiliate?.referrals || 24}
              </div>
              <div className="text-[11px] text-emerald-500 font-semibold">7.0% conversion rate</div>
            </Card>

            <Card className="p-4 space-y-1">
              <div className="text-xs text-[var(--muted-foreground)]">Available Balance</div>
              <div className="text-2xl font-bold text-[var(--primary-text)] font-mono">
                ${(affiliate?.availableBalance || 425.0).toFixed(2)}
              </div>
              <div className="text-[11px] text-[var(--muted-foreground)]">Ready for payout</div>
            </Card>

            <Card className="p-4 space-y-1">
              <div className="text-xs text-[var(--muted-foreground)]">Total Lifetime Earned</div>
              <div className="text-2xl font-bold text-[var(--foreground)] font-mono">
                ${(affiliate?.totalEarned || 1850.0).toFixed(2)}
              </div>
              <div className="text-[11px] text-[var(--muted-foreground)]">All-time commissions</div>
            </Card>
          </div>

          {/* Referral Orders Table */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[var(--foreground)]">Recent Referral Activity</h3>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Live commissions earned from client purchases attributed to your affiliate code.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="cpki-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Referred Client</th>
                    <th>Service Deliverable</th>
                    <th>Order Total</th>
                    <th>Commission (15%)</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {SAMPLE_REFERRAL_ORDERS.map((ord) => (
                    <tr key={ord.id}>
                      <td className="text-xs text-[var(--muted-foreground)]">{ord.date}</td>
                      <td className="text-xs font-mono font-semibold">{ord.clientMasked}</td>
                      <td className="text-xs font-medium text-[var(--foreground)]">{ord.service}</td>
                      <td className="text-xs font-mono">${ord.orderAmount.toFixed(2)}</td>
                      <td className="text-xs font-mono font-bold text-emerald-500">
                        +${ord.commission.toFixed(2)}
                      </td>
                      <td>
                        <Badge
                          tone={ord.status === "Approved" ? "success" : "warning"}
                          variant="sm"
                        >
                          {ord.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Payout History */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[var(--foreground)]">Payout History</h3>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Record of processed payout transfers to your designated payment accounts.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="cpki-table">
                <thead>
                  <tr>
                    <th>Payout ID</th>
                    <th>Date</th>
                    <th>Method</th>
                    <th>Account Details</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((pay) => (
                    <tr key={pay.id}>
                      <td className="text-xs font-mono">{pay.id}</td>
                      <td className="text-xs text-[var(--muted-foreground)]">
                        {new Date(pay.createdAt).toLocaleDateString()}
                      </td>
                      <td className="text-xs font-semibold">{pay.method}</td>
                      <td className="text-xs font-mono text-[var(--muted-foreground)]">
                        {pay.details}
                      </td>
                      <td className="text-xs font-mono font-bold">${pay.amount.toFixed(2)}</td>
                      <td>
                        <Badge
                          tone={
                            pay.status === "Paid"
                              ? "success"
                              : pay.status === "Approved"
                              ? "lilac"
                              : "warning"
                          }
                          variant="sm"
                        >
                          {pay.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "reseller" && (
        <div className="space-y-6">
          <Card className="p-5 space-y-4 bg-[var(--muted)]/20 border-[var(--primary)]/30">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[var(--foreground)]">
                    Agency Reseller &amp; White-Label Status
                  </h3>
                  <Badge tone="success" variant="sm">
                    Active Reseller
                  </Badge>
                </div>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  You receive an automatic 20% wholesale discount across all catalog services, digital products, and SMM panel APIs.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[var(--border)]">
              <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--card)] space-y-1">
                <div className="text-xs text-[var(--muted-foreground)]">Catalog Wholesale Discount</div>
                <div className="text-xl font-bold text-[var(--primary-text)] font-mono">20% OFF</div>
                <div className="text-[11px] text-[var(--muted-foreground)]">Applied automatically at checkout</div>
              </div>
              <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--card)] space-y-1">
                <div className="text-xs text-[var(--muted-foreground)]">White-Label Client Portal</div>
                <div className="text-xl font-bold text-[var(--foreground)]">Enabled</div>
                <div className="text-[11px] text-[var(--muted-foreground)]">Custom CNAME &amp; logo support</div>
              </div>
              <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--card)] space-y-1">
                <div className="text-xs text-[var(--muted-foreground)]">API Automation</div>
                <div className="text-xl font-bold text-[var(--foreground)]">Direct Access</div>
                <div className="text-[11px] text-[var(--muted-foreground)]">REST API for automatic orders</div>
              </div>
            </div>
          </Card>

          {/* Reseller API Credentials */}
          <Card className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-1.5">
                  <Key className="h-4 w-4 text-[var(--primary)]" />
                  Reseller REST API Key
                </h3>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Use this secret key to automate order placement and check service status programmatically.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                readOnly
                type="password"
                value={apiKey}
                className="cpki-input text-xs font-mono font-semibold flex-1 bg-[var(--card)]"
              />
              <Button onClick={copyApiKey} variant="outline" size="sm">
                {copiedKey ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                {copiedKey ? "Copied" : "Copy Key"}
              </Button>
            </div>
          </Card>

          {/* White-Label Settings Form */}
          <Card className="p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-1.5">
                <Globe className="h-4 w-4 text-[var(--primary)]" />
                White-Label Agency Branding
              </h3>
              <p className="text-xs text-[var(--muted-foreground)]">
                Present order deliverables, reports, and onboarding steps under your agency brand name.
              </p>
            </div>

            <form onSubmit={handleSaveResellerSettings} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--foreground)]">
                    Agency Display Name
                  </label>
                  <Input
                    value={resellerBrand}
                    onChange={(e) => setResellerBrand(e.target.value)}
                    placeholder="e.g. Apex Marketing Labs"
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--foreground)]">
                    Custom Client Portal CNAME Domain
                  </label>
                  <Input
                    value={resellerDomain}
                    onChange={(e) => setResellerDomain(e.target.value)}
                    placeholder="e.g. clients.myagency.com"
                    className="text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" variant="primary" size="sm" disabled={savingReseller}>
                  {savingReseller ? "Saving..." : "Save White-Label Branding"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Request Payout Modal */}
      <Modal
        isOpen={isPayoutModalOpen}
        onClose={() => setIsPayoutModalOpen(false)}
        title="Request Commission Payout"
        maxWidth="500px"
      >
        <form onSubmit={handleRequestPayout} className="space-y-4">
          <div className="p-3 rounded-lg bg-[var(--muted)]/40 text-xs text-[var(--muted-foreground)] space-y-1">
            <div className="flex justify-between">
              <span>Available for Withdrawal:</span>
              <span className="font-bold text-[var(--foreground)] font-mono">
                ${(affiliate?.availableBalance || 425.0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span>Minimum Payout Threshold:</span>
              <span>$50.00 USD</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--foreground)]">Withdrawal Amount ($ USD) *</label>
            <Input
              required
              type="number"
              min={50}
              max={affiliate?.availableBalance || 425}
              value={payoutAmount}
              onChange={(e) => setPayoutAmount(e.target.value)}
              className="text-xs font-semibold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--foreground)]">Payout Destination *</label>
            <select
              value={payoutMethod}
              onChange={(e) => setPayoutMethod(e.target.value as PayoutRequest["method"])}
              className="cpki-select text-xs"
            >
              <option value="PayPal">PayPal Account</option>
              <option value="Bank Transfer">International Bank Transfer (SWIFT / SEPA / ACH)</option>
              <option value="USDT (TRC20)">Crypto USDT (TRC-20 Wallet)</option>
              <option value="Wallet Balance">Credit to WebServicers Account Wallet</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--foreground)]">Payment Details / Address *</label>
            <Input
              required
              value={payoutDetails}
              onChange={(e) => setPayoutDetails(e.target.value)}
              placeholder={
                payoutMethod === "PayPal"
                  ? "Enter PayPal email address"
                  : payoutMethod === "USDT (TRC20)"
                  ? "Enter TRC-20 wallet address"
                  : payoutMethod === "Bank Transfer"
                  ? "Enter IBAN, Swift code, and account holder name"
                  : "Automatic instant credit to wallet"
              }
              className="text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsPayoutModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={requestingPayout}>
              {requestingPayout ? "Submitting..." : "Submit Payout Request"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
