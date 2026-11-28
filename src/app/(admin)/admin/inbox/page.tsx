'use client';

import * as React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { getDynamicEmail } from '@/lib/site-url';
import {
  Mail,
  Inbox,
  Send,
  CheckCheck,
  FileEdit,
  AlertOctagon,
  Trash2,
  Search,
  Star,
  RefreshCw,
  CornerDownLeft,
  Building2,
  Phone,
  Globe,
  DollarSign,
  User,
  Filter,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  MessageSquare,
  Clock,
  ArrowRight,
} from 'lucide-react';
import type { InboxFolder, InboxThread, ThreadMessage } from '@/app/api/admin/inbox/route';

const EMAIL_TEMPLATES = [
  {
    label: 'Standard Discovery Follow-Up',
    subject: 'Re: Discovery Call & Solution Architecture',
    body: `Hi {{name}},\n\nThank you for reaching out to us! We have reviewed your project requirements and would love to schedule a brief 15-minute discovery call to walk through solution architecture, deliverables, and timelines.\n\nPlease let us know what day and time works best for you this week.\n\nBest regards,\nWebServicers Client Success Team`,
  },
  {
    label: 'Website Design & Dev Proposal',
    subject: 'Re: Website Design & Development Project Scope',
    body: `Hi {{name}},\n\nThank you for contacting us regarding your website project. We specialize in high-performance Next.js architectures with sub-second page loads, automated mobile responsiveness, and enterprise security.\n\nBased on your scope, our team has prepared a preliminary roadmap. Are you available for a quick Zoom walkthrough tomorrow?\n\nBest regards,\nSolutions Architecture Desk`,
  },
  {
    label: 'SEO & Growth Strategy Overview',
    subject: 'Re: SEO & Organic Visibility Strategy',
    body: `Hi {{name}},\n\nThanks for your inquiry. Our enterprise SEO Suite combines deep SERP tracking, automated technical audits, and content intelligence to drive compounding organic traffic.\n\nI have generated a preliminary visibility report for your domain. Let us know if you would like us to send the PDF audit over.\n\nWarm regards,\nGrowth Operations Team`,
  },
  {
    label: 'SMM & Reseller Wholesaling',
    subject: 'Re: Social Media Marketing & API Access',
    body: `Hi {{name}},\n\nThank you for inquiring about our social growth and SMM panel infrastructure. We provide high-throughput API endpoints, automated order routing, and tiered wholesale pricing.\n\nYour reseller API credentials and documentation can be provisioned immediately. Let us know if you need custom rate limits.\n\nBest regards,\nPartner Operations Team`,
  },
];

export default function AdminCustomerInboxPage() {
  const [threads, setThreads] = React.useState<InboxThread[]>([]);
  const [counts, setCounts] = React.useState<any>({});
  const [selectedFolder, setSelectedFolder] = React.useState<InboxFolder>('inbox');
  const [selectedSource, setSelectedSource] = React.useState<string>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedThreadId, setSelectedThreadId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  // Reply Composer State
  const [replyText, setReplyText] = React.useState('');
  const [sendingReply, setSendingReply] = React.useState(false);
  const [fromEmail, setFromEmail] = React.useState('support@webservicers.com');
  const [toast, setToast] = React.useState<string | null>(null);

  React.useEffect(() => {
    setFromEmail(getDynamicEmail('support'));
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchThreads = React.useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setRefreshing(true);
    try {
      const url = new URL('/api/admin/inbox', window.location.origin);
      url.searchParams.set('folder', selectedFolder);
      if (selectedSource !== 'all') url.searchParams.set('source', selectedSource);
      if (searchQuery.trim()) url.searchParams.set('search', searchQuery.trim());

      const res = await fetch(url.toString());
      if (res.ok) {
        const json = await res.json();
        setThreads(json.threads || []);
        setCounts(json.counts || {});
        if (!selectedThreadId && json.threads?.length > 0) {
          setSelectedThreadId(json.threads[0].id);
        }
      }
    } catch (_) {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedFolder, selectedSource, searchQuery, selectedThreadId]);

  React.useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  const activeThread = threads.find((t) => t.id === selectedThreadId) || threads[0] || null;

  const handleSelectThread = (thread: InboxThread) => {
    setSelectedThreadId(thread.id);
    if (thread.unread) {
      // Mark as read in state & backend
      setThreads((prev) => prev.map((t) => (t.id === thread.id ? { ...t, unread: false } : t)));
      fetch('/api/admin/inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_read', threadId: thread.id, unread: false }),
      });
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThread || !replyText.trim()) return;

    setSendingReply(true);
    try {
      const res = await fetch('/api/admin/inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reply',
          threadId: activeThread.id,
          replyText: replyText.trim(),
          staffName: 'Support Desk Specialist',
          fromEmail,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        showToast('Reply dispatched via email and recorded in thread.');
        setReplyText('');
        fetchThreads(true);
      }
    } catch (_) {
      showToast('Network error dispatching reply.');
    } finally {
      setSendingReply(false);
    }
  };

  const handleMoveFolder = async (targetFolder: InboxFolder) => {
    if (!activeThread) return;
    try {
      const res = await fetch('/api/admin/inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_folder',
          threadId: activeThread.id,
          targetFolder,
        }),
      });
      if (res.ok) {
        showToast(`Conversation moved to ${targetFolder}.`);
        fetchThreads(true);
      }
    } catch (_) {}
  };

  const handleToggleStar = async () => {
    if (!activeThread) return;
    const newStar = !activeThread.starred;
    setThreads((prev) =>
      prev.map((t) => (t.id === activeThread.id ? { ...t, starred: newStar } : t))
    );
    try {
      await fetch('/api/admin/inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_starred', threadId: activeThread.id }),
      });
    } catch (_) {}
  };

  const handleApplyTemplate = (tmplBody: string) => {
    if (!activeThread) return;
    const customized = tmplBody.replace(/{{name}}/g, activeThread.senderName.split(' ')[0]);
    setReplyText(customized);
  };

  return (
    <div className="space-y-4 pb-20">
      <PageHeader
        title="Customer Inbox"
        subtitle="Universal mailbox for public Contact Form inquiries and Talk to Expert submissions in one synchronized thread view."
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={refreshing}
              onClick={() => fetchThreads(false)}
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        }
      />

      {toast && (
        <div className="p-3 text-xs font-medium rounded-lg flex items-center gap-2 border bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Main Mail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start min-h-[640px]">
        {/* Left Folder Navigation Pane (3 cols) */}
        <Card className="lg:col-span-3 p-3.5 space-y-4">
          <div className="space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)] px-2 mb-1.5">
              Mail Folders
            </div>

            <button
              onClick={() => setSelectedFolder('inbox')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                selectedFolder === 'inbox'
                  ? 'bg-[var(--primary)] text-white shadow-xs'
                  : 'text-[var(--foreground)] hover:bg-[var(--muted)]/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Inbox className="w-4 h-4" />
                <span>All Inbox</span>
              </div>
              {counts.unreadInbox > 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    selectedFolder === 'inbox' ? 'bg-white text-[var(--primary)]' : 'bg-red-500 text-white'
                  }`}
                >
                  {counts.unreadInbox}
                </span>
              )}
            </button>

            <button
              onClick={() => setSelectedFolder('replied')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                selectedFolder === 'replied'
                  ? 'bg-[var(--primary)] text-white shadow-xs'
                  : 'text-[var(--foreground)] hover:bg-[var(--muted)]/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CheckCheck className="w-4 h-4" />
                <span>Replied</span>
              </div>
              <span className="text-[10px] opacity-75 font-mono">{counts.replied || 0}</span>
            </button>

            <button
              onClick={() => setSelectedFolder('sent')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                selectedFolder === 'sent'
                  ? 'bg-[var(--primary)] text-white shadow-xs'
                  : 'text-[var(--foreground)] hover:bg-[var(--muted)]/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Send className="w-4 h-4" />
                <span>Sent Outbound</span>
              </div>
              <span className="text-[10px] opacity-75 font-mono">{counts.sent || 0}</span>
            </button>

            <button
              onClick={() => setSelectedFolder('draft')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                selectedFolder === 'draft'
                  ? 'bg-[var(--primary)] text-white shadow-xs'
                  : 'text-[var(--foreground)] hover:bg-[var(--muted)]/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileEdit className="w-4 h-4" />
                <span>Drafts</span>
              </div>
              <span className="text-[10px] opacity-75 font-mono">{counts.draft || 0}</span>
            </button>

            <button
              onClick={() => setSelectedFolder('spam')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                selectedFolder === 'spam'
                  ? 'bg-[var(--primary)] text-white shadow-xs'
                  : 'text-[var(--foreground)] hover:bg-[var(--muted)]/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <AlertOctagon className="w-4 h-4" />
                <span>Spam Filter</span>
              </div>
              <span className="text-[10px] opacity-75 font-mono">{counts.spam || 0}</span>
            </button>

            <button
              onClick={() => setSelectedFolder('trash')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                selectedFolder === 'trash'
                  ? 'bg-[var(--primary)] text-white shadow-xs'
                  : 'text-[var(--foreground)] hover:bg-[var(--muted)]/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Trash2 className="w-4 h-4" />
                <span>Trash Bin</span>
              </div>
              <span className="text-[10px] opacity-75 font-mono">{counts.trash || 0}</span>
            </button>
          </div>

          <div className="pt-3 border-t border-[var(--border)] space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)] px-2">
              Filter by Source
            </div>
            <div className="flex flex-col gap-1 text-xs">
              <button
                onClick={() => setSelectedSource('all')}
                className={`text-left px-2.5 py-1.5 rounded-md transition-colors ${
                  selectedSource === 'all'
                    ? 'font-semibold text-[var(--foreground)] bg-[var(--muted)]/50'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                All Sources
              </button>
              <button
                onClick={() => setSelectedSource('Contact Form')}
                className={`text-left px-2.5 py-1.5 rounded-md transition-colors flex items-center justify-between ${
                  selectedSource === 'Contact Form'
                    ? 'font-semibold text-[var(--foreground)] bg-[var(--muted)]/50'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                <span>Contact Form</span>
                <Badge tone="lilac" variant="sm">Public</Badge>
              </button>
              <button
                onClick={() => setSelectedSource('Talk to Expert')}
                className={`text-left px-2.5 py-1.5 rounded-md transition-colors flex items-center justify-between ${
                  selectedSource === 'Talk to Expert'
                    ? 'font-semibold text-[var(--foreground)] bg-[var(--muted)]/50'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                <span>Talk to Expert</span>
                <Badge tone="success" variant="sm">VIP Lead</Badge>
              </button>
            </div>
          </div>
        </Card>

        {/* Middle Thread List (4 cols) */}
        <Card className="lg:col-span-4 p-3.5 space-y-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[var(--muted-foreground)]" />
            <input
              type="text"
              placeholder="Search conversations, names, emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            />
          </div>

          <div className="space-y-1.5 max-h-[560px] overflow-y-auto pr-0.5">
            {loading ? (
              <div className="py-12 text-center text-xs text-[var(--muted-foreground)]">
                Loading conversations...
              </div>
            ) : threads.length === 0 ? (
              <div className="py-12 text-center text-xs text-[var(--muted-foreground)]">
                No conversations found in {selectedFolder}.
              </div>
            ) : (
              threads.map((thread) => {
                const isSelected = thread.id === activeThread?.id;
                const latestMsg = thread.messages[thread.messages.length - 1];

                return (
                  <div
                    key={thread.id}
                    onClick={() => handleSelectThread(thread)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                      isSelected
                        ? 'border-[var(--primary)] bg-[var(--primary)]/5 shadow-xs'
                        : thread.unread
                        ? 'border-[var(--border)] bg-[var(--card)] font-medium shadow-2xs'
                        : 'border-transparent bg-[var(--muted)]/20 hover:bg-[var(--muted)]/40 opacity-90'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {thread.unread && (
                          <span className="w-2 h-2 rounded-full bg-[var(--primary)] shrink-0" />
                        )}
                        <span className="text-xs font-bold text-[var(--foreground)] truncate">
                          {thread.senderName}
                        </span>
                      </div>
                      <span className="text-[10px] text-[var(--muted-foreground)] shrink-0 font-mono">
                        {new Date(thread.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-medium text-[var(--foreground)] truncate">
                        {thread.subject}
                      </div>
                      <Badge
                        tone={thread.source === 'Talk to Expert' ? 'success' : 'neutral'}
                        variant="sm"
                      >
                        {thread.source}
                      </Badge>
                    </div>

                    <div className="text-[11px] text-[var(--muted-foreground)] line-clamp-2 leading-relaxed">
                      {latestMsg?.body || 'No message content.'}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Right Active Conversation & Composer Pane (5 cols) */}
        <Card className="lg:col-span-5 p-5 space-y-5">
          {!activeThread ? (
            <div className="py-24 text-center text-xs text-[var(--muted-foreground)]">
              Select a conversation to read message history and dispatch replies.
            </div>
          ) : (
            <div className="space-y-5">
              {/* Thread Header & Quick Actions */}
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border)] pb-3.5">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[var(--foreground)] truncate">
                      {activeThread.subject}
                    </h3>
                    <Badge
                      tone={activeThread.source === 'Talk to Expert' ? 'success' : 'lilac'}
                      variant="sm"
                    >
                      {activeThread.source}
                    </Badge>
                  </div>
                  <div className="text-xs text-[var(--muted-foreground)] flex items-center gap-2">
                    <span>From: {activeThread.senderName}</span>
                    <span>&bull;</span>
                    <span>{activeThread.senderEmail}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleToggleStar}
                    className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-amber-400 transition-colors"
                    title={activeThread.starred ? 'Starred' : 'Star message'}
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${
                        activeThread.starred ? 'fill-amber-400 text-amber-400' : ''
                      }`}
                    />
                  </button>
                  <button
                    onClick={() => handleMoveFolder('spam')}
                    className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-rose-500/10 text-[var(--muted-foreground)] hover:text-rose-500 transition-colors"
                    title="Move to Spam"
                  >
                    <AlertOctagon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleMoveFolder('trash')}
                    className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-red-500/10 text-[var(--muted-foreground)] hover:text-red-500 transition-colors"
                    title="Move to Trash"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Client Profile Details Card */}
              <div className="rounded-xl border border-[var(--border)] p-3 bg-[var(--muted)]/20 text-xs space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                  Inquiry Sender Context
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {activeThread.company && (
                    <div className="flex items-center gap-1.5 text-[var(--foreground)]">
                      <Building2 className="w-3 h-3 text-primary shrink-0" />
                      <span className="truncate">{activeThread.company}</span>
                    </div>
                  )}
                  {activeThread.senderPhone && (
                    <div className="flex items-center gap-1.5 text-[var(--foreground)]">
                      <Phone className="w-3 h-3 text-primary shrink-0" />
                      <span className="truncate">{activeThread.senderPhone}</span>
                    </div>
                  )}
                  {activeThread.websiteUrl && (
                    <div className="flex items-center gap-1.5 text-[var(--foreground)]">
                      <Globe className="w-3 h-3 text-primary shrink-0" />
                      <a
                        href={activeThread.websiteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate text-primary underline"
                      >
                        {activeThread.websiteUrl}
                      </a>
                    </div>
                  )}
                  {activeThread.budget && (
                    <div className="flex items-center gap-1.5 text-[var(--foreground)] font-semibold">
                      <DollarSign className="w-3 h-3 text-emerald-500 shrink-0" />
                      <span>{activeThread.budget}</span>
                    </div>
                  )}
                </div>

                {activeThread.services && activeThread.services.length > 0 && (
                  <div className="pt-1 flex flex-wrap gap-1">
                    {activeThread.services.map((svc) => (
                      <span
                        key={svc}
                        className="px-2 py-0.5 rounded-md bg-[var(--background)] border text-[10px] font-medium text-[var(--foreground)]"
                      >
                        {svc}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Message Thread History */}
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {activeThread.messages.map((msg, i) => {
                  const isStaff = msg.senderType === 'staff';
                  return (
                    <div
                      key={msg.id || i}
                      className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                        isStaff
                          ? 'border-[var(--primary)]/30 bg-[var(--primary)]/5 ml-4'
                          : 'border-[var(--border)] bg-[var(--card)] mr-4'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-[var(--foreground)] flex items-center gap-1.5">
                          {isStaff ? (
                            <CheckCheck className="w-3 h-3 text-primary" />
                          ) : (
                            <User className="w-3 h-3 text-neutral-400" />
                          )}
                          <span>{msg.senderName}</span>
                          <span className="text-[10px] font-normal text-[var(--muted-foreground)]">
                            ({msg.senderEmail})
                          </span>
                        </span>
                        <span className="text-[10px] font-mono text-[var(--muted-foreground)]">
                          {new Date(msg.sentAt).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="text-[11px] text-[var(--foreground)] whitespace-pre-wrap leading-relaxed">
                        {msg.body}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Email Composer Form */}
              <form onSubmit={handleSendReply} className="space-y-3 pt-3 border-t border-[var(--border)]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
                    <CornerDownLeft className="w-3.5 h-3.5 text-primary" />
                    <span>Direct Email Response</span>
                  </span>

                  {/* Template Picker */}
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <select
                      onChange={(e) => {
                        const tmpl = EMAIL_TEMPLATES.find((t) => t.label === e.target.value);
                        if (tmpl) handleApplyTemplate(tmpl.body);
                      }}
                      defaultValue=""
                      className="text-[11px] py-1 px-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]"
                    >
                      <option value="" disabled>Insert Quick Template...</option>
                      {EMAIL_TEMPLATES.map((t) => (
                        <option key={t.label} value={t.label}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <label className="text-[10px] text-[var(--muted-foreground)]">From Sender</label>
                    <input
                      type="text"
                      value={fromEmail}
                      onChange={(e) => setFromEmail(e.target.value)}
                      className="w-full text-xs px-2 py-1 rounded border border-[var(--border)] bg-[var(--background)]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[var(--muted-foreground)]">To Recipient</label>
                    <input
                      type="text"
                      disabled
                      value={activeThread.senderEmail}
                      className="w-full text-xs px-2 py-1 rounded border border-[var(--border)] bg-[var(--muted)]/50 opacity-80"
                    />
                  </div>
                </div>

                <Textarea
                  placeholder={`Write your response to ${activeThread.senderName}...`}
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  required
                />

                <div className="flex items-center justify-between pt-1">
                  <div className="text-[10px] text-[var(--muted-foreground)] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Dispatches directly to client inbox via system mailer</span>
                  </div>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={sendingReply || !replyText.trim()}
                    className="bg-[var(--primary)] text-white hover:opacity-90 font-medium"
                  >
                    <Send className={`w-3.5 h-3.5 mr-1.5 ${sendingReply ? 'animate-spin' : ''}`} />
                    {sendingReply ? 'Sending...' : 'Send Email Reply'}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
