"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle, Check, Save, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { fetchSeoWithFallback, mutateSeoWithFallback } from "../_lib/seo-client";

interface ProjectSettings {
  id: string;
  projectName: string;
  domain: string;
  brandName: string;
  targetCountry: string;
  targetLanguage: string;
}

const DEMO_SETTINGS: ProjectSettings = {
  id: "proj_webservicers_01",
  projectName: "WebServicers Growth",
  domain: "webservicers.io",
  brandName: "WebServicers",
  targetCountry: "US",
  targetLanguage: "en",
};

export default function SeoSettingsPage() {
  const [form, setForm] = useState<ProjectSettings>(DEMO_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [isDemo, setIsDemo] = useState(true);

  useEffect(() => {
    void (async () => {
      const res = await fetchSeoWithFallback<ProjectSettings>("/api/seo/projects/current", DEMO_SETTINGS);
      setForm(res.data);
      setIsDemo(!res.fromApi);
    })();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await mutateSeoWithFallback(`/api/seo/projects/${form.id}`, "PATCH", form, form);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleDeleteProject = async () => {
    await mutateSeoWithFallback(`/api/seo/projects/${form.id}`, "DELETE", undefined, { ok: true });
    setDeleteModalOpen(false);
    setDeleted(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="SEO Project Settings"
        subtitle="Configure project identity, primary domain, target market, and lifecycle controls."
        actions={isDemo ? <Badge tone="lilac">Demo Data</Badge> : <Badge tone="success">Live API</Badge>}
      />

      {deleted ? (
        <div className="cpki-card p-6 text-center space-y-2">
          <p className="text-sm font-semibold">Project deleted</p>
          <p className="text-xs text-[var(--muted-foreground)]">
            {form.projectName} has been removed from your active workspace.
          </p>
        </div>
      ) : (
        <>
          <form onSubmit={handleSave} className="cpki-card p-5 space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium">Project Name</label>
                <input
                  type="text"
                  required
                  className="cpki-input"
                  value={form.projectName}
                  onChange={(e) => setForm({ ...form, projectName: e.target.value })}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium">Primary Domain</label>
                <input
                  type="text"
                  required
                  className="cpki-input"
                  value={form.domain}
                  onChange={(e) => setForm({ ...form, domain: e.target.value })}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium">Brand Name (used in GEO tracking)</label>
                <input
                  type="text"
                  required
                  className="cpki-input"
                  value={form.brandName}
                  onChange={(e) => setForm({ ...form, brandName: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium">Target Country</label>
                  <select
                    className="cpki-select"
                    value={form.targetCountry}
                    onChange={(e) => setForm({ ...form, targetCountry: e.target.value })}
                  >
                    <option value="US">United States</option>
                    <option value="GB">United Kingdom</option>
                    <option value="IN">India</option>
                    <option value="CA">Canada</option>
                    <option value="DE">Germany</option>
                    <option value="AU">Australia</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium">Language</label>
                  <select
                    className="cpki-select"
                    value={form.targetLanguage}
                    onChange={(e) => setForm({ ...form, targetLanguage: e.target.value })}
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="de">German</option>
                    <option value="fr">French</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] pt-4">
              {saved && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--success)]">
                  <Check className="h-3.5 w-3.5" /> Settings saved
                </span>
              )}
              <Button type="submit" disabled={saving}>
                <Save className="h-3.5 w-3.5" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>

          {/* Danger Zone */}
          <div className="cpki-card border-[var(--destructive)]/40 p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-[var(--destructive)] shrink-0 mt-0.5" />
              <div>
                <h2 className="text-sm font-semibold text-[var(--foreground)]">Delete SEO Project</h2>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Permanently remove {form.projectName}, including tracked keywords, crawls, and MCP tokens.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="!border-[var(--destructive)]/50 !text-[var(--destructive)]"
              onClick={() => setDeleteModalOpen(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Project
            </Button>
          </div>
        </>
      )}

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Project Deletion"
      >
        <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
          Are you sure you want to delete <strong>{form.projectName}</strong> ({form.domain})? This action cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setDeleteModalOpen(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="!bg-[var(--destructive)] !border-[var(--destructive)]"
            onClick={handleDeleteProject}
          >
            Delete Permanently
          </Button>
        </div>
      </Modal>
    </div>
  );
}
