import { DeviceHealth } from '@/types';
import { DeviceAdapter, DeviceQueryResult } from './types';

const TIMEOUT_MS = 3000;

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

interface AdderDeviceInfo {
  model?: string;
  firmware?: string;
  serial?: string;
  uptime?: number;
  temperature?: number;
  connections?: number;
  link_status?: string;
}

/**
 * Adder KVM extenders and switches expose a REST API.
 * Device info: GET /api/device/info
 * Status:      GET /api/device/status
 */
export class AdderAdapter implements DeviceAdapter {
  manufacturer = 'adder' as const;

  async queryHealth(ip: string, port: number = 80): Promise<DeviceQueryResult> {
    const base = `http://${ip}:${port}`;

    try {
      const info = await fetchJson<AdderDeviceInfo>(`${base}/api/device/info`);

      if (!info) {
        return { reachable: false, health: null };
      }

      const errors: string[] = [];
      const warnings: string[] = [];

      const temp = info.temperature ?? 0;
      if (temp > 60) errors.push(`Unit temperature critical: ${temp}C`);
      else if (temp > 45) warnings.push(`Unit temperature elevated: ${temp}C`);

      if (info.link_status === 'down') {
        warnings.push('KVM link is down');
      }

      const health: DeviceHealth = {
        temperature: temp,
        uptime: info.uptime ?? 0,
        errors,
        warnings,
      };

      return { reachable: true, health, firmware: info.firmware };
    } catch {
      return { reachable: false, health: null };
    }
  }
}
