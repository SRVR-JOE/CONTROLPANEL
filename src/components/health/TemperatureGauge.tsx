'use client';

import React from 'react';

interface TemperatureGaugeProps {
  value: number;
  min?: number;
  max?: number;
  label?: string;
}

function getTemperatureColor(value: number): string {
  if (value < 30) return '#3b82f6'; // blue
  if (value <= 45) return '#22c55e'; // green
  if (value <= 55) return '#f59e0b'; // yellow
  return '#ef4444'; // red
}

export default function TemperatureGauge({
  value,
  min = 0,
  max = 80,
  label = 'TEMP',
}: TemperatureGaugeProps) {
  const clampedValue = Math.max(min, Math.min(max, value));
  const percentage = (clampedValue - min) / (max - min);

  // Arc parameters
  const cx = 40;
  const cy = 44;
  const r = 30;
  const startAngle = 135; // degrees from 12 o'clock, going clockwise
  const endAngle = 405; // 270 degree sweep
  const sweepAngle = endAngle - startAngle;

  const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180;

  const startX = cx + r * Math.cos(toRad(startAngle));
  const startY = cy + r * Math.sin(toRad(startAngle));

  const fillAngle = startAngle + sweepAngle * percentage;
  const fillX = cx + r * Math.cos(toRad(fillAngle));
  const fillY = cy + r * Math.sin(toRad(fillAngle));

  const endX = cx + r * Math.cos(toRad(endAngle));
  const endY = cy + r * Math.sin(toRad(endAngle));

  const largeArcBg = sweepAngle > 180 ? 1 : 0;
  const fillSweep = sweepAngle * percentage;
  const largeArcFill = fillSweep > 180 ? 1 : 0;

  const bgPath = `M ${startX} ${startY} A ${r} ${r} 0 ${largeArcBg} 1 ${endX} ${endY}`;
  const fillPath =
    percentage > 0.001
      ? `M ${startX} ${startY} A ${r} ${r} 0 ${largeArcFill} 1 ${fillX} ${fillY}`
      : '';

  const color = getTemperatureColor(value);

  return (
    <div className="flex flex-col items-center" style={{ width: 80, height: 80 }}>
      <svg
        width="80"
        height="66"
        viewBox="0 0 80 66"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background track */}
        <path
          d={bgPath}
          stroke="#2a2a3d"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
        {/* Filled arc */}
        {fillPath && (
          <path
            d={fillPath}
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
            style={{
              filter: `drop-shadow(0 0 4px ${color}40)`,
            }}
          />
        )}
        {/* Center value */}
        <text
          x={cx}
          y={cy - 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={color}
          fontSize="16"
          fontWeight="700"
          fontFamily="var(--font-geist-mono), monospace"
        >
          {Math.round(value)}
        </text>
        <text
          x={cx}
          y={cy + 12}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#6b7280"
          fontSize="7"
          fontFamily="var(--font-geist-sans), sans-serif"
        >
          {'\u00B0C'}
        </text>
      </svg>
      <span className="text-[9px] font-medium text-muted tracking-wider uppercase -mt-1">
        {label}
      </span>
    </div>
  );
}
