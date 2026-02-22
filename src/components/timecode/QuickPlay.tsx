'use client';

import React from 'react';
import { Zap } from 'lucide-react';

interface QuickPlayProps {
  /** The currently running hour, or null if stopped */
  activeHour: number | null;
  onHourSelect: (hour: number) => void;
  disabled?: boolean;
}

export default function QuickPlay({ activeHour, onHourSelect, disabled = false }: QuickPlayProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <Zap size={14} className="text-accent" />
        <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
          Quick Play
        </span>
        <span className="text-[10px] text-muted ml-1">
          — tap an hour to jump and play immediately
        </span>
      </div>

      {/* 24-button hour grid: 6 columns × 4 rows */}
      <div className="grid grid-cols-6 gap-2">
        {Array.from({ length: 24 }, (_, h) => {
          const isActive = activeHour === h;
          return (
            <button
              key={h}
              onClick={() => !disabled && onHourSelect(h)}
              disabled={disabled}
              title={`Jump to ${String(h).padStart(2, '0')}:00:00:00 and play`}
              className={`
                relative flex items-center justify-center
                h-12 rounded-lg font-mono font-bold text-sm
                transition-all duration-150 select-none
                ${disabled
                  ? 'opacity-40 cursor-not-allowed bg-surface-2 text-muted border border-border'
                  : isActive
                  ? `
                      bg-accent text-white border border-accent
                      shadow-[0_0_12px_rgba(59,130,246,0.5)]
                      scale-105
                    `
                  : `
                      bg-surface-2 text-foreground border border-border
                      hover:border-accent/60 hover:bg-accent/10 hover:text-accent
                      active:scale-95
                    `
                }
              `}
            >
              {String(h).padStart(2, '0')}

              {/* Pulse ring on active */}
              {isActive && !disabled && (
                <span className="absolute inset-0 rounded-lg border-2 border-accent animate-ping opacity-40" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px] text-muted">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-accent" />
          Active hour
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-surface-2 border border-border" />
          Tap to start at HH:00:00:00
        </span>
      </div>
    </div>
  );
}
