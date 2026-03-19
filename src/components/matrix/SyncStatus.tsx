'use client';

import { type DeviceSyncStatus } from '@/hooks/useMatrixSync';

interface SyncStatusProps {
  syncing: boolean;
  lastSyncAt: Date | null;
  deviceStatus: Record<string, DeviceSyncStatus>;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Compact sync status indicator for the matrix page.
 * Shows overall sync state and per-device connection status.
 */
export default function SyncStatus({
  syncing,
  lastSyncAt,
  deviceStatus,
}: SyncStatusProps) {
  // Determine aggregate status from all devices
  const statuses = Object.values(deviceStatus);
  const hasOnline = statuses.includes('online');
  const hasError = statuses.includes('error');
  const hasOffline = statuses.includes('offline');

  let dotColor: string;
  let label: string;

  if (syncing) {
    dotColor = 'bg-yellow-400';
    label = 'SYNCING';
  } else if (statuses.length === 0) {
    dotColor = 'bg-gray-500';
    label = 'IDLE';
  } else if (hasOnline && !hasError && !hasOffline) {
    dotColor = 'bg-emerald-400';
    label = 'LIVE';
  } else if (hasError || hasOffline) {
    dotColor = hasOnline ? 'bg-yellow-400' : 'bg-red-500';
    label = hasOnline ? 'PARTIAL' : 'OFFLINE';
  } else {
    dotColor = 'bg-gray-500';
    label = 'IDLE';
  }

  return (
    <div className="flex items-center gap-2 rounded border border-[var(--border)] bg-[#0c0c14] px-3 py-1.5">
      {/* Animated dot */}
      <span className="relative flex h-2.5 w-2.5">
        {(syncing || (hasOnline && !hasError && !hasOffline)) && (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-40 ${dotColor}`}
          />
        )}
        <span
          className={`relative inline-flex h-2.5 w-2.5 rounded-full ${dotColor}`}
        />
      </span>

      {/* Label */}
      <span className="font-mono text-[10px] font-semibold tracking-wider text-[var(--foreground)]">
        {label}
      </span>

      {/* Last sync time */}
      {lastSyncAt && (
        <span className="font-mono text-[10px] text-[var(--muted)]">
          {formatTime(lastSyncAt)}
        </span>
      )}

      {/* Per-device dots */}
      {statuses.length > 0 && (
        <div className="ml-1 flex items-center gap-1 border-l border-[var(--border)] pl-2">
          {Object.entries(deviceStatus).map(([id, status]) => (
            <span
              key={id}
              title={`${id}: ${status}`}
              className={`inline-block h-1.5 w-1.5 rounded-full ${
                status === 'online'
                  ? 'bg-emerald-400'
                  : status === 'error'
                    ? 'bg-red-500'
                    : 'bg-gray-500'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
