'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Device } from '@/types';
import DraggableDevice from './DraggableDevice';
import { PackageOpen } from 'lucide-react';

export const UNASSIGNED_TRAY_ID = 'unassigned-tray';

interface UnassignedDeviceTrayProps {
  devices: Device[];
}

export default function UnassignedDeviceTray({ devices }: UnassignedDeviceTrayProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: UNASSIGNED_TRAY_ID,
    data: { type: 'unassigned-tray' },
  });

  return (
    <div
      ref={setNodeRef}
      className="rounded-lg"
      style={{
        border: isOver
          ? '1px solid rgba(59, 130, 246, 0.5)'
          : '1px dashed var(--border)',
        background: isOver
          ? 'rgba(59, 130, 246, 0.05)'
          : 'var(--surface)',
        padding: '12px',
        minHeight: '60px',
        transition: 'border-color 0.15s ease, background 0.15s ease',
      }}
    >
      <div
        className="font-mono flex items-center gap-2 mb-3"
        style={{
          fontSize: '10px',
          fontWeight: 600,
          color: 'var(--muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        <PackageOpen size={12} />
        Unassigned Devices
        <span
          style={{
            fontSize: '9px',
            background: 'rgba(0,0,0,0.3)',
            padding: '1px 6px',
            borderRadius: '8px',
          }}
        >
          {devices.length}
        </span>
      </div>

      {devices.length === 0 ? (
        <div
          style={{
            fontSize: '11px',
            color: 'var(--muted)',
            opacity: 0.6,
            padding: '8px 0',
          }}
        >
          No unassigned devices — drag a device here to unassign
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {devices.map((device) => (
            <DraggableDevice key={device.id} device={device} inRack={false} />
          ))}
        </div>
      )}
    </div>
  );
}
