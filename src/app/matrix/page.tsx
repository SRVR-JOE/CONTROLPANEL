'use client';

import { useMemo } from 'react';
import { useStore } from '@/store';
import RouterSelector from '@/components/matrix/RouterSelector';
import MatrixGrid from '@/components/matrix/MatrixGrid';
import QuickRoute from '@/components/matrix/QuickRoute';
import { Grid3x3, Cpu, Network } from 'lucide-react';
import type { MatrixManufacturer } from '@/types';

const MANUFACTURER_COLORS: Record<MatrixManufacturer, string> = {
  aja: '#ffc107',
  lightware: '#ff9800',
  blackmagic: '#607d8b',
  ross: '#9c27b0',
  crestron: '#263238',
  extron: '#1565c0',
  netgear: '#4a90d9',
};

export default function MatrixPage() {
  const routers = useStore((s) => s.routers);
  const selectedRouterId = useStore((s) => s.selectedRouterId);
  const devices = useStore((s) => s.devices);

  const selectedRouter = useMemo(
    () => routers.find((r) => r.id === selectedRouterId) ?? null,
    [routers, selectedRouterId],
  );

  const linkedDevice = useMemo(() => {
    if (!selectedRouter) return null;
    return devices.find((d) => d.id === selectedRouter.deviceId) ?? null;
  }, [devices, selectedRouter]);

  if (!selectedRouter) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Grid3x3 className="mx-auto mb-3 h-10 w-10 text-[var(--muted)]" />
          <p className="text-sm text-[var(--muted)]">
            No matrix routers available
          </p>
        </div>
      </div>
    );
  }

  const mfgColor = MANUFACTURER_COLORS[selectedRouter.manufacturer];

  return (
    <div className="flex h-full flex-col gap-4 p-4 pl-20">
      {/* Router selector tabs */}
      <RouterSelector />

      {/* Router info bar */}
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: mfgColor }}
          />
          <span className="text-sm font-semibold text-[var(--foreground)]">
            {selectedRouter.name}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[var(--muted)]">
          <Cpu className="h-3.5 w-3.5" />
          <span className="text-xs">{selectedRouter.model}</span>
        </div>

        {linkedDevice && (
          <div className="flex items-center gap-1.5 text-[var(--muted)]">
            <Network className="h-3.5 w-3.5" />
            <span className="text-xs font-mono">{linkedDevice.ipAddress}</span>
            <span
              className={`ml-1 inline-block h-2 w-2 rounded-full ${
                linkedDevice.status === 'online'
                  ? 'bg-[var(--success)]'
                  : linkedDevice.status === 'warning'
                    ? 'bg-[var(--warning)]'
                    : linkedDevice.status === 'error'
                      ? 'bg-[var(--error)]'
                      : 'bg-[var(--muted)]'
              }`}
            />
          </div>
        )}

        <div className="ml-auto flex items-center gap-1 text-[var(--muted)]">
          <Grid3x3 className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">{selectedRouter.size}</span>
          <span className="text-[10px]">
            ({selectedRouter.inputs.length} in / {selectedRouter.outputs.length}{' '}
            out)
          </span>
        </div>
      </div>

      {/* Main content: MatrixGrid (left) + QuickRoute (right) */}
      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Matrix grid - takes up majority of space */}
        <div className="flex-1 overflow-auto rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
          <MatrixGrid router={selectedRouter} />
        </div>

        {/* Quick route panel - fixed width on right */}
        <div className="hidden w-[320px] flex-shrink-0 lg:block">
          <QuickRoute router={selectedRouter} />
        </div>
      </div>
    </div>
  );
}
