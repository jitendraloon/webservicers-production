"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  ArrowUpCircle,
  ArrowUpRight,
  BarChart3,
  Bell,
  Bot,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Database,
  FileText,
  FolderKanban,
  FolderTree,
  Globe,
  HardDrive,
  HeadphonesIcon,
  KeyRound,
  Layers,
  LayoutDashboard,
  Lock,
  Mail,
  Package,
  PlusCircle,
  Receipt,
  Repeat,
  Search,
  Server,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Tag,
  UserCheck,
  Users,
  Wallet,
  Webhook,
  Workflow,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface NavDomain {
  id: string;
  label: string;
  items: NavItem[];
}

const ADMIN_DOMAINS: NavDomain[] = [
  {
    id: "operate",
    label: "Operate",
    items: [
      { label: "Overview", href: "/admin", icon: LayoutDashboard },
      { label: "Incidents", href: "/admin/incidents", icon: AlertTriangle },
    ],
  },
  {
    id: "orders",
    label: "Orders & Fulfillment",
    items: [
      { label: "Browse Orders", href: "/admin/orders", icon: Package, badge: "12" },
      { label: "Create Order", href: "/admin/orders/create", icon: PlusCircle },
      { label: "Cancellation Requests", href: "/admin/orders/cancellations", icon: AlertTriangle, badge: "Review" },
      { label: "Abandoned Checkout", href: "/admin/orders/abandoned-checkouts", icon: ShoppingCart },
      { label: "Fulfillment Queue", href: "/admin/fulfillment", icon: FolderKanban, badge: "5" },
    ],
  },
  {
    id: "catalog",
    label: "Product Catalog",
    items: [
      { label: "Products", href: "/admin/products", icon: Package },
      { label: "Create Product", href: "/admin/products/new", icon: PlusCircle },
      { label: "Product Categories", href: "/admin/products/categories", icon: FolderTree },
      { label: "Product Requirements", href: "/admin/products/requirements", icon: CheckSquare },
      { label: "Product Add-ons", href: "/admin/products/addons", icon: Sparkles },
      { label: "Services Catalog", href: "/admin/services", icon: Layers },
      { label: "Pricing & Plans", href: "/admin/pricing", icon: Tag },
    ],
  },
  {
    id: "commerce",
    label: "Commerce & Billing",
    items: [
      { label: "Invoices & Payments", href: "/admin/billing", icon: Receipt },
      { label: "Coupons & Promos", href: "/admin/coupons", icon: CreditCard },
      { label: "Wallet & Payouts", href: "/admin/wallet", icon: Wallet },
    ],
  },
  {
    id: "smm",
    label: "SMM Panel Manager",
    items: [
      { label: "Orders Queue", href: "/admin/smm/orders", icon: Package, badge: "Live" },
      { label: "Service Manager", href: "/admin/smm/services", icon: Layers },
      { label: "Categories", href: "/admin/smm/categories", icon: Tag },
      { label: "Providers & APIs", href: "/admin/smm/providers", icon: Server },
      { label: "Import Services", href: "/admin/smm/import", icon: ArrowUpRight },
    ],
  },
  {
    id: "growth-seo",
    label: "Growth & SEO Suite",
    items: [
      { label: "SEO Overview", href: "/admin/seo", icon: BarChart3 },
      { label: "Keyword Intelligence", href: "/admin/seo/keywords", icon: Search },
      { label: "AI Visibility", href: "/admin/seo/ai-visibility", icon: Sparkles },
      { label: "Site Audits", href: "/admin/seo/audits", icon: Globe },
      { label: "Content & AI Tools", href: "/admin/seo/tools", icon: Bot },
    ],
  },
  {
    id: "clients",
    label: "Clients & Support",
    items: [
      { label: "Customer Inbox", href: "/admin/inbox", icon: Mail, badge: "New" },
      { label: "Registered Users", href: "/admin/customers/registered", icon: UserCheck },
      { label: "Customers & Leads", href: "/admin/customers/leads", icon: Users },
      { label: "Support Tickets", href: "/admin/tickets", icon: HeadphonesIcon, badge: "4" },
      { label: "Affiliates & Resellers", href: "/admin/affiliates", icon: Repeat },
      { label: "Announcements", href: "/admin/announcements", icon: Bell },
    ],
  },
  {
    id: "governance",
    label: "Governance & Platform",
    items: [
      { label: "Team & Roles", href: "/admin/team", icon: ShieldCheck },
      { label: "Audit Logs", href: "/admin/audit-logs", icon: FileText },
      { label: "Security & SSO", href: "/admin/security", icon: Lock },
      { label: "API Keys & Webhooks", href: "/admin/api-keys", icon: Webhook },
      { label: "Platform Settings", href: "/admin/settings", icon: Settings },
      { label: "Integration Hub", href: "/admin/integrations", icon: Layers },
    ],
  },
  {
    id: "automation",
    label: "Automation & Maintenance",
    items: [
      { label: "Workflows & Rules", href: "/admin/automations", icon: Workflow },
      { label: "Scheduled Jobs", href: "/admin/cron", icon: KeyRound },
      { label: "System Health", href: "/admin/health", icon: Activity },
      { label: "Backups & Recovery", href: "/admin/maintenance/backups", icon: HardDrive },
      { label: "System Updates", href: "/admin/maintenance/updates", icon: ArrowUpCircle, badge: "OTA" },
    ],
  },
];

export interface AdminSidebarProps {
  mobile?: boolean;
  onNavigate?: () => void;
}

export function AdminSidebar({ mobile = false, onNavigate }: AdminSidebarProps) {
  const pathname = usePathname() || "/admin";

  const isItemActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const [openDomains, setOpenDomains] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const domain of ADMIN_DOMAINS) {
      const hasActive = domain.items.some((item) => isItemActive(item.href));
      initial[domain.id] =
        hasActive || domain.id === "operate" || domain.id === "orders" || domain.id === "catalog";
    }
    return initial;
  });

  useEffect(() => {
    setOpenDomains((prev) => {
      const next = { ...prev };
      for (const domain of ADMIN_DOMAINS) {
        if (domain.items.some((item) => isItemActive(item.href))) {
          next[domain.id] = true;
        }
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const toggleDomain = (id: string) => {
    setOpenDomains((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <aside
      className={
        mobile
          ? "flex h-full w-full flex-col bg-[var(--sidebar)] text-[var(--sidebar-foreground)] p-3"
          : "workspace-rail text-[var(--sidebar-foreground)]"
      }
      aria-label="Admin Navigation"
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between gap-2 px-2 py-1.5 mb-2">
        <Link
          href="/admin"
          onClick={onNavigate}
          className="flex items-center gap-2.5 min-w-0 no-underline text-inherit"
        >
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white shadow-xs"
            style={{ background: "var(--brand-gradient)" }}
          >
            W
          </span>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-[13px] font-semibold text-[var(--foreground)]">
              WebServicers
            </div>
            <div className="flex items-center gap-1.5">
              <span className="cpki-badge-sm bg-[var(--accent)] text-[var(--primary-text)] border border-[var(--border)]">
                Admin HQ
              </span>
            </div>
          </div>
        </Link>
        <span
          className="hidden xl:inline-flex items-center gap-1 text-[10px] font-medium text-[var(--muted-foreground)]"
          title="Production Workspace"
        >
          <Database className="h-3 w-3 text-[var(--success)]" />
          Live
        </span>
      </div>

      {/* 6-Domain Collapsible Navigation */}
      <nav className="flex-1 overflow-y-auto pr-0.5 space-y-1.5">
        {ADMIN_DOMAINS.map((domain) => {
          const isOpen = !!openDomains[domain.id];
          const domainActive = domain.items.some((item) => isItemActive(item.href));

          return (
            <div key={domain.id} className="space-y-0.5">
              <button
                type="button"
                onClick={() => toggleDomain(domain.id)}
                aria-expanded={isOpen}
                className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                  domainActive
                    ? "text-[var(--foreground)]"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                <span className="truncate">{domain.label}</span>
                {isOpen ? (
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-70" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-70" />
                )}
              </button>

              {isOpen && (
                <ul className="space-y-0.5 pl-0.5">
                  {domain.items.map((item) => {
                    const Icon = item.icon;
                    const active = isItemActive(item.href);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={onNavigate}
                          className={`flex items-center justify-between gap-2 rounded-[var(--radius-control)] px-2.5 py-1.5 text-[12.5px] font-medium transition-colors no-underline ${
                            active
                              ? "bg-[var(--sidebar-accent)] text-[var(--sidebar-accent-foreground)] shadow-[var(--shadow-xs)] border border-[var(--border)]"
                              : "text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]/60 hover:text-[var(--foreground)] border border-transparent"
                          }`}
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            <Icon
                              className={`h-3.5 w-3.5 shrink-0 ${
                                active ? "text-[var(--primary-text)]" : "opacity-75"
                              }`}
                            />
                            <span className="truncate">{item.label}</span>
                          </span>
                          {item.badge && (
                            <span className="cpki-badge bg-[var(--accent)] text-[var(--primary-text)]">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom Links */}
      <div className="mt-2 pt-2 border-t border-[var(--sidebar-border)] space-y-1">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex items-center justify-between gap-2 rounded-[var(--radius-control)] px-2.5 py-1.5 text-[12px] font-medium text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--foreground)] transition-colors no-underline"
        >
          <span className="flex items-center gap-2">
            <Globe className="h-3.5 w-3.5 opacity-80" />
            User Dashboard
          </span>
          <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
        </Link>

        <Link
          href="/admin/profile"
          onClick={onNavigate}
          className="flex items-center gap-2.5 rounded-[var(--radius-control)] px-2 py-1.5 hover:bg-[var(--sidebar-accent)] transition-colors no-underline"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-[11px] font-semibold text-[var(--primary-foreground)]">
            AD
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-[12px] font-semibold text-[var(--foreground)]">
              Admin Console
            </div>
            <div className="truncate text-[10.5px] text-[var(--muted-foreground)]">
              ops@webservicers.io
            </div>
          </div>
        </Link>
      </div>
    </aside>
  );
}

export default AdminSidebar;
