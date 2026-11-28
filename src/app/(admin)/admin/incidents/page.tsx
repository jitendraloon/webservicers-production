"use client";

import React, { useState } from "react";
import { AlertTriangle, CheckCircle2, Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface Incident {
  id: string;
  title: string;
  component: string;
  severity: "MINOR" | "MAJOR" | "CRITICAL";
  status: "INVESTIGATING" | "MONITORING" | "RESOLVED";
  updatedAt: string;
}

const INITIAL_INCIDENTS: Incident[] = [
  {
    id: "INC-104",
    title: "DataForSEO SERP latency spike",
    component: "SEO Data Waterfall",
    severity: "MINOR",
    status: "RESOLVED",
    updatedAt: "2 hours ago",
  },
  {
    id: "INC-103",
    title: "PerfectPanel webhook retry queue",
    component: "SMM Sync Worker",
    severity: "MINOR",
    status: "MONITORING",
    updatedAt: "Yesterday",
  },
];

export default function AdminIncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>(INITIAL_INCIDENTS);
  const [title, setTitle] = useState("");
  const [component, setComponent] = useState("Core API");

  const addIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIncidents((prev) => [
      {
        id: `INC-${105 + prev.length}`,
        title: title.trim(),
        component,
        severity: "MINOR",
        status: "INVESTIGATING",
        updatedAt: "Just now",
      },
      ...prev,
    ]);
    setTitle("");
  };

  const resolveIncident = (id: string) => {
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === id ? { ...inc, status: "RESOLVED", updatedAt: "Just now" } : inc))
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Incidents & Status Log"
        subtitle="Track operational incidents, provider degradations, and resolution timelines."
      />

      <form onSubmit={addIncident} className="cpki-card p-4 flex flex-col sm:flex-row gap-3 items-end">
        <div className="flex-1 w-full">
          <label className="block text-[11px] font-medium mb-1">Incident Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Describe incident or degradation..."
          />
        </div>
        <div className="w-full sm:w-48">
          <label className="block text-[11px] font-medium mb-1">Component</label>
          <Input value={component} onChange={(e) => setComponent(e.target.value)} />
        </div>
        <Button type="submit" variant="primary" size="sm">
          <Plus className="w-3.5 h-3.5" /> Log Incident
        </Button>
      </form>

      <Card className="overflow-hidden">
        <div className="divide-y divide-[var(--border)]">
          {incidents.map((inc) => (
            <div key={inc.id} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                {inc.status === "RESOLVED" ? (
                  <CheckCircle2 className="w-4 h-4 text-[var(--success)] mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-[var(--warning)] mt-0.5" />
                )}
                <div>
                  <div className="text-[13px] font-semibold">
                    <span className="font-mono text-[11px] text-[var(--muted-foreground)] mr-2">{inc.id}</span>
                    {inc.title}
                  </div>
                  <div className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
                    {inc.component} · Updated {inc.updatedAt}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  className={
                    inc.status === "RESOLVED"
                      ? "bg-[var(--success-subtle)] text-[var(--success)]"
                      : "bg-[var(--warning-subtle)] text-[var(--warning)]"
                  }
                >
                  {inc.status}
                </Badge>
                {inc.status !== "RESOLVED" && (
                  <Button variant="outline" size="xs" onClick={() => resolveIncident(inc.id)}>
                    Resolve
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
