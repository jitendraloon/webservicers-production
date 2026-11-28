import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { ticketSchema } from "@/lib/validators";
import {
  getClientIp,
  handleApiError,
  isDbUnavailableError,
  parseJsonBody,
  requireAuth,
  writeAuditLog,
} from "@/server/api-helpers";
import type { Prisma } from "@prisma/client";

const replyTicketSchema = z.object({
  ticketId: z.string().trim().min(1),
  body: z.string().trim().min(1, "Reply body is required").max(10000),
  status: z
    .enum(["OPEN", "AWAITING_REPLY", "IN_PROGRESS", "RESOLVED", "CLOSED"])
    .optional(),
});

const createOrReplySchema = z.union([replyTicketSchema, ticketSchema]);

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { session } = auth;
  const isStaffOrAdmin =
    session.user.role === "ADMIN" || session.user.role === "STAFF";

  const status = request.nextUrl.searchParams.get("status");
  const ticketId = request.nextUrl.searchParams.get("ticketId");

  const where: Prisma.TicketWhereInput = {
    ...(isStaffOrAdmin ? {} : { userId: session.user.id }),
    ...(status ? { status: status as Prisma.EnumTicketStatusFilter } : {}),
    ...(ticketId ? { id: ticketId } : {}),
  };

  try {
    const tickets = await db.ticket.findMany({
      where,
      include: {
        department: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true } },
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            sender: { select: { id: true, name: true, role: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });

    return NextResponse.json({
      ok: true,
      tickets,
    });
  } catch (err) {
    if (isDbUnavailableError(err)) {
      return NextResponse.json({
        ok: true,
        tickets: [],
        fallback: true,
      });
    }
    return handleApiError(err, "GET /api/crm/tickets");
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody(request, createOrReplySchema);
  if (!parsed.ok) return parsed.response;

  const { session } = auth;
  const isStaffOrAdmin =
    session.user.role === "ADMIN" || session.user.role === "STAFF";

  try {
    if ("ticketId" in parsed.data) {
      const { ticketId, body, status } = parsed.data;
      const ticket = await db.ticket.findUnique({ where: { id: ticketId } });
      if (!ticket) {
        return NextResponse.json(
          { ok: false, error: "Ticket not found." },
          { status: 404 }
        );
      }

      if (!isStaffOrAdmin && ticket.userId !== session.user.id) {
        return NextResponse.json(
          { ok: false, error: "Insufficient permissions for this ticket." },
          { status: 403 }
        );
      }

      const nextStatus =
        isStaffOrAdmin && status
          ? status
          : isStaffOrAdmin
          ? "AWAITING_REPLY"
          : "OPEN";

      const result = await db.$transaction(async (tx) => {
        const message = await tx.ticketMessage.create({
          data: {
            ticketId: ticket.id,
            senderId: session.user.id,
            senderType: isStaffOrAdmin ? "ADMIN" : "USER",
            body,
          },
        });

        const updatedTicket = await tx.ticket.update({
          where: { id: ticket.id },
          data: { status: nextStatus },
        });

        return { message, ticket: updatedTicket };
      });

      await writeAuditLog({
        actorType: isStaffOrAdmin ? "ADMIN" : "USER",
        actorId: session.user.id,
        action: "TICKET_REPLIED",
        targetType: "Ticket",
        targetId: ticket.id,
        metadata: { status: nextStatus },
        ip: getClientIp(request),
        userAgent: request.headers.get("user-agent"),
      });

      return NextResponse.json(
        { ok: true, ticket: result.ticket, message: result.message },
        { status: 201 }
      );
    }

    const { subject, body, priority, departmentId } = parsed.data;
    const ticketNumber = `TKT-${Date.now().toString(36).toUpperCase()}`;

    const ticket = await db.ticket.create({
      data: {
        ticketNumber,
        userId: session.user.id,
        departmentId: departmentId ?? null,
        subject,
        body,
        priority,
        status: "OPEN",
        messages: {
          create: {
            senderId: session.user.id,
            senderType: "USER",
            body,
          },
        },
      },
      include: {
        messages: true,
        department: { select: { id: true, name: true } },
      },
    });

    await writeAuditLog({
      actorType: "USER",
      actorId: session.user.id,
      action: "TICKET_CREATED",
      targetType: "Ticket",
      targetId: ticket.id,
      metadata: { ticketNumber, priority },
      ip: getClientIp(request),
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json({ ok: true, ticket }, { status: 201 });
  } catch (err) {
    return handleApiError(err, "POST /api/crm/tickets");
  }
}
