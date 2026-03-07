import { DeviceHealth } from '@/types';
import { DeviceAdapter, DeviceQueryResult } from './types';
import { fetchWithTimeout } from '@/lib/utils';

/**
 * Ross OpenGear adapter.
 *
 * Ross openGear frames run DashBoard server on TCP port 5253. We first try
 * an HTTP GET to port 80 (the web UI) to check reachability and scrape frame
 * status. If the HTTP probe fails, we attempt a basic TCP connect to the
 * DashBoard port as a reachability fallback.
 *
 * When the web UI is available, we parse the status page for useful data:
 * - Number of populated slots
 * - PSU status (redundant power)
 * - Frame temperature
 */
export class RossAdapter implements DeviceAdapter {
  manufacturer = 'ross' as const;

  async queryHealth(ip: string): Promise<DeviceQueryResult> {
    const warnings: string[] = [];
    const errors: string[] = [];
    let temperature = 0;
    let firmware: string | undefined;

    // Try HTTP web interface first (port 80)
    try {
      const res = await fetchWithTimeout(`http://${ip}/`, 3000, { method: 'GET' });
      const body = await res.text().catch(() => '');

      // Parse frame info from HTML if available
      const tempMatch = body.match(/temperature[:\s]*(\d+(?:\.\d+)?)\s*[°]?C/i);
      if (tempMatch) {
        temperature = parseFloat(tempMatch[1]);
        if (temperature > 45) warnings.push(`Frame temperature elevated: ${temperature}°C`);
        if (temperature > 55) errors.push(`Frame temperature critical: ${temperature}°C`);
      }

      const psuMatch = body.match(/PSU\s*(\d)[:\s]*(ok|fail|not\s*installed)/gi);
      if (psuMatch) {
        for (const m of psuMatch) {
          if (/fail/i.test(m)) errors.push(`${m.trim()}`);
        }
      }

      const slotMatch = body.match(/(\d+)\s*(?:of\s*\d+\s*)?slots?\s*populated/i);
      if (slotMatch) {
        firmware = `${slotMatch[1]} slots populated`;
      }

      const fwMatch = body.match(/firmware[:\s]*v?([\d.]+)/i);
      if (fwMatch) {
        firmware = firmware ? `${firmware} | FW ${fwMatch[1]}` : `FW ${fwMatch[1]}`;
      }

      const health: DeviceHealth = {
        temperature,
        uptime: 0,
        errors,
        warnings,
      };

      return { reachable: true, health, firmware };
    } catch {
      // HTTP failed — try DashBoard port 5253 as TCP fallback
    }

    // TCP probe to DashBoard port 5253 via HTTP connection attempt
    // (Node fetch to a non-HTTP port will fail, but connection refused vs timeout
    //  tells us if the device is reachable)
    try {
      await fetchWithTimeout(`http://${ip}:5253/`, 3000, { method: 'GET' });
      // If we somehow get a response, device is reachable
      const health: DeviceHealth = { temperature: 0, uptime: 0, errors: [], warnings: [] };
      return { reachable: true, health, firmware: 'DashBoard port 5253 responsive' };
    } catch (err) {
      // If it's a connection refused or parse error, the device is at least on the network
      // but not serving HTTP on that port. If it's a timeout, device is unreachable.
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('abort') || message.includes('timeout')) {
        return { reachable: false, health: null };
      }
      // Connection refused or protocol error means device is reachable but not HTTP on 5253
      // This is expected — DashBoard uses its own protocol
      const health: DeviceHealth = { temperature: 0, uptime: 0, errors: [], warnings: ['DashBoard protocol only — limited health data via HTTP'] };
      return { reachable: true, health };
    }
  }
}
