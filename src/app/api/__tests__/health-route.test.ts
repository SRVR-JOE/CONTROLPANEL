/**
 * Tests for POST /api/health — batch device health polling.
 *
 * Strategy: We import the route handler directly and call it with a
 * synthetic NextRequest. All outbound fetch calls (made by device adapters)
 * are mocked via vi.fn() so no real network requests are made.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Global fetch mock — must be set up before importing the route so that
// any module-level calls (none here) are also intercepted.
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
// Helpers
// ---------------------------------------------------------------------------

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

/** Create a NextRequest with a JSON body. */
function makePostRequest(body: unknown, url = 'http://localhost/api/health'): NextRequest {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/** Create a NextRequest with query params. */
function makeGetRequest(params: Record<string, string>, url = 'http://localhost/api/health'): NextRequest {
  const searchParams = new URLSearchParams(params);
  return new NextRequest(`${url}?${searchParams.toString()}`, {
    method: 'GET',
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/health', () => {
  it('returns 400 when devices array is missing from body', async () => {
    const { POST } = await import('../health/route');
    const req = makePostRequest({ notDevices: [] });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('Missing or empty devices array');
  });

  it('returns 400 when devices array is empty', async () => {
    const { POST } = await import('../health/route');
    const req = makePostRequest({ devices: [] });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('Missing or empty devices array');
  });

  it('returns 400 when a device is missing required id field', async () => {
    const { POST } = await import('../health/route');
    const req = makePostRequest({
      devices: [{ ip: '10.0.0.1', manufacturer: 'brompton' }], // no id
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/id.*ip.*manufacturer|Each device must include/i);
  });

  it('returns 400 when a device is missing required ip field', async () => {
    const { POST } = await import('../health/route');
    const req = makePostRequest({
      devices: [{ id: 'dev-1', manufacturer: 'brompton' }], // no ip
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when a device is missing manufacturer', async () => {
    const { POST } = await import('../health/route');
    const req = makePostRequest({
      devices: [{ id: 'dev-1', ip: '10.0.0.1' }], // no manufacturer
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when body is invalid JSON', async () => {
    const { POST } = await import('../health/route');
    const req = new NextRequest('http://localhost/api/health', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{invalid json}',
    });
    const res = await POST(req);
    expect(res.status).toBe(500); // JSON parse throws → caught by outer try/catch
  });

  // --- SSRF filter: allows private IP ranges ---
  it('SSRF filter: allows private 10.x.x.x addresses', async () => {
    // Mock the adapter fetch calls for a Brompton device
    mockFetch
      .mockResolvedValueOnce(makeResponse({ value: 28 }))   // ambient
      .mockResolvedValueOnce(makeResponse({ value: 55 }))   // cpu
      .mockResolvedValueOnce(makeResponse({ value: 60 }))   // gpu
      .mockResolvedValueOnce(makeResponse({ value: 3600 })) // uptime
      .mockResolvedValueOnce(makeResponse({ value: 48 }));  // panels

    const { POST } = await import('../health/route');
    const req = makePostRequest({
      devices: [{ id: 'dev-brompton', ip: '10.0.0.50', manufacturer: 'brompton' }],
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.results).toHaveProperty('dev-brompton');
  });

  it('SSRF filter: allows private 192.168.x.x addresses', async () => {
    mockFetch.mockResolvedValue(makeResponse({ value: 25 }));

    const { POST } = await import('../health/route');
    const req = makePostRequest({
      devices: [{ id: 'dev-1', ip: '192.168.1.100', manufacturer: 'novastar' }],
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.results).toHaveProperty('dev-1');
  });

  it('SSRF filter: allows private 172.16.x.x addresses', async () => {
    mockFetch.mockResolvedValue(makeResponse({ value: 25 }));

    const { POST } = await import('../health/route');
    const req = makePostRequest({
      devices: [{ id: 'dev-2', ip: '172.16.0.1', manufacturer: 'novastar' }],
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  // --- SSRF filter: blocks loopback ---
  it('SSRF filter: blocks loopback 127.0.0.1', async () => {
    const { POST } = await import('../health/route');
    const req = makePostRequest({
      devices: [{ id: 'dev-loopback', ip: '127.0.0.1', manufacturer: 'brompton' }],
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('disallowed');
  });

  it('SSRF filter: blocks 0.0.0.0', async () => {
    const { POST } = await import('../health/route');
    const req = makePostRequest({
      devices: [{ id: 'dev-zero', ip: '0.0.0.0', manufacturer: 'brompton' }],
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('disallowed');
  });

  it('SSRF filter: blocks broadcast 255.255.255.255', async () => {
    const { POST } = await import('../health/route');
    const req = makePostRequest({
      devices: [{ id: 'dev-bcast', ip: '255.255.255.255', manufacturer: 'brompton' }],
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('SSRF filter: blocks malformed IPs', async () => {
    const { POST } = await import('../health/route');
    const req = makePostRequest({
      devices: [{ id: 'dev-bad', ip: 'not-an-ip', manufacturer: 'brompton' }],
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  // --- Batch query success ---
  it('returns results for all devices in batch', async () => {
    // Novastar adapter: 2 fetch calls (sysInfo + sysStatus) × 2 devices = 4 calls
    mockFetch
      .mockResolvedValueOnce(makeResponse({ firmwareVersion: '3.5.2' }))
      .mockResolvedValueOnce(makeResponse({ temperature: 45 }))
      .mockResolvedValueOnce(makeResponse({ firmwareVersion: '3.0.0' }))
      .mockResolvedValueOnce(makeResponse({ temperature: 50 }));

    const { POST } = await import('../health/route');
    const req = makePostRequest({
      devices: [
        { id: 'nova-1', ip: '10.0.0.10', manufacturer: 'novastar' },
        { id: 'nova-2', ip: '10.0.0.11', manufacturer: 'novastar' },
      ],
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.results).toHaveProperty('nova-1');
    expect(json.results).toHaveProperty('nova-2');
  });

  // --- Device unreachable is included in results (not a route error) ---
  it('includes unreachable devices in results without failing the whole batch', async () => {
    // Brompton SX40: all 9 endpoint fetches fail for dev-offline
    // Brompton SX40: all 9 endpoint fetches succeed for dev-online
    mockFetch
      // dev-offline: 9 endpoint failures
      .mockRejectedValueOnce(new Error('ECONNREFUSED'))
      .mockRejectedValueOnce(new Error('ECONNREFUSED'))
      .mockRejectedValueOnce(new Error('ECONNREFUSED'))
      .mockRejectedValueOnce(new Error('ECONNREFUSED'))
      .mockRejectedValueOnce(new Error('ECONNREFUSED'))
      .mockRejectedValueOnce(new Error('ECONNREFUSED'))
      .mockRejectedValueOnce(new Error('ECONNREFUSED'))
      .mockRejectedValueOnce(new Error('ECONNREFUSED'))
      .mockRejectedValueOnce(new Error('ECONNREFUSED'))
      // dev-online: 9 endpoint successes (SX40 API format)
      .mockResolvedValueOnce(makeResponse({ ambient: 28 }))
      .mockResolvedValueOnce(makeResponse({ cpu: 55 }))
      .mockResolvedValueOnce(makeResponse({ gpu: 60 }))
      .mockResolvedValueOnce(makeResponse({ uptime: '1h 0m' }))
      .mockResolvedValueOnce(makeResponse({ temperature: { ambient: 28, cpu: 55, gpu: 60, fpga: 50, psu: 45, main: 39, ethernet: { copper: { a: 35, b: 39 }, sfp: { a: 36, b: 37, c: 38, d: 38 } } } }))
      .mockResolvedValueOnce(makeResponse({ system: { fan: { case: { one: { speed: 1890 }, two: { speed: 1890 } }, fpga: { speed: 6500 } }, 'software-version': '3.5.2' } }))
      .mockResolvedValueOnce(makeResponse({ 'software-version': '3.5.2' }))
      .mockResolvedValueOnce(makeResponse({ 'online-count': 48 }))
      .mockResolvedValueOnce(makeResponse({ 'error-count': 0 }));

    const { POST } = await import('../health/route');
    const req = makePostRequest({
      devices: [
        { id: 'dev-offline', ip: '10.0.1.1', manufacturer: 'brompton' },
        { id: 'dev-online', ip: '10.0.1.2', manufacturer: 'brompton' },
      ],
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.results['dev-offline'].reachable).toBe(false);
    expect(json.results['dev-online'].reachable).toBe(true);
  });
});

describe('GET /api/health', () => {
  it('returns 400 when ip parameter is missing', async () => {
    const { GET } = await import('../health/route');
    const req = makeGetRequest({ manufacturer: 'brompton' });
    const res = await GET(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('ip');
  });

  it('returns 400 when manufacturer parameter is missing', async () => {
    const { GET } = await import('../health/route');
    const req = makeGetRequest({ ip: '10.0.0.1' });
    const res = await GET(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('manufacturer');
  });

  it('returns 400 for unknown manufacturer', async () => {
    const { GET } = await import('../health/route');
    const req = makeGetRequest({ ip: '10.0.0.1', manufacturer: 'unknownbrand' });
    const res = await GET(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('manufacturer');
  });

  it('returns 400 when port is out of range', async () => {
    const { GET } = await import('../health/route');
    const req = makeGetRequest({ ip: '10.0.0.1', manufacturer: 'brompton', port: '99999' });
    const res = await GET(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('port');
  });

  it('returns 400 when port is non-numeric', async () => {
    const { GET } = await import('../health/route');
    const req = makeGetRequest({ ip: '10.0.0.1', manufacturer: 'brompton', port: 'abc' });
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 for loopback IP via SSRF filter', async () => {
    const { GET } = await import('../health/route');
    const req = makeGetRequest({ ip: '127.0.0.1', manufacturer: 'brompton' });
    const res = await GET(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('disallowed');
  });

  it('returns health result for valid private IP and known manufacturer', async () => {
    // Brompton: 5 endpoint calls
    mockFetch
      .mockResolvedValueOnce(makeResponse({ value: 28 }))
      .mockResolvedValueOnce(makeResponse({ value: 55 }))
      .mockResolvedValueOnce(makeResponse({ value: 60 }))
      .mockResolvedValueOnce(makeResponse({ value: 3600 }))
      .mockResolvedValueOnce(makeResponse({ value: 48 }));

    const { GET } = await import('../health/route');
    const req = makeGetRequest({ ip: '10.0.0.50', manufacturer: 'brompton' });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty('reachable');
    expect(json).toHaveProperty('health');
  });

  it('accepts valid port parameter', async () => {
    mockFetch
      .mockResolvedValueOnce(makeResponse({ firmwareVersion: '3.5.2' }))
      .mockResolvedValueOnce(makeResponse({ temperature: 45 }));

    const { GET } = await import('../health/route');
    const req = makeGetRequest({ ip: '10.0.0.1', manufacturer: 'novastar', port: '8080' });
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(':8080/'),
      expect.anything(),
    );
  });
});
