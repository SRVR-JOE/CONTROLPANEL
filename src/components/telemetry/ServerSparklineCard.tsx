'use client';

import React from 'react';
import type { MetricSeries, DataPoint } from '@/lib/telemetry-types';
import Sparkline from './Sparkline';

interface ServerSparklineCardProps {
  deviceId: string;
  deviceName: string;
  series: MetricSeries[];
  color: string;
}

/** Determine trend from the last 5 data points. */
function getTrend(data: DataPoint[]): 'up' | 'down' | 'flat' {
  if (data.length < 2) return 'flat';
  const tail = data.slice(-5);
  const first = tail[0].value;
  const last = tail[tail.length - 1].value;
  const delta = last - first;
  const threshold = Math.abs(first) * 0.02 || 0.5; // 2% change or 0.5 absolute
  if (delta > threshold) return 'up';
  if (delta < -threshold) return 'down';
  return 'flat';
}

function TrendArrow({ trend }: { trend: 'up' | 'down' | 'flat' }) {
  if (trend === 'up') {
    return (
      <svg width="10" height="10" viewBox="0 0 10 10" className="text-error">
        <path d="M5 2L8 6H2L5 2Z" fill="currentColor" />
      </svg>
    );
  }
  if (trend === 'down') {
    return (
      <svg width="10" height="10" viewBox="0 0 10 10" className="text-success">
        <path d="M5 8L2 4H8L5 8Z" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" className="text-muted">
      <rect x="2" y="4.5" width="6" height="1.5" rx="0.5" fill="currentColor" />
    </svg>
  );
}

/**
 * Glass-card per device showing sparklines for the available metrics.
 * Displays up to 3 sparklines with labels, current values, and trend arrows.
 */
export default function ServerSparklineCard({
  deviceId,
  deviceName,
  series,
  color,
}: ServerSparklineCardProps) {
  // Filter series belonging to this device
  const deviceSeries = series.filter((s) => s.deviceId === deviceId);

  // Pick up to 3 metrics that have data
  const displaySeries = deviceSeries.slice(0, 3);

  return (
    <div
      className="bg-surface/80 backdrop-blur-xl rounded-lg border border-border overflow-hidden transition-all hover:border-accent/30"
      style={{ borderLeftWidth: 3, borderLeftColor: color }}
    >
      {/* Header */}
      <div className="px-4 pt-3 pb-2">
        <h4 className="text-sm font-semibold text-foreground truncate">{deviceName}</h4>
      </div>

      {/* Sparkline rows */}
      <div className="px-4 pb-3 space-y-2.5">
        {displaySeries.length === 0 && (
          <p className="text-[11px] text-muted">No metric data</p>
        )}

        {displaySeries.map((s) => {
          const currentValue =
            s.data.length > 0 ? s.data[s.data.length - 1].value : null;
          const trend = getTrend(s.data);

          return (
            <div key={s.metricKey} className="flex items-center gap-2">
              {/* Label + Value */}
              <div className="min-w-[72px] shrink-0">
                <p className="text-[9px] uppercase tracking-wider text-muted">
                  {s.metricKey}
                </p>
                <div className="flex items-center gap-1">
                  <span
                    className="text-[12px] font-semibold text-foreground"
                    style={{
                      fontFamily: 'JetBrains Mono, ui-monospace, monospace',
                    }}
                  >
                    {currentValue !== null ? currentValue.toFixed(1) : '--'}
                  </span>
                  <span className="text-[9px] text-muted">{s.unit}</span>
                  <TrendArrow trend={trend} />
                </div>
              </div>

              {/* Sparkline */}
              <div className="flex-1 min-w-0">
                <Sparkline data={s.data} color={s.color} width={120} height={28} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
