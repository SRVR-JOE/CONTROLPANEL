'use client';

import { useCallback, useMemo, useRef } from 'react';
import { useStore } from '@/store';
import type { MatrixRouter, MatrixManufacturer } from '@/types';

const CELL_SIZE = 24;

const MANUFACTURER_COLORS: Record<MatrixManufacturer, string> = {
  aja: '#ffc107',
  lightware: '#ff9800',
  blackmagic: '#607d8b',
  ross: '#9c27b0',
  crestron: '#263238',
  extron: '#1565c0',
  netgear: '#4a90d9',
};

interface MatrixGridProps {
  router: MatrixRouter;
}

export default function MatrixGrid({ router }: MatrixGridProps) {
  const setRoute = useStore((s) => s.setRoute);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isLarge = router.inputs.length > 16 || router.outputs.length > 16;
  const headerColor = MANUFACTURER_COLORS[router.manufacturer];

  // Build a lookup: outputIndex -> routedFrom inputIndex
  const routeMap = useMemo(() => {
    const map = new Map<number, number>();
    for (const output of router.outputs) {
      if (output.routedFrom !== undefined) {
        map.set(output.index, output.routedFrom);
      }
    }
    return map;
  }, [router.outputs]);

  const handleCellClick = useCallback(
    (outputIndex: number, inputIndex: number) => {
      setRoute(router.id, outputIndex, inputIndex);
    },
    [router.id, setRoute],
  );

  // Header height accounts for rotated labels
  const headerHeight = 80;
  const labelWidth = 100;

  return (
    <div className="flex flex-col gap-2">
      {/* Grid title */}
      <div className="flex items-center gap-2 mb-1">
        <div
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: headerColor }}
        />
        <span className="text-xs font-medium text-[var(--muted)]">
          {router.size} Crosspoint Matrix
        </span>
      </div>

      {/* Scrollable container for large matrices */}
      <div
        ref={scrollRef}
        className={`relative ${
          isLarge ? 'max-h-[70vh] max-w-full overflow-auto' : ''
        }`}
      >
        <div
          className="relative"
          style={{
            width: labelWidth + router.inputs.length * CELL_SIZE + 2,
            height: headerHeight + router.outputs.length * CELL_SIZE + 2,
          }}
        >
          {/* ===== Input labels (columns) - rotated 45deg at top ===== */}
          <div
            className={`flex ${isLarge ? 'sticky top-0 z-20' : ''}`}
            style={{
              marginLeft: labelWidth,
              height: headerHeight,
              background: 'var(--background)',
            }}
          >
            {router.inputs.map((input) => (
              <div
                key={input.id}
                className="flex flex-col items-center justify-end"
                style={{ width: CELL_SIZE, height: headerHeight }}
              >
                {/* Signal indicator */}
                <div
                  className={`mb-1 h-[6px] w-[6px] rounded-full ${
                    input.signal ? 'bg-[var(--success)]' : 'bg-[var(--border)]'
                  }`}
                  title={input.signal ? `Signal: ${input.format || 'Active'}` : 'No signal'}
                />
                {/* Rotated label */}
                <div
                  className="relative"
                  style={{ width: CELL_SIZE, height: 50 }}
                >
                  <span
                    className="absolute bottom-0 left-1/2 origin-bottom-left whitespace-nowrap text-[9px] font-medium"
                    style={{
                      transform: 'rotate(-45deg) translateX(-50%)',
                      color: headerColor,
                    }}
                  >
                    {input.label}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* ===== Rows: output label + cells ===== */}
          {router.outputs.map((output) => (
            <div
              key={output.id}
              className="flex items-center"
              style={{ height: CELL_SIZE }}
            >
              {/* Output label (left side, sticky for large) */}
              <div
                className={`flex items-center justify-end pr-2 ${
                  isLarge ? 'sticky left-0 z-10' : ''
                }`}
                style={{
                  width: labelWidth,
                  height: CELL_SIZE,
                  background: 'var(--background)',
                }}
              >
                <span
                  className="truncate text-[10px] font-medium"
                  style={{ color: headerColor }}
                >
                  {output.label}
                </span>
              </div>

              {/* Cells for this row */}
              {router.inputs.map((input) => {
                const isActive = routeMap.get(output.index) === input.index;

                return (
                  <button
                    key={`${output.index}-${input.index}`}
                    className="matrix-cell flex items-center justify-center border border-[var(--border)]/30 hover:bg-[var(--surface-2)]"
                    style={{
                      width: CELL_SIZE,
                      height: CELL_SIZE,
                      minWidth: CELL_SIZE,
                      minHeight: CELL_SIZE,
                    }}
                    onClick={() => handleCellClick(output.index, input.index)}
                    title={`${input.label} -> ${output.label}`}
                  >
                    {isActive ? (
                      <div className="h-3 w-3 rounded-full bg-[var(--accent)] shadow-[0_0_6px_var(--accent)]" />
                    ) : (
                      <div className="h-1.5 w-1.5 rounded-full bg-[var(--border)]" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-2 flex items-center gap-4 text-[10px] text-[var(--muted)]">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-full bg-[var(--accent)] shadow-[0_0_4px_var(--accent)]" />
          Active route
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--border)]" />
          Inactive
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-[6px] w-[6px] rounded-full bg-[var(--success)]" />
          Signal present
        </span>
      </div>
    </div>
  );
}
