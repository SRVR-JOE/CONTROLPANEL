'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '@/store';
import { DeviceHealth, DeviceStatus } from '@/types';

interface HealthQueryDevice {
  id: string;
  ip: string;
  manufacturer: string;
  port?: number;
}

interface DeviceQueryResult {
  reachable: boolean;
  health: DeviceHealth | null;
  firmware?: string;
  errors?: string[];
}

interface HealthResponse {
  results: Record<string, DeviceQueryResult>;
}

const DEFAULT_INTERVAL = 5000; // 5 seconds
const OFFLINE_BACKOFF = 15000; // 15 seconds for offline devices

/**
 * Hook that polls all devices for real health data via /api/health.
 * Runs in the background and pushes results into the Zustand store.
 *
 * @param intervalMs - polling interval in ms (default 5000)
 * @param enabled - whether polling is active (default true)
 */
export function useDevicePolling(intervalMs = DEFAULT_INTERVAL, enabled = true) {
  const devices = useStore((s) => s.devices);
  const updateDeviceHealth = useStore((s) => s.updateDeviceHealth);
  const updateDeviceStatus = useStore((s) => s.updateDeviceStatus);
  const offlineTimestamps = useRef<Record<string, number>>({});
  const pollingRef = useRef(false);

  const pollDevices = useCallback(async () => {
    if (pollingRef.current) return; // skip if previous poll still running
    pollingRef.current = true;

    try {
      const now = Date.now();

      // Build list of devices to query (skip recently-failed offline devices)
      const toQuery: HealthQueryDevice[] = devices
        .filter((d) => {
          if (!d.ipAddress) return false;
          const lastOffline = offlineTimestamps.current[d.id];
          if (lastOffline && now - lastOffline < OFFLINE_BACKOFF) return false;
          return true;
        })
        .map((d) => ({
          id: d.id,
          ip: d.ipAddress,
          manufacturer: d.manufacturer,
        }));

      if (toQuery.length === 0) {
        pollingRef.current = false;
        return;
      }

      const res = await fetch('/api/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ devices: toQuery }),
      });

      if (!res.ok) {
        pollingRef.current = false;
        return;
      }

      const data: HealthResponse = await res.json();

      // Push results into the store
      for (const [deviceId, result] of Object.entries(data.results)) {
        if (result.reachable && result.health) {
          // Device is reachable — determine status from health data
          let status: DeviceStatus = 'online';
          if (result.health.errors.length > 0) {
            status = 'error';
          } else if (result.health.warnings.length > 0) {
            status = 'warning';
          }
          updateDeviceHealth(deviceId, result.health, status);
          delete offlineTimestamps.current[deviceId];
        } else {
          // Device unreachable
          updateDeviceStatus(deviceId, 'offline');
          offlineTimestamps.current[deviceId] = now;
        }
      }
    } catch (err) {
      console.warn('[DevicePolling] Failed to reach /api/health:', err);
    } finally {
      pollingRef.current = false;
    }
  }, [devices, updateDeviceHealth, updateDeviceStatus]);

  useEffect(() => {
    if (!enabled) return;

    // Initial poll
    pollDevices();

    // Set up interval
    const id = setInterval(pollDevices, intervalMs);
    return () => clearInterval(id);
  }, [enabled, intervalMs, pollDevices]);
}
