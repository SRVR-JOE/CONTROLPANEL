/**
 * camera-display.test.ts
 *
 * Comprehensive tests for the 5 camera/display manufacturer adapters:
 *   - Panasonic (PTZ cameras — CGI over HTTP)
 *   - Sony (PTZ cameras — HTTP REST with VISCA fallback message)
 *   - Christie (projectors — HTTP REST JSON)
 *   - Epson (projectors — CGI over HTTP with ESC/VP.net fallback message)
 *   - Avitech (multiviewers — HTTP REST JSON)
 *
 * All fetch calls are mocked with vi.fn(). No real network calls are made.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { PanasonicAdapter } from '../panasonic';
import { SonyAdapter } from '../sony';
import { ChristieAdapter } from '../christie';
import { EpsonAdapter } from '../epson';
import { AvitechAdapter } from '../avitech';

// ============================================================
// Helper: build a minimal mock Response
// ============================================================

function mockResponse(
  body: string,
  options: { status?: number; ok?: boolean } = {}
): Response {
  const status = options.status ?? 200;
  const ok = options.ok ?? (status >= 200 && status < 300);
  return {
    ok,
    status,
    text: async () => body,
    json: async () => JSON.parse(body),
  } as unknown as Response;
}

function mockJsonResponse(data: unknown, status = 200): Response {
  return mockResponse(JSON.stringify(data), { status });
}

function mockErrorResponse(status: number, body = 'error'): Response {
  return mockResponse(body, { status, ok: false });
}

// ============================================================
// Setup
// ============================================================

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ============================================================
// PANASONIC ADAPTER
// ============================================================

describe('PanasonicAdapter', () => {
  let adapter: PanasonicAdapter;

  beforeEach(() => {
    adapter = new PanasonicAdapter();
  });

  it('has manufacturer set to "panasonic"', () => {
    expect(adapter.manufacturer).toBe('panasonic');
  });

  it('happy path: power on + model ID returned', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(mockResponse('p1'))               // aw_ptz power query
      .mockResolvedValueOnce(mockResponse('OID:AW-UE150'));    // aw_cam model query

    vi.stubGlobal('fetch', fetchMock);

    const result = await adapter.queryHealth('192.168.1.10', 80);

    expect(result.reachable).toBe(true);
    expect(result.health).not.toBeNull();
    expect(result.health!.warnings).toHaveLength(0);
    expect(result.health!.errors).toHaveLength(0);
    expect(result.firmware).toBe('AW-UE150');
  });

  it('correctly constructs CGI URLs with ip and port', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(mockResponse('p1'))
      .mockResolvedValueOnce(mockResponse('OID:AW-HE40'));

    vi.stubGlobal('fetch', fetchMock);

    await adapter.queryHealth('10.0.1.50', 8080);

    const calls = fetchMock.mock.calls;
    expect(calls[0][0]).toContain('http://10.0.1.50:8080');
    expect(calls[0][0]).toContain('/cgi-bin/aw_ptz?cmd=%23O&res=1');
    expect(calls[1][0]).toContain('/cgi-bin/aw_cam?cmd=QID&res=1');
  });

  it('standby mode: power response "p0" generates a warning', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(mockResponse('p0'))
      .mockResolvedValueOnce(mockResponse('OID:AW-UE150'));

    vi.stubGlobal('fetch', fetchMock);

    const result = await adapter.queryHealth('192.168.1.10');

    expect(result.reachable).toBe(true);
    expect(result.health!.warnings).toContain('Camera in standby mode');
    expect(result.health!.errors).toHaveLength(0);
  });

  it('standby: off response with trailing whitespace also generates a warning', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(mockResponse('p0\r\n'))
      .mockResolvedValueOnce(mockResponse('OID:AW-UE80'));

    vi.stubGlobal('fetch', fetchMock);

    const result = await adapter.queryHealth('192.168.1.10');

    expect(result.reachable).toBe(true);
    expect(result.health!.warnings).toContain('Camera in standby mode');
  });

  it('model query fails gracefully: still reachable from power query', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(mockResponse('p1'))
      .mockRejectedValueOnce(new Error('ECONNREFUSED'));

    vi.stubGlobal('fetch', fetchMock);

    const result = await adapter.queryHealth('192.168.1.10');

    expect(result.reachable).toBe(true);
    expect(result.firmware).toBeUndefined();
  });

  it('power query fails gracefully: still reachable from model query', async () => {
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(mockResponse('OID:AW-UE150'));

    vi.stubGlobal('fetch', fetchMock);

    const result = await adapter.queryHealth('192.168.1.10');

    expect(result.reachable).toBe(true);
    // Power query failed so powerOn defaults to false — warning expected
    expect(result.health!.warnings).toContain('Camera in standby mode');
    expect(result.firmware).toBe('AW-UE150');
  });

  it('both queries fail: returns not reachable', async () => {
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new Error('ECONNREFUSED'))
      .mockRejectedValueOnce(new Error('ECONNREFUSED'));

    vi.stubGlobal('fetch', fetchMock);

    const result = await adapter.queryHealth('192.168.1.10');

    expect(result.reachable).toBe(false);
    expect(result.health).toBeNull();
  });

  it('non-ok HTTP response on power query: device is not counted as reachable from that call', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(mockErrorResponse(404))
      .mockRejectedValueOnce(new Error('unreachable'));

    vi.stubGlobal('fetch', fetchMock);

    const result = await adapter.queryHealth('192.168.1.10');

    expect(result.reachable).toBe(false);
    expect(result.health).toBeNull();
  });

  it('malformed power response (neither p0 nor p1): treated as standby', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(mockResponse('ERROR'))
      .mockResolvedValueOnce(mockResponse('OID:AW-UE150'));

    vi.stubGlobal('fetch', fetchMock);

    const result = await adapter.queryHealth('192.168.1.10');

    expect(result.reachable).toBe(true);
    // No "p1" in response so powerOn = false — should warn
    expect(result.health!.warnings).toContain('Camera in standby mode');
  });

  it('OID without prefix in model response: firmware is undefined', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(mockResponse('p1'))
      .mockResolvedValueOnce(mockResponse('UNKNOWN_FORMAT'));

    vi.stubGlobal('fetch', fetchMock);

    const result = await adapter.queryHealth('192.168.1.10');

    expect(result.reachable).toBe(true);
    expect(result.firmware).toBeUndefined();
  });

  it('uses default port 80 when no port supplied', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(mockResponse('p1'))
      .mockResolvedValueOnce(mockResponse('OID:AW-UE150'));

    vi.stubGlobal('fetch', fetchMock);

    await adapter.queryHealth('192.168.1.10');

    expect(fetchMock.mock.calls[0][0]).toContain(':80/');
  });

  it('timeout: AbortController signal is passed to fetch', async () => {
    let capturedSignal: AbortSignal | undefined;

    const fetchMock = vi.fn().mockImplementation((_url: string, opts: RequestInit) => {
      capturedSignal = opts.signal as AbortSignal;
      return Promise.resolve(mockResponse('p1'));
    });

    vi.stubGlobal('fetch', fetchMock);

    await adapter.queryHealth('192.168.1.10');

    expect(capturedSignal).toBeDefined();
    expect(capturedSignal).toBeInstanceOf(AbortSignal);
  });

  it('health object has correct shape', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(mockResponse('p1'))
      .mockResolvedValueOnce(mockResponse('OID:AW-UE150'));

    vi.stubGlobal('fetch', fetchMock);

    const result = await adapter.queryHealth('192.168.1.10');

    expect(result.health).toMatchObject({
      temperature: expect.any(Number),
      uptime: expect.any(Number),
      errors: expect.any(Array),
      warnings: expect.any(Array),
    });
  });
});

// ============================================================
// SONY ADAPTER
// ============================================================

describe('SonyAdapter', () => {
  let adapter: SonyAdapter;

  beforeEach(() => {
    adapter = new SonyAdapter();
  });

  it('has manufacturer set to "sony"', () => {
    expect(adapter.manufacturer).toBe('sony');
  });

  it('happy path: HTTP REST returns 200 — reachable with health', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(mockResponse('{"power":"on"}')));

    const result = await adapter.queryHealth('192.168.1.20', 80);

    expect(result.reachable).toBe(true);
    expect(result.health).not.toBeNull();
    expect(result.health!.errors).toHaveLength(0);
    expect(result.health!.warnings).toHaveLength(0);
  });

  it('HTTP REST hits correct URL', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(mockResponse('ok'));
    vi.stubGlobal('fetch', fetchMock);

    await adapter.queryHealth('10.0.2.30', 80);

    expect(fetchMock.mock.calls[0][0]).toContain('http://10.0.2.30:80/command/inquiry.cgi?inq=system');
  });

  it('HTTP 404: falls through to VISCA not-implemented error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(mockErrorResponse(404)));

    const result = await adapter.queryHealth('192.168.1.20');

    expect(result.reachable).toBe(false);
    expect(result.health).toBeNull();
    expect(result.errors).toBeDefined();
    expect(result.errors![0]).toContain('VISCA');
  });

  it('HTTP 401: falls through to VISCA error with clear message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(mockErrorResponse(401)));

    const result = await adapter.queryHealth('192.168.1.20');

    expect(result.reachable).toBe(false);
    expect(result.errors![0]).toContain('VISCA protocol not implemented');
  });

  it('network failure: falls through to VISCA not-implemented error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new Error('ECONNREFUSED')));

    const result = await adapter.queryHealth('192.168.1.20');

    expect(result.reachable).toBe(false);
    expect(result.health).toBeNull();
    expect(result.errors).toBeDefined();
    expect(result.errors![0]).toContain('VISCA');
  });

  it('timeout: falls through to VISCA error, not a crash', async () => {
    const abortError = new DOMException('The operation was aborted', 'AbortError');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(abortError));

    const result = await adapter.queryHealth('192.168.1.20');

    expect(result.reachable).toBe(false);
    expect(result.errors![0]).toContain('VISCA');
  });

  it('VISCA error message mentions device may be online', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new Error('ECONNREFUSED')));

    const result = await adapter.queryHealth('192.168.1.20');

    expect(result.errors![0]).toMatch(/device may be online/i);
  });

  it('AbortController signal is passed to fetch', async () => {
    let capturedSignal: AbortSignal | undefined;

    const fetchMock = vi.fn().mockImplementation((_url: string, opts: RequestInit) => {
      capturedSignal = opts.signal as AbortSignal;
      return Promise.resolve(mockResponse('ok'));
    });

    vi.stubGlobal('fetch', fetchMock);

    await adapter.queryHealth('192.168.1.20');

    expect(capturedSignal).toBeDefined();
    expect(capturedSignal).toBeInstanceOf(AbortSignal);
  });

  it('health object from successful query has correct shape', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(mockResponse('ok')));

    const result = await adapter.queryHealth('192.168.1.20');

    expect(result.health).toMatchObject({
      temperature: expect.any(Number),
      uptime: expect.any(Number),
      errors: expect.any(Array),
      warnings: expect.any(Array),
    });
  });
});

// ============================================================
// CHRISTIE ADAPTER
// ============================================================

describe('ChristieAdapter', () => {
  let adapter: ChristieAdapter;

  beforeEach(() => {
    adapter = new ChristieAdapter();
  });

  it('has manufacturer set to "christie"', () => {
    expect(adapter.manufacturer).toBe('christie');
  });

  it('happy path: normal temperature, power on — no warnings or errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(mockJsonResponse({
      status: 'running',
      temperature: 45,
      power: 'on',
      lampHours: 500,
      firmwareVersion: '1.2.3',
    })));

    const result = await adapter.queryHealth('192.168.1.30', 80);

    expect(result.reachable).toBe(true);
    expect(result.health!.errors).toHaveLength(0);
    expect(result.health!.warnings).toHaveLength(0);
    expect(result.firmware).toBe('1.2.3');
  });

  it('queries correct endpoint /api/status', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(mockJsonResponse({ temperature: 40 }));
    vi.stubGlobal('fetch', fetchMock);

    await adapter.queryHealth('10.0.1.30', 80);

    expect(fetchMock.mock.calls[0][0]).toContain('http://10.0.1.30:80/api/status');
  });

  it('temperature warning: 60-80C generates a warning, not an error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(mockJsonResponse({
      temperature: 70,
      power: 'on',
    })));

    const result = await adapter.queryHealth('192.168.1.30');

    expect(result.reachable).toBe(true);
    expect(result.health!.warnings).toHaveLength(1);
    expect(result.health!.warnings[0]).toContain('70C');
    expect(result.health!.errors).toHaveLength(0);
  });

  it('temperature error: >80C generates an error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(mockJsonResponse({
      temperature: 85,
      power: 'on',
    })));

    const result = await adapter.queryHealth('192.168.1.30');

    expect(result.reachable).toBe(true);
    expect(result.health!.errors).toHaveLength(1);
    expect(result.health!.errors[0]).toContain('85C');
    expect(result.health!.warnings).toHaveLength(0);
  });

  it('temperature at 61C: above warning threshold, generates a warning', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(mockJsonResponse({
      temperature: 61,
      power: 'on',
    })));

    const result = await adapter.queryHealth('192.168.1.30');

    expect(result.health!.warnings).toHaveLength(1);
    expect(result.health!.errors).toHaveLength(0);
  });

  it('temperature at 81C: above error threshold, generates an error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(mockJsonResponse({
      temperature: 81,
      power: 'on',
    })));

    const result = await adapter.queryHealth('192.168.1.30');

    expect(result.health!.errors).toHaveLength(1);
    expect(result.health!.warnings).toHaveLength(0);
  });

  it('standby power state: generates a warning', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(mockJsonResponse({
      temperature: 40,
      power: 'standby',
    })));

    const result = await adapter.queryHealth('192.168.1.30');

    expect(result.reachable).toBe(true);
    expect(result.health!.warnings).toContain('Projector in standby');
    expect(result.health!.errors).toHaveLength(0);
  });

  it('off power state: also generates a warning', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(mockJsonResponse({
      temperature: 40,
      power: 'off',
    })));

    const result = await adapter.queryHealth('192.168.1.30');

    expect(result.health!.warnings).toContain('Projector in standby');
  });

  it('high temperature AND standby: both warning and error present simultaneously', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(mockJsonResponse({
      temperature: 85,
      power: 'standby',
    })));

    const result = await adapter.queryHealth('192.168.1.30');

    expect(result.health!.errors).toHaveLength(1);
    expect(result.health!.warnings).toHaveLength(1);
  });

  it('missing temperature field defaults to 0 — no threshold alerts', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(mockJsonResponse({
      power: 'on',
    })));

    const result = await adapter.queryHealth('192.168.1.30');

    expect(result.health!.temperature).toBe(0);
    expect(result.health!.errors).toHaveLength(0);
    expect(result.health!.warnings).toHaveLength(0);
  });

  it('network failure: returns not reachable, health null', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new Error('ECONNREFUSED')));

    const result = await adapter.queryHealth('192.168.1.30');

    expect(result.reachable).toBe(false);
    expect(result.health).toBeNull();
  });

  it('HTTP 500 response: returns not reachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(mockErrorResponse(500)));

    const result = await adapter.queryHealth('192.168.1.30');

    expect(result.reachable).toBe(false);
    expect(result.health).toBeNull();
  });

  it('non-JSON response body: returns not reachable without crash', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => { throw new SyntaxError('Unexpected token'); },
    } as unknown as Response));

    const result = await adapter.queryHealth('192.168.1.30');

    expect(result.reachable).toBe(false);
    expect(result.health).toBeNull();
  });

  it('empty JSON body {}: returns reachable with zeroed health', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(mockJsonResponse({})));

    const result = await adapter.queryHealth('192.168.1.30');

    expect(result.reachable).toBe(true);
    expect(result.health!.temperature).toBe(0);
    expect(result.health!.errors).toHaveLength(0);
    expect(result.health!.warnings).toHaveLength(0);
  });

  it('returns firmware from firmwareVersion field', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(mockJsonResponse({
      temperature: 40,
      power: 'on',
      firmwareVersion: '2.5.1-rc3',
    })));

    const result = await adapter.queryHealth('192.168.1.30');

    expect(result.firmware).toBe('2.5.1-rc3');
  });

  it('AbortController signal is passed to fetch', async () => {
    let capturedSignal: AbortSignal | undefined;

    const fetchMock = vi.fn().mockImplementation((_url: string, opts: RequestInit) => {
      capturedSignal = opts.signal as AbortSignal;
      return Promise.resolve(mockJsonResponse({ temperature: 40 }));
    });

    vi.stubGlobal('fetch', fetchMock);

    await adapter.queryHealth('192.168.1.30');

    expect(capturedSignal).toBeDefined();
    expect(capturedSignal).toBeInstanceOf(AbortSignal);
  });
});

// ============================================================
// EPSON ADAPTER
// ============================================================

describe('EpsonAdapter', () => {
  let adapter: EpsonAdapter;

  beforeEach(() => {
    adapter = new EpsonAdapter();
  });

  it('has manufacturer set to "epson"', () => {
    expect(adapter.manufacturer).toBe('epson');
  });

  it('happy path: CGI HTTP returns 200 — reachable with health', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(mockResponse('<html>status ok</html>')));

    const result = await adapter.queryHealth('192.168.1.40', 80);

    expect(result.reachable).toBe(true);
    expect(result.health).not.toBeNull();
    expect(result.health!.errors).toHaveLength(0);
    expect(result.health!.warnings).toHaveLength(0);
  });

  it('queries correct CGI URL', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(mockResponse('ok'));
    vi.stubGlobal('fetch', fetchMock);

    await adapter.queryHealth('10.0.1.40', 80);

    expect(fetchMock.mock.calls[0][0]).toContain('http://10.0.1.40:80/cgi-bin/webconf.exe?page=status');
  });

  it('CGI 404: falls through to ESC/VP.net not-implemented error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(mockErrorResponse(404)));

    const result = await adapter.queryHealth('192.168.1.40');

    expect(result.reachable).toBe(false);
    expect(result.health).toBeNull();
    expect(result.errors).toBeDefined();
    expect(result.errors![0]).toContain('ESC/VP.net');
  });

  it('network failure: falls through to ESC/VP.net error with clear message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new Error('EHOSTUNREACH')));

    const result = await adapter.queryHealth('192.168.1.40');

    expect(result.reachable).toBe(false);
    expect(result.errors![0]).toContain('ESC/VP.net protocol not implemented');
  });

  it('timeout: falls through to ESC/VP.net error gracefully', async () => {
    const abortError = new DOMException('The operation was aborted', 'AbortError');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(abortError));

    const result = await adapter.queryHealth('192.168.1.40');

    expect(result.reachable).toBe(false);
    expect(result.errors![0]).toContain('ESC/VP.net');
  });

  it('ESC/VP.net error message mentions device may be online', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new Error('ECONNREFUSED')));

    const result = await adapter.queryHealth('192.168.1.40');

    expect(result.errors![0]).toMatch(/device may be online/i);
  });

  it('AbortController signal is passed to fetch', async () => {
    let capturedSignal: AbortSignal | undefined;

    const fetchMock = vi.fn().mockImplementation((_url: string, opts: RequestInit) => {
      capturedSignal = opts.signal as AbortSignal;
      return Promise.resolve(mockResponse('ok'));
    });

    vi.stubGlobal('fetch', fetchMock);

    await adapter.queryHealth('192.168.1.40');

    expect(capturedSignal).toBeDefined();
    expect(capturedSignal).toBeInstanceOf(AbortSignal);
  });

  it('health from successful query has correct shape', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(mockResponse('ok')));

    const result = await adapter.queryHealth('192.168.1.40');

    expect(result.health).toMatchObject({
      temperature: expect.any(Number),
      uptime: expect.any(Number),
      errors: expect.any(Array),
      warnings: expect.any(Array),
    });
  });
});

// ============================================================
// AVITECH ADAPTER
// ============================================================

describe('AvitechAdapter', () => {
  let adapter: AvitechAdapter;

  beforeEach(() => {
    adapter = new AvitechAdapter();
  });

  it('has manufacturer set to "avitech"', () => {
    expect(adapter.manufacturer).toBe('avitech');
  });

  it('happy path: all inputs have signal, normal temperature', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(mockJsonResponse({
      model: 'DV3220',
      firmware: '3.1.0',
      uptime: 86400,
      temperature: 35,
      inputs: [
        { id: 1, signal: true, format: '1080p60' },
        { id: 2, signal: true, format: '4K60' },
      ],
    })));

    const result = await adapter.queryHealth('192.168.1.50', 80);

    expect(result.reachable).toBe(true);
    expect(result.health!.errors).toHaveLength(0);
    expect(result.health!.warnings).toHaveLength(0);
    expect(result.firmware).toBe('3.1.0');
    expect(result.health!.uptime).toBe(86400);
  });

  it('queries correct /api/status endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(mockJsonResponse({ temperature: 30 }));
    vi.stubGlobal('fetch', fetchMock);

    await adapter.queryHealth('10.0.1.50', 80);

    expect(fetchMock.mock.calls[0][0]).toContain('http://10.0.1.50:80/api/status');
  });

  it('signal detection: inputs with no signal generate a warning', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(mockJsonResponse({
      temperature: 30,
      inputs: [
        { id: 1, signal: true },
        { id: 2, signal: false },
        { id: 3, signal: false },
      ],
    })));

    const result = await adapter.queryHealth('192.168.1.50');

    expect(result.reachable).toBe(true);
    expect(result.health!.warnings).toHaveLength(1);
    expect(result.health!.warnings[0]).toContain('2 input(s) have no signal');
    expect(result.health!.errors).toHaveLength(0);
  });

  it('all inputs have no signal: warning with correct count', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(mockJsonResponse({
      temperature: 30,
      inputs: [
        { id: 1, signal: false },
        { id: 2, signal: false },
        { id: 3, signal: false },
        { id: 4, signal: false },
      ],
    })));

    const result = await adapter.queryHealth('192.168.1.50');

    expect(result.health!.warnings[0]).toContain('4 input(s) have no signal');
  });

  it('no inputs array: no signal warnings generated', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(mockJsonResponse({
      temperature: 30,
      uptime: 1000,
    })));

    const result = await adapter.queryHealth('192.168.1.50');

    expect(result.health!.warnings).toHaveLength(0);
    expect(result.health!.errors).toHaveLength(0);
  });

  it('temperature warning: 45-60C generates a warning', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(mockJsonResponse({
      temperature: 50,
    })));

    const result = await adapter.queryHealth('192.168.1.50');

    expect(result.health!.warnings).toHaveLength(1);
    expect(result.health!.warnings[0]).toContain('50C');
    expect(result.health!.errors).toHaveLength(0);
  });

  it('temperature error: >60C generates an error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(mockJsonResponse({
      temperature: 65,
    })));

    const result = await adapter.queryHealth('192.168.1.50');

    expect(result.health!.errors).toHaveLength(1);
    expect(result.health!.errors[0]).toContain('65C');
    expect(result.health!.warnings).toHaveLength(0);
  });

  it('critical temperature AND missing signals: both error and warning', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(mockJsonResponse({
      temperature: 65,
      inputs: [
        { id: 1, signal: false },
      ],
    })));

    const result = await adapter.queryHealth('192.168.1.50');

    expect(result.health!.errors).toHaveLength(1);
    expect(result.health!.warnings).toHaveLength(1);
  });

  it('missing temperature: defaults to 0, no threshold alerts', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(mockJsonResponse({
      inputs: [{ id: 1, signal: true }],
    })));

    const result = await adapter.queryHealth('192.168.1.50');

    expect(result.health!.temperature).toBe(0);
    expect(result.health!.errors).toHaveLength(0);
    expect(result.health!.warnings).toHaveLength(0);
  });

  it('missing uptime: defaults to 0', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(mockJsonResponse({
      temperature: 30,
    })));

    const result = await adapter.queryHealth('192.168.1.50');

    expect(result.health!.uptime).toBe(0);
  });

  it('network failure: returns not reachable, health null', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new Error('ECONNREFUSED')));

    const result = await adapter.queryHealth('192.168.1.50');

    expect(result.reachable).toBe(false);
    expect(result.health).toBeNull();
  });

  it('HTTP 503: returns not reachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(mockErrorResponse(503)));

    const result = await adapter.queryHealth('192.168.1.50');

    expect(result.reachable).toBe(false);
    expect(result.health).toBeNull();
  });

  it('non-JSON response: returns not reachable without crash', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => { throw new SyntaxError('Unexpected token'); },
    } as unknown as Response));

    const result = await adapter.queryHealth('192.168.1.50');

    expect(result.reachable).toBe(false);
    expect(result.health).toBeNull();
  });

  it('empty JSON object {}: reachable with zeroed health', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(mockJsonResponse({})));

    const result = await adapter.queryHealth('192.168.1.50');

    expect(result.reachable).toBe(true);
    expect(result.health!.temperature).toBe(0);
    expect(result.health!.uptime).toBe(0);
  });

  it('AbortController signal is passed to fetch', async () => {
    let capturedSignal: AbortSignal | undefined;

    const fetchMock = vi.fn().mockImplementation((_url: string, opts: RequestInit) => {
      capturedSignal = opts.signal as AbortSignal;
      return Promise.resolve(mockJsonResponse({ temperature: 30 }));
    });

    vi.stubGlobal('fetch', fetchMock);

    await adapter.queryHealth('192.168.1.50');

    expect(capturedSignal).toBeDefined();
    expect(capturedSignal).toBeInstanceOf(AbortSignal);
  });
});

// ============================================================
// CROSS-ADAPTER: DeviceQueryResult type conformance
// ============================================================

describe('All 5 adapters: DeviceQueryResult type conformance', () => {
  const adapters = [
    new PanasonicAdapter(),
    new SonyAdapter(),
    new ChristieAdapter(),
    new EpsonAdapter(),
    new AvitechAdapter(),
  ];

  it('each adapter returns correct shape on network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    for (const adapter of adapters) {
      const result = await adapter.queryHealth('192.168.1.99', 80);

      expect(result).toHaveProperty('reachable');
      expect(result).toHaveProperty('health');
      expect(typeof result.reachable).toBe('boolean');
      expect(result.reachable).toBe(false);
      expect(result.health).toBeNull();
    }
  });

  it('each adapter result optionally has errors array when present', async () => {
    // Force failure path for adapters that return errors
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')));

    for (const adapter of adapters) {
      const result = await adapter.queryHealth('192.168.1.99', 80);

      if (result.errors !== undefined) {
        expect(Array.isArray(result.errors)).toBe(true);
      }
    }
  });
});
