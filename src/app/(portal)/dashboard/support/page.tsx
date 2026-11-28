"use client";

import React, { useMemo, useState } from "react";
import {
  CheckCircle2,
  HeadphonesIcon,
  MessageSquare,
  Plus,
  Search,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { formatDate } from "@/lib/formatters";
import {
  usePortalStore,
  type TicketPriority,
  type TicketStatus,
} from "../_data/portal-store";
import { StatusBadge } from "../_components/StatusBadge";

const TICKET_TABS: Array<{ value: "ALL" | TicketStatus; label: string }> = [
  { value: "ALL", label: "All" },
  { value: "OPEN", label: "Open" },
  { value: "AWAITING_REPLY", label: "Awaiting Reply" },
  { value: "RESOLVED", label: "Resolved" },
];

export default function PortalSupportPage() {
  const { state, createTicket, replyToTicket, updateTicketStatus } = usePortalStore();

  const [statusFilter, setStatusFilter] = useState<"ALL" | TicketStatus>("ALL");
  const [query, setQuery] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState<string>(
    () => state.tickets[0]?.id ?? ""
  );

  const [createOpen, setCreateOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [department, setDepartment] = useState("SEO & Analytics");
  const [priority, setPriority] = useState<TicketPriority>("MEDIUM");
  const [relatedOrderRef, setRelatedOrderRef] = useState("");
  const [body, setBody] = useState("");

  const [replyText, setReplyText] = useState("");

  const filteredTickets = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.tickets.filter((t) => {
      if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
      if (!q) return true;
      return (
        t.ticketNumber.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.department.toLowerCase().includes(q)
      );
    });
  }, [state.tickets, statusFilter, query]);

  const activeTicket =
    state.tickets.find((t) => t.id === selectedTicketId) ?? filteredTickets[0] ?? null;

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) return;
    const created = createTicket({
      subject: subject.trim(),
      department,
      priority,
      relatedOrderRef: relatedOrderRef.trim() || undefined,
      body: body.trim(),
    });
    setSelectedTicketId(created.id);
    setSubject("");
    setRelatedOrderRef("");
    setBody("");
    setCreateOpen(false);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !replyText.trim()) return;
    replyToTicket(activeTicket.id, replyText.trim());
    setReplyText("");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support Desk"
        subtitle="Open support tickets, collaborate with delivery specialists, and review ticket threads."
        actions={
          <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Create Ticket
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Ticket List */}
        <Card className="p-4 space-y-3 lg:col-span-1">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[var(--muted-foreground)]" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tickets..."
              className="pl-8"
            />
          </div>

          <Tabs
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as "ALL" | TicketStatus)}
          >
            <TabsList className="w-full flex-wrap">
              {TICKET_TABS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className="text-[11px]">
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {filteredTickets.length === 0 ? (
              <div className="py-8 text-center text-xs text-[var(--muted-foreground)]">
                No tickets found.
              </div>
            ) : (
              filteredTickets.map((t) => {
                const isSelected = activeTicket?.id === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTicketId(t.id)}
                    className={`w-full rounded-[var(--radius-control)] border p-3 text-left transition-colors ${
                      isSelected
                        ? "border-[var(--primary)] bg-[var(--accent)]"
                        : "border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] font-semibold text-[var(--primary-text)]">
                        {t.ticketNumber}
                      </span>
                      <StatusBadge status={t.status} size="sm" />
                    </div>
                    <div className="mt-1.5 text-xs font-semibold text-[var(--foreground)] line-clamp-2">
                      {t.subject}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-[var(--muted-foreground)]">
                      <span>{t.department}</span>
                      <span>{formatDate(t.updatedAt)}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </Card>

        {/* Ticket Conversation Thread */}
        <Card className="p-5 lg:col-span-2 flex flex-col justify-between min-h-[520px]">
          {activeTicket ? (
            <>
              <div>
                <div className="flex flex-col gap-3 border-b border-[var(--border)] pb-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-[var(--primary-text)]">
                        {activeTicket.ticketNumber}
                      </span>
                      <StatusBadge status={activeTicket.status} size="sm" />
                      <StatusBadge status={activeTicket.priority} size="sm" />
                    </div>
                    <h3 className="mt-1.5 text-base font-semibold text-[var(--foreground)]">
                      {activeTicket.subject}
                    </h3>
                    <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                      Department: {activeTicket.department}
                      {activeTicket.relatedOrderRef
                        ? ` · Order: ${activeTicket.relatedOrderRef}`
                        : ""}
                    </p>
                  </div>

                  {activeTicket.status !== "RESOLVED" &&
                  activeTicket.status !== "CLOSED" ? (
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => updateTicketStatus(activeTicket.id, "RESOLVED")}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-[var(--success)]" />
                      Mark Resolved
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => updateTicketStatus(activeTicket.id, "OPEN")}
                    >
                      Reopen Ticket
                    </Button>
                  )}
                </div>

                {/* Messages */}
                <div className="my-4 space-y-3 max-h-[360px] overflow-y-auto pr-1">
                  {activeTicket.messages.map((msg) => {
                    const isUser = msg.senderType === "USER";
                    return (
                      <div
                        key={msg.id}
                        className={`rounded-[var(--radius-control)] border p-3.5 ${
                          isUser
                            ? "border-[var(--border)] bg-[var(--muted)]/50 ml-4"
                            : "border-[var(--insight-border)] bg-[var(--insight-surface)]/70 mr-4"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-xs font-semibold text-[var(--foreground)]">
                            {msg.senderName}
                          </span>
                          <span className="font-mono text-[10px] text-[var(--muted-foreground)]">
                            {formatDate(msg.createdAt, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--foreground)] leading-relaxed whitespace-pre-wrap">
                          {msg.body}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reply Composer */}
              <form
                onSubmit={handleSendReply}
                className="border-t border-[var(--border)] pt-4 space-y-2.5"
              >
                <Textarea
                  label="Reply to Ticket"
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write your reply..."
                />
                <div className="flex justify-end">
                  <Button type="submit" variant="primary" size="sm" disabled={!replyText.trim()}>
                    <Send className="h-3.5 w-3.5" />
                    Send Reply
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-center py-12">
              <HeadphonesIcon className="h-8 w-8 text-[var(--muted-foreground)] mb-2" />
              <div className="text-sm font-medium text-[var(--foreground)]">
                Select a ticket to view conversation
              </div>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                Or create a new support ticket to reach our team.
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Create Ticket Modal */}
      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Support Ticket"
        maxWidth="540px"
      >
        <form onSubmit={handleCreateTicket} className="space-y-4">
          <Input
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Brief summary of your request"
            required
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select
              label="Department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              <option value="SEO & Analytics">SEO &amp; Analytics</option>
              <option value="SMM Fulfillment">SMM Fulfillment</option>
              <option value="Billing & Accounts">Billing &amp; Accounts</option>
              <option value="Technical Support">Technical Support</option>
            </Select>

            <Select
              label="Priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TicketPriority)}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </Select>
          </div>

          <Input
            label="Related Order Reference (optional)"
            value={relatedOrderRef}
            onChange={(e) => setRelatedOrderRef(e.target.value)}
            placeholder="e.g. WS-2026-1042 or SMM-7704"
          />

          <Textarea
            label="Message"
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Describe your question or issue in detail..."
            required
          />

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
            <Button variant="outline" size="sm" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              <MessageSquare className="h-3.5 w-3.5" />
              Submit Ticket
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
