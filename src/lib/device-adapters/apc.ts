import { DeviceHealth } from '@/types';
import { DeviceAdapter, DeviceQueryResult } from './types';

const TIMEOUT_MS = 3000;

async function fetchJson<T>(url: string): Promise<T | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

interface APCStatus {
  model?: string;
  firmware?: string;
  serial?: string;
  uptime?: number;
  status?: string;
  temperature?: number;
  humidity?: number;
  battery_charge?: number;
  battery_runtime?: number;
  input_voltage?: number;
  output_load?: number;
  output_power?: number;
  total_power?: number;
}

/**
 * APC/Schneider UPS and PDU systems.
 * Primary: SNMP (UDP :161) via NMC (Network Management Card).
 * Fallback: REST API via NMC3 card.
 * Status: GET /api/status or /NMC/status
 */
export class APCAdapter implements DeviceAdapter {
  manufacturer = 'apc' as const;

  async queryHealth(ip: string, port: number = 80): Promise<DeviceQueryResult> {
    const base = `http://${ip}:${port}`;

    try {
      const status = await fetchJson<APCStatus>(`${base}/api/status`);

      if (!status) {
        return { reachable: false, health: null };
      }

      const errors: string[] = [];
      const warnings: string[] = [];

      const temp = status.temperature ?? 0;
      if (temp > 40) warnings.push(`Temperature elevated: ${temp}C`);

      if (status.battery_charge !== undefined && status.battery_charge < 50) {
        warnings.push(`Battery charge: ${status.battery_charge}%`);
      }
      if (status.battery_charge !== undefined && status.battery_charge < 20) {
        errors.push(`Battery critically low: ${status.battery_charge}%`);
      }
      if (status.output_load !== undefined && status.output_load > 80) {
        warnings.push(`Output load: ${status.output_load}%`);
      }

      const health: DeviceHealth = {
        temperature: temp,
        powerDraw: status.output_power ?? status.total_power,
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
