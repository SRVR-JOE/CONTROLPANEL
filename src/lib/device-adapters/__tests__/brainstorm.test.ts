/**
 * Brainstorm Electronics Adapter Tests
 *
 * Tests the health-query logic for Brainstorm SR-112 and DXD-8 adapters.
 * All network calls are mocked via vi.fn() — no real HTTP traffic.
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { BrainstormAdapter } from '../brainstorm';

global.fetch = vi.fn();

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

describe('BrainstormAdapter', () => {
  const adapter = new BrainstormAdapter();
  const ip = '192.168.100.63';

  it('returns reachable:true when web interface responds', async () => {
    mockFetchOkHtml('<html><body>Brainstorm SR-112</body></html>');
    const result = await adapter.queryHealth(ip);
    expect(result.reachable).toBe(true);
    expect(result.health).not.toBeNull();
  });

  it('detects sync locked status', async () => {
    mockFetchOkHtml('<html>Sync: Locked</html>');
    const result = await adapter.queryHealth(ip);
    expect(result.reachable).toBe(true);
    expect(result.health?.warnings).toHaveLength(0);
  });

  it('warns on sync unlocked status', async () => {
    mockFetchOkHtml('<html>Sync: Unlocked</html>');
    const result = await adapter.queryHealth(ip);
    expect(result.health?.warnings).toEqual(
      expect.arrayContaining([expect.stringContaining('Unlocked')])
    );
  });

  it('warns on free-run sync status', async () => {
    mockFetchOkHtml('<html>Sync: Free-Run</html>');
    const result = await adapter.queryHealth(ip);
    expect(result.health?.warnings).toEqual(
      expect.arrayContaining([expect.stringContaining('Free-Run')])
    );
  });

  it('extracts timecode from HTML', async () => {
    mockFetchOkHtml('<html>Timecode: 01:23:45:12</html>');
    const result = await adapter.queryHealth(ip);
    expect(result.firmware).toContain('TC: 01:23:45:12');
  });

  it('extracts frequency from HTML', async () => {
    mockFetchOkHtml('<html>48.000 kHz</html>');
    const result = await adapter.queryHealth(ip);
    expect(result.firmware).toContain('48.000 kHz');
  });

  it('extracts firmware version from HTML', async () => {
    mockFetchOkHtml('<html>Firmware: v2.14</html>');
    const result = await adapter.queryHealth(ip);
    expect(result.firmware).toContain('FW 2.14');
  });

  it('combines multiple metadata fields', async () => {
    mockFetchOkHtml('<html>Timecode: 00:00:00:00 48.000 kHz Firmware: v2.14</html>');
    const result = await adapter.queryHealth(ip);
    expect(result.firmware).toContain('TC:');
    expect(result.firmware).toContain('kHz');
    expect(result.firmware).toContain('FW');
  });

  it('returns unreachable when device is offline', async () => {
    mockFetchNetworkError();
    const result = await adapter.queryHealth(ip);
    expect(result.reachable).toBe(false);
    expect(result.health).toBeNull();
  });
});
