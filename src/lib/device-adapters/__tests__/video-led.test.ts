/**
 * Comprehensive tests for the 4 Video/LED manufacturer adapters:
 * - DisguiseAdapter
 * - BromptonAdapter
 * - NovastarAdapter
 * - BlackmagicAdapter
 *
 * All network calls are mocked via vi.fn() — no real HTTP requests are made.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DisguiseAdapter } from '../disguise';
import { BromptonAdapter } from '../brompton';
import { NovastarAdapter } from '../novastar';
import { BlackmagicAdapter } from '../blackmagic';

// ---------------------------------------------------------------------------
// Global fetch mock
// ---------------------------------------------------------------------------

const mockFetch = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
  mockFetch.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/** Build a minimal Response-like object that fetch returns. */
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

/** Cause fetch to throw a network error (like ECONNREFUSED). */
function makeNetworkError(message = 'fetch failed'): Error {
  return new Error(message);
}

/** Cause fetch to abort (simulates timeout). */
function makeAbortError(): DOMException {
  return new DOMException('The operation was aborted.', 'AbortError');
}

// ---------------------------------------------------------------------------
// DisguiseAdapter
// ---------------------------------------------------------------------------

describe('DisguiseAdapter', () => {
  const adapter = new DisguiseAdapter();
  const ip = '10.0.0.100';

  it('has the correct manufacturer identifier', () => {
    expect(adapter.manufacturer).toBe('disguise');
  });

  // --- Happy path: session + service APIs both respond ---
  it('happy path: returns health data when both session and service APIs respond', async () => {
    const sessionHealth = {
      fps: { current: 60, target: 60 },
      states: [
        { name: 'GPU Temperature', detail: '72.5C', severity: 'ok' },
        { name: 'CPU Usage', detail: '45%', severity: 'ok' },
      ],
    };
    const notifications: unknown[] = [];
    const detectSystems = [
      {
        hostname: 'D3-ACT-1',
        ipAddress: ip,
        version: { major: 27, minor: 1, hotfix: 0 },
      },
    ];

    mockFetch
      .mockResolvedValueOnce(makeResponse(sessionHealth))     // /api/session/status/health
      .mockResolvedValueOnce(makeResponse(notifications))     // /api/session/status/notifications
      .mockResolvedValueOnce(makeResponse(detectSystems));    // /api/service/system/detectsystems

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(true);
    expect(result.health).not.toBeNull();
    expect(result.health!.temperature).toBeCloseTo(72.5);
    expect(result.health!.gpuTemp).toBeCloseTo(72.5);
    expect(result.health!.errors).toHaveLength(0);
    expect(result.health!.warnings).toHaveLength(0);
    expect(result.firmware).toBe('r27.1.0');
  });

  // --- Custom port ---
  it('uses the provided port in the URL', async () => {
    const sessionHealth = { states: [] };
    mockFetch
      .mockResolvedValueOnce(makeResponse(sessionHealth))
      .mockResolvedValueOnce(makeResponse([]))
      .mockResolvedValueOnce(makeResponse([{ ipAddress: ip, version: { major: 26, minor: 4, hotfix: 1 } }]));

    await adapter.queryHealth(ip, 8080);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('http://10.0.0.100:8080/api/session/status/health'),
      expect.anything(),
    );
  });

  // --- State severity parsing: errors ---
  it('classifies error-severity states as errors', async () => {
    const sessionHealth = {
      states: [
        { name: 'Render engine', detail: 'Frame drop detected', severity: 'error' },
        { name: 'GPU critical', detail: 'Overheating', severity: 'critical' },
      ],
    };
    mockFetch
      .mockResolvedValueOnce(makeResponse(sessionHealth))
      .mockResolvedValueOnce(makeResponse([]))
      .mockResolvedValueOnce(makeResponse([]));

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(true);
    expect(result.health!.errors).toHaveLength(2);
    expect(result.health!.warnings).toHaveLength(0);
    expect(result.health!.errors[0]).toContain('Render engine');
  });

  // --- State severity parsing: warnings ---
  it('classifies warning-severity states as warnings', async () => {
    const sessionHealth = {
      states: [
        { name: 'Memory usage', detail: 'High memory usage', severity: 'warning' },
      ],
    };
    mockFetch
      .mockResolvedValueOnce(makeResponse(sessionHealth))
      .mockResolvedValueOnce(makeResponse([]))
      .mockResolvedValueOnce(makeResponse([]));

    const result = await adapter.queryHealth(ip);

    expect(result.health!.warnings).toHaveLength(1);
    expect(result.health!.errors).toHaveLength(0);
    expect(result.health!.warnings[0]).toContain('Memory usage');
  });

  // --- Notification severity classification ---
  it('classifies error notifications correctly', async () => {
    const sessionHealth = { states: [] };
    const notifications = [
      { summary: 'Project load failed', severity: 'error', timestamp: '2026-01-01T00:00:00Z' },
      { summary: 'Low disk space', severity: 'warning', timestamp: '2026-01-01T00:00:00Z' },
    ];
    mockFetch
      .mockResolvedValueOnce(makeResponse(sessionHealth))
      .mockResolvedValueOnce(makeResponse(notifications))
      .mockResolvedValueOnce(makeResponse([]));

    const result = await adapter.queryHealth(ip);

    expect(result.health!.errors).toHaveLength(1);
    expect(result.health!.errors[0]).toBe('Project load failed');
    expect(result.health!.warnings).toHaveLength(1);
    expect(result.health!.warnings[0]).toBe('Low disk space');
  });

  // --- Session unavailable, service API still responds ---
  it('returns reachable when session API is down but service API responds', async () => {
    mockFetch
      .mockRejectedValueOnce(makeNetworkError())               // session/status/health fails
      .mockResolvedValueOnce(makeResponse([{ ipAddress: ip, version: { major: 25, minor: 3, hotfix: 0 } }])); // service/detectsystems ok

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(true);
    expect(result.firmware).toBe('r25.3.0');
    expect(result.health!.errors).toHaveLength(0);
  });

  // --- Both APIs unreachable → not reachable ---
  it('returns not reachable when both APIs fail', async () => {
    mockFetch
      .mockRejectedValueOnce(makeNetworkError())  // session/status/health
      .mockRejectedValueOnce(makeNetworkError()); // service/detectsystems

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(false);
    expect(result.health).toBeNull();
  });

  // --- Network error: fetch throws ---
  it('handles complete network failure gracefully', async () => {
    mockFetch.mockRejectedValue(makeNetworkError('ECONNREFUSED'));

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(false);
    expect(result.health).toBeNull();
  });

  // --- Timeout (AbortError) ---
  it('handles timeout gracefully', async () => {
    mockFetch.mockRejectedValue(makeAbortError());

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(false);
    expect(result.health).toBeNull();
  });

  // --- Malformed JSON response ---
  it('handles malformed JSON from session health endpoint', async () => {
    const badResponse = {
      ok: true,
      status: 200,
      json: async () => { throw new SyntaxError('Unexpected token < in JSON'); },
      text: async () => '<html>Error</html>',
    } as unknown as Response;

    mockFetch
      .mockResolvedValueOnce(badResponse)                        // health - throws on json()
      .mockResolvedValueOnce(makeResponse([]))                   // notifications
      .mockResolvedValueOnce(makeResponse([{ ipAddress: ip, version: { major: 27, minor: 0, hotfix: 0 } }]));

    // Should not crash — json() failure in session health means sessionAvailable=false
    const result = await adapter.queryHealth(ip);
    // Service API still responded, so reachable=true
    expect(result.reachable).toBe(true);
  });

  // --- 404 from session health ---
  it('handles 404 from session health endpoint gracefully', async () => {
    mockFetch
      .mockResolvedValueOnce(makeResponse('Not Found', 404))     // health 404
      .mockResolvedValueOnce(makeResponse([{ ipAddress: ip, version: { major: 27, minor: 1, hotfix: 0 } }])); // service ok

    const result = await adapter.queryHealth(ip);

    // Service responded → reachable
    expect(result.reachable).toBe(true);
    expect(result.firmware).toBe('r27.1.0');
  });

  // --- 500 from all endpoints ---
  it('returns unreachable on 500 from all endpoints', async () => {
    mockFetch
      .mockResolvedValueOnce(makeResponse('Internal Server Error', 500))
      .mockResolvedValueOnce(makeResponse('Internal Server Error', 500));

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(false);
    expect(result.health).toBeNull();
  });

  // --- detectsystems response in nested format ---
  it('handles detectsystems response wrapped in result object', async () => {
    const sessionHealth = { states: [] };
    const wrappedResponse = {
      result: [{ ipAddress: ip, version: { major: 26, minor: 4, hotfix: 2 } }],
    };
    mockFetch
      .mockResolvedValueOnce(makeResponse(sessionHealth))
      .mockResolvedValueOnce(makeResponse([]))
      .mockResolvedValueOnce(makeResponse(wrappedResponse));

    const result = await adapter.queryHealth(ip);

    expect(result.firmware).toBe('r26.4.2');
  });

  // --- GPU and CPU temp extraction ---
  it('extracts GPU and CPU temperatures from states', async () => {
    const sessionHealth = {
      states: [
        { name: 'GPU Temp', detail: '68C', severity: 'ok' },
        { name: 'CPU temperature', detail: '55.2C', severity: 'ok' },
      ],
    };
    mockFetch
      .mockResolvedValueOnce(makeResponse(sessionHealth))
      .mockResolvedValueOnce(makeResponse([]))
      .mockResolvedValueOnce(makeResponse([]));

    const result = await adapter.queryHealth(ip);

    expect(result.health!.gpuTemp).toBeCloseTo(68);
    expect(result.health!.temperature).toBeCloseTo(68); // GPU temp used as overall
  });

  // --- Missing states and notifications gracefully handled ---
  it('handles response with missing states array', async () => {
    const sessionHealth = {}; // no states, no fps
    mockFetch
      .mockResolvedValueOnce(makeResponse(sessionHealth))
      .mockResolvedValueOnce(makeResponse([]))
      .mockResolvedValueOnce(makeResponse([]));

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(true);
    expect(result.health!.errors).toHaveLength(0);
    expect(result.health!.warnings).toHaveLength(0);
    expect(result.health!.temperature).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// BromptonAdapter
// ---------------------------------------------------------------------------
// Updated to match the real Tessera SX40 API (7 parallel fetch calls):
//  0: /api/system/temperature/ambient  → { ambient: number }
//  1: /api/system/temperature/cpu      → { cpu: number }
//  2: /api/system/temperature/gpu      → { gpu: number }
//  3: /api/system/uptime              → { uptime: "28m 28s" }  (string!)
//  4: /api/system/temperature         → { temperature: { ambient, cpu, gpu, fpga, psu, main, ethernet } }
//  5: /api/system                     → { fan, serial-number, software-version, ... }
//  6: /api/system/software-version    → { "software-version": "3.5.2" }

/** Mock all 7 Brompton SX40 endpoints with sensible defaults. */
function mockBromptonEndpoints(overrides: Partial<{
  ambient: number; cpu: number; gpu: number; uptime: string;
  fpga: number; psu: number; main: number;
  caseFan1: number; caseFan2: number; fpgaFan: number; firmware: string;
}> = {}) {
  const a = overrides.ambient ?? 28;
  const c = overrides.cpu ?? 55;
  const g = overrides.gpu ?? 60;
  const ut = overrides.uptime ?? '1d 0h 0m 0s';
  const fpga = overrides.fpga ?? 50;
  const psu = overrides.psu ?? 45;
  const main = overrides.main ?? 39;
  const fw = overrides.firmware ?? '3.5.2';

  mockFetch
    .mockResolvedValueOnce(makeResponse({ ambient: a }))                  // 0
    .mockResolvedValueOnce(makeResponse({ cpu: c }))                      // 1
    .mockResolvedValueOnce(makeResponse({ gpu: g }))                      // 2
    .mockResolvedValueOnce(makeResponse({ uptime: ut }))                  // 3
    .mockResolvedValueOnce(makeResponse({                                 // 4
      temperature: { ambient: a, cpu: c, gpu: g, fpga, psu, main, ethernet: { copper: { a: 35, b: 39 }, sfp: { a: 36, b: 37, c: 38, d: 38 } } },
    }))
    .mockResolvedValueOnce(makeResponse({                                 // 5
      system: { fan: { case: { one: { speed: overrides.caseFan1 ?? 1890 }, two: { speed: overrides.caseFan2 ?? 1890 } }, fpga: { speed: overrides.fpgaFan ?? 6500 } }, 'software-version': fw },
    }))
    .mockResolvedValueOnce(makeResponse({ 'software-version': fw }));     // 6
}

describe('BromptonAdapter', () => {
  const adapter = new BromptonAdapter();
  const ip = '192.168.1.50';

  it('has the correct manufacturer identifier', () => {
    expect(adapter.manufacturer).toBe('brompton');
  });

  // --- Happy path ---
  it('happy path: returns combined health from all SX40 endpoints', async () => {
    mockBromptonEndpoints();

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(true);
    expect(result.health).not.toBeNull();
    expect(result.health!.temperature).toBe(28); // ambient has priority
    expect(result.health!.gpuTemp).toBe(60);
    expect(result.health!.uptime).toBe(86400); // "1d 0h 0m 0s"
    expect(result.health!.fanSpeed).toBe(1890);
    expect(result.health!.errors).toHaveLength(0);
    expect(result.health!.warnings).toHaveLength(0);
    expect(result.firmware).toBe('3.5.2');
  });

  // --- Uptime string parsing ---
  it('parses uptime string "28m 28s" correctly', async () => {
    mockBromptonEndpoints({ uptime: '28m 28s' });

    const result = await adapter.queryHealth(ip);

    expect(result.health!.uptime).toBe(28 * 60 + 28);
  });

  // --- CPU temp threshold: warning (> 70) ---
  it('warns when CPU temperature is elevated (> 70°C)', async () => {
    mockBromptonEndpoints({ cpu: 75 });

    const result = await adapter.queryHealth(ip);

    expect(result.health!.warnings.some(w => w.includes('CPU temperature elevated'))).toBe(true);
    expect(result.health!.errors).toHaveLength(0);
  });

  // --- CPU temp threshold: error (> 80) ---
  it('raises error when CPU temperature is critically high (> 80°C)', async () => {
    mockBromptonEndpoints({ cpu: 85 });

    const result = await adapter.queryHealth(ip);

    expect(result.health!.errors.some(e => e.includes('CPU temperature critically high'))).toBe(true);
  });

  // --- GPU temp threshold: warning (> 75) ---
  it('warns when GPU temperature is elevated (> 75°C)', async () => {
    mockBromptonEndpoints({ gpu: 80 });

    const result = await adapter.queryHealth(ip);

    expect(result.health!.warnings.some(w => w.includes('GPU temperature elevated'))).toBe(true);
  });

  // --- GPU temp threshold: error (> 85) ---
  it('raises error when GPU temperature is critically high (> 85°C)', async () => {
    mockBromptonEndpoints({ gpu: 90 });

    const result = await adapter.queryHealth(ip);

    expect(result.health!.errors.some(e => e.includes('GPU temperature critically high'))).toBe(true);
  });

  // --- FPGA temp thresholds ---
  it('warns when FPGA temperature is elevated (> 70°C)', async () => {
    mockBromptonEndpoints({ fpga: 75 });

    const result = await adapter.queryHealth(ip);

    expect(result.health!.warnings.some(w => w.includes('FPGA temperature elevated'))).toBe(true);
  });

  // --- PSU temp thresholds ---
  it('warns when PSU temperature is elevated (> 55°C)', async () => {
    mockBromptonEndpoints({ psu: 60 });

    const result = await adapter.queryHealth(ip);

    expect(result.health!.warnings.some(w => w.includes('PSU temperature elevated'))).toBe(true);
  });

  // --- All endpoints fail ---
  it('returns unreachable when all endpoints fail', async () => {
    mockFetch.mockRejectedValue(makeNetworkError());

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(false);
    expect(result.health).toBeNull();
  });

  // --- Partial failure ---
  it('returns reachable when at least one endpoint succeeds', async () => {
    mockFetch
      .mockResolvedValueOnce(makeResponse({ ambient: 28 }))   // ambient ok
      .mockRejectedValueOnce(makeNetworkError())               // cpu fails
      .mockRejectedValueOnce(makeNetworkError())               // gpu fails
      .mockRejectedValueOnce(makeNetworkError())               // uptime fails
      .mockRejectedValueOnce(makeNetworkError())               // temperature fails
      .mockRejectedValueOnce(makeNetworkError())               // system fails
      .mockRejectedValueOnce(makeNetworkError());              // firmware fails

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(true);
    expect(result.health!.temperature).toBe(28);
    expect(result.health!.gpuTemp).toBeUndefined();
  });

  // --- 404 responses ---
  it('treats 404 responses as null data', async () => {
    mockFetch
      .mockResolvedValueOnce(makeResponse('Not Found', 404))  // ambient 404
      .mockResolvedValueOnce(makeResponse({ cpu: 55 }))       // cpu ok
      .mockResolvedValueOnce(makeResponse({ gpu: 60 }))       // gpu ok
      .mockResolvedValueOnce(makeResponse({ uptime: '1h 0m' })) // uptime ok
      .mockResolvedValueOnce(makeResponse('Not Found', 404))  // temperature 404
      .mockResolvedValueOnce(makeResponse('Not Found', 404))  // system 404
      .mockResolvedValueOnce(makeResponse('Not Found', 404)); // firmware 404

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(true);
    // Ambient failed (404) → falls back to cpuTemp
    expect(result.health!.temperature).toBe(55);
  });

  // --- Timeout ---
  it('handles AbortError (timeout) gracefully', async () => {
    mockFetch.mockRejectedValue(makeAbortError());

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(false);
    expect(result.health).toBeNull();
  });

  // --- cpuTempToUsage mapping ---
  it('maps CPU temperature to usage percentage using thermal model', async () => {
    mockBromptonEndpoints({ cpu: 62 });

    const result = await adapter.queryHealth(ip);
    // cpuTempToUsage(62) = round((62-40)/(85-40)*100) = round(48.9) = 49
    expect(result.health!.cpuUsage).toBe(49);
  });

  // --- Null response bodies ---
  it('handles null response bodies without crashing', async () => {
    for (let i = 0; i < 7; i++) {
      mockFetch.mockResolvedValueOnce(makeResponse(null));
    }

    const result = await adapter.queryHealth(ip);
    expect(result.reachable).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// NovastarAdapter
// ---------------------------------------------------------------------------

describe('NovastarAdapter', () => {
  const adapter = new NovastarAdapter();
  const ip = '10.10.1.100';

  it('has the correct manufacturer identifier', () => {
    expect(adapter.manufacturer).toBe('novastar');
  });

  // --- Happy path ---
  it('happy path: returns health data when both endpoints respond', async () => {
    const sysInfo = {
      model: 'NovaPro UHD Jr',
      serialNumber: 'NS-1234-5678',
      firmwareVersion: '3.5.2',
    };
    const sysStatus = {
      temperature: 45,
      inputSignal: true,
      inputResolution: '1920x1080',
      outputPortCount: 4,
    };

    mockFetch
      .mockResolvedValueOnce(makeResponse(sysInfo))
      .mockResolvedValueOnce(makeResponse(sysStatus));

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(true);
    expect(result.health).not.toBeNull();
    expect(result.health!.temperature).toBe(45);
    expect(result.health!.errors).toHaveLength(0);
    expect(result.health!.warnings).toHaveLength(0);
    expect(result.firmware).toBe('3.5.2');
  });

  // --- Custom port ---
  it('uses the provided port in URLs', async () => {
    mockFetch
      .mockResolvedValueOnce(makeResponse({ firmwareVersion: '3.5.2' }))
      .mockResolvedValueOnce(makeResponse({ temperature: 40 }));

    await adapter.queryHealth(ip, 8080);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('http://10.10.1.100:8080/api/system/info'),
      expect.anything(),
    );
  });

  // --- Temperature thresholds: warning (> 55) ---
  it('warns when temperature exceeds 55C', async () => {
    mockFetch
      .mockResolvedValueOnce(makeResponse({ firmwareVersion: '3.0.0' }))
      .mockResolvedValueOnce(makeResponse({ temperature: 60 }));

    const result = await adapter.queryHealth(ip);

    expect(result.health!.warnings).toHaveLength(1);
    expect(result.health!.warnings[0]).toContain('Temperature elevated: 60C');
    expect(result.health!.errors).toHaveLength(0);
  });

  // --- Temperature thresholds: error (> 70) ---
  it('raises error when temperature exceeds 70C', async () => {
    mockFetch
      .mockResolvedValueOnce(makeResponse({ firmwareVersion: '3.0.0' }))
      .mockResolvedValueOnce(makeResponse({ temperature: 75 }));

    const result = await adapter.queryHealth(ip);

    expect(result.health!.errors).toHaveLength(1);
    expect(result.health!.errors[0]).toContain('Temperature critically high: 75C');
    expect(result.health!.warnings).toHaveLength(0);
  });

  // --- cpuTemp fallback ---
  it('uses cpuTemp field when temperature is absent', async () => {
    mockFetch
      .mockResolvedValueOnce(makeResponse({ firmwareVersion: '3.0.0' }))
      .mockResolvedValueOnce(makeResponse({ cpuTemp: 58 })); // cpuTemp not temperature

    const result = await adapter.queryHealth(ip);

    expect(result.health!.temperature).toBe(58);
    expect(result.health!.warnings).toHaveLength(1);
  });

  // --- No input signal warning ---
  it('warns when no input signal is detected', async () => {
    mockFetch
      .mockResolvedValueOnce(makeResponse({ firmwareVersion: '3.0.0' }))
      .mockResolvedValueOnce(makeResponse({ temperature: 45, inputSignal: false }));

    const result = await adapter.queryHealth(ip);

    expect(result.health!.warnings).toHaveLength(1);
    expect(result.health!.warnings[0]).toContain('No input signal detected');
  });

  // --- Firmware fallback to version field ---
  it('uses version field as firmware fallback when firmwareVersion is absent', async () => {
    mockFetch
      .mockResolvedValueOnce(makeResponse({ version: '2.9.1' }))
      .mockResolvedValueOnce(makeResponse({ temperature: 40 }));

    const result = await adapter.queryHealth(ip);

    expect(result.firmware).toBe('2.9.1');
  });

  // --- Both endpoints null → unreachable ---
  it('returns unreachable when both endpoints return null', async () => {
    mockFetch
      .mockResolvedValueOnce(makeResponse('Not Found', 404))
      .mockResolvedValueOnce(makeResponse('Not Found', 404));

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(false);
    expect(result.health).toBeNull();
  });

  // --- Network failure ---
  it('returns unreachable on network failure', async () => {
    mockFetch.mockRejectedValue(makeNetworkError('ECONNREFUSED'));

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(false);
    expect(result.health).toBeNull();
  });

  // --- Timeout ---
  it('handles timeout gracefully', async () => {
    mockFetch.mockRejectedValue(makeAbortError());

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(false);
    expect(result.health).toBeNull();
  });

  // --- Malformed JSON ---
  it('handles malformed JSON without crashing', async () => {
    const badResponse = {
      ok: true,
      status: 200,
      json: async () => { throw new SyntaxError('Invalid JSON'); },
    } as unknown as Response;

    mockFetch
      .mockResolvedValueOnce(badResponse)
      .mockResolvedValueOnce(makeResponse({ temperature: 45 }));

    // fetchJson catches the error and returns null, so sysInfo=null, sysStatus ok
    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(true);
    expect(result.health!.temperature).toBe(45);
    expect(result.firmware).toBeUndefined();
  });

  // --- Partial responses: only sysInfo responds ---
  it('remains reachable when only sysInfo responds', async () => {
    mockFetch
      .mockResolvedValueOnce(makeResponse({ firmwareVersion: '3.5.2' }))
      .mockResolvedValueOnce(makeResponse('Error', 500));

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(true);
    expect(result.firmware).toBe('3.5.2');
    expect(result.health!.temperature).toBe(0);
  });

  // --- Partial responses: only sysStatus responds ---
  it('remains reachable when only sysStatus responds', async () => {
    mockFetch
      .mockResolvedValueOnce(makeResponse('Error', 500))
      .mockResolvedValueOnce(makeResponse({ temperature: 48 }));

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(true);
    expect(result.health!.temperature).toBe(48);
    expect(result.firmware).toBeUndefined();
  });

  // --- inputSignal: null/undefined (not false) should NOT trigger warning ---
  it('does not warn when inputSignal is undefined', async () => {
    mockFetch
      .mockResolvedValueOnce(makeResponse({ firmwareVersion: '3.0.0' }))
      .mockResolvedValueOnce(makeResponse({ temperature: 45 })); // no inputSignal field

    const result = await adapter.queryHealth(ip);

    const inputSignalWarning = result.health!.warnings.find((w) => w.includes('input signal'));
    expect(inputSignalWarning).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// BlackmagicAdapter
// ---------------------------------------------------------------------------

describe('BlackmagicAdapter', () => {
  const adapter = new BlackmagicAdapter();
  const ip = '192.168.10.50';

  it('has the correct manufacturer identifier', () => {
    expect(adapter.manufacturer).toBe('blackmagic');
  });

  // --- Happy path ---
  it('happy path: returns health data when all REST endpoints respond', async () => {
    const systemInfo = { status: 'ok', temperature: 42.5, uptime: 172800 };
    const productInfo = { productName: 'HyperDeck Studio HD Plus', softwareVersion: '7.9.4' };
    const transportStatus = { mode: 'stopped', speed: 100, inputVideoFormat: '1080p25' };

    mockFetch
      .mockResolvedValueOnce(makeResponse(systemInfo))
      .mockResolvedValueOnce(makeResponse(productInfo))
      .mockResolvedValueOnce(makeResponse(transportStatus));

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(true);
    expect(result.health).not.toBeNull();
    expect(result.health!.temperature).toBeCloseTo(42.5);
    expect(result.health!.uptime).toBe(172800);
    expect(result.health!.errors).toHaveLength(0);
    expect(result.health!.warnings).toHaveLength(0);
    expect(result.firmware).toBe('7.9.4');
  });

  // --- URL construction ---
  it('constructs URLs using /control/api/v1 base path', async () => {
    mockFetch
      .mockResolvedValueOnce(makeResponse({ temperature: 40 }))
      .mockResolvedValueOnce(makeResponse({ softwareVersion: '7.9.0' }))
      .mockResolvedValueOnce(makeResponse({ mode: 'stopped' }));

    await adapter.queryHealth(ip);

    expect(mockFetch).toHaveBeenCalledWith(
      'http://192.168.10.50/control/api/v1/system',
      expect.anything(),
    );
    expect(mockFetch).toHaveBeenCalledWith(
      'http://192.168.10.50/control/api/v1/system/product',
      expect.anything(),
    );
    expect(mockFetch).toHaveBeenCalledWith(
      'http://192.168.10.50/control/api/v1/transports/0',
      expect.anything(),
    );
  });

  // --- No input video signal warning ---
  it('warns when inputVideoFormat is "none"', async () => {
    mockFetch
      .mockResolvedValueOnce(makeResponse({ temperature: 40, uptime: 3600 }))
      .mockResolvedValueOnce(makeResponse({ softwareVersion: '7.9.4' }))
      .mockResolvedValueOnce(makeResponse({ mode: 'stopped', inputVideoFormat: 'none' }));

    const result = await adapter.queryHealth(ip);

    expect(result.health!.warnings).toHaveLength(1);
    expect(result.health!.warnings[0]).toContain('No input video signal detected');
  });

  // --- No input video signal warning for empty string ---
  it('warns when inputVideoFormat is empty string', async () => {
    mockFetch
      .mockResolvedValueOnce(makeResponse({ temperature: 40, uptime: 3600 }))
      .mockResolvedValueOnce(makeResponse({ softwareVersion: '7.9.4' }))
      .mockResolvedValueOnce(makeResponse({ mode: 'stopped', inputVideoFormat: '' }));

    const result = await adapter.queryHealth(ip);

    expect(result.health!.warnings).toHaveLength(1);
    expect(result.health!.warnings[0]).toContain('No input video signal detected');
  });

  // --- Firmware fallback to firmwareVersion field ---
  it('uses firmwareVersion as fallback when softwareVersion is absent', async () => {
    mockFetch
      .mockResolvedValueOnce(makeResponse({ temperature: 40 }))
      .mockResolvedValueOnce(makeResponse({ firmwareVersion: '7.8.0' }))
      .mockResolvedValueOnce(makeResponse({ mode: 'stopped' }));

    const result = await adapter.queryHealth(ip);

    expect(result.firmware).toBe('7.8.0');
  });

  // --- All endpoints fail → unreachable ---
  it('returns unreachable when all endpoints fail', async () => {
    mockFetch.mockRejectedValue(makeNetworkError('ECONNREFUSED'));

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(false);
    expect(result.health).toBeNull();
  });

  // --- All endpoints 404 → unreachable ---
  it('returns unreachable when all endpoints return 404', async () => {
    mockFetch
      .mockResolvedValueOnce(makeResponse('Not Found', 404))
      .mockResolvedValueOnce(makeResponse('Not Found', 404))
      .mockResolvedValueOnce(makeResponse('Not Found', 404));

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(false);
    expect(result.health).toBeNull();
  });

  // --- Partial failure: system info fails, others ok ---
  it('remains reachable when system info fails but product info responds', async () => {
    mockFetch
      .mockResolvedValueOnce(makeResponse('Internal Server Error', 500))
      .mockResolvedValueOnce(makeResponse({ softwareVersion: '7.9.4' }))
      .mockResolvedValueOnce(makeResponse({ mode: 'stopped' }));

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(true);
    expect(result.health!.temperature).toBe(0); // no systemInfo
    expect(result.firmware).toBe('7.9.4');
  });

  // --- Timeout ---
  it('handles timeout gracefully', async () => {
    mockFetch.mockRejectedValue(makeAbortError());

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(false);
    expect(result.health).toBeNull();
  });

  // --- Malformed JSON ---
  it('handles malformed JSON without crashing', async () => {
    const badJson = {
      ok: true,
      status: 200,
      json: async () => { throw new SyntaxError('Unexpected end of JSON'); },
    } as unknown as Response;

    mockFetch
      .mockResolvedValueOnce(badJson)
      .mockResolvedValueOnce(makeResponse({ softwareVersion: '7.9.4' }))
      .mockResolvedValueOnce(makeResponse({ mode: 'stopped' }));

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(true);
    expect(result.health!.temperature).toBe(0); // systemInfo was null
  });

  // --- queryHealthTCP stub ---
  it('queryHealthTCP always returns unreachable (stub, not implemented)', async () => {
    const result = await adapter.queryHealthTCP('192.168.10.100', 9990);

    expect(result.reachable).toBe(false);
    expect(result.health).toBeNull();
    expect(result.errors).toBeDefined();
    expect(result.errors![0]).toContain('not yet implemented');
  });

  // --- Temperature and uptime are 0 when system info is missing ---
  it('defaults temperature and uptime to 0 when system info is missing', async () => {
    mockFetch
      .mockResolvedValueOnce(makeResponse('Error', 500))
      .mockResolvedValueOnce(makeResponse({ softwareVersion: '7.9.0' }))
      .mockResolvedValueOnce(makeResponse(null, 404));

    const result = await adapter.queryHealth(ip);

    expect(result.health!.temperature).toBe(0);
    expect(result.health!.uptime).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Cross-adapter: adapter registry & getAdapter()
// ---------------------------------------------------------------------------

describe('Adapter registry (getAdapter)', () => {
  it('returns DisguiseAdapter for "disguise"', async () => {
    const { getAdapter } = await import('../index');
    const adapter = getAdapter('disguise');
    expect(adapter.manufacturer).toBe('disguise');
  });

  it('returns BromptonAdapter for "brompton"', async () => {
    const { getAdapter } = await import('../index');
    const adapter = getAdapter('brompton');
    expect(adapter.manufacturer).toBe('brompton');
  });

  it('returns NovastarAdapter for "novastar"', async () => {
    const { getAdapter } = await import('../index');
    const adapter = getAdapter('novastar');
    expect(adapter.manufacturer).toBe('novastar');
  });

  it('returns BlackmagicAdapter for "blackmagic"', async () => {
    const { getAdapter } = await import('../index');
    const adapter = getAdapter('blackmagic');
    expect(adapter.manufacturer).toBe('blackmagic');
  });
});
