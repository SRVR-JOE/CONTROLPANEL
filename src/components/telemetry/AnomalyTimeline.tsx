'use client';

import React, { useMemo } from 'react';
import type { AnomalyEvent, TimeRange } from '@/lib/telemetry-types';
import { AlertTriangle, AlertCircle } from 'lucide-react';

const RANGE_MS: Record<TimeRange, number> = {
  '5m': 5 * 60_000,
  '15m': 15 * 60_000,
  '1h': 60 * 60_000,
  '6h': 6 * 60 * 60_000,
  '24h': 24 * 60 * 60_000,
};

interface AnomalyTimelineProps {
  anomalies: AnomalyEvent[];
  timeRange: TimeRange;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

/**
 * Horizontal timeline bar with severity-colored markers, plus a scrollable
 * event list below.
 */
export default function AnomalyTimeline({
  anomalies,
  timeRange,
}: AnomalyTimelineProps) {
  const windowMs = RANGE_MS[timeRange];
  const now = Date.now();
  const windowStart = now - windowMs;

  // Position each anomaly as a percentage along the timeline
  const positioned = useMemo(() => {
    return anomalies
      .filter((a) => a.timestamp >= windowStart)
      .map((a) => ({
        ...a,
        pct: Math.max(0, Math.min(100, ((a.timestamp - windowStart) / windowMs) * 100)),
      }));
  }, [anomalies, windowStart, windowMs]);

  const sorted = useMemo(
    () => [...anomalies].sort((a, b) => b.timestamp - a.timestamp),
    [anomalies]
  );

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">Anomalies</h3>

      {/* Timeline bar */}
      <div className="relative mb-4">
        {/* Track */}
        <div className="h-3 bg-surface-2 rounded-full border border-border relative overflow-visible">
          {positioned.map((a) => (
            <div
              key={a.id}
              className="absolute top-1/2 -translate-y-1/2 group"
              style={{ left: `${a.pct}%` }}
            >
              {/* Marker */}
              <div
                className="w-2.5 h-2.5 rounded-full -translate-x-1/2 cursor-pointer"
                style={{
                  backgroundColor:
                    a.severity === 'critical' ? '#EF4444' : '#F59E0B',
                  boxShadow: `0 0 6px ${
                    a.severity === 'critical'
                      ? 'rgba(239, 68, 68, 0.5)'
                      : 'rgba(245, 158, 11, 0.5)'
                  }`,
                }}
              />

              {/* Hover tooltip */}
              <div
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20"
                style={{ minWidth: 180 }}
              >
                <div
                  className="rounded-lg border px-3 py-2 text-[11px]"
                  style={{
                    backgroundColor: '#1E1E2E',
                    borderColor: '#2A2A3C',
                    boxShadow:
                      '0 10px 15px -3px rgba(168, 85, 247, 0.1)',
                  }}
                >
                  <p className="text-foreground font-medium">{a.deviceName}</p>
                  <p className="text-muted">
                    {a.metricLabel}:{' '}
                    <span
                      className="text-foreground"
                      style={{
                        fontFamily:
                          'JetBrains Mono, ui-monospace, monospace',
                      }}
                    >
                      {a.value.toFixed(1)}
                      {a.unit}
                    </span>
                  </p>
                  <p className="text-muted">
                    Threshold:{' '}
                    <span className="text-foreground">
                      {a.threshold}
                      {a.unit}
                    </span>
                  </p>
                  <p className="text-muted mt-0.5">{formatTime(a.timestamp)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Time labels */}
        <div className="flex items-center justify-between mt-1 text-[9px] text-muted">
          <span style={{ fontFamily: 'JetBrains Mono, ui-monospace, monospace' }}>
            {formatTime(windowStart)}
          </span>
          <span style={{ fontFamily: 'JetBrains Mono, ui-monospace, monospace' }}>
            {formatTime(now)}
          </span>
        </div>
      </div>

      {/* Event list */}
      {sorted.length === 0 ? (
        <p className="text-[11px] text-muted text-center py-2">No anomalies detected</p>
      ) : (
        <div className="max-h-[200px] overflow-y-auto space-y-1 scrollbar-thin">
          {sorted.map((a) => {
            const isCritical = a.severity === 'critical';
            return (
              <div
                key={a.id}
                className="flex items-start gap-2 px-2 py-1.5 rounded hover:bg-surface-2 transition-colors"
              >
                {isCritical ? (
                  <AlertCircle size={12} className="text-error shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle
                    size={12}
                    className="text-warning shrink-0 mt-0.5"
                  />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-foreground font-medium truncate">
                      {a.deviceName}
                    </span>
                    <span className="text-[9px] text-muted">{a.metricLabel}</span>
                  </div>
                  <div className="text-[10px] text-muted">
                    <span
                      className={isCritical ? 'text-error' : 'text-warning'}
                      style={{
                        fontFamily: 'JetBrains Mono, ui-monospace, monospace',
                      }}
                    >
                      {a.value.toFixed(1)}
                      {a.unit}
                    </span>
                    <span className="mx-1">/</span>
                    <span>threshold {a.threshold}{a.unit}</span>
                  </div>
                </div>

                <span
                  className="text-[9px] text-muted shrink-0 mt-0.5"
                  style={{ fontFamily: 'JetBrains Mono, ui-monospace, monospace' }}
                >
                  {formatTime(a.timestamp)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
