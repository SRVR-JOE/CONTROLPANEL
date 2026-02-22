'use client';

import { useStore } from '@/store';
import { useShallow } from 'zustand/react/shallow';
import { Server } from 'lucide-react';
import type { D3NetRole, MachineIdentity } from '@/types';

export default function MachineIdentitySection() {
  const { disguiseSessions, selectedSessionId, selectedMachineId, updateProfile } = useStore(
    useShallow((s) => ({
      disguiseSessions: s.disguiseSessions,
      selectedSessionId: s.selectedSessionId,
      selectedMachineId: s.selectedMachineId,
      updateProfile: s.updateProfile,
    }))
  );

  const session = disguiseSessions.find((s) => s.id === selectedSessionId);
  const machine = session?.machines.find((m) => m.id === selectedMachineId);
  const profile = session?.profiles.find((p) => p.id === machine?.activeProfileId);

  if (!session || !machine || !profile) return null;

  const identity = profile.machineIdentity;

  const update = (field: keyof MachineIdentity, value: string | number) => {
    updateProfile(session.id, profile.id, {
      machineIdentity: { ...identity, [field]: value },
    });
  };

  const actors = session.machines.filter((m) => m.role === 'actor');

  return (
    <div className="rounded-xl border border-border bg-surface/60 p-5 backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-2">
        <Server className="h-4 w-4 text-accent" />
        <h3 className="text-sm font-semibold text-foreground">Machine Identity</h3>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Hostname */}
        <div>
          <label className="mb-1 block text-xs text-muted">Hostname</label>
          <input
            value={identity.hostname}
            onChange={(e) => update('hostname', e.target.value)}
            className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
            placeholder="GX3-Actor-1"
          />
        </div>

        {/* d3Net Role */}
        <div>
          <label className="mb-1 block text-xs text-muted">d3Net Role</label>
          <div className="flex gap-1">
            {(['director', 'actor', 'understudy'] as D3NetRole[]).map((role) => (
              <button
                key={role}
                onClick={() => update('role', role)}
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium capitalize transition-all ${
                  identity.role === role
                    ? 'bg-accent text-white'
                    : 'border border-border bg-surface-2 text-muted hover:text-foreground'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* Actor Index (only for actor/understudy) */}
        {identity.role !== 'director' && (
          <div>
            <label className="mb-1 block text-xs text-muted">
              {identity.role === 'actor' ? 'Actor Index' : 'Understudy Index'}
            </label>
            <input
              type="number"
              min={1}
              max={99}
              value={identity.actorIndex}
              onChange={(e) => update('actorIndex', Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
            />
          </div>
        )}

        {/* Understudy For (only for understudy) */}
        {identity.role === 'understudy' && (
          <div>
            <label className="mb-1 block text-xs text-muted">Understudy For</label>
            <select
              value={identity.understudyFor}
              onChange={(e) => update('understudyFor', e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
            >
              <option value="">None</option>
              {actors.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} (Actor {a.index})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Workgroup */}
        <div>
          <label className="mb-1 block text-xs text-muted">Workgroup</label>
          <input
            value={identity.workgroup}
            onChange={(e) => update('workgroup', e.target.value)}
            className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
            placeholder="DISGUISE"
          />
        </div>

        {/* Description */}
        <div className="md:col-span-2 lg:col-span-1">
          <label className="mb-1 block text-xs text-muted">Description</label>
          <input
            value={identity.description}
            onChange={(e) => update('description', e.target.value)}
            className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
            placeholder="Stage Left - Projectors 1-4"
          />
        </div>
      </div>
    </div>
  );
}
