import { DeviceHealth } from '@/types';
import { DeviceAdapter, DeviceQueryResult } from './types';

const TIMEOUT_MS = 3000;

interface NovaSystemInfo {
  model?: string;
  serialNumber?: string;
  firmwareVersion?: string;
  version?: string;
}

interface NovaSystemStatus {
  temperature?: number;
  cpuTemp?: number;
  inputSignal?: boolean;
  inputResolution?: string;
  outputPortCount?: number;
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

export class NovastarAdapter implements DeviceAdapter {
  manufacturer = 'novastar' as const;

  async queryHealth(ip: string, port: number = 80): Promise<DeviceQueryResult> {
    const base = `http://${ip}:${port}`;

    try {
      const [sysInfo, sysStatus] = await Promise.all([
        fetchJson<NovaSystemInfo>(`${base}/api/system/info`),
        fetchJson<NovaSystemStatus>(`${base}/api/system/status`),
      ]);

      if (!sysInfo && !sysStatus) {
        return { reachable: false, health: null };
      }

      const errors: string[] = [];
      const warnings: string[] = [];

      const temp = sysStatus?.temperature ?? sysStatus?.cpuTemp ?? 0;
      if (temp > 70) errors.push(`Temperature critically high: ${temp}C`);
      else if (temp > 55) warnings.push(`Temperature elevated: ${temp}C`);

      if (sysStatus?.inputSignal === false) {
        warnings.push('No input signal detected');
      }

      const firmware = sysInfo?.firmwareVersion ?? sysInfo?.version;

      const health: DeviceHealth = {
        temperature: temp,
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
