'use client';

import { useStore } from '@/store';
import { FolderOpen } from 'lucide-react';
import type { SMBSettings, SMBVersion } from '@/types';

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-foreground">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`relative h-6 w-11 rounded-full transition-colors ${value ? 'bg-accent' : 'bg-border'}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            value ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}

export default function SMBSettingsSection() {
  const { disguiseSessions, selectedSessionId, selectedMachineId, updateProfile } = useStore();

  const session = disguiseSessions.find((s) => s.id === selectedSessionId);
  const machine = session?.machines.find((m) => m.id === selectedMachineId);
  const profile = session?.profiles.find((p) => p.id === machine?.activeProfileId);

  if (!session || !machine || !profile) return null;

  const smb = profile.smbSettings;

  const update = (field: keyof SMBSettings, value: string | boolean) => {
    updateProfile(session.id, profile.id, {
      smbSettings: { ...smb, [field]: value },
    });
  };

  // Find director's d3net IP for share target
  const director = session.machines.find((m) => m.role === 'director');
  const dirProfile = session.profiles.find((p) => p.id === director?.activeProfileId);
  const dirD3NetIp = dirProfile?.networkAdapters.find((a) => a.role === 'd3net')?.ipAddress ?? '?';

  return (
    <div className="rounded-xl border border-border bg-surface/60 p-5 backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-2">
        <FolderOpen className="h-4 w-4 text-accent" />
        <h3 className="text-sm font-semibold text-foreground">SMB File Sharing</h3>
      </div>

      <div className="space-y-4">
        {/* Main toggle */}
        <Toggle value={smb.enabled} onChange={(v) => update('enabled', v)} label="File Sharing" />

        {smb.enabled && (
          <>
            {/* Paths */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-muted">Share Path</label>
                <input
                  value={smb.sharePath}
                  onChange={(e) => update('sharePath', e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm font-mono text-foreground outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">Share Name</label>
                <input
                  value={smb.shareName}
                  onChange={(e) => update('shareName', e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Toggle value={smb.networkDiscovery} onChange={(v) => update('networkDiscovery', v)} label="Network Discovery" />
              <Toggle value={smb.passwordProtected} onChange={(v) => update('passwordProtected', v)} label="Password Protected" />
              <Toggle value={smb.guestAccess} onChange={(v) => update('guestAccess', v)} label="Guest Access" />
              <Toggle value={smb.allowInsecureGuest} onChange={(v) => update('allowInsecureGuest', v)} label="AllowInsecureGuest (Win11)" />
            </div>

            {/* SMB Version */}
            <div>
              <label className="mb-1 block text-xs text-muted">SMB Version</label>
              <select
                value={smb.smbVersion}
                onChange={(e) => update('smbVersion', e.target.value as SMBVersion)}
                className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
              >
                <option value="SMBv1">SMBv1</option>
                <option value="SMBv2">SMBv2</option>
                <option value="SMBv3">SMBv3</option>
              </select>
            </div>

            {/* Director share target */}
            {machine.role !== 'director' && (
              <div className="rounded-lg border border-accent/20 bg-accent/5 px-4 py-3">
                <span className="text-xs text-muted">Director Share Target:</span>
                <span className="ml-2 font-mono text-sm text-accent">
                  \\{dirD3NetIp}\{smb.shareName}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
