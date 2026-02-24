'use client';


import { Device } from '@/types';
import { MANUFACTURER_COLORS, STATUS_COLORS } from '@/lib/constants';
import { RU_HEIGHT } from '../RackUnit';

interface DragOverlayContentProps {
  device: Device;
}

export default function DragOverlayContent({ device }: DragOverlayContentProps) {
  const color = MANUFACTURER_COLORS[device.manufacturer];
  const statusColor = STATUS_COLORS[device.status];
  const height = device.rackUnits * RU_HEIGHT;

  return (
    <div
      className="flex items-stretch"
      style={{
        height: `${Math.max(height, 28)}px`,
        width: '240px',
        borderRadius: '4px',
        overflow: 'hidden',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(59,130,246,0.4)',
        opacity: 0.9,
        pointerEvents: 'none',
      }}
    >
      {/* Manufacturer color bar */}
      <div className="flex-shrink-0" style={{ width: '4px', background: color }} />

      {/* Device info */}
      <div
        className="flex-1 flex items-center px-3 gap-2 overflow-hidden"
        style={{
          background: `linear-gradient(90deg, ${color}25 0%, #1a1a2e 100%)`,
        }}
      >
        <div
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: statusColor,
            flexShrink: 0,
            boxShadow: `0 0 6px ${statusColor}`,
          }}
        />
        <span
          className="truncate"
          style={{ fontSize: '11px', color: 'var(--foreground)', fontWeight: 600 }}
        >
          {device.name}
        </span>
        <span
          className="flex-shrink-0 font-mono"
          style={{
            fontSize: '9px',
            color: 'var(--muted)',
            background: 'rgba(0,0,0,0.4)',
            padding: '2px 6px',
            borderRadius: '3px',
          }}
        >
          {device.rackUnits}U
        </span>
      </div>
    </div>
  );
}
