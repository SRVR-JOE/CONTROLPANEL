'use client';

import { useStore } from '@/store';
import {
  Radar,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle2,
  XCircle,
  Plus,
  Crown,
  Play,
  Shield,
  Server,
  Cpu,
  Clock,
  MonitorCheck,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import type { D3NetRole, DiscoveredMachine } from '@/types';

const roleIcons: Record<D3NetRole, typeof Crown> = {
  director: Crown,
  actor: Play,
  understudy: Shield,
};

const roleColors: Record<D3NetRole, string> = {
  director: 'text-warning',
  actor: 'text-accent',
  understudy: 'text-muted',
};

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  if (days > 0) return `${days}d ${hours}h`;
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

export default function DiscoveryPanel() {
  const {
    disguiseSessions,
    selectedSessionId,
    discoveryScans,
    activeDiscoveryId,
    startDiscovery,
    addDiscoveredToSession,
  } = useStore();

  const [expanded, setExpanded] = useState(false);
  const [subnet, setSubnet] = useState('10.0.0');
  const [rangeStart, setRangeStart] = useState(1);
  const [rangeEnd, setRangeEnd] = useState(30);
  const [port, setPort] = useState(80);
  const [assignProfileId, setAssignProfileId] = useState<string>('');
  const [addedIps, setAddedIps] = useState<Set<string>>(new Set());

  const session = disguiseSessions.find((s) => s.id === selectedSessionId);
  const activeScan = discoveryScans.find((s) => s.id === activeDiscoveryId);
  const latestScan = discoveryScans[0];
  const scanning = activeScan?.status === 'scanning';

  // Force-update while scanning for progress
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    if (!scanning) return;
    const interval = setInterval(() => forceUpdate((n) => n + 1), 200);
    return () => clearInterval(interval);
  }, [scanning]);

  // Auto-detect subnet from session's existing d3Net IPs
  useEffect(() => {
    if (!session) return;
    const firstMachine = session.machines[0];
    if (!firstMachine) return;
    const profile = session.profiles.find((p) => p.id === firstMachine.activeProfileId);
    const d3netAdapter = profile?.networkAdapters.find((a) => a.role === 'd3net');
    if (d3netAdapter?.ipAddress) {
      const parts = d3netAdapter.ipAddress.split('.');
      if (parts.length === 4) {
        setSubnet(`${parts[0]}.${parts[1]}.${parts[2]}`);
      }
    }
  }, [session]);

  const handleScan = () => {
    startDiscovery(subnet, rangeStart, rangeEnd, port);
  };

  const handleAddToSession = (machine: DiscoveredMachine) => {
    if (!session) return;
    addDiscoveredToSession(session.id, machine, assignProfileId || undefined);
    setAddedIps((prev) => new Set(prev).add(machine.ip));
  };

  const handleAddAll = () => {
    if (!session || !displayScan) return;
    for (const m of displayScan.found) {
      if (!addedIps.has(m.ip) && !isAlreadyInSession(m.ip)) {
        addDiscoveredToSession(session.id, m, assignProfileId || undefined);
        setAddedIps((prev) => new Set(prev).add(m.ip));
      }
    }
  };

  const isAlreadyInSession = (ip: string): boolean => {
    if (!session) return false;
    return session.machines.some((m) => {
      const p = session.profiles.find((pr) => pr.id === m.activeProfileId);
      return p?.networkAdapters.some((a) => a.role === 'd3net' && a.ipAddress === ip);
    });
  };

  const displayScan = activeScan ?? latestScan;

  if (!session) return null;

  const newMachines = displayScan?.found.filter(
    (m) => !isAlreadyInSession(m.ip) && !addedIps.has(m.ip)
  ) ?? [];

  return (
    <div className="rounded-xl border border-border bg-surface/60 backdrop-blur-sm">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-5 py-3"
      >
        <div className="flex items-center gap-2">
          <Radar className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-semibold text-foreground">Auto-Discover Machines</h3>
          {scanning && (
            <span className="flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-medium text-accent">
              <Loader2 className="h-3 w-3 animate-spin" /> Scanning...
            </span>
          )}
          {displayScan && displayScan.status === 'done' && (
            <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-medium text-success">
              {displayScan.found.length} found
            </span>
          )}
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted" /> : <ChevronDown className="h-4 w-4 text-muted" />}
      </button>

      {expanded && (
        <div className="space-y-4 border-t border-border px-5 py-4">
          {/* Scan config */}
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted">Subnet</label>
              <input
                value={subnet}
                onChange={(e) => setSubnet(e.target.value)}
                className="w-32 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-sm text-foreground outline-none focus:border-accent"
                placeholder="10.0.0"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted">Range</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={1}
                  max={254}
                  value={rangeStart}
                  onChange={(e) => setRangeStart(Number(e.target.value))}
                  className="w-16 rounded-lg border border-border bg-surface-2 px-2 py-1.5 text-center text-sm text-foreground outline-none focus:border-accent"
                />
                <span className="text-xs text-muted">to</span>
                <input
                  type="number"
                  min={1}
                  max={254}
                  value={rangeEnd}
                  onChange={(e) => setRangeEnd(Number(e.target.value))}
                  className="w-16 rounded-lg border border-border bg-surface-2 px-2 py-1.5 text-center text-sm text-foreground outline-none focus:border-accent"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted">API Port</label>
              <input
                type="number"
                min={1}
                max={65535}
                value={port}
                onChange={(e) => setPort(Number(e.target.value))}
                className="w-20 rounded-lg border border-border bg-surface-2 px-2 py-1.5 text-center text-sm text-foreground outline-none focus:border-accent"
              />
            </div>
            <button
              onClick={handleScan}
              disabled={scanning}
              className="flex items-center gap-2 rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-white transition-all hover:bg-accent/80 disabled:opacity-40"
            >
              {scanning ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Scanning...</>
              ) : (
                <><Radar className="h-4 w-4" /> Scan {subnet}.{rangeStart}-{rangeEnd}</>
              )}
            </button>
          </div>

          {/* Scan progress */}
          {scanning && displayScan && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted">
                <span>Scanning {subnet}.{displayScan.rangeStart}-{displayScan.rangeEnd}...</span>
                <span>{displayScan.scannedCount}/{displayScan.totalCount} ({displayScan.progress}%)</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-300"
                  style={{ width: `${displayScan.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Results */}
          {displayScan && displayScan.status === 'done' && displayScan.found.length > 0 && (
            <div className="space-y-3">
              {/* Profile assignment for new machines */}
              <div className="flex flex-wrap items-center gap-3 rounded-lg border border-accent/20 bg-accent/5 px-3 py-2">
                <span className="text-xs font-medium text-foreground">When adding, apply profile:</span>
                <select
                  value={assignProfileId}
                  onChange={(e) => setAssignProfileId(e.target.value)}
                  className="rounded-lg border border-border bg-surface-2 px-3 py-1 text-xs text-foreground outline-none focus:border-accent"
                >
                  <option value="">New blank profile</option>
                  {session.profiles.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {newMachines.length > 0 && (
                  <button
                    onClick={handleAddAll}
                    className="ml-auto flex items-center gap-1 rounded-lg bg-accent px-3 py-1 text-xs font-medium text-white hover:bg-accent/80"
                  >
                    <Plus className="h-3 w-3" /> Add All New ({newMachines.length})
                  </button>
                )}
              </div>

              {/* Machine list */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                  Discovered Machines ({displayScan.found.length})
                </span>
                {displayScan.found.map((machine) => {
                  const alreadyInSession = isAlreadyInSession(machine.ip);
                  const justAdded = addedIps.has(machine.ip);
                  const RoleIcon = roleIcons[machine.role];
                  return (
                    <div
                      key={machine.ip}
                      className={`flex items-center gap-3 rounded-lg border px-4 py-2.5 transition-all ${
                        alreadyInSession || justAdded
                          ? 'border-success/30 bg-success/5'
                          : 'border-border bg-surface-2/50 hover:border-accent/30'
                      }`}
                    >
                      {/* Status indicator */}
                      <div className={`h-2.5 w-2.5 rounded-full ${machine.d3ServiceRunning ? 'bg-success' : 'bg-error'}`}
                        title={machine.d3ServiceRunning ? 'd3 Service Running' : 'd3 Service Stopped'}
                      />

                      {/* Role icon + hostname */}
                      <div className="flex min-w-[130px] items-center gap-2">
                        <RoleIcon className={`h-4 w-4 ${roleColors[machine.role]}`} />
                        <div>
                          <span className="block text-sm font-medium text-foreground">{machine.hostname}</span>
                          <span className="block text-[10px] uppercase text-muted">{machine.role}</span>
                        </div>
                      </div>

                      {/* IP */}
                      <div className="min-w-[110px]">
                        <span className="block font-mono text-xs text-foreground">{machine.ip}</span>
                        <span className="block text-[10px] text-muted">:{machine.apiPort}</span>
                      </div>

                      {/* Model */}
                      <div className="flex min-w-[80px] items-center gap-1">
                        <Server className="h-3 w-3 text-muted" />
                        <span className="text-xs text-muted">{machine.model}</span>
                      </div>

                      {/* Version */}
                      <span className="min-w-[50px] text-xs text-muted">{machine.designerVersion}</span>

                      {/* GPU */}
                      {machine.gpuName && (
                        <div className="hidden min-w-[140px] items-center gap-1 lg:flex">
                          <Cpu className="h-3 w-3 text-muted" />
                          <span className="text-[11px] text-muted">{machine.gpuName.replace('NVIDIA ', '')}</span>
                        </div>
                      )}

                      {/* Uptime */}
                      <div className="hidden min-w-[60px] items-center gap-1 md:flex">
                        <Clock className="h-3 w-3 text-muted" />
                        <span className="text-[11px] text-muted">{formatUptime(machine.uptime)}</span>
                      </div>

                      {/* Project */}
                      {machine.currentProject && (
                        <div className="hidden min-w-[120px] items-center gap-1 xl:flex">
                          <MonitorCheck className="h-3 w-3 text-muted" />
                          <span className="text-[11px] text-accent/70">{machine.currentProject}</span>
                        </div>
                      )}

                      {/* Action */}
                      <div className="ml-auto">
                        {alreadyInSession ? (
                          <span className="flex items-center gap-1 text-xs text-success">
                            <CheckCircle2 className="h-3.5 w-3.5" /> In Session
                          </span>
                        ) : justAdded ? (
                          <span className="flex items-center gap-1 text-xs text-success">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Added
                          </span>
                        ) : (
                          <button
                            onClick={() => handleAddToSession(machine)}
                            className="flex items-center gap-1 rounded-lg bg-accent px-3 py-1 text-xs font-medium text-white hover:bg-accent/80"
                          >
                            <Plus className="h-3 w-3" /> Add
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* No results */}
          {displayScan && displayScan.status === 'done' && displayScan.found.length === 0 && (
            <div className="rounded-lg border border-border bg-surface-2/30 px-4 py-6 text-center">
              <XCircle className="mx-auto mb-2 h-6 w-6 text-muted" />
              <p className="text-sm text-muted">No disguise servers found in {subnet}.{displayScan.rangeStart}-{displayScan.rangeEnd}</p>
              <p className="mt-1 text-xs text-muted">Check that machines are powered on and d3 service is running on port {port}</p>
            </div>
          )}

          {/* Error */}
          {displayScan && displayScan.status === 'error' && (
            <div className="rounded-lg border border-error/30 bg-error/5 px-4 py-3">
              <p className="text-sm text-error">Scan failed: {displayScan.error}</p>
            </div>
          )}

          {/* Scan history */}
          {discoveryScans.length > 1 && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Previous Scans</span>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {discoveryScans.slice(1, 6).map((scan) => (
                  <span key={scan.id} className="rounded-md bg-surface-2 px-2 py-1 text-[10px] text-muted">
                    {scan.subnet}.{scan.rangeStart}-{scan.rangeEnd} / {scan.found.length} found / {new Date(scan.startedAt).toLocaleTimeString()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
