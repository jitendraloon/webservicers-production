'use client';

import * as React from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Globe,
  DollarSign,
  ShieldCheck,
  Receipt,
  FileText,
  Headphones,
  Search,
  Bell,
  Lock,
  FileCheck,
  Code2,
  ArrowRight,
  Settings,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { SETTINGS_SECTIONS } from './settings-sections';

export default function AdminSettingsOverviewHubPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--foreground)]">
            Platform Configuration Hub
          </h2>
          <p className="text-xs text-[var(--muted-foreground)] mt-1">
            Manage all 11 dedicated standalone configuration domains. Settings update live across customer storefronts and internal operations.
          </p>
        </div>
      </div>

      {/* Grid of all 11 standalone settings sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SETTINGS_SECTIONS.map((sec) => {
          const Icon = sec.icon;
          return (
            <Card
              key={sec.id}
              className="p-5 flex flex-col justify-between hover:border-primary/50 transition-all group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-mono text-xs font-bold">
                      {sec.num}
                    </span>
                    <h3 className="text-sm font-semibold text-[var(--foreground)] group-hover:text-primary transition-colors">
                      {sec.title}
                    </h3>
                  </div>
                  <Badge tone="success" variant="sm">
                    Configured
                  </Badge>
                </div>

                <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                  {sec.desc}. Customise policies, parameters, and automated thresholds tailored to this domain.
                </p>
              </div>

              <div className="pt-4 border-t border-[var(--border)] mt-4 flex items-center justify-between">
                <span className="font-mono text-[11px] text-[var(--muted-foreground)]">
                  {sec.href}
                </span>

                <Link href={sec.href}>
                  <Button size="xs" variant="outline" className="group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                    <span>Manage Settings</span>
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
