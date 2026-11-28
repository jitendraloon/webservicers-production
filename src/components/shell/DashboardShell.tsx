"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle, FolderPlus, LogOut, X } from "lucide-react";
import { DashboardSidebar, type SeoProject } from "./DashboardSidebar";
import { DashboardTopbar } from "./DashboardTopbar";
import type { CurrencyCode, LanguageCode, ThemeMode } from "./AdminTopbar";

const DEFAULT_PROJECTS: SeoProject[] = [
  { id: "proj-1", name: "WebServicers Main", domain: "webservicers.io" },
  { id: "proj-2", name: "Growth Blog", domain: "blog.webservicers.io" },
];

export interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [projects, setProjects] = useState<SeoProject[]>(DEFAULT_PROJECTS);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("proj-1");

  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDomain, setNewProjectDomain] = useState("");
  const [newProjectRegion, setNewProjectRegion] = useState("United States (EN)");

  const [language, setLanguage] = useState<LanguageCode>("EN");
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [theme, setTheme] = useState<ThemeMode>("light");

  // Impersonation state
  const [impersonating, setImpersonating] = useState<{
    customerName: string;
    customerEmail: string;
    impersonatedBy: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/admin/impersonate")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.isImpersonating && data.customer) {
          setImpersonating(data.customer);
        }
      })
      .catch(() => {});
  }, []);

  const handleExitImpersonation = async () => {
    try {
      await fetch("/api/admin/impersonate", { method: "DELETE" });
      window.location.href = "/admin/customers";
    } catch {
      window.location.href = "/admin/customers";
    }
  };

  // Hydrate preferences from localStorage
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem("ws_language") as LanguageCode | null;
      const savedCurr = localStorage.getItem("ws_currency") as CurrencyCode | null;
      const savedTheme = localStorage.getItem("ws_theme") as ThemeMode | null;
      if (savedLang) setLanguage(savedLang);
      if (savedCurr) setCurrency(savedCurr);
      if (savedTheme) setTheme(savedTheme);
    } catch {
      // Ignore storage access errors
    }
  }, []);

  // Sync design and theme attributes to documentElement
  useEffect(() => {
    document.documentElement.setAttribute("data-cpki-design", "workspace");
    return () => {
      document.documentElement.removeAttribute("data-cpki-design");
    };
  }, []);

  // Sync theme to documentElement
  useEffect(() => {
    const apply = () => {
      const resolved =
        theme === "system"
          ? window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light"
          : theme;
      document.documentElement.setAttribute("data-cpki-theme", resolved);
    };
    apply();
    try {
      localStorage.setItem("ws_theme", theme);
    } catch {
      // Ignore storage errors
    }
    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }
  }, [theme]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
        setCreateProjectOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleLanguageChange = (lang: LanguageCode) => {
    setLanguage(lang);
    try {
      localStorage.setItem("ws_language", lang);
    } catch {}
  };

  const handleCurrencyChange = (curr: CurrencyCode) => {
    setCurrency(curr);
    try {
      localStorage.setItem("ws_currency", curr);
    } catch {}
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newProjectName.trim();
    const cleanDomain = newProjectDomain
      .trim()
      .replace(/^https?:\/\//i, "")
      .replace(/\/+$/, "");
    if (!cleanName || !cleanDomain) return;

    const created: SeoProject = {
      id: `proj-${Date.now()}`,
      name: cleanName,
      domain: cleanDomain,
    };
    setProjects((prev) => [...prev, created]);
    setSelectedProjectId(created.id);
    setNewProjectName("");
    setNewProjectDomain("");
    setNewProjectRegion("United States (EN)");
    setCreateProjectOpen(false);
  };

  return (
    <div className="app-shell--workspace">
      <DashboardSidebar
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelectProject={setSelectedProjectId}
        onOpenCreateProject={() => setCreateProjectOpen(true)}
      />

      <DashboardTopbar
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
        onOpenCreateProject={() => setCreateProjectOpen(true)}
        language={language}
        onLanguageChange={handleLanguageChange}
        currency={currency}
        onCurrencyChange={handleCurrencyChange}
        theme={theme}
        onThemeChange={setTheme}
      />

      {/* Impersonation Session Banner */}
      {impersonating && (
        <div className="bg-amber-500 text-amber-950 px-4 py-2 text-xs font-semibold flex items-center justify-between border-b border-amber-600/30 shadow-xs z-30">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-950" />
            <span>
              Impersonation Active: Viewing portal as <strong>{impersonating.customerName}</strong> ({impersonating.customerEmail}) &bull; Authorized by {impersonating.impersonatedBy}
            </span>
          </div>
          <button
            type="button"
            onClick={handleExitImpersonation}
            className="bg-amber-950 text-white hover:bg-black px-3 py-1 rounded text-[11px] font-bold tracking-tight transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <LogOut className="h-3 w-3" />
            Return to Admin
          </button>
        </div>
      )}

      <main className="shell-content-surface">{children}</main>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/45 backdrop-blur-[1px]"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 flex h-full w-72 max-w-[85vw] flex-col bg-[var(--sidebar)] border-r border-[var(--sidebar-border)] shadow-[var(--overlay-shadow)]">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-3 right-3 cpki-btn cpki-btn-ghost cpki-btn-xs !px-1.5"
              aria-label="Close navigation menu"
            >
              <X className="h-4 w-4" />
            </button>
            <DashboardSidebar
              mobile
              projects={projects}
              selectedProjectId={selectedProjectId}
              onSelectProject={setSelectedProjectId}
              onOpenCreateProject={() => {
                setMobileMenuOpen(false);
                setCreateProjectOpen(true);
              }}
              onNavigate={() => setMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Create SEO Project Modal */}
      {createProjectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="fixed inset-0 bg-black/45 backdrop-blur-[2px]"
            onClick={() => setCreateProjectOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-[var(--radius-surface)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--overlay-shadow)] overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent)] text-[var(--primary-text)]">
                  <FolderPlus className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-[13px] font-semibold text-[var(--foreground)]">
                    Create SEO Project
                  </h2>
                  <p className="text-[11px] text-[var(--muted-foreground)]">
                    Track rankings, audits, and AI visibility
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCreateProjectOpen(false)}
                className="cpki-btn cpki-btn-ghost cpki-btn-xs !px-1.5"
                aria-label="Close create project modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="p-4 space-y-3">
              <div>
                <label className="block text-[11.5px] font-medium text-[var(--foreground)] mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. Acme Storefront"
                  className="cpki-input"
                />
              </div>

              <div>
                <label className="block text-[11.5px] font-medium text-[var(--foreground)] mb-1">
                  Domain
                </label>
                <input
                  type="text"
                  required
                  value={newProjectDomain}
                  onChange={(e) => setNewProjectDomain(e.target.value)}
                  placeholder="e.g. acme.com"
                  className="cpki-input"
                />
              </div>

              <div>
                <label className="block text-[11.5px] font-medium text-[var(--foreground)] mb-1">
                  Primary Target Market
                </label>
                <select
                  value={newProjectRegion}
                  onChange={(e) => setNewProjectRegion(e.target.value)}
                  className="cpki-select"
                >
                  <option value="United States (EN)">United States (EN)</option>
                  <option value="United Kingdom (EN)">United Kingdom (EN)</option>
                  <option value="Germany (DE)">Germany (DE)</option>
                  <option value="Spain (ES)">Spain (ES)</option>
                  <option value="France (FR)">France (FR)</option>
                  <option value="India (EN)">India (EN)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setCreateProjectOpen(false)}
                  className="cpki-btn cpki-btn-outline cpki-btn-sm"
                >
                  Cancel
                </button>
                <button type="submit" className="cpki-btn cpki-btn-primary cpki-btn-sm">
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardShell;
