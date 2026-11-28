"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Check,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Globe,
  HeadphonesIcon,
  LogOut,
  Menu,
  Monitor,
  Moon,
  Plus,
  Sun,
  User,
} from "lucide-react";
import type { CurrencyCode, LanguageCode, ThemeMode } from "./AdminTopbar";

const LANGUAGES: LanguageCode[] = ["EN", "DE", "ES", "FR"];
const CURRENCIES: CurrencyCode[] = ["USD", "EUR", "GBP", "INR", "AUD", "CAD", "CNY"];

const DASHBOARD_ROUTE_TITLES: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/pricing": "Plans & Pricing",
  "/dashboard/smm/new": "New SMM Order",
  "/dashboard/smm/orders": "SMM Orders",
  "/dashboard/smm/services": "SMM Services",
  "/dashboard/seo": "SEO Overview",
  "/dashboard/seo/health": "Site Health",
  "/dashboard/seo/ranks": "Rank Tracker",
  "/dashboard/seo/keywords": "Keyword Explorer",
  "/dashboard/seo/serp": "SERP Analyzer",
  "/dashboard/seo/competitors": "Competitor Gap",
  "/dashboard/seo/backlinks": "Backlink Profile",
  "/dashboard/seo/ai-visibility": "LLM Mentions",
  "/dashboard/seo/citations": "Citation Share",
  "/dashboard/seo/prompts": "Prompt Monitor",
  "/dashboard/seo/audit": "Technical Audit",
  "/dashboard/seo/on-page": "On-Page Grader",
  "/dashboard/seo/schema": "Schema & Meta",
  "/dashboard/seo/writer": "AI Content Writer",
  "/dashboard/seo/briefs": "Brief Generator",
  "/dashboard/seo/meta-studio": "Meta & FAQ Studio",
  "/dashboard/orders": "All Orders",
  "/dashboard/invoices": "Invoices",
  "/dashboard/add-funds": "Add Funds",
  "/dashboard/billing": "Invoices",
  "/dashboard/website": "Site Settings",
  "/dashboard/integrations": "Integrations",
  "/dashboard/support": "Support",
  "/dashboard/profile": "Account Profile",
};

function resolveDashboardTitle(pathname: string): string {
  if (DASHBOARD_ROUTE_TITLES[pathname]) return DASHBOARD_ROUTE_TITLES[pathname];
  const segments = pathname.split("/").filter(Boolean);
  const last = segments[segments.length - 1] || "Overview";
  return last
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
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

export interface DashboardTopbarProps {
  onOpenMobileMenu?: () => void;
  onOpenCreateProject?: () => void;
  language?: LanguageCode;
  onLanguageChange?: (lang: LanguageCode) => void;
  currency?: CurrencyCode;
  onCurrencyChange?: (curr: CurrencyCode) => void;
  theme?: ThemeMode;
  onThemeChange?: (theme: ThemeMode) => void;
  onSignOut?: () => void;
}

export function DashboardTopbar({
  onOpenMobileMenu,
  onOpenCreateProject,
  language: controlledLanguage,
  onLanguageChange,
  currency: controlledCurrency,
  onCurrencyChange,
  theme: controlledTheme,
  onThemeChange,
  onSignOut,
}: DashboardTopbarProps) {
  const pathname = usePathname() || "/dashboard";
  const router = useRouter();
  const isSeoRoute = pathname.startsWith("/dashboard/seo");
  const pageTitle = resolveDashboardTitle(pathname);

  const [localLanguage, setLocalLanguage] = useState<LanguageCode>("EN");
  const [localCurrency, setLocalCurrency] = useState<CurrencyCode>("USD");
  const [localTheme, setLocalTheme] = useState<ThemeMode>("light");
  const [openMenu, setOpenMenu] = useState<
    null | "lang" | "currency" | "theme" | "notifications" | "account"
  >(null);
  const [unreadCount, setUnreadCount] = useState(2);

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

  const handleSignOut = () => {
    setOpenMenu(null);
    if (onSignOut) {
      onSignOut();
      return;
    }
    router.push("/");
  };

  const ThemeIcon = theme === "dark" ? Moon : theme === "system" ? Monitor : Sun;

  return (
    <header ref={containerRef} className="shell-topbar">
      {/* Left: Mobile Menu + Breadcrumb */}
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
            href="/dashboard"
            className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] font-medium no-underline shrink-0"
          >
            Dashboard
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-[var(--muted-foreground)] shrink-0" />
          <span className="font-semibold text-[var(--foreground)] truncate">
            {pageTitle}
          </span>
        </nav>
      </div>

      {/* Right: New Project (SEO routes), Talk to support, Lang, Currency, Theme, Notifications, Account */}
      <div className="flex items-center gap-1.5 shrink-0">
        {isSeoRoute && (
          <button
            type="button"
            onClick={onOpenCreateProject}
            className="cpki-btn cpki-btn-primary cpki-btn-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New project</span>
          </button>
        )}

        <Link
          href="/dashboard/support"
          className="cpki-btn cpki-btn-outline cpki-btn-xs no-underline"
        >
          <HeadphonesIcon className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
          <span className="hidden md:inline">Talk to support</span>
        </Link>

        {/* Language */}
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

        {/* Currency */}
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

        {/* Notifications */}
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
                  Notifications
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
                    SMM Order #1042 completed
                  </div>
                  <div className="text-[11px] text-[var(--muted-foreground)]">5m ago</div>
                </div>
                <div className="rounded-md p-2 hover:bg-[var(--muted)]">
                  <div className="font-medium text-[var(--foreground)]">
                    Site audit finished: 94/100 score
                  </div>
                  <div className="text-[11px] text-[var(--muted-foreground)]">1h ago</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Account Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenMenu(openMenu === "account" ? null : "account")}
            className="flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--card)] pl-1 pr-2 py-0.5 hover:bg-[var(--muted)] transition-colors cursor-pointer"
            aria-label="Account menu"
            aria-expanded={openMenu === "account"}
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--primary)] text-[10px] font-semibold text-[var(--primary-foreground)]">
              JD
            </span>
            <ChevronDown className="h-3 w-3 text-[var(--muted-foreground)]" />
          </button>
          {openMenu === "account" && (
            <div className="absolute right-0 mt-1.5 w-48 rounded-[var(--radius-surface)] border border-[var(--border)] bg-[var(--popover)] p-1 shadow-[var(--overlay-shadow)] z-50">
              <div className="px-2.5 py-1.5 border-b border-[var(--border)] mb-1">
                <div className="text-[12px] font-semibold text-[var(--foreground)]">
                  Jordan Davis
                </div>
                <div className="text-[11px] text-[var(--muted-foreground)] truncate">
                  jordan@example.com
                </div>
              </div>
              <Link
                href="/dashboard/profile"
                onClick={() => setOpenMenu(null)}
                className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[12px] text-[var(--popover-foreground)] hover:bg-[var(--muted)] no-underline"
              >
                <User className="h-3.5 w-3.5" />
                Profile & Settings
              </Link>
              <Link
                href="/dashboard/add-funds"
                onClick={() => setOpenMenu(null)}
                className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[12px] text-[var(--popover-foreground)] hover:bg-[var(--muted)] no-underline"
              >
                <CreditCard className="h-3.5 w-3.5" />
                Add Funds & Wallet
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="mt-1 flex w-full items-center gap-2 rounded-md border-t border-[var(--border)] px-2.5 py-1.5 text-[12px] text-[var(--destructive)] hover:bg-[var(--danger-subtle)] cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default DashboardTopbar;
