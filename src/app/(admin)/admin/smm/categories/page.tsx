'use client';

import * as React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import {
  Tag,
  Plus,
  CheckCircle2,
  Edit2,
  Trash2,
  Layers,
  ArrowUpDown,
  Search,
  Globe,
  Share2,
} from 'lucide-react';

export interface SmmCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  sortOrder: number;
  servicesCount: number;
  status: 'ACTIVE' | 'DISABLED';
  description: string;
}

const INITIAL_CATEGORIES: SmmCategory[] = [
  { id: 'cat-1', name: 'Instagram', slug: 'instagram', icon: 'Instagram', sortOrder: 1, servicesCount: 24, status: 'ACTIVE', description: 'Followers, Likes, Views, Reels, Story views, and Comments.' },
  { id: 'cat-2', name: 'YouTube', slug: 'youtube', icon: 'YouTube', sortOrder: 2, servicesCount: 18, status: 'ACTIVE', description: 'High-Retention Views, Watch Hours, Subscribers, and Likes.' },
  { id: 'cat-3', name: 'TikTok', slug: 'tiktok', icon: 'TikTok', sortOrder: 3, servicesCount: 15, status: 'ACTIVE', description: 'Instant views, Followers, Likes, Shares, and Saves.' },
  { id: 'cat-4', name: 'X / Twitter', slug: 'twitter', icon: 'Twitter', sortOrder: 4, servicesCount: 12, status: 'ACTIVE', description: 'Followers, Retweets, Likes, Impressions, and Poll votes.' },
  { id: 'cat-5', name: 'Spotify', slug: 'spotify', icon: 'Spotify', sortOrder: 5, servicesCount: 9, status: 'ACTIVE', description: 'Track Plays, Monthly Listeners, Playlist followers, and Saves.' },
  { id: 'cat-6', name: 'Telegram', slug: 'telegram', icon: 'Telegram', sortOrder: 6, servicesCount: 8, status: 'ACTIVE', description: 'Channel Members, Group Members, Post Views, and Reactions.' },
  { id: 'cat-7', name: 'Facebook', slug: 'facebook', icon: 'Facebook', sortOrder: 7, servicesCount: 11, status: 'ACTIVE', description: 'Page Likes, Followers, Post Reactions, Video views, and Shares.' },
  { id: 'cat-8', name: 'LinkedIn', slug: 'linkedin', icon: 'LinkedIn', sortOrder: 8, servicesCount: 6, status: 'ACTIVE', description: 'Company page followers, Post likes, and Endorsements.' },
  { id: 'cat-9', name: 'Website Traffic', slug: 'traffic', icon: 'Globe', sortOrder: 9, servicesCount: 7, status: 'ACTIVE', description: 'Organic search visits, Direct visitors, Country-targeted traffic.' },
];

export default function AdminSmmCategoriesPage() {
  const [categories, setCategories] = React.useState<SmmCategory[]>(INITIAL_CATEGORIES);
  const [search, setSearch] = React.useState('');
  const [toast, setToast] = React.useState<string | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingCat, setEditingCat] = React.useState<SmmCategory | null>(null);
  const [formName, setFormName] = React.useState('');
  const [formSlug, setFormSlug] = React.useState('');
  const [formSort, setFormSort] = React.useState('1');
  const [formStatus, setFormStatus] = React.useState<'ACTIVE' | 'DISABLED'>('ACTIVE');
  const [formDesc, setFormDesc] = React.useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = categories.filter((c) => {
    const q = search.toLowerCase().trim();
    return !q || c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q);
  });

  const openCreateModal = () => {
    setEditingCat(null);
    setFormName('');
    setFormSlug('');
    setFormSort(String(categories.length + 1));
    setFormStatus('ACTIVE');
    setFormDesc('');
    setModalOpen(true);
  };

  const openEditModal = (cat: SmmCategory) => {
    setEditingCat(cat);
    setFormName(cat.name);
    setFormSlug(cat.slug);
    setFormSort(String(cat.sortOrder));
    setFormStatus(cat.status);
    setFormDesc(cat.description);
    setModalOpen(true);
  };

  const toggleStatus = (id: string) => {
    setCategories((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: c.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE' } : c
      )
    );
  };

  const deleteCategory = (id: string) => {
    if (confirm('Are you sure you want to delete this category? Associated services will need reassignment.')) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      showToast('Category deleted.');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const slug = (formSlug || formName).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const sort = parseInt(formSort, 10) || categories.length + 1;

    if (editingCat) {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === editingCat.id
            ? {
                ...c,
                name: formName.trim(),
                slug,
                sortOrder: sort,
                status: formStatus,
                description: formDesc.trim(),
              }
            : c
        )
      );
      showToast(`Category "${formName}" updated.`);
    } else {
      const newCat: SmmCategory = {
        id: `cat-${Date.now()}`,
        name: formName.trim(),
        slug,
        icon: formName.trim(),
        sortOrder: sort,
        servicesCount: 0,
        status: formStatus,
        description: formDesc.trim(),
      };
      setCategories([...categories, newCat]);
      showToast(`Category "${newCat.name}" created.`);
    }
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="SMM Category Manager"
        subtitle="Organize social media platforms, sort display hierarchy on the storefront, and manage active platform statuses."
        actions={
          <Button size="sm" onClick={openCreateModal}>
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Category
          </Button>
        }
      />

      {toast && (
        <div className="cpki-card-insight px-4 py-3 text-xs font-medium flex items-center gap-2 border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 rounded-lg">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search category name or slug..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="text-xs text-[var(--muted-foreground)]">
            Total: <span className="font-semibold text-[var(--foreground)]">{categories.length}</span> Categories
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
          <table className="w-full text-xs text-left">
            <thead className="bg-[var(--muted)] text-[var(--muted-foreground)] font-medium border-b border-[var(--border)]">
              <tr>
                <th className="py-2.5 px-3">Sort</th>
                <th className="py-2.5 px-3">Category Name</th>
                <th className="py-2.5 px-3">Slug</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3 text-center">Services</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-[var(--muted-foreground)]">
                    No categories found.
                  </td>
                </tr>
              ) : (
                filtered.map((cat) => (
                  <tr key={cat.id} className="hover:bg-[var(--muted)]/50 transition-colors">
                    <td className="py-3 px-3 font-mono font-semibold text-[var(--muted-foreground)] w-12">
                      #{cat.sortOrder}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-sm text-[var(--foreground)] flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 text-primary" />
                        <span>{cat.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-[var(--muted-foreground)]">
                      /{cat.slug}
                    </td>
                    <td className="py-3 px-3 text-[var(--muted-foreground)] max-w-xs truncate">
                      {cat.description || '—'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center gap-1 font-mono font-semibold px-2 py-0.5 rounded bg-[var(--muted)]">
                        <Layers className="w-3 h-3 text-primary" />
                        {cat.servicesCount}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button onClick={() => toggleStatus(cat.id)} title="Toggle status">
                        <Badge tone={cat.status === 'ACTIVE' ? 'success' : 'neutral'} variant="sm">
                          {cat.status}
                        </Badge>
                      </button>
                    </td>
                    <td className="py-3 px-3 text-right space-x-1">
                      <Button size="xs" variant="outline" onClick={() => openEditModal(cat)}>
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        className="text-rose-400 hover:text-rose-300"
                        onClick={() => deleteCategory(cat.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add / Edit Category Modal */}
      {modalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setModalOpen(false)}
          title={editingCat ? `Edit Category — ${editingCat.name}` : 'Create SMM Category'}
        >
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <Input
              label="Category Name"
              value={formName}
              onChange={(e) => {
                setFormName(e.target.value);
                if (!editingCat) {
                  setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                }
              }}
              placeholder="e.g. Threads, Discord, WhatsApp"
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="URL Slug"
                value={formSlug}
                onChange={(e) => setFormSlug(e.target.value)}
                placeholder="e.g. threads"
                required
              />
              <Input
                label="Display Sort Order"
                type="number"
                value={formSort}
                onChange={(e) => setFormSort(e.target.value)}
                required
              />
            </div>

            <Select
              label="Storefront Status"
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value as any)}
            >
              <option value="ACTIVE">ACTIVE (Visible in Storefront)</option>
              <option value="DISABLED">DISABLED (Hidden from Storefront)</option>
            </Select>

            <Textarea
              label="Category Description / SEO Teaser"
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              rows={2}
              placeholder="Brief description of services in this category..."
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <Button size="sm" variant="outline" type="button" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" type="submit">
                {editingCat ? 'Save Changes' : 'Create Category'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
