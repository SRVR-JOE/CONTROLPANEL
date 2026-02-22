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

interface RaritanStatus {
  model?: string;
  firmware?: string;
  serial?: string;
  uptime?: number;
  inletPower?: number;
  inletCurrent?: number;
  inletVoltage?: number;
  temperature?: number;
  humidity?: number;
  outlets?: Array<{
    id: number;
    name: string;
    state: string;
    power?: number;
    current?: number;
  }>;
}

/**
 * Raritan PX3/PX4 intelligent PDUs expose a REST API over HTTPS.
 * Status: GET /api/v1/status
 * Outlets: GET /api/v1/outlets
 * Also supports SNMP (UDP :161) for monitoring.
 */
export class RaritanAdapter implements DeviceAdapter {
  manufacturer = 'raritan' as const;

  async queryHealth(ip: string, port: number = 443): Promise<DeviceQueryResult> {
    const base = `https://${ip}:${port}`;

    try {
      const status = await fetchJson<RaritanStatus>(`${base}/api/v1/status`);

      if (!status) {
        return { reachable: false, health: null };
      }

      const errors: string[] = [];
      const warnings: string[] = [];

      const temp = status.temperature ?? 0;
      if (temp > 40) warnings.push(`Ambient temperature elevated: ${temp}C`);

      if (status.humidity !== undefined && status.humidity > 80) {
        warnings.push(`Humidity high: ${status.humidity}%`);
      }

      if (status.inletCurrent !== undefined && status.inletCurrent > 16) {
        warnings.push(`High inlet current: ${status.inletCurrent}A`);
      }

      const health: DeviceHealth = {
        temperature: temp,
        powerDraw: status.inletPower,
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
