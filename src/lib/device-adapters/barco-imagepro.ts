import { DeviceHealth } from '@/types';
import { DeviceAdapter, DeviceQueryResult } from './types';
import { fetchWithTimeout } from '@/lib/utils';

/**
 * Barco ImagePro 4K adapter.
 *
 * The ImagePro 4K series supports a web interface and may expose REST API
 * endpoints. We probe several known paths to extract signal status,
 * resolution, and temperature data. Falls back to basic reachability
 * if no API is found.
 */

const API_PATHS = [
  '/api/status',
  '/cgi-bin/status',
  '/status',
  '/',
] as const;

export class BarcoImageProAdapter implements DeviceAdapter {
  manufacturer = 'barco' as const;

  async queryHealth(ip: string): Promise<DeviceQueryResult> {
    const warnings: string[] = [];
    const errors: string[] = [];
    let temperature = 0;
    let firmware: string | undefined;

    for (const path of API_PATHS) {
      try {
        const res = await fetchWithTimeout(`http://${ip}${path}`, 3000, { method: 'GET' });
        const body = await res.text().catch(() => '');

        // Try JSON parsing first (REST API response)
        try {
          const data = JSON.parse(body) as Record<string, unknown>;

          // Extract temperature
          const temp = data.temperature ?? data.temp ?? data.systemTemperature;
          if (typeof temp === 'number') {
            temperature = temp;
            if (temperature > 50) warnings.push(`Temperature elevated: ${temperature}°C`);
            if (temperature > 65) errors.push(`Temperature critical: ${temperature}°C`);
          }

          // Extract input signal info
          const inputSignal = data.inputSignal ?? data.input_signal ?? data.inputStatus;
          if (inputSignal === false || inputSignal === 'none' || inputSignal === 'no signal') {
            warnings.push('No input signal detected');
          }

          // Extract resolution
          const resolution = data.inputResolution ?? data.resolution ?? data.outputResolution;
          if (typeof resolution === 'string') {
            firmware = resolution;
          }

          // Extract firmware version
          const fw = data.firmwareVersion ?? data.firmware ?? data.version;
          if (typeof fw === 'string') {
            firmware = firmware ? `${firmware} | FW ${fw}` : `FW ${fw}`;
          }

          const health: DeviceHealth = { temperature, uptime: 0, errors, warnings };
          return { reachable: true, health, firmware };
        } catch {
          // Not JSON — try HTML parsing
        }

        // HTML parsing fallback
        const tempMatch = body.match(/temperature[:\s]*(\d+(?:\.\d+)?)\s*[°]?C/i);
        if (tempMatch) {
          temperature = parseFloat(tempMatch[1]);
          if (temperature > 50) warnings.push(`Temperature elevated: ${temperature}°C`);
          if (temperature > 65) errors.push(`Temperature critical: ${temperature}°C`);
        }

        const resMatch = body.match(/(\d{3,4})\s*x\s*(\d{3,4})/i);
        if (resMatch) {
          firmware = `${resMatch[1]}x${resMatch[2]}`;
        }

        const signalMatch = body.match(/input[:\s]*(no\s*signal|active|present|none)/i);
        if (signalMatch && /no|none/i.test(signalMatch[1])) {
          warnings.push('No input signal detected');
        }

        const fwMatch = body.match(/firmware[:\s]*v?([\d.]+)/i);
        if (fwMatch) {
          firmware = firmware ? `${firmware} | FW ${fwMatch[1]}` : `FW ${fwMatch[1]}`;
        }

        const health: DeviceHealth = { temperature, uptime: 0, errors, warnings };
        return { reachable: true, health, firmware };
      } catch {
        // This path failed, try next
        continue;
      }
    }

    // All paths failed — device is unreachable
    return { reachable: false, health: null };
  }
}
