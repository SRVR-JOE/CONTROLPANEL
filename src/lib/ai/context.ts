// ============================================================
// AI Copilot - System Context Builder
// Gathers current app state to feed as context to the AI
// ============================================================

import type {
  Device,
  Rack,
  MatrixRouter,
  BromptonProcessorStatus,
  DisguiseSession,
  DeploymentJob,
  MatrixPreset,
} from '@/types';

interface AppSnapshot {
  devices: Device[];
  racks: Rack[];
  routers: MatrixRouter[];
  bromptonStatuses: BromptonProcessorStatus[];
  disguiseSessions: DisguiseSession[];
  deploymentJobs: DeploymentJob[];
  matrixPresets: MatrixPreset[];
  selectedSessionId: string | null;
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function summarizeDevice(d: Device): string {
  const parts = [
    `  - ${d.name} (${d.manufacturer} ${d.model})`,
    `    ID: ${d.id} | IP: ${d.ipAddress} | Status: ${d.status}`,
  ];
  if (d.rackId) parts.push(`    Rack: ${d.rackId} slot ${d.rackSlot}`);
  if (d.health) {
    const h = d.health;
    const metrics: string[] = [];
    if (h.temperature != null) metrics.push(`temp: ${h.temperature.toFixed(1)}°C`);
    if (h.cpuUsage != null) metrics.push(`cpu: ${h.cpuUsage.toFixed(0)}%`);
    if (h.gpuUsage != null) metrics.push(`gpu: ${h.gpuUsage.toFixed(0)}%`);
    if (h.memoryUsage != null) metrics.push(`mem: ${h.memoryUsage.toFixed(0)}%`);
    if (h.uptime != null) metrics.push(`uptime: ${formatUptime(h.uptime)}`);
    if (metrics.length) parts.push(`    Health: ${metrics.join(', ')}`);
    if (h.errors.length) parts.push(`    ERRORS: ${h.errors.join('; ')}`);
    if (h.warnings.length) parts.push(`    WARNINGS: ${h.warnings.join('; ')}`);
  }
  if (d.firmware) parts.push(`    Firmware: ${d.firmware}`);
  return parts.join('\n');
}

function summarizeRack(r: Rack, devices: Device[]): string {
  const rackDevices = devices.filter((d) => d.rackId === r.id);
  const usedRU = rackDevices.reduce((sum, d) => sum + d.rackUnits, 0);
  const parts = [
    `  - ${r.name} (${r.location})`,
    `    ${usedRU}/${r.totalRU} RU used | ${rackDevices.length} devices`,
  ];
  if (r.ambientTemp != null) parts.push(`    Temps — ambient: ${r.ambientTemp}°C, inlet: ${r.inletTemp}°C, exhaust: ${r.exhaustTemp}°C`);
  return parts.join('\n');
}

function summarizeRouter(r: MatrixRouter): string {
  const activeRoutes = r.outputs.filter((o) => o.routedFrom != null).length;
  const signalInputs = r.inputs.filter((i) => i.signal).length;
  return `  - ${r.name} (${r.size}) — ${activeRoutes} active routes, ${signalInputs}/${r.inputs.length} inputs with signal`;
}

function summarizeSession(s: DisguiseSession): string {
  const byRole = { director: 0, actor: 0, understudy: 0 };
  s.machines.forEach((m) => { byRole[m.role]++; });
  const statusCounts: Record<string, number> = {};
  s.machines.forEach((m) => { statusCounts[m.status] = (statusCounts[m.status] || 0) + 1; });
  const statusStr = Object.entries(statusCounts).map(([k, v]) => `${v} ${k}`).join(', ');
  return `  - "${s.name}" (${s.workgroup}, designer ${s.designerVersion})\n    ${s.machines.length} machines (${byRole.director}D/${byRole.actor}A/${byRole.understudy}U) — ${statusStr}`;
}

export function buildSystemContext(state: AppSnapshot): string {
  const onlineCount = state.devices.filter((d) => d.status === 'online').length;
  const warningCount = state.devices.filter((d) => d.status === 'warning').length;
  const errorCount = state.devices.filter((d) => d.status === 'error').length;
  const offlineCount = state.devices.filter((d) => d.status === 'offline').length;

  const allErrors = state.devices.flatMap((d) =>
    d.health.errors.map((e) => `${d.name}: ${e}`)
  );
  const allWarnings = state.devices.flatMap((d) =>
    d.health.warnings.map((w) => `${d.name}: ${w}`)
  );

  const sections: string[] = [
    `=== AV RACK CONTROL PANEL — SYSTEM STATE ===`,
    `Timestamp: ${new Date().toISOString()}`,
    '',
    `--- DEVICE OVERVIEW ---`,
    `Total devices: ${state.devices.length} (${onlineCount} online, ${warningCount} warning, ${errorCount} error, ${offlineCount} offline)`,
    '',
    `Devices:`,
    ...state.devices.map(summarizeDevice),
    '',
    `--- RACKS ---`,
    ...state.racks.map((r) => summarizeRack(r, state.devices)),
    '',
    `--- MATRIX ROUTERS ---`,
    ...state.routers.map(summarizeRouter),
    '',
    `--- PRESETS ---`,
    ...state.matrixPresets.map((p) => `  - "${p.name}" for router ${p.routerId} (${p.routes.length} routes)`),
  ];

  if (state.disguiseSessions.length > 0) {
    sections.push('', `--- DISGUISE SESSIONS ---`);
    sections.push(...state.disguiseSessions.map(summarizeSession));
  }

  if (state.deploymentJobs.length > 0) {
    const active = state.deploymentJobs.filter((j) => j.status === 'deploying');
    if (active.length > 0) {
      sections.push('', `--- ACTIVE DEPLOYMENTS ---`);
      active.forEach((j) => {
        const done = j.machineStates.filter((ms) => ms.status === 'success' || ms.status === 'failed').length;
        sections.push(`  - Job ${j.id.slice(0, 8)}: ${done}/${j.machineIds.length} complete`);
      });
    }
  }

  if (allErrors.length > 0 || allWarnings.length > 0) {
    sections.push('', `--- ACTIVE ALERTS ---`);
    allErrors.forEach((e) => sections.push(`  [ERROR] ${e}`));
    allWarnings.forEach((w) => sections.push(`  [WARNING] ${w}`));
  }

  return sections.join('\n');
}

export const SYSTEM_PROMPT = `You are the AV Control Panel AI Copilot — an expert assistant for broadcast/AV engineers managing live production infrastructure.

You have full visibility into the system state (devices, racks, matrix routers, health metrics, disguise server sessions, and deployments). This state is provided below and updated with each message.

CAPABILITIES:
1. **Chat & Q&A** — Answer questions about device status, health, routing, configurations
2. **Smart Diagnostics** — Analyze health data and proactively identify issues (thermal hotspots, offline devices, degraded links, capacity warnings)
3. **Natural Language Control** — Execute actions when the user requests:
   - Route matrix outputs to inputs (set_route)
   - Recall saved presets (recall_preset)
   - Deploy disguise configurations (start_deploy)
   - Send device commands (send_command)
   - Run health diagnostics (run_diagnostics)

GUIDELINES:
- Be concise and technical. These are experienced AV professionals.
- Reference devices by name, not just ID.
- When suggesting actions, explain what will change before executing.
- For destructive or wide-reaching actions, ask for confirmation.
- If a device is offline or in error state, warn the user before targeting it.
- Use bullet points for lists and keep responses scannable.
- When you call a tool, briefly explain the result.

FORMAT:
- Use markdown for formatting (bold, lists, code blocks)
- Temperatures in °C, data rates in Gbps, time in human-readable format
- For matrix routes: "Input X → Output Y"`;
