import { DeviceHealth } from '@/types';
import { DeviceAdapter, DeviceQueryResult } from './types';

const TIMEOUT_MS = 3000;

// ---------------------------------------------------------------------------
// AJA Kumo REST API types
//
// The AJA Kumo exposes its full configuration as a flat JSON object via:
//   GET http://{ip}/config
//
// Key fields we care about:
//   eParamID_NumberOfVideoInputs   — total input count (e.g. 32)
//   eParamID_NumberOfVideoOutputs  — total output count (e.g. 32)
//   eParamID_XPT_Destination{N}_Status — routed input index for output N
//   eParamID_Input{N}_SignalValid  — 1 if signal present on input N, 0 if not
//   eParamID_Input{N}_Label        — human label for input N
//   eParamID_Output{N}_Label       — human label for output N
// ---------------------------------------------------------------------------

interface AJAConfig {
  eParamID_NumberOfVideoInputs?: number;
  eParamID_NumberOfVideoOutputs?: number;
  // Crosspoint state — indexed by output number (1-based)
  [key: string]: unknown;
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

async function fetchAJAConfig(ip: string): Promise<AJAConfig | null> {
  try {
    const res = await fetchWithTimeout(`http://${ip}/config`);
    if (!res.ok) return null;
    return (await res.json()) as AJAConfig;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Helper — count inputs with an active signal
// ---------------------------------------------------------------------------

function countActiveSignals(config: AJAConfig, inputCount: number): number {
  let active = 0;
  for (let i = 1; i <= inputCount; i++) {
    const key = `eParamID_Input${i}_SignalValid`;
    const value = config[key];
    // AJA uses 1 (number) or "1" (string) for valid signal
    if (value === 1 || value === '1' || value === true) {
      active++;
    }
  }
  return active;
}

// ---------------------------------------------------------------------------
// AJA Adapter
// ---------------------------------------------------------------------------

export class AJAAdapter implements DeviceAdapter {
  manufacturer = 'aja' as const;

  async queryHealth(ip: string): Promise<DeviceQueryResult> {
    try {
      const config = await fetchAJAConfig(ip);

      if (!config) {
        return { reachable: false, health: null };
      }

      const numInputs = Number(config.eParamID_NumberOfVideoInputs ?? 0);
      const numOutputs = Number(config.eParamID_NumberOfVideoOutputs ?? 0);

      const errors: string[] = [];
      const warnings: string[] = [];

      // Count signals with valid lock across all inputs
      const activeSignals = numInputs > 0 ? countActiveSignals(config, numInputs) : 0;

      if (numInputs > 0 && activeSignals === 0) {
        warnings.push('No input signals detected on any port');
      } else if (numInputs > 0 && activeSignals < numInputs / 2) {
        warnings.push(`Only ${activeSignals} of ${numInputs} inputs have active signals`);
      }

      // Sanity-check crosspoint routing — look for outputs with no valid source
      if (numOutputs > 0) {
        let unrouted = 0;
        for (let o = 1; o <= numOutputs; o++) {
          const xptKey = `eParamID_XPT_Destination${o}_Status`;
          const routed = config[xptKey];
          // A value of 0 or -1 typically means no source connected
          if (routed === 0 || routed === -1 || routed === '0' || routed === '-1') {
            unrouted++;
          }
        }
        if (unrouted > 0) {
          warnings.push(`${unrouted} output${unrouted > 1 ? 's' : ''} have no routed source`);
        }
      }

      // AJA Kumo does not expose temperature or CPU metrics via REST.
      // We use activeSignals as a proxy for a "health score" in the uptime field
      // (uptime in seconds is not available either, so we leave it at 0).
      const health: DeviceHealth = {
        temperature: 0, // AJA Kumo does not expose temperature via its REST API
        uptime: 0,      // Not exposed via REST; would need SNMP or telnet for this
        errors,
        warnings,
      };

      return {
        reachable: true,
        health,
        // Surface the router size in the firmware field as useful metadata
        firmware: numInputs && numOutputs ? `${numInputs}x${numOutputs}` : undefined,
      };
    } catch {
      return { reachable: false, health: null };
    }
  }
}
