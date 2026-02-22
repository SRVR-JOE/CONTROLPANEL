'use client';

import { useStore } from '@/store';
import type { MatrixManufacturer } from '@/types';
import { Grid3x3 } from 'lucide-react';

const MANUFACTURER_COLORS: Record<MatrixManufacturer, string> = {
  aja: '#ffc107',
  lightware: '#ff9800',
  blackmagic: '#607d8b',
  ross: '#9c27b0',
  crestron: '#263238',
  extron: '#1565c0',
};

const MANUFACTURER_LABELS: Record<MatrixManufacturer, string> = {
  aja: 'AJA',
  lightware: 'Lightware',
  blackmagic: 'Blackmagic',
  ross: 'Ross',
  crestron: 'Crestron',
  extron: 'Extron',
};

export default function RouterSelector() {
  const routers = useStore((s) => s.routers);
  const selectedRouterId = useStore((s) => s.selectedRouterId);
  const setSelectedRouter = useStore((s) => s.setSelectedRouter);

  return (
    <div className="flex items-center gap-1 overflow-x-auto rounded-lg bg-[var(--surface)] p-1">
      {routers.map((router) => {
        const isActive = router.id === selectedRouterId;
        const color = MANUFACTURER_COLORS[router.manufacturer];
        const label = MANUFACTURER_LABELS[router.manufacturer];

        return (
          <button
            key={router.id}
            onClick={() => setSelectedRouter(router.id)}
            className={`flex items-center gap-2.5 rounded-md px-3.5 py-2 text-sm font-medium transition-all duration-150 whitespace-nowrap ${
              isActive
                ? 'bg-[var(--surface-2)] text-[var(--foreground)] shadow-sm'
                : 'text-[var(--muted)] hover:bg-[var(--surface-2)]/50 hover:text-[var(--foreground)]'
            }`}
          >
            {/* Manufacturer color indicator */}
            <div className="flex items-center gap-1.5">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor: color,
                  boxShadow: isActive ? `0 0 6px ${color}60` : 'none',
                }}
              />
              <span
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color }}
              >
                {label}
              </span>
            </div>

            {/* Router name */}
            <span className="text-xs">{router.name}</span>

            {/* Matrix size badge */}
            <span className="flex items-center gap-1 rounded bg-[var(--background)] px-1.5 py-0.5 text-[10px] text-[var(--muted)]">
              <Grid3x3 className="h-2.5 w-2.5" />
              {router.size}
            </span>
          </button>
        );
      })}
    </div>
  );
}
