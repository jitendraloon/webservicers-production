import { NextRequest, NextResponse } from "next/server";

export interface AffiliateRecord {
  id: string;
  name: string;
  email: string;
  code: string;
  type: "Affiliate" | "Reseller";
  commissionPct: number;
  clicks: number;
  referrals: number;
  availableBalance: number;
  totalEarned: number;
  status: "Active" | "Paused";
  resellerApiKey?: string;
  whiteLabelDomain?: string;
  resellerDiscountPct?: number;
}

export interface PayoutRequest {
  id: string;
  affiliateId: string;
  affiliateName: string;
  amount: number;
  method: "PayPal" | "Bank Transfer" | "USDT (TRC20)" | "Wallet Balance";
  details: string;
  status: "Pending" | "Approved" | "Paid" | "Rejected";
  createdAt: string;
}

let AFFILIATES_STORE: AffiliateRecord[] = [
  {
    id: "aff_alex",
    name: "Alex Morgan",
    email: "alex.morgan@webservicers.io",
    code: "WS-48291",
    type: "Affiliate",
    commissionPct: 15,
    clicks: 342,
    referrals: 24,
    availableBalance: 425.0,
    totalEarned: 1850.0,
    status: "Active",
    resellerApiKey: "ws_live_reseller_9942a8e7bc109",
    resellerDiscountPct: 20,
    whiteLabelDomain: "agency.clientportal.dev",
  },
  {
    id: "aff_104",
    name: "CloudScale Media",
    email: "partners@cloudscale.io",
    code: "CLOUDSCALE20",
    type: "Reseller",
    commissionPct: 20,
    clicks: 1240,
    referrals: 48,
    availableBalance: 1420.0,
    totalEarned: 18450.0,
    status: "Active",
    resellerApiKey: "ws_live_reseller_7718be29fa012",
    resellerDiscountPct: 25,
    whiteLabelDomain: "portal.cloudscale.io",
  },
  {
    id: "aff_103",
    name: "SaaS Weekly Newsletter",
    email: "editor@saasweekly.com",
    code: "SAASWEEKLY",
    type: "Affiliate",
    commissionPct: 15,
    clicks: 890,
    referrals: 112,
    availableBalance: 890.5,
    totalEarned: 9320.5,
    status: "Active",
  },
];

let PAYOUTS_STORE: PayoutRequest[] = [
  {
    id: "pay_101",
    affiliateId: "aff_alex",
    affiliateName: "Alex Morgan",
    amount: 350.0,
    method: "PayPal",
    details: "alex.morgan@paypal.me",
    status: "Pending",
    createdAt: "2026-11-27T14:20:00Z",
  },
  {
    id: "pay_102",
    affiliateId: "aff_104",
    affiliateName: "CloudScale Media",
    amount: 1420.0,
    method: "Bank Transfer",
    details: "IBAN: GB82WEST12345678901234",
    status: "Approved",
    createdAt: "2026-11-26T11:15:00Z",
  },
];

let PROGRAM_SETTINGS = {
  defaultCommissionPct: 15,
  cookieDurationDays: 60,
  minPayoutThreshold: 50,
  allowResellerWhiteLabel: true,
  autoApprovePayoutsUnder: 200,
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userOnly = searchParams.get("userOnly");

  if (userOnly) {
    const userAffiliate = AFFILIATES_STORE[0];
    const userPayouts = PAYOUTS_STORE.filter((p) => p.affiliateId === userAffiliate.id);
    return NextResponse.json({
      ok: true,
      affiliate: userAffiliate,
      payouts: userPayouts,
      settings: PROGRAM_SETTINGS,
    });
  }

  return NextResponse.json({
    ok: true,
    affiliates: AFFILIATES_STORE,
    payouts: PAYOUTS_STORE,
    settings: PROGRAM_SETTINGS,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action;

    // 1. Request payout (from user)
    if (action === "request_payout") {
      const { amount, method, details } = body;
      const numAmount = Number(amount);
      if (!numAmount || numAmount < PROGRAM_SETTINGS.minPayoutThreshold) {
        return NextResponse.json(
          { ok: false, error: `Minimum payout threshold is $${PROGRAM_SETTINGS.minPayoutThreshold}` },
          { status: 400 }
        );
      }

      const userAffiliate = AFFILIATES_STORE[0];
      if (userAffiliate.availableBalance < numAmount) {
        return NextResponse.json({ ok: false, error: "Insufficient available balance" }, { status: 400 });
      }

      userAffiliate.availableBalance -= numAmount;

      const newPayout: PayoutRequest = {
        id: `pay_${Date.now()}`,
        affiliateId: userAffiliate.id,
        affiliateName: userAffiliate.name,
        amount: numAmount,
        method: method || "PayPal",
        details: details || "Default payout method",
        status: "Pending",
        createdAt: new Date().toISOString(),
      };

      PAYOUTS_STORE.unshift(newPayout);
      return NextResponse.json({ ok: true, payout: newPayout, availableBalance: userAffiliate.availableBalance });
    }

    // 2. Process / Update Payout (from admin)
    if (action === "update_payout_status") {
      const { payoutId, status } = body;
      const payout = PAYOUTS_STORE.find((p) => p.id === payoutId);
      if (!payout) return NextResponse.json({ ok: false, error: "Payout not found" }, { status: 404 });
      payout.status = status;
      return NextResponse.json({ ok: true, payout });
    }

    // 3. Save program settings (from admin)
    if (action === "save_settings") {
      if (body.settings) {
        PROGRAM_SETTINGS = { ...PROGRAM_SETTINGS, ...body.settings };
      }
      return NextResponse.json({ ok: true, settings: PROGRAM_SETTINGS });
    }

    // 4. Create new partner/reseller (from admin)
    if (action === "create_partner") {
      const { name, email, type, commissionPct } = body;
      const newPartner: AffiliateRecord = {
        id: `aff_${Date.now()}`,
        name: name || "New Partner",
        email: email || `partner${Date.now()}@example.com`,
        code: (name || "PARTNER").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8) + Math.floor(100 + Math.random() * 900),
        type: type || "Affiliate",
        commissionPct: Number(commissionPct) || 15,
        clicks: 0,
        referrals: 0,
        availableBalance: 0,
        totalEarned: 0,
        status: "Active",
        resellerApiKey: type === "Reseller" ? `ws_live_reseller_${Math.random().toString(36).slice(2, 10)}` : undefined,
        resellerDiscountPct: type === "Reseller" ? 20 : undefined,
      };
      AFFILIATES_STORE.unshift(newPartner);
      return NextResponse.json({ ok: true, partner: newPartner });
    }

    // 5. Update partner status / rate
    if (action === "update_partner") {
      const { id, commissionPct, status, type } = body;
      const partner = AFFILIATES_STORE.find((p) => p.id === id);
      if (!partner) return NextResponse.json({ ok: false, error: "Partner not found" }, { status: 404 });
      if (commissionPct !== undefined) partner.commissionPct = Number(commissionPct);
      if (status) partner.status = status;
      if (type) partner.type = type;
      return NextResponse.json({ ok: true, partner });
    }

    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
