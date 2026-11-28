'use client';

import * as React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Upload, Copy, Trash2, CheckCircle2, FileImage } from 'lucide-react';

interface MediaAsset {
  id: string;
  filename: string;
  size: string;
  dimensions: string;
  bucket: string;
  url: string;
}

const INITIAL_ASSETS: MediaAsset[] = [
  { id: 'MED-1', filename: 'hero-cloud-mesh.webp', size: '148 KB', dimensions: '1600×900', bucket: 'ws-prod-assets', url: 'https://cdn.webservicers.io/hero-cloud-mesh.webp' },
  { id: 'MED-2', filename: 'og-seo-suite.png', size: '214 KB', dimensions: '1200×630', bucket: 'ws-prod-assets', url: 'https://cdn.webservicers.io/og-seo-suite.png' },
  { id: 'MED-3', filename: 'brand-mark-dark.svg', size: '12 KB', dimensions: 'Vector', bucket: 'ws-prod-assets', url: 'https://cdn.webservicers.io/brand-mark-dark.svg' },
  { id: 'MED-4', filename: 'pricing-badge.png', size: '44 KB', dimensions: '512×512', bucket: 'ws-prod-assets', url: 'https://cdn.webservicers.io/pricing-badge.png' },
];

export default function AdminMediaPage() {
  const [assets, setAssets] = React.useState<MediaAsset[]>(INITIAL_ASSETS);
  const [search, setSearch] = React.useState('');
  const [toast, setToast] = React.useState<string | null>(null);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const simulateUpload = () => {
    const id = `MED-${Date.now()}`;
    const name = `upload-${Math.floor(100 + Math.random() * 899)}.webp`;
    setAssets((prev) => [
      { id, filename: name, size: '96 KB', dimensions: '1280×720', bucket: 'ws-prod-assets', url: `https://cdn.webservicers.io/${name}` },
      ...prev,
    ]);
    notify(`Uploaded ${name} to Cloudflare R2`);
  };

  const filtered = assets.filter((a) => a.filename.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Media Library"
        subtitle="Manage CDN-backed images, SVGs, and downloadable assets synced to Cloudflare R2."
        actions={
          <Button size="sm" onClick={simulateUpload}>
            <Upload className="w-3.5 h-3.5 mr-1.5" /> Upload Asset
          </Button>
        }
      />

      {toast && (
        <div className="cpki-card-insight px-4 py-2.5 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      <div className="max-w-xs">
        <Input placeholder="Filter by filename..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filtered.map((a) => (
          <Card key={a.id} className="p-4 flex flex-col justify-between gap-3">
            <div className="h-24 rounded-[var(--radius-control)] bg-[var(--muted)] border border-[var(--border)] flex items-center justify-center">
              <FileImage className="w-8 h-8 text-[var(--muted-foreground)]" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[var(--foreground)] truncate">{a.filename}</div>
              <div className="text-[11px] text-[var(--muted-foreground)] mt-0.5">{a.size} · {a.dimensions}</div>
              <Badge tone="neutral" variant="sm" className="mt-1.5">{a.bucket}</Badge>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
              <Button size="xs" variant="ghost" onClick={() => notify(`Copied URL: ${a.url}`)}>
                <Copy className="w-3.5 h-3.5 mr-1" /> Copy URL
              </Button>
              <Button size="xs" variant="ghost" className="text-[var(--destructive)]" onClick={() => setAssets((prev) => prev.filter((x) => x.id !== a.id))}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
