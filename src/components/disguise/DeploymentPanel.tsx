'use client';

import { useStore } from '@/store';
import { useShallow } from 'zustand/react/shallow';
import {
  Send,
  Wifi,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Crown,
  Play,
  Shield,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import type { DeploymentSection, D3NetRole } from '@/types';

const roleIcons: Record<D3NetRole, typeof Crown> = {
  director: Crown,
  actor: Play,
  understudy: Shield,
};

const DEPLOY_SECTIONS: { key: DeploymentSection; label: string; description: string }[] = [
  { key: 'machineIdentity', label: 'Identity', description: 'Hostname, role, workgroup' },
  { key: 'networkAdapters', label: 'Network', description: 'IP addresses, adapters, VLAN' },
  { key: 'smbSettings', label: 'SMB', description: 'File sharing settings' },
  { key: 'windowsSettings', label: 'Windows', description: 'Power, firewall, updates' },
  { key: 'd3ServiceSettings', label: 'd3 Service', description: 'API port, genlock, sync' },
  { key: 'performanceTweaks', label: 'Performance', description: 'GPU, codecs, NDI' },
];

const statusColors: Record<string, string> = {
  idle: 'text-muted',
  deploying: 'text-accent',
  success: 'text-success',
  failed: 'text-error',
  partial: 'text-warning',
};

const statusBg: Record<string, string> = {
  idle: 'bg-surface-2',
  deploying: 'bg-accent/10 border-accent/30',
  success: 'bg-success/10 border-success/30',
  failed: 'bg-error/10 border-error/30',
  partial: 'bg-warning/10 border-warning/30',
};

export default function DeploymentPanel() {
  const {
    disguiseSessions,
    selectedSessionId,
    deploymentJobs,
    startDeployment,
  } = useStore(
    useShallow((s) => ({
      disguiseSessions: s.disguiseSessions,
      selectedSessionId: s.selectedSessionId,
      deploymentJobs: s.deploymentJobs,
      startDeployment: s.startDeployment,
    }))
  );

  const [expanded, setExpanded] = useState(false);
  const [selectedMachines, setSelectedMachines] = useState<string[]>([]);
  const [selectedSections, setSelectedSections] = useState<DeploymentSection[]>([
    'machineIdentity',
    'networkAdapters',
    'smbSettings',
    'windowsSettings',
    'd3ServiceSettings',
    'performanceTweaks',
  ]);
  const [deploying, setDeploying] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const session = disguiseSessions.find((s) => s.id === selectedSessionId);
  const activeJob = deploymentJobs.find((j) => j.status === 'deploying');

  // Keep the machine states updating while deploying
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    if (!activeJob) return;
    const interval = setInterval(() => forceUpdate((n) => n + 1), 200);
    return () => clearInterval(interval);
  }, [activeJob]);

  // Auto-select all machines when session changes
  useEffect(() => {
    if (session) {
      setSelectedMachines(session.machines.map((m) => m.id));
    }
  }, [session]);

  const toggleMachine = useCallback((id: string) => {
    setSelectedMachines((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const toggleSection = useCallback((key: DeploymentSection) => {
    setSelectedSections((prev) =>
      prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]
    );
  }, []);

  const handleDeploy = async () => {
    if (!session || selectedMachines.length === 0 || selectedSections.length === 0) return;
    setDeploying(true);

    // Use the store's startDeployment (simulated) for state tracking
    startDeployment(session.id, selectedMachines, selectedSections);

    // Also fire real API calls to the backend for each machine
    const deployPromises = selectedMachines.map(async (machineId) => {
      const machine = session.machines.find((m) => m.id === machineId);
      const profile = session.profiles.find((p) => p.id === machine?.activeProfileId);
      if (!machine || !profile) return null;

      const d3netAdapter = profile.networkAdapters.find((a) => a.role === 'd3net');
      const targetIp = d3netAdapter?.ipAddress ?? '0.0.0.0';

      try {
        const res = await fetch('/api/deploy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            machineId: machine.id,
            hostname: machine.name,
            targetIp,
            apiPort: profile.d3ServiceSettings.apiPort,
            sections: selectedSections,
            config: Object.fromEntries(
              selectedSections.map((s) => [s, (profile as unknown as Record<string, unknown>)[s]])
            ),
          }),
        });
        return await res.json();
      } catch {
        return { machineId, success: false, error: `Network error reaching ${targetIp}` };
      }
    });

    await Promise.all(deployPromises);
    setDeploying(false);
  };

  const handleRetryFailed = () => {
    if (!session || !activeJob) return;
    const failedIds = activeJob.machineStates
      .filter((ms) => ms.status === 'failed')
      .map((ms) => ms.machineId);
    if (failedIds.length > 0) {
      startDeployment(session.id, failedIds, activeJob.sections);
    }
  };

  if (!session) return null;

  const latestJob = deploymentJobs[0];
  const currentJobStates = (activeJob ?? latestJob)?.machineStates ?? [];
  const sessionJobs = deploymentJobs.filter((j) => j.sessionId === session.id).slice(0, 10);

  return (
    <div className="rounded-xl border border-border bg-surface/60 backdrop-blur-sm">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-5 py-3"
      >
        <div className="flex items-center gap-2">
          <Send className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-semibold text-foreground">Network Deploy</h3>
          {activeJob && (
            <span className="flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-medium text-accent">
              <Loader2 className="h-3 w-3 animate-spin" /> Deploying...
            </span>
          )}
          {latestJob && !activeJob && (
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
              latestJob.status === 'success' ? 'bg-success/15 text-success' :
              latestJob.status === 'failed' ? 'bg-error/15 text-error' :
              'bg-warning/15 text-warning'
            }`}>
              Last: {latestJob.status}
            </span>
          )}
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted" /> : <ChevronDown className="h-4 w-4 text-muted" />}
      </button>

      {expanded && (
        <div className="border-t border-border px-5 py-4 space-y-4">
          {/* Machine selection */}
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Target Machines</span>
              <button
                onClick={() => setSelectedMachines(
                  selectedMachines.length === session.machines.length
                    ? []
                    : session.machines.map((m) => m.id)
                )}
                className="text-[10px] text-accent hover:underline"
              >
                {selectedMachines.length === session.machines.length ? 'None' : 'All'}
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {session.machines.map((m) => {
                const isSelected = selectedMachines.includes(m.id);
                const machineState = currentJobStates.find((ms) => ms.machineId === m.id);
                const RoleIcon = roleIcons[m.role];
                return (
                  <button
                    key={m.id}
                    onClick={() => toggleMachine(m.id)}
                    disabled={deploying}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-60 ${
                      isSelected
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-border bg-surface-2 text-muted hover:text-foreground'
                    }`}
                  >
                    <RoleIcon className="h-3 w-3" />
                    {m.name}
                    {machineState && machineState.status !== 'idle' && (
                      <span className={`ml-1 ${statusColors[machineState.status]}`}>
                        {machineState.status === 'deploying' && <Loader2 className="inline h-3 w-3 animate-spin" />}
                        {machineState.status === 'success' && <CheckCircle2 className="inline h-3 w-3" />}
                        {machineState.status === 'failed' && <XCircle className="inline h-3 w-3" />}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section selection */}
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Config Sections</span>
              <button
                onClick={() => setSelectedSections(
                  selectedSections.length === DEPLOY_SECTIONS.length
                    ? []
                    : DEPLOY_SECTIONS.map((s) => s.key)
                )}
                className="text-[10px] text-accent hover:underline"
              >
                {selectedSections.length === DEPLOY_SECTIONS.length ? 'None' : 'All'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-6">
              {DEPLOY_SECTIONS.map(({ key, label, description }) => (
                <button
                  key={key}
                  onClick={() => toggleSection(key)}
                  disabled={deploying}
                  className={`rounded-lg border px-2.5 py-2 text-left transition-all disabled:opacity-60 ${
                    selectedSections.includes(key)
                      ? 'border-accent bg-accent/10'
                      : 'border-border bg-surface-2'
                  }`}
                >
                  <span className={`block text-xs font-medium ${selectedSections.includes(key) ? 'text-accent' : 'text-muted'}`}>
                    {label}
                  </span>
                  <span className="block text-[10px] text-muted">{description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Deploy button */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleDeploy}
              disabled={deploying || selectedMachines.length === 0 || selectedSections.length === 0}
              className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2 text-sm font-medium text-white transition-all hover:bg-accent/80 disabled:opacity-30"
            >
              {deploying ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Deploying...</>
              ) : (
                <><Send className="h-4 w-4" /> Deploy to {selectedMachines.length} Machine{selectedMachines.length !== 1 ? 's' : ''}</>
              )}
            </button>

            {latestJob && latestJob.status === 'partial' && !activeJob && (
              <button
                onClick={handleRetryFailed}
                className="flex items-center gap-1.5 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs font-medium text-warning hover:bg-warning/20"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Retry Failed
              </button>
            )}

            <span className="text-[10px] text-muted">
              {selectedMachines.length} machines / {selectedSections.length} sections selected
            </span>
          </div>

          {/* Live deployment status */}
          {currentJobStates.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Deployment Status</span>
              {currentJobStates.map((ms) => {
                const machine = session.machines.find((m) => m.id === ms.machineId);
                const profile = session.profiles.find((p) => p.id === machine?.activeProfileId);
                const ip = profile?.networkAdapters.find((a) => a.role === 'd3net')?.ipAddress ?? '-';
                return (
                  <div
                    key={ms.machineId}
                    className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${statusBg[ms.status]}`}
                  >
                    <div className="flex items-center gap-2 min-w-[120px]">
                      <Wifi className={`h-3.5 w-3.5 ${statusColors[ms.status]}`} />
                      <span className="text-xs font-medium text-foreground">{machine?.name ?? ms.machineId}</span>
                    </div>
                    <span className="min-w-[100px] font-mono text-[11px] text-muted">{ip}</span>
                    {/* Progress bar */}
                    <div className="flex-1">
                      <div className="h-1.5 rounded-full bg-border overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            ms.status === 'success' ? 'bg-success' :
                            ms.status === 'failed' ? 'bg-error' :
                            'bg-accent'
                          }`}
                          style={{ width: `${ms.progress}%` }}
                        />
                      </div>
                    </div>
                    <span className="min-w-[60px] text-right text-[11px] text-muted">{ms.progress}%</span>
                    <span className={`min-w-[180px] text-xs ${statusColors[ms.status]}`}>
                      {ms.status === 'deploying' && <Loader2 className="mr-1 inline h-3 w-3 animate-spin" />}
                      {ms.status === 'success' && <CheckCircle2 className="mr-1 inline h-3 w-3" />}
                      {ms.status === 'failed' && <XCircle className="mr-1 inline h-3 w-3" />}
                      {ms.message}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* History */}
          {sessionJobs.length > 0 && (
            <div>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted hover:text-foreground"
              >
                Deployment History ({sessionJobs.length})
                {showHistory ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
              {showHistory && (
                <div className="mt-2 space-y-1">
                  {sessionJobs.map((job) => (
                    <div key={job.id} className="flex items-center gap-3 rounded-lg bg-surface-2/50 px-3 py-1.5 text-xs">
                      <span className={`font-medium ${statusColors[job.status]}`}>
                        {job.status === 'success' && <CheckCircle2 className="mr-1 inline h-3 w-3" />}
                        {job.status === 'failed' && <XCircle className="mr-1 inline h-3 w-3" />}
                        {job.status === 'partial' && <RefreshCw className="mr-1 inline h-3 w-3" />}
                        {job.status}
                      </span>
                      <span className="text-muted">
                        {job.machineIds.length} machines, {job.sections.length} sections
                      </span>
                      <span className="text-muted">
                        {new Date(job.startedAt).toLocaleString()}
                      </span>
                      {job.completedAt && (
                        <span className="text-muted">
                          ({Math.round((new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime()) / 1000)}s)
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
