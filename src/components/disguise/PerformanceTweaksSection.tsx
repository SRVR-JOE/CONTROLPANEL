'use client';

import { useStore } from '@/store';
import { Gauge, AlertTriangle } from 'lucide-react';
import { Toggle } from '@/components/ui/Toggle';
import type { PerformanceTweaks, CodecPreference, ActorGUIMode } from '@/types';

const codecLabels: Record<CodecPreference, string> = {
  'hap-hapq': 'HAP / HAPQ (GPU)',
  'notch': 'Notch (GPU)',
  'photo-jpeg': 'Photo-JPEG (CPU)',
  'h264-h265': 'H.264 / H.265',
};

const guiModeLabels: Record<ActorGUIMode, string> = {
  disabled: 'Disabled',
  minimal: 'Minimal',
  full: 'Full',
};

export default function PerformanceTweaksSection() {
  const { disguiseSessions, selectedSessionId, selectedMachineId, updateProfile } = useStore();

  const session = disguiseSessions.find((s) => s.id === selectedSessionId);
  const machine = session?.machines.find((m) => m.id === selectedMachineId);
  const profile = session?.profiles.find((p) => p.id === machine?.activeProfileId);

  if (!session || !machine || !profile) return null;

  const perf = profile.performanceTweaks;

  const update = (field: keyof PerformanceTweaks, value: string | boolean) => {
    updateProfile(session.id, profile.id, {
      performanceTweaks: { ...perf, [field]: value },
    });
  };

  return (
    <div className="rounded-xl border border-border bg-surface/60 p-5 backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-2">
        <Gauge className="h-4 w-4 text-accent" />
        <h3 className="text-sm font-semibold text-foreground">Performance Tweaks</h3>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* GPU Driver Version */}
          <div>
            <label className="mb-1 block text-xs text-muted">GPU Driver Version</label>
            <input
              value={perf.gpuDriverVersion}
              onChange={(e) => update('gpuDriverVersion', e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
              placeholder="546.33"
            />
          </div>

          {/* Codec Preference */}
          <div>
            <label className="mb-1 block text-xs text-muted">Codec Preference</label>
            <select
              value={perf.codecPreference}
              onChange={(e) => update('codecPreference', e.target.value as CodecPreference)}
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
            >
              {Object.entries(codecLabels).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          {/* GUI on Actor */}
          <div>
            <label className="mb-1 block text-xs text-muted">GUI on Actor</label>
            <select
              value={perf.guiOnActor}
              onChange={(e) => update('guiOnActor', e.target.value as ActorGUIMode)}
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
            >
              {Object.entries(guiModeLabels).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Toggles */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Toggle
            enabled={perf.gpuDriverLock}
            onChange={(v) => update('gpuDriverLock', v)}
            label="GPU Driver Lock"
          />
          <Toggle
            enabled={perf.ndiTools5Installed}
            onChange={(v) => update('ndiTools5Installed', v)}
            label="NDI Tools 5"
            warning
          />
        </div>

        {/* NDI warning banner */}
        {perf.ndiTools5Installed && (
          <div className="flex items-center gap-2 rounded-lg border border-error/30 bg-error/10 px-4 py-2">
            <AlertTriangle className="h-4 w-4 text-error" />
            <span className="text-xs text-error">
              NDI Tools 5 has been linked to BSOD events on disguise servers. It is strongly recommended to uninstall.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
