"use client";

import React, { useEffect, useState } from "react";
import { Bot, Check, Copy, KeyRound, RefreshCw, Terminal } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { fetchSeoWithFallback, mutateSeoWithFallback } from "../_lib/seo-client";

interface AgentSetupData {
  projectId: string;
  endpointUrl: string;
  apiToken: string;
  availableTools: string[];
}

const DEMO_AGENT_SETUP: AgentSetupData = {
  projectId: "proj_webservicers_01",
  endpointUrl: "/api/seo-mcp/proj_webservicers_01",
  apiToken: "ws_seo_mcp_live_9f8a2c41e7b309d4",
  availableTools: [
    "get_seo_overview",
    "research_keywords",
    "get_rank_tracking",
    "run_site_audit",
    "check_geo_visibility",
    "get_brand_context",
  ],
};

export default function AgentSetupPage() {
  const [data, setData] = useState<AgentSetupData>(DEMO_AGENT_SETUP);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [rotating, setRotating] = useState(false);
  const [isDemo, setIsDemo] = useState(true);

  useEffect(() => {
    void (async () => {
      const res = await fetchSeoWithFallback<AgentSetupData>("/api/seo/agent-setup", DEMO_AGENT_SETUP);
      setData(res.data);
      setIsDemo(!res.fromApi);
    })();
  }, []);

  const fullEndpoint =
    typeof window !== "undefined"
      ? `${window.location.origin}${data.endpointUrl}`
      : `https://webservicers.io${data.endpointUrl}`;

  const copyText = async (key: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleRotateToken = async () => {
    setRotating(true);
    const nextToken = `ws_seo_mcp_live_${Math.random().toString(36).slice(2, 14)}`;
    await mutateSeoWithFallback("/api/seo/agent-setup/rotate-token", "POST", { projectId: data.projectId }, { apiToken: nextToken });
    setData((prev) => ({ ...prev, apiToken: nextToken }));
    setRotating(false);
  };

  const claudeSnippet = JSON.stringify(
    {
      mcpServers: {
        "webservicers-seo": {
          url: fullEndpoint,
          headers: {
            Authorization: `Bearer ${data.apiToken}`,
          },
        },
      },
    },
    null,
    2
  );

  const cursorSnippet = JSON.stringify(
    {
      mcpServers: {
        "webservicers-seo": {
          type: "http",
          url: fullEndpoint,
          headers: {
            "x-seo-token": data.apiToken,
          },
        },
      },
    },
    null,
    2
  );

  const copilotKitSnippet = `import { CopilotRuntime } from "@copilotkit/runtime";

export const runtime = new CopilotRuntime({
  mcpServers: [
    {
      endpoint: "${fullEndpoint}",
      apiKey: process.env.WEBSERVICERS_SEO_TOKEN ?? "${data.apiToken}",
    },
  ],
});`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="SEO MCP Agent Setup"
        subtitle="Connect Claude Desktop, Cursor, or CopilotKit directly to your SEO workspace via Model Context Protocol."
        actions={isDemo ? <Badge tone="lilac">Demo Data</Badge> : <Badge tone="success">Live API</Badge>}
      />

      {/* Endpoint & Token Card */}
      <div className="cpki-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-[var(--primary-text)]" />
            <h2 className="text-sm font-semibold">MCP Server Endpoint &amp; Credentials</h2>
          </div>
          <Badge tone="success">Project: {data.projectId}</Badge>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-[var(--muted-foreground)]">
              MCP Endpoint URL
            </label>
            <div className="flex gap-2">
              <input type="text" readOnly className="cpki-input font-mono" value={data.endpointUrl} />
              <Button variant="outline" size="sm" onClick={() => copyText("endpoint", fullEndpoint)}>
                {copiedField === "endpoint" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                Copy
              </Button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium text-[var(--muted-foreground)]">
              API Bearer Token
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted-foreground)]" />
                <input type="text" readOnly className="cpki-input pl-8 font-mono" value={data.apiToken} />
              </div>
              <Button variant="outline" size="sm" onClick={() => copyText("token", data.apiToken)}>
                {copiedField === "token" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                Copy
              </Button>
              <Button variant="quiet" size="sm" onClick={handleRotateToken} disabled={rotating}>
                <RefreshCw className={`h-3.5 w-3.5 ${rotating ? "animate-spin" : ""}`} />
                Rotate
              </Button>
            </div>
          </div>
        </div>

        <div className="pt-1">
          <div className="mb-2 text-[11px] font-medium text-[var(--muted-foreground)]">
            Exposed MCP Tools
          </div>
          <div className="flex flex-wrap gap-1.5">
            {data.availableTools.map((tool) => (
              <Badge key={tool} tone="primary" className="font-mono">
                {tool}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Client Snippets */}
      <div className="cpki-card p-5">
        <div className="mb-3 flex items-center gap-2">
          <Terminal className="h-4 w-4 text-[var(--primary-text)]" />
          <h2 className="text-sm font-semibold">Client Configuration Snippets</h2>
        </div>

        <Tabs defaultValue="claude">
          <TabsList>
            <TabsTrigger value="claude">Claude Desktop</TabsTrigger>
            <TabsTrigger value="cursor">Cursor</TabsTrigger>
            <TabsTrigger value="copilotkit">CopilotKit</TabsTrigger>
          </TabsList>

          <TabsContent value="claude" className="mt-4">
            <div className="relative">
              <Button
                variant="outline"
                size="xs"
                className="absolute right-3 top-3"
                onClick={() => copyText("claude", claudeSnippet)}
              >
                {copiedField === "claude" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                Copy JSON
              </Button>
              <pre className="rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--muted)]/55 p-4 font-mono text-xs overflow-x-auto">
                {claudeSnippet}
              </pre>
            </div>
          </TabsContent>

          <TabsContent value="cursor" className="mt-4">
            <div className="relative">
              <Button
                variant="outline"
                size="xs"
                className="absolute right-3 top-3"
                onClick={() => copyText("cursor", cursorSnippet)}
              >
                {copiedField === "cursor" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                Copy JSON
              </Button>
              <pre className="rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--muted)]/55 p-4 font-mono text-xs overflow-x-auto">
                {cursorSnippet}
              </pre>
            </div>
          </TabsContent>

          <TabsContent value="copilotkit" className="mt-4">
            <div className="relative">
              <Button
                variant="outline"
                size="xs"
                className="absolute right-3 top-3"
                onClick={() => copyText("copilotkit", copilotKitSnippet)}
              >
                {copiedField === "copilotkit" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                Copy TS
              </Button>
              <pre className="rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--muted)]/55 p-4 font-mono text-xs overflow-x-auto">
                {copilotKitSnippet}
              </pre>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
