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

interface SonifexStatus {
  model?: string;
  firmware?: string;
  uptime?: number;
  temperature?: number;
  dante_status?: string;
  channel_count?: number;
}

/**
 * Sonifex Redbox/AVN Dante devices expose a REST API.
 * Device info:  GET /api/status
 * Dante status: GET /api/dante
 */
export class SonifexAdapter implements DeviceAdapter {
  manufacturer = 'sonifex' as const;

  async queryHealth(ip: string, port: number = 80): Promise<DeviceQueryResult> {
    const base = `http://${ip}:${port}`;

    try {
      const status = await fetchJson<SonifexStatus>(`${base}/api/status`);

      if (!status) {
        return { reachable: false, health: null };
      }

      const errors: string[] = [];
      const warnings: string[] = [];

      const temp = status.temperature ?? 0;
      if (temp > 55) errors.push(`Unit temperature critical: ${temp}C`);
      else if (temp > 40) warnings.push(`Unit temperature elevated: ${temp}C`);

      if (status.dante_status && status.dante_status !== 'connected') {
        warnings.push(`Dante network: ${status.dante_status}`);
      }

      const health: DeviceHealth = {
        temperature: temp,
        uptime: status.uptime ?? 0,
        errors,
        warnings,
      };

      return { reachable: true, health, firmware: status.firmware };
    } catch {
      return { reachable: false, health: null };
    }
  }
}
