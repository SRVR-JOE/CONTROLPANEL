import { DeviceAdapter, DeviceQueryResult } from './types';

const TIMEOUT_MS = 3000;

/**
 * Audinate Dante/AVIO devices are discovered via mDNS (Bonjour).
 * TODO: Implement mDNS discovery for Dante device enumeration.
 * REST fallback on port 8080 is attempted first.
 */
export class DanteAdapter implements DeviceAdapter {
  manufacturer = 'audinate' as const;

  async queryHealth(ip: string, port: number = 8080): Promise<DeviceQueryResult> {
    // Try REST fallback — AVIO adapters expose a web config page
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
      try {
        const res = await fetch(`http://${ip}:${port}/`, {
          method: 'HEAD',
          signal: controller.signal,
        });
        if (res.ok) {
          return {
            reachable: true,
            health: { temperature: 0, uptime: 0, errors: [], warnings: [] },
          };
        }
      } finally {
        clearTimeout(timeout);
      }
    } catch {
      // REST fallback failed
    }

    // mDNS discovery — not yet implemented
    return {
      reachable: false,
      health: null,
      errors: ['mDNS protocol not implemented — device may be online but cannot be queried via REST'],
    };
  }
}
