'use client';

import { useStore } from '@/store';
import { useShallow } from 'zustand/react/shallow';
import { Cog } from 'lucide-react';
import type { D3ServiceSettings, D3ServiceStartup } from '@/types';

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

const startupLabels: Record<D3ServiceStartup, string> = {
  auto: 'Auto Start',
  manual: 'Manual',
  disabled: 'Disabled',
};

export default function D3ServiceSection() {
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

  const svc = profile.d3ServiceSettings;
  const adapters = profile.networkAdapters;

  const update = (field: keyof D3ServiceSettings, value: string | number | boolean) => {
    updateProfile(session.id, profile.id, {
      d3ServiceSettings: { ...svc, [field]: value },
    });
  };

  return (
    <div className="rounded-xl border border-border bg-surface/60 p-5 backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-2">
        <Cog className="h-4 w-4 text-accent" />
        <h3 className="text-sm font-semibold text-foreground">d3 Service</h3>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Startup */}
        <div>
          <label className="mb-1 block text-xs text-muted">d3Service Startup</label>
          <select
            value={svc.startup}
            onChange={(e) => update('startup', e.target.value as D3ServiceStartup)}
            className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          >
            {Object.entries(startupLabels).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        {/* API Port */}
        <div>
          <label className="mb-1 block text-xs text-muted">API Port</label>
          <input
            type="number"
            min={1}
            max={65535}
            value={svc.apiPort}
            onChange={(e) => update('apiPort', Number(e.target.value))}
            className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          />
        </div>

        {/* Designer Version */}
        <div>
          <label className="mb-1 block text-xs text-muted">Designer Version</label>
          <input
            value={svc.designerVersion}
            onChange={(e) => update('designerVersion', e.target.value)}
            className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
            placeholder="r27.1"
          />
        </div>

        {/* d3Net Adapter */}
        <div>
          <label className="mb-1 block text-xs text-muted">d3Net Adapter (bind to)</label>
          <select
            value={svc.d3netAdapter}
            onChange={(e) => update('d3netAdapter', e.target.value)}
            className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          >
            {adapters.map((a) => (
              <option key={a.id} value={a.adapterName}>{a.adapterName}</option>
            ))}
          </select>
        </div>

        {/* Sync Port */}
        <div>
          <label className="mb-1 block text-xs text-muted">Sync Port (QTP)</label>
          <input
            type="number"
            min={1}
            max={65535}
            value={svc.syncPort}
            onChange={(e) => update('syncPort', Number(e.target.value))}
            className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          />
        </div>

        {/* VSync Port */}
        <div>
          <label className="mb-1 block text-xs text-muted">VSync Port</label>
          <input
            type="number"
            min={1}
            max={65535}
            value={svc.vsyncPort}
            onChange={(e) => update('vsyncPort', Number(e.target.value))}
            className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          />
        </div>
      </div>

      <div className="mt-4">
        <Toggle value={svc.genlock} onChange={(v) => update('genlock', v)} label="Genlock" />
      </div>
    </div>
  );
}
