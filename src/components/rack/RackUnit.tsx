'use client';

import React from 'react';
import { Device, DeviceManufacturer, DeviceStatus } from '@/types';

// ============================================================
// Manufacturer color mapping
// ============================================================

const MANUFACTURER_COLORS: Record<DeviceManufacturer, string> = {
  disguise: '#e91e63',
  barco: '#00bcd4',
  brompton: '#4caf50',
  lightware: '#ff9800',
  aja: '#ffc107',
  blackmagic: '#607d8b',
  ross: '#9c27b0',
  yamaha: '#7c3aed',
  'allen-heath': '#06b6d4',
  behringer: '#f97316',
  shure: '#14b8a6',
  sennheiser: '#64748b',
  panasonic: '#0ea5e9',
  sony: '#1d4ed8',
  etc: '#a855f7',
  'ma-lighting': '#ec4899',
  qsc: '#84cc16',
  'clear-com': '#f43f5e',
  riedel: '#0d9488',
  magewell: '#6366f1',
  teradek: '#e11d48',
  extron: '#059669',
  crestron: '#2563eb',
  ptzoptics: '#d97706',
  datavideo: '#7c2d12',
  roland: '#dc2626',
};

const STATUS_COLORS: Record<DeviceStatus, string> = {
  online: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  offline: '#6b7280',
};

// ============================================================
// Props
// ============================================================

interface RackUnitProps {
  ru: number;
  device?: Device;
  isFirstUnit?: boolean; // true if this is the top RU of a multi-RU device
  isMerged?: boolean; // true if this RU is part of a multi-RU device but not the first
  spanHeight?: number; // total height of the merged device block in px
}

const RU_HEIGHT = 20; // 1 RU = 20px

// ============================================================
// Empty slot
// ============================================================

function EmptySlot({ ru }: { ru: number }) {
  return (
    <div
      className="rack-unit flex items-center"
      style={{
        height: `${RU_HEIGHT}px`,
        borderStyle: 'dashed',
        borderColor: 'var(--border)',
        borderWidth: '1px',
        background: 'transparent',
      }}
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
      <div
        className="flex-1 h-full"
        style={{
          background: 'rgba(20, 20, 31, 0.3)',
        }}
      />
    </div>
  );
}

// ============================================================
// Occupied slot (first unit of device -- rendered as merged block)
// ============================================================

function OccupiedSlot({
  ru,
  device,
  spanHeight,
}: {
  ru: number;
  device: Device;
  spanHeight: number;
}) {
  const color = MANUFACTURER_COLORS[device.manufacturer];
  const statusColor = STATUS_COLORS[device.status];

  return (
    <div
      className="rack-unit occupied flex items-stretch relative"
      style={{
        height: `${spanHeight}px`,
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
        {device.rackUnits > 1 ? (
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
      <div
        className="flex-shrink-0"
        style={{
          width: '4px',
          background: color,
        }}
      />

      {/* Device info area */}
      <div
        className="flex-1 flex items-center px-2 gap-2 overflow-hidden"
        style={{
          background: `linear-gradient(90deg, ${color}18 0%, transparent 100%)`,
        }}
      >
        {/* Status dot */}
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

        {/* Device name */}
        <span
          className="truncate"
          style={{
            fontSize: '10px',
            color: 'var(--foreground)',
            fontWeight: 500,
            lineHeight: 1,
          }}
        >
          {device.name}
        </span>

        {/* RU size badge */}
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
  );
}

// ============================================================
// RackUnit component
// ============================================================

export default function RackUnit({
  ru,
  device,
  isFirstUnit = false,
  isMerged = false,
  spanHeight = RU_HEIGHT,
}: RackUnitProps) {
  // If this is a merged (non-first) RU of a multi-unit device, render nothing
  // The first unit already covers this space
  if (isMerged) {
    return null;
  }

  // If occupied and this is the first unit, render the full device block
  if (device && isFirstUnit) {
    return <OccupiedSlot ru={ru} device={device} spanHeight={spanHeight} />;
  }

  // Empty slot
  return <EmptySlot ru={ru} />;
}

export { MANUFACTURER_COLORS, STATUS_COLORS, RU_HEIGHT };
