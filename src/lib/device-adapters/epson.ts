import { DeviceAdapter, DeviceQueryResult } from './types';

const TIMEOUT_MS = 3000;

/**
 * Epson projectors primarily use ESC/VP.net over TCP port 3629.
 * TODO: Implement ESC/VP.net binary protocol for full projector control.
 * CGI fallback via HTTP is attempted first.
 */
export class EpsonAdapter implements DeviceAdapter {
  manufacturer = 'epson' as const;

  async queryHealth(ip: string, port: number = 80): Promise<DeviceQueryResult> {
    // Try CGI fallback — Epson projectors expose HTTP status pages
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
      try {
        const res = await fetch(`http://${ip}:${port}/cgi-bin/webconf.exe?page=status`, {
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
      // CGI fallback failed
    }

    // ESC/VP.net TCP :3629 — not yet implemented
    return {
      reachable: false,
      health: null,
      errors: ['ESC/VP.net protocol not implemented — device may be online but cannot be queried via HTTP'],
    };
  }
}
