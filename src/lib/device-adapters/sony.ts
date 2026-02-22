import { DeviceAdapter, DeviceQueryResult } from './types';

const TIMEOUT_MS = 3000;

/**
 * Sony PTZ cameras primarily use VISCA over UDP on port 52381.
 * TODO: Implement VISCA UDP protocol for full camera control.
 * REST fallback via /command endpoint is attempted first.
 */
export class SonyAdapter implements DeviceAdapter {
  manufacturer = 'sony' as const;

  async queryHealth(ip: string, port: number = 80): Promise<DeviceQueryResult> {
    // Try REST fallback first — some Sony cameras expose an HTTP API
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
      try {
        const res = await fetch(`http://${ip}:${port}/command/inquiry.cgi?inq=system`, {
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

    // VISCA UDP :52381 — not yet implemented
    return {
      reachable: false,
      health: null,
      errors: ['VISCA protocol not implemented — device may be online but cannot be queried via REST'],
    };
  }
}
