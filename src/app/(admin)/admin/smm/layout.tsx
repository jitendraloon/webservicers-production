'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, Layers, Tag, Server, DownloadCloud, Sparkles } from 'lucide-react';

const SMM_SUBMENUS = [
  { label: 'Orders Queue', href: '/admin/smm/orders', icon: Package, badge: 'Live' },
  { label: 'Service Manager', href: '/admin/smm/services', icon: Layers },
  { label: 'Category Manager', href: '/admin/smm/categories', icon: Tag },
  { label: 'Providers & APIs', href: '/admin/smm/providers', icon: Server },
  { label: 'Import Services & Pricing', href: '/admin/smm/import', icon: DownloadCloud, highlight: true },
];

export default function SmmAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      {/* SMM Manager Top Submenu Navigation */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-2.5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 px-2">
            <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                SMM Panel Manager
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {SMM_SUBMENUS.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    active
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : item.highlight
                      ? 'bg-primary/10 text-primary hover:bg-primary/20'
                      : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                  {item.badge && !active && (
                    <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-emerald-500/20 text-emerald-400">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {children}
    </div>
  );
}
