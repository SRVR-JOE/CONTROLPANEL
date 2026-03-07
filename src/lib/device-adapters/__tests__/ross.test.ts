/**
 * Ross OpenGear Adapter Tests
 *
 * Tests the health-query logic for the Ross openGear frame adapter.
 * All network calls are mocked via vi.fn() — no real HTTP traffic.
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { RossAdapter } from '../ross';

global.fetch = vi.fn();

function mockFetchOkHtml(html: string): void {
  (fetch as Mock).mockResolvedValueOnce({
    ok: true,
    status: 200,
    text: async () => html,
    headers: { get: () => null },
  });
}

function mockFetchNetworkError(message = 'ECONNREFUSED'): void {
  (fetch as Mock).mockRejectedValueOnce(new Error(message));
}

function mockFetchTimeout(): void {
  (fetch as Mock).mockRejectedValueOnce(new Error('abort'));
}

beforeEach(() => {
  vi.mocked(fetch).mockReset();
});

describe('RossAdapter', () => {
  const adapter = new RossAdapter();
  const ip = '192.168.100.55';

  it('returns reachable:true when HTTP port 80 responds', async () => {
    mockFetchOkHtml('<html><body>Ross openGear Frame</body></html>');
    const result = await adapter.queryHealth(ip);
    expect(result.reachable).toBe(true);
    expect(result.health).not.toBeNull();
  });

  it('parses temperature from HTML response', async () => {
    mockFetchOkHtml('<html><body>Frame Temperature: 42°C</body></html>');
    const result = await adapter.queryHealth(ip);
    expect(result.reachable).toBe(true);
    expect(result.health?.temperature).toBe(42);
  });

  it('adds warning for elevated temperature', async () => {
    mockFetchOkHtml('<html><body>Temperature: 48°C</body></html>');
    const result = await adapter.queryHealth(ip);
    expect(result.health?.warnings).toEqual(
      expect.arrayContaining([expect.stringContaining('elevated')])
    );
  });

  it('adds error for critical temperature', async () => {
    mockFetchOkHtml('<html><body>Temperature: 58°C</body></html>');
    const result = await adapter.queryHealth(ip);
    expect(result.health?.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('critical')])
    );
  });

  it('detects PSU failure', async () => {
    mockFetchOkHtml('<html><body>PSU 1: ok PSU 2: fail</body></html>');
    const result = await adapter.queryHealth(ip);
    expect(result.health?.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('PSU')])
    );
  });

  it('extracts populated slot count', async () => {
    mockFetchOkHtml('<html><body>14 of 20 slots populated</body></html>');
    const result = await adapter.queryHealth(ip);
    expect(result.firmware).toContain('14 slots');
  });

  it('falls back to DashBoard port 5253 when HTTP fails', async () => {
    // Port 80 fails
    mockFetchNetworkError();
    // Port 5253 responds (unexpected HTTP response, but connection succeeded)
    mockFetchOkHtml('');
    const result = await adapter.queryHealth(ip);
    expect(result.reachable).toBe(true);
  });

  it('returns unreachable when both HTTP and DashBoard timeout', async () => {
    mockFetchTimeout(); // port 80
    mockFetchTimeout(); // port 5253
    const result = await adapter.queryHealth(ip);
    expect(result.reachable).toBe(false);
    expect(result.health).toBeNull();
  });
});
