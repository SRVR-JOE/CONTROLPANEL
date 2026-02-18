import { DeviceHealth } from '@/types';
import { DeviceAdapter, DeviceQueryResult } from './types';

const TIMEOUT_MS = 3000;

interface BMSystemInfo {
  status?: string;
  temperature?: number;
  uptime?: number;
}

interface BMProductInfo {
  productName?: string;
  model?: string;
  softwareVersion?: string;
  firmwareVersion?: string;
}

interface BMTransportStatus {
  mode?: string;
  speed?: number;
  inputVideoFormat?: string;
  loop?: boolean;
}

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

export class BlackmagicAdapter implements DeviceAdapter {
  manufacturer = 'blackmagic' as const;

  async queryHealth(ip: string): Promise<DeviceQueryResult> {
    const base = `http://${ip}/control/api/v1`;

    try {
      const [systemInfo, productInfo, transportStatus] = await Promise.all([
        fetchJson<BMSystemInfo>(`${base}/system`),
        fetchJson<BMProductInfo>(`${base}/system/product`),
        fetchJson<BMTransportStatus>(`${base}/transports/0`),
      ]);

      // If none of the endpoints responded, device is unreachable
      if (!systemInfo && !productInfo && !transportStatus) {
        return { reachable: false, health: null };
      }

      const errors: string[] = [];
      const warnings: string[] = [];

      // Check transport status for potential issues
      if (transportStatus) {
        if (transportStatus.inputVideoFormat === 'none' || transportStatus.inputVideoFormat === '') {
          warnings.push('No input video signal detected');
        }
      }

      const firmware =
        productInfo?.softwareVersion ??
        productInfo?.firmwareVersion ??
        undefined;

      const health: DeviceHealth = {
        temperature: systemInfo?.temperature ?? 0,
        uptime: systemInfo?.uptime ?? 0,
        errors,
        warnings,
      };

      return {
        reachable: true,
        health,
        firmware,
      };
    } catch {
      return { reachable: false, health: null };
    }
  }
}
