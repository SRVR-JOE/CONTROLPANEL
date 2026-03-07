/**
 * Tests for the updated BromptonAdapter targeting the real Tessera SX40 API.
 *
 * The live SX40 at 192.168.100.80 returns:
 *   GET /api/system/temperature/ambient  →  { "ambient": 33.125 }
 *   GET /api/system/temperature/cpu      →  { "cpu": 44.375 }
 *   GET /api/system/temperature/gpu      →  { "gpu": 44 }   (note: key is "gpu")
 *   GET /api/system/uptime              →  { "uptime": "28m 28s" }  (STRING)
 *   GET /api/system/temperature         →  { temperature: { ambient, cpu, gpu, fpga, psu, main, ethernet } }
 *   GET /api/system                     →  { fan: { case: { one, two }, fpga }, serial-number, software-version, ... }
 *   GET /api/system/software-version    →  { "software-version": "3.5.2" }
 *
 * All network calls are mocked — no real HTTP requests.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BromptonAdapter } from '../brompton';

const mockFetch = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
  mockFetch.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

function makeResponse(body: unknown, status = 200): Response {
  const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ 'Content-Type': 'application/json' }),
    json: async () => JSON.parse(bodyStr),
    text: async () => bodyStr,
    body: null,
    bodyUsed: false,
    redirected: false,
    statusText: status === 200 ? 'OK' : 'Error',
    type: 'basic',
    url: '',
    arrayBuffer: async () => new ArrayBuffer(0),
    blob: async () => new Blob([bodyStr]),
    formData: async () => new FormData(),
    clone: function () { return this; },
  } as unknown as Response;
}

function makeNetworkError(message = 'fetch failed'): Error {
  return new Error(message);
}

// The adapter fires 11 parallel fetches via Promise.allSettled:
//  0: /api/system/temperature/ambient
//  1: /api/system/temperature/cpu
//  2: /api/system/temperature/gpu
//  3: /api/system/uptime
//  4: /api/system/temperature       (full temp object)
//  5: /api/system                   (full system with fans)
//  6: /api/system/software-version
//  7: /api/devices/statistics/online-count
//  8: /api/devices/statistics/error-count
//  9: /api/devices                  (panel device list)
// 10: /api/input/active/source      (active input source)
// Then a follow-up fetch for input metadata if active source is available:
// 11: /api/input/ports/{type}/{number}/meta-data

/** Helper: mock all 11 parallel endpoints + follow-up metadata with live-like SX40 data. */
function mockAllEndpoints(overrides: {
  ambient?: number;
  cpu?: number;
  gpu?: number;
  uptime?: string;
  fpga?: number;
  psu?: number;
  main?: number;
  caseFan1?: number;
  caseFan2?: number;
  fpgaFan?: number;
  firmware?: string;
  panelOnline?: number;
  panelErrors?: number;
  skipDevices?: boolean;
  skipActiveSource?: boolean;
} = {}) {
  const ambient = overrides.ambient ?? 33.125;
  const cpu = overrides.cpu ?? 44.375;
  const gpu = overrides.gpu ?? 44;
  const uptime = overrides.uptime ?? '28m 28s';
  const fpga = overrides.fpga ?? 51.75;
  const psu = overrides.psu ?? 46.25;
  const main = overrides.main ?? 39.875;
  const caseFan1 = overrides.caseFan1 ?? 1890;
  const caseFan2 = overrides.caseFan2 ?? 1890;
  const fpgaFan = overrides.fpgaFan ?? 6540;
  const firmware = overrides.firmware ?? '3.5.2';
  const panelOnline = overrides.panelOnline ?? 48;
  const panelErrors = overrides.panelErrors ?? 0;

  mockFetch
    .mockResolvedValueOnce(makeResponse({ ambient }))                // 0: ambient
    .mockResolvedValueOnce(makeResponse({ cpu }))                    // 1: cpu
    .mockResolvedValueOnce(makeResponse({ gpu }))                    // 2: gpu
    .mockResolvedValueOnce(makeResponse({ uptime }))                 // 3: uptime string
    .mockResolvedValueOnce(makeResponse({                            // 4: full temperature
      temperature: {
        ambient, cpu, gpu, fpga, psu, main,
        ethernet: { copper: { a: 35, b: 39 }, sfp: { a: 36, b: 37, c: 38, d: 38 } },
      },
    }))
    .mockResolvedValueOnce(makeResponse({                            // 5: system
      system: {
        fan: {
          case: { one: { speed: caseFan1, status: true }, two: { speed: caseFan2, status: true } },
          fpga: { speed: fpgaFan, status: true },
        },
        'serial-number': '022188',
        'software-version': firmware,
        'processor-name': 'LED A',
        'processor-type': 'sx40',
      },
    }))
    .mockResolvedValueOnce(makeResponse({ 'software-version': firmware })) // 6: firmware
    .mockResolvedValueOnce(makeResponse({ 'online-count': panelOnline }))  // 7: panel online
    .mockResolvedValueOnce(makeResponse({ 'error-count': panelErrors }));  // 8: panel errors

  // 9: /api/devices
  if (overrides.skipDevices) {
    mockFetch.mockRejectedValueOnce(makeNetworkError());
  } else {
    mockFetch.mockResolvedValueOnce(makeResponse({
      devices: {
        items: {
          '014318': { firmware: 'unknown', type: 'XD' },
          '014319': { firmware: 'unknown', type: 'XD' },
        },
        statistics: {},
      },
    }));
  }

  // 10: /api/input/active/source
  if (overrides.skipActiveSource) {
    mockFetch.mockRejectedValueOnce(makeNetworkError());
  } else {
    mockFetch.mockResolvedValueOnce(makeResponse({
      source: { 'port-type': 'hdmi', 'port-number': 1 },
    }));
    // 11: follow-up /api/input/ports/hdmi/0/meta-data
    mockFetch.mockResolvedValueOnce(makeResponse({
      'meta-data': {
        'bit-depth': 8,
        'refresh-rate': 60,
        resolution: { height: 2160, width: 3840 },
        sampling: 'rgb',
      },
    }));
  }
}

describe('BromptonAdapter (SX40 live API)', () => {
  const adapter = new BromptonAdapter();
  const ip = '192.168.100.80';

  it('has manufacturer = brompton', () => {
    expect(adapter.manufacturer).toBe('brompton');
  });

  // ---------------------------------------------------------------------------
  // Happy path — all endpoints respond with live-like data
  // ---------------------------------------------------------------------------
  it('happy path: returns full health from SX40 endpoints', async () => {
    mockAllEndpoints();

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(true);
    expect(result.health).not.toBeNull();
    expect(result.health!.temperature).toBe(33.125); // ambient
    expect(result.health!.gpuTemp).toBe(44);
    expect(result.health!.fanSpeed).toBe(1890); // max of case fans
    expect(result.health!.errors).toHaveLength(0);
    expect(result.health!.warnings).toHaveLength(0);
    expect(result.firmware).toBe('3.5.2');
  });

  // ---------------------------------------------------------------------------
  // Uptime string parsing
  // ---------------------------------------------------------------------------
  it('parses uptime string "28m 28s" into 1708 seconds', async () => {
    mockAllEndpoints({ uptime: '28m 28s' });

    const result = await adapter.queryHealth(ip);

    expect(result.health!.uptime).toBe(28 * 60 + 28); // 1708
  });

  it('parses uptime string "2h 15m 30s"', async () => {
    mockAllEndpoints({ uptime: '2h 15m 30s' });

    const result = await adapter.queryHealth(ip);

    expect(result.health!.uptime).toBe(2 * 3600 + 15 * 60 + 30);
  });

  it('parses uptime string "1d 3h"', async () => {
    mockAllEndpoints({ uptime: '1d 3h' });

    const result = await adapter.queryHealth(ip);

    expect(result.health!.uptime).toBe(86400 + 3 * 3600);
  });

  it('parses uptime string "5d 2h 30m 10s"', async () => {
    mockAllEndpoints({ uptime: '5d 2h 30m 10s' });

    const result = await adapter.queryHealth(ip);

    expect(result.health!.uptime).toBe(5 * 86400 + 2 * 3600 + 30 * 60 + 10);
  });

  // ---------------------------------------------------------------------------
  // Temperature thresholds
  // ---------------------------------------------------------------------------
  it('warns when CPU > 70°C', async () => {
    mockAllEndpoints({ cpu: 75 });

    const result = await adapter.queryHealth(ip);

    expect(result.health!.warnings.some(w => w.includes('CPU temperature elevated'))).toBe(true);
    expect(result.health!.errors).toHaveLength(0);
  });

  it('errors when CPU > 80°C', async () => {
    mockAllEndpoints({ cpu: 85 });

    const result = await adapter.queryHealth(ip);

    expect(result.health!.errors.some(e => e.includes('CPU temperature critically high'))).toBe(true);
  });

  it('warns when GPU > 75°C', async () => {
    mockAllEndpoints({ gpu: 80 });

    const result = await adapter.queryHealth(ip);

    expect(result.health!.warnings.some(w => w.includes('GPU temperature elevated'))).toBe(true);
  });

  it('errors when GPU > 85°C', async () => {
    mockAllEndpoints({ gpu: 90 });

    const result = await adapter.queryHealth(ip);

    expect(result.health!.errors.some(e => e.includes('GPU temperature critically high'))).toBe(true);
  });

  it('warns when FPGA > 70°C', async () => {
    mockAllEndpoints({ fpga: 75 });

    const result = await adapter.queryHealth(ip);

    expect(result.health!.warnings.some(w => w.includes('FPGA temperature elevated'))).toBe(true);
  });

  it('errors when FPGA > 80°C', async () => {
    mockAllEndpoints({ fpga: 85 });

    const result = await adapter.queryHealth(ip);

    expect(result.health!.errors.some(e => e.includes('FPGA temperature critically high'))).toBe(true);
  });

  it('warns when PSU > 55°C', async () => {
    mockAllEndpoints({ psu: 60 });

    const result = await adapter.queryHealth(ip);

    expect(result.health!.warnings.some(w => w.includes('PSU temperature elevated'))).toBe(true);
  });

  it('errors when PSU > 65°C', async () => {
    mockAllEndpoints({ psu: 70 });

    const result = await adapter.queryHealth(ip);

    expect(result.health!.errors.some(e => e.includes('PSU temperature critically high'))).toBe(true);
  });

  it('warns when ambient > 40°C', async () => {
    mockAllEndpoints({ ambient: 45 });

    const result = await adapter.queryHealth(ip);

    expect(result.health!.warnings.some(w => w.includes('Ambient temperature elevated'))).toBe(true);
  });

  it('errors when ambient > 50°C', async () => {
    mockAllEndpoints({ ambient: 55 });

    const result = await adapter.queryHealth(ip);

    expect(result.health!.errors.some(e => e.includes('Ambient temperature critically high'))).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // Fan speed warnings
  // ---------------------------------------------------------------------------
  it('warns when case fan speed is low (< 500 RPM)', async () => {
    mockAllEndpoints({ caseFan1: 300, caseFan2: 300 });

    const result = await adapter.queryHealth(ip);

    expect(result.health!.warnings.some(w => w.includes('Fan speed low'))).toBe(true);
  });

  it('warns when FPGA fan speed is low (< 500 RPM)', async () => {
    mockAllEndpoints({ fpgaFan: 200 });

    const result = await adapter.queryHealth(ip);

    expect(result.health!.warnings.some(w => w.includes('FPGA fan speed low'))).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // cpuTempToUsage mapping
  // ---------------------------------------------------------------------------
  it('maps CPU temp to usage percentage', async () => {
    mockAllEndpoints({ cpu: 62.5 }); // midpoint of 40-85 = 50%

    const result = await adapter.queryHealth(ip);

    expect(result.health!.cpuUsage).toBe(50);
  });

  // ---------------------------------------------------------------------------
  // Partial failure resilience
  // ---------------------------------------------------------------------------
  it('returns reachable when only ambient endpoint responds', async () => {
    mockFetch
      .mockResolvedValueOnce(makeResponse({ ambient: 30 }))  // ambient OK
      .mockRejectedValueOnce(makeNetworkError())               // cpu fails
      .mockRejectedValueOnce(makeNetworkError())               // gpu fails
      .mockRejectedValueOnce(makeNetworkError())               // uptime fails
      .mockRejectedValueOnce(makeNetworkError())               // temperature fails
      .mockRejectedValueOnce(makeNetworkError())               // system fails
      .mockRejectedValueOnce(makeNetworkError())               // firmware fails
      .mockRejectedValueOnce(makeNetworkError())               // panel online fails
      .mockRejectedValueOnce(makeNetworkError())               // panel errors fails
      .mockRejectedValueOnce(makeNetworkError())               // devices fails
      .mockRejectedValueOnce(makeNetworkError());              // active source fails

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(true);
    expect(result.health!.temperature).toBe(30);
  });

  it('returns unreachable when all 7 endpoints fail', async () => {
    mockFetch.mockRejectedValue(makeNetworkError());

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(false);
    expect(result.health).toBeNull();
  });

  it('returns unreachable when all endpoints return 404', async () => {
    for (let i = 0; i < 11; i++) {
      mockFetch.mockResolvedValueOnce(makeResponse({ 'response-code': 'Path not found' }, 404));
    }

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(false);
    expect(result.health).toBeNull();
  });

  // ---------------------------------------------------------------------------
  // Firmware from fallback (system endpoint)
  // ---------------------------------------------------------------------------
  it('gets firmware from /api/system when /api/system/software-version fails', async () => {
    mockFetch
      .mockResolvedValueOnce(makeResponse({ ambient: 33 }))
      .mockResolvedValueOnce(makeResponse({ cpu: 44 }))
      .mockResolvedValueOnce(makeResponse({ gpu: 44 }))
      .mockResolvedValueOnce(makeResponse({ uptime: '1h 0m' }))
      .mockResolvedValueOnce(makeResponse({ temperature: { ambient: 33, cpu: 44, gpu: 44, fpga: 50, psu: 45, main: 39, ethernet: { copper: { a: 35, b: 39 }, sfp: { a: 36, b: 37, c: 38, d: 38 } } } }))
      .mockResolvedValueOnce(makeResponse({ system: { fan: { case: { one: { speed: 1890 }, two: { speed: 1890 } }, fpga: { speed: 6500 } }, 'software-version': '3.5.2' } }))
      .mockRejectedValueOnce(makeNetworkError()) // firmware endpoint fails
      .mockResolvedValueOnce(makeResponse({ 'online-count': 48 }))
      .mockResolvedValueOnce(makeResponse({ 'error-count': 0 }))
      .mockRejectedValueOnce(makeNetworkError()) // devices fails
      .mockRejectedValueOnce(makeNetworkError()); // active source fails

    const result = await adapter.queryHealth(ip);

    expect(result.firmware).toBe('3.5.2');
  });

  // ---------------------------------------------------------------------------
  // Correct fetch URLs
  // ---------------------------------------------------------------------------
  it('calls the correct SX40 API endpoints', async () => {
    mockAllEndpoints();

    await adapter.queryHealth(ip);

    const urls = mockFetch.mock.calls.map(c => {
      // The first arg to fetch could be a string or Request
      const firstArg = c[0];
      return typeof firstArg === 'string' ? firstArg : (firstArg as Request).url;
    });

    expect(urls).toContain(`http://${ip}/api/system/temperature/ambient`);
    expect(urls).toContain(`http://${ip}/api/system/temperature/cpu`);
    expect(urls).toContain(`http://${ip}/api/system/temperature/gpu`);
    expect(urls).toContain(`http://${ip}/api/system/uptime`);
    expect(urls).toContain(`http://${ip}/api/system/temperature`);
    expect(urls).toContain(`http://${ip}/api/system`);
    expect(urls).toContain(`http://${ip}/api/system/software-version`);
    expect(urls).toContain(`http://${ip}/api/devices/statistics/online-count`);
    expect(urls).toContain(`http://${ip}/api/devices/statistics/error-count`);
    expect(urls).toContain(`http://${ip}/api/devices`);
    expect(urls).toContain(`http://${ip}/api/input/active/source`);
    expect(urls).toContain(`http://${ip}/api/input/ports/hdmi/0/meta-data`);
    expect(urls).toHaveLength(12); // 11 parallel + 1 follow-up metadata
  });

  // ---------------------------------------------------------------------------
  // Multiple threshold violations at once
  // ---------------------------------------------------------------------------
  it('reports multiple warnings/errors simultaneously', async () => {
    mockAllEndpoints({
      cpu: 85,       // error
      gpu: 90,       // error
      fpga: 75,      // warning
      psu: 60,       // warning
      ambient: 45,   // warning
      caseFan1: 300,  // warning
      caseFan2: 300,
    });

    const result = await adapter.queryHealth(ip);

    expect(result.health!.errors.length).toBeGreaterThanOrEqual(2);  // CPU + GPU critical
    expect(result.health!.warnings.length).toBeGreaterThanOrEqual(3); // FPGA + PSU + ambient + fan
  });

  // ---------------------------------------------------------------------------
  // Extended details
  // ---------------------------------------------------------------------------
  it('returns ethernet temperatures in details', async () => {
    mockAllEndpoints();

    const result = await adapter.queryHealth(ip);

    expect(result.details?.ethernetTemperatures).toEqual({
      copper: { a: 35, b: 39 },
      sfp: { a: 36, b: 37, c: 38, d: 38 },
    });
  });

  it('returns panel device count and types in details', async () => {
    mockAllEndpoints();

    const result = await adapter.queryHealth(ip);

    expect(result.details?.panelDeviceCount).toBe(2);
    expect(result.details?.panelDeviceTypes).toEqual(['XD']);
  });

  it('returns processor info in details', async () => {
    mockAllEndpoints();

    const result = await adapter.queryHealth(ip);

    expect(result.details?.processorName).toBe('LED A');
    expect(result.details?.processorType).toBe('sx40');
    expect(result.details?.serialNumber).toBe('022188');
  });

  it('returns input source and metadata in details', async () => {
    mockAllEndpoints();

    const result = await adapter.queryHealth(ip);

    expect(result.details?.inputSource).toEqual({
      portType: 'hdmi',
      portNumber: 1,
    });
    expect(result.details?.inputMetadata).toEqual({
      bitDepth: 8,
      refreshRate: 60,
      resolution: { width: 3840, height: 2160 },
      sampling: 'rgb',
    });
  });

  it('omits input metadata when active source endpoint fails', async () => {
    mockAllEndpoints({ skipActiveSource: true });

    const result = await adapter.queryHealth(ip);

    expect(result.details?.inputSource).toBeUndefined();
    expect(result.details?.inputMetadata).toBeUndefined();
  });

  it('omits panel device info when devices endpoint fails', async () => {
    mockAllEndpoints({ skipDevices: true });

    const result = await adapter.queryHealth(ip);

    expect(result.details?.panelDeviceCount).toBeUndefined();
    expect(result.details?.panelDeviceTypes).toBeUndefined();
  });
});
