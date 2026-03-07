import { DeviceHealth } from '@/types';
import { DeviceAdapter, DeviceQueryResult } from './types';
import { fetchWithTimeout } from '@/lib/utils';

/**
 * Brainstorm Electronics adapter for SR-112 and DXD-8 devices.
 *
 * The SR-112 (timecode distripalyzer) and DXD-8 (master clock) both expose
 * a web interface on port 80. We attempt to scrape status data from their
 * status pages. If the page structure is not as expected, we fall back to
 * basic reachability (any HTTP response = online).
 */
export class BrainstormAdapter implements DeviceAdapter {
  manufacturer = 'brainstorm' as const;

  async queryHealth(ip: string): Promise<DeviceQueryResult> {
    try {
      // Try the root page first — Brainstorm devices serve a status/config UI
      let res: Response;
      try {
        res = await fetchWithTimeout(`http://${ip}/`, 3000, { method: 'GET' });
      } catch {
        return { reachable: false, health: null };
      }

      const body = await res.text().catch(() => '');
      const warnings: string[] = [];
      const errors: string[] = [];
      let firmware: string | undefined;

      // Attempt to parse known status patterns from the HTML
      // Brainstorm web UIs typically display sync lock status, timecode, and frequency
      const syncMatch = body.match(/sync[:\s]*(locked|unlocked|free[\s-]*run)/i);
      if (syncMatch) {
        const syncState = syncMatch[1].toLowerCase();
        if (syncState === 'unlocked' || syncState.includes('free')) {
          warnings.push(`Sync status: ${syncMatch[1]}`);
        }
      }

      const tcMatch = body.match(/timecode[:\s]*(\d{2}:\d{2}:\d{2}[:.]\d{2})/i);
      if (tcMatch) {
        // Timecode is running — include as metadata in firmware field
        firmware = `TC: ${tcMatch[1]}`;
      }

      const freqMatch = body.match(/(\d+(?:\.\d+)?)\s*(?:kHz|Hz)/i);
      if (freqMatch) {
        const freqStr = freqMatch[0];
        firmware = firmware ? `${firmware} | ${freqStr}` : freqStr;
      }

      const fwMatch = body.match(/firmware[:\s]*v?([\d.]+)/i);
      if (fwMatch) {
        firmware = firmware ? `${firmware} | FW ${fwMatch[1]}` : `FW ${fwMatch[1]}`;
      }

      const health: DeviceHealth = {
        temperature: 0,
        uptime: 0,
        errors,
        warnings,
      };

      return { reachable: true, health, firmware };
    } catch {
      return { reachable: false, health: null };
    }
  }
}
