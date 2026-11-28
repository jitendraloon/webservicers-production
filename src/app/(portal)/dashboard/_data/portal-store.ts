"use client";

import { useCallback, useEffect, useState } from "react";

export type OrderStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "REFUNDED";

export type InvoiceStatus =
  | "DRAFT"
  | "UNPAID"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED"
  | "REFUNDED";

export type MovementType = "CREDIT" | "DEBIT";

export type TicketStatus =
  | "OPEN"
  | "AWAITING_REPLY"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CLOSED";

export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type SmmOrderStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "PARTIAL"
  | "CANCELLED"
  | "REFUNDED";

export interface PortalDeliverable {
  id: string;
  title: string;
  type: "REPORT" | "FIGMA" | "DOCUMENT" | "LINK";
  url: string;
  addedAt: string;
  size?: string;
}

export interface PortalOrderTimelineStep {
  label: string;
  description: string;
  timestamp: string | null;
  completed: boolean;
  current?: boolean;
}

export interface PortalOrder {
  id: string;
  reference: string;
  serviceName: string;
  serviceSlug: string;
  tierName: "Standard" | "Growth" | "Enterprise";
  billingCycle: "MONTHLY" | "QUARTERLY" | "ANNUALLY" | "ONCE";
  status: OrderStatus;
  totalCents: number;
  currency: string;
  invoiceId: string;
  createdAt: string;
  updatedAt: string;
  brief: Record<string, string>;
  notes: string;
  deliverables: PortalDeliverable[];
  timeline: PortalOrderTimelineStep[];
}

export interface PortalInvoiceItem {
  id: string;
  description: string;
  quantity: number;
  amountCents: number;
}

export interface PortalInvoice {
  id: string;
  invoiceNumber: string;
  orderId?: string;
  orderReference?: string;
  subtotalCents: number;
  taxCents: number;
  discountCents: number;
  totalCents: number;
  currency: string;
  status: InvoiceStatus;
  paidAt: string | null;
  dueAt: string;
  createdAt: string;
  gatewayUsed?: string;
  items: PortalInvoiceItem[];
}

export interface PortalBalanceMovement {
  id: string;
  type: MovementType;
  amountCents: number;
  currency: string;
  reference: string;
  description: string;
  gateway?: string;
  createdAt: string;
}

export interface PortalTicketMessage {
  id: string;
  senderType: "USER" | "ADMIN" | "SYSTEM";
  senderName: string;
  body: string;
  createdAt: string;
}

export interface PortalTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  department: string;
  status: TicketStatus;
  priority: TicketPriority;
  relatedOrderRef?: string;
  createdAt: string;
  updatedAt: string;
  messages: PortalTicketMessage[];
}

export interface PortalSmmService {
  id: string;
  externalId: string;
  name: string;
  category: string;
  ratePerThousand: number;
  minQty: number;
  maxQty: number;
  avgTime: string;
  refillSupported: boolean;
  description: string;
}

export interface PortalSmmOrder {
  id: string;
  serviceId: string;
  serviceName: string;
  category: string;
  link: string;
  quantity: number;
  chargeCents: number;
  currency: string;
  status: SmmOrderStatus;
  startCount: number | null;
  remains: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface LinkedSsoAccount {
  provider: "google" | "microsoft" | "github";
  label: string;
  connected: boolean;
  email?: string;
  connectedAt?: string;
}

export interface PortalUserProfile {
  name: string;
  email: string;
  company: string;
  timezone: string;
  supportPin: string;
  twoFactorEnabled: boolean;
  ssoAccounts: LinkedSsoAccount[];
}

export interface PortalState {
  profile: PortalUserProfile;
  orders: PortalOrder[];
  invoices: PortalInvoice[];
  movements: PortalBalanceMovement[];
  tickets: PortalTicket[];
  smmServices: PortalSmmService[];
  smmOrders: PortalSmmOrder[];
}

export const PAYMENT_GATEWAYS = [
  { id: "stripe", name: "Stripe", subtitle: "Credit / Debit Card, Apple Pay", feeNote: "Instant" },
  { id: "paypal", name: "PayPal", subtitle: "PayPal Balance or Card", feeNote: "Instant" },
  { id: "razorpay", name: "Razorpay", subtitle: "UPI, Cards, NetBanking", feeNote: "Instant" },
  { id: "payu", name: "PayU", subtitle: "Global Cards & Local Wallets", feeNote: "Instant" },
  { id: "cashfree", name: "CashFree", subtitle: "UPI AutoPay & Instant Bank", feeNote: "Instant" },
  { id: "coinpayments", name: "CoinPayments", subtitle: "BTC, ETH, USDT, USDC", feeNote: "10–20 min" },
  { id: "bank_manual", name: "Bank Manual", subtitle: "SWIFT / ACH / Wire Transfer", feeNote: "1–2 business days" },
] as const;

export const INVOICE_GATEWAYS = [
  ...PAYMENT_GATEWAYS,
  { id: "wallet", name: "Wallet Balance", subtitle: "Pay instantly from portal credit", feeNote: "Instant" },
] as const;

const STORAGE_KEY = "ws_portal_state_v1";

export const INITIAL_PORTAL_STATE: PortalState = {
  profile: {
    name: "Alex Morgan",
    email: "alex.morgan@webservicers.io",
    company: "Northstar Digital Labs",
    timezone: "America/New_York",
    supportPin: "482910",
    twoFactorEnabled: false,
    ssoAccounts: [
      {
        provider: "google",
        label: "Google Workspace",
        connected: true,
        email: "alex.morgan@webservicers.io",
        connectedAt: "2026-09-12T10:15:00Z",
      },
      {
        provider: "microsoft",
        label: "Microsoft Entra ID",
        connected: false,
      },
      {
        provider: "github",
        label: "GitHub",
        connected: true,
        email: "alexmorgan-dev",
        connectedAt: "2026-10-03T14:30:00Z",
      },
    ],
  },
  orders: [
    {
      id: "ord_1042",
      reference: "WS-2026-1042",
      serviceName: "SEO & AI Search Optimization",
      serviceSlug: "seo",
      tierName: "Growth",
      billingCycle: "MONTHLY",
      status: "IN_PROGRESS",
      totalCents: 149900,
      currency: "USD",
      invoiceId: "inv_9012",
      createdAt: "2026-11-18T09:20:00Z",
      updatedAt: "2026-11-24T16:10:00Z",
      brief: {
        "Target Domain": "https://webservicers.io",
        "Primary Region": "United States (EN)",
        "Top Competitors": "ahrefs.com, semrush.com",
        "Focus Keywords": "ai seo workspace, automated technical seo, llm citation tracking",
      },
      notes: "Prioritize technical crawl fixes and AI Overviews citation schema on product landing pages.",
      deliverables: [
        {
          id: "del_1",
          title: "Technical Site Audit & Core Web Vitals Report",
          type: "REPORT",
          url: "/dashboard/seo/workspace/site-audit",
          addedAt: "2026-11-21T11:00:00Z",
          size: "2.4 MB PDF",
        },
        {
          id: "del_2",
          title: "Q4 Keyword & AI Prompt Gap Matrix",
          type: "DOCUMENT",
          url: "/dashboard/seo/workspace/keyword-research",
          addedAt: "2026-11-24T16:05:00Z",
          size: "Google Sheet",
        },
      ],
      timeline: [
        {
          label: "Order Placed",
          description: "Order WS-2026-1042 confirmed and assigned to SEO Delivery Pod.",
          timestamp: "2026-11-18T09:20:00Z",
          completed: true,
        },
        {
          label: "Brief Verified",
          description: "Target domain, GSC access, and competitor list validated.",
          timestamp: "2026-11-19T14:00:00Z",
          completed: true,
        },
        {
          label: "In Progress",
          description: "On-page optimization and schema deployment underway.",
          timestamp: "2026-11-21T11:00:00Z",
          completed: true,
          current: true,
        },
        {
          label: "Final Review & Delivery",
          description: "Monthly rank benchmark & executive summary sign-off.",
          timestamp: null,
          completed: false,
        },
      ],
    },
    {
      id: "ord_1038",
      reference: "WS-2026-1038",
      serviceName: "Website Design & UI Systems",
      serviceSlug: "website-design",
      tierName: "Enterprise",
      billingCycle: "ONCE",
      status: "COMPLETED",
      totalCents: 399900,
      currency: "USD",
      invoiceId: "inv_9008",
      createdAt: "2026-11-02T13:45:00Z",
      updatedAt: "2026-11-16T18:30:00Z",
      brief: {
        "Brand Name": "Northstar Digital Labs",
        "Design System": "Figma Tokens + Next.js Tailwind",
        "Pages Required": "Home, Pricing, Case Studies, 3 Product Pages",
      },
      notes: "Delivered full Figma component library and responsive prototypes.",
      deliverables: [
        {
          id: "del_3",
          title: "Figma Design System & Interactive Prototype",
          type: "FIGMA",
          url: "https://figma.com",
          addedAt: "2026-11-14T15:20:00Z",
          size: "Figma File",
        },
        {
          id: "del_4",
          title: "Brand Styleguide & Exported SVG Assets",
          type: "REPORT",
          url: "/dashboard/orders/ord_1038",
          addedAt: "2026-11-16T18:30:00Z",
          size: "18.6 MB ZIP",
        },
      ],
      timeline: [
        {
          label: "Order Placed",
          description: "Enterprise UI package initiated.",
          timestamp: "2026-11-02T13:45:00Z",
          completed: true,
        },
        {
          label: "Brief Verified",
          description: "Wireframe direction and brand tokens approved.",
          timestamp: "2026-11-04T10:00:00Z",
          completed: true,
        },
        {
          label: "In Progress",
          description: "High-fidelity screens and responsive components built.",
          timestamp: "2026-11-10T17:15:00Z",
          completed: true,
        },
        {
          label: "Completed",
          description: "All design deliverables approved and handed off.",
          timestamp: "2026-11-16T18:30:00Z",
          completed: true,
          current: true,
        },
      ],
    },
    {
      id: "ord_1031",
      reference: "WS-2026-1031",
      serviceName: "Google Search Ads",
      serviceSlug: "google-search-ads",
      tierName: "Standard",
      billingCycle: "MONTHLY",
      status: "PENDING",
      totalCents: 79900,
      currency: "USD",
      invoiceId: "inv_9015",
      createdAt: "2026-11-25T08:10:00Z",
      updatedAt: "2026-11-25T08:10:00Z",
      brief: {
        "Ad Account ID": "412-889-1024",
        "Monthly Ad Budget": "$3,500",
        "Target CPA": "$42.00",
      },
      notes: "Awaiting invoice settlement to launch search campaign buildout.",
      deliverables: [],
      timeline: [
        {
          label: "Order Placed",
          description: "Order WS-2026-1031 created; awaiting invoice payment.",
          timestamp: "2026-11-25T08:10:00Z",
          completed: true,
          current: true,
        },
        {
          label: "Brief Verified",
          description: "Pending payment confirmation.",
          timestamp: null,
          completed: false,
        },
        {
          label: "In Progress",
          description: "Campaign structure & negative keyword setup.",
          timestamp: null,
          completed: false,
        },
        {
          label: "Completed",
          description: "Live campaigns & conversion tracking verified.",
          timestamp: null,
          completed: false,
        },
      ],
    },
  ],
  invoices: [
    {
      id: "inv_9015",
      invoiceNumber: "INV-2026-9015",
      orderId: "ord_1031",
      orderReference: "WS-2026-1031",
      subtotalCents: 79900,
      taxCents: 0,
      discountCents: 0,
      totalCents: 79900,
      currency: "USD",
      status: "UNPAID",
      paidAt: null,
      dueAt: "2026-12-02T23:59:59Z",
      createdAt: "2026-11-25T08:10:00Z",
      items: [
        {
          id: "ii_1",
          description: "Google Search Ads — Standard Plan (Monthly)",
          quantity: 1,
          amountCents: 79900,
        },
      ],
    },
    {
      id: "inv_9012",
      invoiceNumber: "INV-2026-9012",
      orderId: "ord_1042",
      orderReference: "WS-2026-1042",
      subtotalCents: 149900,
      taxCents: 0,
      discountCents: 0,
      totalCents: 149900,
      currency: "USD",
      status: "PAID",
      paidAt: "2026-11-18T09:22:00Z",
      dueAt: "2026-11-25T23:59:59Z",
      createdAt: "2026-11-18T09:20:00Z",
      gatewayUsed: "Stripe",
      items: [
        {
          id: "ii_2",
          description: "SEO & AI Search Optimization — Growth Plan (Monthly)",
          quantity: 1,
          amountCents: 149900,
        },
      ],
    },
    {
      id: "inv_9008",
      invoiceNumber: "INV-2026-9008",
      orderId: "ord_1038",
      orderReference: "WS-2026-1038",
      subtotalCents: 419900,
      taxCents: 0,
      discountCents: 20000,
      totalCents: 399900,
      currency: "USD",
      status: "PAID",
      paidAt: "2026-11-02T13:50:00Z",
      dueAt: "2026-11-09T23:59:59Z",
      createdAt: "2026-11-02T13:45:00Z",
      gatewayUsed: "PayPal",
      items: [
        {
          id: "ii_3",
          description: "Website Design & UI Systems — Enterprise Package",
          quantity: 1,
          amountCents: 399900,
        },
        {
          id: "ii_4",
          description: "Custom SVG Iconography Add-on",
          quantity: 1,
          amountCents: 20000,
        },
      ],
    },
  ],
  movements: [
    {
      id: "mov_501",
      type: "CREDIT",
      amountCents: 30000,
      currency: "USD",
      reference: "DEP-STR-88412",
      description: "Wallet top-up via Stripe",
      gateway: "Stripe",
      createdAt: "2026-11-20T12:15:00Z",
    },
    {
      id: "mov_502",
      type: "DEBIT",
      amountCents: 1950,
      currency: "USD",
      reference: "SMM-7701",
      description: "SMM Order #7701 — Instagram High-Retention Followers (2,500)",
      createdAt: "2026-11-22T15:40:00Z",
    },
    {
      id: "mov_503",
      type: "DEBIT",
      amountCents: 3200,
      currency: "USD",
      reference: "SMM-7704",
      description: "SMM Order #7704 — YouTube Organic Views (10,000)",
      createdAt: "2026-11-24T10:05:00Z",
    },
  ],
  tickets: [
    {
      id: "tkt_301",
      ticketNumber: "TKT-2026-301",
      subject: "Verify Google Search Console property for WS-2026-1042",
      department: "SEO & Analytics",
      status: "AWAITING_REPLY",
      priority: "HIGH",
      relatedOrderRef: "WS-2026-1042",
      createdAt: "2026-11-23T09:15:00Z",
      updatedAt: "2026-11-24T14:20:00Z",
      messages: [
        {
          id: "msg_1",
          senderType: "USER",
          senderName: "Alex Morgan",
          body: "Hi team, I added seo@webservicers.io as a Full User on our Search Console property for webservicers.io. Can you confirm it's syncing?",
          createdAt: "2026-11-23T09:15:00Z",
        },
        {
          id: "msg_2",
          senderType: "ADMIN",
          senderName: "Maya Lin (SEO Specialist)",
          body: "Confirmed! We can see 16 months of GSC query data now. We have queued the initial crawl and will share the keyword gap sheet shortly.",
          createdAt: "2026-11-24T14:20:00Z",
        },
      ],
    },
    {
      id: "tkt_298",
      ticketNumber: "TKT-2026-298",
      subject: "Need VAT ID added to future billing invoices",
      department: "Billing & Accounts",
      status: "RESOLVED",
      priority: "LOW",
      createdAt: "2026-11-11T16:00:00Z",
      updatedAt: "2026-11-12T10:00:00Z",
      messages: [
        {
          id: "msg_3",
          senderType: "USER",
          senderName: "Alex Morgan",
          body: "Please include our corporate tax ID on PDF invoices going forward.",
          createdAt: "2026-11-11T16:00:00Z",
        },
        {
          id: "msg_4",
          senderType: "ADMIN",
          senderName: "Billing Desk",
          body: "Updated your billing profile. All new invoices will display your tax registration details automatically.",
          createdAt: "2026-11-12T10:00:00Z",
        },
      ],
    },
  ],
  smmServices: [
    {
      id: "smm_101",
      externalId: "101",
      name: "Instagram Followers [Real / High Retention · 30D Refill]",
      category: "Instagram",
      ratePerThousand: 7.8,
      minQty: 100,
      maxQty: 50000,
      avgTime: "1–3 hours",
      refillSupported: true,
      description: "Gradual natural delivery with 30-day automatic refill guarantee.",
    },
    {
      id: "smm_102",
      externalId: "102",
      name: "Instagram Post Likes [Instant · HQ Profiles]",
      category: "Instagram",
      ratePerThousand: 2.4,
      minQty: 50,
      maxQty: 25000,
      avgTime: "15 mins",
      refillSupported: false,
      description: "Fast-start likes from aged profiles with profile pictures.",
    },
    {
      id: "smm_201",
      externalId: "201",
      name: "YouTube Views [Organic Retention · Non-Drop]",
      category: "YouTube",
      ratePerThousand: 3.2,
      minQty: 500,
      maxQty: 500000,
      avgTime: "2–6 hours",
      refillSupported: true,
      description: "High-retention desktop & mobile views safe for monetized channels.",
    },
    {
      id: "smm_202",
      externalId: "202",
      name: "YouTube Subscribers [Gradual · Lifetime Refill]",
      category: "YouTube",
      ratePerThousand: 28.5,
      minQty: 50,
      maxQty: 10000,
      avgTime: "12–24 hours",
      refillSupported: true,
      description: "Slow drip delivery (50–150/day) to protect channel health.",
    },
    {
      id: "smm_301",
      externalId: "301",
      name: "TikTok Video Views [Instant · Viral Boost]",
      category: "TikTok",
      ratePerThousand: 0.95,
      minQty: 1000,
      maxQty: 1000000,
      avgTime: "10 mins",
      refillSupported: false,
      description: "Instant TikTok view delivery for campaign velocity.",
    },
    {
      id: "smm_302",
      externalId: "302",
      name: "TikTok Followers [HQ · 30D Refill]",
      category: "TikTok",
      ratePerThousand: 6.4,
      minQty: 100,
      maxQty: 50000,
      avgTime: "2–4 hours",
      refillSupported: true,
      description: "Steady follower growth with 30-day refill protection.",
    },
    {
      id: "smm_401",
      externalId: "401",
      name: "LinkedIn Company Page Followers [B2B]",
      category: "LinkedIn",
      ratePerThousand: 22.0,
      minQty: 100,
      maxQty: 15000,
      avgTime: "6–12 hours",
      refillSupported: true,
      description: "Professional B2B profile followers for brand authority.",
    },
    {
      id: "smm_402",
      externalId: "402",
      name: "LinkedIn Post Engagement [Likes + Impressions]",
      category: "LinkedIn",
      ratePerThousand: 14.5,
      minQty: 50,
      maxQty: 5000,
      avgTime: "1–2 hours",
      refillSupported: false,
      description: "Boost post reach in LinkedIn feeds with realistic reactions.",
    },
    {
      id: "smm_501",
      externalId: "501",
      name: "X (Twitter) Impressions & Reach Boost",
      category: "Twitter / X",
      ratePerThousand: 1.8,
      minQty: 500,
      maxQty: 250000,
      avgTime: "20 mins",
      refillSupported: false,
      description: "High-volume post impressions for launches and announcements.",
    },
    {
      id: "smm_601",
      externalId: "601",
      name: "Telegram Channel Members [Non-Drop]",
      category: "Telegram",
      ratePerThousand: 4.5,
      minQty: 200,
      maxQty: 100000,
      avgTime: "1–3 hours",
      refillSupported: true,
      description: "Reliable channel members with low drop rate.",
    },
  ],
  smmOrders: [
    {
      id: "SMM-7704",
      serviceId: "smm_201",
      serviceName: "YouTube Views [Organic Retention · Non-Drop]",
      category: "YouTube",
      link: "https://youtube.com/watch?v=dQw4w9WgXcQ",
      quantity: 10000,
      chargeCents: 3200,
      currency: "USD",
      status: "IN_PROGRESS",
      startCount: 1420,
      remains: 3400,
      createdAt: "2026-11-24T10:05:00Z",
      updatedAt: "2026-11-26T12:00:00Z",
    },
    {
      id: "SMM-7701",
      serviceId: "smm_101",
      serviceName: "Instagram Followers [Real / High Retention · 30D Refill]",
      category: "Instagram",
      link: "https://instagram.com/webservicers",
      quantity: 2500,
      chargeCents: 1950,
      currency: "USD",
      status: "COMPLETED",
      startCount: 8150,
      remains: 0,
      createdAt: "2026-11-22T15:40:00Z",
      updatedAt: "2026-11-23T08:15:00Z",
    },
  ],
};

export function computeWalletBalanceCents(movements: PortalBalanceMovement[]): number {
  return movements.reduce((acc, mov) => {
    return mov.type === "CREDIT" ? acc + mov.amountCents : acc - mov.amountCents;
  }, 0);
}

export function usePortalStore() {
  const [state, setState] = useState<PortalState>(INITIAL_PORTAL_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PortalState>;
        setState((prev) => ({
          ...prev,
          ...parsed,
          profile: { ...prev.profile, ...(parsed.profile ?? {}) },
        }));
      }
    } catch {
      // ignore parse/storage errors
    }
    setHydrated(true);
  }, []);

  const updateState = useCallback((updater: (prev: PortalState) => PortalState) => {
    setState((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }, []);

  const addFunds = useCallback(
    (amountCents: number, gatewayName: string, reference?: string) => {
      const ref =
        reference ||
        `DEP-${gatewayName.slice(0, 3).toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)}`;
      const movement: PortalBalanceMovement = {
        id: `mov_${Date.now()}`,
        type: "CREDIT",
        amountCents,
        currency: "USD",
        reference: ref,
        description: `Wallet top-up via ${gatewayName}`,
        gateway: gatewayName,
        createdAt: new Date().toISOString(),
      };
      updateState((prev) => ({
        ...prev,
        movements: [movement, ...prev.movements],
      }));
      return movement;
    },
    [updateState]
  );

  const payInvoice = useCallback(
    (invoiceId: string, gatewayName: string): { ok: boolean; error?: string } => {
      const invoice = state.invoices.find((i) => i.id === invoiceId);
      if (!invoice) return { ok: false, error: "Invoice not found." };
      if (invoice.status === "PAID") return { ok: false, error: "Invoice is already paid." };

      if (gatewayName === "Wallet Balance") {
        const balance = computeWalletBalanceCents(state.movements);
        if (balance < invoice.totalCents) {
          return { ok: false, error: "Insufficient wallet balance for this invoice." };
        }
      }

      const now = new Date().toISOString();
      updateState((prev) => {
        const nextMovements =
          gatewayName === "Wallet Balance"
            ? [
                {
                  id: `mov_${Date.now()}`,
                  type: "DEBIT" as const,
                  amountCents: invoice.totalCents,
                  currency: invoice.currency,
                  reference: invoice.invoiceNumber,
                  description: `Invoice payment (${invoice.invoiceNumber})`,
                  gateway: "Wallet Balance",
                  createdAt: now,
                },
                ...prev.movements,
              ]
            : prev.movements;

        return {
          ...prev,
          movements: nextMovements,
          invoices: prev.invoices.map((inv) =>
            inv.id === invoiceId
              ? { ...inv, status: "PAID", paidAt: now, gatewayUsed: gatewayName }
              : inv
          ),
          orders: prev.orders.map((ord) =>
            ord.id === invoice.orderId && ord.status === "PENDING"
              ? {
                  ...ord,
                  status: "IN_PROGRESS",
                  updatedAt: now,
                  timeline: ord.timeline.map((step, idx) =>
                    idx === 1
                      ? { ...step, completed: true, current: true, timestamp: now, description: "Payment confirmed; brief queued for delivery." }
                      : idx === 0
                      ? { ...step, current: false }
                      : step
                  ),
                }
              : ord
          ),
        };
      });
      return { ok: true };
    },
    [state.invoices, state.movements, updateState]
  );

  const placeServiceOrder = useCallback(
    (input: {
      serviceName: string;
      serviceSlug: string;
      tierName: "Standard" | "Growth" | "Enterprise";
      billingCycle: "MONTHLY" | "QUARTERLY" | "ANNUALLY" | "ONCE";
      totalCents: number;
      brief: Record<string, string>;
      notes: string;
    }) => {
      const now = new Date().toISOString();
      const num = Math.floor(1050 + Math.random() * 8900);
      const orderId = `ord_${num}`;
      const invoiceId = `inv_${num}`;
      const reference = `WS-2026-${num}`;
      const invoiceNumber = `INV-2026-${num}`;

      const newOrder: PortalOrder = {
        id: orderId,
        reference,
        serviceName: input.serviceName,
        serviceSlug: input.serviceSlug,
        tierName: input.tierName,
        billingCycle: input.billingCycle,
        status: "PENDING",
        totalCents: input.totalCents,
        currency: "USD",
        invoiceId,
        createdAt: now,
        updatedAt: now,
        brief: input.brief,
        notes: input.notes,
        deliverables: [],
        timeline: [
          {
            label: "Order Placed",
            description: `Order ${reference} created; awaiting invoice payment.`,
            timestamp: now,
            completed: true,
            current: true,
          },
          {
            label: "Brief Verified",
            description: "Pending payment confirmation.",
            timestamp: null,
            completed: false,
          },
          {
            label: "In Progress",
            description: "Assigned specialist team begins fulfillment.",
            timestamp: null,
            completed: false,
          },
          {
            label: "Completed",
            description: "Final deliverables published to your portal.",
            timestamp: null,
            completed: false,
          },
        ],
      };

      const newInvoice: PortalInvoice = {
        id: invoiceId,
        invoiceNumber,
        orderId,
        orderReference: reference,
        subtotalCents: input.totalCents,
        taxCents: 0,
        discountCents: 0,
        totalCents: input.totalCents,
        currency: "USD",
        status: "UNPAID",
        paidAt: null,
        dueAt: new Date(Date.now() + 7 * 86400000).toISOString(),
        createdAt: now,
        items: [
          {
            id: `ii_${num}`,
            description: `${input.serviceName} — ${input.tierName} Plan (${input.billingCycle})`,
            quantity: 1,
            amountCents: input.totalCents,
          },
        ],
      };

      updateState((prev) => ({
        ...prev,
        orders: [newOrder, ...prev.orders],
        invoices: [newInvoice, ...prev.invoices],
      }));

      return { order: newOrder, invoice: newInvoice };
    },
    [updateState]
  );

  const placeSmmOrder = useCallback(
    (input: { serviceId: string; link: string; quantity: number }): { ok: boolean; order?: PortalSmmOrder; error?: string } => {
      const svc = state.smmServices.find((s) => s.id === input.serviceId);
      if (!svc) return { ok: false, error: "Selected SMM service not found." };
      if (input.quantity < svc.minQty || input.quantity > svc.maxQty) {
        return {
          ok: false,
          error: `Quantity must be between ${svc.minQty.toLocaleString()} and ${svc.maxQty.toLocaleString()}.`,
        };
      }

      const chargeCents = Math.max(1, Math.round((input.quantity / 1000) * svc.ratePerThousand * 100));
      const balance = computeWalletBalanceCents(state.movements);
      if (balance < chargeCents) {
        return { ok: false, error: "Insufficient wallet balance. Please add funds first." };
      }

      const now = new Date().toISOString();
      const orderNum = Math.floor(7710 + Math.random() * 2200);
      const id = `SMM-${orderNum}`;

      const newOrder: PortalSmmOrder = {
        id,
        serviceId: svc.id,
        serviceName: svc.name,
        category: svc.category,
        link: input.link,
        quantity: input.quantity,
        chargeCents,
        currency: "USD",
        status: "PENDING",
        startCount: Math.floor(200 + Math.random() * 4000),
        remains: input.quantity,
        createdAt: now,
        updatedAt: now,
      };

      const movement: PortalBalanceMovement = {
        id: `mov_${Date.now()}`,
        type: "DEBIT",
        amountCents: chargeCents,
        currency: "USD",
        reference: id,
        description: `SMM Order #${orderNum} — ${svc.name} (${input.quantity.toLocaleString()})`,
        createdAt: now,
      };

      updateState((prev) => ({
        ...prev,
        smmOrders: [newOrder, ...prev.smmOrders],
        movements: [movement, ...prev.movements],
      }));

      return { ok: true, order: newOrder };
    },
    [state.movements, state.smmServices, updateState]
  );

  const refreshSmmOrder = useCallback(
    (orderId?: string) => {
      const now = new Date().toISOString();
      updateState((prev) => ({
        ...prev,
        smmOrders: prev.smmOrders.map((ord) => {
          if (orderId && ord.id !== orderId) return ord;
          if (ord.status === "COMPLETED" || ord.status === "CANCELLED" || ord.status === "REFUNDED") {
            return ord;
          }
          if (ord.status === "PENDING") {
            return {
              ...ord,
              status: "IN_PROGRESS",
              remains: Math.max(0, Math.round((ord.remains ?? ord.quantity) * 0.45)),
              updatedAt: now,
            };
          }
          return {
            ...ord,
            status: "COMPLETED",
            remains: 0,
            updatedAt: now,
          };
        }),
      }));
    },
    [updateState]
  );

  const createTicket = useCallback(
    (input: {
      subject: string;
      department: string;
      priority: TicketPriority;
      relatedOrderRef?: string;
      body: string;
    }) => {
      const now = new Date().toISOString();
      const num = Math.floor(310 + Math.random() * 680);
      const newTicket: PortalTicket = {
        id: `tkt_${num}`,
        ticketNumber: `TKT-2026-${num}`,
        subject: input.subject,
        department: input.department,
        status: "OPEN",
        priority: input.priority,
        relatedOrderRef: input.relatedOrderRef || undefined,
        createdAt: now,
        updatedAt: now,
        messages: [
          {
            id: `msg_${Date.now()}`,
            senderType: "USER",
            senderName: state.profile.name,
            body: input.body,
            createdAt: now,
          },
        ],
      };

      updateState((prev) => ({
        ...prev,
        tickets: [newTicket, ...prev.tickets],
      }));
      return newTicket;
    },
    [state.profile.name, updateState]
  );

  const replyToTicket = useCallback(
    (ticketId: string, body: string) => {
      const now = new Date().toISOString();
      updateState((prev) => ({
        ...prev,
        tickets: prev.tickets.map((t) =>
          t.id === ticketId
            ? {
                ...t,
                status: "OPEN",
                updatedAt: now,
                messages: [
                  ...t.messages,
                  {
                    id: `msg_${Date.now()}`,
                    senderType: "USER",
                    senderName: prev.profile.name,
                    body,
                    createdAt: now,
                  },
                ],
              }
            : t
        ),
      }));
    },
    [updateState]
  );

  const updateTicketStatus = useCallback(
    (ticketId: string, status: TicketStatus) => {
      updateState((prev) => ({
        ...prev,
        tickets: prev.tickets.map((t) =>
          t.id === ticketId ? { ...t, status, updatedAt: new Date().toISOString() } : t
        ),
      }));
    },
    [updateState]
  );

  const updateProfile = useCallback(
    (patch: Partial<PortalUserProfile>) => {
      updateState((prev) => ({
        ...prev,
        profile: { ...prev.profile, ...patch },
      }));
    },
    [updateState]
  );

  return {
    state,
    hydrated,
    walletBalanceCents: computeWalletBalanceCents(state.movements),
    addFunds,
    payInvoice,
    placeServiceOrder,
    placeSmmOrder,
    refreshSmmOrder,
    createTicket,
    replyToTicket,
    updateTicketStatus,
    updateProfile,
  };
}
