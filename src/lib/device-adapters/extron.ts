import { DeviceAdapter, DeviceQueryResult } from './types';

const TIMEOUT_MS = 3000;

/**
 * Extron devices use SIS (Simple Instruction Set) over TCP port 23 (Telnet).
 * TODO: Implement SIS protocol for full device control.
 * HTTP REST fallback is attempted first.
 */
export class ExtronAdapter implements DeviceAdapter {
  manufacturer = 'extron' as const;

  async queryHealth(ip: string, port: number = 80): Promise<DeviceQueryResult> {
    // Try HTTP fallback — some Extron devices expose a web interface
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
      // HTTP fallback failed
    }

    // SIS TCP :23 — not yet implemented
    return {
      reachable: false,
      health: null,
      errors: ['SIS protocol not implemented — device may be online but cannot be queried via HTTP'],
    };
  }
}
