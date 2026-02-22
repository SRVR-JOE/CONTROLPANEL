'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '@/store';
import type { LEDTileInfo } from '@/types';

interface TileQueryDevice {
  id: string;
  ip: string;
}

interface TileQueryResponse {
  results: Record<string, { tiles: LEDTileInfo[] }>;
}

const POLLING_INTERVAL = 3000; // 3 seconds

/**
 * Hook that polls Brompton processors for real-time tile status via
 * POST /api/brompton-tiles. Falls back gracefully to mock store data
 * if the API is unreachable or returns an error.
 *
 * @param intervalMs - polling interval in ms (default 3000)
 * @param enabled - whether polling is active (default true)
 */
export function useBromptonTilePolling(
  intervalMs = POLLING_INTERVAL,
  enabled = true
) {
  const devices = useStore((s) => s.devices);
  const bromptonStatuses = useStore((s) => s.bromptonStatuses);
  const updateBromptonTiles = useStore((s) => s.updateBromptonTiles);

  // Guards against concurrent in-flight requests
  const isPollingRef = useRef(false);
  // Interval ID stored in a ref so cleanup is always accurate
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep the latest store values accessible inside the stable interval callback
  // without adding them to the effect dependency array (which would re-create
  // the interval on every store update).
  const devicesRef = useRef(devices);
  const bromptonStatusesRef = useRef(bromptonStatuses);
  const updateBromptonTilesRef = useRef(updateBromptonTiles);

  // Sync refs to latest values on every render — no effect needed
  devicesRef.current = devices;
  bromptonStatusesRef.current = bromptonStatuses;
  updateBromptonTilesRef.current = updateBromptonTiles;

  // Stable poll function — reads fresh data via refs, never changes identity
  const pollTiles = useCallback(async () => {
    if (isPollingRef.current) return; // guard against concurrent requests
    isPollingRef.current = true;

    try {
      const currentDevices = devicesRef.current;
      const currentStatuses = bromptonStatusesRef.current;

      // Build the list of Brompton processors to query
      const bromptonDevices: TileQueryDevice[] = currentStatuses
        .map((status) => {
          const device = currentDevices.find((d) => d.id === status.deviceId);
          return device ? { id: device.id, ip: device.ipAddress } : null;
        })
        .filter((d): d is TileQueryDevice => d !== null);

      if (bromptonDevices.length === 0) {
        isPollingRef.current = false;
        return;
      }

      const res = await fetch('/api/brompton-tiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ devices: bromptonDevices }),
      });

      if (!res.ok) {
        // Non-200 from API — stay with existing store data
        isPollingRef.current = false;
        return;
      }

      const data: TileQueryResponse = await res.json();

      // Push updated tile data into the store for each processor
      for (const [deviceId, result] of Object.entries(data.results)) {
        if (result.tiles && Array.isArray(result.tiles)) {
          updateBromptonTilesRef.current(deviceId, result.tiles);
        }
      }
    } catch (err) {
      // Network failure or fetch error — silently continue with store data
      console.warn('[BromptonTilePolling] Failed to reach /api/brompton-tiles:', err);
    } finally {
      isPollingRef.current = false;
    }
  }, []); // stable — reads fresh data via refs on every invocation

  useEffect(() => {
    if (!enabled) return;

    // Initial poll on mount
    pollTiles();

    // Create interval once; store ID in ref for reliable cleanup
    intervalRef.current = setInterval(pollTiles, intervalMs);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, intervalMs, pollTiles]); // pollTiles is now stable, so effect only re-runs when enabled/intervalMs change
}
