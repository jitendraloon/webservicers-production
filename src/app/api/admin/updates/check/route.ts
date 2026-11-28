import { NextRequest, NextResponse } from "next/server";
import { ReleaseBootstrapManager } from "@/server/updater/bootstrap";
import { UpdateProviderManager } from "@/server/updater/provider-manager";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const channel = searchParams.get("channel") || "stable";

  const bootstrap = new ReleaseBootstrapManager();
  const active = bootstrap.resolveActiveRelease();

  const pm = UpdateProviderManager.getInstance();
  await pm.loadFromDatabase();

  try {
    const update = await pm.checkForUpdates(active.version, channel);

    if (!update) {
      return NextResponse.json({
        hasUpdate: false,
        currentVersion: active.version,
        channel,
        message: "Your WebServicers installation is up to date.",
      });
    }

    return NextResponse.json({
      hasUpdate: true,
      currentVersion: active.version,
      channel,
      targetVersion: update.release.version,
      provider: update.provider.name,
      manifest: update.release.manifest,
      publishedAt: update.release.publishedAt,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        hasUpdate: false,
        error: err.message || "Failed to check for updates upstream.",
      },
      { status: 500 }
    );
  }
}
