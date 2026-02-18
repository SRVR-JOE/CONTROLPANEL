'use client';

import { useStore } from '@/store';
import { Copy, Trash2, Zap, ArrowDownToLine, Pencil, Check, X, Download, Upload, ClipboardCopy } from 'lucide-react';
import { useState, useRef } from 'react';
import type { DeploymentSection } from '@/types';

const ALL_SECTIONS: { key: DeploymentSection; label: string }[] = [
  { key: 'machineIdentity', label: 'Identity' },
  { key: 'networkAdapters', label: 'Network' },
  { key: 'smbSettings', label: 'SMB' },
  { key: 'windowsSettings', label: 'Windows' },
  { key: 'd3ServiceSettings', label: 'd3 Service' },
  { key: 'performanceTweaks', label: 'Performance' },
];

export default function ProfileBar() {
  const {
    disguiseSessions,
    selectedSessionId,
    selectedMachineId,
    duplicateProfile,
    deleteProfile,
    setMachineActiveProfile,
    autoIncrementIPs,
    renameProfile,
    exportSession,
    importSession,
    copySettingsToMachines,
  } = useStore();

  const [showAutoIncrement, setShowAutoIncrement] = useState(false);
  const [baseOctet, setBaseOctet] = useState(11);
  const [editingName, setEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showCopySettings, setShowCopySettings] = useState(false);
  const [copySections, setCopySections] = useState<DeploymentSection[]>(['windowsSettings', 'smbSettings', 'performanceTweaks']);
  const [copyTargets, setCopyTargets] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const session = disguiseSessions.find((s) => s.id === selectedSessionId);
  const machine = session?.machines.find((m) => m.id === selectedMachineId);
  const profile = session?.profiles.find((p) => p.id === machine?.activeProfileId);

  if (!session || !machine || !profile) return null;

  // Get all profiles for this machine (profiles where identity matches or explicitly assigned)
  const machineProfiles = session.profiles.filter(
    (p) => p.id === machine.activeProfileId || p.machineIdentity.hostname === machine.name
  );

  const handleDuplicate = () => {
    const newProfile = duplicateProfile(session.id, profile.id, `${profile.name} (Copy)`);
    if (newProfile) {
      setMachineActiveProfile(session.id, machine.id, newProfile.id);
    }
  };

  const handleDelete = () => {
    if (machineProfiles.length <= 1) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    const remaining = machineProfiles.filter((p) => p.id !== profile.id);
    if (remaining.length > 0) {
      setMachineActiveProfile(session.id, machine.id, remaining[0].id);
    }
    deleteProfile(session.id, profile.id);
    setConfirmDelete(false);
  };

  const handleAutoIncrement = () => {
    autoIncrementIPs(session.id, baseOctet);
    setShowAutoIncrement(false);
  };

  const handleSaveName = () => {
    if (!editedName.trim()) return;
    renameProfile(session.id, profile.id, editedName.trim());
    setEditingName(false);
  };

  const handleExport = () => {
    const json = exportSession(session.id);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session.name.replace(/[^a-zA-Z0-9]/g, '_')}_session.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const json = ev.target?.result as string;
      importSession(json);
    };
    reader.readAsText(file);
    // Reset so the same file can be imported again
    e.target.value = '';
  };

  const handleCopySettings = () => {
    if (copyTargets.length === 0 || copySections.length === 0) return;
    copySettingsToMachines(session.id, profile.id, copyTargets, copySections);
    setShowCopySettings(false);
  };

  const toggleCopySection = (s: DeploymentSection) => {
    setCopySections((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  };

  const toggleCopyTarget = (id: string) => {
    setCopyTargets((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const otherMachines = session.machines.filter((m) => m.id !== machine.id);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface/60 px-4 py-3 backdrop-blur-sm">
        <span className="text-xs font-medium text-muted">Profile:</span>

        {/* Profile selector */}
        <select
          value={profile.id}
          onChange={(e) => setMachineActiveProfile(session.id, machine.id, e.target.value)}
          className="rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-sm text-foreground outline-none focus:border-accent"
        >
          {machineProfiles.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {/* Rename profile */}
        {editingName ? (
          <div className="flex items-center gap-1">
            <input
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditingName(false); }}
              className="w-32 rounded border border-accent bg-surface-2 px-2 py-1 text-sm text-foreground outline-none"
              autoFocus
            />
            <button onClick={handleSaveName} className="rounded p-1 text-success hover:bg-surface-2"><Check className="h-3 w-3" /></button>
            <button onClick={() => setEditingName(false)} className="rounded p-1 text-error hover:bg-surface-2"><X className="h-3 w-3" /></button>
          </div>
        ) : (
          <button
            onClick={() => { setEditedName(profile.name); setEditingName(true); }}
            className="rounded p-1 text-muted hover:bg-surface-2 hover:text-foreground"
            title="Rename profile"
          >
            <Pencil className="h-3 w-3" />
          </button>
        )}

        <div className="h-6 w-px bg-border" />

        {/* Actions */}
        <button
          onClick={handleDuplicate}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-muted hover:bg-surface-2 hover:text-foreground"
          title="Duplicate profile"
        >
          <Copy className="h-3.5 w-3.5" /> Duplicate
        </button>
        <button
          onClick={handleDelete}
          disabled={machineProfiles.length <= 1}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs disabled:opacity-30 ${
            confirmDelete
              ? 'bg-error/20 text-error'
              : 'text-muted hover:bg-surface-2 hover:text-error'
          }`}
          title={confirmDelete ? 'Click again to confirm delete' : 'Delete profile'}
        >
          <Trash2 className="h-3.5 w-3.5" /> {confirmDelete ? 'Confirm?' : 'Delete'}
        </button>

        <div className="h-6 w-px bg-border" />

        {/* Copy Settings */}
        <button
          onClick={() => setShowCopySettings(!showCopySettings)}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-muted hover:bg-surface-2 hover:text-foreground"
          title="Copy this machine's settings to other machines"
        >
          <ClipboardCopy className="h-3.5 w-3.5" /> Copy To...
        </button>

        <div className="h-6 w-px bg-border" />

        {/* Bulk actions */}
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Bulk</span>
        <button
          onClick={() => setShowAutoIncrement(!showAutoIncrement)}
          className="flex items-center gap-1.5 rounded-lg bg-accent/10 px-2.5 py-1.5 text-xs text-accent hover:bg-accent/20"
        >
          <Zap className="h-3.5 w-3.5" /> Auto-Increment IPs
        </button>

        {showAutoIncrement && (
          <div className="flex items-center gap-2 rounded-lg border border-accent/30 bg-surface-2 px-3 py-1.5">
            <span className="text-xs text-muted">Director starts at .&thinsp;</span>
            <input
              type="number"
              min={1}
              max={254}
              value={baseOctet}
              onChange={(e) => setBaseOctet(Number(e.target.value))}
              className="w-14 rounded bg-background px-2 py-0.5 text-center text-sm text-foreground outline-none"
            />
            <button
              onClick={handleAutoIncrement}
              className="flex items-center gap-1 rounded bg-accent px-2 py-0.5 text-xs font-medium text-white hover:bg-accent/80"
            >
              <ArrowDownToLine className="h-3 w-3" /> Apply
            </button>
          </div>
        )}

        <div className="h-6 w-px bg-border" />

        {/* Export/Import */}
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-muted hover:bg-surface-2 hover:text-foreground"
          title="Export session as JSON"
        >
          <Download className="h-3.5 w-3.5" /> Export
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-muted hover:bg-surface-2 hover:text-foreground"
          title="Import session from JSON"
        >
          <Upload className="h-3.5 w-3.5" /> Import
        </button>
        <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />

        {/* Timestamp */}
        <span className="ml-auto text-[10px] text-muted">
          Updated: {new Date(profile.updatedAt).toLocaleString()}
        </span>
      </div>

      {/* Copy Settings Panel */}
      {showCopySettings && (
        <div className="rounded-xl border border-accent/30 bg-surface/60 px-4 py-3 backdrop-blur-sm">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">
              Copy settings from <span className="text-accent">{machine.name}</span> to:
            </span>
            <button onClick={() => setShowCopySettings(false)} className="rounded p-1 text-muted hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Section checkboxes */}
          <div className="mb-3">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-muted">Sections to copy</span>
            <div className="flex flex-wrap gap-1.5">
              {ALL_SECTIONS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => toggleCopySection(key)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                    copySections.includes(key)
                      ? 'bg-accent text-white'
                      : 'bg-surface-2 text-muted hover:text-foreground'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Target machine checkboxes */}
          <div className="mb-3">
            <div className="mb-1.5 flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Target machines</span>
              <button
                onClick={() => setCopyTargets(copyTargets.length === otherMachines.length ? [] : otherMachines.map((m) => m.id))}
                className="text-[10px] text-accent hover:underline"
              >
                {copyTargets.length === otherMachines.length ? 'Deselect all' : 'Select all'}
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {otherMachines.map((m) => (
                <button
                  key={m.id}
                  onClick={() => toggleCopyTarget(m.id)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                    copyTargets.includes(m.id)
                      ? 'bg-accent text-white'
                      : 'bg-surface-2 text-muted hover:text-foreground'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleCopySettings}
            disabled={copyTargets.length === 0 || copySections.length === 0}
            className="rounded-lg bg-accent px-4 py-1.5 text-xs font-medium text-white hover:bg-accent/80 disabled:opacity-30"
          >
            Apply to {copyTargets.length} machine{copyTargets.length !== 1 ? 's' : ''}
          </button>
        </div>
      )}
    </div>
  );
}
