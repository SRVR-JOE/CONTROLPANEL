import { DeviceHealth } from '@/types';
import { DeviceAdapter, DeviceQueryResult } from './types';
import { fetchWithTimeout } from '@/lib/utils';

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
      // Try session API first (requires designer to be running)
      let sessionHealth: D3SessionHealth | null = null;
      let notifications: D3Notification[] = [];
      let sessionAvailable = true;

      try {
        const healthRes = await fetchWithTimeout(`${base}/api/session/status/health`);
        if (healthRes.ok) {
          sessionHealth = await healthRes.json() as D3SessionHealth;
        } else {
          sessionAvailable = false;
        }
      } catch {
        // Designer not running — session API unavailable
        sessionAvailable = false;
      }

      // Fetch notifications if session is available
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

      // Always try service API for system info
      let firmware: string | undefined;
      let serviceAvailable = false;
      try {
        const sysRes = await fetchWithTimeout(`${base}/api/service/system/detectsystems`);
        if (sysRes.ok) {
          serviceAvailable = true;
          const data = await sysRes.json();
          const systems = Array.isArray(data) ? data : (data?.result ?? data?.systems ?? [data]);
          const sys: D3DetectedSystem | undefined = systems.find(
            (s: D3DetectedSystem) => s.ipAddress === ip
          ) ?? systems[0];
          if (sys?.version) {
            firmware = `r${sys.version.major}.${sys.version.minor}.${sys.version.hotfix}`;
          }
        }
      } catch {
        // Service API not available (network-level failure)
      }

      // If neither API is reachable (session unavailable AND service unavailable), report offline
      if (!sessionAvailable && !serviceAvailable) {
        return { reachable: false, health: null };
      }

      // If we got here, at least one API responded
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
