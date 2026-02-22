'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { RU_HEIGHT } from '../RackUnit';

export interface DroppableSlotData {
  rackId: string;
  column: number;
  ru: number;
}

interface DroppableSlotProps {
  rackId: string;
  column: number;
  ru: number;
  /** Whether a device being dragged can be placed here */
  isValidTarget?: boolean;
  /** Whether this slot is within the hover zone of a dragged device */
  isHighlighted?: boolean;
}

export default function DroppableSlot({
  rackId,
  column,
  ru,
  isValidTarget,
  isHighlighted = false,
}: DroppableSlotProps) {
  const data: DroppableSlotData = { rackId, column, ru };

  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${rackId}-${column}-${ru}`,
    data,
  });

  let borderColor = 'var(--border)';
  let bgColor = 'transparent';

  if (isOver || isHighlighted) {
    if (isValidTarget === false) {
      borderColor = 'rgba(239, 68, 68, 0.6)';
      bgColor = 'rgba(239, 68, 68, 0.08)';
    } else if (isValidTarget === true) {
      borderColor = 'rgba(59, 130, 246, 0.6)';
      bgColor = 'rgba(59, 130, 246, 0.08)';
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        height: `${RU_HEIGHT}px`,
        borderStyle: 'dashed',
        borderColor,
        borderWidth: '1px',
        background: bgColor || 'transparent',
        transition: 'border-color 0.1s ease, background 0.1s ease',
      }}
      className="flex items-center"
    >
      <span
        className="flex-shrink-0 text-center select-none"
        style={{
          width: '28px',
          fontSize: '9px',
          color: 'var(--muted)',
          opacity: 0.5,
        }}
      >
        {ru}
      </span>
      <div className="flex-1 h-full" style={{ background: 'rgba(20, 20, 31, 0.3)' }} />
    </div>
  );
}
