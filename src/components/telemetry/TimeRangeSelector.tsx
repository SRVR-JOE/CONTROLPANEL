'use client';

import React from 'react';
import type { TimeRange } from '@/lib/telemetry-types';

const RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: '5m', label: '5m' },
  { value: '15m', label: '15m' },
  { value: '1h', label: '1h' },
  { value: '6h', label: '6h' },
  { value: '24h', label: '24h' },
];

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

export default function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  return (
    <div className="flex items-center rounded-lg border border-border bg-surface overflow-hidden">
      {RANGE_OPTIONS.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`
              px-3 py-1.5 text-[11px] font-medium transition-colors
              ${
                isActive
                  ? 'bg-accent text-white'
                  : 'text-muted hover:text-foreground bg-surface-2'
              }
            `}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
