"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Globe,
  Menu,
  Monitor,
  Moon,
  Search,
  Sparkles,
  Sun,
  User,
} from "lucide-react";

export type ThemeMode = "light" | "dark" | "system";
export type LanguageCode = "EN" | "DE" | "ES" | "FR";
export type CurrencyCode = "USD" | "EUR" | "GBP" | "INR" | "AUD" | "CAD" | "CNY";

const LANGUAGES: LanguageCode[] = ["EN", "DE", "ES", "FR"];
const CURRENCIES: CurrencyCode[] = ["USD", "EUR", "GBP", "INR", "AUD", "CAD", "CNY"];

const ROUTE_TITLES: Record<string, string> = {
  "/admin": "Operations Overview",
  "/admin/orders": "Orders",
  "/admin/fulfillment": "Fulfillment Queue",
  "/admin/incidents": "Incidents",
  "/admin/services": "Services Catalog",
  "/admin/pricing": "Pricing & Plans",
  "/admin/billing": "Invoices & Payments",
  "/admin/coupons": "Coupons & Promos",
  "/admin/wallet": "Wallet & Payouts",
  "/admin/seo": "SEO Overview",
  "/admin/seo/keywords": "Keyword Intelligence",
  "/admin/seo/ai-visibility": "AI Visibility",
  "/admin/seo/audits": "Site Audits",
  "/admin/seo/tools": "Content & AI Tools",
  "/admin/customers": "Customers",
  "/admin/tickets": "Support Tickets",
  "/admin/affiliates": "Affiliates",
  "/admin/announcements": "Announcements",
  "/admin/team": "Team & Roles",
  "/admin/audit-logs": "Audit Logs",
  "/admin/security": "Security & SSO",
  "/admin/api-keys": "API Keys & Webhooks",
  "/admin/settings": "Platform Settings",
  "/admin/automations": "Workflows & Rules",
  "/admin/cron": "Scheduled Jobs",
  "/admin/health": "System Health",
  "/admin/maintenance": "Maintenance",
  "/admin/maintenance/backups": "Backups & Recovery",
  "/admin/maintenance/updates": "System Updates",
  "/admin/profile": "Admin Profile",
};

function resolvePageTitle(pathname: string): string {
  if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname];
  const segments = pathname.split("/").filter(Boolean);
  const last = segments[segments.length - 1] || "Overview";
  return last
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function applyThemeToDocument(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  const resolved =
    mode === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : mode;
  document.documentElement.setAttribute("data-cpki-theme", resolved);
}

export interface AdminTopbarProps {
  onOpenMobileMenu?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenLoon?: () => void;
  pendingOrdersCount?: number;
  inProgressCount?: number;
  language?: LanguageCode;
  onLanguageChange?: (lang: LanguageCode) => void;
  currency?: CurrencyCode;
  onCurrencyChange?: (curr: CurrencyCode) => void;
  theme?: ThemeMode;
  onThemeChange?: (theme: ThemeMode) => void;
}

export function AdminTopbar({
  onOpenMobileMenu,
  onOpenCommandPalette,
  onOpenLoon,
  pendingOrdersCount = 12,
  inProgressCount = 5,
  language: controlledLanguage,
  onLanguageChange,
  currency: controlledCurrency,
  onCurrencyChange,
  theme: controlledTheme,
  onThemeChange,
}: AdminTopbarProps) {
  const pathname = usePathname() || "/admin";
  const pageTitle = resolvePageTitle(pathname);

  const [localLanguage, setLocalLanguage] = useState<LanguageCode>("EN");
  const [localCurrency, setLocalCurrency] = useState<CurrencyCode>("USD");
  const [localTheme, setLocalTheme] = useState<ThemeMode>("light");
  const [openMenu, setOpenMenu] = useState<
    null | "lang" | "currency" | "theme" | "notifications"
  >(null);
  const [unreadCount, setUnreadCount] = useState(3);

  const language = controlledLanguage ?? localLanguage;
  const currency = controlledCurrency ?? localCurrency;
  const theme = controlledTheme ?? localTheme;

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenMenu(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleLanguageSelect = (lang: LanguageCode) => {
    if (onLanguageChange) onLanguageChange(lang);
    else setLocalLanguage(lang);
    setOpenMenu(null);
  };

  const handleCurrencySelect = (curr: CurrencyCode) => {
    if (onCurrencyChange) onCurrencyChange(curr);
    else setLocalCurrency(curr);
    setOpenMenu(null);
  };

  const handleThemeSelect = (mode: ThemeMode) => {
    if (onThemeChange) onThemeChange(mode);
    else {
      setLocalTheme(mode);
      applyThemeToDocument(mode);
    }
    setOpenMenu(null);
  };

  const ThemeIcon = theme === "dark" ? Moon : theme === "system" ? Monitor : Sun;

  return (
    <header ref={containerRef} className="shell-topbar">
      {/* Left: Mobile Menu + Breadcrumb + Status Badges */}
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden cpki-btn cpki-btn-ghost cpki-btn-xs !px-1.5"
          aria-label="Open navigation menu"
        >
          <Menu className="h-4 w-4" />
        </button>

        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[12px] min-w-0">
          <Link
            href="/admin"
            className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] font-medium no-underline shrink-0"
          >
            Admin HQ
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-[var(--muted-foreground)] shrink-0" />
          <span className="font-semibold text-[var(--foreground)] truncate">
            {pageTitle}
          </span>
        </nav>

        <div className="hidden xl:flex items-center gap-1.5 ml-2">
          <Link
            href="/admin/orders"
            className="cpki-badge bg-[var(--warning-subtle)] text-[var(--warning)] no-underline hover:opacity-90"
          >
            {pendingOrdersCount} Orders
          </Link>
          <Link
            href="/admin/fulfillment"
            className="cpki-badge bg-[var(--accent)] text-[var(--primary-text)] no-underline hover:opacity-90"
          >
            <Clock className="h-2.5 w-2.5" />
            {inProgressCount} In Progress
          </Link>
        </div>
      </div>

      {/* Right: Search, Ask Loon, Lang, Currency, Theme, Notifications, Avatar */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Search (⌘K) */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="cpki-btn cpki-btn-outline cpki-btn-xs gap-1.5"
          title="Command Palette (⌘K)"
        >
          <Search className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden md:inline-block rounded bg-[var(--muted)] px-1 py-0.5 text-[9.5px] font-mono text-[var(--muted-foreground)] border border-[var(--border)]">
            ⌘K
          </kbd>
        </button>

        {/* Ask Loon */}
        <button
          type="button"
          onClick={onOpenLoon}
          className="cpki-btn cpki-btn-xs bg-[var(--lilac-subtle)] text-[var(--lilac-foreground)] border border-[var(--border)] hover:brightness-95"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Ask Loon</span>
        </button>

        {/* Language Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenMenu(openMenu === "lang" ? null : "lang")}
            className="cpki-btn cpki-btn-ghost cpki-btn-xs gap-1"
            aria-label="Select language"
            aria-expanded={openMenu === "lang"}
          >
            <Globe className="h-3.5 w-3.5" />
            <span className="hidden md:inline">{language}</span>
            <ChevronDown className="h-3 w-3 opacity-60" />
          </button>
          {openMenu === "lang" && (
            <div className="absolute right-0 mt-1.5 w-28 rounded-[var(--radius-surface)] border border-[var(--border)] bg-[var(--popover)] p-1 shadow-[var(--overlay-shadow)] z-50">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => handleLanguageSelect(lang)}
                  className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-[12px] text-[var(--popover-foreground)] hover:bg-[var(--muted)] cursor-pointer"
                >
                  <span>{lang}</span>
                  {language === lang && <Check className="h-3.5 w-3.5 text-[var(--primary-text)]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Currency Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenMenu(openMenu === "currency" ? null : "currency")}
            className="cpki-btn cpki-btn-ghost cpki-btn-xs gap-1"
            aria-label="Select currency"
            aria-expanded={openMenu === "currency"}
          >
            <span className="font-mono text-[11px]">{currency}</span>
            <ChevronDown className="h-3 w-3 opacity-60" />
          </button>
          {openMenu === "currency" && (
            <div className="absolute right-0 mt-1.5 w-28 rounded-[var(--radius-surface)] border border-[var(--border)] bg-[var(--popover)] p-1 shadow-[var(--overlay-shadow)] z-50">
              {CURRENCIES.map((curr) => (
                <button
                  key={curr}
                  type="button"
                  onClick={() => handleCurrencySelect(curr)}
                  className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-[12px] font-mono text-[var(--popover-foreground)] hover:bg-[var(--muted)] cursor-pointer"
                >
                  <span>{curr}</span>
                  {currency === curr && <Check className="h-3.5 w-3.5 text-[var(--primary-text)]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme Switcher */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenMenu(openMenu === "theme" ? null : "theme")}
            className="cpki-btn cpki-btn-ghost cpki-btn-xs !px-2"
            aria-label="Switch theme"
            aria-expanded={openMenu === "theme"}
          >
            <ThemeIcon className="h-3.5 w-3.5" />
          </button>
          {openMenu === "theme" && (
            <div className="absolute right-0 mt-1.5 w-32 rounded-[var(--radius-surface)] border border-[var(--border)] bg-[var(--popover)] p-1 shadow-[var(--overlay-shadow)] z-50">
              {(
                [
                  { id: "light", label: "Light", icon: Sun },
                  { id: "dark", label: "Dark", icon: Moon },
                  { id: "system", label: "System", icon: Monitor },
                ] as const
              ).map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleThemeSelect(opt.id)}
                    className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-[12px] text-[var(--popover-foreground)] hover:bg-[var(--muted)] cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5" />
                      {opt.label}
                    </span>
                    {theme === opt.id && <Check className="h-3.5 w-3.5 text-[var(--primary-text)]" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() =>
              setOpenMenu(openMenu === "notifications" ? null : "notifications")
            }
            className="relative cpki-btn cpki-btn-ghost cpki-btn-xs !px-2"
            aria-label="Notifications"
            aria-expanded={openMenu === "notifications"}
          >
            <Bell className="h-3.5 w-3.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-[var(--destructive)]" />
            )}
          </button>
          {openMenu === "notifications" && (
            <div className="absolute right-0 mt-1.5 w-72 rounded-[var(--radius-surface)] border border-[var(--border)] bg-[var(--popover)] p-2 shadow-[var(--overlay-shadow)] z-50">
              <div className="flex items-center justify-between px-2 py-1 border-b border-[var(--border)] mb-1">
                <span className="text-[12px] font-semibold text-[var(--foreground)]">
                  Admin Alerts
                </span>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setUnreadCount(0)}
                    className="text-[11px] text-[var(--primary-text)] hover:underline cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="space-y-1 text-[12px]">
                <div className="rounded-md p-2 hover:bg-[var(--muted)]">
                  <div className="font-medium text-[var(--foreground)]">
                    5 fulfillment orders awaiting provider sync
                  </div>
                  <div className="text-[11px] text-[var(--muted-foreground)]">2m ago</div>
                </div>
                <div className="rounded-md p-2 hover:bg-[var(--muted)]">
                  <div className="font-medium text-[var(--foreground)]">
                    Weekly SEO rank crawl completed
                  </div>
                  <div className="text-[11px] text-[var(--muted-foreground)]">18m ago</div>
                </div>
                <div className="rounded-md p-2 hover:bg-[var(--muted)]">
                  <div className="font-medium text-[var(--foreground)]">
                    New enterprise ticket #4821 opened
                  </div>
                  <div className="text-[11px] text-[var(--muted-foreground)]">1h ago</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Admin Avatar */}
        <Link
          href="/admin/profile"
          className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--primary)] text-[11px] font-semibold text-[var(--primary-foreground)] hover:opacity-90 no-underline ml-0.5"
          title="Admin Profile"
        >
          <User className="h-3.5 w-3.5" />
        </Link>
      </div>
    </header>
  );
}

export default AdminTopbar;
