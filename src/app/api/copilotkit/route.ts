import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { decrypt } from "@/server/crypto";
import {
  getClientIp,
  getOptionalSession,
  isDbUnavailableError,
  parseJsonBody,
  writeAuditLog,
} from "@/server/api-helpers";

const copilotMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().trim().min(1).max(16000),
});

const copilotRequestSchema = z.object({
  messages: z.array(copilotMessageSchema).min(1),
  scope: z.enum(["public", "user", "admin"]).optional(),
  context: z.record(z.unknown()).optional(),
});

type CopilotScope = "public" | "user" | "admin";

async function callConfiguredAiProvider(
  provider: string,
  config: Record<string, unknown>,
  systemPrompt: string,
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>
): Promise<string | null> {
  const apiKey = typeof config.apiKey === "string" ? config.apiKey.trim() : "";
  if (!apiKey) return null;

  const model =
    typeof config.model === "string" && config.model.trim()
      ? config.model.trim()
      : provider === "anthropic"
      ? "claude-3-5-sonnet-latest"
      : provider === "gemini"
      ? "gemini-2.0-flash"
      : "gpt-4o-mini";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    if (provider === "openai" || provider === "openrouter") {
      const endpoint =
        provider === "openrouter"
          ? "https://openrouter.ai/api/v1/chat/completions"
          : "https://api.openai.com/v1/chat/completions";
      const resp = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "system", content: systemPrompt }, ...messages],
        }),
        signal: controller.signal,
      });
      if (!resp.ok) return null;
      const json = (await resp.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      return json.choices?.[0]?.message?.content ?? null;
    }

    if (provider === "anthropic") {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: 1024,
          system: systemPrompt,
          messages: messages.filter((m) => m.role !== "system"),
        }),
        signal: controller.signal,
      });
      if (!resp.ok) return null;
      const json = (await resp.json()) as {
        content?: Array<{ text?: string }>;
      };
      return json.content?.[0]?.text ?? null;
    }

    if (provider === "gemini") {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        model
      )}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const lastUserMsg =
        messages.filter((m) => m.role === "user").pop()?.content ?? "";
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${systemPrompt}\n\nUser: ${lastUserMsg}` }],
            },
          ],
        }),
        signal: controller.signal,
      });
      if (!resp.ok) return null;
      const json = (await resp.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      return json.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
    }

    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: NextRequest) {
  const parsed = await parseJsonBody(request, copilotRequestSchema);
  if (!parsed.ok) return parsed.response;

  const { messages, scope: requestedScope } = parsed.data;
  const { session, dbUnavailable } = await getOptionalSession();

  // Enforce 3-tier scoping based on verified session role
  let effectiveScope: CopilotScope = "public";
  if (session) {
    const isStaffOrAdmin =
      session.user.role === "ADMIN" || session.user.role === "STAFF";
    if (requestedScope === "admin") {
      if (!isStaffOrAdmin) {
        return NextResponse.json(
          { ok: false, error: "Admin scope requires ADMIN or STAFF role." },
          { status: 403 }
        );
      }
      effectiveScope = "admin";
    } else if (requestedScope === "public") {
      effectiveScope = "public";
    } else {
      effectiveScope = isStaffOrAdmin && !requestedScope ? "admin" : "user";
    }
  } else if (requestedScope === "user" || requestedScope === "admin") {
    return NextResponse.json(
      { ok: false, error: `Scope "${requestedScope}" requires authentication.` },
      { status: 401 }
    );
  }

  const systemPrompts: Record<CopilotScope, string> = {
    public:
      "You are the WebServicers public assistant. Help visitors explore digital marketing, SEO, web design, and SMM services, pricing tiers, and onboarding.",
    user:
      "You are the WebServicers client portal copilot. Help authenticated clients manage their orders, invoices, support tickets, SMM campaigns, and SEO projects.",
    admin:
      "You are the WebServicers operations copilot for admins and staff. Assist with order fulfillment, KYC reviews, payment gateways, job queues, and SEO/SMM provider management.",
  };

  let providerUsed = "local_fallback";
  let reply: string | null = null;

  if (!dbUnavailable) {
    try {
      const aiIntegrations = await db.integration.findMany({
        where: { category: "ai", enabled: true },
        orderBy: { updatedAt: "desc" },
      });

      for (const integ of aiIntegrations) {
        if (!integ.configEnc) continue;
        try {
          const cfg = JSON.parse(decrypt(integ.configEnc)) as Record<string, unknown>;
          const aiReply = await callConfiguredAiProvider(
            integ.provider,
            cfg,
            systemPrompts[effectiveScope],
            messages
          );
          if (aiReply) {
            reply = aiReply;
            providerUsed = integ.provider;
            break;
          }
        } catch {
          continue;
        }
      }
    } catch (err) {
      if (!isDbUnavailableError(err)) {
        console.warn("[POST /api/copilotkit] AI lookup error:", err);
      }
    }
  }

  const lastUserMessage =
    messages.filter((m) => m.role === "user").pop()?.content ?? "";

  if (!reply) {
    reply = `[${effectiveScope.toUpperCase()} Copilot] I received your request: "${lastUserMessage.slice(
      0,
      160
    )}". No live AI provider key is currently active, so I'm responding in safe fallback mode.`;
  }

  await writeAuditLog({
    actorType: "COPILOT",
    actorId: session?.user.id ?? null,
    action: "COPILOT_CHAT_COMPLETION",
    targetType: "CopilotScope",
    targetId: effectiveScope,
    metadata: {
      scope: effectiveScope,
      provider: providerUsed,
      messageCount: messages.length,
    },
    ip: getClientIp(request),
    userAgent: request.headers.get("user-agent"),
  });

  return NextResponse.json({
    ok: true,
    scope: effectiveScope,
    provider: providerUsed,
    message: {
      role: "assistant",
      content: reply,
    },
  });
}
