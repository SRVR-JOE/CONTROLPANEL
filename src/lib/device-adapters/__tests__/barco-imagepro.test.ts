/**
 * Barco ImagePro 4K Adapter Tests
 *
 * Tests the health-query logic for the Barco ImagePro 4K adapter.
 * All network calls are mocked via vi.fn() — no real HTTP traffic.
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { BarcoImageProAdapter } from '../barco-imagepro';

global.fetch = vi.fn();

function mockFetchOkJson(body: Record<string, unknown>): void {
  (fetch as Mock).mockResolvedValueOnce({
    ok: true,
    status: 200,
    text: async () => JSON.stringify(body),
    headers: { get: () => null },
  });
}

function mockFetchOkHtml(html: string): void {
  (fetch as Mock).mockResolvedValueOnce({
    ok: true,
    status: 200,
    text: async () => html,
    headers: { get: () => null },
  });
}

function mockFetchNetworkError(): void {
  (fetch as Mock).mockRejectedValueOnce(new Error('ECONNREFUSED'));
}

beforeEach(() => {
  vi.mocked(fetch).mockReset();
});

describe('BarcoImageProAdapter', () => {
  const adapter = new BarcoImageProAdapter();
  const ip = '192.168.100.69';

  it('parses JSON API response with status data', async () => {
    mockFetchOkJson({
      temperature: 42,
      inputSignal: true,
      inputResolution: '3840x2160p60',
      firmwareVersion: '3.2.1',
    });
    const result = await adapter.queryHealth(ip);
    expect(result.reachable).toBe(true);
    expect(result.health?.temperature).toBe(42);
    expect(result.firmware).toContain('3840x2160p60');
    expect(result.firmware).toContain('FW 3.2.1');
  });

  it('warns when no input signal detected (JSON)', async () => {
    mockFetchOkJson({ temperature: 35, inputSignal: 'no signal' });
    const result = await adapter.queryHealth(ip);
    expect(result.health?.warnings).toEqual(
      expect.arrayContaining([expect.stringContaining('No input signal')])
    );
  });

  it('warns on elevated temperature', async () => {
    mockFetchOkJson({ temperature: 55 });
    const result = await adapter.queryHealth(ip);
    expect(result.health?.warnings).toEqual(
      expect.arrayContaining([expect.stringContaining('elevated')])
    );
  });

  it('errors on critical temperature', async () => {
    mockFetchOkJson({ temperature: 70 });
    const result = await adapter.queryHealth(ip);
    expect(result.health?.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('critical')])
    );
  });

  it('falls back to HTML parsing when JSON fails', async () => {
    mockFetchOkHtml('<html>Temperature: 38°C Input: active 1920x1080 Firmware: v2.0.5</html>');
    const result = await adapter.queryHealth(ip);
    expect(result.reachable).toBe(true);
    expect(result.health?.temperature).toBe(38);
    expect(result.firmware).toContain('1920x1080');
    expect(result.firmware).toContain('FW 2.0.5');
  });

  it('detects no signal from HTML', async () => {
    mockFetchOkHtml('<html>Input: No Signal</html>');
    const result = await adapter.queryHealth(ip);
    expect(result.health?.warnings).toEqual(
      expect.arrayContaining([expect.stringContaining('No input signal')])
    );
  });

  it('tries multiple API paths before giving up', async () => {
    // All 4 paths fail
    mockFetchNetworkError(); // /api/status
    mockFetchNetworkError(); // /cgi-bin/status
    mockFetchNetworkError(); // /status
    mockFetchNetworkError(); // /
    const result = await adapter.queryHealth(ip);
    expect(result.reachable).toBe(false);
    expect(result.health).toBeNull();
  });

  it('succeeds on second path when first fails', async () => {
    mockFetchNetworkError(); // /api/status fails
    mockFetchOkJson({ temperature: 30 }); // /cgi-bin/status succeeds
    const result = await adapter.queryHealth(ip);
    expect(result.reachable).toBe(true);
    expect(result.health?.temperature).toBe(30);
  });
});
