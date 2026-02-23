/**
 * Comprehensive tests for Team D audio/network device adapters:
 * shure, qsc, audinate (dante), luminex, netgear, sonifex, adder
 *
 * All network calls are mocked via vi.fn(). No real network calls are made.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ShureAdapter } from '../shure';
import { QSCAdapter } from '../qsc';
import { DanteAdapter } from '../dante';
import { LuminexAdapter } from '../luminex';
import { NetgearAdapter } from '../netgear';
import { SonifexAdapter } from '../sonifex';
import { AdderAdapter } from '../adder';

// ---------------------------------------------------------------------------
// Helper: build a minimal Response-like object that vi.fn() can return
// ---------------------------------------------------------------------------
function makeResponse(
  body: unknown,
  status: number = 200,
  ok: boolean = status >= 200 && status < 300,
): Response {
  const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
  return {
    ok,
    status,
    json: async () => JSON.parse(bodyStr),
    text: async () => bodyStr,
  } as unknown as Response;
}

function makeErrorResponse(status: number = 500): Response {
  return {
    ok: false,
    status,
    json: async () => { throw new SyntaxError('Not JSON'); },
    text: async () => 'Internal Server Error',
  } as unknown as Response;
}

// ---------------------------------------------------------------------------
// Mock global fetch
// ---------------------------------------------------------------------------
const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ===========================================================================
// SHURE ADAPTER
// ===========================================================================
describe('ShureAdapter', () => {
  const adapter = new ShureAdapter();
  const ip = '192.168.1.100';

  it('has the correct manufacturer identifier', () => {
    expect(adapter.manufacturer).toBe('shure');
  });

  it('happy path: returns reachable with firmware from devinfo', async () => {
    fetchMock
      .mockResolvedValueOnce(
        makeResponse({ model: 'ULXD4', serial: 'ABC123', firmware: '1.5.0' }),
      )
      .mockResolvedValueOnce(
        makeResponse({
          audio_mute: false,
          rf_signal_strength: -60,
          battery_level: 80,
          antenna_status: 'ok',
          dante_status: 'connected',
        }),
      );

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(true);
    expect(result.health).not.toBeNull();
    expect(result.health!.errors).toHaveLength(0);
    expect(result.health!.warnings).toHaveLength(0);
    expect(result.firmware).toBe('1.5.0');
  });

  it('happy path: uses version field when firmware is absent (MXA style)', async () => {
    fetchMock
      .mockResolvedValueOnce(
        makeResponse({ model: 'MXA910', device_id: 'dev001', version: '2.1.3' }),
      )
      .mockResolvedValueOnce(
        makeResponse({ audio_mute: false, rf_signal_strength: -55, battery_level: 90 }),
      );

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(true);
    expect(result.firmware).toBe('2.1.3');
  });

  it('constructs correct URLs with custom port', async () => {
    fetchMock
      .mockResolvedValueOnce(makeResponse({ firmware: '1.0' }))
      .mockResolvedValueOnce(makeResponse({}));

    await adapter.queryHealth(ip, 8080);

    const calls = fetchMock.mock.calls.map((c) => c[0] as string);
    expect(calls[0]).toBe('http://192.168.1.100:8080/api/v1.0/devinfo');
    expect(calls[1]).toBe('http://192.168.1.100:8080/api/v1.0/status');
  });

  it('constructs correct URLs with default port 80', async () => {
    fetchMock
      .mockResolvedValueOnce(makeResponse({ firmware: '1.0' }))
      .mockResolvedValueOnce(makeResponse({}));

    await adapter.queryHealth(ip);

    const calls = fetchMock.mock.calls.map((c) => c[0] as string);
    expect(calls[0]).toBe('http://192.168.1.100:80/api/v1.0/devinfo');
    expect(calls[1]).toBe('http://192.168.1.100:80/api/v1.0/status');
  });

  it('warning: low RF signal (<-80 dBm)', async () => {
    fetchMock
      .mockResolvedValueOnce(makeResponse({ firmware: '1.5.0' }))
      .mockResolvedValueOnce(makeResponse({ rf_signal_strength: -85 }));

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(true);
    expect(result.health!.warnings).toContain('Weak RF signal: -85 dBm');
    expect(result.health!.errors).toHaveLength(0);
  });

  it('warning: exactly at -80 dBm is NOT flagged (boundary check)', async () => {
    fetchMock
      .mockResolvedValueOnce(makeResponse({ firmware: '1.5.0' }))
      .mockResolvedValueOnce(makeResponse({ rf_signal_strength: -80 }));

    const result = await adapter.queryHealth(ip);

    expect(result.health!.warnings.some((w) => w.includes('RF signal'))).toBe(false);
  });

  it('warning: low battery (<20%)', async () => {
    fetchMock
      .mockResolvedValueOnce(makeResponse({ firmware: '1.5.0' }))
      .mockResolvedValueOnce(makeResponse({ battery_level: 15 }));

    const result = await adapter.queryHealth(ip);

    expect(result.health!.warnings).toContain('Low battery: 15%');
  });

  it('warning: exactly at 20% battery is NOT flagged (boundary check)', async () => {
    fetchMock
      .mockResolvedValueOnce(makeResponse({ firmware: '1.5.0' }))
      .mockResolvedValueOnce(makeResponse({ battery_level: 20 }));

    const result = await adapter.queryHealth(ip);

    expect(result.health!.warnings.some((w) => w.includes('battery'))).toBe(false);
  });

  it('warning: audio muted', async () => {
    fetchMock
      .mockResolvedValueOnce(makeResponse({ firmware: '1.5.0' }))
      .mockResolvedValueOnce(makeResponse({ audio_mute: true }));

    const result = await adapter.queryHealth(ip);

    expect(result.health!.warnings).toContain('Audio muted');
  });

  it('multiple warnings accumulate: RF + battery + mute', async () => {
    fetchMock
      .mockResolvedValueOnce(makeResponse({ firmware: '1.5.0' }))
      .mockResolvedValueOnce(
        makeResponse({ audio_mute: true, rf_signal_strength: -95, battery_level: 5 }),
      );

    const result = await adapter.queryHealth(ip);

    expect(result.health!.warnings).toHaveLength(3);
    expect(result.health!.warnings).toContain('Audio muted');
    expect(result.health!.warnings.some((w) => w.includes('RF signal'))).toBe(true);
    expect(result.health!.warnings.some((w) => w.includes('battery'))).toBe(true);
  });

  it('network failure on both endpoints: returns unreachable', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNREFUSED'));

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(false);
    expect(result.health).toBeNull();
  });

  it('both endpoints return non-OK HTTP: returns unreachable', async () => {
    fetchMock
      .mockResolvedValueOnce(makeErrorResponse(404))
      .mockResolvedValueOnce(makeErrorResponse(404));

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(false);
    expect(result.health).toBeNull();
  });

  it('devinfo 404 but status OK: still returns reachable', async () => {
    fetchMock
      .mockResolvedValueOnce(makeErrorResponse(404))
      .mockResolvedValueOnce(makeResponse({ audio_mute: false }));

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(true);
    expect(result.health).not.toBeNull();
  });

  it('timeout: AbortController is wired up (fetch receives a signal)', async () => {
    fetchMock.mockImplementation((_url, init) => {
      expect(init?.signal).toBeDefined();
      return Promise.resolve(makeResponse({ firmware: '1.0' }));
    });

    await adapter.queryHealth(ip);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('malformed JSON on status endpoint is handled gracefully', async () => {
    fetchMock
      .mockResolvedValueOnce(makeResponse({ firmware: '1.5.0' }))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => { throw new SyntaxError('Unexpected token'); },
        text: async () => 'not json',
      } as unknown as Response);

    const result = await adapter.queryHealth(ip);

    // devinfo succeeded, status failed — still reachable
    expect(result.reachable).toBe(true);
  });

  it('empty response bodies yield no spurious warnings', async () => {
    fetchMock
      .mockResolvedValueOnce(makeResponse({}))
      .mockResolvedValueOnce(makeResponse({}));

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(true);
    expect(result.health!.warnings).toHaveLength(0);
    expect(result.health!.errors).toHaveLength(0);
  });
});

// ===========================================================================
// QSC ADAPTER
// ===========================================================================
describe('QSCAdapter', () => {
  const adapter = new QSCAdapter();
  const ip = '10.0.0.50';

  it('has the correct manufacturer identifier', () => {
    expect(adapter.manufacturer).toBe('qsc');
  });

  it('sends a POST to correct JSON-RPC URL on port 1710', async () => {
    fetchMock.mockResolvedValueOnce(makeResponse({ result: { Platform: 'Core 110f' } }));

    await adapter.queryHealth(ip);

    expect(fetchMock).toHaveBeenCalledWith(
      `http://${ip}:1710`,
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('sends correct JSON-RPC 2.0 payload: method StatusGet, params 0', async () => {
    fetchMock.mockResolvedValueOnce(makeResponse({ result: {} }));

    await adapter.queryHealth(ip);

    const callInit = fetchMock.mock.calls[0][1] as RequestInit;
    const body = JSON.parse(callInit.body as string);
    expect(body.jsonrpc).toBe('2.0');
    expect(body.method).toBe('StatusGet');
    expect(body.params).toBe(0);
    expect(body.id).toBeDefined();
  });

  it('sends Content-Type: application/json header', async () => {
    fetchMock.mockResolvedValueOnce(makeResponse({ result: {} }));

    await adapter.queryHealth(ip);

    const callInit = fetchMock.mock.calls[0][1] as RequestInit;
    expect((callInit.headers as Record<string, string>)['Content-Type']).toBe('application/json');
  });

  it('happy path: status code 0 = ok, no errors or warnings', async () => {
    fetchMock.mockResolvedValueOnce(
      makeResponse({
        result: {
          Platform: 'Core 110f',
          DesignName: 'Main Mix',
          IsRedundant: false,
          IsEmulator: false,
          Status: { Code: 0, String: 'OK' },
        },
      }),
    );

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(true);
    expect(result.health!.errors).toHaveLength(0);
    expect(result.health!.warnings).toHaveLength(0);
    expect(result.firmware).toBe('Core 110f');
  });

  it('happy path: status code 1 = ok', async () => {
    fetchMock.mockResolvedValueOnce(
      makeResponse({
        result: { Status: { Code: 1, String: 'Initializing' } },
      }),
    );

    const result = await adapter.queryHealth(ip);

    expect(result.health!.errors).toHaveLength(0);
    expect(result.health!.warnings).toHaveLength(0);
  });

  it('warning: status code 2 triggers warning', async () => {
    fetchMock.mockResolvedValueOnce(
      makeResponse({
        result: { Status: { Code: 2, String: 'Not Present' } },
      }),
    );

    const result = await adapter.queryHealth(ip);

    expect(result.health!.warnings).toContain('Core status: Not Present');
    expect(result.health!.errors).toHaveLength(0);
  });

  it('warning: status code 3 triggers warning', async () => {
    fetchMock.mockResolvedValueOnce(
      makeResponse({
        result: { Status: { Code: 3, String: 'Missing' } },
      }),
    );

    const result = await adapter.queryHealth(ip);

    expect(result.health!.warnings.some((w) => w.includes('Core status'))).toBe(true);
    expect(result.health!.errors).toHaveLength(0);
  });

  it('warning: status code 4 triggers warning', async () => {
    fetchMock.mockResolvedValueOnce(
      makeResponse({
        result: { Status: { Code: 4, String: 'Fault' } },
      }),
    );

    const result = await adapter.queryHealth(ip);

    expect(result.health!.warnings.some((w) => w.includes('Core status'))).toBe(true);
    expect(result.health!.errors).toHaveLength(0);
  });

  it('error: status code 5+ triggers error', async () => {
    fetchMock.mockResolvedValueOnce(
      makeResponse({
        result: { Status: { Code: 5, String: 'Compromised' } },
      }),
    );

    const result = await adapter.queryHealth(ip);

    expect(result.health!.errors).toContain('Core status: Compromised');
    expect(result.health!.warnings).toHaveLength(0);
  });

  it('error: status code 9 triggers error (high code)', async () => {
    fetchMock.mockResolvedValueOnce(
      makeResponse({
        result: { Status: { Code: 9, String: 'Critical Fault' } },
      }),
    );

    const result = await adapter.queryHealth(ip);

    expect(result.health!.errors.some((e) => e.includes('Core status'))).toBe(true);
  });

  it('warning: emulator mode', async () => {
    fetchMock.mockResolvedValueOnce(
      makeResponse({
        result: {
          Platform: 'Emulator',
          IsEmulator: true,
          Status: { Code: 0, String: 'OK' },
        },
      }),
    );

    const result = await adapter.queryHealth(ip);

    expect(result.health!.warnings).toContain('Running in emulator mode');
    expect(result.health!.errors).toHaveLength(0);
  });

  it('emulator + bad status: accumulates both warning sets', async () => {
    fetchMock.mockResolvedValueOnce(
      makeResponse({
        result: {
          Platform: 'Emulator',
          IsEmulator: true,
          Status: { Code: 3, String: 'Missing' },
        },
      }),
    );

    const result = await adapter.queryHealth(ip);

    expect(result.health!.warnings).toHaveLength(2);
    expect(result.health!.warnings).toContain('Running in emulator mode');
  });

  it('JSON-RPC error field: result missing => minimal ok health returned', async () => {
    fetchMock.mockResolvedValueOnce(
      makeResponse({ error: { code: -32601, message: 'Method not found' } }),
    );

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(true);
    expect(result.health!.errors).toHaveLength(0);
    expect(result.health!.warnings).toHaveLength(0);
  });

  it('HTTP 500: returns unreachable', async () => {
    fetchMock.mockResolvedValueOnce(makeErrorResponse(500));

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(false);
    expect(result.health).toBeNull();
  });

  it('network failure: returns unreachable', async () => {
    fetchMock.mockRejectedValueOnce(new Error('ECONNREFUSED'));

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(false);
    expect(result.health).toBeNull();
  });

  it('timeout: AbortController signal is passed to fetch', async () => {
    fetchMock.mockImplementation((_url, init) => {
      expect(init?.signal).toBeDefined();
      return Promise.resolve(makeResponse({ result: {} }));
    });

    await adapter.queryHealth(ip);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('custom port is used in URL', async () => {
    fetchMock.mockResolvedValueOnce(makeResponse({ result: {} }));

    await adapter.queryHealth(ip, 9999);

    expect(fetchMock).toHaveBeenCalledWith(
      `http://${ip}:9999`,
      expect.any(Object),
    );
  });

  it('missing Status field: no errors or warnings emitted', async () => {
    fetchMock.mockResolvedValueOnce(
      makeResponse({ result: { Platform: 'Core 110f', IsEmulator: false } }),
    );

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(true);
    expect(result.health!.errors).toHaveLength(0);
    expect(result.health!.warnings).toHaveLength(0);
  });
});

// ===========================================================================
// DANTE/AUDINATE ADAPTER
// ===========================================================================
describe('DanteAdapter (Audinate)', () => {
  const adapter = new DanteAdapter();
  const ip = '172.16.0.20';

  it('has the correct manufacturer identifier (audinate)', () => {
    expect(adapter.manufacturer).toBe('audinate');
  });

  it('HTTP HEAD success on port 8080: returns reachable', async () => {
    fetchMock.mockResolvedValueOnce(makeResponse('', 200));

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(true);
    expect(result.health).not.toBeNull();
    expect(result.health!.errors).toHaveLength(0);
    expect(result.health!.warnings).toHaveLength(0);
  });

  it('sends a HEAD request to / on port 8080', async () => {
    fetchMock.mockResolvedValueOnce(makeResponse('', 200));

    await adapter.queryHealth(ip);

    expect(fetchMock).toHaveBeenCalledWith(
      `http://${ip}:8080/`,
      expect.objectContaining({ method: 'HEAD' }),
    );
  });

  it('custom port is used in URL', async () => {
    fetchMock.mockResolvedValueOnce(makeResponse('', 200));

    await adapter.queryHealth(ip, 9090);

    expect(fetchMock).toHaveBeenCalledWith(
      `http://${ip}:9090/`,
      expect.objectContaining({ method: 'HEAD' }),
    );
  });

  it('HTTP HEAD failure (non-ok status): falls through to mDNS fallback', async () => {
    fetchMock.mockResolvedValueOnce(makeErrorResponse(404));

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(false);
    expect(result.health).toBeNull();
    expect(result.errors).toBeDefined();
    expect(result.errors![0]).toMatch(/mDNS/i);
  });

  it('network failure on REST: returns mDNS not implemented message', async () => {
    fetchMock.mockRejectedValueOnce(new Error('ECONNREFUSED'));

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(false);
    expect(result.health).toBeNull();
    expect(result.errors).toBeDefined();
    expect(result.errors!.length).toBeGreaterThan(0);
    expect(result.errors![0]).toMatch(/mDNS/i);
  });

  it('timeout aborts and falls back to mDNS not implemented', async () => {
    fetchMock.mockRejectedValueOnce(Object.assign(new Error('The operation was aborted'), { name: 'AbortError' }));

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(false);
    expect(result.errors![0]).toMatch(/mDNS/i);
  });

  it('AbortController signal is passed to fetch', async () => {
    fetchMock.mockImplementation((_url, init) => {
      expect(init?.signal).toBeDefined();
      return Promise.resolve(makeResponse('', 200));
    });

    await adapter.queryHealth(ip);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });
});

// ===========================================================================
// LUMINEX ADAPTER
// ===========================================================================
describe('LuminexAdapter', () => {
  const adapter = new LuminexAdapter();
  const ip = '192.168.2.10';

  it('has the correct manufacturer identifier', () => {
    expect(adapter.manufacturer).toBe('luminex');
  });

  it('happy path: system + ports OK, all ports up', async () => {
    fetchMock
      .mockResolvedValueOnce(
        makeResponse({
          model: 'GigaCore 26i',
          firmware: '3.0.0',
          serial: 'SN001',
          uptime: 3600,
          temperature: 35,
          hostname: 'luminex-sw01',
        }),
      )
      .mockResolvedValueOnce(
        makeResponse({
          ports: [
            { id: 1, link: true, speed: '1G' },
            { id: 2, link: true, speed: '1G' },
          ],
        }),
      );

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(true);
    expect(result.health!.errors).toHaveLength(0);
    expect(result.health!.warnings).toHaveLength(0);
    expect(result.health!.temperature).toBe(35);
    expect(result.health!.uptime).toBe(3600);
    expect(result.firmware).toBe('3.0.0');
  });

  it('constructs correct URLs: /api/system and /api/ports', async () => {
    fetchMock
      .mockResolvedValueOnce(makeResponse({ temperature: 30, uptime: 100 }))
      .mockResolvedValueOnce(makeResponse({ ports: [] }));

    await adapter.queryHealth(ip);

    const calls = fetchMock.mock.calls.map((c) => c[0] as string);
    expect(calls).toContain(`http://${ip}:80/api/system`);
    expect(calls).toContain(`http://${ip}:80/api/ports`);
  });

  it('warning: temperature between 50-65C', async () => {
    fetchMock
      .mockResolvedValueOnce(makeResponse({ temperature: 60, uptime: 0 }))
      .mockResolvedValueOnce(makeResponse({ ports: [] }));

    const result = await adapter.queryHealth(ip);

    expect(result.health!.warnings.some((w) => w.includes('60C'))).toBe(true);
    expect(result.health!.errors).toHaveLength(0);
  });

  it('warning: exactly 51C is flagged', async () => {
    fetchMock
      .mockResolvedValueOnce(makeResponse({ temperature: 51, uptime: 0 }))
      .mockResolvedValueOnce(makeResponse({ ports: [] }));

    const result = await adapter.queryHealth(ip);

    expect(result.health!.warnings.some((w) => w.includes('temperature elevated'))).toBe(true);
  });

  it('warning: exactly 50C is NOT flagged (boundary)', async () => {
    fetchMock
      .mockResolvedValueOnce(makeResponse({ temperature: 50, uptime: 0 }))
      .mockResolvedValueOnce(makeResponse({ ports: [] }));

    const result = await adapter.queryHealth(ip);

    expect(result.health!.warnings.some((w) => w.includes('temperature'))).toBe(false);
    expect(result.health!.errors.some((e) => e.includes('temperature'))).toBe(false);
  });

  it('error: temperature above 65C', async () => {
    fetchMock
      .mockResolvedValueOnce(makeResponse({ temperature: 70, uptime: 0 }))
      .mockResolvedValueOnce(makeResponse({ ports: [] }));

    const result = await adapter.queryHealth(ip);

    expect(result.health!.errors.some((e) => e.includes('70C'))).toBe(true);
    expect(result.health!.warnings.some((w) => w.includes('temperature'))).toBe(false);
  });

  it('error: exactly 66C triggers error not warning', async () => {
    fetchMock
      .mockResolvedValueOnce(makeResponse({ temperature: 66, uptime: 0 }))
      .mockResolvedValueOnce(makeResponse({ ports: [] }));

    const result = await adapter.queryHealth(ip);

    expect(result.health!.errors.some((e) => e.includes('temperature'))).toBe(true);
    expect(result.health!.warnings.some((w) => w.includes('temperature'))).toBe(false);
  });

  it('warning: ports with no link detected', async () => {
    fetchMock
      .mockResolvedValueOnce(makeResponse({ temperature: 30, uptime: 0 }))
      .mockResolvedValueOnce(
        makeResponse({
          ports: [
            { id: 1, link: true },
            { id: 2, link: false },
            { id: 3, link: false },
          ],
        }),
      );

    const result = await adapter.queryHealth(ip);

    expect(result.health!.warnings.some((w) => w.includes('2 port(s) have no link'))).toBe(true);
  });

  it('warning: single port down', async () => {
    fetchMock
      .mockResolvedValueOnce(makeResponse({ temperature: 30, uptime: 0 }))
      .mockResolvedValueOnce(makeResponse({ ports: [{ id: 1, link: false }] }));

    const result = await adapter.queryHealth(ip);

    expect(result.health!.warnings.some((w) => w.includes('1 port(s) have no link'))).toBe(true);
  });

  it('no warning when all ports have link', async () => {
    fetchMock
      .mockResolvedValueOnce(makeResponse({ temperature: 30, uptime: 0 }))
      .mockResolvedValueOnce(
        makeResponse({
          ports: [
            { id: 1, link: true },
            { id: 2, link: true },
            { id: 3, link: true },
          ],
        }),
      );

    const result = await adapter.queryHealth(ip);

    expect(result.health!.warnings.some((w) => w.includes('port'))).toBe(false);
  });

  it('no warning when ports array is empty', async () => {
    fetchMock
      .mockResolvedValueOnce(makeResponse({ temperature: 30, uptime: 0 }))
      .mockResolvedValueOnce(makeResponse({ ports: [] }));

    const result = await adapter.queryHealth(ip);

    expect(result.health!.warnings.some((w) => w.includes('port'))).toBe(false);
  });

  it('both endpoints fail: returns unreachable', async () => {
    fetchMock
      .mockResolvedValueOnce(makeErrorResponse(503))
      .mockResolvedValueOnce(makeErrorResponse(503));

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(false);
    expect(result.health).toBeNull();
  });

  it('network failure: returns unreachable', async () => {
    fetchMock.mockRejectedValue(new Error('Network error'));

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(false);
    expect(result.health).toBeNull();
  });

  it('system endpoint succeeds, ports endpoint fails: still reachable', async () => {
    fetchMock
      .mockResolvedValueOnce(makeResponse({ temperature: 30, uptime: 100 }))
      .mockResolvedValueOnce(makeErrorResponse(404));

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(true);
    expect(result.health!.temperature).toBe(30);
  });

  it('AbortController signal is passed to fetch', async () => {
    // Set the implementation BEFORE calling queryHealth so both calls go through it
    fetchMock.mockImplementation((_url, init) => {
      return Promise.resolve(makeResponse({ temperature: 30, uptime: 0, ports: [] }));
    });

    await adapter.queryHealth(ip);

    // Verify that every fetch call received a signal (AbortController is wired up)
    for (const call of fetchMock.mock.calls) {
      const init = call[1] as RequestInit | undefined;
      expect(init?.signal).toBeInstanceOf(AbortSignal);
    }
  });

  it('missing ports field in port response: no port warnings', async () => {
    fetchMock
      .mockResolvedValueOnce(makeResponse({ temperature: 30, uptime: 0 }))
      .mockResolvedValueOnce(makeResponse({ some_other_field: true }));

    const result = await adapter.queryHealth(ip);

    expect(result.health!.warnings.some((w) => w.includes('port'))).toBe(false);
  });
});

// ===========================================================================
// NETGEAR ADAPTER
// ===========================================================================
describe('NetgearAdapter', () => {
  const adapter = new NetgearAdapter();
  const ip = '10.0.1.1';

  it('has the correct manufacturer identifier', () => {
    expect(adapter.manufacturer).toBe('netgear');
  });

  it('happy path: system info, moderate temp, PoE in budget', async () => {
    fetchMock.mockResolvedValueOnce(
      makeResponse({
        model: 'M4250-26G4F-PoE+',
        firmware: '13.0.0.12',
        serial: 'XYZ789',
        uptime: 86400,
        temperature: 40,
        fan_status: 'ok',
        poe_budget: 370,
        poe_consumed: 100,
      }),
    );

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(true);
    expect(result.health!.errors).toHaveLength(0);
    expect(result.health!.warnings).toHaveLength(0);
    expect(result.health!.temperature).toBe(40);
    expect(result.health!.uptime).toBe(86400);
    expect(result.health!.powerDraw).toBe(100);
    expect(result.firmware).toBe('13.0.0.12');
  });

  it('constructs correct URL: /api/system', async () => {
    fetchMock.mockResolvedValueOnce(makeResponse({ temperature: 30, uptime: 0 }));

    await adapter.queryHealth(ip);

    expect(fetchMock).toHaveBeenCalledWith(
      `http://${ip}:80/api/system`,
      expect.any(Object),
    );
  });

  it('warning: temperature between 55-70C', async () => {
    fetchMock.mockResolvedValueOnce(makeResponse({ temperature: 60, uptime: 0 }));

    const result = await adapter.queryHealth(ip);

    expect(result.health!.warnings.some((w) => w.includes('60C'))).toBe(true);
    expect(result.health!.errors).toHaveLength(0);
  });

  it('warning: exactly 56C is flagged', async () => {
    fetchMock.mockResolvedValueOnce(makeResponse({ temperature: 56, uptime: 0 }));

    const result = await adapter.queryHealth(ip);

    expect(result.health!.warnings.some((w) => w.includes('temperature elevated'))).toBe(true);
  });

  it('warning: exactly 55C is NOT flagged (boundary)', async () => {
    fetchMock.mockResolvedValueOnce(makeResponse({ temperature: 55, uptime: 0 }));

    const result = await adapter.queryHealth(ip);

    expect(result.health!.warnings.some((w) => w.includes('temperature'))).toBe(false);
    expect(result.health!.errors.some((e) => e.includes('temperature'))).toBe(false);
  });

  it('error: temperature above 70C', async () => {
    fetchMock.mockResolvedValueOnce(makeResponse({ temperature: 75, uptime: 0 }));

    const result = await adapter.queryHealth(ip);

    expect(result.health!.errors.some((e) => e.includes('75C'))).toBe(true);
  });

  it('error: exactly 71C triggers error', async () => {
    fetchMock.mockResolvedValueOnce(makeResponse({ temperature: 71, uptime: 0 }));

    const result = await adapter.queryHealth(ip);

    expect(result.health!.errors.some((e) => e.includes('temperature'))).toBe(true);
    expect(result.health!.warnings.some((w) => w.includes('temperature'))).toBe(false);
  });

  it('warning: PoE budget >90% consumed', async () => {
    fetchMock.mockResolvedValueOnce(
      makeResponse({
        temperature: 40,
        uptime: 0,
        poe_budget: 370,
        poe_consumed: 340,
      }),
    );

    const result = await adapter.queryHealth(ip);

    // 340/370 = ~91.9%
    expect(result.health!.warnings.some((w) => w.includes('PoE budget'))).toBe(true);
    expect(result.health!.warnings.some((w) => w.includes('%'))).toBe(true);
  });

  it('no PoE warning when under 90%', async () => {
    fetchMock.mockResolvedValueOnce(
      makeResponse({
        temperature: 40,
        uptime: 0,
        poe_budget: 370,
        poe_consumed: 300,
      }),
    );

    const result = await adapter.queryHealth(ip);

    // 300/370 = ~81%
    expect(result.health!.warnings.some((w) => w.includes('PoE'))).toBe(false);
  });

  it('PoE warning at exactly 91%', async () => {
    fetchMock.mockResolvedValueOnce(
      makeResponse({
        temperature: 40,
        uptime: 0,
        poe_budget: 100,
        poe_consumed: 91,
      }),
    );

    const result = await adapter.queryHealth(ip);

    expect(result.health!.warnings.some((w) => w.includes('PoE budget'))).toBe(true);
  });

  it('no PoE check when poe_budget is absent', async () => {
    fetchMock.mockResolvedValueOnce(
      makeResponse({ temperature: 40, uptime: 0, poe_consumed: 100 }),
    );

    const result = await adapter.queryHealth(ip);

    expect(result.health!.warnings.some((w) => w.includes('PoE'))).toBe(false);
  });

  it('no PoE check when poe_consumed is absent', async () => {
    fetchMock.mockResolvedValueOnce(
      makeResponse({ temperature: 40, uptime: 0, poe_budget: 370 }),
    );

    const result = await adapter.queryHealth(ip);

    expect(result.health!.warnings.some((w) => w.includes('PoE'))).toBe(false);
  });

  it('sysInfo null (404 response): returns unreachable', async () => {
    fetchMock.mockResolvedValueOnce(makeErrorResponse(404));

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(false);
    expect(result.health).toBeNull();
  });

  it('network failure: returns unreachable', async () => {
    fetchMock.mockRejectedValueOnce(new Error('ECONNREFUSED'));

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(false);
    expect(result.health).toBeNull();
  });

  it('AbortController signal is passed to fetch', async () => {
    fetchMock.mockImplementation((_url, init) => {
      expect(init?.signal).toBeDefined();
      return Promise.resolve(makeResponse({ temperature: 40, uptime: 0 }));
    });

    await adapter.queryHealth(ip);
  });

  it('malformed JSON response: returns unreachable', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => { throw new SyntaxError('Bad JSON'); },
    } as unknown as Response);

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(false);
    expect(result.health).toBeNull();
  });
});

// ===========================================================================
// SONIFEX ADAPTER
// ===========================================================================
describe('SonifexAdapter', () => {
  const adapter = new SonifexAdapter();
  const ip = '192.168.10.5';

  it('has the correct manufacturer identifier', () => {
    expect(adapter.manufacturer).toBe('sonifex');
  });

  it('happy path: status OK, dante connected, normal temp', async () => {
    fetchMock.mockResolvedValueOnce(
      makeResponse({
        model: 'RB-MADI2',
        firmware: '2.3.1',
        uptime: 7200,
        temperature: 35,
        dante_status: 'connected',
        channel_count: 32,
      }),
    );

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(true);
    expect(result.health!.errors).toHaveLength(0);
    expect(result.health!.warnings).toHaveLength(0);
    expect(result.health!.temperature).toBe(35);
    expect(result.health!.uptime).toBe(7200);
    expect(result.firmware).toBe('2.3.1');
  });

  it('constructs correct URL: /api/status', async () => {
    fetchMock.mockResolvedValueOnce(makeResponse({ temperature: 30, uptime: 0 }));

    await adapter.queryHealth(ip);

    expect(fetchMock).toHaveBeenCalledWith(
      `http://${ip}:80/api/status`,
      expect.any(Object),
    );
  });

  it('warning: dante_status is not "connected"', async () => {
    fetchMock.mockResolvedValueOnce(
      makeResponse({ temperature: 30, uptime: 0, dante_status: 'disconnected' }),
    );

    const result = await adapter.queryHealth(ip);

    expect(result.health!.warnings.some((w) => w.includes('Dante network'))).toBe(true);
    expect(result.health!.warnings.some((w) => w.includes('disconnected'))).toBe(true);
  });

  it('warning: dante_status is "searching"', async () => {
    fetchMock.mockResolvedValueOnce(
      makeResponse({ temperature: 30, uptime: 0, dante_status: 'searching' }),
    );

    const result = await adapter.queryHealth(ip);

    expect(result.health!.warnings.some((w) => w.includes('Dante network'))).toBe(true);
  });

  it('no dante warning when dante_status is absent', async () => {
    fetchMock.mockResolvedValueOnce(
      makeResponse({ temperature: 30, uptime: 0 }),
    );

    const result = await adapter.queryHealth(ip);

    expect(result.health!.warnings.some((w) => w.includes('Dante'))).toBe(false);
  });

  it('warning: temperature between 40-55C', async () => {
    fetchMock.mockResolvedValueOnce(
      makeResponse({ temperature: 45, uptime: 0, dante_status: 'connected' }),
    );

    const result = await adapter.queryHealth(ip);

    expect(result.health!.warnings.some((w) => w.includes('45C'))).toBe(true);
    expect(result.health!.errors).toHaveLength(0);
  });

  it('warning: exactly 41C is flagged', async () => {
    fetchMock.mockResolvedValueOnce(makeResponse({ temperature: 41, uptime: 0 }));

    const result = await adapter.queryHealth(ip);

    expect(result.health!.warnings.some((w) => w.includes('temperature elevated'))).toBe(true);
  });

  it('warning: exactly 40C is NOT flagged (boundary)', async () => {
    fetchMock.mockResolvedValueOnce(makeResponse({ temperature: 40, uptime: 0 }));

    const result = await adapter.queryHealth(ip);

    expect(result.health!.warnings.some((w) => w.includes('temperature'))).toBe(false);
    expect(result.health!.errors.some((e) => e.includes('temperature'))).toBe(false);
  });

  it('error: temperature above 55C', async () => {
    fetchMock.mockResolvedValueOnce(
      makeResponse({ temperature: 60, uptime: 0 }),
    );

    const result = await adapter.queryHealth(ip);

    expect(result.health!.errors.some((e) => e.includes('60C'))).toBe(true);
    expect(result.health!.warnings.some((w) => w.includes('temperature'))).toBe(false);
  });

  it('error: exactly 56C triggers error not warning', async () => {
    fetchMock.mockResolvedValueOnce(makeResponse({ temperature: 56, uptime: 0 }));

    const result = await adapter.queryHealth(ip);

    expect(result.health!.errors.some((e) => e.includes('temperature'))).toBe(true);
    expect(result.health!.warnings.some((w) => w.includes('temperature'))).toBe(false);
  });

  it('status null (404 response): returns unreachable', async () => {
    fetchMock.mockResolvedValueOnce(makeErrorResponse(404));

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(false);
    expect(result.health).toBeNull();
  });

  it('network failure: returns unreachable', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Network error'));

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(false);
    expect(result.health).toBeNull();
  });

  it('AbortController signal is passed to fetch', async () => {
    fetchMock.mockImplementation((_url, init) => {
      expect(init?.signal).toBeDefined();
      return Promise.resolve(makeResponse({ temperature: 30, uptime: 0 }));
    });

    await adapter.queryHealth(ip);
  });

  it('dante_status = "connected" emits no warning', async () => {
    fetchMock.mockResolvedValueOnce(
      makeResponse({ temperature: 30, uptime: 0, dante_status: 'connected' }),
    );

    const result = await adapter.queryHealth(ip);

    expect(result.health!.warnings).toHaveLength(0);
  });

  it('accumulates dante warning + temp warning together', async () => {
    fetchMock.mockResolvedValueOnce(
      makeResponse({ temperature: 45, uptime: 0, dante_status: 'disconnected' }),
    );

    const result = await adapter.queryHealth(ip);

    expect(result.health!.warnings).toHaveLength(2);
  });
});

// ===========================================================================
// ADDER ADAPTER
// ===========================================================================
describe('AdderAdapter', () => {
  const adapter = new AdderAdapter();
  const ip = '10.10.10.1';

  it('has the correct manufacturer identifier', () => {
    expect(adapter.manufacturer).toBe('adder');
  });

  it('happy path: info OK, link up, normal temp', async () => {
    fetchMock.mockResolvedValueOnce(
      makeResponse({
        model: 'ALIF3000',
        firmware: '4.2.0',
        serial: 'ADR001',
        uptime: 86400,
        temperature: 38,
        connections: 2,
        link_status: 'up',
      }),
    );

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(true);
    expect(result.health!.errors).toHaveLength(0);
    expect(result.health!.warnings).toHaveLength(0);
    expect(result.health!.temperature).toBe(38);
    expect(result.health!.uptime).toBe(86400);
    expect(result.firmware).toBe('4.2.0');
  });

  it('constructs correct URL: /api/device/info', async () => {
    fetchMock.mockResolvedValueOnce(
      makeResponse({ temperature: 30, uptime: 0, link_status: 'up' }),
    );

    await adapter.queryHealth(ip);

    expect(fetchMock).toHaveBeenCalledWith(
      `http://${ip}:80/api/device/info`,
      expect.any(Object),
    );
  });

  it('warning: KVM link is down', async () => {
    fetchMock.mockResolvedValueOnce(
      makeResponse({ temperature: 30, uptime: 0, link_status: 'down' }),
    );

    const result = await adapter.queryHealth(ip);

    expect(result.health!.warnings).toContain('KVM link is down');
  });

  it('no warning when link_status is "up"', async () => {
    fetchMock.mockResolvedValueOnce(
      makeResponse({ temperature: 30, uptime: 0, link_status: 'up' }),
    );

    const result = await adapter.queryHealth(ip);

    expect(result.health!.warnings.some((w) => w.includes('KVM link'))).toBe(false);
  });

  it('no warning when link_status is absent', async () => {
    fetchMock.mockResolvedValueOnce(
      makeResponse({ temperature: 30, uptime: 0 }),
    );

    const result = await adapter.queryHealth(ip);

    expect(result.health!.warnings.some((w) => w.includes('KVM link'))).toBe(false);
  });

  it('warning: temperature between 45-60C', async () => {
    fetchMock.mockResolvedValueOnce(
      makeResponse({ temperature: 50, uptime: 0, link_status: 'up' }),
    );

    const result = await adapter.queryHealth(ip);

    expect(result.health!.warnings.some((w) => w.includes('50C'))).toBe(true);
    expect(result.health!.errors).toHaveLength(0);
  });

  it('warning: exactly 46C is flagged', async () => {
    fetchMock.mockResolvedValueOnce(makeResponse({ temperature: 46, uptime: 0 }));

    const result = await adapter.queryHealth(ip);

    expect(result.health!.warnings.some((w) => w.includes('temperature elevated'))).toBe(true);
  });

  it('warning: exactly 45C is NOT flagged (boundary)', async () => {
    fetchMock.mockResolvedValueOnce(makeResponse({ temperature: 45, uptime: 0 }));

    const result = await adapter.queryHealth(ip);

    expect(result.health!.warnings.some((w) => w.includes('temperature'))).toBe(false);
    expect(result.health!.errors.some((e) => e.includes('temperature'))).toBe(false);
  });

  it('error: temperature above 60C', async () => {
    fetchMock.mockResolvedValueOnce(
      makeResponse({ temperature: 65, uptime: 0 }),
    );

    const result = await adapter.queryHealth(ip);

    expect(result.health!.errors.some((e) => e.includes('65C'))).toBe(true);
    expect(result.health!.warnings.some((w) => w.includes('temperature'))).toBe(false);
  });

  it('error: exactly 61C triggers error not warning', async () => {
    fetchMock.mockResolvedValueOnce(makeResponse({ temperature: 61, uptime: 0 }));

    const result = await adapter.queryHealth(ip);

    expect(result.health!.errors.some((e) => e.includes('temperature'))).toBe(true);
    expect(result.health!.warnings.some((w) => w.includes('temperature'))).toBe(false);
  });

  it('KVM down + high temp: accumulates both warnings', async () => {
    fetchMock.mockResolvedValueOnce(
      makeResponse({ temperature: 50, uptime: 0, link_status: 'down' }),
    );

    const result = await adapter.queryHealth(ip);

    expect(result.health!.warnings).toHaveLength(2);
    expect(result.health!.warnings).toContain('KVM link is down');
    expect(result.health!.warnings.some((w) => w.includes('temperature'))).toBe(true);
  });

  it('info null (404 response): returns unreachable', async () => {
    fetchMock.mockResolvedValueOnce(makeErrorResponse(404));

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(false);
    expect(result.health).toBeNull();
  });

  it('network failure: returns unreachable', async () => {
    fetchMock.mockRejectedValueOnce(new Error('ECONNREFUSED'));

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(false);
    expect(result.health).toBeNull();
  });

  it('AbortController signal is passed to fetch', async () => {
    fetchMock.mockImplementation((_url, init) => {
      expect(init?.signal).toBeDefined();
      return Promise.resolve(
        makeResponse({ temperature: 30, uptime: 0, link_status: 'up' }),
      );
    });

    await adapter.queryHealth(ip);
  });

  it('malformed JSON: returns unreachable', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => { throw new SyntaxError('Bad JSON'); },
    } as unknown as Response);

    const result = await adapter.queryHealth(ip);

    expect(result.reachable).toBe(false);
  });

  it('custom port is used in URL', async () => {
    fetchMock.mockResolvedValueOnce(
      makeResponse({ temperature: 30, uptime: 0 }),
    );

    await adapter.queryHealth(ip, 8081);

    expect(fetchMock).toHaveBeenCalledWith(
      `http://${ip}:8081/api/device/info`,
      expect.any(Object),
    );
  });
});

// ===========================================================================
// INDEX: All 7 manufacturers are mapped
// ===========================================================================
describe('Adapter index mapping', () => {
  it('all 7 Team D manufacturers are mapped in the adapter registry', async () => {
    // Dynamic import to avoid circular dependency issues in test context
    const { getAdapter } = await import('../index');

    const teamDManufacturers = ['shure', 'qsc', 'audinate', 'luminex', 'netgear', 'sonifex', 'adder'] as const;
    for (const mfr of teamDManufacturers) {
      const adapter = getAdapter(mfr as Parameters<typeof getAdapter>[0]);
      expect(adapter).toBeDefined();
      expect(typeof adapter.queryHealth).toBe('function');
      expect(adapter.manufacturer).toBe(mfr);
    }
  });
});
