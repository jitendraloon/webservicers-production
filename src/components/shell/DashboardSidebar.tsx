"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  Bot,
  Check,
  ChevronDown,
  ChevronRight,
  CreditCard,
  FileText,
  FolderKanban,
  Globe,
  HeadphonesIcon,
  Layers,
  LayoutDashboard,
  Link2,
  ListOrdered,
  MessageSquareText,
  Plus,
  Receipt,
  Search,
  Settings,
  Share2,
  ShoppingBag,
  Sparkles,
  Tag,
  TrendingUp,
  Users,
  Wallet,
  Wand2,
} from "lucide-react";

export interface SeoProject {
  id: string;
  name: string;
  domain: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SeoGroup {
  label: string;
  items: NavItem[];
}

const ACCOUNT_LINKS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Plans & pricing", href: "/dashboard/pricing", icon: Tag },
  { label: "Sub-Accounts", href: "/dashboard/sub-accounts", icon: Users },
  { label: "Affiliate & Reseller", href: "/dashboard/affiliate", icon: Share2 },
];

const SMM_LINKS: NavItem[] = [
  { label: "New order", href: "/dashboard/smm/new", icon: Plus },
  { label: "Orders", href: "/dashboard/smm/orders", icon: ListOrdered },
  { label: "Services", href: "/dashboard/smm/services", icon: Layers },
];

const SEO_GROUPS: SeoGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "SEO Overview", href: "/dashboard/seo", icon: BarChart3 },
      { label: "Site Health", href: "/dashboard/seo/health", icon: Activity },
      { label: "Rank Tracker", href: "/dashboard/seo/ranks", icon: TrendingUp },
    ],
  },
  {
    label: "Research",
    items: [
      { label: "Keyword Explorer", href: "/dashboard/seo/keywords", icon: Search },
      { label: "SERP Analyzer", href: "/dashboard/seo/serp", icon: Globe },
      { label: "Competitor Gap", href: "/dashboard/seo/competitors", icon: FolderKanban },
      { label: "Backlink Profile", href: "/dashboard/seo/backlinks", icon: Link2 },
    ],
  },
  {
    label: "AI Visibility",
    items: [
      { label: "LLM Mentions", href: "/dashboard/seo/ai-visibility", icon: Sparkles },
      { label: "Citation Share", href: "/dashboard/seo/citations", icon: MessageSquareText },
      { label: "Prompt Monitor", href: "/dashboard/seo/prompts", icon: Bot },
    ],
  },
  {
    label: "My Site",
    items: [
      { label: "Technical Audit", href: "/dashboard/seo/audit", icon: Activity },
      { label: "On-Page Grader", href: "/dashboard/seo/on-page", icon: FileText },
      { label: "Schema & Meta", href: "/dashboard/seo/schema", icon: Layers },
    ],
  },
  {
    label: "AI Tools",
    items: [
      { label: "AI Content Writer", href: "/dashboard/seo/writer", icon: Wand2 },
      { label: "Brief Generator", href: "/dashboard/seo/briefs", icon: FileText },
      { label: "Meta & FAQ Studio", href: "/dashboard/seo/meta-studio", icon: Sparkles },
    ],
  },
];

const BILLING_LINKS: NavItem[] = [
  { label: "All Orders", href: "/dashboard/orders", icon: ShoppingBag },
  { label: "Invoices", href: "/dashboard/invoices", icon: Receipt },
  { label: "Add Funds", href: "/dashboard/add-funds", icon: CreditCard },
];

const WEBSITE_LINKS: NavItem[] = [
  { label: "Site Settings", href: "/dashboard/website", icon: Settings },
  { label: "Integrations", href: "/dashboard/integrations", icon: Link2 },
  { label: "Support", href: "/dashboard/support", icon: HeadphonesIcon },
];

export interface DashboardSidebarProps {
  mobile?: boolean;
  onNavigate?: () => void;
  projects?: SeoProject[];
  selectedProjectId?: string;
  onSelectProject?: (id: string) => void;
  onOpenCreateProject?: () => void;
  balance?: string;
}

export function DashboardSidebar({
  mobile = false,
  onNavigate,
  projects = [
    { id: "proj-1", name: "WebServicers Main", domain: "webservicers.io" },
    { id: "proj-2", name: "Growth Blog", domain: "blog.webservicers.io" },
  ],
  selectedProjectId = "proj-1",
  onSelectProject,
  onOpenCreateProject,
  balance = "$248.50",
}: DashboardSidebarProps) {
  const pathname = usePathname() || "/dashboard";
  const [projectPickerOpen, setProjectPickerOpen] = useState(false);
  const [smmOpen, setSmmOpen] = useState(() => pathname.startsWith("/dashboard/smm"));
  const [seoOpen, setSeoOpen] = useState(() => pathname.startsWith("/dashboard/seo"));
  const pickerRef = useRef<HTMLDivElement>(null);

  const selectedProject =
    projects.find((p) => p.id === selectedProjectId) ?? projects[0];

  useEffect(() => {
    if (pathname.startsWith("/dashboard/smm")) setSmmOpen(true);
    if (pathname.startsWith("/dashboard/seo")) setSeoOpen(true);
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setProjectPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isItemActive = (href: string) => {
    if (href === "/dashboard" || href === "/dashboard/seo") {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const renderLink = (item: NavItem) => {
    const Icon = item.icon;
    const active = isItemActive(item.href);
    return (
      <li key={item.href}>
        <Link
          href={item.href}
          onClick={onNavigate}
          className={`flex items-center gap-2 rounded-[var(--radius-control)] px-2.5 py-1.5 text-[12.5px] font-medium transition-colors no-underline ${
            active
              ? "bg-[var(--sidebar-accent)] text-[var(--sidebar-accent-foreground)] shadow-[var(--shadow-xs)] border border-[var(--border)]"
              : "text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]/60 hover:text-[var(--foreground)] border border-transparent"
          }`}
        >
          <Icon
            className={`h-3.5 w-3.5 shrink-0 ${
              active ? "text-[var(--primary-text)]" : "opacity-75"
            }`}
          />
          <span className="truncate">{item.label}</span>
        </Link>
      </li>
    );
  };

  return (
    <aside
      className={
        mobile
          ? "flex h-full w-full flex-col bg-[var(--sidebar)] text-[var(--sidebar-foreground)] p-3"
          : "workspace-rail text-[var(--sidebar-foreground)]"
      }
      aria-label="Customer Portal Navigation"
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between gap-2 px-2 py-1.5 mb-2">
        <Link
          href="/dashboard"
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
            <span className="cpki-badge-sm bg-[var(--accent)] text-[var(--primary-text)] border border-[var(--border)]">
              Customer Portal
            </span>
          </div>
        </Link>
      </div>

      {/* SEO Project Picker Dropdown */}
      <div ref={pickerRef} className="relative px-1 mb-2.5">
        <button
          type="button"
          onClick={() => setProjectPickerOpen((prev) => !prev)}
          aria-expanded={projectPickerOpen}
          className="flex w-full items-center justify-between gap-2 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--card)] px-2.5 py-1.5 text-left shadow-[var(--shadow-xs)] hover:bg-[var(--muted)] transition-colors cursor-pointer"
        >
          <div className="min-w-0">
            <div className="truncate text-[12px] font-semibold text-[var(--foreground)]">
              {selectedProject?.name ?? "Select Project"}
            </div>
            <div className="truncate text-[10.5px] text-[var(--muted-foreground)]">
              {selectedProject?.domain ?? "No domain"}
            </div>
          </div>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[var(--muted-foreground)]" />
        </button>

        {projectPickerOpen && (
          <div className="absolute left-1 right-1 mt-1 rounded-[var(--radius-surface)] border border-[var(--border)] bg-[var(--popover)] p-1 shadow-[var(--overlay-shadow)] z-40">
            {projects.map((proj) => (
              <button
                key={proj.id}
                type="button"
                onClick={() => {
                  onSelectProject?.(proj.id);
                  setProjectPickerOpen(false);
                }}
                className="flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left hover:bg-[var(--muted)] cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="truncate text-[12px] font-medium text-[var(--popover-foreground)]">
                    {proj.name}
                  </div>
                  <div className="truncate text-[10.5px] text-[var(--muted-foreground)]">
                    {proj.domain}
                  </div>
                </div>
                {proj.id === selectedProject?.id && (
                  <Check className="h-3.5 w-3.5 shrink-0 text-[var(--primary-text)]" />
                )}
              </button>
            ))}
            {onOpenCreateProject && (
              <button
                type="button"
                onClick={() => {
                  setProjectPickerOpen(false);
                  onOpenCreateProject();
                }}
                className="mt-1 flex w-full items-center gap-1.5 border-t border-[var(--border)] px-2.5 py-1.5 text-[12px] font-medium text-[var(--primary-text)] hover:bg-[var(--muted)] cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                New SEO project
              </button>
            )}
          </div>
        )}
      </div>

      {/* Scrollable Navigation */}
      <nav className="flex-1 overflow-y-auto pr-0.5 space-y-3">
        {/* Account */}
        <div className="space-y-0.5">
          <div className="px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            Account
          </div>
          <ul className="space-y-0.5">{ACCOUNT_LINKS.map(renderLink)}</ul>
        </div>

        {/* SMM Services Accordion */}
        <div className="space-y-0.5">
          <button
            type="button"
            onClick={() => setSmmOpen((prev) => !prev)}
            aria-expanded={smmOpen}
            className="flex w-full items-center justify-between px-2 py-1 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer"
          >
            <span>SMM Services</span>
            {smmOpen ? (
              <ChevronDown className="h-3.5 w-3.5 opacity-70" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 opacity-70" />
            )}
          </button>
          {smmOpen && <ul className="space-y-0.5">{SMM_LINKS.map(renderLink)}</ul>}
        </div>

        {/* SEO Suite Accordion (16 Workspace Links) */}
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => setSeoOpen((prev) => !prev)}
            aria-expanded={seoOpen}
            className="flex w-full items-center justify-between px-2 py-1 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer"
          >
            <span>SEO Suite</span>
            {seoOpen ? (
              <ChevronDown className="h-3.5 w-3.5 opacity-70" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 opacity-70" />
            )}
          </button>
          {seoOpen && (
            <div className="space-y-2 pl-1">
              {SEO_GROUPS.map((group) => (
                <div key={group.label} className="space-y-0.5">
                  <div className="px-2 text-[10px] font-medium text-[var(--muted-foreground)]">
                    {group.label}
                  </div>
                  <ul className="space-y-0.5">{group.items.map(renderLink)}</ul>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Orders & Billing */}
        <div className="space-y-0.5">
          <div className="px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            Orders & Billing
          </div>
          <ul className="space-y-0.5">{BILLING_LINKS.map(renderLink)}</ul>
        </div>

        {/* Website */}
        <div className="space-y-0.5">
          <div className="px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            Website
          </div>
          <ul className="space-y-0.5">{WEBSITE_LINKS.map(renderLink)}</ul>
        </div>
      </nav>

      {/* Bottom Balance & Profile */}
      <div className="mt-2 pt-2 border-t border-[var(--sidebar-border)] space-y-1.5">
        <Link
          href="/dashboard/add-funds"
          onClick={onNavigate}
          className="flex items-center justify-between rounded-[var(--radius-control)] bg-[var(--card)] border border-[var(--border)] px-2.5 py-1.5 text-[12px] no-underline hover:bg-[var(--muted)] transition-colors"
        >
          <span className="flex items-center gap-1.5 text-[var(--muted-foreground)] font-medium">
            <Wallet className="h-3.5 w-3.5 text-[var(--primary-text)]" />
            Balance
          </span>
          <span className="font-mono font-semibold text-[var(--foreground)] tabular-nums">
            {balance}
          </span>
        </Link>

        <Link
          href="/dashboard/profile"
          onClick={onNavigate}
          className="flex items-center gap-2.5 rounded-[var(--radius-control)] px-2 py-1.5 hover:bg-[var(--sidebar-accent)] transition-colors no-underline"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-[11px] font-semibold text-[var(--primary-foreground)]">
            JD
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-[12px] font-semibold text-[var(--foreground)]">
              Jordan Davis
            </div>
            <div className="truncate text-[10.5px] text-[var(--muted-foreground)]">
              Growth Plan
            </div>
          </div>
        </Link>
      </div>
    </aside>
  );
}

export default DashboardSidebar;
