'use client';

import { useStore } from '@/store';
import { Settings } from 'lucide-react';
import { Toggle } from '@/components/ui/Toggle';
import type { WindowsSettings, PowerPlan, WindowsUpdatePolicy } from '@/types';

const powerPlanLabels: Record<PowerPlan, string> = {
  'balanced': 'Balanced',
  'high-performance': 'High Performance',
  'ultimate-performance': 'Ultimate Performance',
};

const updatePolicyLabels: Record<WindowsUpdatePolicy, string> = {
  'enabled': 'Enabled',
  'paused': 'Paused',
  'disabled': 'Disabled',
};

export default function WindowsSettingsSection() {
  const { disguiseSessions, selectedSessionId, selectedMachineId, updateProfile } = useStore();

  const session = disguiseSessions.find((s) => s.id === selectedSessionId);
  const machine = session?.machines.find((m) => m.id === selectedMachineId);
  const profile = session?.profiles.find((p) => p.id === machine?.activeProfileId);

  if (!session || !machine || !profile) return null;

  const win = profile.windowsSettings;

  const update = (field: keyof WindowsSettings, value: string | boolean) => {
    updateProfile(session.id, profile.id, {
      windowsSettings: { ...win, [field]: value },
    });
  };

  return (
    <div className="rounded-xl border border-border bg-surface/60 p-5 backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-2">
        <Settings className="h-4 w-4 text-accent" />
        <h3 className="text-sm font-semibold text-foreground">Windows System</h3>
      </div>

      <div className="space-y-4">
        {/* Dropdowns row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs text-muted">Power Plan</label>
            <select
              value={win.powerPlan}
              onChange={(e) => update('powerPlan', e.target.value as PowerPlan)}
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
            >
              {Object.entries(powerPlanLabels).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Windows Update</label>
            <select
              value={win.windowsUpdate}
              onChange={(e) => update('windowsUpdate', e.target.value as WindowsUpdatePolicy)}
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
            >
              {Object.entries(updatePolicyLabels).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Toggles */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Toggle enabled={win.sleepWhenPlugged} onChange={(v) => update('sleepWhenPlugged', v)} label="Sleep When Plugged In" />
          <Toggle enabled={win.hibernate} onChange={(v) => update('hibernate', v)} label="Hibernate" />
          <Toggle enabled={win.windowsFirewall} onChange={(v) => update('windowsFirewall', v)} label="Windows Firewall" />
          <Toggle enabled={win.remoteDesktop} onChange={(v) => update('remoteDesktop', v)} label="Remote Desktop" />
          <Toggle
            enabled={win.antivirus}
            onChange={(v) => update('antivirus', v)}
            label="Antivirus"
            warning
          />
          <Toggle enabled={win.visualEffectsPerformance} onChange={(v) => update('visualEffectsPerformance', v)} label="Visual Effects: Performance" />
          <Toggle enabled={win.usbSelectiveSuspend} onChange={(v) => update('usbSelectiveSuspend', v)} label="USB Selective Suspend" />
        </div>
      </div>
    </div>
  );
}
