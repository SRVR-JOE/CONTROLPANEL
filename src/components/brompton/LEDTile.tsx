'use client';

import React, { memo, useCallback } from 'react';
import type { LEDTileInfo, TileViewMode, LEDTileErrorType } from '@/types';

// Temperature thresholds for heatmap coloring (blue -> green -> yellow -> red)
function tempToHeatmapColor(temp: number): string {
  if (temp === 0) return '#1c1c2b';
  if (temp < 32) return '#3b82f6'; // cool blue
  if (temp < 38) return '#22c55e'; // safe green
  if (temp < 44) return '#84cc16'; // lime
  if (temp < 48) return '#eab308'; // yellow
  if (temp < 52) return '#f59e0b'; // amber
  return '#ef4444'; // hot red
}

function statusColor(status: LEDTileInfo['status']): string {
  switch (status) {
    case 'online': return '#22c55e';
    case 'warning': return '#f59e0b';
    case 'error': return '#ef4444';
    case 'offline': return '#1c1c2b';
    case 'unknown': return '#374151';
  }
}

interface LEDTileProps {
  tile: LEDTileInfo;
  viewMode: TileViewMode;
  errorFilter: LEDTileErrorType | null;
  isSelected: boolean;
  onSelect: (tileId: string) => void;
}

function LEDTileInner({ tile, viewMode, errorFilter, isSelected, onSelect }: LEDTileProps) {
  const handleClick = useCallback(() => {
    onSelect(tile.id);
  }, [tile.id, onSelect]);

  let bgColor: string;
  let opacity: number = 1;

  if (viewMode === 'status') {
    bgColor = statusColor(tile.status);
    opacity = tile.status === 'offline' ? 0.3 : 0.85;
  } else if (viewMode === 'temperature') {
    bgColor = tempToHeatmapColor(tile.temperature);
    opacity = tile.status === 'offline' ? 0.2 : 0.9;
  } else {
    // errors view
    const hasMatchingError =
      tile.errors.length > 0 &&
      (errorFilter === null || tile.errors.some((e) => e.type === errorFilter));

    if (tile.status === 'offline') {
      bgColor = '#1c1c2b';
      opacity = 0.15;
    } else if (hasMatchingError) {
      bgColor = tile.status === 'error' ? '#ef4444' : '#f59e0b';
      opacity = 0.95;
    } else {
      bgColor = '#22c55e';
      opacity = 0.2;
    }
  }

  const tooltipText =
    tile.status === 'offline'
      ? `Chain ${tile.chainIndex + 1}, Pos ${tile.positionInChain + 1}: Offline`
      : `Chain ${tile.chainIndex + 1}, Pos ${tile.positionInChain + 1}: ${Math.round(tile.temperature)}\u00B0C, ${tile.status}${tile.errors.length > 0 ? ` (${tile.errors.length} error${tile.errors.length > 1 ? 's' : ''})` : ''}`;

  return (
    <div
      onClick={handleClick}
      title={tooltipText}
      className="cursor-pointer rounded-[2px] transition-all duration-100"
      style={{
        backgroundColor: bgColor,
        opacity,
        minWidth: 16,
        minHeight: 16,
        aspectRatio: '1 / 1',
        outline: isSelected ? '2px solid #3b82f6' : undefined,
        outlineOffset: isSelected ? '1px' : undefined,
        boxShadow: isSelected
          ? '0 0 0 1px #3b82f6'
          : undefined,
      }}
    />
  );
}

// Custom memo comparator — only re-render if these props actually change
function areEqual(prev: LEDTileProps, next: LEDTileProps): boolean {
  if (
    prev.tile.id !== next.tile.id ||
    prev.tile.status !== next.tile.status ||
    prev.tile.temperature !== next.tile.temperature ||
    prev.tile.errors.length !== next.tile.errors.length ||
    prev.viewMode !== next.viewMode ||
    prev.errorFilter !== next.errorFilter ||
    prev.isSelected !== next.isSelected
  ) return false;
  // Compare error content (type + message) when length matches
  for (let i = 0; i < prev.tile.errors.length; i++) {
    if (prev.tile.errors[i].type !== next.tile.errors[i].type ||
        prev.tile.errors[i].message !== next.tile.errors[i].message) return false;
  }
  return true;
}

export const LEDTile = memo(LEDTileInner, areEqual);
export default LEDTile;
