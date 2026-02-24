'use client';

import { useMemo } from 'react';
import { Rack, Device, RackWidth } from '@/types';
import { Thermometer } from 'lucide-react';
import { useStore } from '@/store';
import RackUnit, { RU_HEIGHT } from './RackUnit';

// ============================================================
// Width mapping
// ============================================================

const RACK_WIDTHS: Record<RackWidth, number> = {
  1: 280,
  2: 400,
  3: 520,
};

// ============================================================
// Temperature display helper
// ============================================================

function TempBadge({ label, value }: { label: string; value?: number }) {
  if (value == null) return null;

  let colorClass = 'text-sky-400';
  if (value > 40) colorClass = 'text-red-400';
  else if (value > 30) colorClass = 'text-amber-400';

  return (
    <div className="flex items-center gap-1">
      <Thermometer size={11} className={colorClass} />
      <span style={{ fontSize: '10px', color: 'var(--muted)' }}>{label}</span>
      <span className={colorClass} style={{ fontSize: '11px', fontWeight: 600 }}>
        {value.toFixed(0)}&deg;C
      </span>
    </div>
  );
}

// ============================================================
// Rail marks (screw holes along the rack ears)
// ============================================================

function RailMarks({ totalRU }: { totalRU: number }) {
  return (
    <div className="flex flex-col">
      {Array.from({ length: totalRU }, (_, i) => (
        <div
          key={i}
          className="flex items-center justify-center"
          style={{
            height: `${RU_HEIGHT}px`,
            width: '10px',
          }}
        >
          <div
            style={{
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              background: '#3a3a50',
              border: '1px solid #4a4a60',
            }}
          />
        </div>
      ))}
    </div>
  );
}

// ============================================================
// RackView props
// ============================================================

interface RackViewProps {
  rack: Rack;
  onDeviceClick?: (deviceId: string) => void;
}

// ============================================================
// RackView component
// ============================================================

export default function RackView({ rack, onDeviceClick }: RackViewProps) {
  const devices = useStore((s) => s.devices);
  const rackWidth = RACK_WIDTHS[rack.width];

  // Build a lookup: deviceId -> Device
  const deviceMap = useMemo(() => {
    const map: Record<string, Device> = {};
    for (const d of devices) {
      map[d.id] = d;
    }
    return map;
  }, [devices]);

  // Build render data: for each RU, determine if it's empty, first-of-device, or merged
  const ruData = useMemo(() => {
    const result: Array<{
      ru: number;
      device?: Device;
      isFirstUnit: boolean;
      isMerged: boolean;
      spanHeight: number;
    }> = [];

    const visitedDevices = new Set<string>();

    for (let ru = 1; ru <= rack.totalRU; ru++) {
      const slot = rack.slots.find((s) => s.ru === ru);
      const deviceId = slot?.deviceId;

      if (deviceId && deviceMap[deviceId]) {
        const device = deviceMap[deviceId];

        if (visitedDevices.has(deviceId)) {
          // This RU is part of an already-rendered device block
          result.push({ ru, device, isFirstUnit: false, isMerged: true, spanHeight: 0 });
        } else {
          // First time seeing this device
          visitedDevices.add(deviceId);
          const spanHeight = device.rackUnits * RU_HEIGHT;
          result.push({ ru, device, isFirstUnit: true, isMerged: false, spanHeight });
        }
      } else {
        result.push({ ru, isFirstUnit: false, isMerged: false, spanHeight: RU_HEIGHT });
      }
    }

    return result;
  }, [rack, deviceMap]);

  return (
    <div
      className="flex flex-col"
      style={{ width: `${rackWidth}px`, flexShrink: 0 }}
    >
      {/* Rack header */}
      <div
        className="flex items-center justify-between px-3 py-2 rounded-t-lg"
        style={{
          background: 'linear-gradient(180deg, #2a2a3d 0%, #1c1c2b 100%)',
          borderTop: '2px solid #4a4a60',
          borderLeft: '2px solid #3a3a50',
          borderRight: '2px solid #3a3a50',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: 'var(--foreground)',
              letterSpacing: '0.02em',
            }}
          >
            {rack.name}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--muted)' }}>{rack.location}</div>
        </div>
        <div
          style={{
            fontSize: '10px',
            color: 'var(--muted)',
            background: 'rgba(0,0,0,0.3)',
            padding: '2px 6px',
            borderRadius: '4px',
          }}
        >
          {rack.totalRU}U &middot; {rack.width === 1 ? 'Single' : rack.width === 2 ? 'Double' : 'Triple'}
        </div>
      </div>

      {/* Rack body */}
      <div
        className="flex"
        style={{
          background: 'linear-gradient(180deg, #18182a 0%, #0e0e1a 100%)',
          borderLeft: '2px solid #3a3a50',
          borderRight: '2px solid #3a3a50',
          padding: '0',
        }}
      >
        {/* Left rail */}
        <div
          className="flex-shrink-0 flex flex-col items-center"
          style={{
            width: '12px',
            background: 'linear-gradient(90deg, #2e2e42 0%, #22223a 100%)',
            borderRight: '1px solid #3a3a50',
          }}
        >
          <RailMarks totalRU={rack.totalRU} />
        </div>

        {/* Slots area */}
        <div className="flex-1 flex flex-col">
          {ruData.map((data) => (
            <div
              key={data.ru}
              onClick={
                data.device && data.isFirstUnit && onDeviceClick
                  ? () => onDeviceClick(data.device!.id)
                  : undefined
              }
              style={{
                cursor: data.device && data.isFirstUnit && onDeviceClick ? 'pointer' : undefined,
              }}
            >
              <RackUnit
                ru={data.ru}
                device={data.device}
                isFirstUnit={data.isFirstUnit}
                isMerged={data.isMerged}
                spanHeight={data.spanHeight}
              />
            </div>
          ))}
        </div>

        {/* Right rail */}
        <div
          className="flex-shrink-0 flex flex-col items-center"
          style={{
            width: '12px',
            background: 'linear-gradient(270deg, #2e2e42 0%, #22223a 100%)',
            borderLeft: '1px solid #3a3a50',
          }}
        >
          <RailMarks totalRU={rack.totalRU} />
        </div>
      </div>

      {/* Rack footer - temperatures */}
      <div
        className="flex items-center justify-between px-3 py-2 rounded-b-lg"
        style={{
          background: 'linear-gradient(180deg, #1c1c2b 0%, #2a2a3d 100%)',
          borderBottom: '2px solid #4a4a60',
          borderLeft: '2px solid #3a3a50',
          borderRight: '2px solid #3a3a50',
        }}
      >
        <TempBadge label="Inlet" value={rack.inletTemp} />
        <TempBadge label="Exhaust" value={rack.exhaustTemp} />
        <TempBadge label="Ambient" value={rack.ambientTemp} />
      </div>
    </div>
  );
}
