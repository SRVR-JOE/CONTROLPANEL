'use client';

import { useMemo, useCallback } from 'react';
import { useStore } from '@/store';
import { LEDTile } from './LEDTile';
import type { LEDTileInfo } from '@/types';

export default function LEDTileGrid() {
  const selectedBromptonProcessorId = useStore((s) => s.selectedBromptonProcessorId);
  const bromptonStatuses = useStore((s) => s.bromptonStatuses);
  const tileViewMode = useStore((s) => s.tileViewMode);
  const tileErrorFilter = useStore((s) => s.tileErrorFilter);
  const selectedTileId = useStore((s) => s.selectedTileId);
  const setSelectedTile = useStore((s) => s.setSelectedTile);

  const processorStatus = useMemo(
    () => bromptonStatuses.find((s) => s.deviceId === selectedBromptonProcessorId),
    [bromptonStatuses, selectedBromptonProcessorId]
  );

  const tiles = useMemo(() => processorStatus?.tiles ?? [], [processorStatus]);
  const chainLengths = useMemo(() => processorStatus?.chainLengths ?? [], [processorStatus]);

  // Group tiles by chain
  const tilesByChain = useMemo(() => {
    const chains: Record<number, LEDTileInfo[]> = {};
    for (const tile of tiles) {
      if (!chains[tile.chainIndex]) {
        chains[tile.chainIndex] = [];
      }
      chains[tile.chainIndex].push(tile);
    }
    // Sort each chain by position
    for (const chain of Object.values(chains)) {
      chain.sort((a, b) => a.positionInChain - b.positionInChain);
    }
    return chains;
  }, [tiles]);

  const maxChainLength = Math.max(...chainLengths, 0);
  const chainCount = chainLengths.length;

  const handleSelectTile = useCallback(
    (tileId: string) => {
      setSelectedTile(tileId === selectedTileId ? null : tileId);
    },
    [selectedTileId, setSelectedTile]
  );

  if (tiles.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-[#6b7280] text-sm">
        No tile data available for this processor
      </div>
    );
  }

  return (
    <div className="overflow-x-auto overflow-y-auto max-h-[400px] rounded-lg bg-[#0c0c14] border border-[#2a2a3d] p-3">
      <div className="space-y-[2px]" style={{ minWidth: maxChainLength * 18 + 80 }}>
        {Array.from({ length: chainCount }, (_, chainIdx) => {
          const chainTiles = tilesByChain[chainIdx] ?? [];
          const chainLength = chainLengths[chainIdx] ?? 0;

          return (
            <div
              key={chainIdx}
              className="flex items-center gap-2"
              style={{
                display: 'grid',
                gridTemplateColumns: `48px repeat(${maxChainLength}, 1fr)`,
                gap: '2px',
                alignItems: 'center',
              }}
            >
              {/* Chain label */}
              <div className="text-[10px] text-[#6b7280] font-mono text-right pr-2 whitespace-nowrap select-none">
                CH{chainIdx + 1}
              </div>

              {/* Tile cells for this chain */}
              {Array.from({ length: maxChainLength }, (_, posIdx) => {
                if (posIdx >= chainLength) {
                  // Empty spacer for chains shorter than max
                  return (
                    <div
                      key={`empty-${posIdx}`}
                      style={{ minWidth: 16, minHeight: 16, aspectRatio: '1 / 1' }}
                    />
                  );
                }

                const tile = chainTiles[posIdx];
                if (!tile) return null;

                return (
                  <LEDTile
                    key={tile.id}
                    tile={tile}
                    viewMode={tileViewMode}
                    errorFilter={tileErrorFilter}
                    isSelected={selectedTileId === tile.id}
                    onSelect={handleSelectTile}
                  />
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Position scale footer */}
      <div
        className="mt-2 flex items-center"
        style={{
          display: 'grid',
          gridTemplateColumns: `48px repeat(${maxChainLength}, 1fr)`,
          gap: '2px',
        }}
      >
        <div />
        {Array.from({ length: maxChainLength }, (_, i) => (
          <div key={i} className="text-center">
            {(i + 1) % 5 === 0 || i === 0 ? (
              <span className="text-[8px] text-[#6b7280] font-mono">{i + 1}</span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
