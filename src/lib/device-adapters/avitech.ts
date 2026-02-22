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

interface AvitechStatus {
  model?: string;
  firmware?: string;
  uptime?: number;
  temperature?: number;
  inputs?: Array<{ id: number; signal: boolean; format?: string }>;
}

/**
 * Avitech multiviewers and matrices expose a REST API.
 * System status: GET /api/status
 */
export class AvitechAdapter implements DeviceAdapter {
  manufacturer = 'avitech' as const;

  async queryHealth(ip: string, port: number = 80): Promise<DeviceQueryResult> {
    const base = `http://${ip}:${port}`;

    try {
      const status = await fetchJson<AvitechStatus>(`${base}/api/status`);

      if (!status) {
        return { reachable: false, health: null };
      }

      const errors: string[] = [];
      const warnings: string[] = [];

      const temp = status.temperature ?? 0;
      if (temp > 60) errors.push(`Unit temperature critical: ${temp}C`);
      else if (temp > 45) warnings.push(`Unit temperature elevated: ${temp}C`);

      if (status.inputs) {
        const noSignal = status.inputs.filter((i) => !i.signal);
        if (noSignal.length > 0) {
          warnings.push(`${noSignal.length} input(s) have no signal`);
        }
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
