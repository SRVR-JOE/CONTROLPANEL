import { DeviceHealth } from '@/types';
import { DeviceAdapter, DeviceQueryResult } from './types';

const TIMEOUT_MS = 3000;

interface ChristieStatus {
  status?: string;
  lampHours?: number;
  laserHours?: number;
  temperature?: number;
  power?: string;
  inputSource?: string;
  firmwareVersion?: string;
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
 * Christie projectors expose a REST API on port 80.
 * PJLink (TCP :4352) is available as a fallback but not implemented here.
 */
export class ChristieAdapter implements DeviceAdapter {
  manufacturer = 'christie' as const;

  async queryHealth(ip: string, port: number = 80): Promise<DeviceQueryResult> {
    const base = `http://${ip}:${port}`;

    try {
      const status = await fetchJson<ChristieStatus>(`${base}/api/status`);

      if (!status) {
        return { reachable: false, health: null };
      }

      const errors: string[] = [];
      const warnings: string[] = [];

      const temp = status.temperature ?? 0;
      if (temp > 80) errors.push(`Temperature critically high: ${temp}C`);
      else if (temp > 60) warnings.push(`Temperature elevated: ${temp}C`);

      if (status.power === 'standby' || status.power === 'off') {
        warnings.push('Projector in standby');
      }

      const health: DeviceHealth = {
        temperature: temp,
        uptime: 0,
        errors,
        warnings,
      };

      return { reachable: true, health, firmware: status.firmwareVersion };
    } catch {
      return { reachable: false, health: null };
    }
  }
}
