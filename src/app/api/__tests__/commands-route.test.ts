/**
 * Tests for POST /api/commands — command dispatch for all manufacturers.
 *
 * Strategy: Import the route handler directly; mock global fetch so no real
 * HTTP requests are made to devices.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

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
// Helpers
// ---------------------------------------------------------------------------

function makeDeviceResponse(status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ 'Content-Type': 'application/json' }),
    json: async () => ({}),
    text: async () => '',
    body: null,
    bodyUsed: false,
    redirected: false,
    statusText: status === 200 ? 'OK' : 'Error',
    type: 'basic',
    url: '',
    arrayBuffer: async () => new ArrayBuffer(0),
    blob: async () => new Blob([]),
    formData: async () => new FormData(),
    clone: function () { return this; },
  } as unknown as Response;
}

function makePostRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/commands', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// Input validation tests
// ---------------------------------------------------------------------------

describe('POST /api/commands — input validation', () => {
  it('returns 400 when deviceId is missing', async () => {
    const { POST } = await import('../commands/route');
    const req = makePostRequest({
      manufacturer: 'brompton',
      ip: '10.0.0.1',
      command: 'set-brightness',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toContain('deviceId');
  });

  it('returns 400 when manufacturer is missing', async () => {
    const { POST } = await import('../commands/route');
    const req = makePostRequest({
      deviceId: 'dev-1',
      ip: '10.0.0.1',
      command: 'set-brightness',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('manufacturer');
  });

  it('returns 400 when ip is missing', async () => {
    const { POST } = await import('../commands/route');
    const req = makePostRequest({
      deviceId: 'dev-1',
      manufacturer: 'brompton',
      command: 'set-brightness',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('ip');
  });

  it('returns 400 when command is missing', async () => {
    const { POST } = await import('../commands/route');
    const req = makePostRequest({
      deviceId: 'dev-1',
      manufacturer: 'brompton',
      ip: '10.0.0.1',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('command');
  });

  it('returns 400 when body is invalid JSON', async () => {
    const { POST } = await import('../commands/route');
    const req = new NextRequest('http://localhost/api/commands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json at all',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toContain('Invalid JSON');
  });

  it('returns 400 when IP is loopback (SSRF filter)', async () => {
    const { POST } = await import('../commands/route');
    const req = makePostRequest({
      deviceId: 'dev-1',
      manufacturer: 'brompton',
      ip: '127.0.0.1',
      command: 'set-brightness',
      params: { value: 50 },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('disallowed');
  });

  it('returns 400 for an unknown command in a manufacturer with registered commands', async () => {
    const { POST } = await import('../commands/route');
    const req = makePostRequest({
      deviceId: 'dev-1',
      manufacturer: 'brompton',
      ip: '10.0.0.1',
      command: 'launch-missiles', // not a real Brompton command
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toContain('Unknown command');
    expect(json.error).toContain('launch-missiles');
  });
});

// ---------------------------------------------------------------------------
// Brompton command dispatch
// ---------------------------------------------------------------------------

describe('POST /api/commands — Brompton', () => {
  const baseRequest = {
    deviceId: 'dev-brompton-1',
    manufacturer: 'brompton',
    ip: '192.168.1.50',
  };

  it('dispatches set-brightness and returns success', async () => {
    mockFetch.mockResolvedValueOnce(makeDeviceResponse(200));
    const { POST } = await import('../commands/route');
    const req = makePostRequest({ ...baseRequest, command: 'set-brightness', params: { value: 75 } });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.response).toContain('75');
    // Verify PUT was called to the correct endpoint
    expect(mockFetch).toHaveBeenCalledWith(
      'http://192.168.1.50/api/output/brightness',
      expect.objectContaining({ method: 'PUT' }),
    );
  });

  it('dispatches blackout (enable) and returns success', async () => {
    mockFetch.mockResolvedValueOnce(makeDeviceResponse(200));
    const { POST } = await import('../commands/route');
    const req = makePostRequest({ ...baseRequest, command: 'blackout', params: { enabled: true } });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.response).toContain('enabled');
    expect(mockFetch).toHaveBeenCalledWith(
      'http://192.168.1.50/api/output/blackout',
      expect.objectContaining({ method: 'PUT' }),
    );
  });

  it('dispatches freeze and returns success', async () => {
    mockFetch.mockResolvedValueOnce(makeDeviceResponse(200));
    const { POST } = await import('../commands/route');
    const req = makePostRequest({ ...baseRequest, command: 'freeze', params: { enabled: false } });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.response).toContain('disabled');
  });

  it('dispatches test-pattern and returns success', async () => {
    mockFetch.mockResolvedValueOnce(makeDeviceResponse(200));
    const { POST } = await import('../commands/route');
    const req = makePostRequest({ ...baseRequest, command: 'test-pattern', params: { pattern: 'color-bars' } });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.response).toContain('color-bars');
  });

  it('dispatches set-color-temp and returns success', async () => {
    mockFetch.mockResolvedValueOnce(makeDeviceResponse(200));
    const { POST } = await import('../commands/route');
    const req = makePostRequest({ ...baseRequest, command: 'set-color-temp', params: { kelvin: 5600 } });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.response).toContain('5600');
  });

  it('dispatches select-input and returns success', async () => {
    mockFetch.mockResolvedValueOnce(makeDeviceResponse(200));
    const { POST } = await import('../commands/route');
    const req = makePostRequest({ ...baseRequest, command: 'select-input', params: { source: 'SDI 1' } });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.response).toContain('SDI 1');
  });

  it('dispatches toggle-darkmagic and returns success', async () => {
    mockFetch.mockResolvedValueOnce(makeDeviceResponse(200));
    const { POST } = await import('../commands/route');
    const req = makePostRequest({ ...baseRequest, command: 'toggle-darkmagic', params: { enabled: true } });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.response).toContain('DarkMagic');
  });

  it('dispatches toggle-puretone and returns success', async () => {
    mockFetch.mockResolvedValueOnce(makeDeviceResponse(200));
    const { POST } = await import('../commands/route');
    const req = makePostRequest({ ...baseRequest, command: 'toggle-puretone', params: { enabled: false } });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.response).toContain('PureTone');
  });

  it('dispatches identify-panel (uses POST to device) and returns success', async () => {
    mockFetch.mockResolvedValueOnce(makeDeviceResponse(200));
    const { POST } = await import('../commands/route');
    const req = makePostRequest({
      ...baseRequest,
      command: 'identify-panel',
      params: { panelId: 'P-001', duration: 5 },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.response).toContain('P-001');
    expect(mockFetch).toHaveBeenCalledWith(
      'http://192.168.1.50/api/panels/identify',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('dispatches reload-panels and returns success', async () => {
    mockFetch.mockResolvedValueOnce(makeDeviceResponse(200));
    const { POST } = await import('../commands/route');
    const req = makePostRequest({ ...baseRequest, command: 'reload-panels' });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.response).toContain('reload');
  });

  it('returns 502 when device returns non-200 status', async () => {
    mockFetch.mockResolvedValueOnce(makeDeviceResponse(500));
    const { POST } = await import('../commands/route');
    const req = makePostRequest({ ...baseRequest, command: 'set-brightness', params: { value: 50 } });
    const res = await POST(req);
    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toContain('Device returned error');
  });

  it('returns 502 when device is unreachable (network error)', async () => {
    mockFetch.mockRejectedValueOnce(new DOMException('The operation was aborted.', 'AbortError'));
    const { POST } = await import('../commands/route');
    const req = makePostRequest({ ...baseRequest, command: 'set-brightness', params: { value: 50 } });
    const res = await POST(req);
    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toContain('did not respond');
  });
});

// ---------------------------------------------------------------------------
// Disguise command dispatch
// ---------------------------------------------------------------------------

describe('POST /api/commands — Disguise', () => {
  const baseRequest = {
    deviceId: 'dev-disguise-1',
    manufacturer: 'disguise',
    ip: '10.0.0.100',
  };

  it('dispatches play command and returns success', async () => {
    mockFetch.mockResolvedValueOnce(makeDeviceResponse(200));
    const { POST } = await import('../commands/route');
    const req = makePostRequest({ ...baseRequest, command: 'play' });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.response).toContain('Playback started');
    expect(mockFetch).toHaveBeenCalledWith(
      'http://10.0.0.100/api/transport/play',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('dispatches stop command and returns success', async () => {
    mockFetch.mockResolvedValueOnce(makeDeviceResponse(200));
    const { POST } = await import('../commands/route');
    const req = makePostRequest({ ...baseRequest, command: 'stop' });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.response).toContain('stopped');
  });

  it('dispatches goto-cue command and returns success', async () => {
    mockFetch.mockResolvedValueOnce(makeDeviceResponse(200));
    const { POST } = await import('../commands/route');
    const req = makePostRequest({ ...baseRequest, command: 'goto-cue', params: { cueId: 'scene-03' } });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.response).toContain('scene-03');
    expect(mockFetch).toHaveBeenCalledWith(
      'http://10.0.0.100/api/transport/cue',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('dispatches jump-timecode command and returns success', async () => {
    mockFetch.mockResolvedValueOnce(makeDeviceResponse(200));
    const { POST } = await import('../commands/route');
    const req = makePostRequest({ ...baseRequest, command: 'jump-timecode', params: { timecode: '00:01:30:00' } });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.response).toContain('00:01:30:00');
  });

  it('dispatches restart-service command and returns success', async () => {
    mockFetch.mockResolvedValueOnce(makeDeviceResponse(200));
    const { POST } = await import('../commands/route');
    const req = makePostRequest({ ...baseRequest, command: 'restart-service' });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.response).toContain('restart');
  });

  it('dispatches understudy-takeover and returns success', async () => {
    mockFetch.mockResolvedValueOnce(makeDeviceResponse(200));
    const { POST } = await import('../commands/route');
    const req = makePostRequest({ ...baseRequest, command: 'understudy-takeover', params: { actorIndex: 2 } });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.response).toContain('2');
  });

  it('returns error for unknown disguise command', async () => {
    const { POST } = await import('../commands/route');
    const req = makePostRequest({ ...baseRequest, command: 'unknown-command' });
    // No registered disguise commands matching this → 400 from command registry check
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
  });

  it('returns 502 when disguise device is unreachable', async () => {
    mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const { POST } = await import('../commands/route');
    const req = makePostRequest({ ...baseRequest, command: 'play' });
    const res = await POST(req);
    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Blackmagic command dispatch
// ---------------------------------------------------------------------------

describe('POST /api/commands — Blackmagic', () => {
  const baseRequest = {
    deviceId: 'dev-bmd-1',
    manufacturer: 'blackmagic',
    ip: '192.168.10.50',
  };

  it('dispatches set-crosspoint and returns success', async () => {
    mockFetch.mockResolvedValueOnce(makeDeviceResponse(200));
    const { POST } = await import('../commands/route');
    const req = makePostRequest({
      ...baseRequest,
      command: 'set-crosspoint',
      params: { input: 3, output: 1 },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.response).toContain('3');
    expect(json.response).toContain('1');
    expect(mockFetch).toHaveBeenCalledWith(
      'http://192.168.10.50/control/api/v1/router/routing',
      expect.objectContaining({ method: 'PUT' }),
    );
  });

  it('returns error when set-crosspoint is missing input param', async () => {
    // Note: set-crosspoint is not in the Blackmagic command registry,
    // so it skips registry check and goes straight to dispatchBlackmagic
    // where the params check fails
    const { POST } = await import('../commands/route');
    const req = makePostRequest({
      ...baseRequest,
      command: 'set-crosspoint',
      params: { output: 1 }, // missing input
    });
    const res = await POST(req);
    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toContain('set-crosspoint requires');
  });

  it('returns error for unknown blackmagic command', async () => {
    const { POST } = await import('../commands/route');
    const req = makePostRequest({ ...baseRequest, command: 'unknown-command' });
    // blackmagic has no registered commands, so registry check is skipped
    // dispatchBlackmagic falls to default which returns success:false
    const res = await POST(req);
    const json = await res.json();
    expect(json.success).toBe(false);
  });

  it('returns 502 when blackmagic device returns error', async () => {
    mockFetch.mockResolvedValueOnce(makeDeviceResponse(500));
    const { POST } = await import('../commands/route');
    const req = makePostRequest({
      ...baseRequest,
      command: 'set-crosspoint',
      params: { input: 1, output: 2 },
    });
    const res = await POST(req);
    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toContain('Blackmagic returned error');
  });
});

// ---------------------------------------------------------------------------
// Manufacturer fallback: simulated response for unregistered manufacturers
// ---------------------------------------------------------------------------

describe('POST /api/commands — simulated fallback', () => {
  it('returns simulated=true for manufacturers without real dispatch (e.g. novastar)', async () => {
    const { POST } = await import('../commands/route');
    const req = makePostRequest({
      deviceId: 'dev-nova',
      manufacturer: 'novastar',
      ip: '10.0.0.10',
      command: 'some-command',
    });
    const res = await POST(req);
    // novastar has no registered commands → registry check skipped → simulated
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.simulated).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// OPTIONS (CORS preflight)
// ---------------------------------------------------------------------------

describe('OPTIONS /api/commands', () => {
  it('returns 204 for OPTIONS preflight', async () => {
    const { OPTIONS } = await import('../commands/route');
    const req = new NextRequest('http://localhost/api/commands', { method: 'OPTIONS' });
    const res = await OPTIONS(req);
    expect(res.status).toBe(204);
  });
});
