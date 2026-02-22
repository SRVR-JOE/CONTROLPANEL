'use client';

import { useMemo } from 'react';
import { useStore } from '@/store';
import type { LEDTileErrorType } from '@/types';
import {
  Thermometer,
  WifiOff,
  AlertCircle,
  Zap,
  Palette,
  Sparkles,
} from 'lucide-react';

interface ErrorTypeConfig {
  type: LEDTileErrorType;
  label: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  ring: string;
}

const ERROR_TYPE_CONFIGS: ErrorTypeConfig[] = [
  {
    type: 'high-temperature',
    label: 'High Temp',
    icon: <Thermometer className="h-3 w-3" />,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    ring: 'ring-orange-500/20',
  },
  {
    type: 'communication-lost',
    label: 'Comm Lost',
    icon: <WifiOff className="h-3 w-3" />,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    ring: 'ring-red-500/20',
  },
  {
    type: 'driver-fault',
    label: 'Driver Fault',
    icon: <AlertCircle className="h-3 w-3" />,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    ring: 'ring-red-500/20',
  },
  {
    type: 'power-fault',
    label: 'Power Fault',
    icon: <Zap className="h-3 w-3" />,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    ring: 'ring-yellow-500/20',
  },
  {
    type: 'color-calibration',
    label: 'Calibration',
    icon: <Palette className="h-3 w-3" />,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    ring: 'ring-purple-500/20',
  },
  {
    type: 'pixel-failure',
    label: 'Pixel Fault',
    icon: <Sparkles className="h-3 w-3" />,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    ring: 'ring-blue-500/20',
  },
];

export default function TileErrorLegend() {
  const selectedBromptonProcessorId = useStore((s) => s.selectedBromptonProcessorId);
  const bromptonStatuses = useStore((s) => s.bromptonStatuses);
  const tileErrorFilter = useStore((s) => s.tileErrorFilter);
  const setTileErrorFilter = useStore((s) => s.setTileErrorFilter);

  const tiles = useMemo(() => {
    const processorStatus = bromptonStatuses.find(
      (s) => s.deviceId === selectedBromptonProcessorId
    );
    return processorStatus?.tiles ?? [];
  }, [bromptonStatuses, selectedBromptonProcessorId]);

  // Count tiles per error type
  const errorCounts = useMemo(() => {
    const counts: Record<LEDTileErrorType, number> = {
      'high-temperature': 0,
      'communication-lost': 0,
      'driver-fault': 0,
      'power-fault': 0,
      'color-calibration': 0,
      'pixel-failure': 0,
    };
    for (const tile of tiles) {
      for (const err of tile.errors) {
        counts[err.type]++;
      }
    }
    return counts;
  }, [tiles]);

  const totalErrors = Object.values(errorCounts).reduce((a, b) => a + b, 0);
  const activeTypes = ERROR_TYPE_CONFIGS.filter(
    (cfg) => errorCounts[cfg.type] > 0
  );

  if (totalErrors === 0) {
    return (
      <div className="flex items-center gap-2 text-[11px] text-green-400">
        <span className="h-1.5 w-1.5 rounded-full bg-green-400 inline-block" />
        No errors detected across all panels
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* All chip */}
      <button
        onClick={() => setTileErrorFilter(null)}
        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 transition-all ${
          tileErrorFilter === null
            ? 'bg-[#1c1c2b] text-[#e0e0e8] ring-[#3b82f6]'
            : 'bg-[#1c1c2b] text-[#6b7280] ring-[#2a2a3d] hover:text-[#e0e0e8]'
        }`}
      >
        All
        <span className="rounded-full bg-[#0c0c14] px-1 text-[9px] font-bold">
          {totalErrors}
        </span>
      </button>

      {/* Per-type filter chips */}
      {activeTypes.map((cfg) => {
        const count = errorCounts[cfg.type];
        const isActive = tileErrorFilter === cfg.type;

        return (
          <button
            key={cfg.type}
            onClick={() =>
              setTileErrorFilter(isActive ? null : cfg.type)
            }
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 transition-all ${
              isActive
                ? `${cfg.color} ${cfg.bg} ${cfg.ring}`
                : 'text-[#6b7280] bg-[#1c1c2b] ring-[#2a2a3d] hover:text-[#e0e0e8]'
            }`}
          >
            <span className={isActive ? cfg.color : 'text-[#6b7280]'}>
              {cfg.icon}
            </span>
            {cfg.label}
            <span
              className={`rounded-full px-1 text-[9px] font-bold ${
                isActive ? 'bg-[#0c0c14]' : 'bg-[#0c0c14] text-[#6b7280]'
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
