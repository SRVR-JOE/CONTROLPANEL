import { DeviceHealth } from '@/types';
import { DeviceAdapter, DeviceQueryResult } from './types';
import { fetchWithTimeout } from '@/lib/utils';

function parseUptimeFromHeaders(headers: Headers): number {
  // Some devices expose uptime or age through response headers
  const age = headers.get('age');
  if (age) {
    const seconds = parseInt(age, 10);
    if (!isNaN(seconds)) return seconds;
  }

  // Attempt to estimate uptime from the Date and Last-Modified headers
  const dateHeader = headers.get('date');
  const lastModified = headers.get('last-modified');
  if (dateHeader && lastModified) {
    const now = new Date(dateHeader).getTime();
    const modified = new Date(lastModified).getTime();
    if (!isNaN(now) && !isNaN(modified) && now > modified) {
      return Math.floor((now - modified) / 1000);
    }
  }

  return 0;
}

export class GenericAdapter implements DeviceAdapter {
  manufacturer = 'aja' as const; // Default; overridden at runtime via getAdapter

  async queryHealth(ip: string, port?: number): Promise<DeviceQueryResult> {
    const target = port ? `http://${ip}:${port}` : `http://${ip}`;

    try {
      let reachable = false;
      let uptime = 0;

      try {
        // Use HEAD request to minimise bandwidth — we only care about reachability
        const res = await fetchWithTimeout(target);
        reachable = true;
        uptime = parseUptimeFromHeaders(res.headers);
      } catch {
        // Try GET as a fallback — some embedded devices reject HEAD
        try {
          const res = await fetchWithTimeout(target);
          reachable = true;
          uptime = parseUptimeFromHeaders(res.headers);
          // Consume and discard body to free resources
          await res.text().catch(() => {});
        } catch {
          reachable = false;
        }
      }

      if (!reachable) {
        return { reachable: false, health: null };
      }

      const health: DeviceHealth = {
        temperature: 0,
        uptime,
        errors: [],
        warnings: [],
      };

      return { reachable: true, health };
    } catch {
      return { reachable: false, health: null };
    }
  }
}
