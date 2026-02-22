'use client';

import { useStore } from '@/store';
import type { TileViewMode } from '@/types';
import { CheckCircle, Thermometer, AlertTriangle } from 'lucide-react';

const MODES: { id: TileViewMode; label: string; icon: React.ReactNode }[] = [
  {
    id: 'status',
    label: 'Status',
    icon: <CheckCircle className="h-3.5 w-3.5" />,
  },
  {
    id: 'temperature',
    label: 'Temperature',
    icon: <Thermometer className="h-3.5 w-3.5" />,
  },
  {
    id: 'errors',
    label: 'Errors',
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
  },
];

export default function TileViewModeToggle() {
  const tileViewMode = useStore((s) => s.tileViewMode);
  const setTileViewMode = useStore((s) => s.setTileViewMode);

  return (
    <div className="flex items-center gap-1 rounded-lg bg-[#14141f] border border-[#2a2a3d] p-1">
      {MODES.map((mode) => {
        const isActive = tileViewMode === mode.id;
        return (
          <button
            key={mode.id}
            onClick={() => setTileViewMode(mode.id)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-150 whitespace-nowrap ${
              isActive
                ? 'bg-[#1c1c2b] text-[#e0e0e8] shadow-sm'
                : 'text-[#6b7280] hover:bg-[#1c1c2b]/50 hover:text-[#e0e0e8]'
            }`}
          >
            <span className={isActive ? 'text-[#3b82f6]' : 'text-[#6b7280]'}>
              {mode.icon}
            </span>
            {mode.label}
          </button>
        );
      })}
    </div>
  );
}
