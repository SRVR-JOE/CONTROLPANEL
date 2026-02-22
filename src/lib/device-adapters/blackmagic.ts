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
   * queryHealthTCP — STUB for Smart Videohub devices (TCP/9990).
   *
   * NOT YET IMPLEMENTED: Smart Videohub uses a raw TCP ASCII protocol on
   * port 9990, not HTTP REST. A full implementation would:
   *   1. Open a net.Socket to ip:9990
   *   2. Read the initial "VIDEOHUB DEVICE:" block to confirm presence
   *   3. Parse "Model name:", "Video inputs:", "Video outputs:" fields
   *   4. Send "PING:" to keep the connection alive and confirm reachability
   *   5. Close the socket
   *
   * This cannot be done with the browser fetch() API. It requires a
   * dedicated server-side API route that uses Node's `net` module.
   *
   * For now, calling this on a Videohub IP will always return unreachable.
   * Use queryHealth() only for REST-capable Blackmagic devices (see file header).
   */
  async queryHealthTCP(ip: string, port: number = 9990): Promise<DeviceQueryResult> {
    // TODO: implement raw TCP health check for Smart Videohub devices.
    // The Videohub Ethernet Protocol is documented at:
    //   https://documents.blackmagicdesign.com/DeveloperManuals/VideohubDeveloperInformation.pdf
    console.warn(
      `[BlackmagicAdapter] queryHealthTCP called for ${ip}:${port}. ` +
      'Smart Videohub TCP health check is not yet implemented. ' +
      'This device type requires a raw TCP socket on port 9990, not HTTP REST.'
    );
    return { reachable: false, health: null, errors: ['Videohub TCP protocol not yet implemented'] };
  }

  async queryHealth(ip: string): Promise<DeviceQueryResult> {
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
