'use client';

import React from 'react';
import { LineChart, Line, Area, ResponsiveContainer } from 'recharts';
import type { DataPoint } from '@/lib/telemetry-types';

interface SparklineProps {
  data: DataPoint[];
  color: string;
  width?: number;
  height?: number;
}

/**
 * A tiny inline chart with no axes, grid, or tooltip.
 * Renders a single line with a gradient fill beneath.
 */
export default function Sparkline({
  data,
  color,
  width = 120,
  height = 32,
}: SparklineProps) {
  if (data.length === 0) {
    return <div style={{ width, height }} className="bg-surface-2 rounded" />;
  }

  const gradientId = `spark-grad-${color.replace('#', '')}`;

  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
            fill={`url(#${gradientId})`}
            fillOpacity={1}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
