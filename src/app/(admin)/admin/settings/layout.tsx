'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, ChevronRight } from 'lucide-react';
import { SETTINGS_SECTIONS } from './settings-sections';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      {/* Settings Top Bar */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-3 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <Settings className="w-4 h-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-[var(--foreground)]">Platform Settings</h2>
            <p className="text-[11px] text-[var(--muted-foreground)]">
              11 Standalone configuration engines applying directly to the live application.
            </p>
          </div>
        </div>

        <Link
          href="/admin/settings"
          className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
        >
          <span>Overview Hub</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-4 bg-[var(--card)] border border-[var(--border)] rounded-xl p-2.5 space-y-1 shadow-sm sticky top-4">
          <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)] border-b border-[var(--border)] mb-1">
            Configuration Sections
          </div>
          {SETTINGS_SECTIONS.map((sec) => {
            const active = pathname === sec.href || pathname.startsWith(`${sec.href}/`);
            const Icon = sec.icon;
            return (
              <Link
                key={sec.id}
                href={sec.href}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  active
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className={`w-5 h-5 rounded flex items-center justify-center font-mono text-[10px] font-bold ${
                    active ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
                  }`}>
                    {sec.num}
                  </span>
                  <div className="truncate">
                    <div className="font-semibold truncate">{sec.title}</div>
                    <div className={`text-[10px] truncate ${active ? 'text-primary-foreground/80' : 'text-[var(--muted-foreground)]'}`}>
                      {sec.desc}
                    </div>
                  </div>
                </div>
                <Icon className={`w-4 h-4 shrink-0 ml-2 ${active ? 'text-primary-foreground' : 'text-[var(--muted-foreground)]'}`} />
              </Link>
            );
          })}
        </div>

        {/* Standalone Page Content */}
        <div className="lg:col-span-8">
          {children}
        </div>
      </div>
    </div>
  );
}
