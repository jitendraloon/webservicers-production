import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { UpdateProviderManager } from "@/server/updater/provider-manager";
import { prisma } from "@/server/db";
import { encrypt, decrypt } from "@/server/crypto";
import { GitHubReleaseProvider } from "@/server/updater/providers/github-provider";

export async function GET() {
  const pm = UpdateProviderManager.getInstance();
  await pm.loadFromDatabase();

  const providers = pm.getProviders().map((p) => ({
    type: p.type,
    name: p.name,
    priority: p.priority,
  }));

  let savedConfigs: any[] = [];
  try {
    if (prisma && prisma.updateProviderConfig) {
      const records = await prisma.updateProviderConfig.findMany({
        orderBy: { priority: "asc" },
      });
      savedConfigs = records.map((r) => {
        let parsed: any = null;
        if (r.configEnc) {
          try {
            parsed = JSON.parse(decrypt(r.configEnc));
          } catch (_) {}
        }
        return {
          id: r.id,
          providerType: r.providerType,
          name: r.name,
          enabled: r.enabled,
          priority: r.priority,
          lastCheckedAt: r.lastCheckedAt,
          lastStatus: r.lastStatus,
          config: parsed
            ? {
                owner: parsed.owner || "",
                repo: parsed.repo || "",
                token: parsed.token || "",
              }
            : null,
        };
      });
    }
  } catch (_) {}

  // Persistent file fallback if database has no records or during bootstrap
  if (savedConfigs.length === 0) {
    try {
      const filePath = path.join(process.cwd(), "storage", "updater-providers.json");
      if (fs.existsSync(filePath)) {
        const fileData = JSON.parse(fs.readFileSync(filePath, "utf8"));
        if (fileData.GITHUB) {
          savedConfigs.push({
            id: "provider-GITHUB",
            providerType: "GITHUB",
            name: "GitHub Releases",
            enabled: true,
            priority: 1,
            config: {
              owner: fileData.GITHUB.owner || "",
              repo: fileData.GITHUB.repo || "",
              token: fileData.GITHUB.token || "",
            },
          });
        }
      }
    } catch (_) {}
  }

  return NextResponse.json({
    providers,
    savedConfigs,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { providerType, name, priority, config, testOnly } = body;

    if (!providerType) {
      return NextResponse.json({ ok: false, error: "Provider type is required." }, { status: 400 });
    }

    const pm = UpdateProviderManager.getInstance();

    if (testOnly) {
      if (providerType === "GITHUB" && config) {
        const gh = new GitHubReleaseProvider(config, priority ?? 1);
        const testRes = await gh.testConnection();
        return NextResponse.json(testRes);
      }
      const testRes = await pm.testProvider(providerType);
      return NextResponse.json(testRes);
    }

    // 1. Save to persistent storage file fallback first
    try {
      const storageDir = path.join(process.cwd(), "storage");
      fs.mkdirSync(storageDir, { recursive: true });
      const filePath = path.join(storageDir, "updater-providers.json");
      let existing: any = {};
      if (fs.existsSync(filePath)) {
        try {
          existing = JSON.parse(fs.readFileSync(filePath, "utf8"));
        } catch (_) {}
      }
      existing[providerType] = config;
      fs.writeFileSync(filePath, JSON.stringify(existing, null, 2), "utf8");
    } catch (_) {}

    // 2. Persist to database if available
    if (prisma && prisma.updateProviderConfig) {
      const encryptedConfig = config ? encrypt(JSON.stringify(config)) : null;

      await prisma.updateProviderConfig.upsert({
        where: { id: `provider-${providerType}` },
        update: {
          name: name || providerType,
          priority: priority ?? 1,
          configEnc: encryptedConfig,
          enabled: true,
          lastCheckedAt: new Date(),
        },
        create: {
          id: `provider-${providerType}`,
          providerType,
          name: name || providerType,
          priority: priority ?? 1,
          configEnc: encryptedConfig,
          enabled: true,
          lastCheckedAt: new Date(),
        },
      });

      await pm.loadFromDatabase();
    }

    return NextResponse.json({
      ok: true,
      message: `Provider ${providerType} configured and encrypted successfully.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || "Failed to configure provider." },
      { status: 500 }
    );
  }
}
