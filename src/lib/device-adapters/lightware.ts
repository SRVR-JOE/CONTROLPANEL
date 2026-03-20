import * as net from 'net';
import { DeviceHealth } from '@/types';
import { DeviceAdapter, DeviceQueryResult } from './types';

// ---------------------------------------------------------------------------
// LW3 TCP Protocol helpers
// ---------------------------------------------------------------------------

const LW3_PORT = 6107;
const SOCKET_TIMEOUT = 5000;
const IDLE_DELAY = 300; // ms of silence before we consider a response complete

/**
 * Open a TCP connection to a Lightware device on port 6107, send one or more
 * GETALL (or CALL) commands, and return the combined raw response text.
 *
 * All commands are sent over a single socket.  After the last chunk of data
 * arrives and 300 ms of silence elapses the socket is closed and the
 * accumulated buffer is returned.
 */
export async function lw3Query(
  ip: string,
  port: number,
  commands: string[],
): Promise<string> {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let data = '';
    let idleTimer: ReturnType<typeof setTimeout> | undefined;

    socket.setTimeout(SOCKET_TIMEOUT);

    socket.connect(port, ip, () => {
      for (const cmd of commands) {
        socket.write(cmd + '\r\n');
      }
    });

    socket.on('data', (chunk) => {
      data += chunk.toString();
      // Reset the idle timer every time new data arrives.
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        socket.destroy();
      }, IDLE_DELAY);
    });

    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error('LW3 TCP timeout'));
    });

    socket.on('error', (err) => {
      reject(err);
    });

    socket.on('close', () => {
      resolve(data);
    });
  });
}

/**
 * Parse a GETALL response block into a key-value map.
 *
 * Lines look like:
 *   pr /SYS/HSMB/HEALTH.Temperature0=29.00 C;0;75;0;85;28;31
 *   pw /MANAGEMENT/POWER.Psu1=running
 */
export function parseGetAll(raw: string): Record<string, string> {
  const props: Record<string, string> = {};
  // Device sends \r\n line endings — strip \r so the $ anchor matches.
  const cleaned = raw.replace(/\r/g, '');
  for (const line of cleaned.split('\n')) {
    const match = line.match(/^(?:pr|pw)\s+\S+\.(\w+)=(.+)$/);
    if (match) {
      props[match[1]] = match[2].trim();
    }
  }
  return props;
}

/** Extract the numeric temperature from a health value string. */
function parseTemp(value: string): number {
  // "29.00 C;0;75;0;85;28;31" -> 29.0
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
}

/** Convert "0 days 02:02:22" to seconds. */
function parseUptime(value: string): number {
  const match = value.match(/(\d+)\s*days?\s+(\d+):(\d+):(\d+)/);
  if (!match) return 0;
  return (
    parseInt(match[1]) * 86400 +
    parseInt(match[2]) * 3600 +
    parseInt(match[3]) * 60 +
    parseInt(match[4])
  );
}

/** Convert a 0-255 PWM duty cycle to an approximate RPM (255 ~ 3000 RPM). */
function pwmToRpm(pwm: number): number {
  return Math.round((pwm / 255) * 3000);
}

// ---------------------------------------------------------------------------
// Device adapter
// ---------------------------------------------------------------------------

export class LightwareAdapter implements DeviceAdapter {
  manufacturer = 'lightware' as const;

  async queryHealth(ip: string): Promise<DeviceQueryResult> {
    try {
      const raw = await lw3Query(ip, LW3_PORT, [
        'GETALL /MANAGEMENT/UID',
        'GETALL /SYS/HSMB/HEALTH',
        'GETALL /SYS/CECU/HEALTH',
        'GETALL /SYS/HSMB/FANCONTROL',
        'GETALL /MANAGEMENT/POWER',
        'GETALL /MANAGEMENT/DATETIME',
        'GETALL /SYS/IB1/PORT1/VIDEO',
      ]);

      // The entire response is one big text blob. Parse all property lines
      // regardless of which GETALL they belong to.  Property names are unique
      // across the queried paths so a single flat map works fine.
      const props = parseGetAll(raw);

      // If we got literally nothing back, the device spoke TCP but gave us
      // nothing useful.
      if (Object.keys(props).length === 0) {
        return { reachable: false, health: null };
      }

      const errors: string[] = [];
      const warnings: string[] = [];

      // --- Temperatures ---------------------------------------------------
      const temps: number[] = [];
      for (let i = 0; i <= 9; i++) {
        const key = `Temperature${i}`;
        if (props[key] !== undefined) {
          temps.push(parseTemp(props[key]));
        }
      }
      const maxTemp = temps.length > 0 ? Math.max(...temps) : 0;

      // --- Fan speed (use the highest PWM reading) ------------------------
      const fanPwms: number[] = [];
      for (let i = 1; i <= 4; i++) {
        const key = `Fan${i}Pwm`;
        if (props[key] !== undefined) {
          fanPwms.push(parseInt(props[key], 10));
        }
      }
      const maxFanPwm =
        fanPwms.length > 0 ? Math.max(...fanPwms) : 0;
      const fanSpeed = pwmToRpm(maxFanPwm);

      // --- PSU status -----------------------------------------------------
      for (const psu of ['Psu1', 'Psu2']) {
        const val = props[psu];
        if (val && val.toLowerCase() !== 'running') {
          warnings.push(`${psu} status: ${val}`);
        }
      }

      // --- Signal on I1 ---------------------------------------------------
      if (props['SignalPresent'] === 'false') {
        warnings.push('No input signal on I1');
      }
      if (props['Connected'] === 'false') {
        warnings.push('Input I1 not connected');
      }

      // --- Uptime ---------------------------------------------------------
      const uptime = props['Uptime'] ? parseUptime(props['Uptime']) : 0;

      // --- Firmware -------------------------------------------------------
      const firmware = props['FirmwareVersion'] ?? undefined;

      const health: DeviceHealth = {
        temperature: maxTemp,
        uptime,
        fanSpeed,
        errors,
        warnings,
      };

      return { reachable: true, health, firmware };
    } catch {
      return { reachable: false, health: null };
    }
  }
}
