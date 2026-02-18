import { DeviceHealth } from '@/types';
import { DeviceAdapter, DeviceQueryResult } from './types';

const TIMEOUT_MS = 3000;

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    return response;
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

// Map CPU temperature to an approximate "usage" percentage.
// Tessera CPUs typically idle around 40C and max around 85C.
function cpuTempToUsage(tempC: number): number {
  const minTemp = 40;
  const maxTemp = 85;
  const clamped = Math.max(minTemp, Math.min(maxTemp, tempC));
  return Math.round(((clamped - minTemp) / (maxTemp - minTemp)) * 100);
}

export class BromptonAdapter implements DeviceAdapter {
  manufacturer = 'brompton' as const;

  async queryHealth(ip: string): Promise<DeviceQueryResult> {
    const base = `http://${ip}`;

    try {
      const [ambientResult, cpuResult, gpuResult, uptimeResult, panelCountResult] =
        await Promise.allSettled([
          fetchJson<{ value?: number; temperature?: number }>(`${base}/api/system/temperature/ambient`),
          fetchJson<{ value?: number; temperature?: number }>(`${base}/api/system/temperature/cpu`),
          fetchJson<{ value?: number; temperature?: number }>(`${base}/api/system/temperature/gpu`),
          fetchJson<{ value?: number; uptime?: number; seconds?: number }>(`${base}/api/system/uptime`),
          fetchJson<{ value?: number; count?: number }>(`${base}/api/panels/online-count`),
        ]);

      // Check if we got at least one successful response to consider the device reachable
      const results = [ambientResult, cpuResult, gpuResult, uptimeResult, panelCountResult];
      const anyFulfilled = results.some(
        (r) => r.status === 'fulfilled' && r.value !== null
      );

      if (!anyFulfilled) {
        return { reachable: false, health: null };
      }

      // Extract values from settled results
      const ambientData = ambientResult.status === 'fulfilled' ? ambientResult.value : null;
      const cpuData = cpuResult.status === 'fulfilled' ? cpuResult.value : null;
      const gpuData = gpuResult.status === 'fulfilled' ? gpuResult.value : null;
      const uptimeData = uptimeResult.status === 'fulfilled' ? uptimeResult.value : null;
      const panelCountData = panelCountResult.status === 'fulfilled' ? panelCountResult.value : null;

      const ambientTemp = ambientData?.value ?? ambientData?.temperature ?? 0;
      const cpuTemp = cpuData?.value ?? cpuData?.temperature ?? 0;
      const gpuTemp = gpuData?.value ?? gpuData?.temperature ?? undefined;
      const uptime = uptimeData?.value ?? uptimeData?.uptime ?? uptimeData?.seconds ?? 0;
      const panelCount = panelCountData?.value ?? panelCountData?.count ?? undefined;

      const errors: string[] = [];
      const warnings: string[] = [];

      // Flag high temperatures
      if (cpuTemp > 80) {
        errors.push(`CPU temperature critically high: ${cpuTemp}C`);
      } else if (cpuTemp > 70) {
        warnings.push(`CPU temperature elevated: ${cpuTemp}C`);
      }

      if (gpuTemp !== undefined) {
        if (gpuTemp > 85) {
          errors.push(`GPU temperature critically high: ${gpuTemp}C`);
        } else if (gpuTemp > 75) {
          warnings.push(`GPU temperature elevated: ${gpuTemp}C`);
        }
      }

      if (panelCount !== undefined && panelCount === 0) {
        warnings.push('No LED panels online');
      }

      const health: DeviceHealth = {
        temperature: ambientTemp || cpuTemp,
        cpuUsage: cpuTemp > 0 ? cpuTempToUsage(cpuTemp) : undefined,
        gpuTemp,
        uptime,
        errors,
        warnings,
      };

      return { reachable: true, health };
    } catch {
      return { reachable: false, health: null };
    }
  }
}
