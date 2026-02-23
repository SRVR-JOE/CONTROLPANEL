/**
 * Matrix Routing Adapter Tests
 *
 * Tests the health-query logic for all 6 matrix/routing manufacturers:
 *   aja, lightware, extron, crestron, ross (generic), barco (generic)
 *
 * Strategy:
 *   - All network calls are mocked via vi.fn() — no real HTTP traffic.
 *   - Each describe block covers one adapter with happy-path, failure,
 *     malformed-response, and edge-case sub-tests.
 *   - The global fetch mock is reset before each test via beforeEach.
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { AJAAdapter } from '../aja';
import { LightwareAdapter } from '../lightware';
import { ExtronAdapter } from '../extron';
import { CrestronAdapter } from '../crestron';
import { GenericAdapter } from '../generic';

// ---------------------------------------------------------------------------
// Mock setup
// ---------------------------------------------------------------------------

// Replace the global fetch with a vi mock so every adapter call is intercepted.
// Individual tests call (fetch as Mock).mockResolvedValueOnce(...) to shape responses.
global.fetch = vi.fn();

/** Build a fake Headers-like object from a plain Record. */
function makeHeaders(headers: Record<string, string> = {}): { get: (key: string) => string | null } {
  return {
    get: (key: string) => {
      const lower = key.toLowerCase();
      return Object.prototype.hasOwnProperty.call(headers, lower)
        ? headers[lower]
        : null;
    },
  };
}

function mockFetchOk(body: unknown, responseHeaders: Record<string, string> = {}): void {
  (fetch as Mock).mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => body,
    text: async () => JSON.stringify(body),
    headers: makeHeaders(responseHeaders),
  });
}

function mockFetchNotOk(status: number = 503): void {
  (fetch as Mock).mockResolvedValueOnce({
    ok: false,
    status,
    json: async () => { throw new Error('not json'); },
    text: async () => `HTTP ${status}`,
    headers: makeHeaders(),
  });
}

function mockFetchNetworkError(message = 'ECONNREFUSED'): void {
  (fetch as Mock).mockRejectedValueOnce(new Error(message));
}

beforeEach(() => {
  // Reset the mock entirely between tests to prevent mock queue leakage
  vi.mocked(fetch).mockReset();
});

// ---------------------------------------------------------------------------
// AJA Adapter
// ---------------------------------------------------------------------------

describe('AJAAdapter', () => {
  const adapter = new AJAAdapter();
  const ip = '192.168.1.100';

  it('returns reachable:true with router size in firmware field', async () => {
    mockFetchOk({
      eParamID_NumberOfVideoInputs: 32,
      eParamID_NumberOfVideoOutputs: 32,
    });

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(true);
    expect(result.health).not.toBeNull();
    expect(result.firmware).toBe('32x32');
    expect(result.health!.errors).toHaveLength(0);
  });

  it('counts active signals correctly and warns when all inputs have no signal', async () => {
    // 4 inputs, none have signal (value=0)
    mockFetchOk({
      eParamID_NumberOfVideoInputs: 4,
      eParamID_NumberOfVideoOutputs: 4,
      eParamID_Input1_SignalValid: 0,
      eParamID_Input2_SignalValid: 0,
      eParamID_Input3_SignalValid: 0,
      eParamID_Input4_SignalValid: 0,
    });

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(true);
    expect(result.health!.warnings).toContain('No input signals detected on any port');
  });

  it('warns when fewer than half of inputs have active signals', async () => {
    // 4 inputs, only 1 has signal (less than half = 2)
    mockFetchOk({
      eParamID_NumberOfVideoInputs: 4,
      eParamID_NumberOfVideoOutputs: 4,
      eParamID_Input1_SignalValid: 1,
      eParamID_Input2_SignalValid: 0,
      eParamID_Input3_SignalValid: 0,
      eParamID_Input4_SignalValid: 0,
    });

    const result = await adapter.queryHealth(ip);

    expect(result.health!.warnings.some((w) => w.includes('1 of 4'))).toBe(true);
  });

  it('accepts string "1" as valid signal (AJA quirk)', async () => {
    mockFetchOk({
      eParamID_NumberOfVideoInputs: 2,
      eParamID_NumberOfVideoOutputs: 2,
      eParamID_Input1_SignalValid: '1',
      eParamID_Input2_SignalValid: '1',
    });

    const result = await adapter.queryHealth(ip);

    // Both inputs active — no signal warnings
    expect(result.health!.warnings.filter((w) => w.includes('signal'))).toHaveLength(0);
  });

  it('accepts boolean true as valid signal', async () => {
    mockFetchOk({
      eParamID_NumberOfVideoInputs: 1,
      eParamID_NumberOfVideoOutputs: 1,
      eParamID_Input1_SignalValid: true,
    });

    const result = await adapter.queryHealth(ip);
    expect(result.health!.warnings.filter((w) => w.includes('signal'))).toHaveLength(0);
  });

  it('warns when outputs have no routed source (value 0)', async () => {
    mockFetchOk({
      eParamID_NumberOfVideoInputs: 2,
      eParamID_NumberOfVideoOutputs: 2,
      eParamID_Input1_SignalValid: 1,
      eParamID_Input2_SignalValid: 1,
      eParamID_XPT_Destination1_Status: 0,
      eParamID_XPT_Destination2_Status: 0,
    });

    const result = await adapter.queryHealth(ip);

    expect(result.health!.warnings.some((w) => w.includes('no routed source'))).toBe(true);
  });

  it('warns when outputs have no routed source (value -1)', async () => {
    mockFetchOk({
      eParamID_NumberOfVideoInputs: 1,
      eParamID_NumberOfVideoOutputs: 1,
      eParamID_Input1_SignalValid: 1,
      eParamID_XPT_Destination1_Status: -1,
    });

    const result = await adapter.queryHealth(ip);
    expect(result.health!.warnings.some((w) => w.includes('no routed source'))).toBe(true);
  });

  it('returns no warnings when all signals present and outputs routed', async () => {
    mockFetchOk({
      eParamID_NumberOfVideoInputs: 2,
      eParamID_NumberOfVideoOutputs: 2,
      eParamID_Input1_SignalValid: 1,
      eParamID_Input2_SignalValid: 1,
      eParamID_XPT_Destination1_Status: 1,
      eParamID_XPT_Destination2_Status: 2,
    });

    const result = await adapter.queryHealth(ip);
    expect(result.health!.warnings).toHaveLength(0);
    expect(result.health!.errors).toHaveLength(0);
  });

  it('returns reachable:false when HTTP request fails (network error)', async () => {
    mockFetchNetworkError('ECONNREFUSED');

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(false);
    expect(result.health).toBeNull();
  });

  it('returns reachable:false when server returns non-200 status', async () => {
    mockFetchNotOk(404);

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(false);
    expect(result.health).toBeNull();
  });

  it('handles missing eParamID fields gracefully (numInputs=0, no loop)', async () => {
    mockFetchOk({}); // empty config object

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(true);
    expect(result.health).not.toBeNull();
    expect(result.health!.errors).toHaveLength(0);
    expect(result.health!.warnings).toHaveLength(0);
    // No firmware string since both counts are 0/missing
    expect(result.firmware).toBeUndefined();
  });

  it('handles non-JSON response gracefully', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => { throw new SyntaxError('Unexpected token'); },
      text: async () => 'not json',
      headers: makeHeaders(),
    });

    const result = await adapter.queryHealth(ip);

    // fetchAJAConfig catches the JSON parse error and returns null
    expect(result.reachable).toBe(false);
    expect(result.health).toBeNull();
  });

  it('handles timeout (AbortError) gracefully', async () => {
    const abortError = new DOMException('The operation was aborted.', 'AbortError');
    (fetch as Mock).mockRejectedValueOnce(abortError);

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(false);
    expect(result.health).toBeNull();
  });

  it('reports uptime as 0 (not exposed via AJA REST API)', async () => {
    mockFetchOk({ eParamID_NumberOfVideoInputs: 8, eParamID_NumberOfVideoOutputs: 8 });

    const result = await adapter.queryHealth(ip);

    expect(result.health!.uptime).toBe(0);
  });

  it('reports temperature as 0 (not exposed via AJA REST API)', async () => {
    mockFetchOk({ eParamID_NumberOfVideoInputs: 8, eParamID_NumberOfVideoOutputs: 8 });

    const result = await adapter.queryHealth(ip);

    expect(result.health!.temperature).toBe(0);
  });

  it('uses GET http://{ip}/config (correct URL construction)', async () => {
    mockFetchOk({ eParamID_NumberOfVideoInputs: 4, eParamID_NumberOfVideoOutputs: 4 });

    await adapter.queryHealth('10.0.0.5');

    expect(fetch).toHaveBeenCalledWith(
      'http://10.0.0.5/config',
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });

  it('handles string "-1" as unrouted crosspoint', async () => {
    mockFetchOk({
      eParamID_NumberOfVideoInputs: 1,
      eParamID_NumberOfVideoOutputs: 1,
      eParamID_Input1_SignalValid: 1,
      eParamID_XPT_Destination1_Status: '-1',
    });

    const result = await adapter.queryHealth(ip);
    expect(result.health!.warnings.some((w) => w.includes('no routed source'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Lightware Adapter
// ---------------------------------------------------------------------------

describe('LightwareAdapter', () => {
  const adapter = new LightwareAdapter();
  const ip = '192.168.1.200';

  it('returns reachable:true with firmware and uptime on HTTP success', async () => {
    // Two requests: /api/SYS and /api/MEDIA/VIDEO/I1/SignalPresent
    mockFetchOk({ FirmwareVersion: '4.2.0', Uptime: 86400 });
    mockFetchOk({ SignalPresent: true });

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(true);
    expect(result.firmware).toBe('4.2.0');
    expect(result.health!.uptime).toBe(86400);
    expect(result.health!.warnings).toHaveLength(0);
  });

  it('falls back to PackageVersion when FirmwareVersion is absent', async () => {
    mockFetchOk({ PackageVersion: '3.9.1', Uptime: 3600 });
    mockFetchOk({ SignalPresent: true });

    const result = await adapter.queryHealth(ip);

    expect(result.firmware).toBe('3.9.1');
  });

  it('reads FirmwareVersion from nested properties object', async () => {
    mockFetchOk({
      Uptime: 1234,
      properties: { FirmwareVersion: '5.0.0-beta' },
    });
    mockFetchOk({ SignalPresent: true });

    const result = await adapter.queryHealth(ip);

    expect(result.firmware).toBe('5.0.0-beta');
  });

  it('reads Uptime from nested properties object', async () => {
    mockFetchOk({
      properties: { Uptime: 99999 },
    });
    mockFetchOk({ SignalPresent: true });

    const result = await adapter.queryHealth(ip);

    expect(result.health!.uptime).toBe(99999);
  });

  it('warns when signal is absent (SignalPresent: false)', async () => {
    mockFetchOk({ FirmwareVersion: '4.0.0', Uptime: 0 });
    mockFetchOk({ SignalPresent: false });

    const result = await adapter.queryHealth(ip);

    expect(result.health!.warnings).toContain('No input signal on I1');
  });

  it('warns when signal is absent using "value" field fallback', async () => {
    mockFetchOk({ FirmwareVersion: '4.0.0', Uptime: 0 });
    mockFetchOk({ value: false });

    const result = await adapter.queryHealth(ip);

    expect(result.health!.warnings).toContain('No input signal on I1');
  });

  it('does not warn when SignalPresent is true', async () => {
    mockFetchOk({ FirmwareVersion: '4.0.0', Uptime: 1000 });
    mockFetchOk({ SignalPresent: true });

    const result = await adapter.queryHealth(ip);

    expect(result.health!.warnings).toHaveLength(0);
  });

  it('does not warn when signalData is null (unknown signal state)', async () => {
    // sysInfo HTTP succeeds; signalData HTTP succeeds but signalData is null inside
    // Since Promise.all runs both concurrently: SYS succeeds, SIGNAL fails HTTP + HTTPS
    mockFetchOk({ FirmwareVersion: '4.0.0', Uptime: 1000 }); // HTTP /api/SYS ok
    mockFetchNetworkError(); // HTTP /api/MEDIA/VIDEO/I1/SignalPresent fails
    mockFetchNetworkError(); // HTTPS /api/MEDIA/VIDEO/I1/SignalPresent fails

    const result = await adapter.queryHealth(ip);

    // sysInfo succeeded but signalData is null → still reachable, no signal warning
    expect(result.reachable).toBe(true);
    expect(result.health!.warnings).toHaveLength(0);
  });

  it('attempts HTTPS fallback when HTTP fails', async () => {
    // Promise.all fires both HTTP requests concurrently.
    // Mock queue dequeues in call order:
    //   call 1: HTTP /api/SYS          → network error
    //   call 2: HTTP /api/SYS/SIGNAL   → network error
    //   call 3: HTTPS /api/SYS         → success
    //   call 4: HTTPS /api/SYS/SIGNAL  → success
    mockFetchNetworkError(); // HTTP /api/SYS fails
    mockFetchNetworkError(); // HTTP /api/MEDIA/VIDEO/I1/SignalPresent fails
    mockFetchOk({ FirmwareVersion: '4.1.0', Uptime: 500 }); // HTTPS /api/SYS
    mockFetchOk({ SignalPresent: true }); // HTTPS /api/MEDIA/VIDEO/I1/SignalPresent

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(true);
    expect(result.firmware).toBe('4.1.0');
  });

  it('returns reachable:false when both HTTP and HTTPS fail for all requests', async () => {
    // 4 calls total (2 endpoints x 2 protocols each):
    //   HTTP-SYS, HTTP-SIGNAL, HTTPS-SYS, HTTPS-SIGNAL — all fail
    mockFetchNetworkError();
    mockFetchNetworkError();
    mockFetchNetworkError();
    mockFetchNetworkError();

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(false);
    expect(result.health).toBeNull();
  });

  it('returns reachable:true if sysInfo succeeds but signalData is null', async () => {
    // sysInfo HTTP ok
    mockFetchOk({ FirmwareVersion: '4.0.0', Uptime: 100 });
    // signalData HTTP fails, HTTPS fails
    mockFetchNetworkError();
    mockFetchNetworkError();

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(true);
    expect(result.firmware).toBe('4.0.0');
  });

  it('defaults uptime to 0 when field is missing', async () => {
    mockFetchOk({ FirmwareVersion: '3.0.0' }); // no Uptime field
    mockFetchOk({ SignalPresent: true });

    const result = await adapter.queryHealth(ip);

    expect(result.health!.uptime).toBe(0);
  });

  it('reports temperature as 0 (not exposed via Lightware REST)', async () => {
    mockFetchOk({ FirmwareVersion: '4.0.0', Uptime: 500 });
    mockFetchOk({ SignalPresent: true });

    const result = await adapter.queryHealth(ip);

    expect(result.health!.temperature).toBe(0);
  });

  it('handles completely empty sysInfo JSON object gracefully', async () => {
    mockFetchOk({});
    mockFetchOk({});

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(true);
    expect(result.health!.uptime).toBe(0);
    expect(result.firmware).toBeUndefined();
  });

  it('constructs correct HTTP URL with port 80 for SYS endpoint', async () => {
    mockFetchOk({ FirmwareVersion: '4.0.0', Uptime: 100 });
    mockFetchOk({ SignalPresent: true });

    await adapter.queryHealth('10.0.0.10');

    // The first two resolved calls should include the SYS path
    const calls = (fetch as Mock).mock.calls.map((c) => c[0] as string);
    expect(calls.some((url) => url.includes('http://10.0.0.10:80/api/SYS'))).toBe(true);
    expect(calls.some((url) => url.includes('/api/MEDIA/VIDEO/I1/SignalPresent'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Extron Adapter
// ---------------------------------------------------------------------------

describe('ExtronAdapter', () => {
  const adapter = new ExtronAdapter();
  const ip = '192.168.1.50';

  it('returns reachable:true when HTTP HEAD succeeds on default port 80', async () => {
    mockFetchOk({});

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(true);
    expect(result.health).not.toBeNull();
    expect(result.health!.temperature).toBe(0);
    expect(result.health!.uptime).toBe(0);
    expect(result.health!.errors).toHaveLength(0);
    expect(result.health!.warnings).toHaveLength(0);
  });

  it('returns reachable:true with custom port', async () => {
    mockFetchOk({});

    const result = await adapter.queryHealth(ip, 8080);

    expect(result.reachable).toBe(true);
    const calls = (fetch as Mock).mock.calls.map((c) => c[0] as string);
    expect(calls.some((url) => url.includes(':8080/'))).toBe(true);
  });

  it('returns reachable:false with SIS error when HTTP HEAD fails', async () => {
    mockFetchNetworkError('ECONNREFUSED');

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(false);
    expect(result.health).toBeNull();
    expect(result.errors).toBeDefined();
    expect(result.errors![0]).toContain('SIS protocol not implemented');
  });

  it('returns reachable:false when server returns non-ok status', async () => {
    mockFetchNotOk(503);

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(false);
    expect(result.health).toBeNull();
    expect(result.errors![0]).toContain('SIS protocol not implemented');
  });

  it('constructs correct URL: http://{ip}:{port}/', async () => {
    mockFetchOk({});

    await adapter.queryHealth('172.16.0.5', 80);

    const calls = (fetch as Mock).mock.calls.map((c) => c[0] as string);
    expect(calls.some((url) => url === 'http://172.16.0.5:80/')).toBe(true);
  });

  it('uses HEAD method for reachability probe', async () => {
    mockFetchOk({});

    await adapter.queryHealth(ip);

    const firstCall = (fetch as Mock).mock.calls[0];
    expect(firstCall[1]).toMatchObject({ method: 'HEAD' });
  });
});

// ---------------------------------------------------------------------------
// Crestron Adapter
// ---------------------------------------------------------------------------

describe('CrestronAdapter', () => {
  const adapter = new CrestronAdapter();
  const ip = '192.168.1.60';

  it('returns reachable:true when HTTPS GET to /Device/DeviceInfo succeeds', async () => {
    mockFetchOk({ ModelName: 'CP4', SerialNumber: 'ABC123' });

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(true);
    expect(result.health).not.toBeNull();
    expect(result.health!.temperature).toBe(0);
    expect(result.health!.uptime).toBe(0);
    expect(result.health!.errors).toHaveLength(0);
  });

  it('returns reachable:true with custom port', async () => {
    mockFetchOk({});

    const result = await adapter.queryHealth(ip, 8443);

    expect(result.reachable).toBe(true);
    const calls = (fetch as Mock).mock.calls.map((c) => c[0] as string);
    expect(calls.some((url) => url.includes(':8443/Device/DeviceInfo'))).toBe(true);
  });

  it('returns reachable:false with CIP error when HTTPS request fails', async () => {
    mockFetchNetworkError('ECONNREFUSED');

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(false);
    expect(result.health).toBeNull();
    expect(result.errors).toBeDefined();
    expect(result.errors![0]).toContain('CIP protocol not implemented');
  });

  it('returns reachable:false when HTTPS returns non-ok status (e.g., self-signed cert rejection)', async () => {
    mockFetchNotOk(503);

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(false);
    expect(result.errors![0]).toContain('CIP protocol not implemented');
  });

  it('constructs correct URL: https://{ip}:{port}/Device/DeviceInfo', async () => {
    mockFetchOk({});

    await adapter.queryHealth('10.10.0.1', 443);

    const calls = (fetch as Mock).mock.calls.map((c) => c[0] as string);
    expect(calls.some((url) => url === 'https://10.10.0.1:443/Device/DeviceInfo')).toBe(true);
  });

  it('defaults to port 443', async () => {
    mockFetchOk({});

    await adapter.queryHealth('10.10.0.1');

    const calls = (fetch as Mock).mock.calls.map((c) => c[0] as string);
    expect(calls.some((url) => url.includes(':443/Device/DeviceInfo'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Generic Adapter (used for ross and barco)
// ---------------------------------------------------------------------------

describe('GenericAdapter', () => {
  const adapter = new GenericAdapter();
  const ip = '192.168.1.70';

  it('returns reachable:true on successful HEAD request', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => '',
      headers: makeHeaders(),
    });

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(true);
    expect(result.health).not.toBeNull();
    expect(result.health!.temperature).toBe(0);
    expect(result.health!.errors).toHaveLength(0);
    expect(result.health!.warnings).toHaveLength(0);
  });

  it('falls back to GET when HEAD request fails', async () => {
    // HEAD fails with network error
    mockFetchNetworkError('HEAD not allowed');
    // GET succeeds — must have text() method since adapter calls res.text()
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
      text: async () => '<html>ok</html>',
      headers: makeHeaders(),
    });

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(true);
    // Two fetch calls were made: first HEAD (failed), then GET (succeeded)
    expect(fetch).toHaveBeenCalledTimes(2);
    const [firstCall, secondCall] = (fetch as Mock).mock.calls;
    expect(firstCall[1]).toMatchObject({ method: 'HEAD' });
    expect(secondCall[1]).toMatchObject({ method: 'GET' });
  });

  it('returns reachable:false when both HEAD and GET fail', async () => {
    mockFetchNetworkError('ECONNREFUSED');
    mockFetchNetworkError('ECONNREFUSED');

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(false);
    expect(result.health).toBeNull();
  });

  it('uses port in URL when port is specified', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => '',
      headers: makeHeaders(),
    });

    await adapter.queryHealth(ip, 8080);

    const calls = (fetch as Mock).mock.calls.map((c) => c[0] as string);
    expect(calls.some((url) => url === `http://${ip}:8080`)).toBe(true);
  });

  it('omits port when not specified', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => '',
      headers: makeHeaders(),
    });

    await adapter.queryHealth(ip);

    const calls = (fetch as Mock).mock.calls.map((c) => c[0] as string);
    expect(calls.some((url) => url === `http://${ip}`)).toBe(true);
  });

  it('parses uptime from Age header', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
      text: async () => '',
      headers: makeHeaders({ age: '3600' }),
    });

    const result = await adapter.queryHealth(ip);

    expect(result.health!.uptime).toBe(3600);
  });

  it('parses uptime from Date and Last-Modified headers when Age is absent', async () => {
    const now = new Date('2025-01-01T12:00:00Z');
    const lastModified = new Date('2025-01-01T10:00:00Z'); // 2 hours ago = 7200s
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
      text: async () => '',
      headers: makeHeaders({
        date: now.toUTCString(),
        'last-modified': lastModified.toUTCString(),
      }),
    });

    const result = await adapter.queryHealth(ip);

    expect(result.health!.uptime).toBe(7200);
  });

  it('returns uptime 0 when no relevant headers present', async () => {
    // No age, date, or last-modified headers
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
      text: async () => '',
      headers: makeHeaders(),
    });

    const result = await adapter.queryHealth(ip);

    expect(result.health!.uptime).toBe(0);
  });

  it('uses HEAD method for initial probe', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
      text: async () => '',
      headers: makeHeaders(),
    });

    await adapter.queryHealth(ip);

    const firstCall = (fetch as Mock).mock.calls[0];
    expect(firstCall[1]).toMatchObject({ method: 'HEAD' });
  });

  it('ignores malformed Age header (non-numeric)', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
      text: async () => '',
      headers: makeHeaders({ age: 'not-a-number' }),
    });

    const result = await adapter.queryHealth(ip);

    expect(result.health!.uptime).toBe(0);
  });

  it('handles timeout gracefully — both HEAD and GET abort', async () => {
    const abortError = new DOMException('The operation was aborted.', 'AbortError');
    (fetch as Mock).mockRejectedValueOnce(abortError);
    (fetch as Mock).mockRejectedValueOnce(abortError);

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(false);
    expect(result.health).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Adapter Index — verify ross and barco map to GenericAdapter
// ---------------------------------------------------------------------------

describe('adapterMap: ross and barco use GenericAdapter', () => {
  it('getAdapter("ross") returns an instance with queryHealth function', async () => {
    // Dynamic import to avoid module-level side effects
    const { getAdapter } = await import('../index');
    const rossAdapter = getAdapter('ross');
    expect(typeof rossAdapter.queryHealth).toBe('function');
  });

  it('getAdapter("barco") returns an instance with queryHealth function', async () => {
    const { getAdapter } = await import('../index');
    const barcoAdapter = getAdapter('barco');
    expect(typeof barcoAdapter.queryHealth).toBe('function');
  });

  it('ross and barco share the same GenericAdapter instance', async () => {
    const { getAdapter } = await import('../index');
    const rossAdapter = getAdapter('ross');
    const barcoAdapter = getAdapter('barco');
    // Both map to the same singleton genericAdapter
    expect(rossAdapter).toBe(barcoAdapter);
  });

  it('getAdapter("aja") returns AJAAdapter', async () => {
    const { getAdapter } = await import('../index');
    const ajaAdapter = getAdapter('aja');
    expect(ajaAdapter.manufacturer).toBe('aja');
  });

  it('getAdapter("lightware") returns LightwareAdapter', async () => {
    const { getAdapter } = await import('../index');
    const lwAdapter = getAdapter('lightware');
    expect(lwAdapter.manufacturer).toBe('lightware');
  });

  it('getAdapter("extron") returns ExtronAdapter', async () => {
    const { getAdapter } = await import('../index');
    const extronAdapter = getAdapter('extron');
    expect(extronAdapter.manufacturer).toBe('extron');
  });

  it('getAdapter("crestron") returns CrestronAdapter', async () => {
    const { getAdapter } = await import('../index');
    const crestronAdapter = getAdapter('crestron');
    expect(crestronAdapter.manufacturer).toBe('crestron');
  });
});
