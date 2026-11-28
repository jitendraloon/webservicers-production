import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { isInstallLocked } from "@/server/install/guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const locked = isInstallLocked();
    const rootDir = process.cwd();
    const storageDir = path.join(rootDir, "storage");

    const nodeVersion = process.version;
    const majorNode = parseInt(nodeVersion.replace(/^v/, "").split(".")[0] || "0", 10);

    let rootWritable = false;
    try {
      const probe = path.join(rootDir, ".install-write-test");
      fs.writeFileSync(probe, "ok", "utf8");
      fs.unlinkSync(probe);
      rootWritable = true;
    } catch {
      rootWritable = false;
    }

    let storageWritable = false;
    try {
      if (!fs.existsSync(storageDir)) {
        fs.mkdirSync(storageDir, { recursive: true });
      }
      const probe = path.join(storageDir, ".write-test");
      fs.writeFileSync(probe, "ok", "utf8");
      fs.unlinkSync(probe);
      storageWritable = true;
    } catch {
      storageWritable = false;
    }

    const prismaSchemaExists = fs.existsSync(path.join(rootDir, "prisma", "schema.prisma"));
    const prismaClientExists = fs.existsSync(path.join(rootDir, "node_modules", "@prisma", "client"));

    const checks = [
      {
        id: "node",
        label: "Node.js Runtime (>= v18)",
        passed: majorNode >= 18,
        detail: `Detected ${nodeVersion}`,
      },
      {
        id: "root_write",
        label: "Project Root Write Permission (.env)",
        passed: rootWritable,
        detail: rootWritable ? rootDir : "Cannot write .env in root folder",
      },
      {
        id: "storage_write",
        label: "Storage Directory Writable",
        passed: storageWritable,
        detail: storageWritable ? storageDir : "Cannot write to storage/",
      },
      {
        id: "prisma_schema",
        label: "Prisma MariaDB/MySQL Schema",
        passed: prismaSchemaExists,
        detail: prismaSchemaExists ? "prisma/schema.prisma ready" : "Missing prisma/schema.prisma",
      },
      {
        id: "prisma_client",
        label: "Prisma Client Generated",
        passed: prismaClientExists,
        detail: prismaClientExists ? "@prisma/client ready" : "Run npm install / prisma generate",
      },
    ];

    return NextResponse.json({
      locked,
      allPassed: checks.every((c) => c.passed),
      checks,
      serverPath: rootDir,
    });
  } catch (err: any) {
    console.error("[api/install/check Fatal Error]:", err);
    return NextResponse.json(
      {
        ok: false,
        error: String(err),
        stack: err?.stack,
      },
      { status: 500 }
    );
  }
}
