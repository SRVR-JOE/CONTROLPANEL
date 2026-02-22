'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  Announcements,
} from '@dnd-kit/core';
import { Rack, Device } from '@/types';
import { useStore } from '@/store';
import { Thermometer, Undo2, Redo2 } from 'lucide-react';
import InteractiveRackColumn from './InteractiveRackColumn';
import UnassignedDeviceTray, { UNASSIGNED_TRAY_ID } from './UnassignedDeviceTray';
import DragOverlayContent from './DragOverlayContent';
import type { DraggableDeviceData } from './DraggableDevice';
import type { DroppableSlotData } from './DroppableSlot';
import { useRackHistory } from '@/hooks/useRackHistory';

const COLUMN_WIDTH = 280;

// ============================================================
// Temperature badge (mirrored from RackView)
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
// Validation helpers (inline — canPlace and getValidDropRUs)
// ============================================================

function canPlace(
  rack: Rack,
  deviceRU: number,
  targetRU: number,
  targetColumn: number,
  draggedDeviceId: string
): boolean {
  for (let ru = targetRU; ru < targetRU + deviceRU; ru++) {
    if (ru > rack.totalRU) return false;
    const slot = rack.slots.find((s) => s.ru === ru && (s.column ?? 0) === targetColumn);
    if (!slot) return false;
    if (slot.deviceId && slot.deviceId !== draggedDeviceId) return false;
  }
  return true;
}

/** Return the set of RU numbers that would be valid drop targets for the given device in the given column */
function getValidDropRUs(
  rack: Rack,
  device: Device,
  column: number,
  draggedDeviceId: string
): Set<number> {
  const valid = new Set<number>();
  for (let ru = 1; ru <= rack.totalRU - device.rackUnits + 1; ru++) {
    if (canPlace(rack, device.rackUnits, ru, column, draggedDeviceId)) {
      // All RUs in this span are valid
      for (let r = ru; r < ru + device.rackUnits; r++) {
        valid.add(r);
      }
    }
  }
  return valid;
}

// ============================================================
// Undo / Redo button
// ============================================================

interface IconButtonProps {
  onClick: () => void;
  disabled: boolean;
  title: string;
  children: React.ReactNode;
}

function IconButton({ onClick, disabled, title, children }: IconButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 8px',
        fontSize: '11px',
        color: disabled ? 'var(--muted)' : 'var(--foreground)',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid var(--border)',
        borderRadius: '5px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        transition: 'opacity 0.15s ease, background 0.15s ease',
        userSelect: 'none',
        fontFamily: 'inherit',
      }}
      onMouseEnter={(e) => {
        if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)';
      }}
    >
      {children}
    </button>
  );
}

// ============================================================
// InteractiveRackEditor
// ============================================================

interface InteractiveRackEditorProps {
  rack: Rack;
}

export default function InteractiveRackEditor({ rack }: InteractiveRackEditorProps) {
  const devices = useStore((s) => s.devices);
  const assignDeviceToRack = useStore((s) => s.assignDeviceToRack);
  const removeDeviceFromRack = useStore((s) => s.removeDeviceFromRack);

  const [activeDevice, setActiveDevice] = useState<Device | null>(null);
  const [overSlot, setOverSlot] = useState<DroppableSlotData | null>(null);

  const { pushAction, undo, redo, canUndo, canRedo } = useRackHistory();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  // Device lookup map
  const deviceMap = useMemo(() => {
    const map: Record<string, Device> = {};
    for (const d of devices) map[d.id] = d;
    return map;
  }, [devices]);

  // Unassigned devices (not in any rack)
  const unassignedDevices = useMemo(
    () => devices.filter((d) => !d.rackId),
    [devices]
  );

  const totalWidth = COLUMN_WIDTH * rack.width;

  // Compute valid drop RUs per column when dragging
  const validDropRUsByColumn = useMemo(() => {
    if (!activeDevice) return {};
    const result: Record<number, Set<number>> = {};
    for (let col = 0; col < rack.width; col++) {
      result[col] = getValidDropRUs(rack, activeDevice, col, activeDevice.id);
    }
    return result;
  }, [activeDevice, rack]);

  // Compute highlighted RUs (the span that would be occupied if dropped at overSlot)
  const highlightedByColumn = useMemo(() => {
    if (!activeDevice || !overSlot) return {};
    const { column, ru } = overSlot;
    const deviceRU = activeDevice.rackUnits;
    const result: Record<number, Set<number>> = {};
    // Highlight the span regardless — DroppableSlot receives isValidTarget for color differentiation
    const set = new Set<number>();
    for (let r = ru; r < ru + deviceRU && r <= rack.totalRU; r++) {
      set.add(r);
    }
    result[column] = set;
    return result;
  }, [activeDevice, overSlot, rack]);

  // ------- Keyboard shortcut: Cmd/Ctrl+Z / Cmd/Ctrl+Shift+Z -------

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      const metaKey = isMac ? e.metaKey : e.ctrlKey;

      if (!metaKey) return;

      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
        e.preventDefault();
        redo();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // ------- DnD accessibility announcements -------

  const announcements: Announcements = useMemo(
    () => ({
      onDragStart({ active }) {
        const data = active.data.current as DraggableDeviceData | undefined;
        const device = data ? deviceMap[data.deviceId] : null;
        if (!device) return 'Picked up a device.';
        const location = device.rackId
          ? `from slot ${device.rackSlot ?? 'unknown'}`
          : 'from the unassigned tray';
        return `Picked up ${device.name}, ${device.rackUnits}U ${location}. Use arrow keys to move, Space or Enter to drop, Escape to cancel.`;
      },
      onDragOver({ active, over }) {
        if (!over) return 'Not over any drop target.';
        const data = active.data.current as DraggableDeviceData | undefined;
        const device = data ? deviceMap[data.deviceId] : null;
        if (over.id === UNASSIGNED_TRAY_ID) {
          return `${device?.name ?? 'Device'} is over the unassigned tray.`;
        }
        const slotData = over.data.current as DroppableSlotData | undefined;
        if (slotData && 'ru' in slotData) {
          const { ru, column } = slotData;
          const colLabel = column > 0 ? `, bay ${column + 1}` : '';
          const valid = canPlace(rack, device?.rackUnits ?? 1, ru, column, device?.id ?? '');
          return `${device?.name ?? 'Device'} is over slot ${ru}${colLabel}. ${valid ? 'Drop target is valid.' : 'Drop target is invalid — slot occupied.'}`;
        }
        return `Over drop target.`;
      },
      onDragEnd({ active, over }) {
        const data = active.data.current as DraggableDeviceData | undefined;
        const device = data ? deviceMap[data.deviceId] : null;
        if (!over) return `${device?.name ?? 'Device'} was dropped and returned to original position.`;
        if (over.id === UNASSIGNED_TRAY_ID) {
          return `${device?.name ?? 'Device'} was moved to the unassigned tray.`;
        }
        const slotData = over.data.current as DroppableSlotData | undefined;
        if (slotData && 'ru' in slotData) {
          return `${device?.name ?? 'Device'} was placed at slot ${slotData.ru}.`;
        }
        return `${device?.name ?? 'Device'} was dropped.`;
      },
      onDragCancel({ active }) {
        const data = active.data.current as DraggableDeviceData | undefined;
        const device = data ? deviceMap[data.deviceId] : null;
        return `Drag cancelled. ${device?.name ?? 'Device'} returned to original position.`;
      },
    }),
    [deviceMap, rack]
  );

  // ------- DnD event handlers -------

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const data = event.active.data.current as DraggableDeviceData | undefined;
      if (data) {
        const device = deviceMap[data.deviceId];
        if (device) setActiveDevice(device);
      }
    },
    [deviceMap]
  );

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const over = event.over;
    if (!over) {
      setOverSlot(null);
      return;
    }
    const overData = over.data.current as DroppableSlotData | { type: string } | undefined;
    if (overData && 'ru' in overData) {
      setOverSlot(overData as DroppableSlotData);
    } else {
      setOverSlot(null);
    }
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveDevice(null);
      setOverSlot(null);

      if (!over) return;

      const dragData = active.data.current as DraggableDeviceData | undefined;
      if (!dragData) return;

      const device = deviceMap[dragData.deviceId];
      if (!device) return;

      const overId = over.id as string;

      // Dropped on unassigned tray
      if (overId === UNASSIGNED_TRAY_ID) {
        if (device.rackId) {
          // Record state before unassign for undo
          pushAction({
            type: 'unassign',
            deviceId: device.id,
            from: {
              rackId: device.rackId,
              slot: device.rackSlot ?? 1,
              column: device.rackColumn ?? 0,
            },
          });
          removeDeviceFromRack(device.id);
        }
        return;
      }

      // Dropped on a rack slot
      const slotData = over.data.current as DroppableSlotData | undefined;
      if (slotData && 'ru' in slotData) {
        const { rackId, column, ru } = slotData;

        // Validate placement
        if (!canPlace(rack, device.rackUnits, ru, column, device.id)) {
          return; // Invalid — snap back
        }

        // If the device is already at this exact position, no-op
        if (
          device.rackId === rackId &&
          device.rackSlot === ru &&
          device.rackColumn === column
        ) {
          return;
        }

        // Record state before assign for undo
        const hadPrevLocation = !!device.rackId;
        pushAction({
          type: hadPrevLocation ? 'move' : 'assign',
          deviceId: device.id,
          from: hadPrevLocation
            ? {
                rackId: device.rackId!,
                slot: device.rackSlot ?? 1,
                column: device.rackColumn ?? 0,
              }
            : undefined,
          to: { rackId, slot: ru, column },
        });

        // assignDeviceToRack already handles clearing old slots
        assignDeviceToRack(device.id, rackId, ru, column);
      }
    },
    [deviceMap, rack, assignDeviceToRack, removeDeviceFromRack, pushAction]
  );

  // ------- Render -------

  const headerLabel = rack.width > 1
    ? `${rack.totalRU}U \u00D7 ${rack.width}`
    : `${rack.totalRU}U`;
  const widthLabel = rack.width === 1 ? 'Single' : rack.width === 2 ? 'Double' : 'Triple';

  return (
    <DndContext
      sensors={sensors}
      accessibility={{ announcements }}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col gap-4">
        {/* Toolbar: label + undo/redo */}
        <div className="flex items-center justify-between" style={{ minHeight: '28px' }}>
          <div
            className="font-mono"
            style={{
              fontSize: '11px',
              color: 'var(--muted)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Rack Layout — Drag to reposition
          </div>

          <div className="flex items-center gap-1">
            <IconButton
              onClick={undo}
              disabled={!canUndo}
              title="Undo last rack move (Ctrl+Z / Cmd+Z)"
            >
              <Undo2 size={12} />
              Undo
            </IconButton>
            <IconButton
              onClick={redo}
              disabled={!canRedo}
              title="Redo last rack move (Ctrl+Shift+Z / Cmd+Shift+Z)"
            >
              <Redo2 size={12} />
              Redo
            </IconButton>
          </div>
        </div>

        {/* Rack visualization */}
        <div className="flex flex-col" style={{ width: `${totalWidth}px`, flexShrink: 0 }}>
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
              {headerLabel} &middot; {widthLabel}
            </div>
          </div>

          {/* Bay labels for multi-wide */}
          {rack.width > 1 && (
            <div
              className="flex"
              style={{
                background: '#1a1a2e',
                borderLeft: '2px solid #3a3a50',
                borderRight: '2px solid #3a3a50',
              }}
            >
              {Array.from({ length: rack.width }, (_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-center"
                  style={{
                    width: `${COLUMN_WIDTH}px`,
                    padding: '2px 0',
                    fontSize: '9px',
                    fontWeight: 600,
                    color: '#6a6a80',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    borderRight: i < rack.width - 1 ? '1px solid #2a2a40' : undefined,
                  }}
                >
                  Bay {i + 1}
                </div>
              ))}
            </div>
          )}

          {/* Rack body */}
          <div
            role="listbox"
            aria-label={`${rack.name} rack slots`}
            aria-multiselectable={false}
            className="flex"
            style={{
              background: 'linear-gradient(180deg, #18182a 0%, #0e0e1a 100%)',
              borderLeft: '2px solid #3a3a50',
              borderRight: '2px solid #3a3a50',
            }}
          >
            {Array.from({ length: rack.width }, (_, colIdx) => (
              <InteractiveRackColumn
                key={colIdx}
                rack={rack}
                columnIndex={colIdx}
                deviceMap={deviceMap}
                showLeftRail={colIdx === 0}
                showRightRail={colIdx === rack.width - 1}
                validDropRUs={validDropRUsByColumn[colIdx]}
                highlightedRUs={highlightedByColumn[colIdx]}
                draggingDeviceId={activeDevice?.id ?? null}
              />
            ))}
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

        {/* Unassigned device tray */}
        <UnassignedDeviceTray devices={unassignedDevices} />

        {/* Keyboard / interaction instructions */}
        <p
          style={{
            fontSize: '11px',
            color: 'var(--muted)',
            opacity: 0.7,
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          Drag devices to reposition. Keyboard: Space or Enter to grab, Arrow keys to move, Escape to cancel. Undo: Ctrl+Z / Cmd+Z. Redo: Ctrl+Shift+Z / Cmd+Shift+Z.
        </p>
      </div>

      {/* Drag overlay — floating preview that follows cursor */}
      <DragOverlay dropAnimation={null}>
        {activeDevice ? <DragOverlayContent device={activeDevice} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
