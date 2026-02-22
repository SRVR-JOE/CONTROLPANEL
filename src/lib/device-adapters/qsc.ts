import { DeviceHealth } from '@/types';
import { DeviceAdapter, DeviceQueryResult } from './types';

const TIMEOUT_MS = 3000;

interface QSysStatusResult {
  Platform?: string;
  DesignName?: string;
  IsRedundant?: boolean;
  IsEmulator?: boolean;
  Status?: { Code: number; String: string };
}

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * QSC Q-SYS cores use JSON-RPC on port 1710.
 * Method: StatusGet — returns core platform info and design name.
 */
export class QSCAdapter implements DeviceAdapter {
  manufacturer = 'qsc' as const;

  async queryHealth(ip: string, port: number = 1710): Promise<DeviceQueryResult> {
    const url = `http://${ip}:${port}`;

    try {
      const rpcPayload = JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'StatusGet',
        params: 0,
      });

      const res = await fetchWithTimeout(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: rpcPayload,
      });

      if (!res.ok) {
        return { reachable: false, health: null };
      }

      const data = await res.json() as { result?: QSysStatusResult; error?: unknown };

      if (!data.result) {
        return { reachable: true, health: { temperature: 0, uptime: 0, errors: [], warnings: [] } };
      }

      const errors: string[] = [];
      const warnings: string[] = [];

      const statusCode = data.result.Status?.Code ?? 0;
      if (statusCode >= 5) {
        errors.push(`Core status: ${data.result.Status?.String ?? 'Error'}`);
      } else if (statusCode >= 2) {
        warnings.push(`Core status: ${data.result.Status?.String ?? 'Warning'}`);
      }

      if (data.result.IsEmulator) {
        warnings.push('Running in emulator mode');
      }

      const health: DeviceHealth = {
        temperature: 0,
        uptime: 0,
        errors,
        warnings,
      };

      return { reachable: true, health, firmware: data.result.Platform };
    } catch {
      return { reachable: false, health: null };
    }
  }
}
