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

/**
 * Panasonic PTZ cameras use CGI commands.
 * Power query: /cgi-bin/aw_ptz?cmd=%23O&res=1
 *   Returns "p1" (on) or "p0" (off/standby)
 * Model query: /cgi-bin/aw_cam?cmd=QID&res=1
 *   Returns "OID:" followed by model identifier
 */
export class PanasonicAdapter implements DeviceAdapter {
  manufacturer = 'panasonic' as const;

  async queryHealth(ip: string, port: number = 80): Promise<DeviceQueryResult> {
    const base = `http://${ip}:${port}`;

    try {
      let reachable = false;
      let powerOn = false;
      let modelId: string | undefined;

      // Query power status
      try {
        const res = await fetchWithTimeout(`${base}/cgi-bin/aw_ptz?cmd=%23O&res=1`);
        if (res.ok) {
          reachable = true;
          const text = await res.text();
          powerOn = text.trim().toLowerCase().includes('p1');
        }
      } catch {
        // Power query failed
      }

      // Query model ID
      try {
        const res = await fetchWithTimeout(`${base}/cgi-bin/aw_cam?cmd=QID&res=1`);
        if (res.ok) {
          reachable = true;
          const text = await res.text();
          const match = text.match(/OID:(\S+)/);
          if (match) modelId = match[1];
        }
      } catch {
        // Model query failed
      }

      if (!reachable) {
        return { reachable: false, health: null };
      }

      const warnings: string[] = [];
      if (!powerOn) warnings.push('Camera in standby mode');

      const health: DeviceHealth = {
        temperature: 0,
        uptime: 0,
        errors: [],
        warnings,
      };

      return { reachable: true, health, firmware: modelId };
    } catch {
      return { reachable: false, health: null };
    }
  }
}
