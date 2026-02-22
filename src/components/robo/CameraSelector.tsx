'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { Device } from '@/types';

interface CameraSelectorProps {
  cameras: Device[];
  selectedCamera: Device | null;
  onSelect: (camera: Device) => void;
}

function StatusDot({ status }: { status: Device['status'] }) {
  const colors: Record<Device['status'], string> = {
    online: 'var(--success)',
    warning: 'var(--warning)',
    error: 'var(--error)',
    offline: 'var(--muted)',
  };

  return (
    <span
      className="inline-block h-2 w-2 flex-shrink-0 rounded-full"
      style={{
        backgroundColor: colors[status],
        boxShadow: status === 'online' ? `0 0 5px ${colors[status]}80` : 'none',
      }}
    />
  );
}

function StatusIcon({ status }: { status: Device['status'] }) {
  if (status === 'online') return <Wifi className="h-3.5 w-3.5 text-green-400" />;
  if (status === 'warning') return <AlertTriangle className="h-3.5 w-3.5 text-yellow-400" />;
  return <WifiOff className="h-3.5 w-3.5 text-muted" />;
}

export default function CameraSelector({
  cameras,
  selectedCamera,
  onSelect,
}: CameraSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Group cameras: online first, then warning, then offline/error
  const online = cameras.filter((c) => c.status === 'online');
  const warning = cameras.filter((c) => c.status === 'warning');
  const offline = cameras.filter((c) => c.status === 'offline' || c.status === 'error');

  function handleSelect(camera: Device) {
    onSelect(camera);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 min-w-[280px] items-center gap-3 rounded-lg border border-border bg-surface-2 px-3 text-sm transition-all hover:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/40"
        style={{ color: 'var(--foreground)' }}
      >
        {selectedCamera ? (
          <>
            <StatusDot status={selectedCamera.status} />
            <span className="flex-1 text-left font-medium">{selectedCamera.name}</span>
            <span className="font-mono text-[11px]" style={{ color: 'var(--muted)' }}>
              {selectedCamera.ipAddress}
            </span>
          </>
        ) : (
          <span className="flex-1 text-left" style={{ color: 'var(--muted)' }}>
            Select camera...
          </span>
        )}
        <ChevronDown
          className="h-4 w-4 flex-shrink-0 transition-transform"
          style={{
            color: 'var(--muted)',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-full overflow-hidden rounded-lg border border-border shadow-xl"
          style={{ backgroundColor: 'var(--surface)', minWidth: '320px' }}
        >
          {/* Online group */}
          {online.length > 0 && (
            <div>
              <div className="px-3 pt-2 pb-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                  Online
                </span>
              </div>
              {online.map((camera) => (
                <CameraOption
                  key={camera.id}
                  camera={camera}
                  isSelected={selectedCamera?.id === camera.id}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          )}

          {/* Warning group */}
          {warning.length > 0 && (
            <div>
              <div className="px-3 pt-2 pb-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                  Warning
                </span>
              </div>
              {warning.map((camera) => (
                <CameraOption
                  key={camera.id}
                  camera={camera}
                  isSelected={selectedCamera?.id === camera.id}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          )}

          {/* Offline group */}
          {offline.length > 0 && (
            <div>
              {(online.length > 0 || warning.length > 0) && (
                <div className="border-t border-border" />
              )}
              <div className="px-3 pt-2 pb-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                  Offline
                </span>
              </div>
              {offline.map((camera) => (
                <CameraOption
                  key={camera.id}
                  camera={camera}
                  isSelected={selectedCamera?.id === camera.id}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          )}

          {cameras.length === 0 && (
            <div className="px-3 py-4 text-center text-sm" style={{ color: 'var(--muted)' }}>
              No cameras available
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CameraOption({
  camera,
  isSelected,
  onSelect,
}: {
  camera: Device;
  isSelected: boolean;
  onSelect: (camera: Device) => void;
}) {
  return (
    <button
      onClick={() => onSelect(camera)}
      className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors"
      style={{
        backgroundColor: isSelected ? 'var(--surface-2)' : 'transparent',
        color: isSelected ? 'var(--foreground)' : 'var(--muted)',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--surface-2)';
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      <StatusDot status={camera.status} />
      <div className="flex flex-1 flex-col min-w-0">
        <span className="truncate text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          {camera.name}
        </span>
        <span className="text-[11px]" style={{ color: 'var(--muted)' }}>
          {camera.model}
        </span>
      </div>
      <div className="flex flex-shrink-0 items-center gap-2">
        <span className="font-mono text-[11px]" style={{ color: 'var(--muted)' }}>
          {camera.ipAddress}
        </span>
        <StatusIcon status={camera.status} />
      </div>
    </button>
  );
}
