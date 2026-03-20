// ============================================================
// Telemetry — API Client
// ============================================================

import type { TelemetrySnapshot, TelemetryConfig, TimeRange } from './telemetry-types';

const RANGE_MS: Record<TimeRange, number> = {
  '5m': 5 * 60_000,
  '15m': 15 * 60_000,
  '1h': 60 * 60_000,
  '6h': 6 * 60 * 60_000,
  '24h': 24 * 60 * 60_000,
};

export async function getTelemetryHistory(range: TimeRange): Promise<TelemetrySnapshot[]> {
  const res = await fetch(`/api/telemetry/history?range=${range}`);
  if (!res.ok) return [];
  return res.json();
}

export async function getTelemetryLatest(): Promise<TelemetrySnapshot | null> {
  const res = await fetch('/api/telemetry/latest');
  if (!res.ok) return null;
  return res.json();
}

export async function triggerSnapshot(): Promise<TelemetrySnapshot | null> {
  const res = await fetch('/api/telemetry/latest', { method: 'POST' });
  if (!res.ok) return null;
  return res.json();
}

export async function setTelemetryServers(deviceIds: string[]): Promise<void> {
  await fetch('/api/telemetry/servers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceIds }),
  });
}

export async function updateTelemetryConfig(config: Partial<TelemetryConfig>): Promise<void> {
  await fetch('/api/telemetry/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
}

/** Open an SSE stream for real-time telemetry updates */
export function telemetryStream(onSnapshot: (snapshot: TelemetrySnapshot) => void): () => void {
  const es = new EventSource('/api/telemetry/stream');
  es.onmessage = (e) => {
    try {
      const snapshot: TelemetrySnapshot = JSON.parse(e.data);
      onSnapshot(snapshot);
    } catch {
      // ignore parse errors
    }
  };
  es.onerror = () => {
    // EventSource auto-reconnects
  };
  return () => es.close();
}

export { RANGE_MS };
