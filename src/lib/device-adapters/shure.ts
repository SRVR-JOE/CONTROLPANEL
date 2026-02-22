import { DeviceHealth } from '@/types';
import { DeviceAdapter, DeviceQueryResult } from './types';

const TIMEOUT_MS = 3000;

interface ShureDevInfo {
  model?: string;
  serial?: string;
  firmware?: string;
  version?: string;
  device_id?: string;
}

interface ShureStatus {
  audio_mute?: boolean;
  rf_signal_strength?: number;
  battery_level?: number;
  antenna_status?: string;
  dante_status?: string;
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
 * Shure networked devices (ULXD, MXA, ANI, P300) expose a REST API.
 * Device info: GET /api/v1.0/devinfo
 * Status:      GET /api/v1.0/status
 */
export class ShureAdapter implements DeviceAdapter {
  manufacturer = 'shure' as const;

  async queryHealth(ip: string, port: number = 80): Promise<DeviceQueryResult> {
    const base = `http://${ip}:${port}`;

    try {
      const [devInfo, status] = await Promise.all([
        fetchJson<ShureDevInfo>(`${base}/api/v1.0/devinfo`),
        fetchJson<ShureStatus>(`${base}/api/v1.0/status`),
      ]);

      if (!devInfo && !status) {
        return { reachable: false, health: null };
      }

      const errors: string[] = [];
      const warnings: string[] = [];

      if (status?.audio_mute) warnings.push('Audio muted');
      if (status?.rf_signal_strength !== undefined && status.rf_signal_strength < -80) {
        warnings.push(`Weak RF signal: ${status.rf_signal_strength} dBm`);
      }
      if (status?.battery_level !== undefined && status.battery_level < 20) {
        warnings.push(`Low battery: ${status.battery_level}%`);
      }

      const firmware = devInfo?.firmware ?? devInfo?.version;

      const health: DeviceHealth = {
        temperature: 0,
        uptime: 0,
        errors,
        warnings,
      };

      return { reachable: true, health, firmware };
    } catch {
      return { reachable: false, health: null };
    }
  }
}
