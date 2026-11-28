'use client';

import * as React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { ArrowUp, ArrowDown, Trash2, Plus, CheckCircle2 } from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  href: string;
  location: 'Header' | 'Footer';
}

const INITIAL_NAV: NavItem[] = [
  { id: 'NAV-1', label: 'Services', href: '/services', location: 'Header' },
  { id: 'NAV-2', label: 'SEO Suite', href: '/seo', location: 'Header' },
  { id: 'NAV-3', label: 'Pricing', href: '/pricing', location: 'Header' },
  { id: 'NAV-4', label: 'Knowledge Base', href: '/kb', location: 'Footer' },
  { id: 'NAV-5', label: 'Terms & Privacy', href: '/legal', location: 'Footer' },
];

export default function AdminNavigationPage() {
  const [items, setItems] = React.useState<NavItem[]>(INITIAL_NAV);
  const [label, setLabel] = React.useState('');
  const [href, setHref] = React.useState('');
  const [location, setLocation] = React.useState<'Header' | 'Footer'>('Header');
  const [toast, setToast] = React.useState<string | null>(null);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const move = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[idx], next[target]] = [next[target], next[idx]];
    setItems(next);
  };

  const addItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !href.trim()) return;
    setItems((prev) => [...prev, { id: `NAV-${Date.now()}`, label: label.trim(), href: href.trim(), location }]);
    setLabel('');
    setHref('');
    notify('Added navigation link');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Navigation Builder"
        subtitle="Configure header and footer navigation menus and ordering."
        actions={<Button size="sm" onClick={() => notify('Navigation menus published')}>Publish Menus</Button>}
      />

      {toast && (
        <div className="cpki-card-insight px-4 py-2.5 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      <Card className="p-4">
        <form onSubmit={addItem} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <Input label="Link Label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Status Page" required />
          <Input label="Target URL" value={href} onChange={(e) => setHref(e.target.value)} placeholder="/status" required />
          <Select label="Menu Location" value={location} onChange={(e) => setLocation(e.target.value as 'Header' | 'Footer')}>
            <option value="Header">Header</option>
            <option value="Footer">Footer</option>
          </Select>
          <Button type="submit" size="sm"><Plus className="w-3.5 h-3.5 mr-1" /> Add Link</Button>
        </form>
      </Card>

      <div className="space-y-2">
        {items.map((item, idx) => (
          <Card key={item.id} className="p-3.5 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-[var(--foreground)]">{item.label}</div>
              <div className="text-[11px] font-mono text-[var(--muted-foreground)]">{item.location} · {item.href}</div>
            </div>
            <div className="flex items-center gap-1">
              <Button size="xs" variant="ghost" disabled={idx === 0} onClick={() => move(idx, -1)}>
                <ArrowUp className="w-3.5 h-3.5" />
              </Button>
              <Button size="xs" variant="ghost" disabled={idx === items.length - 1} onClick={() => move(idx, 1)}>
                <ArrowDown className="w-3.5 h-3.5" />
              </Button>
              <Button size="xs" variant="ghost" className="text-[var(--destructive)]" onClick={() => setItems((prev) => prev.filter((i) => i.id !== item.id))}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
