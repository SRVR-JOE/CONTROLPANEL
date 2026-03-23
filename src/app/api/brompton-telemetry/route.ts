import { NextRequest, NextResponse } from 'next/server';
import type { BromptonTelemetry } from '@/types';
import { isAllowedTarget } from '@/lib/validateIp';
import { getCorsHeadersFromRequest } from '@/lib/cors';
import { fetchWithTimeout } from '@/lib/utils';

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetchWithTimeout(url, 3000);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dig(obj: any, ...keys: string[]): any {
  let cur = obj;
  for (const k of keys) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = cur[k];
  }
  return cur;
}

function parseTelemetry(api: Record<string, unknown>): BromptonTelemetry {
  const sys = dig(api, 'system') ?? {};
  const temp = dig(sys, 'temperature') ?? {};
  const fan = dig(sys, 'fan') ?? {};
  const inp = dig(api, 'input') ?? {};
  const activeSource = dig(inp, 'active', 'source') ?? {};
  const portType = activeSource['port-type'] ?? 'hdmi';
  const portIdx = String((activeSource['port-number'] ?? 1) - 1);
  const portData = dig(inp, 'ports', portType, portIdx) ?? {};
  const meta = dig(portData, 'meta-data') ?? {};
  const controls = dig(portData, 'controls') ?? {};
  const procAmp = dig(portData, 'proc-amp') ?? {};
  const out = dig(api, 'output') ?? {};
  const gc = dig(out, 'global-colour') ?? {};
  const net = dig(out, 'network') ?? {};
  const genlock = dig(net, 'genlock') ?? {};
  const failover = dig(net, 'failover') ?? {};
  const shuttersync = dig(net, 'shuttersync') ?? {};
  const hm = dig(net, 'hidden-markers') ?? {};
  const st = dig(net, 'startracker') ?? {};
  const ovr = dig(api, 'override') ?? {};
  const proc = dig(api, 'processing') ?? {};
  const devs = dig(api, 'devices') ?? {};
  const stats = dig(devs, 'statistics') ?? {};
  const items = dig(devs, 'items') ?? {};
  const presets = dig(api, 'presets', 'active') ?? {};

  // Panel types from output dynacal keys
  const dynacalKeys = Object.keys(dig(out, 'dynacal') ?? {});

  // Build panel items list
  const panelItems = Object.entries(items).map(([serial, data]: [string, unknown]) => {
    const d = data as Record<string, string> | undefined;
    return { serial, type: d?.type ?? 'unknown', firmware: d?.firmware ?? 'unknown' };
  });

  return {
    processorName: sys['processor-name'] ?? '',
    processorType: sys['processor-type'] ?? '',
    serialNumber: sys['serial-number'] ?? '',
    softwareVersion: sys['software-version'] ?? '',
    uptime: sys.uptime ?? '',
    currentDateTime: sys['current-date-time'] ?? '',
    projectName: dig(api, 'project', 'name') ?? '',

    temperatures: {
      ambient: temp.ambient ?? 0,
      cpu: temp.cpu ?? 0,
      gpu: temp.gpu ?? 0,
      fpga: temp.fpga ?? 0,
      psu: temp.psu ?? 0,
      main: temp.main ?? 0,
      ethernet: {
        copper: { a: dig(temp, 'ethernet', 'copper', 'a') ?? 0, b: dig(temp, 'ethernet', 'copper', 'b') ?? 0 },
        sfp: {
          a: dig(temp, 'ethernet', 'sfp', 'a') ?? 0,
          b: dig(temp, 'ethernet', 'sfp', 'b') ?? 0,
          c: dig(temp, 'ethernet', 'sfp', 'c') ?? 0,
          d: dig(temp, 'ethernet', 'sfp', 'd') ?? 0,
        },
      },
    },

    fans: {
      case1: { speed: dig(fan, 'case', 'one', 'speed') ?? 0, status: dig(fan, 'case', 'one', 'status') ?? false },
      case2: { speed: dig(fan, 'case', 'two', 'speed') ?? 0, status: dig(fan, 'case', 'two', 'status') ?? false },
      fpga: { speed: dig(fan, 'fpga', 'speed') ?? 0, status: dig(fan, 'fpga', 'status') ?? false },
    },

    input: {
      activeSource: { portType, portNumber: activeSource['port-number'] ?? 1 },
      metadata: {
        bitDepth: meta['bit-depth'] ?? 0,
        refreshRate: meta['refresh-rate'] ?? 0,
        resolution: { width: dig(meta, 'resolution', 'width') ?? 0, height: dig(meta, 'resolution', 'height') ?? 0 },
        sampling: meta.sampling ?? '',
        hdr: dig(meta, 'hdr', 'format') ?? 'unknown',
      },
      controls: {
        colourSpace: dig(controls, 'colour-space', 'colour') ?? '',
        hdmiColourFormat: controls['hdmi-colour-format'] ?? '',
        quantisationRange: controls['quantisation-range'] ?? '',
        hdrFormat: dig(controls, 'hdr', 'format') ?? '',
      },
      procAmp: {
        blackLevel: procAmp['black-level'] ?? 100,
        contrast: procAmp.contrast ?? 100,
        hue: procAmp.hue ?? 0,
        saturation: procAmp.saturation ?? 100,
        highlightRGB: dig(procAmp, 'highlight') ?? { red: 100, green: 100, blue: 100 },
        shadowRGB: dig(procAmp, 'shadow') ?? { red: 100, green: 100, blue: 100 },
      },
    },

    output: {
      brightness: gc.brightness ?? 0,
      brightnessLimit: { enabled: dig(gc, 'brightness-limit', 'enabled') ?? false, value: dig(gc, 'brightness-limit', 'value') ?? 10000 },
      colourTemperature: gc['colour-temperature'] ?? 6500,
      gamma: gc.gamma ?? 2.2,
      gains: gc.gains ?? { red: 100, green: 100, blue: 100, intensity: 100 },
      darkMagic: dig(gc, 'dark-magic', 'enabled') ?? false,
      pureTone: dig(gc, 'puretone', 'enabled') ?? false,
      extendedBitDepth: dig(gc, 'extended-bit-depth', 'enabled') ?? false,
      overdrive: dig(gc, 'overdrive', 'enabled') ?? false,
      dynacalHighlightOutOfGamut: dig(gc, 'dynacal', 'highlight-out-of-gamut-pixels-enabled') ?? false,
      dynacalHighlightOverbright: dig(gc, 'dynacal', 'highlight-overbright-pixels-enabled') ?? false,
    },

    network: {
      bitDepth: net['bit-depth'] ?? 0,
      frameRateMultiplier: net['frame-rate-multiplier'] ?? 1,
      genlock: {
        source: genlock.source ?? '',
        internalRate: genlock['internal-rate'] ?? 0,
        phaseOffset: {
          mode: dig(genlock, 'phase-offset', 'mode') ?? 'none',
          angle: dig(genlock, 'phase-offset', 'angle') ?? 0,
          fraction: dig(genlock, 'phase-offset', 'fraction') ?? 0,
          lines: dig(genlock, 'phase-offset', 'absolute', 'lines') ?? 0,
          pixels: dig(genlock, 'phase-offset', 'absolute', 'pixels') ?? 0,
        },
      },
      cableRedundancy: {
        loop1State: dig(net, 'cable-redundancy', 'loops', '1', 'state') ?? '',
        loop2State: dig(net, 'cable-redundancy', 'loops', '2', 'state') ?? '',
      },
      failover: {
        enabled: dig(failover, 'settings', 'enabled') ?? false,
        role: dig(failover, 'settings', 'role') ?? '',
        isActive: dig(failover, 'state', 'is-active') ?? false,
        isPartnerPresent: dig(failover, 'state', 'is-partner-present') ?? false,
        partnerName: dig(failover, 'state', 'partner-name') ?? '',
      },
      frameRemapping: { enabled: dig(net, 'frame-remapping', 'enabled') ?? false },
      shutterSync: {
        mode: shuttersync.mode ?? 'none',
        shutterAngle: dig(shuttersync, 'angle-settings', 'shutter-angle') ?? 180,
        darkTime: shuttersync['dark-time'] ?? 0,
        sensorType: shuttersync['sensor-type'] ?? '',
        viewer: shuttersync.viewer ?? '',
      },
      hiddenMarkers: { enabled: hm.enabled ?? false, mode: hm.mode ?? 'none' },
      starTracker: {
        enabled: st.enabled ?? false,
        red: dig(st, 'red', 'enabled') ?? false,
        green: dig(st, 'green', 'enabled') ?? false,
        blue: dig(st, 'blue', 'enabled') ?? false,
      },
    },

    override: {
      blackout: { enabled: dig(ovr, 'blackout', 'enabled') ?? false, fadeTime: dig(ovr, 'blackout', 'fade-time') ?? 0 },
      freeze: { enabled: dig(ovr, 'freeze', 'enabled') ?? false },
      testPattern: { enabled: dig(ovr, 'test-pattern', 'enabled') ?? false, type: dig(ovr, 'test-pattern', 'type') ?? '' },
    },

    processing: {
      lut3d: { enabled: dig(proc, '3d-lut', 'enabled') ?? false, filename: dig(proc, '3d-lut', 'filename') ?? '', strength: dig(proc, '3d-lut', 'strength') ?? 100 },
      colourCorrect: { enabled: dig(proc, 'colour-correct', 'enabled') ?? false },
      colourReplace: { enabled: dig(proc, 'colour-replace', 'enabled') ?? false, method: dig(proc, 'colour-replace', 'method') ?? '', strength: dig(proc, 'colour-replace', 'strength') ?? 100 },
      curves: { enabled: dig(proc, 'curves', 'enabled') ?? false },
      osca: { moduleCorrection: dig(proc, 'osca', 'module-correction-enabled') ?? false, seamCorrection: dig(proc, 'osca', 'seam-correction-enabled') ?? false },
      scaler: { enabled: dig(proc, 'scaler', 'enabled') ?? false },
    },

    panels: {
      onlineCount: stats['online-count'] ?? 0,
      errorCount: stats['error-count'] ?? 0,
      associatedCount: stats['associated-count'] ?? 0,
      items: panelItems,
    },

    activePreset: { name: presets.name ?? '', number: presets.number ?? '0' },
    panelTypes: dynacalKeys,
    fetchedAt: new Date().toISOString(),
  };
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: getCorsHeadersFromRequest(request) });
}

export async function GET(request: NextRequest) {
  const corsHeaders = getCorsHeadersFromRequest(request);
  const ip = request.nextUrl.searchParams.get('ip');

  if (!ip || !isAllowedTarget(ip)) {
    return NextResponse.json({ error: 'Missing or invalid ip parameter' }, { status: 400, headers: corsHeaders });
  }

  const apiTree = await fetchJson<{ api: Record<string, unknown> }>(`http://${ip}/api/`);

  if (!apiTree?.api) {
    return NextResponse.json({ error: 'Device unreachable or invalid response' }, { status: 502, headers: corsHeaders });
  }

  const telemetry = parseTelemetry(apiTree.api);
  return NextResponse.json(telemetry, { headers: corsHeaders });
}
