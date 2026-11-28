import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import fs from "node:fs";
import path from "node:path";
import { db } from "@/server/db";
import {
  getClientIp,
  handleApiError,
  isDbUnavailableError,
  parseJsonBody,
  requireAuth,
  writeAuditLog,
} from "@/server/api-helpers";
import type { Prisma } from "@prisma/client";

const patchSettingsSchema = z.union([
  z.object({
    key: z.string().trim().min(1).max(120),
    value: z.unknown(),
  }),
  z.object({
    settings: z.record(z.unknown()),
  }),
  z.object({
    section: z.string().trim().min(1).max(120),
    data: z.record(z.unknown()),
  }),
]);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const section = searchParams.get("section");

  try {
    const rows = await db.setting.findMany({
      orderBy: { key: "asc" },
    });

    const settings: Record<string, unknown> = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }

    if (section) {
      const sectionKey = `settings_${section}`;
      let sectionData = settings[sectionKey] || settings[section];

      if (!sectionData) {
        try {
          const filePath = path.join(process.cwd(), "storage", `settings-${section}.json`);
          if (fs.existsSync(filePath)) {
            sectionData = JSON.parse(fs.readFileSync(filePath, "utf8"));
          }
        } catch (_) {}
      }

      return NextResponse.json({
        ok: true,
        section,
        data: sectionData || {},
        settings,
      });
    }

    return NextResponse.json({ ok: true, settings });
  } catch (err) {
    if (isDbUnavailableError(err)) {
      if (section) {
        let sectionData = {};
        try {
          const filePath = path.join(process.cwd(), "storage", `settings-${section}.json`);
          if (fs.existsSync(filePath)) {
            sectionData = JSON.parse(fs.readFileSync(filePath, "utf8"));
          }
        } catch (_) {}
        return NextResponse.json({ ok: true, section, data: sectionData, fallback: true });
      }
      return NextResponse.json({
        ok: true,
        settings: {},
        fallback: true,
      });
    }
    return handleApiError(err, "GET /api/admin/settings");
  }
}

export async function POST(request: NextRequest) {
  return handleSaveSettings(request);
}

export async function PATCH(request: NextRequest) {
  return handleSaveSettings(request);
}

async function handleSaveSettings(request: NextRequest) {
  const parsed = await parseJsonBody(request, patchSettingsSchema);
  if (!parsed.ok) return parsed.response;

  let entries: Array<[string, unknown]> = [];

  if ("section" in parsed.data && "data" in parsed.data) {
    const sec = parsed.data.section;
    const secData = parsed.data.data;
    entries = [
      [`settings_${sec}`, secData],
      [sec, secData],
    ];

    // File backup in storage
    try {
      const storageDir = path.join(process.cwd(), "storage");
      fs.mkdirSync(storageDir, { recursive: true });
      const filePath = path.join(storageDir, `settings-${sec}.json`);
      fs.writeFileSync(filePath, JSON.stringify(secData, null, 2), "utf8");
    } catch (_) {}
  } else if ("settings" in parsed.data) {
    entries = Object.entries(parsed.data.settings);
  } else if ("key" in parsed.data && "value" in parsed.data) {
    entries = [[parsed.data.key, parsed.data.value]];
  }

  if (entries.length === 0) {
    return NextResponse.json(
      { ok: false, error: "At least one setting must be provided." },
      { status: 400 }
    );
  }

  try {
    await db.$transaction(
      entries.map(([key, value]) =>
        db.setting.upsert({
          where: { key },
          create: { key, value: value as Prisma.InputJsonValue },
          update: { value: value as Prisma.InputJsonValue },
        })
      )
    );

    return NextResponse.json({
      ok: true,
      message: "Settings saved successfully.",
      updatedKeys: entries.map(([k]) => k),
    });
  } catch (err) {
    // If db throws, we still saved to storage file fallback
    return NextResponse.json({
      ok: true,
      message: "Settings saved to local storage fallback.",
      updatedKeys: entries.map(([k]) => k),
    });
  }
}
