// ============================================================
// AI Copilot - Tool Definitions & Execution
// ============================================================

import type { CopilotTool, ToolCallResult } from './types';
import type { DeploymentSection } from '@/types';

// Tool definitions sent to the AI provider
export const COPILOT_TOOLS: CopilotTool[] = [
  {
    name: 'set_route',
    description: 'Route a matrix output to a specific input. Changes signal routing on the specified matrix router.',
    parameters: {
      router_name: { type: 'string', description: 'Name or ID of the matrix router (e.g. "Lightware MX2-16x16", "router-lw-1")', required: true },
      output: { type: 'number', description: 'Output index (1-based)', required: true },
      input: { type: 'number', description: 'Input index (1-based) to route to the output', required: true },
    },
  },
  {
    name: 'recall_preset',
    description: 'Load a saved matrix routing preset by name or ID.',
    parameters: {
      preset_name: { type: 'string', description: 'Name or ID of the preset to recall', required: true },
    },
  },
  {
    name: 'send_command',
    description: 'Send a command to a specific device.',
    parameters: {
      device_name: { type: 'string', description: 'Name or ID of the device', required: true },
      command: { type: 'string', description: 'Command to send (e.g. "reboot", "identify", "refresh")', required: true },
    },
  },
  {
    name: 'run_diagnostics',
    description: 'Run a diagnostic analysis across all devices or a specific device. Returns health issues, warnings, and recommendations.',
    parameters: {
      target: { type: 'string', description: 'Device name/ID to diagnose, or "all" for system-wide diagnostics', required: false },
    },
  },
  {
    name: 'start_deploy',
    description: 'Start deploying disguise server configuration to machines in a session.',
    parameters: {
      session_name: { type: 'string', description: 'Name or ID of the disguise session', required: true },
      machine_names: { type: 'string', description: 'Comma-separated list of machine names to deploy to, or "all"', required: true },
      sections: { type: 'string', description: 'Comma-separated config sections: machineIdentity, networkAdapters, smbSettings, windowsSettings, d3ServiceSettings, performanceTweaks. Use "all" for all sections.', required: true },
    },
  },
];

// Convert our tool definitions to Anthropic format
export function toAnthropicTools() {
  return COPILOT_TOOLS.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: {
      type: 'object' as const,
      properties: Object.fromEntries(
        Object.entries(tool.parameters).map(([key, val]) => [
          key,
          { type: val.type, description: val.description, ...(val.enum ? { enum: val.enum } : {}) },
        ])
      ),
      required: Object.entries(tool.parameters)
        .filter(([, val]) => val.required)
        .map(([key]) => key),
    },
  }));
}

// Convert our tool definitions to Ollama/OpenAI function-calling format
export function toOllamaTools() {
  return COPILOT_TOOLS.map((tool) => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: {
        type: 'object',
        properties: Object.fromEntries(
          Object.entries(tool.parameters).map(([key, val]) => [
            key,
            { type: val.type, description: val.description, ...(val.enum ? { enum: val.enum } : {}) },
          ])
        ),
        required: Object.entries(tool.parameters)
          .filter(([, val]) => val.required)
          .map(([key]) => key),
      },
    },
  }));
}

// Execute a tool call against the app store
export function executeTool(
  toolName: string,
  input: Record<string, unknown>,
  storeActions: {
    getState: () => {
      devices: { id: string; name: string; status: string; health: { temperature?: number; cpuUsage?: number; gpuUsage?: number; memoryUsage?: number; errors: string[]; warnings: string[] } }[];
      routers: { id: string; name: string; outputs: { index: number; routedFrom?: number }[]; inputs: { index: number; signal: boolean }[] }[];
      matrixPresets: { id: string; name: string; routerId: string }[];
      disguiseSessions: { id: string; name: string; machines: { id: string; name: string }[] }[];
    };
    setRoute: (routerId: string, outputIndex: number, inputIndex: number) => void;
    recallMatrixPreset: (presetId: string) => void;
    sendCommand: (deviceId: string, command: string) => void;
    startDeployment: (sessionId: string, machineIds: string[], sections: DeploymentSection[]) => string;
  }
): ToolCallResult {
  const state = storeActions.getState();

  try {
    switch (toolName) {
      case 'set_route': {
        const routerQuery = String(input.router_name).toLowerCase();
        const router = state.routers.find(
          (r) => r.id === routerQuery || r.name.toLowerCase().includes(routerQuery)
        );
        if (!router) return { tool: toolName, input, result: `Router "${input.router_name}" not found. Available: ${state.routers.map((r) => r.name).join(', ')}`, success: false };

        const outputIdx = Number(input.output);
        const inputIdx = Number(input.input);
        if (outputIdx < 1 || inputIdx < 1) return { tool: toolName, input, result: 'Output and input indices must be >= 1', success: false };

        storeActions.setRoute(router.id, outputIdx, inputIdx);
        return { tool: toolName, input, result: `Routed Input ${inputIdx} → Output ${outputIdx} on ${router.name}`, success: true };
      }

      case 'recall_preset': {
        const presetQuery = String(input.preset_name).toLowerCase();
        const preset = state.matrixPresets.find(
          (p) => p.id === presetQuery || p.name.toLowerCase().includes(presetQuery)
        );
        if (!preset) return { tool: toolName, input, result: `Preset "${input.preset_name}" not found. Available: ${state.matrixPresets.map((p) => p.name).join(', ')}`, success: false };

        storeActions.recallMatrixPreset(preset.id);
        return { tool: toolName, input, result: `Recalled preset "${preset.name}"`, success: true };
      }

      case 'send_command': {
        const deviceQuery = String(input.device_name).toLowerCase();
        const device = state.devices.find(
          (d) => d.id === deviceQuery || d.name.toLowerCase().includes(deviceQuery)
        );
        if (!device) return { tool: toolName, input, result: `Device "${input.device_name}" not found. Available: ${state.devices.map((d) => d.name).join(', ')}`, success: false };

        storeActions.sendCommand(device.id, String(input.command));
        return { tool: toolName, input, result: `Sent "${input.command}" to ${device.name}`, success: true };
      }

      case 'run_diagnostics': {
        const target = input.target ? String(input.target).toLowerCase() : 'all';
        const targetDevices = target === 'all'
          ? state.devices
          : state.devices.filter((d) => d.id === target || d.name.toLowerCase().includes(target));

        if (targetDevices.length === 0) return { tool: toolName, input, result: `No devices matching "${input.target}"`, success: false };

        const issues: string[] = [];
        for (const d of targetDevices) {
          if (d.status === 'offline') issues.push(`[CRITICAL] ${d.name} is OFFLINE`);
          if (d.status === 'error') issues.push(`[CRITICAL] ${d.name} is in ERROR state`);
          if (d.health.temperature != null && d.health.temperature > 55) issues.push(`[WARNING] ${d.name} temperature high: ${d.health.temperature.toFixed(1)}°C`);
          if (d.health.cpuUsage != null && d.health.cpuUsage > 85) issues.push(`[WARNING] ${d.name} CPU usage high: ${d.health.cpuUsage.toFixed(0)}%`);
          if (d.health.gpuUsage != null && d.health.gpuUsage > 90) issues.push(`[WARNING] ${d.name} GPU usage high: ${d.health.gpuUsage.toFixed(0)}%`);
          if (d.health.memoryUsage != null && d.health.memoryUsage > 85) issues.push(`[WARNING] ${d.name} memory usage high: ${d.health.memoryUsage.toFixed(0)}%`);
          d.health.errors.forEach((e) => issues.push(`[ERROR] ${d.name}: ${e}`));
          d.health.warnings.forEach((w) => issues.push(`[WARNING] ${d.name}: ${w}`));
        }

        if (issues.length === 0) return { tool: toolName, input, result: `All ${targetDevices.length} device(s) healthy — no issues detected.`, success: true };
        return { tool: toolName, input, result: `Found ${issues.length} issue(s):\n${issues.join('\n')}`, success: true };
      }

      case 'start_deploy': {
        const sessionQuery = String(input.session_name).toLowerCase();
        const session = state.disguiseSessions.find(
          (s) => s.id === sessionQuery || s.name.toLowerCase().includes(sessionQuery)
        );
        if (!session) return { tool: toolName, input, result: `Session "${input.session_name}" not found.`, success: false };

        const machineStr = String(input.machine_names).toLowerCase();
        const machineIds = machineStr === 'all'
          ? session.machines.map((m) => m.id)
          : session.machines
              .filter((m) => machineStr.split(',').some((q) => m.name.toLowerCase().includes(q.trim()) || m.id === q.trim()))
              .map((m) => m.id);

        if (machineIds.length === 0) return { tool: toolName, input, result: `No machines matched. Available: ${session.machines.map((m) => m.name).join(', ')}`, success: false };

        const allSections: DeploymentSection[] = ['machineIdentity', 'networkAdapters', 'smbSettings', 'windowsSettings', 'd3ServiceSettings', 'performanceTweaks'];
        const sectionsStr = String(input.sections).toLowerCase();
        const sections: DeploymentSection[] = sectionsStr === 'all'
          ? allSections
          : sectionsStr.split(',').map((s) => s.trim()).filter((s): s is DeploymentSection => allSections.includes(s as DeploymentSection));

        if (sections.length === 0) return { tool: toolName, input, result: `No valid sections. Available: ${allSections.join(', ')}`, success: false };

        const jobId = storeActions.startDeployment(session.id, machineIds, sections);
        return { tool: toolName, input, result: `Deployment started (job ${jobId.slice(0, 8)}) — deploying ${sections.length} section(s) to ${machineIds.length} machine(s)`, success: true };
      }

      default:
        return { tool: toolName, input, result: `Unknown tool: ${toolName}`, success: false };
    }
  } catch (err) {
    return { tool: toolName, input, result: `Tool error: ${err instanceof Error ? err.message : String(err)}`, success: false };
  }
}
