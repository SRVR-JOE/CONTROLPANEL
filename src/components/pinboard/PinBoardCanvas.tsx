'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from '@/store';
import { PinBoardItem, Device } from '@/types';
import {
  Thermometer,
  Activity,
  X,
  Cable,
} from 'lucide-react';
import { formatUptime } from '@/lib/utils';

// Tailwind class-based status colors (separate from hex STATUS_COLORS in constants.ts)
const statusColors: Record<string, string> = {
  online: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
  offline: 'bg-muted',
};

interface PinBoardCardProps {
  item: PinBoardItem;
  device: Device;
  boardId: string;
  onDragStart: (itemId: string, offsetX: number, offsetY: number, el: HTMLElement) => void;
}

function PinBoardCard({ item, device, boardId, onDragStart }: PinBoardCardProps) {
  const removePinBoardItem = useStore((s) => s.removePinBoardItem);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    onDragStart(item.id, offsetX, offsetY, el);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    removePinBoardItem(boardId, item.id);
  };

  const inputPorts = device.ports.filter((p) => p.direction === 'input');
  const outputPorts = device.ports.filter((p) => p.direction === 'output');

  return (
    <div
      className="pin-item glass-card absolute cursor-grab select-none active:cursor-grabbing"
      style={{
        left: item.position.x,
        top: item.position.y,
        width: item.size.width,
        minHeight: item.size.height,
      }}
      onMouseDown={handleMouseDown}
      onContextMenu={(e) => {
        e.preventDefault();
        removePinBoardItem(boardId, item.id);
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className={`inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full ${statusColors[device.status]} ${device.status === 'warning' || device.status === 'error' ? 'status-pulse' : ''}`} />
          <span className="truncate text-sm font-semibold text-foreground">
            {item.label || device.name}
          </span>
        </div>
        <button
          onClick={handleRemove}
          className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-muted transition-colors hover:bg-error/20 hover:text-error"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Body */}
      <div className="space-y-2 px-3 py-2">
        {/* Model & IP */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted">{device.model}</span>
          <span className="font-mono text-xs text-muted">{device.ipAddress}</span>
        </div>

        {/* Temperature */}
        {item.showTemperature && (
          <div className="flex items-center gap-2">
            <Thermometer className="h-3.5 w-3.5 text-muted" />
            <div className="flex flex-1 items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                <div
                  className={`h-full rounded-full transition-all ${
                    device.health.temperature > 55
                      ? 'bg-error'
                      : device.health.temperature > 40
                        ? 'bg-warning'
                        : 'bg-success'
                  }`}
                  style={{ width: `${Math.min((device.health.temperature / 80) * 100, 100)}%` }}
                />
              </div>
              <span className="min-w-[3rem] text-right font-mono text-xs text-foreground">
                {device.health.temperature.toFixed(1)}&deg;C
              </span>
            </div>
          </div>
        )}

        {/* Health */}
        {item.showHealth && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-muted" />
              <span className="text-xs text-muted">Health</span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              {device.health.cpuUsage !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-muted">CPU</span>
                  <span className="font-mono text-foreground">{device.health.cpuUsage.toFixed(0)}%</span>
                </div>
              )}
              {device.health.memoryUsage !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-muted">MEM</span>
                  <span className="font-mono text-foreground">{device.health.memoryUsage.toFixed(0)}%</span>
                </div>
              )}
              {device.health.gpuUsage !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-muted">GPU</span>
                  <span className="font-mono text-foreground">{device.health.gpuUsage.toFixed(0)}%</span>
                </div>
              )}
              {device.health.powerDraw !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-muted">PWR</span>
                  <span className="font-mono text-foreground">{device.health.powerDraw.toFixed(0)}W</span>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted">Uptime</span>
              <span className="font-mono text-foreground">{formatUptime(device.health.uptime)}</span>
            </div>
          </div>
        )}

        {/* Ports */}
        {item.showPorts && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Cable className="h-3.5 w-3.5 text-muted" />
              <span className="text-xs text-muted">Ports</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {inputPorts.slice(0, 8).map((port) => (
                <div
                  key={port.id}
                  title={port.label}
                  className={`flex h-4 w-4 items-center justify-center rounded text-[8px] font-bold ${
                    port.signal ? 'bg-success/20 text-success' : 'bg-surface-2 text-muted'
                  }`}
                >
                  I
                </div>
              ))}
              {inputPorts.length > 8 && (
                <span className="flex h-4 items-center text-[9px] text-muted">+{inputPorts.length - 8}</span>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              {outputPorts.slice(0, 8).map((port) => (
                <div
                  key={port.id}
                  title={port.label}
                  className={`flex h-4 w-4 items-center justify-center rounded text-[8px] font-bold ${
                    port.signal ? 'bg-accent/20 text-accent' : 'bg-surface-2 text-muted'
                  }`}
                >
                  O
                </div>
              ))}
              {outputPorts.length > 8 && (
                <span className="flex h-4 items-center text-[9px] text-muted">+{outputPorts.length - 8}</span>
              )}
            </div>
          </div>
        )}

        {/* Errors/Warnings */}
        {device.health.errors.length > 0 && (
          <div className="rounded bg-error/10 px-2 py-1 text-xs text-error">
            {device.health.errors[0]}
          </div>
        )}
        {device.health.warnings.length > 0 && (
          <div className="rounded bg-warning/10 px-2 py-1 text-xs text-warning">
            {device.health.warnings[0]}
          </div>
        )}
      </div>
    </div>
  );
}

interface PinBoardCanvasProps {
  boardId: string;
}

export default function PinBoardCanvas({ boardId }: PinBoardCanvasProps) {
  const pinBoards = useStore((s) => s.pinBoards);
  const devices = useStore((s) => s.devices);
  const updatePinBoardItem = useStore((s) => s.updatePinBoardItem);

  const board = pinBoards.find((b) => b.id === boardId);

  const canvasRef = useRef<HTMLDivElement>(null);

  // dragging state drives cursor style only — not re-renders on every mousemove
  const [dragging, setDragging] = useState(false);

  // All drag state that changes on every mousemove is stored in refs to avoid
  // triggering 60+ store writes per second during a drag operation.
  // The final position is committed to the Zustand store only on mouseup.
  const dragRef = useRef<{
    itemId: string;
    offsetX: number;
    offsetY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  // Sync card visual position during drag via a direct DOM style update.
  // This avoids React re-renders and Zustand store writes on every frame.
  const activeCardRef = useRef<HTMLElement | null>(null);

  const handleDragStart = useCallback(
    (itemId: string, offsetX: number, offsetY: number, cardEl: HTMLElement) => {
      dragRef.current = { itemId, offsetX, offsetY, currentX: 0, currentY: 0 };
      activeCardRef.current = cardEl;
      setDragging(true);
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragRef.current || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = Math.max(0, e.clientX - rect.left - dragRef.current.offsetX);
      const y = Math.max(0, e.clientY - rect.top - dragRef.current.offsetY);
      // Store pending position in the ref — no store write yet
      dragRef.current.currentX = x;
      dragRef.current.currentY = y;
      // Update the DOM element directly for zero-cost visual feedback
      if (activeCardRef.current) {
        activeCardRef.current.style.left = `${x}px`;
        activeCardRef.current.style.top = `${y}px`;
      }
    },
    []
  );

  const commitDrag = useCallback(() => {
    if (!dragRef.current) return;
    // Commit final position to the Zustand store (one write per drag, not 60/s)
    updatePinBoardItem(boardId, dragRef.current.itemId, {
      position: { x: dragRef.current.currentX, y: dragRef.current.currentY },
    });
    dragRef.current = null;
    activeCardRef.current = null;
    setDragging(false);
  }, [boardId, updatePinBoardItem]);

  // Commit on mouseup even if pointer leaves the canvas
  useEffect(() => {
    const onMouseUp = () => {
      if (dragRef.current) commitDrag();
    };
    window.addEventListener('mouseup', onMouseUp);
    return () => window.removeEventListener('mouseup', onMouseUp);
  }, [commitDrag]);

  if (!board) {
    return (
      <div className="flex h-full items-center justify-center text-muted">
        Pin board not found.
      </div>
    );
  }

  return (
    <div
      ref={canvasRef}
      className="relative h-full w-full overflow-auto bg-background"
      onMouseMove={handleMouseMove}
      onMouseLeave={commitDrag}
      style={{
        minHeight: '100%',
        minWidth: '100%',
        cursor: dragging ? 'grabbing' : 'default',
      }}
    >
      {/* Grid background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle, var(--border) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {board.items.map((item) => {
        const device = devices.find((d) => d.id === item.deviceId);
        if (!device) return null;
        return (
          <PinBoardCard
            key={item.id}
            item={item}
            device={device}
            boardId={boardId}
            onDragStart={handleDragStart}
          />
        );
      })}
    </div>
  );
}
