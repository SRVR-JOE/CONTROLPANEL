import { DeviceAdapter, DeviceQueryResult } from './types';

const TIMEOUT_MS = 3000;

/**
 * Crestron devices use CIP (Crestron Internet Protocol) over TCP port 41794.
 * TODO: Implement CIP protocol for full control system integration.
 * HTTPS REST fallback on port 443 is attempted first.
 */
export class CrestronAdapter implements DeviceAdapter {
  manufacturer = 'crestron' as const;

  async queryHealth(ip: string, port: number = 443): Promise<DeviceQueryResult> {
    // Try HTTPS REST fallback — modern Crestron devices expose an HTTPS API
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
      try {
        const res = await fetch(`https://${ip}:${port}/Device/DeviceInfo`, {
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
      // HTTPS fallback failed (may be cert issue)
    }

    // CIP TCP :41794 — not yet implemented
    return {
      reachable: false,
      health: null,
      errors: ['CIP protocol not implemented — device may be online but cannot be queried via HTTPS'],
    };
  }
}
