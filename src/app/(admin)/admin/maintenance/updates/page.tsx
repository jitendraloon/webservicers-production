'use client';

import * as React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select, Input } from '@/components/ui/Input';
import {
  RefreshCw,
  CheckCircle2,
  ArrowUpCircle,
  AlertTriangle,
  Server,
  ShieldCheck,
  Database,
  History,
  Terminal,
  UploadCloud,
  RotateCcw,
  XCircle,
  Power,
  Pause,
  Play,
} from 'lucide-react';

interface SystemStatus {
  currentVersion: string;
  releasePath: string;
  releaseSource: string;
  isLocked: boolean;
  runnerState?: {
    jobId: string;
    status: string;
    progressPercent: number;
    currentStep: string;
    errorMessage?: string;
    logs: Array<{ timestamp: string; level: string; message: string }>;
  };
  recentBackups?: Array<{
    id: string;
    label: string;
    version: string;
    checksum: string;
    createdAt: string;
  }>;
}

interface UpdateCheckResult {
  hasUpdate: boolean;
  targetVersion?: string;
  provider?: string;
  manifest?: any;
  message?: string;
  error?: string;
}

export default function AdminMaintenanceUpdatesPage() {
  const [channel, setChannel] = React.useState('stable');
  const [statusData, setStatusData] = React.useState<SystemStatus | null>(null);
  const [checkResult, setCheckResult] = React.useState<UpdateCheckResult | null>(null);
  const [isChecking, setIsChecking] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [autoRunEnabled, setAutoRunEnabled] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'overview' | 'providers' | 'manual' | 'rollback'>('overview');
  const [toast, setToast] = React.useState<{ tone: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [uploadFile, setUploadFile] = React.useState<File | null>(null);
  const [uploadManifest, setUploadManifest] = React.useState<File | null>(null);
  const [uploadSig, setUploadSig] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [manualVerified, setManualVerified] = React.useState<any | null>(null);

  // GitHub Provider settings form state (initialized from persistent cache)
  const [ghOwner, setGhOwner] = React.useState('jitendraloon');
  const [ghRepo, setGhRepo] = React.useState('webservicers-releases');
  const [ghToken, setGhToken] = React.useState('');
  const [testingProvider, setTestingProvider] = React.useState(false);

  // Local ref for internal terminal box only (prevents window scrolling)
  const terminalLogsBoxRef = React.useRef<HTMLDivElement>(null);

  const formatVersion = (v?: string) => (v ? `v${v.replace(/^v+/i, '')}` : '');

  const showToast = (message: string, tone: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchProviderConfigs = React.useCallback(async () => {
    try {
      const res = await fetch('/api/admin/updates/providers');
      if (res.ok) {
        const data = await res.json();
        const gh = data.savedConfigs?.find((c: any) => c.providerType === 'GITHUB');
        if (gh?.config) {
          if (gh.config.owner) {
            setGhOwner(gh.config.owner);
            try { localStorage.setItem('ws_updater_gh_owner', gh.config.owner); } catch (_) {}
          }
          if (gh.config.repo) {
            setGhRepo(gh.config.repo);
            try { localStorage.setItem('ws_updater_gh_repo', gh.config.repo); } catch (_) {}
          }
          if (gh.config.token !== undefined) {
            setGhToken(gh.config.token);
          }
        }
      }
    } catch (_) {}
  }, []);

  // Load auto-run preference and cached provider configuration from localStorage on mount
  React.useEffect(() => {
    try {
      const savedAutoRun = localStorage.getItem('ws_autorun_updates');
      if (savedAutoRun !== null) {
        setAutoRunEnabled(savedAutoRun === 'true');
      }
      const cachedOwner = localStorage.getItem('ws_updater_gh_owner');
      if (cachedOwner) setGhOwner(cachedOwner);
      const cachedRepo = localStorage.getItem('ws_updater_gh_repo');
      if (cachedRepo) setGhRepo(cachedRepo);
    } catch (_) {}

    fetchProviderConfigs();
  }, [fetchProviderConfigs]);

  const toggleAutoRun = () => {
    const newVal = !autoRunEnabled;
    setAutoRunEnabled(newVal);
    try {
      localStorage.setItem('ws_autorun_updates', String(newVal));
    } catch (_) {}
    showToast(
      newVal
        ? 'Automatic background updates enabled. System will auto-apply verified security patches.'
        : 'Automatic background updates disabled. Updates require manual approval.',
      newVal ? 'info' : 'success'
    );
  };

  const fetchStatus = React.useCallback(async () => {
    try {
      const res = await fetch('/api/admin/updates/status');
      if (res.ok) {
        const data = await res.json();
        setStatusData(data);
        const status = data.runnerState?.status;
        const activeRun =
          Boolean(data.isLocked) ||
          (status && !['IDLE', 'COMPLETED', 'FAILED', 'ROLLED_BACK', 'CANCELED'].includes(status));
        setIsUpdating(Boolean(activeRun));
      }
    } catch (_) {}
  }, []);

  React.useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Polling ONLY when update is genuinely executing in background
  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isUpdating) {
      timer = setInterval(() => {
        fetchStatus();
      }, 2000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isUpdating, fetchStatus]);

  // Auto-install background trigger when enabled & release available
  React.useEffect(() => {
    if (
      autoRunEnabled &&
      checkResult?.hasUpdate &&
      !isUpdating &&
      !statusData?.isLocked &&
      (!statusData?.runnerState?.status ||
        ['IDLE', 'COMPLETED', 'FAILED', 'ROLLED_BACK', 'CANCELED'].includes(statusData.runnerState.status))
    ) {
      const autoTimer = setTimeout(() => {
        triggerUpdateExecution(false);
      }, 2500);
      return () => clearTimeout(autoTimer);
    }
  }, [
    autoRunEnabled,
    checkResult?.hasUpdate,
    checkResult?.targetVersion,
    isUpdating,
    statusData?.isLocked,
    statusData?.runnerState?.status,
  ]);

  // Scroll ONLY the internal terminal box, NEVER jumping the parent window
  React.useEffect(() => {
    if (terminalLogsBoxRef.current) {
      terminalLogsBoxRef.current.scrollTop = terminalLogsBoxRef.current.scrollHeight;
    }
  }, [statusData?.runnerState?.logs]);

  const checkForUpdates = React.useCallback(async (silentOption: boolean | unknown = false) => {
    const isSilent = silentOption === true;
    setIsChecking(true);
    try {
      const res = await fetch(`/api/admin/updates/check?channel=${channel}`);
      const data = await res.json();
      setCheckResult(data);
      if (data.hasUpdate) {
        showToast(`New update v${data.targetVersion} is ready to install via ${data.provider}!`, 'info');
      } else if (!isSilent) {
        showToast(data.message || 'System is running the latest verified release.', 'success');
      }
    } catch (err: any) {
      if (!isSilent) {
        showToast('Error checking upstream release providers.', 'error');
      }
    } finally {
      setIsChecking(false);
    }
  }, [channel]);

  // Check for updates on mount and whenever channel changes
  React.useEffect(() => {
    checkForUpdates(true);
  }, [checkForUpdates]);

  const triggerUpdateExecution = async (requireConfirm = true) => {
    if (requireConfirm) {
      if (!confirm('Are you sure you want to install this update? A pre-update backup will be created automatically.')) {
        return;
      }
    }
    setIsUpdating(true);
    try {
      const res = await fetch('/api/admin/updates/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel }),
      });
      const data = await res.json();
      if (data.ok) {
        showToast('Update process initiated! Monitoring real-time deployment progress...', 'info');
        fetchStatus();
      } else {
        showToast(data.error || 'Failed to start update.', 'error');
        setIsUpdating(false);
      }
    } catch (err: any) {
      showToast('Failed to trigger update.', 'error');
      setIsUpdating(false);
    }
  };

  const triggerUpdateNow = () => triggerUpdateExecution(true);

  const cancelActiveUpdate = async () => {
    if (!confirm('Are you sure you want to cancel the active update? The deployment lock will be released.')) {
      return;
    }
    try {
      const res = await fetch('/api/admin/updates/cancel', { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        showToast(data.message || 'Update canceled and engine unlocked.', 'info');
        setIsUpdating(false);
        fetchStatus();
      } else {
        showToast(data.error || 'Failed to cancel update.', 'error');
      }
    } catch (_) {
      showToast('Error requesting update cancellation.', 'error');
    }
  };

  const pauseUpdateProcess = () => {
    setAutoRunEnabled(false);
    try {
      localStorage.setItem('ws_autorun_updates', 'false');
    } catch (_) {}
    showToast('Auto-install paused. Release remains queued for manual execution.', 'info');
  };

  const resetUpdateEngine = async () => {
    try {
      const res = await fetch('/api/admin/updates/reset', { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        showToast('Update engine state reset to IDLE and locks released.', 'success');
        setIsUpdating(false);
        fetchStatus();
      } else {
        showToast(data.error || 'Failed to reset update engine.', 'error');
      }
    } catch (_) {
      showToast('Error requesting update reset.', 'error');
    }
  };

  const handleManualUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      showToast('Please select a release package archive (.tar.gz or .zip).', 'error');
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('package', uploadFile);
      if (uploadManifest) {
        fd.append('manifest', uploadManifest);
      }
      if (uploadSig) {
        fd.append('signature', uploadSig);
      }

      const res = await fetch('/api/admin/updates/upload', {
        method: 'POST',
        body: fd,
      });

      const data = await res.json();
      if (data.ok) {
        setManualVerified(data.manifest);
        showToast(data.message, 'success');
        setCheckResult({
          hasUpdate: true,
          targetVersion: data.manifest.version,
          provider: 'Manual Signed Package',
          manifest: data.manifest,
        });
      } else {
        showToast(data.error || 'Package validation failed.', 'error');
      }
    } catch (err: any) {
      showToast('Upload failed.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const testProviderConnection = async () => {
    setTestingProvider(true);
    try {
      const res = await fetch('/api/admin/updates/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerType: 'GITHUB',
          config: { owner: ghOwner, repo: ghRepo, token: ghToken || undefined },
          testOnly: true,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        showToast(`GitHub connection verified (${data.latencyMs}ms). ${data.message}`, 'success');
      } else {
        showToast(`Connection failed: ${data.message}`, 'error');
      }
    } catch (_) {
      showToast('Failed to connect to provider.', 'error');
    } finally {
      setTestingProvider(false);
    }
  };

  const saveProviderConfig = async () => {
    try {
      try {
        localStorage.setItem('ws_updater_gh_owner', ghOwner);
        localStorage.setItem('ws_updater_gh_repo', ghRepo);
      } catch (_) {}

      const res = await fetch('/api/admin/updates/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerType: 'GITHUB',
          name: 'GitHub Releases (Primary)',
          priority: 1,
          config: { owner: ghOwner, repo: ghRepo, token: ghToken || undefined },
        }),
      });
      const data = await res.json();
      if (data.ok) {
        showToast(data.message, 'success');
        await fetchProviderConfigs();
        await fetchStatus();
      } else {
        showToast(data.error || 'Failed to save configuration.', 'error');
      }
    } catch (_) {
      showToast('Failed to save configuration.', 'error');
    }
  };

  const triggerRollback = async (version: string) => {
    if (!confirm(`Are you sure you want to rollback to v${version}? The previous release pointer will be restored.`)) {
      return;
    }
    try {
      const res = await fetch('/api/admin/updates/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version }),
      });
      const data = await res.json();
      if (data.ok) {
        showToast(data.message, 'success');
        fetchStatus();
      } else {
        showToast(data.error || 'Rollback failed.', 'error');
      }
    } catch (_) {
      showToast('Error requesting rollback.', 'error');
    }
  };

  const currentVersion = statusData?.currentVersion || 'v1.0.0';
  const runner = statusData?.runnerState;
  const isRunning = Boolean(
    (isUpdating || statusData?.isLocked) &&
    runner?.status &&
    !['IDLE', 'COMPLETED', 'FAILED', 'ROLLED_BACK', 'CANCELED'].includes(runner.status)
  );

  const engineStatus: 'RUNNING' | 'PENDING' | 'IDLE' = React.useMemo(() => {
    if (isRunning || (runner?.status && !['IDLE', 'COMPLETED', 'FAILED', 'ROLLED_BACK', 'CANCELED'].includes(runner.status))) {
      return 'RUNNING';
    }
    if (checkResult?.hasUpdate || runner?.status === 'PENDING') {
      return 'PENDING';
    }
    return 'IDLE';
  }, [isRunning, runner?.status, checkResult?.hasUpdate]);

  const engineTone: 'primary' | 'lilac' | 'success' | 'neutral' =
    engineStatus === 'RUNNING'
      ? 'primary'
      : engineStatus === 'PENDING'
      ? 'lilac'
      : autoRunEnabled
      ? 'success'
      : 'neutral';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <PageHeader
        title="Permanent Automated Updates"
        subtitle="Manage release channels, verify digital signatures, inspect migrations, and execute one-click zero-downtime updates."
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={isChecking || isRunning}
              onClick={checkForUpdates}
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isChecking ? 'animate-spin' : ''}`} />
              Check for Updates
            </Button>
            {checkResult?.hasUpdate && !isRunning && (
              <Button size="sm" onClick={triggerUpdateNow} className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium">
                <ArrowUpCircle className="w-3.5 h-3.5 mr-1.5" />
                Update Now to {formatVersion(checkResult.targetVersion)}
              </Button>
            )}
          </div>
        }
      />

      {toast && (
        <div
          className={`px-4 py-3 text-xs font-medium rounded-lg flex items-center gap-2 border transition-all ${
            toast.tone === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : toast.tone === 'error'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
          }`}
        >
          {toast.tone === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-[var(--border)] gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 transition-colors ${
            activeTab === 'overview'
              ? 'border-b-2 border-primary text-[var(--foreground)] font-semibold'
              : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
          }`}
        >
          Overview & Deployment
        </button>
        <button
          onClick={() => setActiveTab('providers')}
          className={`pb-3 transition-colors ${
            activeTab === 'providers'
              ? 'border-b-2 border-primary text-[var(--foreground)] font-semibold'
              : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
          }`}
        >
          Update Providers & Security
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`pb-3 transition-colors ${
            activeTab === 'manual'
              ? 'border-b-2 border-primary text-[var(--foreground)] font-semibold'
              : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
          }`}
        >
          Manual Package Upload
        </button>
        <button
          onClick={() => setActiveTab('rollback')}
          className={`pb-3 transition-colors ${
            activeTab === 'rollback'
              ? 'border-b-2 border-primary text-[var(--foreground)] font-semibold'
              : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
          }`}
        >
          Backups & Rollback
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[var(--muted-foreground)]">Installed Platform Version</span>
                <Badge tone="success" variant="sm">
                  Active
                </Badge>
              </div>
              <div className="text-3xl font-mono font-bold text-[var(--foreground)]">{currentVersion}</div>
              <div className="text-xs text-[var(--muted-foreground)] flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-primary" />
                <span>Pointer: {statusData?.releaseSource || 'symlink'}</span>
              </div>
              <Select
                label="Release Channel"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                disabled={isRunning}
              >
                <option value="stable">Stable (Production Recommended)</option>
                <option value="beta">Beta / Early Access</option>
              </Select>
            </Card>

            <Card className="p-5 space-y-3 md:col-span-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[var(--foreground)]">
                    {checkResult?.hasUpdate
                      ? `Update Available: ${formatVersion(checkResult.targetVersion)}`
                      : 'Upstream Distribution Status'}
                  </span>
                  <Badge tone={checkResult?.hasUpdate ? 'primary' : 'success'} variant="sm">
                    {checkResult?.hasUpdate ? 'Verified & Ready' : 'Up to Date'}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-[var(--muted-foreground)] leading-relaxed">
                  {checkResult?.hasUpdate
                    ? `Cryptographically signed release ${formatVersion(checkResult.targetVersion)} is published on ${checkResult.provider}. Includes database compatibility analysis, verified SHA-256 package digest, and automatic pre-update backup snapshot.`
                    : 'Your installation is synchronized with the latest authorized release. All production uploads, database credentials, and customer data in shared persistent storage are preserved.'}
                </p>
              </div>

              <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)]">
                <div className="flex items-center gap-3">
                  {checkResult?.hasUpdate && !isRunning ? (
                    <Button
                      size="sm"
                      onClick={triggerUpdateNow}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                    >
                      <ArrowUpCircle className="w-4 h-4 mr-2" /> Update Now to {formatVersion(checkResult.targetVersion)}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isChecking || isRunning}
                      onClick={checkForUpdates}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isChecking ? 'animate-spin' : ''}`} />
                      {isChecking ? 'Checking Upstream Providers...' : 'Check for Updates'}
                    </Button>
                  )}

                  {/* Auto-Run Toggle Switch */}
                  <div
                    onClick={toggleAutoRun}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] cursor-pointer select-none hover:border-primary/50 transition-colors"
                    title="Click to toggle automatic background installation"
                  >
                    <Power className={`w-3.5 h-3.5 ${autoRunEnabled ? 'text-emerald-400' : 'text-neutral-500'}`} />
                    <span className="text-xs font-medium text-[var(--foreground)]">
                      Auto-Install:
                    </span>
                    <Badge tone={autoRunEnabled ? 'success' : 'neutral'} variant="sm">
                      {autoRunEnabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)] ml-auto">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Ed25519 Signed
                  </span>
                  <span className="flex items-center gap-1">
                    <Database className="w-3.5 h-3.5 text-blue-400" /> Safe Migrations
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Real-time Update Progress & Live Terminal (Always visible with live IDLE, PENDING, or RUNNING status) */}
          <Card className="p-6 space-y-4 border-[var(--border)] bg-[var(--card)] shadow-sm">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
                  {engineStatus === 'RUNNING' ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                  ) : engineStatus === 'PENDING' ? (
                    <ArrowUpCircle className="w-4 h-4 text-purple-400" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                  {engineStatus === 'RUNNING'
                    ? `Automated Update In Progress: ${runner?.progressPercent || 0}%`
                    : engineStatus === 'PENDING'
                    ? `Automated Update Pending: ${formatVersion(checkResult?.targetVersion || '1.0.8')}`
                    : autoRunEnabled
                    ? 'Automated Update Engine: Active (Idle)'
                    : 'Automated Update Engine: Standby (Idle)'}
                </h3>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {engineStatus === 'RUNNING'
                    ? runner?.currentStep || 'Applying update...'
                    : engineStatus === 'PENDING'
                    ? autoRunEnabled
                      ? 'Auto-install mode enabled. Release is queued for automatic background execution.'
                      : 'Auto-install mode disabled. Update ready for manual installation.'
                    : autoRunEnabled
                    ? 'Auto-install mode enabled. Actively monitoring upstream release channels.'
                    : 'Auto-install mode disabled. Standing by for manual update checks.'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={engineTone} variant="sm">
                  {engineStatus}
                </Badge>
                {engineStatus === 'PENDING' && autoRunEnabled && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={pauseUpdateProcess}
                    className="text-xs text-amber-400 hover:text-amber-300 border-amber-500/30"
                  >
                    <Pause className="w-3.5 h-3.5 mr-1" /> Pause Auto-Install
                  </Button>
                )}
                {(isRunning || statusData?.isLocked || runner?.status === 'RUNNING' || runner?.status === 'PENDING') && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={cancelActiveUpdate}
                    className="text-xs text-rose-400 hover:text-rose-300 border-rose-500/40"
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" /> Cancel Update
                  </Button>
                )}
                {(runner?.status === 'FAILED' || runner?.status === 'ROLLED_BACK' || runner?.status === 'CANCELED' || (statusData?.isLocked && !isRunning)) && (
                  <Button size="sm" variant="outline" onClick={resetUpdateEngine} className="text-xs text-neutral-300">
                    <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset Engine
                  </Button>
                )}
              </div>
            </div>

            {/* Real-time Progress Bar & Step Tracker */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                <span className="font-medium text-[var(--foreground)]">
                  {engineStatus === 'RUNNING'
                    ? runner?.currentStep || 'Executing deployment step...'
                    : engineStatus === 'PENDING'
                    ? 'Pending execution queue'
                    : 'Engine Idle & Healthy'}
                </span>
                <span className="font-mono font-semibold text-[var(--foreground)]">
                  {engineStatus === 'RUNNING'
                    ? `${runner?.progressPercent || 0}% Completed`
                    : engineStatus === 'PENDING'
                    ? 'Queued (Auto-Ready)'
                    : '100% Ready'}
                </span>
              </div>
              <div className="w-full bg-neutral-800 rounded-full h-3 overflow-hidden p-0.5 border border-neutral-700/50">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    engineStatus === 'RUNNING'
                      ? 'bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 animate-pulse'
                      : engineStatus === 'PENDING'
                      ? 'bg-purple-500/60'
                      : autoRunEnabled
                      ? 'bg-emerald-500/40'
                      : 'bg-neutral-600'
                  }`}
                  style={{
                    width:
                      engineStatus === 'RUNNING'
                        ? `${Math.max(5, runner?.progressPercent || 5)}%`
                        : engineStatus === 'PENDING'
                        ? '15%'
                        : '0%',
                  }}
                />
              </div>
            </div>

            {/* Live Terminal Log Viewer with internal scroll box only */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                <span className="flex items-center gap-1 font-mono">
                  <Terminal className="w-3.5 h-3.5" /> Deployment Execution Logs
                </span>
                <span>Job ID: {runner?.jobId || (engineStatus === 'RUNNING' ? 'job-active' : engineStatus === 'PENDING' ? 'job-pending-queue' : 'job-standby')}</span>
              </div>
              <div
                ref={terminalLogsBoxRef}
                className="bg-neutral-950 rounded-lg p-4 font-mono text-xs text-neutral-300 h-56 overflow-y-auto space-y-1 border border-neutral-800"
              >
                {runner?.logs && runner.logs.length > 0 ? (
                  runner.logs.map((log, idx) => (
                    <div key={idx} className="leading-relaxed flex items-start gap-2">
                      <span className="text-neutral-500 shrink-0">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span
                        className={`font-semibold shrink-0 uppercase text-[10px] px-1 rounded ${
                          log.level === 'error'
                            ? 'bg-rose-950 text-rose-400'
                            : log.level === 'warn'
                            ? 'bg-amber-950 text-amber-400'
                            : 'bg-emerald-950 text-emerald-400'
                        }`}
                      >
                        {log.level}
                      </span>
                      <span className="text-neutral-200">{log.message}</span>
                    </div>
                  ))
                ) : (
                  <div className="space-y-1.5 text-neutral-400 select-none">
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-600 font-mono">[{new Date().toLocaleTimeString()}]</span>
                      <span className="bg-emerald-950 text-emerald-400 font-semibold uppercase text-[10px] px-1 rounded">SYSTEM</span>
                      <span>Automated Update Engine initialized and healthy.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-600 font-mono">[{new Date().toLocaleTimeString()}]</span>
                      <span className="bg-blue-950 text-blue-400 font-semibold uppercase text-[10px] px-1 rounded">CONFIG</span>
                      <span>Upstream release channel: <strong className="text-neutral-200">{channel}</strong> | Provider: <strong className="text-neutral-200">{ghOwner}/{ghRepo}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-600 font-mono">[{new Date().toLocaleTimeString()}]</span>
                      <span className={`font-semibold uppercase text-[10px] px-1 rounded ${autoRunEnabled ? 'bg-purple-950 text-purple-400' : 'bg-neutral-900 text-neutral-400'}`}>AUTO-INSTALL</span>
                      <span>Mode: <strong className={autoRunEnabled ? 'text-purple-300' : 'text-neutral-300'}>{autoRunEnabled ? 'ENABLED (Background Auto-Apply)' : 'DISABLED (Manual Approval Required)'}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 pt-1 border-t border-neutral-900 text-neutral-500">
                      <span className="text-neutral-600 font-mono">[{new Date().toLocaleTimeString()}]</span>
                      <span className="bg-neutral-900 text-neutral-400 font-semibold uppercase text-[10px] px-1 rounded">STATUS</span>
                      <span>
                        {engineStatus === 'PENDING'
                          ? `Release ${formatVersion(checkResult?.targetVersion)} detected and pending installation.`
                          : autoRunEnabled
                          ? 'Engine is IDLE. Standing by for scheduled cron executions and security patches.'
                          : 'Engine is IDLE. Click "Check for Updates" to poll upstream releases.'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Release Notes & Changelog */}
          {checkResult?.manifest && (
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-semibold text-[var(--foreground)]">
                    Release Information — {formatVersion(checkResult.manifest.version)}
                  </h3>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Published on {new Date(checkResult.manifest.releaseDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={checkResult.manifest.migrations?.hasMigrations ? 'warning' : 'success'} variant="sm">
                    {checkResult.manifest.migrations?.hasMigrations
                      ? 'Contains Database Migration'
                      : 'Zero Migration'}
                  </Badge>
                  <Badge tone="primary" variant="sm">
                    Est. Restart: {checkResult.manifest.maintenance?.estimatedDowntimeSeconds || 5}s
                  </Badge>
                </div>
              </div>

              <div className="prose prose-sm dark:prose-invert max-w-none text-xs text-[var(--foreground)]">
                <pre className="p-3 bg-[var(--background)] rounded-md whitespace-pre-wrap font-sans text-xs border border-[var(--border)] leading-relaxed">
                  {checkResult.manifest.changelog || 'No release notes provided.'}
                </pre>
              </div>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'providers' && (
        <Card className="p-6 space-y-6">
          <div className="border-b border-[var(--border)] pb-4">
            <h3 className="text-base font-semibold text-[var(--foreground)]">Update Providers Configuration</h3>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              Configure upstream release distribution channels. Provider credentials are encrypted using AES-256-GCM
              and never stored in plaintext.
            </p>
          </div>

          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] bg-[var(--background)]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded bg-neutral-800 text-white">
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-medium text-[var(--foreground)]">GitHub Releases</div>
                  <div className="text-xs text-[var(--muted-foreground)]">Primary upstream provider (Priority 1)</div>
                </div>
              </div>
              <Badge tone="success" variant="sm">
                Connected
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="GitHub Organization / Owner"
                value={ghOwner}
                onChange={(e) => setGhOwner(e.target.value)}
                placeholder="jitendraloon"
              />
              <Input
                label="Repository Name"
                value={ghRepo}
                onChange={(e) => setGhRepo(e.target.value)}
                placeholder="webservicers-releases"
              />
            </div>

            <Input
              label="GitHub Personal Access Token (Optional for public repos)"
              type="password"
              value={ghToken}
              onChange={(e) => setGhToken(e.target.value)}
              placeholder="ghp_••••••••••••••••••••••••••••••••••••"
            />

            <div className="flex items-center gap-3 pt-2">
              <Button size="sm" onClick={saveProviderConfig}>
                Save Provider Credentials
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={testingProvider}
                onClick={testProviderConnection}
              >
                {testingProvider ? 'Testing...' : 'Test Connection'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'manual' && (
        <Card className="p-6 space-y-6">
          <div className="border-b border-[var(--border)] pb-4">
            <h3 className="text-base font-semibold text-[var(--foreground)]">Manual Signed Package Upload</h3>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              Upload an authorized WebServicers release package (.tar.gz or .zip) signed with the official Ed25519 private key.
            </p>
          </div>

          <form onSubmit={handleManualUpload} className="space-y-4 max-w-xl">
            <div>
              <label className="text-xs font-medium text-[var(--foreground)] block mb-1.5">
                Release Package Archive (.tar.gz or .zip) *
              </label>
              <input
                type="file"
                accept=".tar.gz,.zip,.tgz"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-[var(--muted-foreground)] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 border border-[var(--border)] rounded-md p-2"
              />
              <p className="text-[11px] text-[var(--muted-foreground)] mt-1">
                The main application package archive (e.g. <code>webservicers-v1.0.9.zip</code>).
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-[var(--foreground)] block mb-1.5">
                Release Manifest (release-manifest.json)
              </label>
              <input
                type="file"
                accept=".json"
                onChange={(e) => setUploadManifest(e.target.files?.[0] || null)}
                className="w-full text-xs text-[var(--muted-foreground)] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-neutral-800 file:text-white border border-[var(--border)] rounded-md p-2"
              />
              <p className="text-[11px] text-[var(--muted-foreground)] mt-1">
                Release metadata file from GitHub Releases. Optional if bundled inside the archive.
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-[var(--foreground)] block mb-1.5">
                Digital Signature (release-manifest.json.sig)
              </label>
              <input
                type="file"
                accept=".sig,.txt"
                onChange={(e) => setUploadSig(e.target.files?.[0] || null)}
                className="w-full text-xs text-[var(--muted-foreground)] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-neutral-800 file:text-white border border-[var(--border)] rounded-md p-2"
              />
              <p className="text-[11px] text-[var(--muted-foreground)] mt-1">
                Ed25519 cryptographic signature file. Optional if bundled inside the archive.
              </p>
            </div>

            <Button size="sm" type="submit" disabled={uploading || !uploadFile}>
              <UploadCloud className="w-3.5 h-3.5 mr-1.5" />
              {uploading ? 'Verifying & Staging...' : 'Upload & Verify Package'}
            </Button>
          </form>

          {manualVerified && (
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 space-y-2">
              <div className="text-sm font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Package v{manualVerified.version} Verified Successfully!
              </div>
              <p className="text-xs text-neutral-300">
                The uploaded release package has been verified with Ed25519 signature and SHA-256 digest. You can now
                switch to the Overview tab and click Update Now.
              </p>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'rollback' && (
        <Card className="p-6 space-y-6">
          <div className="border-b border-[var(--border)] pb-4">
            <h3 className="text-base font-semibold text-[var(--foreground)]">Pre-Update Backups & Rollback</h3>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              Before any update is applied, an immutable recovery snapshot is created in shared persistent storage.
              Rollback restores the previous active release pointer and configuration without wiping customer data.
            </p>
          </div>

          <div className="space-y-3">
            {statusData?.recentBackups && statusData.recentBackups.length > 0 ? (
              <div className="divide-y divide-[var(--border)] border border-[var(--border)] rounded-lg overflow-hidden">
                {statusData.recentBackups.map((b) => (
                  <div key={b.id} className="p-4 flex items-center justify-between text-xs bg-[var(--card)]">
                    <div className="space-y-1">
                      <div className="font-semibold text-[var(--foreground)] flex items-center gap-2">
                        <History className="w-3.5 h-3.5 text-primary" />
                        {b.label} — Version v{b.version}
                      </div>
                      <div className="text-[var(--muted-foreground)] font-mono text-[11px]">
                        ID: {b.id} • SHA-256: {b.checksum.slice(0, 16)}...
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[var(--muted-foreground)]">
                        {new Date(b.createdAt).toLocaleDateString()}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => triggerRollback(b.version)}
                        className="text-rose-400 hover:text-rose-300 hover:border-rose-500/50"
                      >
                        <RotateCcw className="w-3 h-3 mr-1" /> Rollback
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-[var(--muted-foreground)] p-6 text-center border border-dashed border-[var(--border)] rounded-lg">
                No previous backup snapshots recorded. Pre-update snapshots are created automatically during each update run.
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
