/**
 * Blackmagic Design device adapter.
 *
 * PROTOCOL NOTES — READ BEFORE MODIFYING
 * =========================================
 *
 * Blackmagic makes two distinct families of products that use completely
 * different control protocols:
 *
 * 1. REST API devices (this adapter handles these):
 *    - HyperDeck Studio series  — HTTP REST on port 80  (/control/api/v1/...)
 *    - ATEM Mini / ATEM SDI     — HTTP REST on port 80
 *    - Teranex Mini converters  — HTTP REST on port 80
 *    - UltraStudio devices      — HTTP REST on port 80
 *    The `queryHealth()` method below targets this family.
 *
 * 2. Videohub TCP protocol devices (NOT handled by this REST adapter):
 *    - Smart Videohub 12x12, 20x20, 40x40, 72x72
 *    - Universal Videohub 288
 *    These use the "Videohub Ethernet Protocol" — a line-oriented ASCII
 *    protocol over TCP port 9990.  There is no HTTP REST interface.
 *
 *    Example Videohub TCP session:
 *      CONNECT → server sends:
 *        VIDEOHUB DEVICE:\n
 *        Device present: true\n
 *        Model name: Smart Videohub 40 x 40\n
 *        Unique ID: 7C2E0D...\n
 *        Video inputs: 40\n
 *        Video processing units: 0\n
 *        Video outputs: 40\n
 *        Video monitoring outputs: 0\n
 *        Serial ports: 0\n
 *        \n
 *      Client sends commands like:
 *        VIDEO OUTPUT ROUTING:\n
 *        0 5\n        (route input 6 → output 1)
 *        \n
 *
 *    The `queryHealthTCP` stub below documents this protocol.
 *    A real implementation would use a raw TCP socket (Node.js `net.Socket`
 *    or a custom Next.js API route with `net` from Node) since `fetch` cannot
 *    speak raw TCP.
 *
 * protocolType field:
 *   Use 'rest' for HyperDeck / ATEM / Teranex — handled by this class.
 *   Use 'videohub-tcp' for Smart Videohub routing matrices — requires TCP.
 *   When adding Videohub devices to the store, set the port to 9990 and the
 *   adapter selection logic can branch on this field.
 */

import { DeviceHealth } from '@/types';
import { DeviceAdapter, DeviceQueryResult } from './types';
import { fetchWithTimeout } from '@/lib/utils';
import * as net from 'net';

/* ------------------------------------------------------------------ */
/*  TCP helpers for Videohub protocol                                  */
/* ------------------------------------------------------------------ */

const TCP_CONNECT_TIMEOUT_MS = 5_000;
const TCP_READ_TIMEOUT_MS = 5_000;

interface VideohubDeviceInfo {
  devicePresent: boolean;
  model: string;
}

/**
 * Connect to a Videohub device on TCP port 9990, read the initial
 * state dump, and parse the VIDEOHUB DEVICE block.
 */
function connectAndReadHealth(
  ip: string,
  port: number,
): Promise<VideohubDeviceInfo> {
  return new Promise((resolve, reject) => {
    let buffer = '';
    let settled = false;

    const socket = new net.Socket();

    let idleTimer: ReturnType<typeof setTimeout> | null = null;

    function finish() {
      if (settled) return;
      settled = true;
      if (idleTimer) clearTimeout(idleTimer);
      socket.destroy();

      // Parse the VIDEOHUB DEVICE block from the buffer
      const info: VideohubDeviceInfo = {
        devicePresent: false,
        model: 'Unknown',
      };

      // Split into blocks separated by blank lines
      const normalised = buffer.replace(/\r\n/g, '\n');
      const chunks = normalised.split(/\n\n+/);

      for (const chunk of chunks) {
        const trimmed = chunk.trim();
        if (!trimmed) continue;
        const lines = trimmed.split('\n');
        const header = lines[0];
        if (header === 'VIDEOHUB DEVICE:') {
          for (let i = 1; i < lines.length; i++) {
            const colonIdx = lines[i].indexOf(':');
            if (colonIdx === -1) continue;
            const key = lines[i].slice(0, colonIdx).trim();
            const value = lines[i].slice(colonIdx + 1).trim();
            switch (key) {
              case 'Device present':
                info.devicePresent = value === 'true';
                break;
              case 'Model name':
                info.model = value;
                break;
            }
          }
          break; // Only need the VIDEOHUB DEVICE block
        }
      }

      resolve(info);
    }

    function fail(err: Error) {
      if (settled) return;
      settled = true;
      if (idleTimer) clearTimeout(idleTimer);
      socket.destroy();
      reject(err);
    }

    socket.setTimeout(TCP_CONNECT_TIMEOUT_MS);

    socket.on('timeout', () => {
      if (buffer.length > 0) {
        finish();
      } else {
        fail(new Error('Connection timed out'));
      }
    });

    socket.on('error', (err) => fail(err));

    socket.on('data', (chunk) => {
      buffer += chunk.toString('utf-8');

      // Once we see the VIDEOHUB DEVICE block header and a blank line
      // after it, we have enough to determine health.
      if (buffer.includes('VIDEOHUB DEVICE:') && buffer.includes('\n\n')) {
        // Reset idle timer — finish quickly once we have the device block
        if (idleTimer) clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
          finish();
        }, 300);
        return;
      }

      // Reset idle timer
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        finish();
      }, 500);
    });

    socket.connect(port, ip, () => {
      socket.setTimeout(TCP_READ_TIMEOUT_MS);
    });
  });
}

/** Indicates which control protocol this Blackmagic device speaks. */
export type BlackmagicProtocolType = 'rest' | 'videohub-tcp';

interface BMSystemInfo {
  status?: string;
  temperature?: number;
  uptime?: number;
}

interface BMProductInfo {
  productName?: string;
  model?: string;
  softwareVersion?: string;
  firmwareVersion?: string;
}

interface BMTransportStatus {
  mode?: string;
  speed?: number;
  inputVideoFormat?: string;
  loop?: boolean;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export class BlackmagicAdapter implements DeviceAdapter {
  manufacturer = 'blackmagic' as const;

  /**
   * queryHealthTCP — Health check for Smart Videohub devices (TCP/9990).
   *
   * Connects via raw TCP to port 9990, reads the initial state dump,
   * and parses the VIDEOHUB DEVICE block for model name and device
   * present status. The Smart Videohub 40x40 does NOT expose any
   * health telemetry (no temperature, no fan speed, no alarms).
   * VIDEO INPUT STATUS queries return NAK on this model.
   *
   * The only meaningful health indicator is whether the device is
   * reachable and reports "Device present: true".
   */
  async queryHealthTCP(ip: string, port: number = 9990): Promise<DeviceQueryResult> {
    try {
      const info = await connectAndReadHealth(ip, port);

      if (!info.devicePresent) {
        return {
          reachable: false,
          health: {
            temperature: 0,
            uptime: 0,
            errors: ['Device present: false — device may be initialising or offline'],
            warnings: ['Blackmagic Videohub does not expose temperature or fan data'],
          },
          firmware: info.model,
        };
      }

      // Device is present and reachable — online with no errors
      const health: DeviceHealth = {
        temperature: 0,
        uptime: 0,
        errors: [],
        warnings: ['Blackmagic Videohub does not expose temperature or fan data'],
      };

      return {
        reachable: true,
        health,
        firmware: info.model,
      };
    } catch {
      // Connection failed entirely — device is offline / unreachable
      return {
        reachable: false,
        health: null,
        errors: ['Failed to connect to Videohub TCP port 9990'],
      };
    }
  }

  async queryHealth(ip: string, port?: number): Promise<DeviceQueryResult> {
    // Try Videohub TCP first (port 9990) — this is the protocol for Smart Videohub devices.
    // If the caller explicitly passed port 9990, use TCP directly.
    // Otherwise, try TCP first and fall back to REST.
    if (port === 9990) {
      return this.queryHealthTCP(ip, port);
    }

    // Try TCP 9990 first (most Blackmagic matrix routers use this)
    try {
      const tcpResult = await this.queryHealthTCP(ip, 9990);
      if (tcpResult.reachable || (tcpResult.health && tcpResult.firmware)) {
        return tcpResult;
      }
    } catch {
      // TCP failed, fall through to REST
    }

    const base = `http://${ip}/control/api/v1`;

    try {
      const [systemInfo, productInfo, transportStatus] = await Promise.all([
        fetchJson<BMSystemInfo>(`${base}/system`),
        fetchJson<BMProductInfo>(`${base}/system/product`),
        fetchJson<BMTransportStatus>(`${base}/transports/0`),
      ]);

      // If none of the endpoints responded, device is unreachable
      if (!systemInfo && !productInfo && !transportStatus) {
        return { reachable: false, health: null };
      }

      const errors: string[] = [];
      const warnings: string[] = [];

      // Check transport status for potential issues
      if (transportStatus) {
        if (transportStatus.inputVideoFormat === 'none' || transportStatus.inputVideoFormat === '') {
          warnings.push('No input video signal detected');
        }
      }

      const firmware =
        productInfo?.softwareVersion ??
        productInfo?.firmwareVersion ??
        undefined;

      const health: DeviceHealth = {
        temperature: systemInfo?.temperature ?? 0,
        uptime: systemInfo?.uptime ?? 0,
        errors,
        warnings,
      };

      return {
        reachable: true,
        health,
        firmware,
      };
    } catch {
      return { reachable: false, health: null };
    }
  }
}
