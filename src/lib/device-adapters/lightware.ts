import { DeviceHealth } from '@/types';
import { DeviceAdapter, DeviceQueryResult } from './types';
import { fetchWithTimeout } from '@/lib/utils';

interface LWSysInfo {
  ProductName?: string;
  SerialNumber?: string;
  FirmwareVersion?: string;
  PackageVersion?: string;
  Hostname?: string;
  Uptime?: number;
  // Some models nest properties differently
  properties?: Record<string, string | number>;
}

interface LWSignalPresent {
  SignalPresent?: boolean;
  value?: boolean;
}

async function fetchLightwareJson<T>(ip: string, path: string): Promise<T | null> {
  // Try HTTP first (some models serve HTTP on port 80)
  try {
    const res = await fetchWithTimeout(`http://${ip}:80${path}`);
    if (res.ok) {
      return (await res.json()) as T;
    }
  } catch {
    // HTTP failed — try HTTPS with self-signed cert tolerance
  }

  // Try HTTPS — in a Node.js server environment, self-signed certs may cause
  // fetch to reject. We catch and treat cert errors as unreachable rather than
  // crashing, since we cannot easily set rejectUnauthorized on native fetch.
  try {
    const res = await fetchWithTimeout(`https://${ip}${path}`);
    if (res.ok) {
      return (await res.json()) as T;
    }
  } catch {
    // HTTPS also failed
  }

  return null;
}

export class LightwareAdapter implements DeviceAdapter {
  manufacturer = 'lightware' as const;

  async queryHealth(ip: string): Promise<DeviceQueryResult> {
    try {
      const [sysInfo, signalData] = await Promise.all([
        fetchLightwareJson<LWSysInfo>(ip, '/api/SYS'),
        fetchLightwareJson<LWSignalPresent>(ip, '/api/MEDIA/VIDEO/I1/SignalPresent'),
      ]);

      if (!sysInfo && !signalData) {
        return { reachable: false, health: null };
      }

      const errors: string[] = [];
      const warnings: string[] = [];

      // Check signal presence
      const signalPresent = signalData?.SignalPresent ?? signalData?.value;
      if (signalPresent === false) {
        warnings.push('No input signal on I1');
      }

      const firmware =
        sysInfo?.FirmwareVersion ??
        sysInfo?.PackageVersion ??
        sysInfo?.properties?.['FirmwareVersion'] as string | undefined ??
        undefined;

      const uptime =
        sysInfo?.Uptime ??
        (typeof sysInfo?.properties?.['Uptime'] === 'number'
          ? sysInfo.properties['Uptime']
          : 0);

      const health: DeviceHealth = {
        temperature: 0, // Lightware devices don't typically expose temperature via REST
        uptime: typeof uptime === 'number' ? uptime : 0,
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
