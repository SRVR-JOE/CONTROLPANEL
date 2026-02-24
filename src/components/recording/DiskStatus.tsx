'use client';


import { HardDrive } from 'lucide-react';

interface SlotInfo {
  slotId: number;
  status: 'empty' | 'mounted' | 'recording' | 'busy';
  volumeName?: string;
  recordingTime?: number; // seconds remaining
  totalSpace?: number;    // bytes
  freeSpace?: number;     // bytes
}

interface DiskStatusProps {
  slots: SlotInfo[];
  activeSlot: number;
  onSelectSlot: (slotId: number) => void;
  currentClipName?: string;
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const idx = Math.min(i, units.length - 1);
  return `${(bytes / Math.pow(1024, idx)).toFixed(1)} ${units[idx]}`;
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const SLOT_STATUS_COLOR: Record<SlotInfo['status'], string> = {
  empty:     '#4a4a5e',
  mounted:   '#22c55e',
  recording: '#ef4444',
  busy:      '#f59e0b',
};

const SLOT_STATUS_LABEL: Record<SlotInfo['status'], string> = {
  empty:     'Empty',
  mounted:   'Mounted',
  recording: 'Recording',
  busy:      'Busy',
};

export default function DiskStatus({
  slots,
  activeSlot,
  onSelectSlot,
  currentClipName,
}: DiskStatusProps) {
  const activeSlotInfo = slots.find((s) => s.slotId === activeSlot) ?? slots[0];

  if (!slots.length) {
    return (
      <div
        className="rounded-xl border p-4 flex items-center justify-center"
        style={{
          background: 'rgba(14,14,24,0.6)',
          borderColor: 'rgba(255,255,255,0.06)',
          minHeight: 120,
        }}
      >
        <p className="text-xs font-mono" style={{ color: '#4a4a5e' }}>
          No disk information available
        </p>
      </div>
    );
  }

  const usedSpace  = activeSlotInfo
    ? (activeSlotInfo.totalSpace ?? 0) - (activeSlotInfo.freeSpace ?? 0)
    : 0;
  const totalSpace = activeSlotInfo?.totalSpace ?? 0;
  const usedPct    = totalSpace > 0 ? Math.min(100, (usedSpace / totalSpace) * 100) : 0;

  const barColor =
    usedPct > 90 ? '#ef4444' :
    usedPct > 75 ? '#f59e0b' :
    '#22c55e';

  return (
    <div
      className="rounded-xl border p-4 space-y-4"
      style={{
        background: 'rgba(14,14,24,0.6)',
        borderColor: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <HardDrive className="w-4 h-4" style={{ color: '#6366f1' }} />
        <span className="text-xs font-mono uppercase tracking-[0.2em]" style={{ color: '#7a7a8e' }}>
          Disk Status
        </span>
      </div>

      {/* Slot selector tabs */}
      {slots.length > 1 && (
        <div className="flex gap-2">
          {slots.map((slot) => {
            const isActive = slot.slotId === activeSlot;
            const color = SLOT_STATUS_COLOR[slot.status];
            return (
              <button
                key={slot.slotId}
                onClick={() => onSelectSlot(slot.slotId)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-150 text-xs font-mono"
                style={{
                  background: isActive ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                  border: isActive ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.06)',
                  color: isActive ? '#e0e0f0' : '#6b7280',
                  cursor: 'pointer',
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: color }}
                />
                Slot {slot.slotId}
              </button>
            );
          })}
        </div>
      )}

      {/* Active slot details */}
      {activeSlotInfo && (
        <div className="space-y-3">
          {/* Status row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{
                  backgroundColor: SLOT_STATUS_COLOR[activeSlotInfo.status],
                  boxShadow: activeSlotInfo.status === 'recording'
                    ? `0 0 6px ${SLOT_STATUS_COLOR[activeSlotInfo.status]}`
                    : 'none',
                }}
              />
              <span className="text-xs font-mono" style={{ color: '#c0c0d0' }}>
                {SLOT_STATUS_LABEL[activeSlotInfo.status]}
              </span>
            </div>
            {activeSlotInfo.volumeName && (
              <span className="text-xs font-mono" style={{ color: '#6b7280' }}>
                {activeSlotInfo.volumeName}
              </span>
            )}
          </div>

          {/* Disk space bar */}
          {totalSpace > 0 && (
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[10px] font-mono" style={{ color: '#6b7280' }}>
                  Used: {formatBytes(usedSpace)}
                </span>
                <span className="text-[10px] font-mono" style={{ color: '#6b7280' }}>
                  Total: {formatBytes(totalSpace)}
                </span>
              </div>
              <div
                className="w-full rounded-full overflow-hidden"
                style={{ height: 6, background: 'rgba(255,255,255,0.05)' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${usedPct}%`,
                    background: barColor,
                    boxShadow: `0 0 6px ${barColor}60`,
                  }}
                />
              </div>
              <div className="flex justify-between">
                <span className="text-[10px] font-mono" style={{ color: '#4a4a5e' }}>
                  {usedPct.toFixed(1)}% used
                </span>
                <span className="text-[10px] font-mono" style={{ color: '#4a4a5e' }}>
                  Free: {formatBytes(activeSlotInfo.freeSpace ?? 0)}
                </span>
              </div>
            </div>
          )}

          {activeSlotInfo.status === 'empty' && (
            <p className="text-xs font-mono text-center py-2" style={{ color: '#4a4a5e' }}>
              No media inserted
            </p>
          )}

          {/* Recording time remaining */}
          {(activeSlotInfo.recordingTime ?? 0) > 0 && (
            <div
              className="flex items-center justify-between px-3 py-2 rounded-lg"
              style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)' }}
            >
              <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: '#22c55e' }}>
                Recording time remaining
              </span>
              <span className="text-sm font-mono font-bold" style={{ color: '#22c55e' }}>
                {formatDuration(activeSlotInfo.recordingTime ?? 0)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Current clip */}
      {currentClipName && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: '#6b7280' }}>
            Clip:
          </span>
          <span className="text-xs font-mono truncate" style={{ color: '#c0c0d0' }}>
            {currentClipName}
          </span>
        </div>
      )}
    </div>
  );
}
