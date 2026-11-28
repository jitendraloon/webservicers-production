import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import {
  getClientIp,
  getOptionalSession,
  isDbUnavailableError,
  parseJsonBody,
  writeAuditLog,
} from "@/server/api-helpers";

const jsonRpcSchema = z.object({
  jsonrpc: z.literal("2.0"),
  id: z.union([z.string(), z.number(), z.null()]).optional(),
  method: z.string().trim().min(1),
  params: z.record(z.unknown()).optional(),
});

function rpcResult(id: string | number | null | undefined, result: unknown) {
  return NextResponse.json({
    jsonrpc: "2.0",
    id: id ?? null,
    result,
  });
}

function rpcError(
  id: string | number | null | undefined,
  code: number,
  message: string,
  status = 200
) {
  return NextResponse.json(
    {
      jsonrpc: "2.0",
      id: id ?? null,
      error: { code, message },
    },
    { status }
  );
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await context.params;
  const parsed = await parseJsonBody(request, jsonRpcSchema);
  if (!parsed.ok) {
    return rpcError(null, -32600, "Invalid JSON-RPC 2.0 request.", 400);
  }

  const { id, method, params } = parsed.data;
  const { session, dbUnavailable } = await getOptionalSession();
  const bearer = request.headers.get("authorization");

  if (!session && !bearer) {
    return rpcError(id, -32001, "Authentication required (session or Bearer token).", 401);
  }

  try {
    if (method === "initialize") {
      return rpcResult(id, {
        protocolVersion: "2024-11-05",
        serverInfo: {
          name: "webservicers-seo-mcp",
          version: "1.0.0",
        },
        capabilities: {
          tools: {},
          resources: {},
        },
      });
    }

    if (method === "tools/list") {
      return rpcResult(id, {
        tools: [
          {
            name: "get_project_context",
            description: "Retrieve SEO project metadata, positioning, competitors, and key pages.",
            inputSchema: { type: "object", properties: {} },
          },
          {
            name: "list_saved_keywords",
            description: "List saved keywords and metrics for this SEO project.",
            inputSchema: {
              type: "object",
              properties: { limit: { type: "number" } },
            },
          },
          {
            name: "get_latest_audit",
            description: "Retrieve the most recent technical site audit and top issues.",
            inputSchema: { type: "object", properties: {} },
          },
          {
            name: "list_geo_prompts",
            description: "List tracked AI/GEO prompts and recent brand visibility observations.",
            inputSchema: { type: "object", properties: {} },
          },
        ],
      });
    }

    if (method === "resources/list") {
      return rpcResult(id, {
        resources: [
          {
            uri: `seo://project/${projectId}/context`,
            name: "SEO Project Context",
            mimeType: "application/json",
          },
        ],
      });
    }

    if (dbUnavailable) {
      return rpcError(id, -32002, "Database unavailable for MCP query.", 503);
    }

    const project = await db.seoProject.findUnique({
      where: { id: projectId },
      include: { context: true },
    });

    if (!project) {
      return rpcError(id, -32004, `SEO project "${projectId}" not found.`, 404);
    }

    if (
      session &&
      session.user.role !== "ADMIN" &&
      session.user.role !== "STAFF" &&
      project.userId !== session.user.id
    ) {
      return rpcError(id, -32003, "Insufficient permissions for this project.", 403);
    }

    if (method === "resources/read") {
      return rpcResult(id, {
        contents: [
          {
            uri: `seo://project/${projectId}/context`,
            mimeType: "application/json",
            text: JSON.stringify(project, null, 2),
          },
        ],
      });
    }

    if (method === "tools/call") {
      const toolName = String(params?.name ?? "");
      const args = (params?.arguments ?? {}) as Record<string, unknown>;

      let toolOutput: unknown = null;

      if (toolName === "get_project_context") {
        toolOutput = project;
      } else if (toolName === "list_saved_keywords") {
        const limit = Math.min(Math.max(Number(args.limit || 50), 1), 200);
        toolOutput = await db.seoSavedKeyword.findMany({
          where: { projectId },
          orderBy: { createdAt: "desc" },
          take: limit,
        });
      } else if (toolName === "get_latest_audit") {
        toolOutput = await db.seoAudit.findFirst({
          where: { projectId },
          include: { issues: { orderBy: { pagesAffectedCount: "desc" }, take: 25 } },
          orderBy: { createdAt: "desc" },
        });
      } else if (toolName === "list_geo_prompts") {
        toolOutput = await db.seoPromptTracker.findMany({
          where: { projectId },
          include: {
            topics: {
              include: {
                prompts: {
                  include: {
                    observations: { orderBy: { createdAt: "desc" }, take: 5 },
                  },
                },
              },
            },
          },
        });
      } else {
        return rpcError(id, -32601, `Unknown MCP tool: ${toolName}`);
      }

      await writeAuditLog({
        actorType: "COPILOT",
        actorId: session?.user.id ?? null,
        action: `MCP_TOOL_${toolName.toUpperCase()}`,
        targetType: "SeoProject",
        targetId: projectId,
        ip: getClientIp(request),
        userAgent: request.headers.get("user-agent"),
      });

      return rpcResult(id, {
        content: [
          {
            type: "text",
            text: JSON.stringify(toolOutput, null, 2),
          },
        ],
      });
    }

    return rpcError(id, -32601, `Method not found: ${method}`);
  } catch (err) {
    if (isDbUnavailableError(err)) {
      return rpcError(id, -32002, "Database unavailable.", 503);
    }
    return rpcError(id, -32603, "Internal MCP server error.", 500);
  }
}
