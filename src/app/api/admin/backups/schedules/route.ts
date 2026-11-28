import { NextRequest, NextResponse } from "next/server";
import { BackupManager } from "@/server/updater/backup-manager";

export async function GET() {
  const manager = new BackupManager();
  return NextResponse.json({ schedules: manager.getSchedules() });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name || !body.frequency) {
      return NextResponse.json({ error: "Name and frequency are required." }, { status: 400 });
    }

    const manager = new BackupManager();
    const schedule = manager.addSchedule({
      name: body.name,
      contents: body.contents || ["Database"],
      frequency: body.frequency,
      destination: body.destination || "Local Only",
      status: body.status || "Enabled",
      retentionCount: parseInt(body.retentionCount, 10) || 7,
      notifyOnFinish: Boolean(body.notifyOnFinish),
    });

    return NextResponse.json({ ok: true, schedule });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create schedule." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: "Schedule ID is required." }, { status: 400 });
    }

    const manager = new BackupManager();
    const updated = manager.updateSchedule(body.id, {
      ...(body.status ? { status: body.status } : {}),
      ...(body.name ? { name: body.name } : {}),
      ...(body.frequency ? { frequency: body.frequency } : {}),
    });

    if (!updated) {
      return NextResponse.json({ error: "Schedule not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, schedule: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update schedule." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing schedule ID." }, { status: 400 });
    }

    const manager = new BackupManager();
    const deleted = manager.deleteSchedule(id);
    return NextResponse.json({ ok: deleted });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete schedule." }, { status: 500 });
  }
}
