'use client';

import React, { useState, useMemo } from 'react';
import type { TelemetrySnapshot, DataPoint } from '@/lib/telemetry-types';
import { METRICS, getMetricColor } from '@/lib/metric-definitions';
import type { MetricDefinition } from '@/lib/metric-definitions';
import Sparkline from './Sparkline';

interface HeatmapGridProps {
  snapshots: TelemetrySnapshot[];
  selectedDeviceIds: string[];
}

/** Compute a continuous HSL color based on the metric value relative to thresholds. */
function getCellColor(metric: MetricDefinition, value: number): string {
  const [t1, t2] = metric.thresholds;

  if (metric.direction === 'above') {
    // Green (120) -> Amber (45) -> Red (0)
    if (value <= t1 * 0.5) return 'hsl(120, 60%, 30%)';
    if (value <= t1) {
      const pct = (value - t1 * 0.5) / (t1 * 0.5);
      const hue = 120 - pct * 75; // 120 -> 45
      return `hsl(${hue}, 60%, ${30 + pct * 5}%)`;
    }
    if (value <= t2) {
      const pct = (value - t1) / (t2 - t1);
      const hue = 45 - pct * 45; // 45 -> 0
      return `hsl(${hue}, 70%, ${35 + pct * 5}%)`;
    }
    return 'hsl(0, 70%, 40%)';
  }

  // Direction 'below' — low values are bad
  // t1 is green floor, t2 is red floor (t1 > t2)
  if (value >= t1 * 1.5) return 'hsl(120, 60%, 30%)';
  if (value >= t1) {
    const pct = 1 - (value - t1) / (t1 * 0.5);
    const hue = 120 - pct * 75;
    return `hsl(${hue}, 60%, ${30 + pct * 5}%)`;
  }
  if (value >= t2) {
    const pct = 1 - (value - t2) / (t1 - t2);
    const hue = 45 - pct * 45;
    return `hsl(${hue}, 70%, ${35 + pct * 5}%)`;
  }
  return 'hsl(0, 70%, 40%)';
}

/** Collect the last N values for a device + metric across snapshots. */
function getRecentValues(
  snapshots: TelemetrySnapshot[],
  deviceId: string,
  metric: MetricDefinition,
  count: number
): DataPoint[] {
  const points: DataPoint[] = [];
  for (let i = snapshots.length - 1; i >= 0 && points.length < count; i--) {
    const srv = snapshots[i].servers.find((s) => s.deviceId === deviceId);
    if (!srv) continue;
    const v = metric.extract(srv);
    if (v === undefined) continue;
    points.unshift({ timestamp: snapshots[i].timestamp, value: v });
  }
  return points;
}

interface HoverInfo {
  deviceId: string;
  metricKey: string;
  value: number;
  rect: { top: number; left: number };
}

export default function HeatmapGrid({
  snapshots,
  selectedDeviceIds,
}: HeatmapGridProps) {
  const [hover, setHover] = useState<HoverInfo | null>(null);

  // Build device list from latest snapshot, filtered by selection
  const latestSnapshot = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
  const devices = useMemo(() => {
    if (!latestSnapshot) return [];
    return latestSnapshot.servers.filter(
      (s) =>
        selectedDeviceIds.length === 0 || selectedDeviceIds.includes(s.deviceId)
    );
  }, [latestSnapshot, selectedDeviceIds]);

  // Precompute sparkline data for the hovered cell
  const sparklineData = useMemo(() => {
    if (!hover) return [];
    const metric = METRICS.find((m) => m.key === hover.metricKey);
    if (!metric) return [];
    return getRecentValues(snapshots, hover.deviceId, metric, 10);
  }, [hover, snapshots]);

  if (!latestSnapshot || devices.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface p-6 text-center">
        <span className="text-muted text-sm">No device data available</span>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface overflow-x-auto relative">
      <table className="w-full border-collapse text-[11px]">
        {/* Header */}
        <thead>
          <tr>
            <th className="sticky left-0 bg-surface z-10 px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted border-b border-border">
              Device
            </th>
            {METRICS.map((m) => (
              <th
                key={m.key}
                className="px-2 py-2 text-center text-[10px] uppercase tracking-wider text-muted border-b border-border whitespace-nowrap"
              >
                {m.label}
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {devices.map((srv) => (
            <tr key={srv.deviceId} className="border-b border-border/50">
              <td className="sticky left-0 bg-surface z-10 px-3 py-2 text-foreground font-medium whitespace-nowrap">
                {srv.deviceName}
              </td>
              {METRICS.map((metric) => {
                const value = metric.extract(srv);
                if (value === undefined) {
                  return (
                    <td
                      key={metric.key}
                      className="px-2 py-2 text-center text-muted"
                    >
                      --
                    </td>
                  );
                }

                const bgColor = getCellColor(metric, value);
                return (
                  <td
                    key={metric.key}
                    className="px-2 py-2 text-center cursor-pointer transition-opacity hover:opacity-80"
                    style={{
                      backgroundColor: bgColor,
                      fontFamily: 'JetBrains Mono, ui-monospace, monospace',
                    }}
                    onMouseEnter={(e) => {
                      const rect = (e.target as HTMLElement).getBoundingClientRect();
                      setHover({
                        deviceId: srv.deviceId,
                        metricKey: metric.key,
                        value,
                        rect: { top: rect.top, left: rect.left },
                      });
                    }}
                    onMouseLeave={() => setHover(null)}
                  >
                    <span className="text-white font-medium">
                      {value.toFixed(1)}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Hover tooltip with mini sparkline */}
      {hover && sparklineData.length > 0 && (
        <div
          className="fixed z-50 rounded-lg border px-3 py-2 pointer-events-none"
          style={{
            backgroundColor: '#1E1E2E',
            borderColor: '#2A2A3C',
            boxShadow: '0 10px 15px -3px rgba(168, 85, 247, 0.1)',
            top: hover.rect.top - 80,
            left: hover.rect.left + 20,
          }}
        >
          <p className="text-[10px] text-muted mb-1">
            {METRICS.find((m) => m.key === hover.metricKey)?.label ?? hover.metricKey}
          </p>
          <p
            className="text-[12px] text-foreground font-semibold mb-1"
            style={{ fontFamily: 'JetBrains Mono, ui-monospace, monospace' }}
          >
            {hover.value.toFixed(1)}{' '}
            {METRICS.find((m) => m.key === hover.metricKey)?.unit ?? ''}
          </p>
          <Sparkline
            data={sparklineData}
            color={getMetricColor(
              METRICS.find((m) => m.key === hover.metricKey)!,
              hover.value
            )}
            width={100}
            height={28}
          />
        </div>
      )}
    </div>
  );
}
