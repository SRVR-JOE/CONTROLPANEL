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

interface EatonUPSStatus {
  model?: string;
  firmware?: string;
  serial?: string;
  uptime?: number;
  battery_status?: string;
  battery_charge?: number;
  battery_runtime_remaining?: number;
  input_voltage?: number;
  output_voltage?: number;
  output_load?: number;
  temperature?: number;
}

/**
 * Eaton UPS with Network-M2/M3 card exposes REST API.
 * Primary: SNMP (UDP :161) — not usable from browser.
 * Fallback: REST via Network Management Card.
 * Status: GET /rest/mbdetnrs/1.0/powerDistributions/1/status
 */
export class EatonAdapter implements DeviceAdapter {
  manufacturer = 'eaton' as const;

  async queryHealth(ip: string, port: number = 80): Promise<DeviceQueryResult> {
    const base = `http://${ip}:${port}`;

    try {
      const status = await fetchJson<EatonUPSStatus>(`${base}/rest/mbdetnrs/1.0/powerDistributions/1/status`);

      if (!status) {
        return { reachable: false, health: null };
      }

      const errors: string[] = [];
      const warnings: string[] = [];

      const temp = status.temperature ?? 0;
      if (temp > 45) errors.push(`UPS temperature critical: ${temp}C`);
      else if (temp > 35) warnings.push(`UPS temperature elevated: ${temp}C`);

      if (status.battery_status === 'low') {
        errors.push('Battery level low');
      }
      if (status.battery_charge !== undefined && status.battery_charge < 50) {
        warnings.push(`Battery charge: ${status.battery_charge}%`);
      }
      if (status.output_load !== undefined && status.output_load > 80) {
        warnings.push(`Output load: ${status.output_load}%`);
      }

      const health: DeviceHealth = {
        temperature: temp,
        powerDraw: status.output_load,
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
