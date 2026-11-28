import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookies } from "@/server/auth/session";

export interface SubAccountPermission {
  enabled: boolean;
  level: "view" | "manage";
}

export interface SubAccount {
  id: string;
  name: string;
  email: string;
  status: "Active" | "Invited" | "Suspended";
  role: "Manager" | "Viewer" | "Custom";
  permissions: {
    orders: SubAccountPermission;
    billing: SubAccountPermission;
    support: SubAccountPermission;
    smm: SubAccountPermission;
    seo: SubAccountPermission;
    integrations: SubAccountPermission;
    settings: SubAccountPermission;
  };
  lastActive?: string;
  invitedAt: string;
}

// In-memory persistent store for sub-accounts per workspace
let SUB_ACCOUNTS_STORE: SubAccount[] = [
  {
    id: "sub_101",
    name: "Sarah Jenkins",
    email: "sarah.j@luminahealth.io",
    status: "Active",
    role: "Manager",
    permissions: {
      orders: { enabled: true, level: "manage" },
      billing: { enabled: false, level: "view" },
      support: { enabled: true, level: "manage" },
      smm: { enabled: true, level: "manage" },
      seo: { enabled: true, level: "view" },
      integrations: { enabled: false, level: "view" },
      settings: { enabled: false, level: "view" },
    },
    lastActive: "Today at 2:15 PM",
    invitedAt: "2026-11-20T10:00:00Z",
  },
  {
    id: "sub_102",
    name: "Alexey Volkov",
    email: "alexey@luminahealth.io",
    status: "Active",
    role: "Viewer",
    permissions: {
      orders: { enabled: true, level: "view" },
      billing: { enabled: true, level: "view" },
      support: { enabled: true, level: "view" },
      smm: { enabled: false, level: "view" },
      seo: { enabled: true, level: "view" },
      integrations: { enabled: false, level: "view" },
      settings: { enabled: false, level: "view" },
    },
    lastActive: "Yesterday at 6:40 PM",
    invitedAt: "2026-11-22T14:30:00Z",
  },
  {
    id: "sub_103",
    name: "Finance & Accounting Lead",
    email: "billing@luminahealth.io",
    status: "Invited",
    role: "Custom",
    permissions: {
      orders: { enabled: true, level: "view" },
      billing: { enabled: true, level: "manage" },
      support: { enabled: false, level: "view" },
      smm: { enabled: false, level: "view" },
      seo: { enabled: false, level: "view" },
      integrations: { enabled: false, level: "view" },
      settings: { enabled: false, level: "view" },
    },
    lastActive: "Pending Invite Acceptance",
    invitedAt: "2026-11-27T09:12:00Z",
  },
];

export async function GET() {
  return NextResponse.json({ ok: true, subAccounts: SUB_ACCOUNTS_STORE });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, role, permissions } = body;

    if (!name || !email) {
      return NextResponse.json({ ok: false, error: "Name and email are required" }, { status: 400 });
    }

    if (SUB_ACCOUNTS_STORE.some((s) => s.email.toLowerCase() === email.toLowerCase())) {
      return NextResponse.json({ ok: false, error: "A sub-account with this email already exists" }, { status: 409 });
    }

    const defaultPermissions = {
      orders: { enabled: true, level: "view" as const },
      billing: { enabled: false, level: "view" as const },
      support: { enabled: true, level: "view" as const },
      smm: { enabled: true, level: "view" as const },
      seo: { enabled: true, level: "view" as const },
      integrations: { enabled: false, level: "view" as const },
      settings: { enabled: false, level: "view" as const },
    };

    const newSubAccount: SubAccount = {
      id: `sub_${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      status: "Invited",
      role: role || "Custom",
      permissions: permissions || defaultPermissions,
      lastActive: "Pending Invitation",
      invitedAt: new Date().toISOString(),
    };

    SUB_ACCOUNTS_STORE.unshift(newSubAccount);
    return NextResponse.json({ ok: true, subAccount: newSubAccount }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, status, role, permissions } = body;

    const sub = SUB_ACCOUNTS_STORE.find((s) => s.id === id);
    if (!sub) {
      return NextResponse.json({ ok: false, error: "Sub-account not found" }, { status: 404 });
    }

    if (name) sub.name = name.trim();
    if (status) sub.status = status;
    if (role) sub.role = role;
    if (permissions) sub.permissions = permissions;

    return NextResponse.json({ ok: true, subAccount: sub });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ ok: false, error: "Missing id parameter" }, { status: 400 });
  }

  SUB_ACCOUNTS_STORE = SUB_ACCOUNTS_STORE.filter((s) => s.id !== id);
  return NextResponse.json({ ok: true });
}
