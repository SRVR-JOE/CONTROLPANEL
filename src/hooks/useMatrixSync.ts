'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useStore } from '@/store';
import { MatrixInput, MatrixOutput } from '@/types';

interface DeviceMapping {
  routerId: string;
  manufacturer: string;
  ip: string;
  port?: number;
}

// Hardcoded device mappings for the three known matrix devices
const DEVICE_MAPPINGS: DeviceMapping[] = [
  { routerId: 'router-lw-1', manufacturer: 'lightware', ip: '192.168.100.51' },
  { routerId: 'router-bmd-1', manufacturer: 'blackmagic', ip: '192.168.100.52' },
  { routerId: 'router-aja-1', manufacturer: 'aja', ip: '192.168.100.72' },
];

export type DeviceSyncStatus = 'online' | 'offline' | 'error';

interface SyncResult {
  routerId: string;
  reachable: boolean;
  inputs?: MatrixInput[];
  outputs?: MatrixOutput[];
  name?: string;
  model?: string;
  size?: string;
  error?: string;
}

interface SyncResponse {
  results: SyncResult[];
}

interface UseMatrixSyncReturn {
  syncing: boolean;
  lastSyncAt: Date | null;
  deviceStatus: Record<string, DeviceSyncStatus>;
}

/**
 * Hook that periodically polls real matrix devices and syncs their
 * routing state (inputs, outputs, labels) into the Zustand store.
 *
 * @param intervalMs - polling interval in ms (default 5000)
 * @param enabled   - whether polling is active (default true)
 */
export function useMatrixSync(
  intervalMs = 5000,
  enabled = true,
): UseMatrixSyncReturn {
  const syncRouterState = useStore((s) => s.syncRouterState);

  // Public state returned to the consumer
  const [syncing, setSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [deviceStatus, setDeviceStatus] = useState<
    Record<string, DeviceSyncStatus>
  >({});

  // Refs to avoid stale closures (same pattern as useDevicePolling)
  const isPollingRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const syncRouterStateRef = useRef(syncRouterState);

  // Keep ref in sync on every render
  syncRouterStateRef.current = syncRouterState;

  const pollDevices = useCallback(async () => {
    if (isPollingRef.current) return; // skip if previous poll still running
    isPollingRef.current = true;
    setSyncing(true);

    try {
      const res = await fetch('/api/matrix/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ devices: DEVICE_MAPPINGS }),
      });

      if (!res.ok) {
        // Mark all devices as error when API itself fails
        const errorStatus: Record<string, DeviceSyncStatus> = {};
        for (const dm of DEVICE_MAPPINGS) {
          errorStatus[dm.routerId] = 'error';
        }
        setDeviceStatus(errorStatus);
        return;
      }

      const data: SyncResponse = await res.json();
      const nextStatus: Record<string, DeviceSyncStatus> = {};

      for (const result of data.results) {
        if (result.reachable && result.inputs && result.outputs) {
          // Push live state into the store
          syncRouterStateRef.current(result.routerId, {
            inputs: result.inputs,
            outputs: result.outputs,
            name: result.name,
            model: result.model,
            size: result.size,
          });
          nextStatus[result.routerId] = 'online';
        } else if (result.error) {
          nextStatus[result.routerId] = 'error';
        } else {
          nextStatus[result.routerId] = 'offline';
        }
      }

      // Also mark any device that wasn't in the response as offline
      for (const dm of DEVICE_MAPPINGS) {
        if (!(dm.routerId in nextStatus)) {
          nextStatus[dm.routerId] = 'offline';
        }
      }

      setDeviceStatus(nextStatus);
      setLastSyncAt(new Date());
    } catch (err) {
      console.warn('[MatrixSync] Failed to reach /api/matrix/sync:', err);
      // Network-level failure — mark everything as error
      const errorStatus: Record<string, DeviceSyncStatus> = {};
      for (const dm of DEVICE_MAPPINGS) {
        errorStatus[dm.routerId] = 'error';
      }
      setDeviceStatus(errorStatus);
    } finally {
      isPollingRef.current = false;
      setSyncing(false);
    }
  }, []); // stable — reads fresh data via refs

  useEffect(() => {
    if (!enabled) return;

    // Initial poll on mount
    pollDevices();

    // Create interval; store ID in ref for reliable cleanup
    intervalRef.current = setInterval(pollDevices, intervalMs);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, intervalMs, pollDevices]);

  return { syncing, lastSyncAt, deviceStatus };
}
