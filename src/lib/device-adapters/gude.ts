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
 * Gude /statusjson.js may return a JavaScript variable assignment rather than
 * pure JSON, e.g.:  var json_data = {...};
 * Strip any leading variable assignment before parsing so both formats work.
 */
async function fetchGudeJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) return null;
    const text = await res.text();
    // Strip JS assignment prefix: "var <identifier> = " … ";"
    const stripped = text.replace(/^\s*var\s+\w+\s*=\s*/, '').replace(/;\s*$/, '').trim();
    return JSON.parse(stripped) as T;
  } catch {
    return null;
  }
}

interface GudeStatus {
  product?: string;
  firmware?: string;
  uptime?: number;
  sensor?: {
    temperature?: number;
    humidity?: number;
  };
  outputs?: Array<{
    id: number;
    state: boolean;
    current?: number;
    power?: number;
  }>;
  total_power?: number;
}

/**
 * Gude Expert Power Control PDUs expose a JSON status endpoint.
 * Status: GET /statusjson.js (returns full device state)
 * Control: GET /ov.html?cmd=1&p=N&s=0|1 (switch outlet N)
 */
export class GudeAdapter implements DeviceAdapter {
  manufacturer = 'gude' as const;

  async queryHealth(ip: string, port: number = 80): Promise<DeviceQueryResult> {
    const base = `http://${ip}:${port}`;

    try {
      const status = await fetchGudeJson<GudeStatus>(`${base}/statusjson.js`);

      if (!status) {
        return { reachable: false, health: null };
      }

      const errors: string[] = [];
      const warnings: string[] = [];

      const temp = status.sensor?.temperature ?? 0;
      if (temp > 40) warnings.push(`Ambient temperature elevated: ${temp}C`);

      if (status.sensor?.humidity !== undefined && status.sensor.humidity > 80) {
        warnings.push(`Humidity high: ${status.sensor.humidity}%`);
      }

      if (status.outputs) {
        const overloaded = status.outputs.filter((o) => o.current && o.current > 12);
        if (overloaded.length > 0) {
          warnings.push(`${overloaded.length} outlet(s) drawing high current`);
        }
      }

      const health: DeviceHealth = {
        temperature: temp,
        powerDraw: status.total_power,
        uptime: status.uptime ?? 0,
        errors,
        warnings,
      };

      return { reachable: true, health, firmware: status.firmware };
    } catch {
      return { reachable: false, health: null };
    }
  }
}
