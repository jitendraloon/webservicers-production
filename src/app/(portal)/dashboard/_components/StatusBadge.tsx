"use client";

import React from "react";
import { Badge, type BadgeTone } from "@/components/ui/Badge";

const STATUS_TONE_MAP: Record<string, BadgeTone> = {
  // Orders & SMM Orders
  PENDING: "warning",
  IN_PROGRESS: "primary",
  COMPLETED: "success",
  PARTIAL: "lilac",
  CANCELLED: "neutral",
  REFUNDED: "danger",
  // Invoices
  DRAFT: "neutral",
  UNPAID: "warning",
  PAID: "success",
  OVERDUE: "danger",
  // Tickets
  OPEN: "primary",
  AWAITING_REPLY: "lilac",
  RESOLVED: "success",
  CLOSED: "neutral",
  // Priority
  LOW: "neutral",
  MEDIUM: "primary",
  HIGH: "warning",
  URGENT: "danger",
  // Balance movements
  CREDIT: "success",
  DEBIT: "warning",
};

export function StatusBadge({
  status,
  size = "default",
}: {
  status: string;
  size?: "default" | "sm";
}) {
  const tone = STATUS_TONE_MAP[status] ?? "neutral";
  const label = status.replace(/_/g, " ");
  return (
    <Badge tone={tone} variant={size}>
      {label}
    </Badge>
  );
}
