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

interface ToshibaUPSStatus {
  model?: string;
  firmware?: string;
  uptime?: number;
  battery_charge?: number;
  battery_status?: string;
  output_load?: number;
  temperature?: number;
  input_voltage?: number;
  output_voltage?: number;
}

/**
 * Toshiba UPS systems — primarily SNMP managed.
 * Fallback REST via optional network management card.
 * TODO: Native SNMP support requires Node.js net module (server-side only).
 */
export class ToshibaUPSAdapter implements DeviceAdapter {
  manufacturer = 'toshiba' as const;

  async queryHealth(ip: string, port: number = 80): Promise<DeviceQueryResult> {
    const base = `http://${ip}:${port}`;

    try {
      const status = await fetchJson<ToshibaUPSStatus>(`${base}/api/status`);

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
