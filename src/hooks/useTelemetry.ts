'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type {
  TelemetrySnapshot,
  MetricSeries,
  AnomalyEvent,
  DataPoint,
  TimeRange,
} from '@/lib/telemetry-types';
import { getTelemetryHistory, telemetryStream } from '@/lib/telemetry-api';
import { METRICS, CHART_COLORS, getMetricColor } from '@/lib/metric-definitions';

// Maximum data points to render before downsampling kicks in
const MAX_CHART_POINTS = 300;

/** Downsample an array by taking every Nth element, always keeping first and last. */
function downsample<T>(arr: T[], maxPoints: number): T[] {
  if (arr.length <= maxPoints) return arr;
  const step = Math.ceil(arr.length / maxPoints);
  const result: T[] = [];
  for (let i = 0; i < arr.length; i += step) {
    result.push(arr[i]);
  }
  // Always include the last point
  if (result[result.length - 1] !== arr[arr.length - 1]) {
    result.push(arr[arr.length - 1]);
  }
  return result;
}

/** Transform raw snapshots into MetricSeries[] for charting. */
function buildSeries(snapshots: TelemetrySnapshot[]): MetricSeries[] {
  if (snapshots.length === 0) return [];

  // Collect unique devices across all snapshots
  const deviceMap = new Map<string, string>(); // deviceId -> deviceName
  for (const snap of snapshots) {
    for (const srv of snap.servers) {
      if (!deviceMap.has(srv.deviceId)) {
        deviceMap.set(srv.deviceId, srv.deviceName);
      }
    }
  }

  const series: MetricSeries[] = [];
  const deviceIds = Array.from(deviceMap.keys());

  for (const metric of METRICS) {
    for (let di = 0; di < deviceIds.length; di++) {
      const deviceId = deviceIds[di];
      const deviceName = deviceMap.get(deviceId) ?? deviceId;
      const colorIndex = (di * METRICS.length + METRICS.indexOf(metric)) % CHART_COLORS.length;

      const data: DataPoint[] = [];
      for (const snap of snapshots) {
        const srv = snap.servers.find((s) => s.deviceId === deviceId);
        if (!srv) continue;
        const value = metric.extract(srv);
        if (value === undefined) continue;
        data.push({ timestamp: snap.timestamp, value });
      }

      if (data.length === 0) continue;

      series.push({
        deviceId,
        deviceName,
        metricKey: metric.key,
        label: `${deviceName} - ${metric.label}`,
        unit: metric.unit,
        data: downsample(data, MAX_CHART_POINTS),
        color: CHART_COLORS[colorIndex],
      });
    }
  }

  return series;
}

/** Detect threshold violations from the latest snapshot. */
function detectAnomalies(snapshots: TelemetrySnapshot[]): AnomalyEvent[] {
  const anomalies: AnomalyEvent[] = [];
  const seen = new Set<string>();

  // Walk newest-first so we pick up the latest occurrences first
  for (let i = snapshots.length - 1; i >= 0; i--) {
    const snap = snapshots[i];
    for (const srv of snap.servers) {
      for (const metric of METRICS) {
        const value = metric.extract(srv);
        if (value === undefined) continue;

        const color = getMetricColor(metric, value);
        if (color === '#22c55e') continue; // healthy, no anomaly

        const severity = color === '#EF4444' ? 'critical' : 'warning';
        const threshold =
          metric.direction === 'above'
            ? severity === 'critical'
              ? metric.thresholds[1]
              : metric.thresholds[0]
            : severity === 'critical'
              ? metric.thresholds[1]
              : metric.thresholds[0];

        const dedupKey = `${srv.deviceId}-${metric.key}-${severity}`;
        if (seen.has(dedupKey)) continue;
        seen.add(dedupKey);

        anomalies.push({
          id: `${snap.timestamp}-${srv.deviceId}-${metric.key}`,
          timestamp: snap.timestamp,
          deviceId: srv.deviceId,
          deviceName: srv.deviceName,
          metricKey: metric.key,
          metricLabel: metric.label,
          value,
          threshold,
          severity,
          unit: metric.unit,
        });
      }
    }
  }

  return anomalies.sort((a, b) => b.timestamp - a.timestamp);
}

interface UseTelemetryResult {
  series: MetricSeries[];
  anomalies: AnomalyEvent[];
  snapshots: TelemetrySnapshot[];
  loading: boolean;
  latestSnapshot: TelemetrySnapshot | null;
}

/**
 * Hook to fetch and stream telemetry data for charting.
 *
 * @param timeRange - The historical window to load
 * @param liveMode  - When true, subscribes to the SSE stream and appends incoming snapshots
 */
export function useTelemetry(timeRange: TimeRange, liveMode: boolean): UseTelemetryResult {
  const [snapshots, setSnapshots] = useState<TelemetrySnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Fetch history whenever timeRange changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    getTelemetryHistory(timeRange).then((data) => {
      if (cancelled) return;
      setSnapshots(data);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [timeRange]);

  // Live mode SSE subscription
  useEffect(() => {
    if (!liveMode) return;

    const cleanup = telemetryStream((incoming) => {
      setSnapshots((prev) => {
        const next = [...prev, incoming];
        // Trim snapshots older than the selected window to avoid unbounded growth
        const rangeMs: Record<TimeRange, number> = {
          '5m': 5 * 60_000,
          '15m': 15 * 60_000,
          '1h': 60 * 60_000,
          '6h': 6 * 60 * 60_000,
          '24h': 24 * 60 * 60_000,
        };
        const cutoff = Date.now() - rangeMs[timeRange];
        return next.filter((s) => s.timestamp >= cutoff);
      });
    });

    cleanupRef.current = cleanup;
    return () => {
      cleanup();
      cleanupRef.current = null;
    };
  }, [liveMode, timeRange]);

  const series = buildSeries(snapshots);
  const anomalies = detectAnomalies(snapshots);
  const latestSnapshot = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;

  return { series, anomalies, snapshots, loading, latestSnapshot };
}
