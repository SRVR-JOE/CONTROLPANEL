'use client';

import { useStore } from '@/store';
import { Copy, Trash2, Zap, ArrowDownToLine } from 'lucide-react';
import { useState } from 'react';

export default function ProfileBar() {
  const {
    disguiseSessions,
    selectedSessionId,
    selectedMachineId,
    duplicateProfile,
    deleteProfile,
    setMachineActiveProfile,
    autoIncrementIPs,
  } = useStore();

  const [showAutoIncrement, setShowAutoIncrement] = useState(false);
  const [baseOctet, setBaseOctet] = useState(11);

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
    const remaining = machineProfiles.filter((p) => p.id !== profile.id);
    if (remaining.length > 0) {
      setMachineActiveProfile(session.id, machine.id, remaining[0].id);
    }
    deleteProfile(session.id, profile.id);
  };

  const handleAutoIncrement = () => {
    autoIncrementIPs(session.id, baseOctet);
    setShowAutoIncrement(false);
  };

  return (
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
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-muted hover:bg-surface-2 hover:text-error disabled:opacity-30"
        title="Delete profile"
      >
        <Trash2 className="h-3.5 w-3.5" /> Delete
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

      {/* Timestamp */}
      <span className="ml-auto text-[10px] text-muted">
        Updated: {new Date(profile.updatedAt).toLocaleString()}
      </span>
    </div>
  );
}
