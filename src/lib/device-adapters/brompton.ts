import { DeviceHealth } from '@/types';
import { DeviceAdapter, DeviceQueryResult } from './types';
import { fetchWithTimeout } from '@/lib/utils';

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

/**
 * Parse the Tessera uptime string into seconds.
 * Known formats from the live API:
 *   "28m 28s"        → minutes + seconds
 *   "2h 15m 30s"     → hours + minutes + seconds
 *   "1d 3h"          → days + hours
 *   "5d 2h 30m 10s"  → days + hours + minutes + seconds
 * Returns 0 if the string cannot be parsed.
 */
function parseUptimeString(raw: string): number {
  let seconds = 0;

  const dayMatch = raw.match(/(\d+)\s*d/);
  const hourMatch = raw.match(/(\d+)\s*h/);
  const minMatch = raw.match(/(\d+)\s*m(?!s)/); // 'm' but not 'ms'
  const secMatch = raw.match(/(\d+)\s*s/);

  if (dayMatch) seconds += parseInt(dayMatch[1], 10) * 86400;
  if (hourMatch) seconds += parseInt(hourMatch[1], 10) * 3600;
  if (minMatch) seconds += parseInt(minMatch[1], 10) * 60;
  if (secMatch) seconds += parseInt(secMatch[1], 10);

  return seconds;
}

// --- Tessera SX40 API response shapes (live-verified) ---

interface TesseraAmbientTemp {
  ambient: number;
}

interface TesseraCpuTemp {
  cpu: number;
}

interface TesseraGpuTemp {
  gpu: number;
}

interface TesseraTemperature {
  temperature: {
    ambient: number;
    cpu: number;
    ethernet: {
      copper: { a: number; b: number };
      sfp: { a: number; b: number; c: number; d: number };
    };
    fpga: number;
    gpu: number;
    main: number;
    psu: number;
  };
}

interface TesseraUptime {
  uptime: string;
}

interface TesseraSystemInner {
  fan?: {
    case?: {
      one?: { speed: number };
      two?: { speed: number };
    };
    fpga?: { speed: number };
  };
  'serial-number'?: string;
  'software-version'?: string;
  'processor-name'?: string;
  'processor-type'?: string;
}

interface TesseraSystem {
  system: TesseraSystemInner;
}

interface TesseraSoftwareVersion {
  'software-version': string;
}

// --- Temperature thresholds ---

const THRESHOLDS = {
  cpu: { warning: 70, critical: 80 },
  gpu: { warning: 75, critical: 85 },
  fpga: { warning: 70, critical: 80 },
  psu: { warning: 55, critical: 65 },
  ambient: { warning: 40, critical: 50 },
};

export class BromptonAdapter implements DeviceAdapter {
  manufacturer = 'brompton' as const;

  async queryHealth(ip: string): Promise<DeviceQueryResult> {
    const base = `http://${ip}`;

    try {
      const [
        ambientResult,
        cpuResult,
        gpuResult,
        uptimeResult,
        temperatureResult,
        systemResult,
        firmwareResult,
      ] = await Promise.allSettled([
        fetchJson<TesseraAmbientTemp>(`${base}/api/system/temperature/ambient`),
        fetchJson<TesseraCpuTemp>(`${base}/api/system/temperature/cpu`),
        fetchJson<TesseraGpuTemp>(`${base}/api/system/temperature/gpu`),
        fetchJson<TesseraUptime>(`${base}/api/system/uptime`),
        fetchJson<TesseraTemperature>(`${base}/api/system/temperature`),
        fetchJson<TesseraSystem>(`${base}/api/system`),
        fetchJson<TesseraSoftwareVersion>(`${base}/api/system/software-version`),
      ]);

      // Check if we got at least one successful response to consider the device reachable
      const results = [
        ambientResult, cpuResult, gpuResult, uptimeResult,
        temperatureResult, systemResult, firmwareResult,
      ];
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
      const tempData = temperatureResult.status === 'fulfilled' ? temperatureResult.value : null;
      const systemData = systemResult.status === 'fulfilled' ? systemResult.value : null;
      const firmwareData = firmwareResult.status === 'fulfilled' ? firmwareResult.value : null;

      // Temperatures — prefer individual endpoints, fall back to the full temperature object
      const ambientTemp = ambientData?.ambient ?? tempData?.temperature?.ambient ?? 0;
      const cpuTemp = cpuData?.cpu ?? tempData?.temperature?.cpu ?? 0;
      const gpuTemp = gpuData?.gpu ?? tempData?.temperature?.gpu ?? undefined;
      const fpgaTemp = tempData?.temperature?.fpga ?? undefined;
      const psuTemp = tempData?.temperature?.psu ?? undefined;
      const mainTemp = tempData?.temperature?.main ?? undefined;

      // Uptime — the live API returns a human-readable string like "28m 28s"
      const uptimeSeconds = uptimeData?.uptime
        ? parseUptimeString(uptimeData.uptime)
        : 0;

      // Fan speeds from /api/system (response is wrapped: { system: { fan: ... } })
      const sys = systemData?.system;
      const caseFan1 = sys?.fan?.case?.one?.speed ?? undefined;
      const caseFan2 = sys?.fan?.case?.two?.speed ?? undefined;
      const fpgaFan = sys?.fan?.fpga?.speed ?? undefined;
      // Use the highest case fan speed as the representative fan speed
      const fanSpeed = caseFan1 !== undefined || caseFan2 !== undefined
        ? Math.max(caseFan1 ?? 0, caseFan2 ?? 0)
        : undefined;

      // Firmware version
      const firmware = firmwareData?.['software-version']
        ?? sys?.['software-version']
        ?? undefined;

      const errors: string[] = [];
      const warnings: string[] = [];

      // --- CPU temperature thresholds ---
      if (cpuTemp > THRESHOLDS.cpu.critical) {
        errors.push(`CPU temperature critically high: ${cpuTemp}°C`);
      } else if (cpuTemp > THRESHOLDS.cpu.warning) {
        warnings.push(`CPU temperature elevated: ${cpuTemp}°C`);
      }

      // --- GPU temperature thresholds ---
      if (gpuTemp !== undefined) {
        if (gpuTemp > THRESHOLDS.gpu.critical) {
          errors.push(`GPU temperature critically high: ${gpuTemp}°C`);
        } else if (gpuTemp > THRESHOLDS.gpu.warning) {
          warnings.push(`GPU temperature elevated: ${gpuTemp}°C`);
        }
      }

      // --- FPGA temperature thresholds ---
      if (fpgaTemp !== undefined) {
        if (fpgaTemp > THRESHOLDS.fpga.critical) {
          errors.push(`FPGA temperature critically high: ${fpgaTemp}°C`);
        } else if (fpgaTemp > THRESHOLDS.fpga.warning) {
          warnings.push(`FPGA temperature elevated: ${fpgaTemp}°C`);
        }
      }

      // --- PSU temperature thresholds ---
      if (psuTemp !== undefined) {
        if (psuTemp > THRESHOLDS.psu.critical) {
          errors.push(`PSU temperature critically high: ${psuTemp}°C`);
        } else if (psuTemp > THRESHOLDS.psu.warning) {
          warnings.push(`PSU temperature elevated: ${psuTemp}°C`);
        }
      }

      // --- Ambient temperature thresholds ---
      if (ambientTemp > THRESHOLDS.ambient.critical) {
        errors.push(`Ambient temperature critically high: ${ambientTemp}°C`);
      } else if (ambientTemp > THRESHOLDS.ambient.warning) {
        warnings.push(`Ambient temperature elevated: ${ambientTemp}°C`);
      }

      // --- Fan speed warnings (very low RPM may indicate failure) ---
      if (fanSpeed !== undefined && fanSpeed < 500 && fanSpeed > 0) {
        warnings.push(`Fan speed low: ${fanSpeed} RPM`);
      }
      if (fpgaFan !== undefined && fpgaFan < 500 && fpgaFan > 0) {
        warnings.push(`FPGA fan speed low: ${fpgaFan} RPM`);
      }

      const health: DeviceHealth = {
        temperature: ambientTemp || mainTemp || cpuTemp,
        cpuUsage: cpuTemp > 0 ? cpuTempToUsage(cpuTemp) : undefined,
        gpuTemp,
        fanSpeed,
        uptime: uptimeSeconds,
        errors,
        warnings,
      };

      return { reachable: true, health, firmware };
    } catch {
      return { reachable: false, health: null };
    }
  }
}
