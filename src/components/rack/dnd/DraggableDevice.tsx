'use client';


import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Device } from '@/types';
import { MANUFACTURER_COLORS, STATUS_COLORS } from '@/lib/constants';
import { RU_HEIGHT } from '../RackUnit';

export interface DraggableDeviceData {
  deviceId: string;
  sourceRackId?: string;
  sourceColumn?: number;
  sourceRU?: number;
}

interface DraggableDeviceProps {
  device: Device;
  /** Render in the rack (multi-RU height) vs. the unassigned tray (compact) */
  inRack?: boolean;
  spanHeight?: number;
  ru?: number;
}

export default function DraggableDevice({
  device,
  inRack = false,
  spanHeight = RU_HEIGHT,
  ru,
}: DraggableDeviceProps) {
  const data: DraggableDeviceData = {
    deviceId: device.id,
    sourceRackId: device.rackId,
    sourceColumn: device.rackColumn,
    sourceRU: device.rackSlot,
  };

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `device-${device.id}`,
    data,
  });

  const color = MANUFACTURER_COLORS[device.manufacturer];
  const statusColor = STATUS_COLORS[device.status];

  const locationLabel = device.rackId
    ? `at rack slot ${device.rackSlot ?? 'unknown'}`
    : 'in unassigned tray';

  const ariaLabel = `${device.name}, ${device.rackUnits}U device, ${device.status}, ${locationLabel}. Press Space or Enter to pick up.`;

  if (inRack) {
    return (
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        aria-label={ariaLabel}
        aria-roledescription="draggable device"
        style={{
          transform: CSS.Translate.toString(transform),
          opacity: isDragging ? 0.3 : 1,
          cursor: 'grab',
          touchAction: 'none',
          userSelect: 'none',
          width: '100%',
          height: `${spanHeight}px`,
        }}
      >
        <div
          className="flex items-stretch"
          style={{
            height: '100%',
            borderRadius: '2px',
            overflow: 'hidden',
          }}
        >
          {/* RU label area */}
          <div
            className="flex-shrink-0 flex flex-col items-center justify-center select-none"
            style={{
              width: '28px',
              fontSize: '9px',
              color: 'var(--muted)',
              background: 'rgba(0,0,0,0.3)',
            }}
          >
            {device.rackUnits > 1 && ru != null ? (
              <>
                <span>{ru}</span>
                <span style={{ fontSize: '7px', opacity: 0.6 }}>-</span>
                <span>{ru + device.rackUnits - 1}</span>
              </>
            ) : (
              <span>{ru}</span>
            )}
          </div>

          {/* Manufacturer color bar */}
          <div className="flex-shrink-0" style={{ width: '4px', background: color }} />

          {/* Device info area */}
          <div
            className="flex-1 flex items-center px-2 gap-2 overflow-hidden"
            style={{
              background: `linear-gradient(90deg, ${color}18 0%, transparent 100%)`,
            }}
          >
            <div
              className={device.status === 'error' || device.status === 'warning' ? 'status-pulse' : ''}
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: statusColor,
                flexShrink: 0,
                boxShadow: `0 0 4px ${statusColor}`,
              }}
            />
            <span
              className="truncate"
              style={{ fontSize: '10px', color: 'var(--foreground)', fontWeight: 500, lineHeight: 1 }}
            >
              {device.name}
            </span>
            {device.rackUnits > 1 && (
              <span
                className="flex-shrink-0"
                style={{
                  fontSize: '8px',
                  color: 'var(--muted)',
                  background: 'rgba(0,0,0,0.3)',
                  padding: '1px 4px',
                  borderRadius: '3px',
                }}
              >
                {device.rackUnits}U
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Compact tray variant
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      aria-label={ariaLabel}
      aria-roledescription="draggable device"
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.3 : 1,
        cursor: 'grab',
        touchAction: 'none',
        userSelect: 'none',
      }}
    >
      <div
        className="flex items-center gap-2 rounded"
        style={{
          padding: '6px 10px',
          background: `linear-gradient(90deg, ${color}18 0%, transparent 100%)`,
          border: '1px solid var(--border)',
          borderLeft: `3px solid ${color}`,
          minWidth: '140px',
        }}
      >
        <div
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: statusColor,
            flexShrink: 0,
            boxShadow: `0 0 4px ${statusColor}`,
          }}
        />
        <span
          className="truncate"
          style={{ fontSize: '11px', color: 'var(--foreground)', fontWeight: 500 }}
        >
          {device.name}
        </span>
        <span
          className="flex-shrink-0 font-mono"
          style={{
            fontSize: '9px',
            color: 'var(--muted)',
            background: 'rgba(0,0,0,0.3)',
            padding: '1px 5px',
            borderRadius: '3px',
          }}
        >
          {device.rackUnits}U
        </span>
      </div>
    </div>
  );
}
