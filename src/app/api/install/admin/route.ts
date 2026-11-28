import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { isInstallLocked } from "@/server/install/guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function readDatabaseUrl(): string | null {
  const rootDir = process.cwd();
  // Always inspect .env.local and .env on disk first so fresh credentials from Step 2 are immediately used
  for (const file of [".env.local", ".env"]) {
    const p = path.join(rootDir, file);
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, "utf8");
      const match = content.match(/^DATABASE_URL="?([^"\r\n]+)"?/m);
      if (
        match &&
        match[1] &&
        !match[1].includes("cpanel_installer") &&
        !match[1].includes("placeholder")
      ) {
        process.env.DATABASE_URL = match[1];
        return match[1];
      }
    }
  }

  if (
    process.env.DATABASE_URL &&
    !process.env.DATABASE_URL.includes("cpanel_installer") &&
    !process.env.DATABASE_URL.includes("placeholder")
  ) {
    return process.env.DATABASE_URL;
  }
  return null;
}

export async function POST(request: Request) {
  if (isInstallLocked()) {
    return NextResponse.json({ error: "Installer is locked." }, { status: 403 });
  }

  let body: { name?: string; email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const name = (body.name || "").trim();
  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";

  if (!name || !email || password.length < 8) {
    return NextResponse.json(
      { error: "Name, valid email, and password (minimum 8 characters) are required." },
      { status: 400 }
    );
  }

  const dbUrl = readDatabaseUrl();
  if (!dbUrl) {
    return NextResponse.json(
      { error: "Database is not configured yet. Complete Step 2 first." },
      { status: 400 }
    );
  }

  let prisma: any = null;
  try {
    const { PrismaClient: DynamicPrismaClient } = require("@prisma/client");
    prisma = new DynamicPrismaClient({ datasources: { db: { url: dbUrl } } });
    const superAdminRole = await prisma.role.findUnique({ where: { name: "Super Admin" } });
    const passwordHash = await bcrypt.hash(password, 12);

    const admin = await prisma.user.upsert({
      where: { email },
      update: {
        name,
        passwordHash,
        role: "ADMIN",
        roleGroupId: superAdminRole?.id ?? null,
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
      },
      create: {
        name,
        email,
        passwordHash,
        role: "ADMIN",
        roleGroupId: superAdminRole?.id ?? null,
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
      },
    });

    return NextResponse.json({
      ok: true,
      admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Failed to create Super Admin account.",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  } finally {
    if (prisma) {
      await prisma.$disconnect().catch(() => {});
    }
  }
}
