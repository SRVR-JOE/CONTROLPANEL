'use client';

import { useStore } from '@/store';
import { Network, Wifi, WifiOff } from 'lucide-react';
import { useState } from 'react';
import type { NetworkAdapterConfig, NetworkAdapterRole, LinkSpeed } from '@/types';

const adapterRoleLabels: Record<NetworkAdapterRole, string> = {
  'd3net': 'd3Net',
  'media': 'Media',
  'artnet-sacn': 'Art-Net/sACN',
  'kvm': 'KVM',
  'control': 'Control',
  'mgmt': 'MGMT',
};

const linkSpeedOptions: LinkSpeed[] = ['auto', '100Mbps', '1GbE', '2.5GbE', '5GbE', '10GbE', '25GbE', '40GbE', '100GbE'];

function IPInput({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const octets = value.split('.');
  while (octets.length < 4) octets.push('');

  const handleOctetChange = (index: number, val: string) => {
    const num = val.replace(/\D/g, '');
    const clamped = Math.min(255, Math.max(0, Number(num) || 0));
    const newOctets = [...octets];
    newOctets[index] = num === '' ? '' : String(clamped);
    onChange(newOctets.join('.'));
  };

  return (
    <div className="flex items-center gap-0.5">
      {octets.map((octet, i) => (
        <div key={i} className="flex items-center">
          <input
            value={octet}
            onChange={(e) => handleOctetChange(i, e.target.value)}
            disabled={disabled}
            className="w-12 rounded border border-border bg-background px-1.5 py-1.5 text-center text-sm text-foreground outline-none focus:border-accent disabled:opacity-40"
            maxLength={3}
          />
          {i < 3 && <span className="px-0.5 text-muted">.</span>}
        </div>
      ))}
    </div>
  );
}

export default function NetworkAdaptersSection() {
  const { disguiseSessions, selectedSessionId, selectedMachineId, setSelectedMachine, updateProfile } = useStore();
  const [activeTab, setActiveTab] = useState<NetworkAdapterRole>('d3net');

  const session = disguiseSessions.find((s) => s.id === selectedSessionId);
  const machine = session?.machines.find((m) => m.id === selectedMachineId);
  const profile = session?.profiles.find((p) => p.id === machine?.activeProfileId);

  if (!session || !machine || !profile) return null;

  const adapters = profile.networkAdapters;
  const activeAdapter = adapters.find((a) => a.role === activeTab);

  const updateAdapter = (adapterId: string, field: keyof NetworkAdapterConfig, value: string | number | boolean) => {
    updateProfile(session.id, profile.id, {
      networkAdapters: adapters.map((a) =>
        a.id === adapterId ? { ...a, [field]: value } : a
      ),
    });
  };

  if (!activeAdapter) return null;

  return (
    <div className="rounded-xl border border-border bg-surface/60 p-5 backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-2">
        <Network className="h-4 w-4 text-accent" />
        <h3 className="text-sm font-semibold text-foreground">Network Adapters</h3>
      </div>

      {/* Adapter tabs */}
      <div className="mb-4 flex flex-wrap gap-1 rounded-lg bg-surface-2/50 p-1">
        {adapters.map((adapter) => (
          <button
            key={adapter.role}
            onClick={() => setActiveTab(adapter.role)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              activeTab === adapter.role
                ? 'bg-accent text-white shadow'
                : 'text-muted hover:text-foreground'
            }`}
          >
            {adapter.enabled ? (
              <Wifi className="h-3 w-3" />
            ) : (
              <WifiOff className="h-3 w-3 opacity-40" />
            )}
            {adapterRoleLabels[adapter.role]}
          </button>
        ))}
      </div>

      {/* Active adapter config */}
      <div className="space-y-4">
        {/* Adapter name & enabled */}
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-muted">Adapter Name</label>
            <input
              value={activeAdapter.adapterName}
              onChange={(e) => updateAdapter(activeAdapter.id, 'adapterName', e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
            />
          </div>
          <button
            onClick={() => updateAdapter(activeAdapter.id, 'enabled', !activeAdapter.enabled)}
            className={`rounded-lg px-4 py-2 text-xs font-medium ${
              activeAdapter.enabled
                ? 'bg-success/15 text-success'
                : 'bg-error/15 text-error'
            }`}
          >
            {activeAdapter.enabled ? 'Enabled' : 'Disabled'}
          </button>
        </div>

        {/* IP Config */}
        <div className="rounded-lg border border-border/50 bg-background/30 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium text-muted">IP Configuration</span>
            <button
              onClick={() => updateAdapter(activeAdapter.id, 'dhcp', !activeAdapter.dhcp)}
              className={`rounded-md px-3 py-1 text-xs font-medium ${
                activeAdapter.dhcp
                  ? 'bg-accent/15 text-accent'
                  : 'bg-surface-2 text-muted'
              }`}
            >
              DHCP {activeAdapter.dhcp ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] text-muted">IP Address</label>
              <IPInput
                value={activeAdapter.ipAddress}
                onChange={(v) => updateAdapter(activeAdapter.id, 'ipAddress', v)}
                disabled={activeAdapter.dhcp}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-muted">Subnet Mask</label>
              <IPInput
                value={activeAdapter.subnetMask}
                onChange={(v) => updateAdapter(activeAdapter.id, 'subnetMask', v)}
                disabled={activeAdapter.dhcp}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-muted">Gateway</label>
              <IPInput
                value={activeAdapter.gateway}
                onChange={(v) => updateAdapter(activeAdapter.id, 'gateway', v)}
                disabled={activeAdapter.dhcp}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-muted">DNS Primary</label>
              <IPInput
                value={activeAdapter.dnsPrimary}
                onChange={(v) => updateAdapter(activeAdapter.id, 'dnsPrimary', v)}
                disabled={activeAdapter.dhcp}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-muted">DNS Secondary</label>
              <IPInput
                value={activeAdapter.dnsSecondary}
                onChange={(v) => updateAdapter(activeAdapter.id, 'dnsSecondary', v)}
                disabled={activeAdapter.dhcp}
              />
            </div>
          </div>
        </div>

        {/* Advanced */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <label className="mb-1 block text-[11px] text-muted">VLAN ID</label>
            <input
              type="number"
              min={0}
              max={4094}
              value={activeAdapter.vlanId}
              onChange={(e) => updateAdapter(activeAdapter.id, 'vlanId', Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
            />
            <span className="text-[10px] text-muted">0 = none</span>
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-muted">Link Speed</label>
            <select
              value={activeAdapter.linkSpeed}
              onChange={(e) => updateAdapter(activeAdapter.id, 'linkSpeed', e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
            >
              {linkSpeedOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-muted">MTU</label>
            <input
              type="number"
              min={576}
              max={9216}
              value={activeAdapter.mtu}
              onChange={(e) => updateAdapter(activeAdapter.id, 'mtu', Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
            />
          </div>
        </div>
      </div>

      {/* Session IP Map */}
      <div className="mt-5 rounded-lg border border-border/50 bg-background/30 p-4">
        <h4 className="mb-2 text-xs font-medium text-muted">Session IP Map</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/50">
                <th className="pb-2 pr-4 text-left font-medium text-muted">Machine</th>
                {Object.entries(adapterRoleLabels).map(([role, label]) => (
                  <th key={role} className="pb-2 pr-3 text-left font-medium text-muted">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {session.machines.map((m) => {
                const mProfile = session.profiles.find((p) => p.id === m.activeProfileId);
                return (
                  <tr
                    key={m.id}
                    onClick={() => setSelectedMachine(m.id)}
                    className={`cursor-pointer border-b border-border/20 transition-colors hover:bg-accent/5 ${m.id === selectedMachineId ? 'bg-accent/5' : ''}`}
                  >
                    <td className="py-1.5 pr-4 font-medium text-foreground">{m.name}</td>
                    {(['d3net', 'media', 'artnet-sacn', 'kvm', 'control', 'mgmt'] as NetworkAdapterRole[]).map((role) => {
                      const adapter = mProfile?.networkAdapters.find((a) => a.role === role);
                      return (
                        <td key={role} className="py-1.5 pr-3 font-mono text-muted">
                          {adapter?.ipAddress || '-'}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
