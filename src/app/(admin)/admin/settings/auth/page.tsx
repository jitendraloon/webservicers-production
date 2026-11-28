'use client';

import * as React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { CheckCircle2, Save, ShieldCheck, Key, Lock } from 'lucide-react';

export default function AdminSettingsAuthPage() {
  const [registrationMode, setRegistrationMode] = React.useState('open');
  const [requireEmailVerification, setRequireEmailVerification] = React.useState(true);
  const [enforce2fa, setEnforce2fa] = React.useState('admin_only');
  const [sessionTimeoutHours, setSessionTimeoutHours] = React.useState('48');
  const [passwordMinLength, setPasswordMinLength] = React.useState('8');
  const [requireSpecialChar, setRequireSpecialChar] = React.useState(true);
  const [enableGoogleAuth, setEnableGoogleAuth] = React.useState(true);
  const [googleClientId, setGoogleClientId] = React.useState('');
  const [googleClientSecret, setGoogleClientSecret] = React.useState('');
  const [enableGithubAuth, setEnableGithubAuth] = React.useState(true);
  const [githubClientId, setGithubClientId] = React.useState('');
  const [githubClientSecret, setGithubClientSecret] = React.useState('');

  const [toast, setToast] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/settings?section=auth');
        if (res.ok) {
          const json = await res.json();
          if (json.data && Object.keys(json.data).length > 0) {
            const d = json.data;
            if (d.registrationMode) setRegistrationMode(d.registrationMode);
            if (d.requireEmailVerification !== undefined) setRequireEmailVerification(d.requireEmailVerification);
            if (d.enforce2fa) setEnforce2fa(d.enforce2fa);
            if (d.sessionTimeoutHours) setSessionTimeoutHours(d.sessionTimeoutHours);
            if (d.passwordMinLength) setPasswordMinLength(d.passwordMinLength);
            if (d.requireSpecialChar !== undefined) setRequireSpecialChar(d.requireSpecialChar);
            if (d.enableGoogleAuth !== undefined) setEnableGoogleAuth(d.enableGoogleAuth);
            if (d.googleClientId) setGoogleClientId(d.googleClientId);
            if (d.googleClientSecret) setGoogleClientSecret(d.googleClientSecret);
            if (d.enableGithubAuth !== undefined) setEnableGithubAuth(d.enableGithubAuth);
            if (d.githubClientId) setGithubClientId(d.githubClientId);
            if (d.githubClientSecret) setGithubClientSecret(d.githubClientSecret);
          }
        }
      } catch (_) {}
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        registrationMode,
        requireEmailVerification,
        enforce2fa,
        sessionTimeoutHours,
        passwordMinLength,
        requireSpecialChar,
        enableGoogleAuth,
        googleClientId,
        googleClientSecret,
        enableGithubAuth,
        githubClientId,
        githubClientSecret,
      };
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'auth', data: payload }),
      });
      if (res.ok) {
        setToast('Authentication & 2FA settings saved successfully.');
        setTimeout(() => setToast(null), 3000);
      }
    } catch (_) {
      setToast('Failed to save settings.');
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div>
          <h3 className="text-base font-semibold text-[var(--foreground)] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span>3. Authentication & 2FA Security</span>
          </h3>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            Configure customer registration gates, password complexity requirements, mandatory two-factor policies, and OAuth SSO credentials.
          </p>
        </div>
      </div>

      {toast && (
        <div className="px-4 py-2.5 text-xs font-medium flex items-center gap-2 border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 rounded-lg">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select
            label="User Registration Access"
            value={registrationMode}
            onChange={(e) => setRegistrationMode(e.target.value)}
          >
            <option value="open">Open (Anyone can register)</option>
            <option value="invite_only">Invite Only (Requires admin invite token)</option>
            <option value="closed">Closed (Manual staff provisioning only)</option>
          </Select>

          <Select
            label="Two-Factor Authentication (2FA)"
            value={enforce2fa}
            onChange={(e) => setEnforce2fa(e.target.value)}
          >
            <option value="admin_only">Mandatory for Admins & Staff Only</option>
            <option value="all_users">Mandatory for All Users (Enforced)</option>
            <option value="optional">Optional for All Users</option>
          </Select>

          <Input
            label="Session Inactivity Timeout (Hours)"
            type="number"
            value={sessionTimeoutHours}
            onChange={(e) => setSessionTimeoutHours(e.target.value)}
          />
        </div>

        <div className="p-3 bg-[var(--muted)] rounded-lg space-y-3 border border-[var(--border)]">
          <div className="font-semibold text-[var(--foreground)]">Password Complexity Rules</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Minimum Password Length"
              type="number"
              value={passwordMinLength}
              onChange={(e) => setPasswordMinLength(e.target.value)}
              min="8"
              max="64"
            />
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer pb-2">
                <input
                  type="checkbox"
                  checked={requireSpecialChar}
                  onChange={(e) => setRequireSpecialChar(e.target.checked)}
                  className="rounded border-[var(--border)] text-primary focus:ring-primary"
                />
                <span className="text-[var(--foreground)]">Require numbers & special symbols (!@#$%^&*)</span>
              </label>
            </div>
          </div>
        </div>

        {/* OAuth SSO Settings */}
        <div className="p-4 bg-[var(--card)] rounded-lg border border-[var(--border)] space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
            <span className="font-semibold text-[var(--foreground)]">Google OAuth 2.0 Integration</span>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={enableGoogleAuth}
                onChange={(e) => setEnableGoogleAuth(e.target.checked)}
                className="rounded border-[var(--border)] text-primary focus:ring-primary"
              />
              <span className="text-[11px] text-[var(--foreground)]">Enable Google Login</span>
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Google Client ID"
              value={googleClientId}
              onChange={(e) => setGoogleClientId(e.target.value)}
              placeholder="xxxxxxxx.apps.googleusercontent.com"
            />
            <Input
              label="Google Client Secret"
              type="password"
              value={googleClientSecret}
              onChange={(e) => setGoogleClientSecret(e.target.value)}
              placeholder="••••••••••••••••"
            />
          </div>
        </div>

        <div className="p-4 bg-[var(--card)] rounded-lg border border-[var(--border)] space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
            <span className="font-semibold text-[var(--foreground)]">GitHub OAuth Integration</span>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={enableGithubAuth}
                onChange={(e) => setEnableGithubAuth(e.target.checked)}
                className="rounded border-[var(--border)] text-primary focus:ring-primary"
              />
              <span className="text-[11px] text-[var(--foreground)]">Enable GitHub Login</span>
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="GitHub Client ID"
              value={githubClientId}
              onChange={(e) => setGithubClientId(e.target.value)}
              placeholder="Ov23li..."
            />
            <Input
              label="GitHub Client Secret"
              type="password"
              value={githubClientSecret}
              onChange={(e) => setGithubClientSecret(e.target.value)}
              placeholder="••••••••••••••••"
            />
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-[var(--border)]">
          <Button size="sm" type="submit">
            <Save className="w-3.5 h-3.5 mr-1.5" /> Save Authentication & 2FA Settings
          </Button>
        </div>
      </form>
    </Card>
  );
}
