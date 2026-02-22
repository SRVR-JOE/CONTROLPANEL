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

  const pollingRef = useRef(false);

  const pollTiles = useCallback(async () => {
    if (pollingRef.current) return; // guard against concurrent requests
    pollingRef.current = true;

    try {
      // Build the list of Brompton processors to query
      const bromptonDevices: TileQueryDevice[] = bromptonStatuses
        .map((status) => {
          const device = devices.find((d) => d.id === status.deviceId);
          return device ? { id: device.id, ip: device.ipAddress } : null;
        })
        .filter((d): d is TileQueryDevice => d !== null);

      if (bromptonDevices.length === 0) {
        pollingRef.current = false;
        return;
      }

      const res = await fetch('/api/brompton-tiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ devices: bromptonDevices }),
      });

      if (!res.ok) {
        // Non-200 from API — stay with existing store data
        pollingRef.current = false;
        return;
      }

      const data: TileQueryResponse = await res.json();

      // Push updated tile data into the store for each processor
      for (const [deviceId, result] of Object.entries(data.results)) {
        if (result.tiles && Array.isArray(result.tiles)) {
          updateBromptonTiles(deviceId, result.tiles);
        }
      }
    } catch (err) {
      // Network failure or fetch error — silently continue with store data
      console.warn('[BromptonTilePolling] Failed to reach /api/brompton-tiles:', err);
    } finally {
      pollingRef.current = false;
    }
  }, [devices, bromptonStatuses, updateBromptonTiles]);

  useEffect(() => {
    if (!enabled) return;

    // Initial poll on mount
    pollTiles();

    // Set up polling interval
    const id = setInterval(pollTiles, intervalMs);
    return () => clearInterval(id);
  }, [enabled, intervalMs, pollTiles]);
}
