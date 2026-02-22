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

interface CyberPowerStatus {
  model?: string;
  firmware?: string;
  uptime?: number;
  temperature?: number;
  battery_charge?: number;
  output_load?: number;
  total_power?: number;
  input_voltage?: number;
}

/**
 * CyberPower UPS and PDU systems.
 * Primary: SNMP (UDP :161) via RMCARD.
 * Fallback: HTTP management interface.
 */
export class CyberPowerAdapter implements DeviceAdapter {
  manufacturer = 'cyberpower' as const;

  async queryHealth(ip: string, port: number = 80): Promise<DeviceQueryResult> {
    const base = `http://${ip}:${port}`;

    try {
      const status = await fetchJson<CyberPowerStatus>(`${base}/api/status`);

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
      if (status.output_load !== undefined && status.output_load > 80) {
        warnings.push(`Output load: ${status.output_load}%`);
      }

      const health: DeviceHealth = {
        temperature: temp,
        powerDraw: status.total_power,
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
