'use client';

import { useStore } from '@/store';
import {
  Monitor,
  Plus,
  ChevronDown,
  Crown,
  Play,
  Shield,
} from 'lucide-react';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { DisguiseSession, SessionMachine, DisguiseProfile, D3NetRole } from '@/types';

const roleIcons: Record<D3NetRole, typeof Crown> = {
  director: Crown,
  actor: Play,
  understudy: Shield,
};

const roleLabels: Record<D3NetRole, string> = {
  director: 'DIR',
  actor: 'ACT',
  understudy: 'US',
};

const statusColors: Record<string, string> = {
  online: 'bg-success',
  offline: 'bg-muted',
  standby: 'bg-accent',
  warning: 'bg-warning',
};

function createNewMachine(role: D3NetRole, session: DisguiseSession): { machine: SessionMachine; profile: DisguiseProfile } {
  const existingOfRole = session.machines.filter((m) => m.role === role);
  const nextIndex = role === 'director' ? 0 : existingOfRole.length + 1;
  const prefix = role === 'director' ? 'DIR' : role === 'actor' ? `A${nextIndex}` : `US${nextIndex}`;
  const machineId = uuidv4();
  const profileId = uuidv4();

  // Director=.11, Actors increment from .12, Understudies from .21
  const directors = session.machines.filter((m) => m.role === 'director').length;
  const actors = session.machines.filter((m) => m.role === 'actor').length;
  let lastOctet: number;
  if (role === 'director') lastOctet = 11;
  else if (role === 'actor') lastOctet = 12 + actors; // next after existing actors (.12, .13, ...)
  else lastOctet = Math.max(21, 12 + directors + actors + 5) + existingOfRole.length;

  const machine: SessionMachine = {
    id: machineId,
    name: `NEW-${prefix}`,
    model: 'GX 3',
    role,
    index: nextIndex,
    understudyFor: '',
    activeProfileId: profileId,
    status: 'offline',
  };

  const profile: DisguiseProfile = {
    id: profileId,
    name: 'Default',
    machineIdentity: {
      hostname: machine.name,
      role,
      actorIndex: nextIndex,
      understudyFor: '',
      workgroup: session.workgroup,
      description: '',
    },
    networkAdapters: [
      { id: uuidv4(), role: 'd3net', adapterName: 'NIC A - d3Net', enabled: true, dhcp: false, ipAddress: `10.0.0.${lastOctet}`, subnetMask: '255.255.255.0', gateway: '10.0.0.1', dnsPrimary: '', dnsSecondary: '', vlanId: 0, linkSpeed: '10GbE', mtu: 1500 },
      { id: uuidv4(), role: 'media', adapterName: 'NIC B - Media', enabled: true, dhcp: false, ipAddress: `192.168.10.${lastOctet}`, subnetMask: '255.255.255.0', gateway: '192.168.10.1', dnsPrimary: '', dnsSecondary: '', vlanId: 0, linkSpeed: '10GbE', mtu: 1500 },
      { id: uuidv4(), role: 'artnet-sacn', adapterName: 'NIC C - Art-Net/sACN', enabled: true, dhcp: false, ipAddress: `2.0.0.${lastOctet}`, subnetMask: '255.0.0.0', gateway: '', dnsPrimary: '', dnsSecondary: '', vlanId: 0, linkSpeed: '1GbE', mtu: 1500 },
      { id: uuidv4(), role: 'kvm', adapterName: 'NIC D - KVM', enabled: true, dhcp: false, ipAddress: `192.168.20.${lastOctet}`, subnetMask: '255.255.255.0', gateway: '', dnsPrimary: '', dnsSecondary: '', vlanId: 0, linkSpeed: '1GbE', mtu: 1500 },
      { id: uuidv4(), role: 'control', adapterName: 'NIC E - Control', enabled: true, dhcp: false, ipAddress: `192.168.30.${lastOctet}`, subnetMask: '255.255.255.0', gateway: '', dnsPrimary: '', dnsSecondary: '', vlanId: 0, linkSpeed: '1GbE', mtu: 1500 },
      { id: uuidv4(), role: 'mgmt', adapterName: 'NIC F - MGMT', enabled: true, dhcp: false, ipAddress: `192.168.100.${lastOctet}`, subnetMask: '255.255.255.0', gateway: '192.168.100.1', dnsPrimary: '', dnsSecondary: '', vlanId: 0, linkSpeed: '1GbE', mtu: 1500 },
    ],
    smbSettings: { enabled: true, sharePath: 'C:\\d3 Projects', shareName: 'd3Projects', networkDiscovery: true, passwordProtected: false, guestAccess: true, smbVersion: 'SMBv3', allowInsecureGuest: true },
    windowsSettings: { powerPlan: 'ultimate-performance', sleepWhenPlugged: false, hibernate: false, windowsFirewall: false, remoteDesktop: true, windowsUpdate: 'paused', antivirus: false, visualEffectsPerformance: true, usbSelectiveSuspend: false },
    d3ServiceSettings: { startup: 'auto', apiPort: 80, designerVersion: session.designerVersion, d3netAdapter: 'NIC A - d3Net', genlock: false, syncPort: 7542, vsyncPort: 7968 },
    performanceTweaks: { gpuDriverLock: true, gpuDriverVersion: '546.33', codecPreference: 'hap-hapq', guiOnActor: role === 'actor' ? 'disabled' : 'full', ndiTools5Installed: false },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return { machine, profile };
}

export default function SessionBar() {
  const {
    disguiseSessions,
    selectedSessionId,
    selectedMachineId,
    setSelectedSession,
    setSelectedMachine,
    addSession,
    addMachineToSession,
    removeMachineFromSession,
  } = useStore();

  const [showSessionDropdown, setShowSessionDropdown] = useState(false);
  const [showNewSessionInput, setShowNewSessionInput] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');

  const session = disguiseSessions.find((s) => s.id === selectedSessionId);

  const handleCreateSession = () => {
    if (!newSessionName.trim()) return;
    const dirProfileId = uuidv4();
    const dirMachineId = uuidv4();
    const newSession: DisguiseSession = {
      id: uuidv4(),
      name: newSessionName.trim(),
      workgroup: 'DISGUISE',
      designerVersion: 'r27.1',
      machines: [{
        id: dirMachineId,
        name: 'NEW-DIR',
        model: 'GX 3',
        role: 'director',
        index: 0,
        understudyFor: '',
        activeProfileId: dirProfileId,
        status: 'offline',
      }],
      profiles: [{
        id: dirProfileId,
        name: 'Default',
        machineIdentity: { hostname: 'NEW-DIR', role: 'director', actorIndex: 0, understudyFor: '', workgroup: 'DISGUISE', description: '' },
        networkAdapters: [
          { id: uuidv4(), role: 'd3net', adapterName: 'NIC A - d3Net', enabled: true, dhcp: false, ipAddress: '10.0.0.11', subnetMask: '255.255.255.0', gateway: '10.0.0.1', dnsPrimary: '', dnsSecondary: '', vlanId: 0, linkSpeed: '10GbE', mtu: 1500 },
          { id: uuidv4(), role: 'media', adapterName: 'NIC B - Media', enabled: true, dhcp: false, ipAddress: '192.168.10.11', subnetMask: '255.255.255.0', gateway: '192.168.10.1', dnsPrimary: '', dnsSecondary: '', vlanId: 0, linkSpeed: '10GbE', mtu: 1500 },
          { id: uuidv4(), role: 'artnet-sacn', adapterName: 'NIC C - Art-Net/sACN', enabled: true, dhcp: false, ipAddress: '2.0.0.11', subnetMask: '255.0.0.0', gateway: '', dnsPrimary: '', dnsSecondary: '', vlanId: 0, linkSpeed: '1GbE', mtu: 1500 },
          { id: uuidv4(), role: 'kvm', adapterName: 'NIC D - KVM', enabled: true, dhcp: false, ipAddress: '192.168.20.11', subnetMask: '255.255.255.0', gateway: '', dnsPrimary: '', dnsSecondary: '', vlanId: 0, linkSpeed: '1GbE', mtu: 1500 },
          { id: uuidv4(), role: 'control', adapterName: 'NIC E - Control', enabled: true, dhcp: false, ipAddress: '192.168.30.11', subnetMask: '255.255.255.0', gateway: '', dnsPrimary: '', dnsSecondary: '', vlanId: 0, linkSpeed: '1GbE', mtu: 1500 },
          { id: uuidv4(), role: 'mgmt', adapterName: 'NIC F - MGMT', enabled: true, dhcp: false, ipAddress: '192.168.100.11', subnetMask: '255.255.255.0', gateway: '192.168.100.1', dnsPrimary: '', dnsSecondary: '', vlanId: 0, linkSpeed: '1GbE', mtu: 1500 },
        ],
        smbSettings: { enabled: true, sharePath: 'C:\\d3 Projects', shareName: 'd3Projects', networkDiscovery: true, passwordProtected: false, guestAccess: true, smbVersion: 'SMBv3', allowInsecureGuest: true },
        windowsSettings: { powerPlan: 'ultimate-performance', sleepWhenPlugged: false, hibernate: false, windowsFirewall: false, remoteDesktop: true, windowsUpdate: 'paused', antivirus: false, visualEffectsPerformance: true, usbSelectiveSuspend: false },
        d3ServiceSettings: { startup: 'auto', apiPort: 80, designerVersion: 'r27.1', d3netAdapter: 'NIC A - d3Net', genlock: false, syncPort: 7542, vsyncPort: 7968 },
        performanceTweaks: { gpuDriverLock: true, gpuDriverVersion: '546.33', codecPreference: 'hap-hapq', guiOnActor: 'full', ndiTools5Installed: false },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addSession(newSession);
    setSelectedSession(newSession.id);
    setNewSessionName('');
    setShowNewSessionInput(false);
  };

  const handleAddMachine = (role: D3NetRole) => {
    if (!session) return;
    const { machine, profile } = createNewMachine(role, session);
    addMachineToSession(session.id, machine, profile);
  };

  if (!session) {
    return (
      <div className="rounded-xl border border-border bg-surface/60 p-6 backdrop-blur-sm">
        <p className="text-muted">No session selected.</p>
        <button
          onClick={() => setShowNewSessionInput(true)}
          className="mt-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/80"
        >
          Create Session
        </button>
      </div>
    );
  }

  const directors = session.machines.filter((m) => m.role === 'director');
  const actors = session.machines.filter((m) => m.role === 'actor').sort((a, b) => a.index - b.index);
  const understudies = session.machines.filter((m) => m.role === 'understudy').sort((a, b) => a.index - b.index);
  const orderedMachines = [...directors, ...actors, ...understudies];

  return (
    <div className="space-y-4">
      {/* Session selector row */}
      <div className="flex items-center gap-3">
        <Monitor className="h-5 w-5 text-accent" />
        <div className="relative">
          <button
            onClick={() => setShowSessionDropdown(!showSessionDropdown)}
            className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-4 py-2 text-sm font-medium text-foreground hover:border-accent/50"
          >
            {session.name}
            <ChevronDown className="h-4 w-4 text-muted" />
          </button>
          {showSessionDropdown && (
            <div className="absolute left-0 top-full z-50 mt-1 min-w-[200px] rounded-lg border border-border bg-surface shadow-xl">
              {disguiseSessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setSelectedSession(s.id); setShowSessionDropdown(false); }}
                  className={`block w-full px-4 py-2 text-left text-sm hover:bg-surface-2 ${s.id === selectedSessionId ? 'text-accent' : 'text-foreground'}`}
                >
                  {s.name}
                </button>
              ))}
              <div className="border-t border-border">
                {showNewSessionInput ? (
                  <div className="flex gap-1 p-2">
                    <input
                      value={newSessionName}
                      onChange={(e) => setNewSessionName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateSession()}
                      placeholder="Session name..."
                      className="flex-1 rounded bg-background px-2 py-1 text-sm text-foreground outline-none"
                      autoFocus
                    />
                    <button onClick={handleCreateSession} className="rounded bg-accent px-2 py-1 text-xs text-white">Add</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowNewSessionInput(true)}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-accent hover:bg-surface-2"
                  >
                    <Plus className="h-3 w-3" /> New Session
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
        <span className="text-xs text-muted">Workgroup: {session.workgroup}</span>
        <span className="text-xs text-muted">Designer: {session.designerVersion}</span>
      </div>

      {/* Machine cards */}
      <div className="flex flex-wrap items-center gap-2">
        {orderedMachines.map((machine) => {
          const RoleIcon = roleIcons[machine.role];
          const isSelected = machine.id === selectedMachineId;
          return (
            <button
              key={machine.id}
              onClick={() => setSelectedMachine(machine.id)}
              className={`group relative flex min-w-[130px] flex-col items-start gap-1 rounded-lg border px-3 py-2 text-left transition-all ${
                isSelected
                  ? 'border-accent bg-accent/10 shadow-lg shadow-accent/5'
                  : 'border-border bg-surface-2/60 hover:border-accent/30'
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <RoleIcon className={`h-3.5 w-3.5 ${isSelected ? 'text-accent' : 'text-muted'}`} />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                    {roleLabels[machine.role]}{machine.role !== 'director' ? ` ${machine.index}` : ''}
                  </span>
                </div>
                <div className={`h-2 w-2 rounded-full ${statusColors[machine.status]}`} />
              </div>
              <span className={`text-sm font-medium ${isSelected ? 'text-foreground' : 'text-foreground/80'}`}>
                {machine.name}
              </span>
              <span className="text-[10px] text-muted">{machine.model}</span>
              {machine.role === 'understudy' && machine.understudyFor && (
                <span className="text-[10px] text-accent/70">
                  US for {session.machines.find((m) => m.id === machine.understudyFor)?.name ?? '?'}
                </span>
              )}
              {/* Remove button on hover */}
              {machine.role !== 'director' && (
                <button
                  onClick={(e) => { e.stopPropagation(); removeMachineFromSession(session.id, machine.id); }}
                  className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-error text-[10px] text-white group-hover:flex"
                  title="Remove"
                >
                  x
                </button>
              )}
            </button>
          );
        })}

        {/* Add buttons */}
        <button
          onClick={() => handleAddMachine('actor')}
          className="flex items-center gap-1 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted hover:border-accent/50 hover:text-accent"
        >
          <Plus className="h-3 w-3" /> Actor
        </button>
        <button
          onClick={() => handleAddMachine('understudy')}
          className="flex items-center gap-1 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted hover:border-accent/50 hover:text-accent"
        >
          <Plus className="h-3 w-3" /> Understudy
        </button>
      </div>
    </div>
  );
}
