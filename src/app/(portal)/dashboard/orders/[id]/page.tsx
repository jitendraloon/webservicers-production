"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck,
  FileText,
  HeadphonesIcon,
  Layers,
  MessageSquare,
  Receipt,
  Save,
  Send,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Modal } from "@/components/ui/Modal";
import { formatDate, formatMoney } from "@/lib/formatters";
import { usePortalStore } from "../../_data/portal-store";
import { StatusBadge } from "../../_components/StatusBadge";
import type { AdminOrderConversationMessage, AdminRequirementField } from "@/lib/admin-types";

export default function PortalOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const { state } = usePortalStore();

  const order = state.orders.find(
    (o) => o.id === params?.id || o.reference === params?.id
  ) || {
    id: params?.id || "ord_1001",
    reference: (params?.id?.startsWith("WS-") ? params.id : `WS-2026-${params?.id || "1048"}`),
    serviceName: "Managed Growth Service",
    serviceSlug: "managed-growth",
    tierName: "Growth" as const,
    billingCycle: "MONTHLY" as const,
    status: "IN_PROGRESS" as const,
    totalCents: 149800,
    currency: "USD",
    invoiceId: "inv_1001",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    brief: {},
    notes: "Order fulfilled by WebServicers dedicated pod.",
    deliverables: [],
    timeline: [
      { step: "Order Intake", label: "Order Intake & Payment", description: "Order confirmed and processed", timestamp: new Date().toISOString(), completed: true },
      { step: "Brief & Requirements", label: "Project Requirements", description: "Collect service requirements", timestamp: new Date().toISOString(), completed: true, current: true },
      { step: "Fulfillment", label: "Pod Execution", description: "Service configuration in progress", timestamp: null, completed: false },
      { step: "Review", label: "Final Delivery & QA", description: "Review reports & assets", timestamp: null, completed: false },
    ],
  };

  const linkedInvoice = state.invoices.find(
    (inv) => inv.id === order.invoiceId || inv.orderId === order.id
  );

  const [activeTab, setActiveTab] = useState<"overview" | "requirements" | "conversation">("overview");

  // Requirements state
  const [reqFields, setReqFields] = useState<AdminRequirementField[]>([]);
  const [reqResponses, setReqResponses] = useState<Record<string, string>>({});
  const [reqStatus, setReqStatus] = useState<string>("PENDING");
  const [revisionNotes, setRevisionNotes] = useState<string>("");
  const [savingReqs, setSavingReqs] = useState(false);

  // Conversation state
  const [messages, setMessages] = useState<AdminOrderConversationMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);

  // Cancellation modal
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [submittingCancel, setSubmittingCancel] = useState(false);

  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    // Fetch requirements for this order
    fetch(`/api/orders/${order.id}/requirements`)
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) {
          setReqFields(json.fields || []);
          if (json.responses) setReqResponses(json.responses);
          if (json.status) setReqStatus(json.status);
          if (json.revisionNotes) setRevisionNotes(json.revisionNotes);
        }
      })
      .catch(() => {});

    // Fetch conversations
    fetch(`/api/orders/${order.id}/conversations`)
      .then((r) => r.json())
      .then((json) => {
        if (json.ok && json.conversations) {
          // Hide internal notes from customer
          setMessages(json.conversations.filter((m: AdminOrderConversationMessage) => !m.isInternalNote));
        }
      })
      .catch(() => {});
  }, [order.id]);

  const handleSaveRequirements = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingReqs(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/requirements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responses: reqResponses,
          submittedBy: "Client Portal User",
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setReqResponses(json.responses);
        setReqStatus(json.status);
        setToast("Your project requirements have been submitted for review!");
        setTimeout(() => setToast(null), 3500);
      }
    } finally {
      setSavingReqs(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setSendingMsg(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: chatInput.trim(),
          senderName: "Client",
          senderRole: "CLIENT",
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setMessages((prev) => [...prev, json.message]);
        setChatInput("");
      }
    } finally {
      setSendingMsg(false);
    }
  };

  const handleSubmitCancellation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelReason.trim()) return;
    setSubmittingCancel(true);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: order.id,
          cancellationRequested: true,
          cancellationReason: cancelReason.trim(),
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setToast("Cancellation request submitted to support for review.");
        setIsCancelModalOpen(false);
        setCancelReason("");
        setTimeout(() => setToast(null), 4000);
      }
    } finally {
      setSubmittingCancel(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Order ${order.reference}`}
        subtitle={`${order.serviceName} · ${order.tierName} Tier (${order.billingCycle})`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/dashboard/orders">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-3.5 w-3.5" />
                All Orders
              </Button>
            </Link>
            {linkedInvoice ? (
              <Link href={`/dashboard/billing/${linkedInvoice.id}`}>
                <Button variant="primary" size="sm">
                  <Receipt className="h-3.5 w-3.5" />
                  View Invoice
                </Button>
              </Link>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCancelModalOpen(true)}
              className="text-[var(--danger)] hover:bg-[var(--danger-subtle)]"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Request Cancellation
            </Button>
          </div>
        }
      />

      {toast && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 text-xs font-medium text-[var(--success)] flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="h-4 w-4" />
          {toast}
        </div>
      )}

      {/* Order Summary Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <span className="text-[11px] text-[var(--muted-foreground)]">Status</span>
          <div className="mt-2">
            <StatusBadge status={order.status} />
          </div>
        </Card>
        <Card className="p-4">
          <span className="text-[11px] text-[var(--muted-foreground)]">Order Total</span>
          <div className="mt-1.5 text-lg font-semibold font-mono text-[var(--foreground)]">
            {formatMoney(order.totalCents, order.currency)}
          </div>
        </Card>
        <Card className="p-4">
          <span className="text-[11px] text-[var(--muted-foreground)]">Requirements</span>
          <div className="mt-1.5 flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                reqStatus === "APPROVED"
                  ? "bg-[var(--success-subtle)] text-[var(--success)]"
                  : reqStatus === "SUBMITTED"
                  ? "bg-[var(--primary)]/10 text-[var(--primary-text)]"
                  : "bg-[var(--muted)] text-[var(--muted-foreground)]"
              }`}
            >
              {reqStatus.replace(/_/g, " ")}
            </span>
          </div>
        </Card>
        <Card className="p-4">
          <span className="text-[11px] text-[var(--muted-foreground)]">Placed On</span>
          <div className="mt-1.5 text-xs font-medium text-[var(--foreground)]">
            {formatDate(order.createdAt)}
          </div>
        </Card>
      </div>

      {/* Tabs Bar */}
      <div className="border-b border-[var(--border)] flex items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === "overview"
              ? "border-[var(--primary)] text-[var(--primary-text)] font-semibold"
              : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          Overview & Timeline
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("requirements")}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === "requirements"
              ? "border-[var(--primary)] text-[var(--primary-text)] font-semibold"
              : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
        >
          <FileCheck className="h-3.5 w-3.5" />
          Project Requirements
          <span className="rounded-full bg-[var(--accent)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--primary-text)]">
            {reqStatus}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("conversation")}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === "conversation"
              ? "border-[var(--primary)] text-[var(--primary-text)] font-semibold"
              : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Order Messages
          <span className="rounded-full bg-[var(--muted)] px-1.5 py-0.5 text-[10px] font-semibold">
            {messages.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Overview & Timeline */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <Card className="p-5 lg:col-span-2 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-[var(--foreground)]">
                Fulfillment Timeline
              </h3>
              <p className="text-xs text-[var(--muted-foreground)]">
                Live progress from order intake through final delivery
              </p>
            </div>
            <ol className="relative space-y-5 border-l border-[var(--border)] ml-2.5 pl-5">
              {order.timeline.map((step, idx) => (
                <li key={idx} className="relative">
                  <span
                    className={`absolute -left-[29px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full border ${
                      step.completed
                        ? "bg-[var(--success-subtle)] border-[var(--success)] text-[var(--success)]"
                        : "bg-[var(--muted)] border-[var(--border)] text-[var(--muted-foreground)]"
                    }`}
                  >
                    {step.completed ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <Clock className="h-2.5 w-2.5" />
                    )}
                  </span>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[var(--foreground)]">
                      {step.label}
                      {step.current ? (
                        <span className="ml-2 rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] font-medium text-[var(--primary-text)]">
                          Current Stage
                        </span>
                      ) : null}
                    </span>
                    {step.timestamp ? (
                      <span className="font-mono text-[11px] text-[var(--muted-foreground)]">
                        {formatDate(step.timestamp)}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    {step.description}
                  </p>
                </li>
              ))}
            </ol>
          </Card>

          <Card className="p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-[var(--foreground)]">
                Deliverables & Reports
              </h3>
              <p className="text-xs text-[var(--muted-foreground)]">
                Published files and assets
              </p>
            </div>
            {order.deliverables.length === 0 ? (
              <div className="rounded-[var(--radius-control)] border border-dashed border-[var(--border)] p-4 text-center">
                <p className="text-xs text-[var(--muted-foreground)]">
                  No deliverables published yet. Your team will upload reports here.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {order.deliverables.map((del) => (
                  <div
                    key={del.id}
                    className="flex items-start justify-between gap-3 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--muted)]/50 p-3"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <FileText className="h-4 w-4 text-[var(--primary-text)] shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-[var(--foreground)] truncate">
                          {del.title}
                        </div>
                        <div className="text-[11px] text-[var(--muted-foreground)]">
                          {del.type} · {formatDate(del.addedAt)}
                        </div>
                      </div>
                    </div>
                    <Link href={del.url} target="_blank">
                      <Button variant="outline" size="xs">
                        Open
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Tab 2: Project Requirements Tab */}
      {activeTab === "requirements" && (
        <Card className="p-6 max-w-3xl space-y-5">
          <div className="border-b border-[var(--border)] pb-3">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">
              Fulfillment Requirements
            </h3>
            <p className="text-xs text-[var(--muted-foreground)]">
              Please provide the onboarding information required for our team to begin your service.
            </p>
          </div>

          {revisionNotes && (
            <div className="rounded-lg border border-[var(--warning)]/50 bg-[var(--warning)]/10 p-3.5 text-xs text-[var(--foreground)] space-y-1">
              <div className="font-semibold text-[var(--warning)] flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" />
                Action Required from Operations
              </div>
              <p>{revisionNotes}</p>
            </div>
          )}

          <form onSubmit={handleSaveRequirements} className="space-y-4">
            {reqFields.map((field) => {
              const key = field.key || field.label.toLowerCase().replace(/[^a-z0-9]+/g, "_");
              const val = reqResponses[key] ?? "";

              return (
                <div key={field.id} className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--foreground)] flex items-center justify-between">
                    <span>
                      {field.label} {field.required && <span className="text-[var(--danger)]">*</span>}
                    </span>
                    <span className="text-[10px] text-[var(--muted-foreground)] capitalize">
                      {field.fieldType}
                    </span>
                  </label>

                  {field.fieldType === "textarea" ? (
                    <textarea
                      rows={3}
                      value={val}
                      onChange={(e) =>
                        setReqResponses((prev) => ({ ...prev, [key]: e.target.value }))
                      }
                      placeholder={field.placeholder || "Enter details..."}
                      className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                    />
                  ) : (
                    <input
                      type={field.fieldType === "url" ? "url" : "text"}
                      value={val}
                      onChange={(e) =>
                        setReqResponses((prev) => ({ ...prev, [key]: e.target.value }))
                      }
                      placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                      className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                    />
                  )}
                </div>
              );
            })}

            <div className="pt-3 border-t border-[var(--border)] flex justify-end">
              <Button type="submit" variant="primary" size="sm" disabled={savingReqs}>
                <Save className="h-3.5 w-3.5" />
                {savingReqs ? "Saving Requirements..." : "Save & Submit Requirements"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Tab 3: Order Conversation Tab */}
      {activeTab === "conversation" && (
        <Card className="p-6 max-w-3xl space-y-5">
          <div className="border-b border-[var(--border)] pb-3">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">
              Order Conversation
            </h3>
            <p className="text-xs text-[var(--muted-foreground)]">
              Direct communication thread with your dedicated fulfillment and support team.
            </p>
          </div>

          <div className="space-y-3.5 min-h-[250px] max-h-[450px] overflow-y-auto pr-2">
            {messages.length === 0 ? (
              <div className="py-12 text-center text-xs text-[var(--muted-foreground)]">
                No messages yet. Send a message to your assigned team below!
              </div>
            ) : (
              messages.map((msg) => {
                const isCustomer = msg.senderRole === "CLIENT";
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isCustomer ? "items-end" : "items-start"}`}
                  >
                    <div className="flex items-center gap-1.5 text-[11px] text-[var(--muted-foreground)] mb-1">
                      <span className="font-semibold text-[var(--foreground)]">
                        {isCustomer ? "You" : msg.senderName}
                      </span>
                      <span>· {formatDate(msg.createdAt)}</span>
                    </div>

                    <div
                      className={`rounded-xl px-4 py-2.5 text-xs max-w-md leading-relaxed ${
                        isCustomer
                          ? "bg-[var(--primary)] text-white font-medium"
                          : "bg-[var(--muted)] text-[var(--foreground)] border border-[var(--border)]"
                      }`}
                    >
                      {msg.message}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form onSubmit={handleSendMessage} className="flex gap-2 pt-3 border-t border-[var(--border)]">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask a question or provide an update about this order..."
              className="flex-1 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            />
            <Button type="submit" variant="primary" size="sm" disabled={sendingMsg || !chatInput.trim()}>
              <Send className="h-3.5 w-3.5" />
              Send
            </Button>
          </form>
        </Card>
      )}

      {/* Cancellation Request Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Request Order Cancellation"
      >
        <form onSubmit={handleSubmitCancellation} className="space-y-4">
          <p className="text-xs text-[var(--muted-foreground)]">
            Please share the reason you are requesting a cancellation. Our fulfillment supervisor will review your request in accordance with our service terms.
          </p>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Reason for Cancellation</label>
            <textarea
              required
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Please explain why you want to cancel this order..."
              className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCancelModalOpen(false)}
            >
              Back
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              disabled={submittingCancel || !cancelReason.trim()}
            >
              {submittingCancel ? "Submitting..." : "Confirm Cancellation Request"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
