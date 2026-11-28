"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck,
  FileText,
  Layers,
  Lock,
  Mail,
  MessageSquare,
  Package,
  Receipt,
  RefreshCw,
  Send,
  Sparkles,
  User,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { formatDate, formatMoney } from "@/lib/formatters";
import type {
  AdminOrder,
  AdminOrderConversationMessage,
  AdminOrderStatus,
  AdminRequirementField,
} from "@/lib/admin-types";

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const orderId = params?.id;

  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "requirements" | "conversation" | "invoices">("overview");

  // Requirements state
  const [reqFields, setReqFields] = useState<AdminRequirementField[]>([]);
  const [reqResponses, setReqResponses] = useState<Record<string, string>>({});
  const [reqStatus, setReqStatus] = useState<string>("PENDING");
  const [revisionNotes, setRevisionNotes] = useState<string>("");
  const [savingReqs, setSavingReqs] = useState(false);

  // Conversation state
  const [messages, setMessages] = useState<AdminOrderConversationMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);

  // Status edit
  const [currentStatus, setCurrentStatus] = useState<AdminOrderStatus>("PENDING");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const fetchOrder = async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders");
      const json = await res.json();
      if (json.ok) {
        const found = json.orders.find(
          (o: AdminOrder) => o.id === orderId || o.reference === orderId
        );
        if (found) {
          setOrder(found);
          setCurrentStatus(found.status);
          setMessages(found.conversations || []);
          setReqResponses(found.requirementResponses || {});
          setReqStatus(found.requirementsStatus || "PENDING");
        }
      }

      // Fetch requirements
      const reqRes = await fetch(`/api/orders/${orderId}/requirements`);
      if (reqRes.ok) {
        const reqJson = await reqRes.json();
        if (reqJson.ok) {
          setReqFields(reqJson.fields || []);
          if (reqJson.responses) setReqResponses(reqJson.responses);
          if (reqJson.status) setReqStatus(reqJson.status);
          if (reqJson.revisionNotes) setRevisionNotes(reqJson.revisionNotes);
        }
      }

      // Fetch conversation thread
      const convRes = await fetch(`/api/orders/${orderId}/conversations`);
      if (convRes.ok) {
        const convJson = await convRes.json();
        if (convJson.ok && convJson.conversations) {
          setMessages(convJson.conversations);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const handleUpdateStatus = async (newStatus: AdminOrderStatus) => {
    if (!order) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: order.id, status: newStatus }),
      });
      const json = await res.json();
      if (json.ok) {
        setOrder(json.order);
        setCurrentStatus(json.order.status);
        setToast(`Order status updated to ${newStatus}`);
        setTimeout(() => setToast(null), 3000);
      }
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !order) return;
    setSendingMsg(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: chatInput.trim(),
          senderName: "Operations Support",
          senderRole: "ADMIN",
          isInternalNote,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setMessages((prev) => [...prev, json.message]);
        setChatInput("");
        setIsInternalNote(false);
      }
    } finally {
      setSendingMsg(false);
    }
  };

  const handleRequirementsDecision = async (action: "approve" | "request_revision") => {
    if (!order) return;
    setSavingReqs(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/requirements`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          notes: revisionNotes,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setReqStatus(json.status);
        setToast(
          action === "approve"
            ? "Requirements approved! Fulfillment initiated."
            : "Revision request dispatched to client conversation."
        );
        setTimeout(() => setToast(null), 3500);
        // Refresh conversations to see the audit note
        const convRes = await fetch(`/api/orders/${order.id}/conversations`);
        if (convRes.ok) {
          const convJson = await convRes.json();
          if (convJson.ok) setMessages(convJson.conversations);
        }
      }
    } finally {
      setSavingReqs(false);
    }
  };

  const handleSaveRequirementsValues = async () => {
    if (!order) return;
    setSavingReqs(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/requirements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responses: reqResponses,
          submittedBy: "Admin Operations",
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setReqResponses(json.responses);
        setReqStatus(json.status);
        setToast("Requirement answers saved successfully.");
        setTimeout(() => setToast(null), 3000);
      }
    } finally {
      setSavingReqs(false);
    }
  };

  if (loading && !order) {
    return (
      <div className="p-10 text-center text-xs text-[var(--muted-foreground)]">
        <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 opacity-60" />
        Loading order workspace...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Order Not Found"
          subtitle="The requested order reference could not be located."
          actions={
            <Link href="/admin/orders" className="cpki-btn cpki-btn-outline cpki-btn-sm">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Orders
            </Link>
          }
        />
      </div>
    );
  }

  const statusTone: Record<AdminOrderStatus, BadgeTone> = {
    PENDING: "neutral",
    AWAITING_BRIEF: "warning",
    IN_PROGRESS: "primary",
    IN_REVIEW: "lilac",
    COMPLETED: "success",
    CANCELLED: "danger",
    REFUNDED: "danger",
  };

  return (
    <div className="space-y-5">
      {/* Header with Quick Actions */}
      <PageHeader
        title={
          <div className="flex items-center gap-2.5">
            <span className="font-mono">{order.reference}</span>
            <Badge tone={statusTone[order.status]} variant="sm">
              {order.status.replace(/_/g, " ")}
            </Badge>
          </div>
        }
        subtitle={`${order.customerName} (${order.customerEmail}) · Placed on ${formatDate(order.createdAt)}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/admin/orders" className="cpki-btn cpki-btn-outline cpki-btn-sm">
              <ArrowLeft className="h-3.5 w-3.5" />
              All Orders
            </Link>

            <select
              value={currentStatus}
              disabled={updatingStatus}
              onChange={(e) => handleUpdateStatus(e.target.value as AdminOrderStatus)}
              className="cpki-select text-xs h-[32px] font-medium"
            >
              <option value="PENDING">Status: Pending</option>
              <option value="AWAITING_BRIEF">Status: Awaiting Brief</option>
              <option value="IN_PROGRESS">Status: In Progress</option>
              <option value="IN_REVIEW">Status: In Review</option>
              <option value="COMPLETED">Status: Completed</option>
              <option value="CANCELLED">Status: Cancelled</option>
              <option value="REFUNDED">Status: Refunded</option>
            </select>
          </div>
        }
      />

      {toast && (
        <div className="cpki-card-insight px-4 py-2.5 text-xs font-medium text-[var(--insight-foreground)] flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />
          {toast}
        </div>
      )}

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="cpki-card p-4">
          <div className="text-[11px] text-[var(--muted-foreground)]">Order Total</div>
          <div className="mt-1 text-xl font-semibold tabular-nums font-mono">
            {formatMoney(order.totalCents, order.currency)}
          </div>
          <div className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
            {order.paymentMethod} · {order.paymentStatus}
          </div>
        </div>

        <div className="cpki-card p-4">
          <div className="text-[11px] text-[var(--muted-foreground)]">Primary Service</div>
          <div className="mt-1 text-sm font-semibold truncate">
            {order.items[0]?.productName || "Managed Package"}
          </div>
          <div className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
            {order.items[0]?.packageName} Tier ({order.items[0]?.billingCycle})
          </div>
        </div>

        <div className="cpki-card p-4">
          <div className="text-[11px] text-[var(--muted-foreground)]">Project Requirements</div>
          <div className="mt-1">
            <Badge
              tone={
                reqStatus === "APPROVED"
                  ? "success"
                  : reqStatus === "SUBMITTED"
                  ? "primary"
                  : reqStatus === "REVISION_REQUESTED"
                  ? "warning"
                  : "neutral"
              }
              variant="sm"
            >
              {reqStatus.replace(/_/g, " ")}
            </Badge>
          </div>
          <div className="text-[11px] text-[var(--muted-foreground)] mt-1">
            {Object.keys(reqResponses).length} fields provided
          </div>
        </div>

        <div className="cpki-card p-4">
          <div className="text-[11px] text-[var(--muted-foreground)]">Linked Invoice</div>
          <div className="mt-1 font-mono text-xs font-semibold text-[var(--primary-text)]">
            {order.invoiceNumber || "INV-PENDING"}
          </div>
          <div className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
            Issued {formatDate(order.createdAt)}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
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
          Overview & Items
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
          <span className="cpki-badge-sm bg-[var(--accent)] text-[var(--primary-text)]">
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
          Order Conversation
          <span className="cpki-badge-sm bg-[var(--muted)] text-[var(--foreground)]">
            {messages.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("invoices")}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === "invoices"
              ? "border-[var(--primary)] text-[var(--primary-text)] font-semibold"
              : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
        >
          <Receipt className="h-3.5 w-3.5" />
          Invoicing & Billing
        </button>
      </div>

      {/* Tab 1: Overview & Items */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-5">
            {/* Items list */}
            <div className="cpki-card p-5 space-y-4">
              <div className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider">
                Ordered Services & Deliverables
              </div>
              <div className="divide-y divide-[var(--border)]">
                {order.items.map((item) => (
                  <div key={item.id} className="py-3.5 flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="text-xs font-semibold">{item.productName}</div>
                      <div className="text-[11px] text-[var(--muted-foreground)]">
                        {item.packageName} Tier · {item.billingCycle} billing · Qty: {item.quantity}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-xs font-semibold">
                        {formatMoney(item.unitPriceCents * item.quantity, order.currency)}
                      </div>
                      <div className="text-[10.5px] text-[var(--muted-foreground)]">
                        {formatMoney(item.unitPriceCents, order.currency)} each
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-[var(--border)] pt-3 flex justify-between text-xs font-semibold">
                <span>Total Amount Charged</span>
                <span className="font-mono">{formatMoney(order.totalCents, order.currency)}</span>
              </div>
            </div>

            {/* Lifecycle Timeline */}
            <div className="cpki-card p-5 space-y-4">
              <div className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider">
                Fulfillment & Audit Lifecycle
              </div>
              <ol className="relative space-y-4 border-l border-[var(--border)] ml-3 pl-4 text-xs">
                {order.lifecycle.map((lc) => (
                  <li key={lc.id} className="relative">
                    <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-[var(--primary)] ring-4 ring-[var(--card)]" />
                    <div className="font-semibold text-[var(--foreground)]">{lc.action}</div>
                    <div className="text-[11px] text-[var(--muted-foreground)]">
                      {formatDate(lc.at)} · Actor: {lc.actor}
                    </div>
                    {lc.note && (
                      <div className="mt-1 text-[11px] text-[var(--foreground)] bg-[var(--muted)]/50 p-2 rounded">
                        {lc.note}
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Client Details Sidebar */}
          <div className="space-y-5">
            <div className="cpki-card p-5 space-y-3.5 text-xs">
              <div className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-[var(--primary-text)]" />
                Client Profile
              </div>
              <div className="space-y-2">
                <div>
                  <div className="text-[11px] text-[var(--muted-foreground)]">Customer Name</div>
                  <div className="font-semibold">{order.customerName}</div>
                </div>
                <div>
                  <div className="text-[11px] text-[var(--muted-foreground)]">Email</div>
                  <div className="font-mono text-[11px]">{order.customerEmail}</div>
                </div>
                <div>
                  <div className="text-[11px] text-[var(--muted-foreground)]">Client ID</div>
                  <div className="font-mono text-[11px]">{order.customerId}</div>
                </div>
                <div>
                  <div className="text-[11px] text-[var(--muted-foreground)]">Payment Method</div>
                  <div>{order.paymentMethod} ({order.paymentStatus})</div>
                </div>
              </div>
            </div>

            <div className="cpki-card p-5 space-y-3 text-xs">
              <div className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider">
                Initial Checkout Brief
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-[11px] text-[var(--muted-foreground)]">Target Domain:</span>
                  <div className="font-mono text-[11px] break-all">{order.brief?.domain || "None"}</div>
                </div>
                <div>
                  <span className="text-[11px] text-[var(--muted-foreground)]">Target Market:</span>
                  <div>{order.brief?.targetMarket || "None"}</div>
                </div>
                <div>
                  <span className="text-[11px] text-[var(--muted-foreground)]">Primary Goals:</span>
                  <div>{order.brief?.goals || "None"}</div>
                </div>
                {order.brief?.notes && (
                  <div>
                    <span className="text-[11px] text-[var(--muted-foreground)]">Client Notes:</span>
                    <div className="italic bg-[var(--muted)]/40 p-2 rounded">{order.brief.notes}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Project Requirements Tab */}
      {activeTab === "requirements" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 cpki-card p-5 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
              <div>
                <div className="text-sm font-semibold text-[var(--foreground)]">
                  Service Requirements Checklist
                </div>
                <div className="text-xs text-[var(--muted-foreground)]">
                  These requirements are established individually per ordered service.
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveRequirementsValues}
                  disabled={savingReqs}
                  className="cpki-btn cpki-btn-outline cpki-btn-xs"
                >
                  Save Answers
                </button>
                <button
                  type="button"
                  onClick={() => handleRequirementsDecision("approve")}
                  disabled={savingReqs}
                  className="cpki-btn cpki-btn-primary cpki-btn-xs"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  Approve Requirements
                </button>
              </div>
            </div>

            {/* Requirement Fields Bank for this service */}
            <div className="space-y-4">
              {reqFields.map((field) => {
                const key = field.key || field.label.toLowerCase().replace(/[^a-z0-9]+/g, "_");
                const val = reqResponses[key] ?? "";

                return (
                  <div key={field.id} className="space-y-1.5 p-3 rounded-lg border border-[var(--border)] bg-[var(--card)]">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-[var(--foreground)]">
                        {field.label} {field.required && <span className="text-[var(--danger)]">*</span>}
                      </label>
                      <Badge tone={field.required ? "warning" : "neutral"} variant="sm">
                        {field.fieldType}
                      </Badge>
                    </div>

                    {field.fieldType === "textarea" ? (
                      <textarea
                        rows={3}
                        value={val}
                        onChange={(e) =>
                          setReqResponses((prev) => ({ ...prev, [key]: e.target.value }))
                        }
                        placeholder={field.placeholder || "Enter details..."}
                        className="cpki-textarea w-full text-xs"
                      />
                    ) : (
                      <input
                        type={field.fieldType === "url" ? "url" : "text"}
                        value={val}
                        onChange={(e) =>
                          setReqResponses((prev) => ({ ...prev, [key]: e.target.value }))
                        }
                        placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                        className="cpki-input w-full text-xs"
                      />
                    )}

                    <div className="text-[10.5px] text-[var(--muted-foreground)] font-mono">
                      Field key: {key}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Requirements Review & Revision Actions */}
          <div className="space-y-5">
            <div className="cpki-card p-5 space-y-3.5 text-xs">
              <div className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider">
                Review & Verification Status
              </div>

              <div className="p-3 rounded-lg bg-[var(--muted)]/50 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[var(--muted-foreground)]">Status:</span>
                  <Badge
                    tone={
                      reqStatus === "APPROVED"
                        ? "success"
                        : reqStatus === "SUBMITTED"
                        ? "primary"
                        : "warning"
                    }
                    variant="sm"
                  >
                    {reqStatus}
                  </Badge>
                </div>
                <div className="text-[11px] text-[var(--muted-foreground)]">
                  {reqStatus === "APPROVED"
                    ? "Requirements have been signed off. Operations team has the necessary assets to execute."
                    : "Client submission awaiting full technical check or revisions."}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                <label className="text-xs font-semibold">Request Revisions Note</label>
                <textarea
                  rows={3}
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  placeholder="e.g. Please provide your Google Analytics property access or correct domain DNS credentials..."
                  className="cpki-textarea w-full text-xs"
                />
                <button
                  type="button"
                  disabled={savingReqs}
                  onClick={() => handleRequirementsDecision("request_revision")}
                  className="cpki-btn cpki-btn-outline cpki-btn-sm w-full text-[var(--warning)] border-[var(--warning)]"
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Request Revisions from Client
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Order Conversation Tab */}
      {activeTab === "conversation" && (
        <div className="cpki-card p-5 space-y-5 max-w-4xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
            <div>
              <div className="text-sm font-semibold text-[var(--foreground)]">
                Order Communication Thread
              </div>
              <div className="text-xs text-[var(--muted-foreground)]">
                Direct messages between client and assigned fulfillment team for order {order.reference}.
              </div>
            </div>
            <span className="text-xs font-mono text-[var(--muted-foreground)]">
              {messages.length} messages
            </span>
          </div>

          {/* Message List */}
          <div className="space-y-3.5 min-h-[300px] max-h-[500px] overflow-y-auto pr-2">
            {messages.length === 0 ? (
              <div className="py-16 text-center text-xs text-[var(--muted-foreground)]">
                No messages yet. Send a kickoff greeting or fulfillment update below.
              </div>
            ) : (
              messages.map((msg) => {
                const isAdmin = msg.senderRole === "ADMIN";
                const isSys = msg.senderRole === "SYSTEM";

                if (isSys) {
                  return (
                    <div key={msg.id} className="text-center my-3">
                      <span className="inline-block rounded-full bg-[var(--muted)] px-3 py-1 text-[11px] text-[var(--muted-foreground)] font-mono border border-[var(--border)]">
                        ⚙️ {msg.message} · {formatDate(msg.createdAt)}
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isAdmin ? "items-end" : "items-start"}`}
                  >
                    <div className="flex items-center gap-1.5 text-[11px] text-[var(--muted-foreground)] mb-1">
                      <span className="font-semibold text-[var(--foreground)]">{msg.senderName}</span>
                      <span>({msg.senderRole})</span>
                      {msg.isInternalNote && (
                        <span className="cpki-badge-sm bg-[var(--warning)]/20 text-[var(--warning)] border border-[var(--warning)]/40">
                          <Lock className="h-2.5 w-2.5 inline mr-1" />
                          Internal Staff Note
                        </span>
                      )}
                      <span>· {formatDate(msg.createdAt)}</span>
                    </div>

                    <div
                      className={`rounded-xl px-4 py-2.5 text-xs max-w-lg leading-relaxed ${
                        msg.isInternalNote
                          ? "bg-[var(--warning)]/10 text-[var(--foreground)] border border-[var(--warning)]/30 font-sans"
                          : isAdmin
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

          {/* Composer */}
          <form onSubmit={handleSendMessage} className="space-y-3 pt-3 border-t border-[var(--border)]">
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                <input
                  type="checkbox"
                  checked={isInternalNote}
                  onChange={(e) => setIsInternalNote(e.target.checked)}
                />
                <span className="font-medium">
                  Post as Internal Staff Note (hidden from client)
                </span>
              </label>
            </div>

            <div className="flex gap-2">
              <textarea
                rows={2}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={
                  isInternalNote
                    ? "Write an internal team note regarding this order..."
                    : "Write a message to the customer regarding this order..."
                }
                className="cpki-textarea flex-1 text-xs"
              />
              <button
                type="submit"
                disabled={sendingMsg || !chatInput.trim()}
                className={`cpki-btn ${
                  isInternalNote ? "cpki-btn-outline" : "cpki-btn-primary"
                } h-auto px-4`}
              >
                <Send className="h-4 w-4" />
                Send
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 4: Invoicing & Billing */}
      {activeTab === "invoices" && (
        <div className="cpki-card p-5 space-y-4 max-w-3xl">
          <div className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider">
            Invoicing & Financial Record
          </div>

          <div className="rounded-lg border border-[var(--border)] p-4 space-y-3 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-[var(--muted-foreground)]">Invoice Number:</span>
              <span className="font-mono font-semibold">{order.invoiceNumber || "INV-PENDING"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[var(--muted-foreground)]">Status:</span>
              <Badge tone={order.paymentStatus === "PAID" ? "success" : "warning"} variant="sm">
                {order.paymentStatus}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[var(--muted-foreground)]">Payment Gateway:</span>
              <span className="font-medium">{order.paymentMethod}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[var(--muted-foreground)]">Total Billed:</span>
              <span className="font-mono font-semibold text-sm">
                {formatMoney(order.totalCents, order.currency)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
