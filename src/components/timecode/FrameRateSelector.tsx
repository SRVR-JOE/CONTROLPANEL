'use client';


import { type FrameRate, FRAME_RATE_LABELS } from '@/lib/timecode/types';

const FRAME_RATES: FrameRate[] = ['23.976', '24', '25', '29.97df', '29.97ndf', '30'];

interface FrameRateSelectorProps {
  value: FrameRate;
  onChange: (fr: FrameRate) => void;
  disabled?: boolean;
}

export default function FrameRateSelector({ value, onChange, disabled = false }: FrameRateSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">
        Frame Rate
      </span>
      <div className="flex flex-wrap gap-1.5">
        {FRAME_RATES.map((fr) => {
          const isSelected = fr === value;
          return (
            <button
              key={fr}
              onClick={() => !disabled && onChange(fr)}
              disabled={disabled}
              title={disabled ? 'Stop generator to change frame rate' : undefined}
              className={`
                px-3 py-1.5 rounded-md text-[11px] font-mono font-medium
                transition-all duration-150 select-none
                ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                ${isSelected
                  ? 'bg-accent text-white border border-accent shadow-sm'
                  : 'bg-surface-2 text-muted border border-border hover:border-accent/50 hover:text-accent'
                }
              `}
            >
              {FRAME_RATE_LABELS[fr]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
