'use client';

import * as React from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Select } from '@/components/ui/Input';
import { Globe, FileText, Compass, Image as ImageIcon, CheckCircle2 } from 'lucide-react';

export default function AdminStorePage() {
  const [storefrontLive, setStorefrontLive] = React.useState(true);
  const [themeMode, setThemeMode] = React.useState('warm-editorial');
  const [heroCta, setHeroCta] = React.useState('Launch Your Cloud & SEO Stack');
  const [toast, setToast] = React.useState<string | null>(null);

  const save = () => {
    setToast('Storefront Hub configuration published.');
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Store Hub"
        subtitle="Manage public storefront availability, hero merchandising, theme preset, and CMS shortcuts."
        actions={
          <Button size="sm" onClick={save}>Publish Storefront</Button>
        }
      />

      {toast && (
        <div className="cpki-card-insight px-4 py-2.5 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold flex items-center gap-2"><FileText className="w-4 h-4 text-[var(--primary)]" /> CMS, Blog & KB</span>
            <Badge tone="primary" variant="sm">14 Pages</Badge>
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">Edit landing pages, documentation articles, and legal policies.</p>
          <Link href="/admin/store/pages"><Button size="xs" variant="outline">Manage Pages</Button></Link>
        </Card>

        <Card className="p-4 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold flex items-center gap-2"><Compass className="w-4 h-4 text-[var(--primary)]" /> Navigation Builder</span>
            <Badge tone="lilac" variant="sm">3 Menus</Badge>
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">Organize header, footer, and mega-menu links.</p>
          <Link href="/admin/navigation"><Button size="xs" variant="outline">Edit Menus</Button></Link>
        </Card>

        <Card className="p-4 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold flex items-center gap-2"><ImageIcon className="w-4 h-4 text-[var(--primary)]" /> Media Library</span>
            <Badge tone="success" variant="sm">R2 Synced</Badge>
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">Upload product thumbnails, OG banners, and brand assets.</p>
          <Link href="/admin/media"><Button size="xs" variant="outline">Open Library</Button></Link>
        </Card>
      </div>

      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-[var(--primary)]" />
            <h3 className="text-sm font-semibold">Storefront Runtime Controls</h3>
          </div>
          <Button
            size="xs"
            variant={storefrontLive ? 'primary' : 'outline'}
            onClick={() => setStorefrontLive((v) => !v)}
          >
            {storefrontLive ? 'Storefront: Live' : 'Maintenance Mode'}
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Hero Headline" value={heroCta} onChange={(e) => setHeroCta(e.target.value)} />
          <Select label="Storefront Theme Preset" value={themeMode} onChange={(e) => setThemeMode(e.target.value)}>
            <option value="warm-editorial">Warm Editorial (Default)</option>
            <option value="obsidian-dark">Obsidian Dark</option>
            <option value="minimal-light">Minimal Light</option>
          </Select>
        </div>
      </Card>
    </div>
  );
}
