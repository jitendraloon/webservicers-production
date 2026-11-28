import fs from "node:fs";
import path from "node:path";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export interface MigrationExecutionResult {
  success: boolean;
  appliedCount: number;
  output: string;
  error?: string;
}

export class MigrationRunner {
  private rootDir: string;

  constructor(rootDir?: string) {
    this.rootDir = rootDir || process.cwd();
  }

  /**
   * Run production database migrations safely using `prisma migrate deploy`.
   * Never executes destructive reset operations.
   */
  public async deployMigrations(appDirectory?: string): Promise<MigrationExecutionResult> {
    const cwd = appDirectory || this.rootDir;
    const prismaDir = path.join(cwd, "prisma");

    if (!fs.existsSync(prismaDir)) {
      return {
        success: true,
        appliedCount: 0,
        output: "No prisma schema or migrations found. Skipping migration phase.",
      };
    }

    // Ensure Linux permissions for prisma binaries on cPanel
    if (process.platform !== "win32") {
      try {
        await execAsync("chmod -R +x node_modules/.bin node_modules/@prisma node_modules/prisma 2>/dev/null || true", { cwd });
      } catch (_) {}
    }

    try {
      // Find executable prisma path
      let prismaCmd = "npx prisma migrate deploy";
      const localPrisma = path.join(cwd, "node_modules", "prisma", "build", "index.js");
      if (fs.existsSync(localPrisma)) {
        prismaCmd = `"${process.execPath}" "${localPrisma}" migrate deploy`;
      }

      console.log(`[MigrationRunner] Executing: ${prismaCmd} in ${cwd}`);
      const { stdout, stderr } = await execAsync(prismaCmd, {
        cwd,
        env: {
          ...process.env,
          PRISMA_GENERATE_DATAPROXY: "false",
        },
        timeout: 120000, // 2 minutes max
      });

      const output = `${stdout}\n${stderr}`.trim();
      console.log("[MigrationRunner] Output:", output);

      return {
        success: true,
        appliedCount: (output.match(/applied/gi) || []).length,
        output,
      };
    } catch (err: any) {
      console.error("[MigrationRunner] Migration execution failed:", err);
      return {
        success: false,
        appliedCount: 0,
        output: err.stdout || "",
        error: err.stderr || err.message || "Prisma migration deploy failed",
      };
    }
  }
}
