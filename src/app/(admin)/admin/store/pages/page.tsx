'use client';

import * as React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, BadgeTone } from '@/components/ui/Badge';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Plus, CheckCircle2 } from 'lucide-react';

interface CmsPage {
  id: string;
  title: string;
  slug: string;
  type: 'CMS Page' | 'Blog Post' | 'KB Article';
  status: 'Published' | 'Draft';
  updatedAt: string;
  content: string;
}

const INITIAL_PAGES: CmsPage[] = [
  { id: 'PG-1', title: 'Enterprise Cloud Hosting', slug: '/services/cloud-hosting', type: 'CMS Page', status: 'Published', updatedAt: '2026-11-25', content: 'High-availability NVMe cloud infrastructure.' },
  { id: 'PG-2', title: 'How to Configure DataForSEO Waterfall', slug: '/kb/seo-waterfall', type: 'KB Article', status: 'Published', updatedAt: '2026-11-24', content: 'Step-by-step guide to fallback routing.' },
  { id: 'PG-3', title: '2026 Q4 Infrastructure Roadmap', slug: '/blog/q4-roadmap', type: 'Blog Post', status: 'Draft', updatedAt: '2026-11-22', content: 'Upcoming edge POPs in Frankfurt and Tokyo.' },
];

const STATUS_TONE: Record<CmsPage['status'], BadgeTone> = {
  Published: 'success',
  Draft: 'warning',
};

export default function AdminStorePagesPage() {
  const [pages, setPages] = React.useState<CmsPage[]>(INITIAL_PAGES);
  const [typeFilter, setTypeFilter] = React.useState('ALL');
  const [editing, setEditing] = React.useState<CmsPage | null>(null);
  const [isNew, setIsNew] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);

  const filtered = pages.filter((p) => typeFilter === 'ALL' || p.type === typeFilter);

  const savePage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    if (isNew) {
      setPages((prev) => [{ ...editing, updatedAt: 'Just now' }, ...prev]);
    } else {
      setPages((prev) => prev.map((p) => (p.id === editing.id ? { ...editing, updatedAt: 'Just now' } : p)));
    }
    setToast(`Saved "${editing.title}"`);
    setEditing(null);
    setTimeout(() => setToast(null), 2500);
  };

  const columns: Column<CmsPage>[] = [
    {
      key: 'title',
      header: 'Title & Slug',
      render: (r) => (
        <div>
          <div className="font-medium text-[var(--foreground)]">{r.title}</div>
          <div className="text-[11px] font-mono text-[var(--muted-foreground)]">{r.slug}</div>
        </div>
      ),
    },
    { key: 'type', header: 'Type', render: (r) => <Badge tone="lilac" variant="sm">{r.type}</Badge> },
    { key: 'status', header: 'Status', render: (r) => <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge> },
    { key: 'updatedAt', header: 'Updated' },
    {
      key: 'actions',
      header: '',
      cellClassName: 'text-right',
      render: (r) => (
        <Button size="xs" variant="outline" onClick={() => { setIsNew(false); setEditing(r); }}>
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="CMS, Blog & Knowledge Base"
        subtitle="Author and publish marketing landing pages, blog announcements, and customer KB documentation."
        actions={
          <Button
            size="sm"
            onClick={() => {
              setIsNew(true);
              setEditing({
                id: `PG-${Date.now()}`,
                title: '',
                slug: '/new-page',
                type: 'CMS Page',
                status: 'Draft',
                updatedAt: 'Now',
                content: '',
              });
            }}
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" /> New Page
          </Button>
        }
      />

      {toast && (
        <div className="cpki-card-insight px-4 py-2.5 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-44">
          <option value="ALL">All Content Types</option>
          <option value="CMS Page">CMS Pages</option>
          <option value="Blog Post">Blog Posts</option>
          <option value="KB Article">KB Articles</option>
        </Select>
      </div>

      <Card className="p-0 overflow-hidden">
        <DataTable columns={columns} data={filtered} rowKey={(r) => r.id} />
      </Card>

      <Modal isOpen={Boolean(editing)} onClose={() => setEditing(null)} title={isNew ? 'Create Page' : 'Edit Page'} maxWidth="600px">
        {editing && (
          <form onSubmit={savePage} className="space-y-3">
            <Input label="Title" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} required />
            <div className="grid grid-cols-2 gap-3">
              <Input label="URL Slug" value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} required />
              <Select label="Type" value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value as CmsPage['type'] })}>
                <option value="CMS Page">CMS Page</option>
                <option value="Blog Post">Blog Post</option>
                <option value="KB Article">KB Article</option>
              </Select>
            </div>
            <Select label="Publish Status" value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value as CmsPage['status'] })}>
              <option value="Draft">Draft</option>
              <option value="Published">Published</option>
            </Select>
            <Textarea label="Content" value={editing.content} onChange={(e) => setEditing({ ...editing, content: e.target.value })} rows={5} />
            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <Button variant="outline" size="sm" onClick={() => setEditing(null)}>Cancel</Button>
              <Button type="submit" size="sm">Save Page</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
