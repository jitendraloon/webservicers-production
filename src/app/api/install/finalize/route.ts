import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { isInstallLocked, lockInstaller } from "@/server/install/guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  if (isInstallLocked()) {
    return NextResponse.json({ ok: true, alreadyLocked: true });
  }

  let body: { adminEmail?: string; domain?: string; deleteInstallerFiles?: boolean } = {};
  try {
    body = await request.json();
  } catch {
    // optional body
  }

  const proto = request.headers.get("x-forwarded-proto") || "https";
  const reqHost = request.headers.get("x-forwarded-host") || request.headers.get("host") || "localhost:3000";
  const defaultDomain = `${proto}://${reqHost}`;

  lockInstaller({
    domain: body?.domain || defaultDomain,
    adminEmail: body?.adminEmail,
  });

  const removed: string[] = [];
  if (body.deleteInstallerFiles) {
    const rootDir = process.cwd();
    const candidates = [
      path.join(rootDir, "CPANEL_INSTALL_GUIDE.md"),
      path.join(rootDir, "Cpanel_dash_Webservicers_NextZen.zip"),
    ];
    for (const file of candidates) {
      try {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
          removed.push(path.basename(file));
        }
      } catch {
        // ignore permission errors
      }
    }
  }

  return NextResponse.json({
    ok: true,
    locked: true,
    removed,
    message: "Installation finalized and locked. You can now sign in at /login.",
  });
}
