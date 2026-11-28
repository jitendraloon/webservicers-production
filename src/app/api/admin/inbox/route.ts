import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { db } from "@/server/db";

export type InboxFolder = "inbox" | "sent" | "replied" | "draft" | "spam" | "trash";

export interface ThreadMessage {
  id: string;
  senderType: "client" | "staff" | "system";
  senderName: string;
  senderEmail: string;
  sentAt: string;
  body: string;
}

export interface InboxThread {
  id: string;
  senderName: string;
  senderEmail: string;
  senderPhone?: string;
  company?: string;
  websiteUrl?: string;
  budget?: string;
  services?: string[];
  source: "Contact Form" | "Talk to Expert";
  subject: string;
  folder: InboxFolder;
  unread: boolean;
  starred: boolean;
  createdAt: string;
  updatedAt: string;
  messages: ThreadMessage[];
}

const DEFAULT_THREADS: InboxThread[] = [
  {
    id: "inbox_101",
    senderName: "Marcus Vance",
    senderEmail: "mvance@vancemedia.co",
    senderPhone: "+1 (415) 890-2311",
    company: "Vance Media Group",
    websiteUrl: "https://vancemedia.co",
    budget: "$5,000 – $15,000 / mo",
    services: ["SEO & Organic Growth", "Meta & Instagram Ads"],
    source: "Talk to Expert",
    subject: "Enterprise White-label SEO & Ads Expansion",
    folder: "inbox",
    unread: true,
    starred: true,
    createdAt: "2026-11-28T09:15:00Z",
    updatedAt: "2026-11-28T09:15:00Z",
    messages: [
      {
        id: "msg_101_1",
        senderType: "client",
        senderName: "Marcus Vance",
        senderEmail: "mvance@vancemedia.co",
        sentAt: "2026-11-28T09:15:00Z",
        body: "Hello WebServicers Team,\n\nWe are looking to scale our agency operations with your white-label SEO Suite and dedicated Meta Ads infrastructure. We currently manage 45+ B2B brands and need multi-tenant client reporting and automated rank tracking APIs.\n\nCould we schedule a discovery walkthrough this Tuesday?\n\nBest regards,\nMarcus Vance\nManaging Partner, Vance Media Group",
      },
    ],
  },
  {
    id: "inbox_102",
    senderName: "Elena Rostova",
    senderEmail: "elena@nordiccloud.io",
    senderPhone: "+46 70 123 4567",
    company: "NordicCloud AB",
    websiteUrl: "https://nordiccloud.io",
    budget: "$2,000 – $5,000 / mo",
    services: ["Website Design & Dev", "Analytics & CRO"],
    source: "Contact Form",
    subject: "Full-stack Website Redesign & Migration Inquiry",
    folder: "replied",
    unread: false,
    starred: false,
    createdAt: "2026-11-27T14:30:00Z",
    updatedAt: "2026-11-27T16:45:00Z",
    messages: [
      {
        id: "msg_102_1",
        senderType: "client",
        senderName: "Elena Rostova",
        senderEmail: "elena@nordiccloud.io",
        sentAt: "2026-11-27T14:30:00Z",
        body: "Hi there,\n\nOur current SaaS platform marketing site needs a complete Next.js design overhaul with integrated customer portal authentication. We need high Core Web Vitals performance and automated Stripe billing integrations.\n\nLooking forward to your initial estimate and project timeline.\n\nElena",
      },
      {
        id: "msg_102_2",
        senderType: "staff",
        senderName: "WebServicers Solutions Desk",
        senderEmail: "support@webservicers.com",
        sentAt: "2026-11-27T16:45:00Z",
        body: "Hi Elena,\n\nThank you for reaching out! We specialize in high-performance Next.js architectures with sub-second LCP and automated Stripe billing. Based on your initial scope, a 4-week sprint will cover design tokens, interactive component engineering, and full portal migration.\n\nI have prepared a tailored project proposal for NordicCloud. Let us know if you would like to schedule a 15-minute scoping call tomorrow.\n\nBest regards,\nSolutions Team @ WebServicers",
      },
    ],
  },
  {
    id: "inbox_103",
    senderName: "David Thorne",
    senderEmail: "d.thorne@oakridge.uk",
    senderPhone: "+44 20 7946 0192",
    company: "Oakridge Financial Ltd",
    websiteUrl: "https://oakridge.uk",
    budget: "$15,000+ / mo",
    services: ["SEO & Organic Growth", "Analytics & CRO"],
    source: "Talk to Expert",
    subject: "Custom SLA & Compliance Retainer Inquiry",
    folder: "inbox",
    unread: false,
    starred: true,
    createdAt: "2026-11-26T11:20:00Z",
    updatedAt: "2026-11-26T11:20:00Z",
    messages: [
      {
        id: "msg_103_1",
        senderType: "client",
        senderName: "David Thorne",
        senderEmail: "d.thorne@oakridge.uk",
        sentAt: "2026-11-26T11:20:00Z",
        body: "Good morning,\n\nWe require an enterprise SLA retainer including 99.99% uptime guarantees, GDPR compliance auditing, and weekly executive SERP briefings. Please send over your compliance documentation and Master Services Agreement template.\n\nDavid Thorne\nChief Technology Officer, Oakridge Financial",
      },
    ],
  },
  {
    id: "inbox_104",
    senderName: "Crypto Mining Bot",
    senderEmail: "promotions@fastcrypto-mining-global.cc",
    source: "Contact Form",
    subject: "Unsolicited: High Yield Crypto Mining Platform",
    folder: "spam",
    unread: false,
    starred: false,
    createdAt: "2026-11-25T03:10:00Z",
    updatedAt: "2026-11-25T03:10:00Z",
    messages: [
      {
        id: "msg_104_1",
        senderType: "client",
        senderName: "Crypto Mining Bot",
        senderEmail: "promotions@fastcrypto-mining-global.cc",
        sentAt: "2026-11-25T03:10:00Z",
        body: "Automated promotional spam offering fake hash rate investment tokens.",
      },
    ],
  },
];

function getStoragePath(): string {
  const dir = path.join(process.cwd(), "storage");
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, "inbox-threads.json");
}

function loadThreads(): InboxThread[] {
  try {
    const file = getStoragePath();
    if (fs.existsSync(file)) {
      const data = JSON.parse(fs.readFileSync(file, "utf8"));
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (_) {}
  return DEFAULT_THREADS;
}

function saveThreads(threads: InboxThread[]): void {
  try {
    fs.writeFileSync(getStoragePath(), JSON.stringify(threads, null, 2), "utf8");
  } catch (_) {}
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const folder = (searchParams.get("folder") || "inbox") as InboxFolder;
  const search = (searchParams.get("search") || "").trim().toLowerCase();
  const source = searchParams.get("source");

  let threads = loadThreads();

  // Ingest any fresh un-threaded leads from database
  try {
    if (db && db.lead) {
      const dbLeads = await db.lead.findMany({
        take: 20,
        orderBy: { createdAt: "desc" },
      });

      let addedNew = false;
      for (const lead of dbLeads) {
        const leadId = `lead_thread_${lead.id}`;
        if (!threads.some((t) => t.id === leadId)) {
          const isExpert = lead.notes?.includes("Company:") || lead.notes?.includes("Budget:");
          threads.unshift({
            id: leadId,
            senderName: lead.name || "Inbound Visitor",
            senderEmail: lead.email || "inquiry@customer.com",
            senderPhone: lead.phone || undefined,
            source: isExpert ? "Talk to Expert" : "Contact Form",
            subject: isExpert ? "Inbound Expert Consultation Request" : "Contact Inbound Inquiry",
            folder: "inbox",
            unread: true,
            starred: false,
            createdAt: lead.createdAt.toISOString(),
            updatedAt: lead.createdAt.toISOString(),
            messages: [
              {
                id: `msg_${lead.id}_1`,
                senderType: "client",
                senderName: lead.name || "Inbound Visitor",
                senderEmail: lead.email || "inquiry@customer.com",
                sentAt: lead.createdAt.toISOString(),
                body: lead.notes || "Inbound message received via website storefront.",
              },
            ],
          });
          addedNew = true;
        }
      }
      if (addedNew) saveThreads(threads);
    }
  } catch (_) {}

  // Compute folder counts
  const counts = {
    all: threads.filter((t) => t.folder !== "trash" && t.folder !== "spam").length,
    inbox: threads.filter((t) => t.folder === "inbox").length,
    sent: threads.filter((t) => t.folder === "sent" || t.folder === "replied").length,
    replied: threads.filter((t) => t.folder === "replied").length,
    draft: threads.filter((t) => t.folder === "draft").length,
    spam: threads.filter((t) => t.folder === "spam").length,
    trash: threads.filter((t) => t.folder === "trash").length,
    unreadInbox: threads.filter((t) => t.folder === "inbox" && t.unread).length,
  };

  // Filter threads
  let filtered = threads;

  if (folder === "sent") {
    filtered = filtered.filter((t) => t.folder === "sent" || t.folder === "replied");
  } else if (folder !== "inbox") {
    filtered = filtered.filter((t) => t.folder === folder);
  } else {
    filtered = filtered.filter((t) => t.folder === "inbox");
  }

  if (source) {
    filtered = filtered.filter((t) => t.source === source);
  }

  if (search) {
    filtered = filtered.filter(
      (t) =>
        t.senderName.toLowerCase().includes(search) ||
        t.senderEmail.toLowerCase().includes(search) ||
        t.subject.toLowerCase().includes(search) ||
        t.messages.some((m) => m.body.toLowerCase().includes(search))
    );
  }

  return NextResponse.json({
    ok: true,
    counts,
    threads: filtered,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, threadId } = body;
    let threads = loadThreads();

    if (action === "reply") {
      const { replyText, staffName, fromEmail } = body;
      const threadIndex = threads.findIndex((t) => t.id === threadId);
      if (threadIndex === -1) {
        return NextResponse.json({ ok: false, error: "Thread not found." }, { status: 404 });
      }

      const thread = threads[threadIndex];
      const newMsg: ThreadMessage = {
        id: `msg_rep_${Date.now()}`,
        senderType: "staff",
        senderName: staffName || "Support Specialist",
        senderEmail: fromEmail || "support@webservicers.com",
        sentAt: new Date().toISOString(),
        body: replyText,
      };

      thread.messages.push(newMsg);
      thread.folder = "replied";
      thread.unread = false;
      thread.updatedAt = new Date().toISOString();

      saveThreads(threads);
      return NextResponse.json({ ok: true, thread, message: "Reply delivered successfully." });
    }

    if (action === "update_folder") {
      const { targetFolder } = body;
      const thread = threads.find((t) => t.id === threadId);
      if (!thread) {
        return NextResponse.json({ ok: false, error: "Thread not found." }, { status: 404 });
      }

      thread.folder = targetFolder;
      thread.updatedAt = new Date().toISOString();
      saveThreads(threads);
      return NextResponse.json({ ok: true, thread });
    }

    if (action === "toggle_starred") {
      const thread = threads.find((t) => t.id === threadId);
      if (!thread) {
        return NextResponse.json({ ok: false, error: "Thread not found." }, { status: 404 });
      }

      thread.starred = !thread.starred;
      thread.updatedAt = new Date().toISOString();
      saveThreads(threads);
      return NextResponse.json({ ok: true, thread });
    }

    if (action === "mark_read") {
      const { unread } = body;
      const thread = threads.find((t) => t.id === threadId);
      if (!thread) {
        return NextResponse.json({ ok: false, error: "Thread not found." }, { status: 404 });
      }

      thread.unread = Boolean(unread);
      saveThreads(threads);
      return NextResponse.json({ ok: true, thread });
    }

    if (action === "delete_permanently") {
      threads = threads.filter((t) => t.id !== threadId);
      saveThreads(threads);
      return NextResponse.json({ ok: true, message: "Thread deleted permanently." });
    }

    return NextResponse.json({ ok: false, error: "Unknown action." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || "Request failed." }, { status: 500 });
  }
}
