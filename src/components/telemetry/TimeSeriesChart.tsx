'use client';

import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import type { MetricSeries } from '@/lib/telemetry-types';
import { CHART_THEME } from '@/lib/metric-definitions';
import ChartTooltip, { GlowDot } from './ChartTooltip';

interface TimeSeriesChartProps {
  series: MetricSeries[];
  title: string;
  unit: string;
  height?: number;
  /** [warning, critical] thresholds */
  thresholds?: [number, number];
  /** Nominal / reference value */
  nominal?: number;
}

/**
 * Determine the time-axis format based on the data time range.
 * - < 6h  => HH:mm
 * - 6h    => HH:mm
 * - 24h   => MM/DD HH:mm
 */
function getTimeFormatter(data: { timestamp: number }[]): (ts: number) => string {
  if (data.length < 2) return (ts) => formatHHMM(ts);
  const span = data[data.length - 1].timestamp - data[0].timestamp;
  const sixHours = 6 * 60 * 60_000;
  if (span > sixHours) {
    return (ts) => {
      const d = new Date(ts);
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      return `${mm}/${dd} ${hh}:${min}`;
    };
  }
  return (ts) => formatHHMM(ts);
}

function formatHHMM(ts: number): string {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * Merge all series data points into a single array keyed by timestamp.
 * Each row has { timestamp, [seriesLabel]: value, ... }
 */
interface ChartRow {
  timestamp: number;
  [key: string]: number;
}

function mergeSeriesData(series: MetricSeries[]): ChartRow[] {
  const map = new Map<number, ChartRow>();

  for (const s of series) {
    for (const pt of s.data) {
      let row = map.get(pt.timestamp);
      if (!row) {
        row = { timestamp: pt.timestamp };
        map.set(pt.timestamp, row);
      }
      row[s.label] = pt.value;
    }
  }

  return Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp);
}

export default function TimeSeriesChart({
  series,
  title,
  unit,
  height = 280,
  thresholds,
  nominal,
}: TimeSeriesChartProps) {
  const chartData = useMemo(() => mergeSeriesData(series), [series]);
  const timeFormatter = useMemo(() => getTimeFormatter(chartData), [chartData]);

  if (series.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-border bg-surface"
        style={{ height }}
      >
        <span className="text-muted text-sm">No data</span>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      {/* Title row */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <span className="text-[10px] text-muted uppercase tracking-wider">{unit}</span>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
          {/* Gradient defs for area fill */}
          <defs>
            {series.map((s) => (
              <linearGradient
                key={`grad-${s.label}`}
                id={`gradient-${s.label.replace(/\s+/g, '-')}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={s.color} stopOpacity={0.25} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke={CHART_THEME.grid}
            vertical={false}
          />

          <XAxis
            dataKey="timestamp"
            type="number"
            domain={['dataMin', 'dataMax']}
            scale="time"
            tickFormatter={timeFormatter}
            tick={{
              fill: CHART_THEME.axis,
              fontSize: 10,
              fontFamily: CHART_THEME.fontFamily,
            }}
            axisLine={{ stroke: CHART_THEME.grid }}
            tickLine={{ stroke: CHART_THEME.grid }}
          />

          <YAxis
            tick={{
              fill: CHART_THEME.axis,
              fontSize: 10,
              fontFamily: CHART_THEME.fontFamily,
            }}
            axisLine={{ stroke: CHART_THEME.grid }}
            tickLine={{ stroke: CHART_THEME.grid }}
            width={40}
          />

          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <Tooltip content={ChartTooltip as any} />

          {/* Threshold reference lines */}
          {thresholds && (
            <>
              <ReferenceLine
                y={thresholds[0]}
                stroke="#F59E0B"
                strokeDasharray="6 3"
                strokeWidth={1}
                label={{
                  value: 'warn',
                  position: 'right',
                  fill: '#F59E0B',
                  fontSize: 9,
                  fontFamily: CHART_THEME.fontFamily,
                }}
              />
              <ReferenceLine
                y={thresholds[1]}
                stroke="#EF4444"
                strokeDasharray="6 3"
                strokeWidth={1}
                label={{
                  value: 'crit',
                  position: 'right',
                  fill: '#EF4444',
                  fontSize: 9,
                  fontFamily: CHART_THEME.fontFamily,
                }}
              />
            </>
          )}

          {/* Nominal reference line */}
          {nominal !== undefined && (
            <ReferenceLine
              y={nominal}
              stroke="#e0e0e8"
              strokeDasharray="2 4"
              strokeWidth={1}
              strokeOpacity={0.5}
            />
          )}

          {/* Data lines */}
          {series.map((s) => (
            <Line
              key={s.label}
              type="monotone"
              dataKey={s.label}
              name={s.label}
              stroke={s.color}
              strokeWidth={1.5}
              dot={false}
              activeDot={(dotProps: { cx?: number; cy?: number; value?: number }) => {
                const isAnomaly =
                  thresholds && typeof dotProps.value === 'number' && dotProps.value >= thresholds[0];
                return (
                  <GlowDot
                    cx={dotProps.cx}
                    cy={dotProps.cy}
                    fill={s.color}
                    isAnomaly={!!isAnomaly}
                  />
                );
              }}
              fill={`url(#gradient-${s.label.replace(/\s+/g, '-')})`}
              fillOpacity={1}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
