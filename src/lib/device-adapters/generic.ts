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
  // Note: the manufacturer field is set to 'aja' here as a placeholder required by
  // the DeviceAdapter interface. The adapter map in index.ts maps 'ross' and 'barco'
  // to this same GenericAdapter instance; the field does not affect routing logic.
  manufacturer = 'aja' as const;

  async queryHealth(ip: string, port?: number): Promise<DeviceQueryResult> {
    const target = port ? `http://${ip}:${port}` : `http://${ip}`;

    try {
      let reachable = false;
      let uptime = 0;

      try {
        // Use HEAD request to minimise bandwidth — we only care about reachability.
        // Any HTTP response (including 4xx) means the device is reachable;
        // only network-level errors (connection refused, timeout) indicate unreachable.
        const res = await fetchWithTimeout(target, 3000, { method: 'HEAD' });
        reachable = true;
        uptime = parseUptimeFromHeaders(res.headers);
      } catch {
        // HEAD failed — try GET as a fallback; some embedded devices reject HEAD requests
        try {
          const res = await fetchWithTimeout(target, 3000, { method: 'GET' });
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
