import { DeviceHealth } from '@/types';
import { DeviceAdapter, DeviceQueryResult } from './types';

const TIMEOUT_MS = 3000;

// ---------------------------------------------------------------------------
// AJA Kumo REST API types
//
// The AJA Kumo exposes parameters individually via:
//   GET http://{ip}/config?action=get&paramid={paramId}
//
// Each response returns { "value": "...", "value_name": "..." }.
//
// Key parameters:
//   eParamID_NumberOfSources           — total input count
//   eParamID_NumberOfDestinations      — total output count
//   eParamID_Temperature               — temperature in Celsius
//   eParamID_PSAlarm                   — power supply alarm (0=None, 1=Error)
//   eParamID_TemperatureAlarm          — over-temp alarm (0=None, 1=Over temp)
//   eParamID_ReferenceAlarm            — sync ref alarm (0=None, 1=No reference)
//   eParamID_DetectReferenceFormat     — detected sync reference format
//   eParamID_SWVersion                 — firmware version as 32-bit integer
//   eParamID_XPT_Destination{N}_Status — routed input index for output N
//   eParamID_Input{N}_SignalValid      — 1 if signal present on input N
// ---------------------------------------------------------------------------

interface AJAParamResult {
  value: string;
  value_name: string;
}

// ---------------------------------------------------------------------------
// Network helpers
// ---------------------------------------------------------------------------

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetch a single parameter from the AJA KUMO REST API.
 */
async function kumoGet(
  ip: string,
  paramId: string
): Promise<AJAParamResult | null> {
  try {
    const res = await fetchWithTimeout(
      `http://${ip}/config?action=get&paramid=${paramId}`
    );
    if (!res.ok) return null;
    return (await res.json()) as AJAParamResult;
  } catch {
    return null;
  }
}

/**
 * Decode a 32-bit integer firmware version into "major.minor.patch.build".
 */
function decodeFirmwareVersion(raw: string): string {
  const n = parseInt(raw, 10);
  if (Number.isNaN(n)) return raw;
  const major = (n >>> 24) & 0xff;
  const minor = (n >>> 16) & 0xff;
  const patch = (n >>> 8) & 0xff;
  const build = n & 0xff;
  return `${major}.${minor}.${patch}.${build}`;
}

// ---------------------------------------------------------------------------
// Helper — count inputs with an active signal
// ---------------------------------------------------------------------------

function countActiveSignals(
  ip: string,
  inputCount: number
): Promise<number> {
  // Query all SignalValid params in parallel, then count
  const promises: Promise<AJAParamResult | null>[] = [];
  for (let i = 1; i <= inputCount; i++) {
    promises.push(kumoGet(ip, `eParamID_Input${i}_SignalValid`));
  }
  return Promise.all(promises).then((results) => {
    let active = 0;
    for (const r of results) {
      if (r && (r.value === '1' || r.value === 'true')) {
        active++;
      }
    }
    return active;
  });
}

// ---------------------------------------------------------------------------
// AJA Adapter
// ---------------------------------------------------------------------------

export class AJAAdapter implements DeviceAdapter {
  manufacturer = 'aja' as const;

  async queryHealth(ip: string): Promise<DeviceQueryResult> {
    try {
      // 1. Query health parameters and matrix size in parallel
      const [
        tempResult,
        psAlarmResult,
        tempAlarmResult,
        refAlarmResult,
        refFormatResult,
        swVersionResult,
        inputCountResult,
        outputCountResult,
      ] = await Promise.all([
        kumoGet(ip, 'eParamID_Temperature'),
        kumoGet(ip, 'eParamID_PSAlarm'),
        kumoGet(ip, 'eParamID_TemperatureAlarm'),
        kumoGet(ip, 'eParamID_ReferenceAlarm'),
        kumoGet(ip, 'eParamID_DetectReferenceFormat'),
        kumoGet(ip, 'eParamID_SWVersion'),
        kumoGet(ip, 'eParamID_NumberOfSources'),
        kumoGet(ip, 'eParamID_NumberOfDestinations'),
      ]);

      // If we can't reach any parameter, the device is unreachable
      if (
        !tempResult &&
        !psAlarmResult &&
        !inputCountResult &&
        !outputCountResult
      ) {
        return { reachable: false, health: null };
      }

      const errors: string[] = [];
      const warnings: string[] = [];

      // 2. Temperature
      const temperature = tempResult ? parseInt(tempResult.value, 10) : 0;

      // 3. Power supply alarm
      if (psAlarmResult && psAlarmResult.value === '1') {
        errors.push('Power supply error detected');
      }

      // 4. Temperature alarm
      if (tempAlarmResult && tempAlarmResult.value !== '0') {
        errors.push('Over-temperature alarm');
      }

      // 5. Reference alarm
      if (refAlarmResult && refAlarmResult.value !== '0') {
        warnings.push('No valid sync reference signal');
      }

      // 6. Reference format (informational)
      if (refFormatResult?.value_name) {
        warnings.push(`Reference: ${refFormatResult.value_name}`);
      }

      // 7. Firmware version
      let firmware: string | undefined;
      if (swVersionResult?.value) {
        firmware = decodeFirmwareVersion(swVersionResult.value);
      }

      // 8. Signal detection (existing logic)
      const numInputs = inputCountResult
        ? parseInt(inputCountResult.value, 10)
        : 0;
      const numOutputs = outputCountResult
        ? parseInt(outputCountResult.value, 10)
        : 0;

      if (numInputs > 0) {
        const activeSignals = await countActiveSignals(ip, numInputs);
        if (activeSignals === 0) {
          warnings.push('No input signals detected on any port');
        } else if (activeSignals < numInputs / 2) {
          warnings.push(
            `Only ${activeSignals} of ${numInputs} inputs have active signals`
          );
        }
      }

      // Check for unrouted outputs
      if (numOutputs > 0) {
        const routePromises: Promise<AJAParamResult | null>[] = [];
        for (let o = 1; o <= numOutputs; o++) {
          routePromises.push(
            kumoGet(ip, `eParamID_XPT_Destination${o}_Status`)
          );
        }
        const routeResults = await Promise.all(routePromises);
        let unrouted = 0;
        for (const r of routeResults) {
          if (
            r &&
            (r.value === '0' || r.value === '-1')
          ) {
            unrouted++;
          }
        }
        if (unrouted > 0) {
          warnings.push(
            `${unrouted} output${unrouted > 1 ? 's' : ''} have no routed source`
          );
        }
      }

      const health: DeviceHealth = {
        temperature: Number.isNaN(temperature) ? 0 : temperature,
        uptime: 0, // Not exposed via AJA KUMO REST API
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
