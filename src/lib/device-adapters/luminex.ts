import { DeviceHealth } from '@/types';
import { DeviceAdapter, DeviceQueryResult } from './types';

const TIMEOUT_MS = 3000;

interface LuminexSystem {
  model?: string;
  firmware?: string;
  serial?: string;
  uptime?: number;
  temperature?: number;
  hostname?: string;
}

interface LuminexPorts {
  ports?: Array<{
    id: number;
    link: boolean;
    speed?: string;
  }>;
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/**
 * Luminex GigaCore switches expose a REST API on port 80.
 * System info:  GET /api/system
 * Port status:  GET /api/ports
 */
export class LuminexAdapter implements DeviceAdapter {
  manufacturer = 'luminex' as const;

  async queryHealth(ip: string, port: number = 80): Promise<DeviceQueryResult> {
    const base = `http://${ip}:${port}`;

    try {
      const [sysInfo, portInfo] = await Promise.all([
        fetchJson<LuminexSystem>(`${base}/api/system`),
        fetchJson<LuminexPorts>(`${base}/api/ports`),
      ]);

      if (!sysInfo && !portInfo) {
        return { reachable: false, health: null };
      }

      const errors: string[] = [];
      const warnings: string[] = [];

      const temp = sysInfo?.temperature ?? 0;
      if (temp > 65) errors.push(`Switch temperature critically high: ${temp}C`);
      else if (temp > 50) warnings.push(`Switch temperature elevated: ${temp}C`);

      // Check for any ports with no link
      if (portInfo?.ports) {
        const downPorts = portInfo.ports.filter((p) => !p.link);
        if (downPorts.length > 0) {
          warnings.push(`${downPorts.length} port(s) have no link`);
        }
      }

      const health: DeviceHealth = {
        temperature: temp,
        uptime: sysInfo?.uptime ?? 0,
        errors,
        warnings,
      };

      return { reachable: true, health, firmware: sysInfo?.firmware };
    } catch {
      return { reachable: false, health: null };
    }
  }
}
