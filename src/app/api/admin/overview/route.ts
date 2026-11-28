import { NextResponse } from "next/server";
import { getAdminStore } from "@/server/admin-store";

export async function GET() {
  const store = getAdminStore();

  const collectedRevenueCents = store.invoices
    .filter((inv) => inv.status === "PAID")
    .reduce((sum, inv) => sum + inv.totalCents, 0);

  const openReceivablesCents = store.invoices
    .filter((inv) => inv.status === "UNPAID" || inv.status === "OVERDUE")
    .reduce((sum, inv) => sum + inv.totalCents, 0);

  const activeWorkspaces = store.customers.reduce((sum, c) => sum + c.workspaceCount, 0);

  const awaitingBriefCount = store.orders.filter((o) => o.status === "AWAITING_BRIEF").length;
  const inReviewCount = store.orders.filter((o) => o.status === "IN_REVIEW").length;
  const overdueInvoicesCount = store.invoices.filter((i) => i.status === "OVERDUE").length;
  const openAbandonedCount = store.abandonedCheckouts.filter((a) => a.status === "OPEN").length;
  const pendingTransfersCount = store.serviceTransfers.filter((t) => t.status === "PENDING").length;

  return NextResponse.json({
    ok: true,
    kpis: {
      collectedRevenueCents,
      openReceivablesCents,
      smmOrdersCount: store.smmOrders.length,
      agencyWorkspaces: activeWorkspaces,
    },
    focusQueues: [
      {
        id: "briefs",
        title: "Orders Awaiting Brief",
        count: awaitingBriefCount,
        tone: "warning",
        href: "/admin/orders?status=AWAITING_BRIEF",
        description: "Client onboarding briefs needed to start fulfillment.",
      },
      {
        id: "review",
        title: "Fulfillment In Review",
        count: inReviewCount,
        tone: "primary",
        href: "/admin/orders?status=IN_REVIEW",
        description: "Deliverables staged for QA sign-off.",
      },
      {
        id: "overdue",
        title: "Overdue Receivables",
        count: overdueInvoicesCount,
        tone: "danger",
        href: "/admin/billing/invoices?status=OVERDUE",
        description: "Invoices past due requiring follow-up or dunning.",
      },
      {
        id: "abandoned",
        title: "Abandoned Checkouts",
        count: openAbandonedCount,
        tone: "lilac",
        href: "/admin/orders/abandoned-checkouts",
        description: "High-intent checkouts ready for recovery email.",
      },
      {
        id: "transfers",
        title: "Pending Service Transfers",
        count: pendingTransfersCount,
        tone: "neutral",
        href: "/admin/services/transfers",
        description: "Workspace ownership transfer requests.",
      },
    ],
    health: {
      overallStatus: "OPERATIONAL",
      seoQuotaUsedPct: 62,
      seoApiLatencyMs: 142,
      activeGateways: store.gateways.filter((g) => g.enabled).length,
      totalGateways: store.gateways.length,
      smmProvidersOnline: 3,
      smmProvidersTotal: 3,
    },
    recentOrders: store.orders.slice(0, 5),
    recentSmmOrders: store.smmOrders.slice(0, 5),
  });
}
