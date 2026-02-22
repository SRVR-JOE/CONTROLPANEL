'use client';

import React from 'react';
import { Rack, Device } from '@/types';
import { RU_HEIGHT } from '../RackUnit';
import DraggableDevice from './DraggableDevice';
import DroppableSlot from './DroppableSlot';

const COLUMN_WIDTH = 280;

interface InteractiveRackColumnProps {
  rack: Rack;
  columnIndex: number;
  deviceMap: Record<string, Device>;
  showLeftRail?: boolean;
  showRightRail?: boolean;
  validDropRUs?: Set<number>;
  highlightedRUs?: Set<number>;
  draggingDeviceId?: string | null;
}

function RailMarks({ totalRU }: { totalRU: number }) {
  return (
    <div className="flex flex-col">
      {Array.from({ length: totalRU }, (_, i) => (
        <div
          key={i}
          className="flex items-center justify-center"
          style={{ height: `${RU_HEIGHT}px`, width: '10px' }}
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

export default function InteractiveRackColumn({
  rack,
  columnIndex,
  deviceMap,
  showLeftRail = true,
  showRightRail = true,
  validDropRUs,
  highlightedRUs,
  draggingDeviceId,
}: InteractiveRackColumnProps) {
  const columnSlots = React.useMemo(() => {
    return rack.slots.filter((s) => (s.column ?? 0) === columnIndex);
  }, [rack.slots, columnIndex]);

  // Build list of devices in this column with their start RU
  const columnDevices = React.useMemo(() => {
    const seen = new Set<string>();
    const result: Array<{ device: Device; startRU: number }> = [];

    for (let ru = 1; ru <= rack.totalRU; ru++) {
      const slot = columnSlots.find((s) => s.ru === ru);
      const deviceId = slot?.deviceId;
      if (deviceId && deviceMap[deviceId] && !seen.has(deviceId)) {
        seen.add(deviceId);
        result.push({ device: deviceMap[deviceId], startRU: ru });
      }
    }
    return result;
  }, [rack.totalRU, columnSlots, deviceMap]);

  const totalHeight = rack.totalRU * RU_HEIGHT;

  return (
    <div className="flex" style={{ width: `${COLUMN_WIDTH}px` }}>
      {/* Left rail */}
      {showLeftRail && (
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
      )}

      {/* Slots area — two layers: droppable grid + draggable devices */}
      <div
        className="flex-1"
        style={{ position: 'relative', height: `${totalHeight}px` }}
      >
        {/* Layer 1: Droppable slots grid (background) */}
        <div style={{ position: 'absolute', inset: 0 }}>
          {Array.from({ length: rack.totalRU }, (_, i) => {
            const ru = i + 1;
            return (
              <DroppableSlot
                key={ru}
                rackId={rack.id}
                column={columnIndex}
                ru={ru}
                isValidTarget={validDropRUs?.has(ru) ?? undefined}
                isHighlighted={highlightedRUs?.has(ru) ?? false}
              />
            );
          })}
        </div>

        {/* Layer 2: Draggable devices (foreground, absolutely positioned) */}
        {columnDevices.map(({ device, startRU }) => {
          const isBeingDragged = draggingDeviceId === device.id;
          const top = (startRU - 1) * RU_HEIGHT;
          const spanHeight = device.rackUnits * RU_HEIGHT;

          return (
            <div
              key={device.id}
              style={{
                position: 'absolute',
                top: `${top}px`,
                left: 0,
                right: 0,
                height: `${spanHeight}px`,
                zIndex: 2,
                // When being dragged, hide so empty slots are visible beneath
                opacity: isBeingDragged ? 0 : 1,
                pointerEvents: isBeingDragged ? 'none' : 'auto',
              }}
            >
              <DraggableDevice
                device={device}
                inRack
                spanHeight={spanHeight}
                ru={startRU}
              />
            </div>
          );
        })}
      </div>

      {/* Right rail */}
      {showRightRail && (
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
      )}
    </div>
  );
}
