"use client";

import React, { useState } from "react";
import Link from "next/link";
import { KeyRound, Lock, ShieldAlert, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function AdminSecurityPage() {
  const [enforceAdmin2fa, setEnforceAdmin2fa] = useState(true);
  const [captchaProvider, setCaptchaProvider] = useState("turnstile");
  const [ipAllowlist, setIpAllowlist] = useState("0.0.0.0/0");
  const [sessionTimeoutHours, setSessionTimeoutHours] = useState("24");
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Security & Access Control"
        subtitle="Configure TOTP 2FA enforcement, CAPTCHA shield, session lifetimes, and IP access rules."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/admin/integrations" className="cpki-btn cpki-btn-outline cpki-btn-sm">
              Integration Hub
            </Link>
            <Link href="/admin/logs" className="cpki-btn cpki-btn-primary cpki-btn-sm">
              Audit Logs
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-[12px] font-medium text-[var(--muted-foreground)]">
            <ShieldCheck className="w-4 h-4 text-[var(--success)]" /> Auth & SSO
          </div>
          <div className="text-[18px] font-semibold mt-1">HttpOnly + RBAC</div>
          <div className="text-[11px] text-[var(--muted-foreground)] mt-0.5">SHA-256 session tokens</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-[12px] font-medium text-[var(--muted-foreground)]">
            <KeyRound className="w-4 h-4 text-[var(--primary)]" /> Vault Encryption
          </div>
          <div className="text-[18px] font-semibold mt-1">AES-256-GCM</div>
          <div className="text-[11px] text-[var(--muted-foreground)] mt-0.5">All API keys encrypted at rest</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-[12px] font-medium text-[var(--muted-foreground)]">
            <ShieldAlert className="w-4 h-4 text-[var(--warning)]" /> Bot Protection
          </div>
          <div className="text-[18px] font-semibold mt-1 uppercase">{captchaProvider}</div>
          <div className="text-[11px] text-[var(--muted-foreground)] mt-0.5">Active on login & forms</div>
        </Card>
      </div>

      <form onSubmit={handleSave} className="cpki-card p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[var(--primary)]" />
            <h2 className="text-[14px] font-semibold">Security Policies</h2>
          </div>
          {saved && (
            <Badge className="bg-[var(--success-subtle)] text-[var(--success)]">
              Policies saved
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <label className="flex items-center justify-between p-3.5 rounded-[10px] border border-[var(--border)] bg-[var(--muted)]/40 cursor-pointer">
            <div>
              <div className="text-[13px] font-semibold">Enforce Staff/Admin 2FA</div>
              <div className="text-[11px] text-[var(--muted-foreground)]">
                Require TOTP authenticator verification for admin logins
              </div>
            </div>
            <input
              type="checkbox"
              checked={enforceAdmin2fa}
              onChange={(e) => setEnforceAdmin2fa(e.target.checked)}
              className="h-4 w-4"
            />
          </label>

          <div>
            <label className="block text-[12px] font-medium mb-1">Active CAPTCHA Provider</label>
            <select
              value={captchaProvider}
              onChange={(e) => setCaptchaProvider(e.target.value)}
              className="cpki-select"
            >
              <option value="turnstile">Cloudflare Turnstile</option>
              <option value="recaptcha">Google reCAPTCHA v3</option>
              <option value="hcaptcha">hCaptcha</option>
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-medium mb-1">Session Lifetime (Hours)</label>
            <Input
              type="number"
              min="1"
              max="720"
              value={sessionTimeoutHours}
              onChange={(e) => setSessionTimeoutHours(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium mb-1">Admin IP Allowlist (CIDR, comma-separated)</label>
            <Input
              type="text"
              value={ipAllowlist}
              onChange={(e) => setIpAllowlist(e.target.value)}
              placeholder="0.0.0.0/0"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" variant="primary" size="sm">
            Save Security Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
