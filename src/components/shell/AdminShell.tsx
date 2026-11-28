"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bot,
  Search,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { AdminSidebar } from "./AdminSidebar";
import {
  AdminTopbar,
  type CurrencyCode,
  type LanguageCode,
  type ThemeMode,
} from "./AdminTopbar";

interface CommandEntry {
  id: string;
  label: string;
  group: string;
  href?: string;
  action?: () => void;
}

interface LoonMessage {
  id: string;
  role: "assistant" | "user";
  text: string;
}

const ADMIN_COMMANDS: Omit<CommandEntry, "action">[] = [
  { id: "overview", label: "Operations Overview", group: "Operate", href: "/admin" },
  { id: "orders", label: "Orders Queue", group: "Operate", href: "/admin/orders" },
  { id: "fulfillment", label: "Fulfillment Queue", group: "Operate", href: "/admin/fulfillment" },
  { id: "services", label: "Services Catalog", group: "Commerce", href: "/admin/services" },
  { id: "billing", label: "Invoices & Payments", group: "Commerce", href: "/admin/billing" },
  { id: "seo", label: "SEO Overview", group: "Growth & SEO", href: "/admin/seo" },
  { id: "keywords", label: "Keyword Intelligence", group: "Growth & SEO", href: "/admin/seo/keywords" },
  { id: "customers", label: "Customers", group: "Clients", href: "/admin/customers" },
  { id: "tickets", label: "Support Tickets", group: "Clients", href: "/admin/tickets" },
  { id: "smm-orders", label: "SMM Orders Queue", group: "SMM Manager", href: "/admin/smm/orders" },
  { id: "smm-services", label: "SMM Service Manager", group: "SMM Manager", href: "/admin/smm/services" },
  { id: "smm-categories", label: "SMM Categories", group: "SMM Manager", href: "/admin/smm/categories" },
  { id: "smm-providers", label: "SMM Providers & APIs", group: "SMM Manager", href: "/admin/smm/providers" },
  { id: "smm-import", label: "SMM Import Services & Pricing", group: "SMM Manager", href: "/admin/smm/import" },
  { id: "integrations", label: "Integration Hub", group: "Governance", href: "/admin/integrations" },
  { id: "settings", label: "Platform Settings", group: "Governance", href: "/admin/settings" },
  { id: "health", label: "System Health", group: "Automation", href: "/admin/health" },
  { id: "portal", label: "Switch to User Dashboard", group: "Navigation", href: "/dashboard" },
];

export interface AdminShellProps {
  children: React.ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [loonOpen, setLoonOpen] = useState(false);
  const [loonInput, setLoonInput] = useState("");
  const [loonMessages, setLoonMessages] = useState<LoonMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hi, I'm Loon — your WebServicers operations copilot. Ask me about order queues, provider health, SEO crawls, or revenue anomalies.",
    },
  ]);

  const [language, setLanguage] = useState<LanguageCode>("EN");
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [theme, setTheme] = useState<ThemeMode>("light");

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

  // Global Cmd/Ctrl+K shortcut & Escape handling
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setCommandOpen(false);
        setLoonOpen(false);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const filteredCommands = useMemo(() => {
    const q = commandQuery.trim().toLowerCase();
    const list: CommandEntry[] = [
      ...ADMIN_COMMANDS,
      {
        id: "open-loon",
        label: "Open Loon AI Copilot",
        group: "Actions",
        action: () => {
          setCommandOpen(false);
          setLoonOpen(true);
        },
      },
      {
        id: "toggle-theme",
        label: `Switch Theme (Current: ${theme})`,
        group: "Actions",
        action: () => {
          setTheme((prev) => (prev === "light" ? "dark" : "light"));
          setCommandOpen(false);
        },
      },
    ];
    if (!q) return list;
    return list.filter(
      (c) =>
        c.label.toLowerCase().includes(q) || c.group.toLowerCase().includes(q)
    );
  }, [commandQuery, theme]);

  const runCommand = (entry: CommandEntry) => {
    if (entry.action) {
      entry.action();
      return;
    }
    if (entry.href) {
      setCommandOpen(false);
      setCommandQuery("");
      router.push(entry.href);
    }
  };

  const sendLoonPrompt = (promptText: string) => {
    const trimmed = promptText.trim();
    if (!trimmed) return;
    const userMsg: LoonMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text: trimmed,
    };
    const replyMsg: LoonMessage = {
      id: `a-${Date.now() + 1}`,
      role: "assistant",
      text: `Checked current workspace telemetry for "${trimmed}": 12 orders pending, 5 in-progress fulfillment jobs running within SLA, and all primary providers healthy.`,
    };
    setLoonMessages((prev) => [...prev, userMsg, replyMsg]);
    setLoonInput("");
  };

  return (
    <div className="app-shell--workspace">
      <AdminSidebar />

      <AdminTopbar
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
        onOpenCommandPalette={() => setCommandOpen(true)}
        onOpenLoon={() => setLoonOpen(true)}
        language={language}
        onLanguageChange={handleLanguageChange}
        currency={currency}
        onCurrencyChange={handleCurrencyChange}
        theme={theme}
        onThemeChange={setTheme}
      />

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
            <AdminSidebar mobile onNavigate={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Command Palette (⌘K) Modal */}
      {commandOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4">
          <div
            className="fixed inset-0 bg-black/45 backdrop-blur-[2px]"
            onClick={() => setCommandOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-[var(--radius-surface)] border border-[var(--border)] bg-[var(--popover)] shadow-[var(--overlay-shadow)] overflow-hidden">
            <div className="flex items-center gap-2 border-b border-[var(--border)] px-3.5 py-2.5">
              <Search className="h-4 w-4 text-[var(--muted-foreground)] shrink-0" />
              <input
                type="text"
                autoFocus
                value={commandQuery}
                onChange={(e) => setCommandQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && filteredCommands[0]) {
                    runCommand(filteredCommands[0]);
                  }
                }}
                placeholder="Jump to admin page or run action..."
                className="w-full bg-transparent text-[13px] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none"
              />
              <button
                type="button"
                onClick={() => setCommandOpen(false)}
                className="cpki-btn cpki-btn-ghost cpki-btn-xs !px-1.5"
                aria-label="Close command palette"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto p-1.5 space-y-0.5">
              {filteredCommands.length === 0 ? (
                <div className="px-3 py-6 text-center text-[12px] text-[var(--muted-foreground)]">
                  No matching commands found.
                </div>
              ) : (
                filteredCommands.map((cmd) => (
                  <button
                    key={cmd.id}
                    type="button"
                    onClick={() => runCommand(cmd)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[12.5px] text-[var(--popover-foreground)] hover:bg-[var(--muted)] cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <ArrowRight className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                      <span className="font-medium">{cmd.label}</span>
                    </span>
                    <span className="cpki-badge-sm bg-[var(--secondary)] text-[var(--muted-foreground)]">
                      {cmd.group}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Loon AI Copilot Modal */}
      {loonOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="fixed inset-0 bg-black/45 backdrop-blur-[2px]"
            onClick={() => setLoonOpen(false)}
          />
          <div className="relative z-10 flex w-full max-w-xl flex-col rounded-[var(--radius-surface)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--overlay-shadow)] overflow-hidden max-h-[82vh]">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3 bg-[var(--lilac-subtle)]">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)]">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-[13px] font-semibold text-[var(--foreground)]">
                    Loon AI Copilot
                  </h2>
                  <p className="text-[11px] text-[var(--muted-foreground)]">
                    Operations & Growth Assistant
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLoonOpen(false)}
                className="cpki-btn cpki-btn-ghost cpki-btn-xs !px-1.5"
                aria-label="Close Loon AI Copilot"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loonMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--primary-text)] mt-0.5">
                      <Bot className="h-3.5 w-3.5" />
                    </span>
                  )}
                  <div
                    className={`max-w-[82%] rounded-xl px-3 py-2 text-[12.5px] leading-relaxed ${
                      msg.role === "user"
                        ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                        : "bg-[var(--muted)] text-[var(--foreground)] border border-[var(--border)]"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-[var(--border)] px-4 py-2.5 space-y-2 bg-[var(--background)]">
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Summarize pending orders",
                  "Check provider SLA",
                  "Review SEO audit alerts",
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => sendLoonPrompt(chip)}
                    className="cpki-btn cpki-btn-quiet cpki-btn-xs"
                  >
                    {chip}
                  </button>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendLoonPrompt(loonInput);
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={loonInput}
                  onChange={(e) => setLoonInput(e.target.value)}
                  placeholder="Ask Loon anything about orders, SEO, or billing..."
                  className="cpki-input"
                />
                <button type="submit" className="cpki-btn cpki-btn-primary cpki-btn-sm">
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminShell;
