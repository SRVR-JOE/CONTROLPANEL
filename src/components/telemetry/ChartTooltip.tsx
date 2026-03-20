'use client';

import React from 'react';
import type { TooltipContentProps } from 'recharts';

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

/**
 * Custom Recharts tooltip with a dark themed panel.
 * Renders timestamp, metric name, value, and unit for each payload entry.
 */
export default function ChartTooltip(props: TooltipContentProps<number, string>) {
  const { active, payload, label } = props;
  if (!active || !payload || payload.length === 0) return null;

  const timestamp = typeof label === 'number' ? label : Number(label);

  return (
    <div
      className="rounded-lg border shadow-lg px-3 py-2 min-w-[160px]"
      style={{
        backgroundColor: '#1E1E2E',
        borderColor: '#2A2A3C',
        boxShadow: '0 10px 15px -3px rgba(168, 85, 247, 0.1)',
      }}
    >
      {/* Timestamp */}
      <p
        className="text-[10px] text-muted mb-1.5 tracking-wide"
        style={{ fontFamily: 'JetBrains Mono, ui-monospace, monospace' }}
      >
        {formatTimestamp(timestamp)}
      </p>

      {/* Metric entries */}
      <div className="space-y-1">
        {payload.map((entry: { color?: string; name?: string | number; value?: number | string | readonly (number | string)[] }, i: number) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-[11px] text-foreground truncate max-w-[120px]">
                {entry.name}
              </span>
            </div>
            <span
              className="text-[11px] text-foreground font-semibold"
              style={{ fontFamily: 'JetBrains Mono, ui-monospace, monospace' }}
            >
              {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Custom active dot with a glow effect for anomalous values.
 */
export function GlowDot(props: {
  cx?: number;
  cy?: number;
  fill?: string;
  isAnomaly?: boolean;
}) {
  const { cx = 0, cy = 0, fill = '#3b82f6', isAnomaly } = props;

  if (!isAnomaly) {
    return <circle cx={cx} cy={cy} r={3} fill={fill} stroke="none" />;
  }

  return (
    <g>
      {/* Glow ring */}
      <circle cx={cx} cy={cy} r={8} fill={fill} opacity={0.2}>
        <animate
          attributeName="r"
          values="6;10;6"
          dur="1.5s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0.3;0.1;0.3"
          dur="1.5s"
          repeatCount="indefinite"
        />
      </circle>
      {/* Core dot */}
      <circle cx={cx} cy={cy} r={4} fill={fill} stroke="#1E1E2E" strokeWidth={1.5} />
    </g>
  );
}
