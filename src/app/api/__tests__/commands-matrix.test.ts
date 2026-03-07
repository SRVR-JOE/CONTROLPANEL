/**
 * Command Dispatch Tests — Matrix Routing Manufacturers
 *
 * Tests the dispatchCommand logic in src/app/api/commands/route.ts for:
 *   - AJA: set-crosspoint, get-status, label-input, label-output
 *   - Lightware: set-crosspoint
 *   - Generic manufacturers (ross, barco): simulated response
 *
 * Strategy:
 *   - Mock global fetch to intercept outbound HTTP calls.
 *   - Test that the correct URL, method, and body are constructed.
 *   - Test validation failures without any network call.
 *   - Test error path when the device returns a non-ok response.
 *
 * NOTE: These tests exercise the dispatchCommand functions via the exported POST
 * handler so we can validate the full request/response contract.  We use
 * NextRequest to build realistic request objects.
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../../api/commands/route';

// ---------------------------------------------------------------------------
// Mock setup
// ---------------------------------------------------------------------------

global.fetch = vi.fn();

/** Build a mock fetch response for PUT/GET calls to the device. */
function mockDeviceFetchOk(text = 'OK'): void {
  (fetch as Mock).mockResolvedValueOnce({
    ok: true,
    status: 200,
    text: async () => text,
  });
}

function mockDeviceFetchError(text = 'Device error', status = 500): void {
  (fetch as Mock).mockResolvedValueOnce({
    ok: false,
    status,
    text: async () => text,
  });
}

function mockDeviceNetworkError(msg = 'ECONNREFUSED'): void {
  (fetch as Mock).mockRejectedValueOnce(new Error(msg));
}

/** Build a NextRequest with the given JSON body for the commands POST route. */
function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/commands', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.mocked(fetch).mockReset();
});

// ---------------------------------------------------------------------------
// Request validation
// ---------------------------------------------------------------------------

describe('POST /api/commands — request validation', () => {
  it('returns 400 when deviceId is missing', async () => {
    const req = makeRequest({ manufacturer: 'aja', ip: '192.168.1.1', command: 'get-status' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/deviceId/i);
  });

  it('returns 400 when manufacturer is missing', async () => {
    const req = makeRequest({ deviceId: 'dev1', ip: '192.168.1.1', command: 'get-status' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/manufacturer/i);
  });

  it('returns 400 when ip is missing', async () => {
    const req = makeRequest({ deviceId: 'dev1', manufacturer: 'aja', command: 'get-status' });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 for loopback IP (SSRF protection)', async () => {
    const req = makeRequest({ deviceId: 'dev1', manufacturer: 'aja', ip: '127.0.0.1', command: 'get-status' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/disallowed/i);
  });

  it('allows private network IPs (192.168.x.x)', async () => {
    mockDeviceFetchOk(JSON.stringify({ eParamID_NumberOfVideoInputs: 8 }));
    const req = makeRequest({
      deviceId: 'dev1',
      manufacturer: 'aja',
      ip: '192.168.1.100',
      command: 'get-status',
    });
    const res = await POST(req);
    // Should NOT be blocked by SSRF filter
    expect(res.status).not.toBe(400);
  });

  it('allows private network IPs (10.x.x.x)', async () => {
    mockDeviceFetchOk(JSON.stringify({ eParamID_NumberOfVideoInputs: 4 }));
    const req = makeRequest({
      deviceId: 'dev1',
      manufacturer: 'aja',
      ip: '10.0.0.5',
      command: 'get-status',
    });
    const res = await POST(req);
    expect(res.status).not.toBe(400);
  });

  it('returns 400 for unknown command when manufacturer has a known registry', async () => {
    const req = makeRequest({
      deviceId: 'dev1',
      manufacturer: 'aja',
      ip: '192.168.1.1',
      command: 'does-not-exist',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/Unknown command/i);
  });

  it('returns 400 for invalid JSON body', async () => {
    const req = new NextRequest('http://localhost/api/commands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json{{{',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/Invalid JSON/i);
  });
});

// ---------------------------------------------------------------------------
// AJA: set-crosspoint
// ---------------------------------------------------------------------------

describe('AJA set-crosspoint', () => {
  const baseBody = {
    deviceId: 'router-1',
    manufacturer: 'aja',
    ip: '192.168.1.100',
    command: 'set-crosspoint',
  };

  it('constructs correct PUT to /config with crosspoint body', async () => {
    mockDeviceFetchOk();

    const req = makeRequest({ ...baseBody, params: { output: 4, input: 2 } });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.response).toBe('Routed input 2 -> output 4');

    // Verify the actual HTTP call
    expect(fetch).toHaveBeenCalledWith(
      'http://192.168.1.100/config',
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ eParamID_XPT_Destination4_Status: 2 }),
      })
    );
  });

  it('returns error when output param is 0 (invalid — must be >= 1)', async () => {
    const req = makeRequest({ ...baseBody, params: { output: 0, input: 1 } });
    const res = await POST(req);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/must be >= 1/);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns error when input param is 0 (invalid — must be >= 1)', async () => {
    const req = makeRequest({ ...baseBody, params: { output: 1, input: 0 } });
    const res = await POST(req);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/must be >= 1/);
  });

  it('returns error when output is missing (NaN)', async () => {
    const req = makeRequest({ ...baseBody, params: { input: 3 } });
    const res = await POST(req);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/numeric/i);
  });

  it('returns error when input is missing (NaN)', async () => {
    const req = makeRequest({ ...baseBody, params: { output: 2 } });
    const res = await POST(req);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/numeric/i);
  });

  it('returns error when device returns non-ok HTTP status', async () => {
    mockDeviceFetchError('Internal Error', 500);

    const req = makeRequest({ ...baseBody, params: { output: 1, input: 1 } });
    const res = await POST(req);

    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/AJA returned error/i);
  });

  it('handles string number params correctly (coercion)', async () => {
    mockDeviceFetchOk();

    const req = makeRequest({ ...baseBody, params: { output: '5', input: '3' } });
    const res = await POST(req);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.response).toBe('Routed input 3 -> output 5');
  });

  it('handles network timeout from device', async () => {
    mockDeviceNetworkError('The operation was aborted — timeout');

    const req = makeRequest({ ...baseBody, params: { output: 1, input: 1 } });
    const res = await POST(req);

    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/did not respond/i);
  });
});

// ---------------------------------------------------------------------------
// AJA: get-status
// ---------------------------------------------------------------------------

describe('AJA get-status', () => {
  const baseBody = {
    deviceId: 'router-1',
    manufacturer: 'aja',
    ip: '192.168.1.100',
    command: 'get-status',
  };

  it('returns formatted router size string from config JSON', async () => {
    const configJson = JSON.stringify({
      eParamID_NumberOfVideoInputs: 32,
      eParamID_NumberOfVideoOutputs: 32,
    });
    mockDeviceFetchOk(configJson);

    const req = makeRequest(baseBody);
    const res = await POST(req);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.response).toContain('32x32');
  });

  it('returns byte count when config is not valid JSON', async () => {
    mockDeviceFetchOk('not-json-data');

    const req = makeRequest(baseBody);
    const res = await POST(req);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.response).toContain('bytes');
  });

  it('issues GET to /config endpoint', async () => {
    mockDeviceFetchOk('{}');

    const req = makeRequest(baseBody);
    await POST(req);

    expect(fetch).toHaveBeenCalledWith(
      'http://192.168.1.100/config',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('returns error when device GET fails', async () => {
    mockDeviceFetchError('Service Unavailable', 503);

    const req = makeRequest(baseBody);
    const res = await POST(req);
    const body = await res.json();

    expect(body.success).toBe(false);
    expect(body.error).toMatch(/AJA returned error/i);
  });
});

// ---------------------------------------------------------------------------
// AJA: label-input
// ---------------------------------------------------------------------------

describe('AJA label-input', () => {
  const baseBody = {
    deviceId: 'router-1',
    manufacturer: 'aja',
    ip: '192.168.1.100',
    command: 'label-input',
  };

  it('constructs correct PUT with eParamID_Input{N}_Label key', async () => {
    mockDeviceFetchOk();

    const req = makeRequest({ ...baseBody, params: { index: 3, label: 'Camera A' } });
    const res = await POST(req);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.response).toContain('Input 3 labelled as "Camera A"');
    expect(fetch).toHaveBeenCalledWith(
      'http://192.168.1.100/config',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ eParamID_Input3_Label: 'Camera A' }),
      })
    );
  });

  it('returns error when index is missing', async () => {
    const req = makeRequest({ ...baseBody, params: { label: 'Camera A' } });
    const res = await POST(req);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/numeric index/i);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns error when index is 0 (must be >= 1)', async () => {
    const req = makeRequest({ ...baseBody, params: { index: 0, label: 'Test' } });
    const res = await POST(req);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/>= 1/);
  });
});

// ---------------------------------------------------------------------------
// AJA: label-output
// ---------------------------------------------------------------------------

describe('AJA label-output', () => {
  const baseBody = {
    deviceId: 'router-1',
    manufacturer: 'aja',
    ip: '192.168.1.100',
    command: 'label-output',
  };

  it('constructs correct PUT with eParamID_Output{N}_Label key', async () => {
    mockDeviceFetchOk();

    const req = makeRequest({ ...baseBody, params: { index: 7, label: 'Monitor 1' } });
    const res = await POST(req);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.response).toContain('Output 7 labelled as "Monitor 1"');
    expect(fetch).toHaveBeenCalledWith(
      'http://192.168.1.100/config',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ eParamID_Output7_Label: 'Monitor 1' }),
      })
    );
  });

  it('returns error when index is missing', async () => {
    const req = makeRequest({ ...baseBody, params: { label: 'Monitor 1' } });
    const res = await POST(req);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/numeric index/i);
  });

  it('returns error when index is 0', async () => {
    const req = makeRequest({ ...baseBody, params: { index: 0, label: 'Test' } });
    const res = await POST(req);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/>= 1/);
  });
});

// ---------------------------------------------------------------------------
// Lightware: set-crosspoint
// ---------------------------------------------------------------------------

describe('Lightware set-crosspoint', () => {
  const baseBody = {
    deviceId: 'lw-router-1',
    manufacturer: 'lightware',
    ip: '192.168.1.150',
    command: 'set-crosspoint',
  };

  it('constructs correct PUT to /api/MEDIA/VIDEO/XP/O{n}/Source', async () => {
    mockDeviceFetchOk();

    const req = makeRequest({ ...baseBody, params: { output: 3, input: 5 } });
    const res = await POST(req);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.response).toBe('Routed input 5 -> output 3');
    expect(fetch).toHaveBeenCalledWith(
      'http://192.168.1.150/api/MEDIA/VIDEO/XP/O3/Source',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ Source: 'I5' }),
      })
    );
  });

  it('uses "I{input}" format for source identifier', async () => {
    mockDeviceFetchOk();

    const req = makeRequest({ ...baseBody, params: { output: 1, input: 12 } });
    const res = await POST(req);

    const calls = (fetch as Mock).mock.calls;
    const putCall = calls.find((c) => (c[1] as RequestInit)?.method === 'PUT');
    expect(putCall).toBeDefined();
    const sentBody = JSON.parse(putCall![1].body as string);
    expect(sentBody.Source).toBe('I12');
  });

  it('returns error when output is 0 (invalid — must be >= 1)', async () => {
    const req = makeRequest({ ...baseBody, params: { output: 0, input: 1 } });
    const res = await POST(req);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/must be >= 1/);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns error when input is 0 (invalid — must be >= 1)', async () => {
    const req = makeRequest({ ...baseBody, params: { output: 1, input: 0 } });
    const res = await POST(req);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/must be >= 1/);
  });

  it('returns error when output param is missing', async () => {
    const req = makeRequest({ ...baseBody, params: { input: 3 } });
    const res = await POST(req);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/numeric/i);
  });

  it('returns error on device HTTP failure', async () => {
    mockDeviceFetchError('Not Found', 404);

    const req = makeRequest({ ...baseBody, params: { output: 2, input: 1 } });
    const res = await POST(req);

    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/Lightware returned error/i);
  });

  it('handles network failure with timeout message', async () => {
    mockDeviceNetworkError('abort');

    const req = makeRequest({ ...baseBody, params: { output: 1, input: 1 } });
    const res = await POST(req);

    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/did not respond/i);
  });
});

// ---------------------------------------------------------------------------
// Ross and Barco — now have real dispatch functions and registered commands
// ---------------------------------------------------------------------------

describe('Ross and Barco registered commands', () => {
  it('ross: rejects unknown commands now that ross has a command registry', async () => {
    const req = makeRequest({
      deviceId: 'ross-1',
      manufacturer: 'ross',
      ip: '192.168.1.200',
      command: 'ping',
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toContain('Unknown command');
  });

  it('barco: rejects unknown commands now that barco has a command registry', async () => {
    const req = makeRequest({
      deviceId: 'barco-1',
      manufacturer: 'barco',
      ip: '192.168.1.201',
      command: 'reboot',
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toContain('Unknown command');
  });

  it('ross: accepts get-frame-status as a valid command', async () => {
    mockDeviceFetchOk('<html>Frame OK</html>');
    const req = makeRequest({
      deviceId: 'ross-switch',
      manufacturer: 'ross',
      ip: '10.0.1.55',
      command: 'get-frame-status',
    });
    const res = await POST(req);
    const body = await res.json();

    expect(body.success).toBe(true);
  });

  it('barco: accepts select-input as a valid command', async () => {
    mockDeviceFetchOk('OK');
    const req = makeRequest({
      deviceId: 'barco-1',
      manufacturer: 'barco',
      ip: '192.168.1.200',
      command: 'select-input',
      params: { input: 1 },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(body.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Unknown command for registered manufacturers
// ---------------------------------------------------------------------------

describe('Unknown command validation', () => {
  it('rejects unknown AJA command with known commands list', async () => {
    const req = makeRequest({
      deviceId: 'router-1',
      manufacturer: 'aja',
      ip: '192.168.1.1',
      command: 'unknown-aja-cmd',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('set-crosspoint');
  });

  it('rejects unknown Lightware command with known commands list', async () => {
    const req = makeRequest({
      deviceId: 'lw-1',
      manufacturer: 'lightware',
      ip: '192.168.1.1',
      command: 'unknown-cmd',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('set-crosspoint');
  });
});
