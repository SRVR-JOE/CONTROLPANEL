/**
 * Power / Infrastructure Adapter Tests
 *
 * Covers all 6 power/infra manufacturers:
 *   eaton, toshiba, gude, raritan, apc, cyberpower
 *
 * All network calls are mocked via vi.fn() — no real requests are made.
 *
 * Test naming convention:
 *   <adapter> — <scenario>
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { EatonAdapter } from '../eaton';
import { ToshibaUPSAdapter } from '../toshiba-ups';
import { GudeAdapter } from '../gude';
import { RaritanAdapter } from '../raritan';
import { APCAdapter } from '../apc';
import { CyberPowerAdapter } from '../cyberpower';

// ============================================================
// Fetch mock helpers
// ============================================================

/**
 * Build a minimal Response-like object that global fetch will resolve to.
 * Supports both .json() and .text() so both Gude and non-Gude adapters work.
 */
function mockJsonResponse(body: unknown, status = 200): Response {
  const json = JSON.stringify(body);
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
    text: vi.fn().mockResolvedValue(json),
  } as unknown as Response;
}

/**
 * Build a response that returns plain text (used to simulate Gude JS-wrapped
 * responses and malformed bodies).
 */
function mockTextResponse(text: string, status = 200): Response {
  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(text);
  } catch {
    parsedBody = null;
  }
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockImplementation(() => {
      if (parsedBody !== null) return Promise.resolve(parsedBody);
      return Promise.reject(new SyntaxError('Unexpected token'));
    }),
    text: vi.fn().mockResolvedValue(text),
  } as unknown as Response;
}

function mockNetworkError(): Promise<Response> {
  return Promise.reject(new TypeError('Failed to fetch'));
}

function mockAbortError(): Promise<Response> {
  const err = new DOMException('The operation was aborted.', 'AbortError');
  return Promise.reject(err);
}

// ============================================================
// Adapter instances (shared across describe blocks)
// ============================================================

const eaton = new EatonAdapter();
const toshiba = new ToshibaUPSAdapter();
const gude = new GudeAdapter();
const raritan = new RaritanAdapter();
const apc = new APCAdapter();
const cyberpower = new CyberPowerAdapter();

// ============================================================
// Setup / teardown
// ============================================================

beforeEach(() => {
  global.fetch = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ============================================================
// EATON adapter
// ============================================================

describe('EatonAdapter', () => {
  const IP = '192.168.1.10';

  it('happy path — returns reachable with health fields', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      mockJsonResponse({
        model: 'Eaton 5P',
        firmware: '1.2.3',
        uptime: 86400,
        battery_status: 'ok',
        battery_charge: 100,
        battery_runtime_remaining: 3600,
        input_voltage: 230,
        output_voltage: 230,
        output_load: 42,
        temperature: 30,
      })
    );

    const result = await eaton.queryHealth(IP);

    expect(result.reachable).toBe(true);
    expect(result.health).not.toBeNull();
    expect(result.health!.temperature).toBe(30);
    expect(result.health!.powerDraw).toBe(42);
    expect(result.health!.uptime).toBe(86400);
    expect(result.health!.errors).toHaveLength(0);
    expect(result.health!.warnings).toHaveLength(0);
    expect(result.firmware).toBe('1.2.3');
  });

  it('uses correct URL: /rest/mbdetnrs/1.0/powerDistributions/1/status', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      mockJsonResponse({ temperature: 25, output_load: 20 })
    );

    await eaton.queryHealth(IP, 80);

    expect(global.fetch).toHaveBeenCalledWith(
      `http://${IP}:80/rest/mbdetnrs/1.0/powerDistributions/1/status`,
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });

  it('uses custom port when provided', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      mockJsonResponse({ temperature: 25, output_load: 20 })
    );

    await eaton.queryHealth(IP, 8080);

    expect(global.fetch).toHaveBeenCalledWith(
      `http://${IP}:8080/rest/mbdetnrs/1.0/powerDistributions/1/status`,
      expect.any(Object)
    );
  });

  it('critical battery — battery_status=low generates error', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      mockJsonResponse({
        battery_status: 'low',
        battery_charge: 15,
        output_load: 30,
        temperature: 28,
      })
    );

    const result = await eaton.queryHealth(IP);

    expect(result.reachable).toBe(true);
    expect(result.health!.errors).toContain('Battery level low');
  });

  it('battery_charge < 50 generates warning', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      mockJsonResponse({
        battery_status: 'ok',
        battery_charge: 40,
        output_load: 30,
        temperature: 28,
      })
    );

    const result = await eaton.queryHealth(IP);

    expect(result.health!.warnings).toContain('Battery charge: 40%');
  });

  it('battery_charge >= 50 does not generate warning', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      mockJsonResponse({ battery_charge: 50, temperature: 28, output_load: 20 })
    );

    const result = await eaton.queryHealth(IP);

    const batteryWarnings = result.health!.warnings.filter((w) => w.includes('Battery charge'));
    expect(batteryWarnings).toHaveLength(0);
  });

  it('high load — output_load > 80 generates warning', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      mockJsonResponse({
        battery_status: 'ok',
        battery_charge: 95,
        output_load: 85,
        temperature: 28,
      })
    );

    const result = await eaton.queryHealth(IP);

    expect(result.health!.warnings).toContain('Output load: 85%');
  });

  it('output_load at boundary (80) does not generate warning', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      mockJsonResponse({ battery_charge: 95, output_load: 80, temperature: 28 })
    );

    const result = await eaton.queryHealth(IP);

    const loadWarnings = result.health!.warnings.filter((w) => w.includes('Output load'));
    expect(loadWarnings).toHaveLength(0);
  });

  it('temperature > 45 generates error', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      mockJsonResponse({ temperature: 46, battery_charge: 95, output_load: 20 })
    );

    const result = await eaton.queryHealth(IP);

    expect(result.health!.errors).toContain('UPS temperature critical: 46C');
    expect(result.health!.warnings.filter((w) => w.includes('temperature'))).toHaveLength(0);
  });

  it('temperature at 45 does not generate error', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      mockJsonResponse({ temperature: 45, battery_charge: 95, output_load: 20 })
    );

    const result = await eaton.queryHealth(IP);

    expect(result.health!.errors.filter((e) => e.includes('temperature'))).toHaveLength(0);
  });

  it('temperature > 35 and <= 45 generates warning', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      mockJsonResponse({ temperature: 38, battery_charge: 95, output_load: 20 })
    );

    const result = await eaton.queryHealth(IP);

    expect(result.health!.warnings).toContain('UPS temperature elevated: 38C');
    expect(result.health!.errors.filter((e) => e.includes('temperature'))).toHaveLength(0);
  });

  it('temperature at 35 does not generate warning', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      mockJsonResponse({ temperature: 35, battery_charge: 95, output_load: 20 })
    );

    const result = await eaton.queryHealth(IP);

    const tempWarnings = result.health!.warnings.filter((w) => w.includes('temperature'));
    expect(tempWarnings).toHaveLength(0);
  });

  it('network failure returns unreachable', async () => {
    vi.mocked(global.fetch).mockImplementationOnce(mockNetworkError);

    const result = await eaton.queryHealth(IP);

    expect(result.reachable).toBe(false);
    expect(result.health).toBeNull();
  });

  it('HTTP 500 returns unreachable', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(mockJsonResponse({}, 500));

    const result = await eaton.queryHealth(IP);

    expect(result.reachable).toBe(false);
    expect(result.health).toBeNull();
  });

  it('malformed JSON returns unreachable', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      mockTextResponse('not valid json')
    );
    // The adapter uses .json() directly (not fetchGudeJson), which will throw
    // and be caught — so result should be unreachable or null
    const result = await eaton.queryHealth(IP);
    expect(result.reachable).toBe(false);
  });

  it('timeout (AbortError) returns unreachable', async () => {
    vi.mocked(global.fetch).mockImplementationOnce(mockAbortError);

    const result = await eaton.queryHealth(IP);

    expect(result.reachable).toBe(false);
    expect(result.health).toBeNull();
  });

  it('missing fields default gracefully', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(mockJsonResponse({}));

    const result = await eaton.queryHealth(IP);

    expect(result.reachable).toBe(true);
    expect(result.health!.temperature).toBe(0);
    expect(result.health!.uptime).toBe(0);
    expect(result.health!.powerDraw).toBeUndefined();
  });
});

// ============================================================
// TOSHIBA adapter
// ============================================================

describe('ToshibaUPSAdapter', () => {
  const IP = '192.168.1.20';

  it('happy path — returns reachable with health fields', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      mockJsonResponse({
        model: 'Toshiba 1550EP',
        firmware: '3.4.1',
        uptime: 172800,
        battery_charge: 98,
        battery_status: 'ok',
        output_load: 35,
        temperature: 27,
        input_voltage: 230,
        output_voltage: 230,
      })
    );

    const result = await toshiba.queryHealth(IP);

    expect(result.reachable).toBe(true);
    expect(result.health!.temperature).toBe(27);
    expect(result.health!.powerDraw).toBe(35);
    expect(result.health!.uptime).toBe(172800);
    expect(result.health!.errors).toHaveLength(0);
    expect(result.health!.warnings).toHaveLength(0);
    expect(result.firmware).toBe('3.4.1');
  });

  it('uses correct fallback REST URL: /api/status', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      mockJsonResponse({ temperature: 25, output_load: 20 })
    );

    await toshiba.queryHealth(IP, 80);

    expect(global.fetch).toHaveBeenCalledWith(
      `http://${IP}:80/api/status`,
      expect.any(Object)
    );
  });

  it('battery_status=low generates error', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      mockJsonResponse({ battery_status: 'low', battery_charge: 10, temperature: 28, output_load: 20 })
    );

    const result = await toshiba.queryHealth(IP);

    expect(result.health!.errors).toContain('Battery level low');
  });

  it('battery_charge < 50 generates warning', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      mockJsonResponse({ battery_status: 'ok', battery_charge: 45, temperature: 28, output_load: 20 })
    );

    const result = await toshiba.queryHealth(IP);

    expect(result.health!.warnings).toContain('Battery charge: 45%');
  });

  it('output_load > 80 generates warning', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      mockJsonResponse({ battery_charge: 95, output_load: 90, temperature: 28 })
    );

    const result = await toshiba.queryHealth(IP);

    expect(result.health!.warnings).toContain('Output load: 90%');
  });

  it('temperature > 45 generates error (UPS threshold)', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      mockJsonResponse({ temperature: 50, battery_charge: 95, output_load: 20 })
    );

    const result = await toshiba.queryHealth(IP);

    expect(result.health!.errors).toContain('UPS temperature critical: 50C');
  });

  it('temperature 35–45 generates warning', async () => {
    for (const temp of [36, 40, 45]) {
      vi.mocked(global.fetch).mockResolvedValueOnce(
        mockJsonResponse({ temperature: temp, battery_charge: 95, output_load: 20 })
      );
      const result = await toshiba.queryHealth(IP);
      expect(result.health!.warnings).toContain(`UPS temperature elevated: ${temp}C`);
    }
  });

  it('network failure returns unreachable', async () => {
    vi.mocked(global.fetch).mockImplementationOnce(mockNetworkError);

    const result = await toshiba.queryHealth(IP);

    expect(result.reachable).toBe(false);
    expect(result.health).toBeNull();
  });

  it('timeout (AbortError) returns unreachable', async () => {
    vi.mocked(global.fetch).mockImplementationOnce(mockAbortError);

    const result = await toshiba.queryHealth(IP);

    expect(result.reachable).toBe(false);
  });

  it('HTTP 404 returns unreachable', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(mockJsonResponse({}, 404));

    const result = await toshiba.queryHealth(IP);

    expect(result.reachable).toBe(false);
  });

  it('empty JSON body defaults gracefully', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(mockJsonResponse({}));

    const result = await toshiba.queryHealth(IP);

    expect(result.reachable).toBe(true);
    expect(result.health!.temperature).toBe(0);
    expect(result.health!.uptime).toBe(0);
    expect(result.health!.errors).toHaveLength(0);
    expect(result.health!.warnings).toHaveLength(0);
  });
});

// ============================================================
// GUDE adapter
// ============================================================

describe('GudeAdapter', () => {
  const IP = '192.168.1.30';

  /** Build a Gude response body (may be plain JSON or JS-wrapped). */
  function gudeBody(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      product: 'Gude Expert Power Control 8035',
      firmware: '1.3.5',
      uptime: 259200,
      sensor: { temperature: 24, humidity: 45 },
      outputs: [
        { id: 1, state: true, current: 3.2, power: 736 },
        { id: 2, state: true, current: 1.1, power: 253 },
      ],
      total_power: 989,
      ...overrides,
    };
  }

  it('happy path (pure JSON) — parses correctly', async () => {
    const body = gudeBody();
    vi.mocked(global.fetch).mockResolvedValueOnce(mockJsonResponse(body));

    const result = await gude.queryHealth(IP);

    expect(result.reachable).toBe(true);
    expect(result.health!.temperature).toBe(24);
    expect(result.health!.powerDraw).toBe(989);
    expect(result.health!.uptime).toBe(259200);
    expect(result.health!.errors).toHaveLength(0);
    expect(result.health!.warnings).toHaveLength(0);
    expect(result.firmware).toBe('1.3.5');
  });

  it('uses correct URL: /statusjson.js', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(mockTextResponse(JSON.stringify(gudeBody())));

    await gude.queryHealth(IP, 80);

    expect(global.fetch).toHaveBeenCalledWith(
      `http://${IP}:80/statusjson.js`,
      expect.any(Object)
    );
  });

  it('JS-wrapped response (var json_data = {...};) is parsed correctly', async () => {
    const body = gudeBody({ sensor: { temperature: 22, humidity: 50 }, total_power: 500 });
    const jsWrapped = `var json_data = ${JSON.stringify(body)};`;

    vi.mocked(global.fetch).mockResolvedValueOnce(mockTextResponse(jsWrapped));

    const result = await gude.queryHealth(IP);

    expect(result.reachable).toBe(true);
    expect(result.health!.temperature).toBe(22);
    expect(result.health!.powerDraw).toBe(500);
  });

  it('JS-wrapped response with whitespace padding is parsed correctly', async () => {
    const body = gudeBody({ sensor: { temperature: 23, humidity: 55 }, total_power: 750 });
    const jsWrapped = `  var  statusData =\n${JSON.stringify(body)}\n;  `;

    vi.mocked(global.fetch).mockResolvedValueOnce(mockTextResponse(jsWrapped));

    const result = await gude.queryHealth(IP);

    expect(result.reachable).toBe(true);
    expect(result.health!.temperature).toBe(23);
  });

  it('humidity > 80 generates warning', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      mockTextResponse(JSON.stringify(gudeBody({ sensor: { temperature: 24, humidity: 85 } })))
    );

    const result = await gude.queryHealth(IP);

    expect(result.health!.warnings).toContain('Humidity high: 85%');
  });

  it('humidity at exactly 80 does not generate warning', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      mockTextResponse(JSON.stringify(gudeBody({ sensor: { temperature: 24, humidity: 80 } })))
    );

    const result = await gude.queryHealth(IP);

    expect(result.health!.warnings.filter((w) => w.includes('Humidity'))).toHaveLength(0);
  });

  it('outlet current > 12A generates warning listing count', async () => {
    const body = gudeBody({
      outputs: [
        { id: 1, state: true, current: 13.5, power: 3105 },
        { id: 2, state: true, current: 14.0, power: 3220 },
        { id: 3, state: true, current: 2.0, power: 460 },
      ],
    });
    vi.mocked(global.fetch).mockResolvedValueOnce(mockTextResponse(JSON.stringify(body)));

    const result = await gude.queryHealth(IP);

    expect(result.health!.warnings).toContain('2 outlet(s) drawing high current');
  });

  it('outlet current at exactly 12A does not generate warning', async () => {
    const body = gudeBody({
      outputs: [{ id: 1, state: true, current: 12.0, power: 2760 }],
    });
    vi.mocked(global.fetch).mockResolvedValueOnce(mockTextResponse(JSON.stringify(body)));

    const result = await gude.queryHealth(IP);

    expect(result.health!.warnings.filter((w) => w.includes('high current'))).toHaveLength(0);
  });

  it('temperature > 40 generates warning (PDU threshold)', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      mockTextResponse(JSON.stringify(gudeBody({ sensor: { temperature: 41, humidity: 45 } })))
    );

    const result = await gude.queryHealth(IP);

    expect(result.health!.warnings).toContain('Ambient temperature elevated: 41C');
  });

  it('temperature at 40 does not generate warning', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      mockTextResponse(JSON.stringify(gudeBody({ sensor: { temperature: 40, humidity: 45 } })))
    );

    const result = await gude.queryHealth(IP);

    expect(result.health!.warnings.filter((w) => w.includes('temperature'))).toHaveLength(0);
  });

  it('network failure returns unreachable', async () => {
    vi.mocked(global.fetch).mockImplementationOnce(mockNetworkError);

    const result = await gude.queryHealth(IP);

    expect(result.reachable).toBe(false);
    expect(result.health).toBeNull();
  });

  it('timeout (AbortError) returns unreachable', async () => {
    vi.mocked(global.fetch).mockImplementationOnce(mockAbortError);

    const result = await gude.queryHealth(IP);

    expect(result.reachable).toBe(false);
  });

  it('malformed response body returns unreachable', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(mockTextResponse('!!!not json!!!'));

    const result = await gude.queryHealth(IP);

    expect(result.reachable).toBe(false);
    expect(result.health).toBeNull();
  });

  it('HTTP 401 returns unreachable', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(mockTextResponse('Unauthorized', 401));

    const result = await gude.queryHealth(IP);

    expect(result.reachable).toBe(false);
  });

  it('missing sensor field defaults temperature to 0', async () => {
    const body = gudeBody();
    // @ts-expect-error intentionally removing sensor
    delete body.sensor;
    vi.mocked(global.fetch).mockResolvedValueOnce(mockTextResponse(JSON.stringify(body)));

    const result = await gude.queryHealth(IP);

    expect(result.reachable).toBe(true);
    expect(result.health!.temperature).toBe(0);
  });

  it('powerDraw extracted from total_power field', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      mockTextResponse(JSON.stringify(gudeBody({ total_power: 1200 })))
    );

    const result = await gude.queryHealth(IP);

    expect(result.health!.powerDraw).toBe(1200);
  });
});

// ============================================================
// RARITAN adapter
// ============================================================

describe('RaritanAdapter', () => {
  const IP = '192.168.1.40';

  function raritanBody(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      model: 'Raritan PX3-5190CR',
      firmware: '3.6.0',
      serial: 'PX3-SN001',
      uptime: 604800,
      inletPower: 1800,
      inletCurrent: 8.0,
      inletVoltage: 230,
      temperature: 26,
      humidity: 50,
      outlets: [
        { id: 1, name: 'Server-01', state: 'on', power: 400, current: 1.7 },
        { id: 2, name: 'Server-02', state: 'on', power: 350, current: 1.5 },
      ],
      ...overrides,
    };
  }

  it('happy path — returns reachable with correct health fields', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(mockJsonResponse(raritanBody()));

    const result = await raritan.queryHealth(IP);

    expect(result.reachable).toBe(true);
    expect(result.health!.temperature).toBe(26);
    expect(result.health!.powerDraw).toBe(1800);
    expect(result.health!.uptime).toBe(604800);
    expect(result.health!.errors).toHaveLength(0);
    expect(result.health!.warnings).toHaveLength(0);
    expect(result.firmware).toBe('3.6.0');
  });

  it('uses HTTPS and correct URL: /api/v1/status', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(mockJsonResponse(raritanBody()));

    await raritan.queryHealth(IP, 443);

    expect(global.fetch).toHaveBeenCalledWith(
      `https://${IP}:443/api/v1/status`,
      expect.any(Object)
    );
  });

  it('defaults to port 443 (HTTPS)', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(mockJsonResponse(raritanBody()));

    await raritan.queryHealth(IP);

    const calledUrl = vi.mocked(global.fetch).mock.calls[0][0] as string;
    expect(calledUrl).toMatch(/^https:\/\//);
    expect(calledUrl).toContain(':443');
  });

  it('inletCurrent > 16A generates warning', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      mockJsonResponse(raritanBody({ inletCurrent: 17.5 }))
    );

    const result = await raritan.queryHealth(IP);

    expect(result.health!.warnings).toContain('High inlet current: 17.5A');
  });

  it('inletCurrent at exactly 16A does not generate warning', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      mockJsonResponse(raritanBody({ inletCurrent: 16 }))
    );

    const result = await raritan.queryHealth(IP);

    expect(result.health!.warnings.filter((w) => w.includes('current'))).toHaveLength(0);
  });

  it('humidity > 80 generates warning', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      mockJsonResponse(raritanBody({ humidity: 82 }))
    );

    const result = await raritan.queryHealth(IP);

    expect(result.health!.warnings).toContain('Humidity high: 82%');
  });

  it('temperature > 40 generates warning (PDU threshold)', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      mockJsonResponse(raritanBody({ temperature: 41 }))
    );

    const result = await raritan.queryHealth(IP);

    expect(result.health!.warnings).toContain('Ambient temperature elevated: 41C');
  });

  it('temperature at 40 does not generate warning', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      mockJsonResponse(raritanBody({ temperature: 40 }))
    );

    const result = await raritan.queryHealth(IP);

    expect(result.health!.warnings.filter((w) => w.includes('temperature'))).toHaveLength(0);
  });

  it('powerDraw extracted from inletPower field', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      mockJsonResponse(raritanBody({ inletPower: 2200 }))
    );

    const result = await raritan.queryHealth(IP);

    expect(result.health!.powerDraw).toBe(2200);
  });

  it('network failure returns unreachable', async () => {
    vi.mocked(global.fetch).mockImplementationOnce(mockNetworkError);

    const result = await raritan.queryHealth(IP);

    expect(result.reachable).toBe(false);
    expect(result.health).toBeNull();
  });

  it('TLS / HTTPS error (self-signed cert) returns unreachable', async () => {
    vi.mocked(global.fetch).mockImplementationOnce(() =>
      Promise.reject(new TypeError('certificate has expired'))
    );

    const result = await raritan.queryHealth(IP);

    expect(result.reachable).toBe(false);
  });

  it('timeout (AbortError) returns unreachable', async () => {
    vi.mocked(global.fetch).mockImplementationOnce(mockAbortError);

    const result = await raritan.queryHealth(IP);

    expect(result.reachable).toBe(false);
  });

  it('malformed JSON returns unreachable', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: vi.fn().mockRejectedValue(new SyntaxError('Unexpected token')),
      text: vi.fn().mockResolvedValue('garbage'),
    } as unknown as Response);

    const result = await raritan.queryHealth(IP);

    expect(result.reachable).toBe(false);
  });

  it('empty JSON body defaults gracefully', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(mockJsonResponse({}));

    const result = await raritan.queryHealth(IP);

    expect(result.reachable).toBe(true);
    expect(result.health!.temperature).toBe(0);
    expect(result.health!.uptime).toBe(0);
    expect(result.health!.errors).toHaveLength(0);
    expect(result.health!.warnings).toHaveLength(0);
  });
});

// ============================================================
// APC adapter
// ============================================================

describe('APCAdapter', () => {
  const IP = '192.168.1.50';

  function apcBody(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      model: 'APC Smart-UPS 3000',
      firmware: 'UPS 09.7',
      serial: 'APC001',
      uptime: 432000,
      status: 'online',
      temperature: 28,
      battery_charge: 100,
      battery_runtime: 1800,
      input_voltage: 230,
      output_load: 38,
      output_power: 1100,
      total_power: 1100,
      ...overrides,
    };
  }

  it('happy path — returns reachable with all health fields', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(mockJsonResponse(apcBody()));

    const result = await apc.queryHealth(IP);

    expect(result.reachable).toBe(true);
    expect(result.health!.temperature).toBe(28);
    expect(result.health!.powerDraw).toBe(1100);
    expect(result.health!.uptime).toBe(432000);
    expect(result.health!.errors).toHaveLength(0);
    expect(result.health!.warnings).toHaveLength(0);
    expect(result.firmware).toBe('UPS 09.7');
  });

  it('uses correct URL: /api/status', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(mockJsonResponse(apcBody()));

    await apc.queryHealth(IP, 80);

    expect(global.fetch).toHaveBeenCalledWith(
      `http://${IP}:80/api/status`,
      expect.any(Object)
    );
  });

  it('battery_charge < 50 generates warning', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      mockJsonResponse(apcBody({ battery_charge: 45 }))
    );

    const result = await apc.queryHealth(IP);

    expect(result.health!.warnings).toContain('Battery charge: 45%');
  });

  it('battery_charge < 20 generates both warning and error', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      mockJsonResponse(apcBody({ battery_charge: 15 }))
    );

    const result = await apc.queryHealth(IP);

    expect(result.health!.warnings).toContain('Battery charge: 15%');
    expect(result.health!.errors).toContain('Battery critically low: 15%');
  });

  it('battery_charge at exactly 20 generates warning but not error', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      mockJsonResponse(apcBody({ battery_charge: 20 }))
    );

    const result = await apc.queryHealth(IP);

    expect(result.health!.warnings).toContain('Battery charge: 20%');
    expect(result.health!.errors.filter((e) => e.includes('critically'))).toHaveLength(0);
  });

  it('output_load > 80 generates warning', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      mockJsonResponse(apcBody({ output_load: 85 }))
    );

    const result = await apc.queryHealth(IP);

    expect(result.health!.warnings).toContain('Output load: 85%');
  });

  it('temperature > 40 generates warning', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      mockJsonResponse(apcBody({ temperature: 42 }))
    );

    const result = await apc.queryHealth(IP);

    expect(result.health!.warnings).toContain('Temperature elevated: 42C');
  });

  it('powerDraw uses output_power when present', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      mockJsonResponse(apcBody({ output_power: 900, total_power: 800 }))
    );

    const result = await apc.queryHealth(IP);

    expect(result.health!.powerDraw).toBe(900);
  });

  it('powerDraw falls back to total_power when output_power absent', async () => {
    const body = apcBody({ total_power: 750 });
    // @ts-expect-error intentionally removing output_power
    delete body.output_power;
    vi.mocked(global.fetch).mockResolvedValueOnce(mockJsonResponse(body));

    const result = await apc.queryHealth(IP);

    expect(result.health!.powerDraw).toBe(750);
  });

  it('network failure returns unreachable', async () => {
    vi.mocked(global.fetch).mockImplementationOnce(mockNetworkError);

    const result = await apc.queryHealth(IP);

    expect(result.reachable).toBe(false);
    expect(result.health).toBeNull();
  });

  it('timeout (AbortError) returns unreachable', async () => {
    vi.mocked(global.fetch).mockImplementationOnce(mockAbortError);

    const result = await apc.queryHealth(IP);

    expect(result.reachable).toBe(false);
  });

  it('HTTP 403 returns unreachable', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(mockJsonResponse({}, 403));

    const result = await apc.queryHealth(IP);

    expect(result.reachable).toBe(false);
  });

  it('empty JSON body defaults gracefully', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(mockJsonResponse({}));

    const result = await apc.queryHealth(IP);

    expect(result.reachable).toBe(true);
    expect(result.health!.temperature).toBe(0);
    expect(result.health!.uptime).toBe(0);
    expect(result.health!.powerDraw).toBeUndefined();
  });
});

// ============================================================
// CYBERPOWER adapter
// ============================================================

describe('CyberPowerAdapter', () => {
  const IP = '192.168.1.60';

  function cyberpowerBody(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      model: 'CyberPower OL2200RTXL2U',
      firmware: '1.5.2',
      uptime: 345600,
      temperature: 29,
      battery_charge: 100,
      output_load: 40,
      total_power: 880,
      input_voltage: 120,
      ...overrides,
    };
  }

  it('happy path — returns reachable with all health fields', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(mockJsonResponse(cyberpowerBody()));

    const result = await cyberpower.queryHealth(IP);

    expect(result.reachable).toBe(true);
    expect(result.health!.temperature).toBe(29);
    expect(result.health!.powerDraw).toBe(880);
    expect(result.health!.uptime).toBe(345600);
    expect(result.health!.errors).toHaveLength(0);
    expect(result.health!.warnings).toHaveLength(0);
    expect(result.firmware).toBe('1.5.2');
  });

  it('uses correct URL: /api/status', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(mockJsonResponse(cyberpowerBody()));

    await cyberpower.queryHealth(IP, 80);

    expect(global.fetch).toHaveBeenCalledWith(
      `http://${IP}:80/api/status`,
      expect.any(Object)
    );
  });

  it('battery_charge < 50 generates warning', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      mockJsonResponse(cyberpowerBody({ battery_charge: 35 }))
    );

    const result = await cyberpower.queryHealth(IP);

    expect(result.health!.warnings).toContain('Battery charge: 35%');
  });

  it('battery_charge < 20 generates both warning and error (critical)', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      mockJsonResponse(cyberpowerBody({ battery_charge: 10 }))
    );

    const result = await cyberpower.queryHealth(IP);

    expect(result.health!.warnings).toContain('Battery charge: 10%');
    expect(result.health!.errors).toContain('Battery critically low: 10%');
  });

  it('battery_charge at 20 generates warning only (not error)', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      mockJsonResponse(cyberpowerBody({ battery_charge: 20 }))
    );

    const result = await cyberpower.queryHealth(IP);

    expect(result.health!.warnings).toContain('Battery charge: 20%');
    expect(result.health!.errors.filter((e) => e.includes('critically'))).toHaveLength(0);
  });

  it('output_load > 80 generates warning', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      mockJsonResponse(cyberpowerBody({ output_load: 88 }))
    );

    const result = await cyberpower.queryHealth(IP);

    expect(result.health!.warnings).toContain('Output load: 88%');
  });

  it('output_load at 80 does not generate warning', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      mockJsonResponse(cyberpowerBody({ output_load: 80 }))
    );

    const result = await cyberpower.queryHealth(IP);

    expect(result.health!.warnings.filter((w) => w.includes('Output load'))).toHaveLength(0);
  });

  it('temperature > 40 generates warning', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      mockJsonResponse(cyberpowerBody({ temperature: 43 }))
    );

    const result = await cyberpower.queryHealth(IP);

    expect(result.health!.warnings).toContain('Temperature elevated: 43C');
  });

  it('temperature at 40 does not generate warning', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      mockJsonResponse(cyberpowerBody({ temperature: 40 }))
    );

    const result = await cyberpower.queryHealth(IP);

    expect(result.health!.warnings.filter((w) => w.includes('Temperature'))).toHaveLength(0);
  });

  it('powerDraw extracted from total_power field', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      mockJsonResponse(cyberpowerBody({ total_power: 1500 }))
    );

    const result = await cyberpower.queryHealth(IP);

    expect(result.health!.powerDraw).toBe(1500);
  });

  it('network failure returns unreachable', async () => {
    vi.mocked(global.fetch).mockImplementationOnce(mockNetworkError);

    const result = await cyberpower.queryHealth(IP);

    expect(result.reachable).toBe(false);
    expect(result.health).toBeNull();
  });

  it('timeout (AbortError) returns unreachable', async () => {
    vi.mocked(global.fetch).mockImplementationOnce(mockAbortError);

    const result = await cyberpower.queryHealth(IP);

    expect(result.reachable).toBe(false);
  });

  it('HTTP 503 returns unreachable', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(mockJsonResponse({}, 503));

    const result = await cyberpower.queryHealth(IP);

    expect(result.reachable).toBe(false);
  });

  it('empty JSON body defaults gracefully', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(mockJsonResponse({}));

    const result = await cyberpower.queryHealth(IP);

    expect(result.reachable).toBe(true);
    expect(result.health!.temperature).toBe(0);
    expect(result.health!.uptime).toBe(0);
    expect(result.health!.powerDraw).toBeUndefined();
  });
});

// ============================================================
// Cross-adapter: Temperature boundary tests (UPS vs PDU)
// ============================================================

describe('Temperature boundary values — UPS adapters (Eaton / Toshiba)', () => {
  const IP = '10.0.0.1';
  const upsAdapters = [
    { name: 'EatonAdapter', adapter: eaton, urlFactory: (ip: string, port: number) => `http://${ip}:${port}/rest/mbdetnrs/1.0/powerDistributions/1/status` },
    { name: 'ToshibaUPSAdapter', adapter: toshiba, urlFactory: (ip: string, port: number) => `http://${ip}:${port}/api/status` },
  ];

  for (const { name, adapter } of upsAdapters) {
    describe(name, () => {
      it('temp = 34: no warnings or errors', async () => {
        vi.mocked(global.fetch).mockResolvedValueOnce(
          mockJsonResponse({ temperature: 34, battery_charge: 95, output_load: 20 })
        );
        const result = await adapter.queryHealth(IP);
        expect(result.health!.warnings.filter((w) => w.includes('temp')).length).toBe(0);
        expect(result.health!.errors.filter((e) => e.includes('temp')).length).toBe(0);
      });

      it('temp = 35: no warning (boundary — NOT above 35)', async () => {
        vi.mocked(global.fetch).mockResolvedValueOnce(
          mockJsonResponse({ temperature: 35, battery_charge: 95, output_load: 20 })
        );
        const result = await adapter.queryHealth(IP);
        expect(result.health!.warnings.filter((w) => w.toLowerCase().includes('temperature')).length).toBe(0);
      });

      it('temp = 36: warning generated (above 35)', async () => {
        vi.mocked(global.fetch).mockResolvedValueOnce(
          mockJsonResponse({ temperature: 36, battery_charge: 95, output_load: 20 })
        );
        const result = await adapter.queryHealth(IP);
        expect(result.health!.warnings.some((w) => w.includes('elevated') && w.includes('36C'))).toBe(true);
      });

      it('temp = 45: warning generated (still below error threshold)', async () => {
        vi.mocked(global.fetch).mockResolvedValueOnce(
          mockJsonResponse({ temperature: 45, battery_charge: 95, output_load: 20 })
        );
        const result = await adapter.queryHealth(IP);
        expect(result.health!.warnings.some((w) => w.includes('45C'))).toBe(true);
        expect(result.health!.errors.filter((e) => e.includes('temperature')).length).toBe(0);
      });

      it('temp = 46: error generated (above 45)', async () => {
        vi.mocked(global.fetch).mockResolvedValueOnce(
          mockJsonResponse({ temperature: 46, battery_charge: 95, output_load: 20 })
        );
        const result = await adapter.queryHealth(IP);
        expect(result.health!.errors.some((e) => e.includes('critical') && e.includes('46C'))).toBe(true);
        expect(result.health!.warnings.filter((w) => w.includes('elevated')).length).toBe(0);
      });
    });
  }
});

describe('Temperature boundary values — PDU adapters (Gude / Raritan / APC / CyberPower)', () => {
  const IP = '10.0.0.1';

  const pduCases: Array<{
    name: string;
    adapter: { queryHealth: (ip: string, port?: number) => Promise<{ reachable: boolean; health: { temperature: number; warnings: string[]; errors: string[] } | null }> };
    bodyFactory: (temp: number) => Record<string, unknown>;
    mockMode: 'json' | 'text';
  }> = [
    {
      name: 'GudeAdapter',
      adapter: gude,
      bodyFactory: (temp) => JSON.parse(JSON.stringify({ sensor: { temperature: temp, humidity: 45 }, outputs: [], total_power: 500, uptime: 100 })),
      mockMode: 'text',
    },
    {
      name: 'RaritanAdapter',
      adapter: raritan,
      bodyFactory: (temp) => ({ temperature: temp, inletPower: 500, inletCurrent: 8, uptime: 100 }),
      mockMode: 'json',
    },
    {
      name: 'APCAdapter',
      adapter: apc,
      bodyFactory: (temp) => ({ temperature: temp, battery_charge: 100, output_load: 30, output_power: 500, uptime: 100 }),
      mockMode: 'json',
    },
    {
      name: 'CyberPowerAdapter',
      adapter: cyberpower,
      bodyFactory: (temp) => ({ temperature: temp, battery_charge: 100, output_load: 30, total_power: 500, uptime: 100 }),
      mockMode: 'json',
    },
  ];

  function mockForAdapter(body: Record<string, unknown>, mode: 'json' | 'text'): Response {
    return mode === 'json'
      ? mockJsonResponse(body)
      : mockTextResponse(JSON.stringify(body));
  }

  for (const { name, adapter, bodyFactory, mockMode } of pduCases) {
    describe(name, () => {
      it('temp = 40: no warnings', async () => {
        vi.mocked(global.fetch).mockResolvedValueOnce(mockForAdapter(bodyFactory(40), mockMode));
        const result = await adapter.queryHealth(IP);
        expect(result.health!.warnings.filter((w) => w.includes('temperature') || w.includes('Temperature') || w.includes('Ambient')).length).toBe(0);
      });

      it('temp = 41: warning generated (above 40)', async () => {
        vi.mocked(global.fetch).mockResolvedValueOnce(mockForAdapter(bodyFactory(41), mockMode));
        const result = await adapter.queryHealth(IP);
        expect(result.health!.warnings.some((w) => w.includes('41C'))).toBe(true);
      });

      it('temp = 50: warning generated (PDU has no error threshold for temp)', async () => {
        vi.mocked(global.fetch).mockResolvedValueOnce(mockForAdapter(bodyFactory(50), mockMode));
        const result = await adapter.queryHealth(IP);
        expect(result.health!.warnings.some((w) => w.includes('50C'))).toBe(true);
        // PDU adapters only warn on temperature — no separate error threshold
        expect(result.health!.errors.filter((e) => e.includes('temperature') || e.includes('Temperature')).length).toBe(0);
      });
    });
  }
});

// ============================================================
// Index mapping smoke test
// ============================================================

describe('Adapter index — all 6 power adapters are mapped', () => {
  it('getAdapter returns correct adapter for each power manufacturer', async () => {
    const { getAdapter } = await import('../index');

    expect(getAdapter('eaton').manufacturer).toBe('eaton');
    expect(getAdapter('toshiba').manufacturer).toBe('toshiba');
    expect(getAdapter('gude').manufacturer).toBe('gude');
    expect(getAdapter('raritan').manufacturer).toBe('raritan');
    expect(getAdapter('apc').manufacturer).toBe('apc');
    expect(getAdapter('cyberpower').manufacturer).toBe('cyberpower');
  });
});
