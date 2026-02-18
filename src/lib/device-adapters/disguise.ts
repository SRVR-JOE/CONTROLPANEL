import { DeviceHealth } from '@/types';
import { DeviceAdapter, DeviceQueryResult } from './types';
import { fetchWithTimeout } from './utils';

interface D3HealthState {
  name: string;
  detail: string;
  severity: string;
}

interface D3SessionHealth {
  fps?: { current: number; target: number };
  states?: D3HealthState[];
}

interface D3DetectedSystem {
  hostname?: string;
  type?: string;
  runningProject?: string;
  ipAddress?: string;
  version?: { major: number; minor: number; hotfix: number };
}

interface D3Notification {
  summary?: string;
  severity?: string;
  timestamp?: string;
}

function parseSeverity(
  states: D3HealthState[],
  notifications: D3Notification[]
): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const state of states) {
    const sev = state.severity?.toLowerCase() ?? '';
    const message = `${state.name}: ${state.detail}`;
    if (sev.includes('error') || sev.includes('critical')) {
      errors.push(message);
    } else if (sev === 'warning') {
      warnings.push(message);
    }
  }

  for (const notification of notifications) {
    const sev = notification.severity?.toLowerCase() ?? '';
    const message = notification.summary ?? 'Unknown notification';
    if (sev.includes('error') || sev.includes('critical')) {
      errors.push(message);
    } else if (sev === 'warning') {
      warnings.push(message);
    }
  }

  return { errors, warnings };
}

function extractFromStates(
  states: D3HealthState[]
): { gpuTemp?: number; cpuUsage?: number; temperature: number } {
  let gpuTemp: number | undefined;
  let cpuUsage: number | undefined;
  let temperature = 0;

  for (const state of states) {
    const name = state.name?.toLowerCase() ?? '';
    const detail = state.detail ?? '';

    if (name.includes('gpu temperature') || name.includes('gpu temp')) {
      const match = detail.match(/([\d.]+)/);
      if (match) {
        gpuTemp = parseFloat(match[1]);
        // Use GPU temp as overall temperature if we haven't found one yet
        if (temperature === 0) {
          temperature = gpuTemp;
        }
      }
    }

    if (name.includes('cpu')) {
      const match = detail.match(/([\d.]+)/);
      if (match) {
        const value = parseFloat(match[1]);
        // CPU state might be temperature or usage percentage
        if (name.includes('temp')) {
          if (temperature === 0) {
            temperature = value;
          }
        } else {
          cpuUsage = value;
        }
      }
    }
  }

  return { gpuTemp, cpuUsage, temperature };
}

export class DisguiseAdapter implements DeviceAdapter {
  manufacturer = 'disguise' as const;

  async queryHealth(ip: string, port: number = 80): Promise<DeviceQueryResult> {
    const base = `http://${ip}:${port}`;

    try {
      // Run session health and detectsystems in parallel
      let sessionHealth: D3SessionHealth | null = null;
      let notifications: D3Notification[] = [];
      let sessionAvailable = false;
      let serviceAvailable = false;
      let firmware: string | undefined;

      const [sessionResult, serviceResult] = await Promise.allSettled([
        (async () => {
          const healthRes = await fetchWithTimeout(`${base}/api/session/status/health`);
          if (healthRes.ok) {
            return (await healthRes.json()) as D3SessionHealth;
          }
          return null;
        })(),
        (async () => {
          const sysRes = await fetchWithTimeout(`${base}/api/service/system/detectsystems`);
          if (sysRes.ok) {
            return await sysRes.json();
          }
          return null;
        })(),
      ]);

      // Process session health result
      if (sessionResult.status === 'fulfilled' && sessionResult.value !== null) {
        sessionAvailable = true;
        sessionHealth = sessionResult.value;
      }

      // Process service/detectsystems result
      if (serviceResult.status === 'fulfilled' && serviceResult.value !== null) {
        serviceAvailable = true;
        const data = serviceResult.value;
        const systems = Array.isArray(data) ? data : (data?.result ?? data?.systems ?? [data]);
        const sys: D3DetectedSystem | undefined = systems.find(
          (s: D3DetectedSystem) => s.ipAddress === ip
        ) ?? systems[0];
        if (sys?.version) {
          firmware = `r${sys.version.major}.${sys.version.minor}.${sys.version.hotfix}`;
        }
      }

      // If neither API responded, device is unreachable
      if (!sessionAvailable && !serviceAvailable) {
        return { reachable: false, health: null };
      }

      // Fetch notifications sequentially (depends on sessionAvailable)
      if (sessionAvailable) {
        try {
          const notifRes = await fetchWithTimeout(`${base}/api/session/status/notifications`);
          if (notifRes.ok) {
            const data = await notifRes.json();
            notifications = Array.isArray(data) ? data : (data?.notifications ?? []);
          }
        } catch {
          // Notifications not available — non-fatal
        }
      }

      // Build health from session states
      const states = sessionHealth?.states ?? [];
      const { gpuTemp, cpuUsage, temperature } = extractFromStates(states);
      const { errors, warnings } = parseSeverity(states, notifications);

      const health: DeviceHealth = {
        temperature,
        cpuUsage,
        gpuTemp,
        uptime: 0, // d3 API doesn't directly expose uptime in session health
        errors,
        warnings,
      };

      return {
        reachable: true,
        health,
        firmware,
      };
    } catch {
      return { reachable: false, health: null };
    }
  }
}
