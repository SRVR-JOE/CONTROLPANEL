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

interface NetgearSwitchInfo {
  model?: string;
  firmware?: string;
  serial?: string;
  uptime?: number;
  temperature?: number;
  fan_status?: string;
  poe_budget?: number;
  poe_consumed?: number;
}

/**
 * Netgear M4250/M4300/M4350 AV Line switches expose a REST API.
 * System info:  GET /api/system
 * PoE status:   GET /api/poe/status
 */
export class NetgearAdapter implements DeviceAdapter {
  manufacturer = 'netgear' as const;

  async queryHealth(ip: string, port: number = 80): Promise<DeviceQueryResult> {
    const base = `http://${ip}:${port}`;

    try {
      const sysInfo = await fetchJson<NetgearSwitchInfo>(`${base}/api/system`);

      if (!sysInfo) {
        return { reachable: false, health: null };
      }

      const errors: string[] = [];
      const warnings: string[] = [];

      const temp = sysInfo.temperature ?? 0;
      if (temp > 70) errors.push(`Switch temperature critical: ${temp}C`);
      else if (temp > 55) warnings.push(`Switch temperature elevated: ${temp}C`);

      if (sysInfo.poe_budget && sysInfo.poe_consumed) {
        const poePercent = (sysInfo.poe_consumed / sysInfo.poe_budget) * 100;
        if (poePercent > 90) warnings.push(`PoE budget ${Math.round(poePercent)}% consumed`);
      }

      const health: DeviceHealth = {
        temperature: temp,
        powerDraw: sysInfo.poe_consumed,
        uptime: sysInfo.uptime ?? 0,
        errors,
        warnings,
      };

      return { reachable: true, health, firmware: sysInfo.firmware };
    } catch {
      return { reachable: false, health: null };
    }
  }
}
