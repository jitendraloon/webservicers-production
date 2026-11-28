'use client';

import * as React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, BadgeTone } from '@/components/ui/Badge';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import {
  RefreshCw,
  CheckCircle2,
  Search,
  ExternalLink,
  Plus,
  AlertCircle,
  Clock,
  Check,
  XCircle,
  Filter,
  DollarSign,
  Package,
} from 'lucide-react';

export type SmmOrderStatus =
  | 'Pending'
  | 'Processing'
  | 'In Progress'
  | 'Completed'
  | 'Partial'
  | 'Canceled'
  | 'Refunded';

export interface SmmOrder {
  id: string;
  externalId: string;
  provider: string;
  customer: string;
  service: string;
  category: string;
  link: string;
  quantity: number;
  startCount: number;
  remains: number;
  charge: number;
  currency: string;
  status: SmmOrderStatus;
  createdAt: string;
}

const INITIAL_ORDERS: SmmOrder[] = [
  {
    id: 'SMM-10892',
    externalId: 'PP-994012',
    provider: 'PerfectPanel Prime',
    customer: 'Apex Growth Agency',
    service: 'Instagram Followers [Real · Refill 30d]',
    category: 'Instagram',
    link: 'https://instagram.com/apexgrowth',
    quantity: 5000,
    startCount: 12400,
    remains: 0,
    charge: 11.20,
    currency: 'USD',
    status: 'Completed',
    createdAt: '2026-11-27 21:14',
  },
  {
    id: 'SMM-10891',
    externalId: 'PP-994008',
    provider: 'PerfectPanel Prime',
    customer: 'Solaris Media Group',
    service: 'YouTube High-Retention Views [Non-Drop]',
    category: 'YouTube',
    link: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
    quantity: 10000,
    startCount: 45000,
    remains: 2400,
    charge: 42.00,
    currency: 'USD',
    status: 'In Progress',
    createdAt: '2026-11-27 20:30',
  },
  {
    id: 'SMM-10890',
    externalId: 'GB-33104',
    provider: 'GlobalBoost Wholesale',
    customer: 'TrendHive Studio',
    service: 'TikTok Views [Instant · High Speed]',
    category: 'TikTok',
    link: 'https://tiktok.com/@trendhive/video/1049281',
    quantity: 50000,
    startCount: 1500,
    remains: 50000,
    charge: 12.00,
    currency: 'USD',
    status: 'Pending',
    createdAt: '2026-11-27 19:45',
  },
  {
    id: 'SMM-10889',
    externalId: 'PP-993992',
    provider: 'PerfectPanel Prime',
    customer: 'Elevate Marketing',
    service: 'X / Twitter Retweets & Bookmarks',
    category: 'Twitter',
    link: 'https://x.com/elevate/status/18829104',
    quantity: 2500,
    startCount: 300,
    remains: 1250,
    charge: 8.50,
    currency: 'USD',
    status: 'Partial',
    createdAt: '2026-11-27 18:20',
  },
  {
    id: 'SMM-10888',
    externalId: 'GB-33099',
    provider: 'GlobalBoost Wholesale',
    customer: 'VibeCast Radio',
    service: 'Spotify Track Plays [Algorithmic Stream]',
    category: 'Spotify',
    link: 'https://open.spotify.com/track/4cOdK2wGUTU2b0jW',
    quantity: 20000,
    startCount: 82000,
    remains: 20000,
    charge: 36.00,
    currency: 'USD',
    status: 'Processing',
    createdAt: '2026-11-27 17:10',
  },
];

const STATUS_TONE: Record<SmmOrderStatus, BadgeTone> = {
  Completed: 'success',
  'In Progress': 'primary',
  Processing: 'primary',
  Pending: 'warning',
  Partial: 'warning',
  Canceled: 'danger',
  Refunded: 'neutral',
};

export default function AdminSmmOrdersPage() {
  const [orders, setOrders] = React.useState<SmmOrder[]>(INITIAL_ORDERS);
  const [filterStatus, setFilterStatus] = React.useState<string>('All');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [toast, setToast] = React.useState<string | null>(null);

  // Edit / Details Modal State
  const [selectedOrder, setSelectedOrder] = React.useState<SmmOrder | null>(null);
  const [editStatus, setEditStatus] = React.useState<SmmOrderStatus>('Pending');
  const [editRemains, setEditRemains] = React.useState<number>(0);
  const [editStartCount, setEditStartCount] = React.useState<number>(0);

  // New Order Modal State
  const [newOrderOpen, setNewOrderOpen] = React.useState(false);
  const [newCustomer, setNewCustomer] = React.useState('');
  const [newService, setNewService] = React.useState('Instagram Followers [Real · Refill 30d]');
  const [newLink, setNewLink] = React.useState('');
  const [newQty, setNewQty] = React.useState('1000');
  const [newProvider, setNewProvider] = React.useState('PerfectPanel Prime');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const filteredOrders = orders.filter((o) => {
    const matchStatus = filterStatus === 'All' || o.status === filterStatus;
    const q = searchQuery.toLowerCase().trim();
    const matchQ =
      !q ||
      o.id.toLowerCase().includes(q) ||
      o.externalId.toLowerCase().includes(q) ||
      o.customer.toLowerCase().includes(q) ||
      o.service.toLowerCase().includes(q) ||
      o.link.toLowerCase().includes(q);
    return matchStatus && matchQ;
  });

  const syncStatus = (id: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === id) {
          return {
            ...o,
            status: 'Completed',
            remains: 0,
          };
        }
        return o;
      })
    );
    showToast(`Order ${id} synced successfully from upstream provider.`);
  };

  const openEditModal = (order: SmmOrder) => {
    setSelectedOrder(order);
    setEditStatus(order.status);
    setEditRemains(order.remains);
    setEditStartCount(order.startCount);
  };

  const saveOrderUpdates = () => {
    if (!selectedOrder) return;
    setOrders((prev) =>
      prev.map((o) =>
        o.id === selectedOrder.id
          ? {
              ...o,
              status: editStatus,
              remains: Number(editRemains) || 0,
              startCount: Number(editStartCount) || 0,
            }
          : o
      )
    );
    setSelectedOrder(null);
    showToast(`Order ${selectedOrder.id} updated successfully.`);
  };

  const cancelAndRefund = (order: SmmOrder) => {
    if (confirm(`Are you sure you want to cancel and refund ${order.id} ($${order.charge.toFixed(2)})?`)) {
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: 'Refunded', remains: o.quantity } : o))
      );
      showToast(`Order ${order.id} marked as Refunded.`);
    }
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.trim() || !newLink.trim()) {
      alert('Please provide customer name and target URL link.');
      return;
    }
    const qty = parseInt(newQty, 10) || 1000;
    const newOrder: SmmOrder = {
      id: `SMM-${Math.floor(10000 + Math.random() * 90000)}`,
      externalId: `PP-${Math.floor(900000 + Math.random() * 99999)}`,
      provider: newProvider,
      customer: newCustomer.trim(),
      service: newService,
      category: 'Instagram',
      link: newLink.trim(),
      quantity: qty,
      startCount: 0,
      remains: qty,
      charge: +(qty * 0.0022).toFixed(2),
      currency: 'USD',
      status: 'Pending',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };
    setOrders([newOrder, ...orders]);
    setNewOrderOpen(false);
    setNewCustomer('');
    setNewLink('');
    setNewQty('1000');
    showToast(`Manual order ${newOrder.id} dispatched to ${newProvider}.`);
  };

  // Stats
  const totalRevenue = orders.reduce((sum, o) => sum + o.charge, 0);
  const pendingCount = orders.filter((o) => o.status === 'Pending' || o.status === 'Processing').length;
  const inProgressCount = orders.filter((o) => o.status === 'In Progress').length;
  const completedCount = orders.filter((o) => o.status === 'Completed').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="SMM Order Management"
        subtitle="Monitor real-time fulfillment, sync upstream provider order states, and handle manual re-routes or refunds."
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => showToast('All active upstream orders synced.')}>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Sync All Orders
            </Button>
            <Button size="sm" onClick={() => setNewOrderOpen(true)}>
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Create Manual Order
            </Button>
          </div>
        }
      />

      {toast && (
        <div className="cpki-card-insight px-4 py-3 text-xs font-medium flex items-center gap-2 border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 rounded-lg">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
            <span>Total Orders</span>
            <Package className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold font-mono text-[var(--foreground)]">{orders.length}</div>
          <div className="text-[11px] text-[var(--muted-foreground)]">All-time lifetime orders</div>
        </Card>

        <Card className="p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-amber-400">
            <span>Pending / Processing</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">{pendingCount}</div>
          <div className="text-[11px] text-[var(--muted-foreground)]">Queued for provider dispatch</div>
        </Card>

        <Card className="p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-primary">
            <span>In Progress</span>
            <RefreshCw className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold font-mono text-primary">{inProgressCount}</div>
          <div className="text-[11px] text-[var(--muted-foreground)]">Active delivery upstream</div>
        </Card>

        <Card className="p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-emerald-400">
            <span>Completed</span>
            <Check className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">{completedCount}</div>
          <div className="text-[11px] text-[var(--muted-foreground)]">Total Volume: ${totalRevenue.toFixed(2)}</div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            {['All', 'Pending', 'Processing', 'In Progress', 'Completed', 'Partial', 'Canceled', 'Refunded'].map(
              (st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    filterStatus === st
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                  }`}
                >
                  {st}
                </button>
              )
            )}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search order ID, user, link..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
          <table className="w-full text-xs text-left">
            <thead className="bg-[var(--muted)] text-[var(--muted-foreground)] font-medium border-b border-[var(--border)]">
              <tr>
                <th className="py-2.5 px-3">Order ID</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Service & Provider</th>
                <th className="py-2.5 px-3">Target Link</th>
                <th className="py-2.5 px-3 text-right">Quantity</th>
                <th className="py-2.5 px-3 text-right">Start / Remains</th>
                <th className="py-2.5 px-3 text-right">Charge</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-[var(--muted-foreground)]">
                    No SMM orders found matching filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-[var(--muted)]/50 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-mono font-semibold text-[var(--foreground)]">{o.id}</div>
                      <div className="text-[10px] text-[var(--muted-foreground)]">{o.createdAt}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-[var(--foreground)]">{o.customer}</div>
                    </td>
                    <td className="py-3 px-3 max-w-xs">
                      <div className="font-medium text-[var(--foreground)] truncate" title={o.service}>
                        {o.service}
                      </div>
                      <div className="text-[10px] text-[var(--muted-foreground)]">
                        Provider: {o.provider} · Ext: {o.externalId}
                      </div>
                    </td>
                    <td className="py-3 px-3 max-w-[180px]">
                      <a
                        href={o.link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline truncate max-w-full font-mono text-[11px]"
                      >
                        <span className="truncate">{o.link}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold">
                      {o.quantity.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-[11px]">
                      <div>Start: {o.startCount.toLocaleString()}</div>
                      <div className="text-amber-400">Rem: {o.remains.toLocaleString()}</div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-[var(--foreground)]">
                      ${o.charge.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <Badge tone={STATUS_TONE[o.status]} variant="sm">
                        {o.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-right space-x-1">
                      <Button size="xs" variant="outline" onClick={() => syncStatus(o.id)} title="Sync status with upstream">
                        <RefreshCw className="w-3 h-3" />
                      </Button>
                      <Button size="xs" variant="outline" onClick={() => openEditModal(o)}>
                        Edit
                      </Button>
                      {o.status !== 'Refunded' && o.status !== 'Canceled' && (
                        <Button
                          size="xs"
                          variant="outline"
                          className="text-rose-400 hover:text-rose-300"
                          onClick={() => cancelAndRefund(o)}
                          title="Cancel & Refund"
                        >
                          <XCircle className="w-3 h-3" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Order Modal */}
      {selectedOrder && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedOrder(null)}
          title={`Update SMM Order — ${selectedOrder.id}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-[var(--muted)] rounded-lg space-y-1">
              <div className="font-semibold text-[var(--foreground)]">{selectedOrder.service}</div>
              <div className="text-[var(--muted-foreground)]">Customer: {selectedOrder.customer}</div>
              <div className="text-[var(--muted-foreground)]">Link: {selectedOrder.link}</div>
              <div className="text-[var(--muted-foreground)] font-mono">
                Qty: {selectedOrder.quantity.toLocaleString()} · Ext ID: {selectedOrder.externalId}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Fulfillment Status"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as SmmOrderStatus)}
              >
                <option value="Pending">Pending</option>
                <option value="Processing">Processing</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Partial">Partial</option>
                <option value="Canceled">Canceled</option>
                <option value="Refunded">Refunded</option>
              </Select>

              <Input
                label="Remains Count"
                type="number"
                value={editRemains}
                onChange={(e) => setEditRemains(parseInt(e.target.value, 10) || 0)}
              />
            </div>

            <Input
              label="Start Count"
              type="number"
              value={editStartCount}
              onChange={(e) => setEditStartCount(parseInt(e.target.value, 10) || 0)}
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <Button size="sm" variant="outline" onClick={() => setSelectedOrder(null)}>
                Cancel
              </Button>
              <Button size="sm" onClick={saveOrderUpdates}>
                Save Changes
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Manual Order Modal */}
      {newOrderOpen && (
        <Modal
          isOpen={true}
          onClose={() => setNewOrderOpen(false)}
          title="Create Manual SMM Order"
        >
          <form onSubmit={handleCreateOrder} className="space-y-4 text-xs">
            <Input
              label="Customer Name or User Email"
              value={newCustomer}
              onChange={(e) => setNewCustomer(e.target.value)}
              placeholder="e.g. Acme Marketing (user@domain.com)"
              required
            />

            <Select
              label="Select SMM Service"
              value={newService}
              onChange={(e) => setNewService(e.target.value)}
            >
              <option value="Instagram Followers [Real · Refill 30d]">Instagram Followers [Real · Refill 30d] - $2.24/1k</option>
              <option value="YouTube High-Retention Views [Non-Drop]">YouTube High-Retention Views [Non-Drop] - $4.20/1k</option>
              <option value="TikTok Views [Instant · High Speed]">TikTok Views [Instant · High Speed] - $0.24/1k</option>
              <option value="X / Twitter Retweets & Bookmarks">X / Twitter Retweets & Bookmarks - $1.14/1k</option>
              <option value="Spotify Track Plays [Algorithmic Stream]">Spotify Track Plays [Algorithmic Stream] - $1.80/1k</option>
            </Select>

            <Input
              label="Target Social Media Link / URL"
              value={newLink}
              onChange={(e) => setNewLink(e.target.value)}
              placeholder="https://instagram.com/p/..."
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Quantity"
                type="number"
                value={newQty}
                onChange={(e) => setNewQty(e.target.value)}
                min="10"
                required
              />
              <Select
                label="Dispatch Provider"
                value={newProvider}
                onChange={(e) => setNewProvider(e.target.value)}
              >
                <option value="PerfectPanel Prime">PerfectPanel Prime (API v2)</option>
                <option value="GlobalBoost Wholesale">GlobalBoost Wholesale (API v2)</option>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <Button size="sm" variant="outline" type="button" onClick={() => setNewOrderOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" type="submit">
                Dispatch Order to Upstream
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
