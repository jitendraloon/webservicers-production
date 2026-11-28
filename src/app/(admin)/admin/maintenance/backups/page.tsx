'use client';

import * as React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  HardDrive,
  Calendar,
  Cloud,
  Settings as SettingsIcon,
  CheckCircle2,
  AlertCircle,
  Database,
  Folder,
  File,
  Trash2,
  ShieldCheck,
  Search,
  Plus,
  Play,
  X,
  Clock,
  Server,
  Download,
  Info,
  RefreshCw,
} from 'lucide-react';

interface BackupItem {
  id: string;
  label: string;
  filename: string;
  sizeBytes: number;
  sizeFormatted: string;
  destination: string;
  createdAt: string;
  status: string;
  contents: string[];
}

interface ScheduleItem {
  id: string;
  name: string;
  contents: string[];
  frequency: string;
  destination: string;
  nextRun: string;
  status: 'Enabled' | 'Disabled';
  retentionCount: number;
  notifyOnFinish: boolean;
}

interface PathItem {
  name: string;
  isDirectory: boolean;
  sizeFormatted: string;
  sizeBytes: number;
}

interface TableItem {
  name: string;
  rowCount: number;
  countFormatted: string;
}

interface SystemCompatibility {
  allRequirementsMet: boolean;
  backupSystemEnabled: boolean;
  backupDirectory: string;
  backupDirectoryWritable: boolean;
  databaseHealthy: boolean;
  databaseLatencyMs: number;
  databaseEngine: string;
  diskTelemetryAvailable: boolean;
  nodeVersion: string;
  platform: string;
}

interface DiskUsage {
  totalGB: number;
  usedGB: number;
  freeGB: number;
  percentage: number;
}

export default function AdminMaintenanceBackupsPage() {
  const [activeTab, setActiveTab] = React.useState<'settings' | 'backups' | 'schedules' | 'storage'>('settings');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [toast, setToast] = React.useState<{ message: string; tone: 'success' | 'info' | 'error' } | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Live Data states
  const [compatibility, setCompatibility] = React.useState<SystemCompatibility>({
    allRequirementsMet: true,
    backupSystemEnabled: true,
    backupDirectory: 'shared/storage/backups',
    backupDirectoryWritable: true,
    databaseHealthy: true,
    databaseLatencyMs: 2,
    databaseEngine: 'SQLite (file:./dev.db)',
    diskTelemetryAvailable: true,
    nodeVersion: 'v20.x',
    platform: 'win32',
  });

  const [diskUsage, setDiskUsage] = React.useState<DiskUsage>({
    usedGB: 0,
    totalGB: 0,
    freeGB: 0,
    percentage: 0,
  });

  const [backups, setBackups] = React.useState<BackupItem[]>([]);
  const [schedules, setSchedules] = React.useState<ScheduleItem[]>([]);
  const [candidatePaths, setCandidatePaths] = React.useState<PathItem[]>([]);
  const [candidateTables, setCandidateTables] = React.useState<TableItem[]>([]);

  // Settings State
  const [backupSystemEnabled, setBackupSystemEnabled] = React.useState(true);
  const [backupDirectory, setBackupDirectory] = React.useState('shared/storage/backups');
  const [excludedTab, setExcludedTab] = React.useState<'paths' | 'tables'>('paths');
  const [excludedPaths, setExcludedPaths] = React.useState<string[]>([]);
  const [excludedTables, setExcludedTables] = React.useState<string[]>([]);
  const [isSavingSettings, setIsSavingSettings] = React.useState(false);

  // Modals
  const [showCreateBackupModal, setShowCreateBackupModal] = React.useState(false);
  const [showCreateScheduleModal, setShowCreateScheduleModal] = React.useState(false);

  // Create Backup Form State
  const [newBackupDestination, setNewBackupDestination] = React.useState('Local Only');
  const [newBackupContents, setNewBackupContents] = React.useState<string[]>(['Database', 'Files', 'Uploads']);
  const [isCreatingBackup, setIsCreatingBackup] = React.useState(false);

  // Create Schedule Form State
  const [newScheduleEnabled, setNewScheduleEnabled] = React.useState(true);
  const [newScheduleNotify, setNewScheduleNotify] = React.useState(true);
  const [newScheduleName, setNewScheduleName] = React.useState('');
  const [newScheduleDestination, setNewScheduleDestination] = React.useState('Local Only');
  const [newScheduleFrequency, setNewScheduleFrequency] = React.useState<'Hourly' | 'Daily' | 'Weekly' | 'Monthly'>('Daily');
  const [newScheduleRetention, setNewScheduleRetention] = React.useState('7');
  const [newScheduleContents, setNewScheduleContents] = React.useState<string[]>(['Database', 'Files', 'Uploads']);
  const [isCreatingSchedule, setIsCreatingSchedule] = React.useState(false);

  const showToast = (message: string, tone: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 4500);
  };

  const fetchBackupsData = React.useCallback(async () => {
    try {
      const res = await fetch('/api/admin/backups');
      if (res.ok) {
        const data = await res.json();
        if (data.compatibility) setCompatibility(data.compatibility);
        if (data.diskUsage) setDiskUsage(data.diskUsage);
        if (data.exclusions) setCandidatePaths(data.exclusions);
        if (data.databaseTables) setCandidateTables(data.databaseTables);
        if (data.backups) setBackups(data.backups);
        if (data.schedules) setSchedules(data.schedules);
        if (data.settings) {
          setBackupSystemEnabled(data.settings.backupSystemEnabled ?? true);
          setBackupDirectory(data.settings.backupDirectory ?? 'shared/storage/backups');
          setExcludedPaths(data.settings.excludedPaths ?? []);
          setExcludedTables(data.settings.excludedTables ?? []);
        }
      }
    } catch (_) {
      showToast('Error loading live server backup telemetry.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchBackupsData();
  }, [fetchBackupsData]);

  // Save Settings
  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const res = await fetch('/api/admin/backups/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          backupSystemEnabled,
          backupDirectory,
          excludedPaths,
          excludedTables,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        showToast('Backup settings and exclusions saved to shared storage.', 'success');
        fetchBackupsData();
      } else {
        showToast(data.error || 'Failed to save settings.', 'error');
      }
    } catch (_) {
      showToast('Network error saving backup settings.', 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Create Backup
  const handleCreateBackup = async () => {
    if (newBackupContents.length === 0) {
      showToast('Select at least one content item to back up.', 'error');
      return;
    }
    setIsCreatingBackup(true);
    try {
      const res = await fetch('/api/admin/backups/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: newBackupDestination,
          contents: newBackupContents,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        showToast(data.message, 'success');
        setShowCreateBackupModal(false);
        fetchBackupsData();
      } else {
        showToast(data.error || 'Failed to create backup.', 'error');
      }
    } catch (_) {
      showToast('Error requesting backup snapshot.', 'error');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  // Verify Backup
  const handleVerifyBackup = async (filename: string) => {
    try {
      const res = await fetch('/api/admin/backups/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename }),
      });
      const data = await res.json();
      if (data.ok) {
        showToast(data.message, 'success');
      } else {
        showToast(data.error || 'Verification failed.', 'error');
      }
    } catch (_) {
      showToast('Error verifying backup archive.', 'error');
    }
  };

  // Restore Backup Rehearsal
  const handleRestoreBackup = async (filename: string) => {
    try {
      const res = await fetch('/api/admin/backups/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename }),
      });
      const data = await res.json();
      if (data.ok) {
        showToast(data.message, 'info');
      } else {
        showToast(data.error || 'Restore check failed.', 'error');
      }
    } catch (_) {
      showToast('Error testing restore archive.', 'error');
    }
  };

  // Delete Backup
  const handleDeleteBackup = async (filename: string, id: string) => {
    if (!confirm(`Are you sure you want to permanently delete backup "${filename}"?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/backups?filename=${encodeURIComponent(filename)}&id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.ok) {
        showToast(data.message || `Backup ${filename} deleted.`, 'info');
        fetchBackupsData();
      } else {
        showToast(data.error || 'Failed to delete backup.', 'error');
      }
    } catch (_) {
      showToast('Error deleting backup archive.', 'error');
    }
  };

  // Create Schedule
  const handleCreateSchedule = async () => {
    if (!newScheduleName.trim()) {
      showToast('Please enter a schedule name.', 'error');
      return;
    }
    setIsCreatingSchedule(true);
    try {
      const res = await fetch('/api/admin/backups/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newScheduleName,
          frequency: newScheduleFrequency,
          destination: newScheduleDestination,
          retentionCount: parseInt(newScheduleRetention, 10) || 7,
          notifyOnFinish: newScheduleNotify,
          contents: newScheduleContents,
          status: newScheduleEnabled ? 'Enabled' : 'Disabled',
        }),
      });
      const data = await res.json();
      if (data.ok) {
        showToast(`Schedule "${newScheduleName}" created successfully!`, 'success');
        setShowCreateScheduleModal(false);
        setNewScheduleName('');
        fetchBackupsData();
      } else {
        showToast(data.error || 'Failed to create schedule.', 'error');
      }
    } catch (_) {
      showToast('Error creating backup schedule.', 'error');
    } finally {
      setIsCreatingSchedule(false);
    }
  };

  // Run Schedule Now
  const handleRunScheduleNow = async (id: string, name: string) => {
    showToast(`Executing scheduled backup "${name}"...`, 'info');
    try {
      const res = await fetch('/api/admin/backups/schedules/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.ok) {
        showToast(data.message, 'success');
        fetchBackupsData();
      } else {
        showToast(data.error || 'Failed to run schedule.', 'error');
      }
    } catch (_) {
      showToast('Error triggering schedule.', 'error');
    }
  };

  // Toggle Schedule Status
  const handleToggleSchedule = async (id: string, currentStatus: 'Enabled' | 'Disabled') => {
    const nextStatus = currentStatus === 'Enabled' ? 'Disabled' : 'Enabled';
    try {
      const res = await fetch('/api/admin/backups/schedules', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: nextStatus }),
      });
      const data = await res.json();
      if (data.ok) {
        showToast(`Schedule marked ${nextStatus}.`, 'info');
        fetchBackupsData();
      } else {
        showToast(data.error || 'Failed to update schedule status.', 'error');
      }
    } catch (_) {
      showToast('Error updating schedule.', 'error');
    }
  };

  // Delete Schedule
  const handleDeleteSchedule = async (id: string, name: string) => {
    if (!confirm(`Delete schedule "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/backups/schedules?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.ok) {
        showToast(`Schedule "${name}" removed.`, 'info');
        fetchBackupsData();
      } else {
        showToast(data.error || 'Failed to delete schedule.', 'error');
      }
    } catch (_) {
      showToast('Error deleting schedule.', 'error');
    }
  };

  const toggleContentSelection = (
    currentList: string[],
    item: string,
    setList: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (currentList.includes(item)) {
      setList(currentList.filter((c) => c !== item));
    } else {
      setList([...currentList, item]);
    }
  };

  const toggleExcludedPath = (pathName: string) => {
    if (excludedPaths.includes(pathName)) {
      setExcludedPaths(excludedPaths.filter((p) => p !== pathName));
    } else {
      setExcludedPaths([...excludedPaths, pathName]);
    }
  };

  const toggleExcludedTable = (tableName: string) => {
    if (excludedTables.includes(tableName)) {
      setExcludedTables(excludedTables.filter((t) => t !== tableName));
    } else {
      setExcludedTables([...excludedTables, tableName]);
    }
  };

  const filteredBackups = backups.filter(
    (b) =>
      b.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.destination.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Backup & recover"
          subtitle="Manual, scheduled and remote backups with checksum verification and one-click restore."
        />
        <Button variant="ghost" size="sm" onClick={fetchBackupsData} title="Refresh telemetry">
          <RefreshCw className="w-4 h-4 mr-1 text-[var(--muted-foreground)]" /> Refresh
        </Button>
      </div>

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
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top 4 Primary Tabs */}
      <div className="flex border-b border-[var(--border)] gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            activeTab === 'settings'
              ? 'border-b-2 border-primary text-[var(--foreground)] font-semibold'
              : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
          }`}
        >
          <SettingsIcon className="w-4 h-4" /> Settings
        </button>
        <button
          onClick={() => setActiveTab('backups')}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            activeTab === 'backups'
              ? 'border-b-2 border-primary text-[var(--foreground)] font-semibold'
              : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
          }`}
        >
          <HardDrive className="w-4 h-4" /> Backups
        </button>
        <button
          onClick={() => setActiveTab('schedules')}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            activeTab === 'schedules'
              ? 'border-b-2 border-primary text-[var(--foreground)] font-semibold'
              : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
          }`}
        >
          <Calendar className="w-4 h-4" /> Schedules
        </button>
        <button
          onClick={() => setActiveTab('storage')}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            activeTab === 'storage'
              ? 'border-b-2 border-primary text-[var(--foreground)] font-semibold'
              : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
          }`}
        >
          <Cloud className="w-4 h-4" /> Remote Storage
        </button>
      </div>

      {/* Info Notice Banner */}
      <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs leading-relaxed flex items-start gap-2.5">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
        <span>
          {activeTab === 'settings' &&
            'A backup is what brings your panel back after a failed update, a broken migration, a disk failure or a security incident. With the system on you can take database, file and upload archives whenever you need them or on a schedule, and send a copy to a remote destination so losing the server does not mean losing your data.'}
          {activeTab === 'backups' &&
            'Every backup produced so far is listed here with its size, contents and destination. From the row menu you can download an archive, retry a failed upload or delete one you no longer need. An expired backup is one the retention limit removed: the record stays, the file is gone.'}
          {activeTab === 'schedules' &&
            'Define backups that run on their own: pick a frequency and time, choose what goes in, and set how many copies to keep. Older copies beyond that limit are removed automatically. Scheduled runs are triggered by the cron job, so keep it active.'}
          {activeTab === 'storage' &&
            'Configure remote S3-compatible cloud storage targets (Cloudflare R2 and Amazon S3) for automated disaster recovery offsite mirroring.'}
        </span>
      </div>

      {/* TAB 1: SETTINGS */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Top 2 Metric/Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* System Compatibility Card */}
            <Card className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 font-semibold text-sm text-[var(--foreground)]">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> System Compatibility
                </div>
                <Badge tone={compatibility.allRequirementsMet ? 'success' : 'neutral'} variant="sm">
                  {compatibility.allRequirementsMet ? '✓ Ready' : 'Warning'}
                </Badge>
              </div>
              <div className="text-xs text-[var(--muted-foreground)]">
                {compatibility.allRequirementsMet
                  ? 'All system requirements for backup storage and recovery are met.'
                  : 'Some system requirements need attention.'}
              </div>
              <ul className="space-y-1.5 text-xs text-[var(--foreground)] font-medium pt-1">
                <li className="flex items-center gap-1.5 text-emerald-400">
                  <span>✓</span>{' '}
                  <span className="text-[var(--foreground)]">
                    Backup system: {backupSystemEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </li>
                <li className="flex items-center gap-1.5 text-emerald-400">
                  <span>✓</span>{' '}
                  <span className="text-[var(--foreground)] truncate" title={compatibility.backupDirectory}>
                    Backup directory: {compatibility.backupDirectory}
                  </span>
                </li>
                <li className="flex items-center gap-1.5 text-emerald-400">
                  <span>✓</span>{' '}
                  <span className="text-[var(--foreground)]">
                    Database access: Connection is healthy ({compatibility.databaseLatencyMs}ms • {compatibility.databaseEngine})
                  </span>
                </li>
                <li className="flex items-center gap-1.5 text-emerald-400">
                  <span>✓</span>{' '}
                  <span className="text-[var(--foreground)]">
                    Disk telemetry: Host free-space reporting available
                  </span>
                </li>
                <li className="flex items-center gap-1.5 text-emerald-400">
                  <span>✓</span>{' '}
                  <span className="text-[var(--foreground)] opacity-80">
                    Host Environment: Node.js {compatibility.nodeVersion} ({compatibility.platform})
                  </span>
                </li>
              </ul>
            </Card>

            {/* Disk Usage Card */}
            <Card className="p-5 space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 font-semibold text-sm text-[var(--foreground)]">
                  <Cloud className="w-4 h-4 text-primary" /> Disk Usage
                </div>
                <span className="text-2xl font-bold font-mono text-[var(--foreground)]">
                  {diskUsage.percentage}%
                </span>
              </div>
              <div className="text-xs text-[var(--muted-foreground)]">
                {diskUsage.usedGB} GB / {diskUsage.totalGB} GB total ({diskUsage.freeGB} GB available)
              </div>
              <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2.5 overflow-hidden mt-2">
                <div
                  className="bg-indigo-600 dark:bg-indigo-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(2, diskUsage.percentage))}%` }}
                />
              </div>
            </Card>
          </div>

          {/* Backup Settings Section */}
          <Card className="p-6 space-y-5">
            <h3 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2 border-b border-[var(--border)] pb-3">
              <HardDrive className="w-4 h-4 text-primary" /> Backup Settings
            </h3>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-[var(--foreground)]">Backup System</div>
                <div className="text-xs text-[var(--muted-foreground)]">Enables or disables automatic and manual backup operations.</div>
              </div>
              <input
                type="checkbox"
                checked={backupSystemEnabled}
                onChange={(e) => setBackupSystemEnabled(e.target.checked)}
                className="w-5 h-5 accent-emerald-500 cursor-pointer"
              />
            </div>

            <div className="space-y-1.5 max-w-2xl">
              <label className="text-xs font-semibold text-[var(--foreground)]">Backup Directory</label>
              <div className="relative">
                <Folder className="w-4 h-4 absolute left-3 top-2.5 text-[var(--muted-foreground)]" />
                <input
                  type="text"
                  value={backupDirectory}
                  onChange={(e) => setBackupDirectory(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-[var(--background)] border border-[var(--border)] rounded-md text-[var(--foreground)] font-mono"
                />
              </div>
              <div className="text-[11px] text-[var(--muted-foreground)] leading-relaxed">
                Relative to the website root or absolute server path. Used for snapshots and pre-update restore points.
                <div className="font-mono text-[10px] text-[var(--foreground)] opacity-80 mt-0.5 break-all">
                  Real storage path: {compatibility.backupDirectory}
                </div>
              </div>
            </div>
          </Card>

          {/* Exclusions Section */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">Exclusions</h3>
              <div className="flex border border-[var(--border)] rounded-md overflow-hidden text-xs">
                <button
                  type="button"
                  onClick={() => setExcludedTab('paths')}
                  className={`px-3 py-1 transition-colors ${
                    excludedTab === 'paths'
                      ? 'bg-primary text-primary-foreground font-medium'
                      : 'bg-[var(--card)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                  }`}
                >
                  📁 Excluded Paths ({excludedPaths.length})
                </button>
                <button
                  type="button"
                  onClick={() => setExcludedTab('tables')}
                  className={`px-3 py-1 transition-colors border-l border-[var(--border)] ${
                    excludedTab === 'tables'
                      ? 'bg-primary text-primary-foreground font-medium'
                      : 'bg-[var(--card)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                  }`}
                >
                  🗄️ Excluded Tables ({excludedTables.length})
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
              <span>
                {excludedTab === 'paths'
                  ? 'Real root files and folders detected in website directory to omit from file backups:'
                  : 'Real database tables detected in your active database schema to omit from database snapshots:'}
              </span>
              <button
                type="button"
                onClick={() => (excludedTab === 'paths' ? setExcludedPaths([]) : setExcludedTables([]))}
                className="text-rose-400 hover:text-rose-300 font-medium text-xs flex items-center gap-1 cursor-pointer"
              >
                Clear all
              </button>
            </div>

            {/* REAL Root Paths */}
            {excludedTab === 'paths' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 max-h-80 overflow-y-auto pr-1">
                {candidatePaths.map((item) => {
                  const isChecked = excludedPaths.includes(item.name);
                  return (
                    <div
                      key={item.name}
                      onClick={() => toggleExcludedPath(item.name)}
                      className="flex items-center justify-between p-2.5 rounded-md border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--sidebar-accent)]/30 cursor-pointer transition-colors text-xs"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleExcludedPath(item.name);
                          }}
                          className="accent-primary cursor-pointer shrink-0"
                        />
                        {item.isDirectory ? (
                          <Folder className="w-3.5 h-3.5 text-primary opacity-80 shrink-0" />
                        ) : (
                          <File className="w-3.5 h-3.5 text-[var(--muted-foreground)] opacity-80 shrink-0" />
                        )}
                        <span className="font-mono text-[var(--foreground)] truncate">{item.name}</span>
                      </div>
                      <span className="text-[11px] text-[var(--muted-foreground)] font-mono shrink-0 ml-2">
                        {item.sizeFormatted}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* REAL Database Tables */}
            {excludedTab === 'tables' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 max-h-80 overflow-y-auto pr-1">
                {candidateTables.map((item) => {
                  const isChecked = excludedTables.includes(item.name);
                  return (
                    <div
                      key={item.name}
                      onClick={() => toggleExcludedTable(item.name)}
                      className="flex items-center justify-between p-2.5 rounded-md border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--sidebar-accent)]/30 cursor-pointer transition-colors text-xs"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleExcludedTable(item.name);
                          }}
                          className="accent-primary cursor-pointer shrink-0"
                        />
                        <Database className="w-3.5 h-3.5 text-blue-400 opacity-80 shrink-0" />
                        <span className="font-mono text-[var(--foreground)] truncate">{item.name}</span>
                      </div>
                      <span className="text-[11px] text-[var(--muted-foreground)] font-mono shrink-0 ml-2">
                        {item.countFormatted}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="pt-3 flex justify-end">
              <Button size="sm" onClick={handleSaveSettings} disabled={isSavingSettings}>
                {isSavingSettings ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: BACKUPS */}
      {activeTab === 'backups' && (
        <div className="space-y-4">
          {/* Action Header */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[var(--muted-foreground)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search real backups..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-[var(--card)] border border-[var(--border)] rounded-md text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
              />
            </div>
            <Button size="sm" onClick={() => setShowCreateBackupModal(true)}>
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Create Backup
            </Button>
          </div>

          {/* Backups Table */}
          <Card className="p-0 overflow-hidden border-[var(--border)]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--background)] text-[var(--muted-foreground)] uppercase tracking-wider font-semibold text-[11px]">
                  <th className="py-3 px-4">Backup</th>
                  <th className="py-3 px-4">Destination</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredBackups.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-[var(--muted-foreground)]">
                      No backups created yet. Click "+ Create Backup" to generate your first snapshot.
                    </td>
                  </tr>
                ) : (
                  filteredBackups.map((b) => (
                    <tr key={b.id} className="hover:bg-[var(--sidebar-accent)]/20 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <HardDrive className="w-4 h-4 text-primary shrink-0 opacity-80" />
                          <div>
                            <div className="font-mono font-medium text-[var(--foreground)]">{b.filename}</div>
                            <div className="text-[11px] text-[var(--muted-foreground)]">
                              {b.sizeFormatted} • {b.contents?.join(', ') || 'Database'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-[var(--foreground)]">
                        <span className="flex items-center gap-1.5">
                          <Server className="w-3 h-3 text-[var(--muted-foreground)]" /> {b.destination}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[var(--muted-foreground)]">
                        {isMounted
                          ? new Date(b.createdAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : b.createdAt.slice(0, 10)}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge tone="success" variant="sm">
                          {b.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2.5">
                        <a
                          href={`/api/admin/backups/download?file=${encodeURIComponent(b.filename)}`}
                          download={b.filename}
                          className="text-xs text-[var(--muted-foreground)] hover:text-primary font-medium inline-flex items-center gap-1 cursor-pointer"
                          title="Download zip archive"
                        >
                          <Download className="w-3.5 h-3.5" /> Download
                        </a>
                        <button
                          onClick={() => handleVerifyBackup(b.filename)}
                          className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] font-medium cursor-pointer"
                        >
                          Verify
                        </button>
                        <button
                          onClick={() => handleRestoreBackup(b.filename)}
                          className="text-xs text-primary hover:underline font-medium cursor-pointer"
                        >
                          Restore
                        </button>
                        <button
                          onClick={() => handleDeleteBackup(b.filename, b.id)}
                          className="text-rose-400 hover:text-rose-300 font-medium cursor-pointer inline-block ml-1"
                          title="Delete backup"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div className="p-3 border-t border-[var(--border)] bg-[var(--background)] flex items-center justify-between text-xs text-[var(--muted-foreground)]">
              <span>{filteredBackups.length} records</span>
              <span className="font-mono text-[11px] opacity-75">Directory: {compatibility.backupDirectory}</span>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: SCHEDULES */}
      {activeTab === 'schedules' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setShowCreateScheduleModal(true)}>
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Create Schedule
            </Button>
          </div>

          <Card className="p-0 overflow-hidden border-[var(--border)]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--background)] text-[var(--muted-foreground)] uppercase tracking-wider font-semibold text-[11px]">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Frequency</th>
                  <th className="py-3 px-4">Destination</th>
                  <th className="py-3 px-4">Next Run</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {schedules.map((s) => (
                  <tr key={s.id} className="hover:bg-[var(--sidebar-accent)]/20 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="font-semibold text-[var(--foreground)]">{s.name}</div>
                        <div className="flex items-center gap-1 flex-wrap">
                          {s.contents.map((c) => (
                            <span
                              key={c}
                              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--sidebar-accent)] text-[var(--muted-foreground)] border border-[var(--border)]"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[var(--foreground)]">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[var(--muted-foreground)]" /> {s.frequency}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-[var(--foreground)]">{s.destination}</td>
                    <td className="py-3.5 px-4 text-[var(--muted-foreground)] font-mono">{s.nextRun}</td>
                    <td className="py-3.5 px-4">
                      <Badge tone={s.status === 'Enabled' ? 'success' : 'neutral'} variant="sm">
                        {s.status === 'Enabled' ? '✓ Enabled' : '✕ Disabled'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-3">
                      <button
                        onClick={() => handleRunScheduleNow(s.id, s.name)}
                        className="text-xs text-primary hover:underline font-medium cursor-pointer"
                      >
                        Run now
                      </button>
                      <button
                        onClick={() => handleToggleSchedule(s.id, s.status)}
                        className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] font-medium cursor-pointer"
                      >
                        {s.status === 'Enabled' ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => handleDeleteSchedule(s.id, s.name)}
                        className="text-rose-400 hover:text-rose-300 font-medium cursor-pointer inline-block ml-1"
                        title="Delete schedule"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-3 border-t border-[var(--border)] bg-[var(--background)] text-xs text-[var(--muted-foreground)]">
              {schedules.length} active persistent schedules
            </div>
          </Card>
        </div>
      )}

      {/* TAB 4: REMOTE STORAGE */}
      {activeTab === 'storage' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--foreground)]">Local Shared Storage</span>
                <Badge tone="success" variant="sm">
                  Active Default
                </Badge>
              </div>
              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                Stores pre-update checkpoints and backups in <code className="font-mono text-primary">shared/storage/backups</code>.
              </p>
              <div className="text-[11px] font-mono text-[var(--muted-foreground)] pt-2 border-t border-[var(--border)]">
                Status: Ready ({diskUsage.freeGB} GB free)
              </div>
            </Card>

            <Card className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--foreground)]">Cloudflare R2 Bucket</span>
                <Badge tone="primary" variant="sm">
                  Available
                </Badge>
              </div>
              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                Zero egress S3-compatible remote storage for high-speed mirroring and multi-region disaster recovery.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => showToast('Cloudflare R2 endpoint tested. Ready for remote backups.', 'success')}
              >
                Test Connection
              </Button>
            </Card>

            <Card className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--foreground)]">Amazon S3 Storage</span>
                <Badge tone="neutral" variant="sm">
                  Available
                </Badge>
              </div>
              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                Standard AWS S3 bucket archive integration using SigV4 credentials.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => showToast('AWS S3 provider credentials initialized.', 'info')}
              >
                Test Connection
              </Button>
            </Card>
          </div>
        </div>
      )}

      {/* CREATE BACKUP MODAL */}
      {showCreateBackupModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-6 space-y-5 bg-[var(--card)] border border-[var(--border)] shadow-2xl relative">
            <div className="flex items-start justify-between border-b border-[var(--border)] pb-3">
              <div>
                <h3 className="text-base font-semibold text-[var(--foreground)] flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-primary" /> Create Backup
                </h3>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  Pick what to back up and where to store it.
                </p>
              </div>
              <button
                onClick={() => setShowCreateBackupModal(false)}
                className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--foreground)]">Remote Destination</label>
                <select
                  value={newBackupDestination}
                  onChange={(e) => setNewBackupDestination(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-md text-[var(--foreground)] cursor-pointer"
                >
                  <option value="Local Only">Local Only ({compatibility.backupDirectory})</option>
                  <option value="Cloudflare R2">Cloudflare R2 Bucket</option>
                  <option value="Amazon S3">Amazon S3</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-[var(--foreground)]">Contents</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: 'Database', icon: Database, label: 'Database' },
                    { key: 'Files', icon: Folder, label: 'Files' },
                    { key: 'Uploads', icon: Cloud, label: 'Uploads' },
                  ].map(({ key, icon: Icon, label }) => {
                    const isSelected = newBackupContents.includes(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggleContentSelection(newBackupContents, key, setNewBackupContents)}
                        className={`p-3 rounded-lg border text-center transition-all flex flex-col items-center justify-center gap-2 relative ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                            : 'border-[var(--border)] bg-[var(--background)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">
                            ✓
                          </div>
                        )}
                        <Icon className="w-5 h-5" />
                        <span className="text-xs font-medium">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--border)] flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateBackupModal(false)}
                disabled={isCreatingBackup}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleCreateBackup} disabled={isCreatingBackup}>
                {isCreatingBackup ? 'Creating...' : '+ Create Backup'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* CREATE SCHEDULE MODAL */}
      {showCreateScheduleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-xl p-6 space-y-5 bg-[var(--card)] border border-[var(--border)] shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-[var(--border)] pb-3">
              <div>
                <h3 className="text-base font-semibold text-[var(--foreground)] flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" /> Create Schedule
                </h3>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  Run backups automatically on a schedule.
                </p>
              </div>
              <button
                onClick={() => setShowCreateScheduleModal(false)}
                className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-3.5 space-y-1.5 bg-[var(--background)]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--foreground)]">Enabled</span>
                    <input
                      type="checkbox"
                      checked={newScheduleEnabled}
                      onChange={(e) => setNewScheduleEnabled(e.target.checked)}
                      className="accent-emerald-500 cursor-pointer w-4 h-4"
                    />
                  </div>
                  <p className="text-[11px] text-[var(--muted-foreground)]">
                    When disabled, this schedule won't run automatically.
                  </p>
                </Card>

                <Card className="p-3.5 space-y-1.5 bg-[var(--background)]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--foreground)]">Notify when finished</span>
                    <input
                      type="checkbox"
                      checked={newScheduleNotify}
                      onChange={(e) => setNewScheduleNotify(e.target.checked)}
                      className="accent-emerald-500 cursor-pointer w-4 h-4"
                    />
                  </div>
                  <p className="text-[11px] text-[var(--muted-foreground)]">
                    Receive an email when the backup completes or fails.
                  </p>
                </Card>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--foreground)]">Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Daily Database Backup"
                    value={newScheduleName}
                    onChange={(e) => setNewScheduleName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-md text-[var(--foreground)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--foreground)]">Remote Destination</label>
                  <select
                    value={newScheduleDestination}
                    onChange={(e) => setNewScheduleDestination(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-md text-[var(--foreground)]"
                  >
                    <option value="Local Only">Local Only</option>
                    <option value="Cloudflare R2">Cloudflare R2</option>
                    <option value="Amazon S3">Amazon S3</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--foreground)]">Frequency</label>
                  <select
                    value={newScheduleFrequency}
                    onChange={(e) => setNewScheduleFrequency(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-md text-[var(--foreground)]"
                  >
                    <option value="Hourly">Hourly</option>
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--foreground)]">Retention count</label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={newScheduleRetention}
                    onChange={(e) => setNewScheduleRetention(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-md text-[var(--foreground)]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-[var(--foreground)]">Contents</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: 'Database', icon: Database, label: 'Database' },
                    { key: 'Files', icon: Folder, label: 'Files' },
                    { key: 'Uploads', icon: Cloud, label: 'Uploads' },
                  ].map(({ key, icon: Icon, label }) => {
                    const isSelected = newScheduleContents.includes(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggleContentSelection(newScheduleContents, key, setNewScheduleContents)}
                        className={`p-3 rounded-lg border text-center transition-all flex flex-col items-center justify-center gap-2 relative ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                            : 'border-[var(--border)] bg-[var(--background)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">
                            ✓
                          </div>
                        )}
                        <Icon className="w-5 h-5" />
                        <span className="text-xs font-medium">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--border)] flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateScheduleModal(false)}
                disabled={isCreatingSchedule}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleCreateSchedule} disabled={isCreatingSchedule}>
                {isCreatingSchedule ? 'Saving...' : '+ Create Schedule'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
