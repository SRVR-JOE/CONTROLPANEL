'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '@/store';
import { DeviceHealth, DeviceStatus } from '@/types';

interface HealthQueryDevice {
  id: string;
  ip: string;
  manufacturer: string;
  port?: number;
  name?: string;
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
  // Guards against concurrent in-flight requests
  const isPollingRef = useRef(false);
  // Interval ID stored in a ref so cleanup is always accurate
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep the latest store values accessible inside the stable interval callback
  // without adding them to the effect dependency array (which would re-create
  // the interval on every store update).
  const devicesRef = useRef(devices);
  const updateDeviceHealthRef = useRef(updateDeviceHealth);
  const updateDeviceStatusRef = useRef(updateDeviceStatus);

  // Sync refs to latest values on every render — no effect needed
  devicesRef.current = devices;
  updateDeviceHealthRef.current = updateDeviceHealth;
  updateDeviceStatusRef.current = updateDeviceStatus;

  // Stable poll function — reads fresh data via refs, never changes identity
  const pollDevices = useCallback(async () => {
    if (isPollingRef.current) return; // skip if previous poll still running
    isPollingRef.current = true;

    try {
      const now = Date.now();
      const currentDevices = devicesRef.current;

      // Build list of devices to query (skip recently-failed offline devices)
      const toQuery: HealthQueryDevice[] = currentDevices
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
          name: d.name,
        }));

      if (toQuery.length === 0) {
        isPollingRef.current = false;
        return;
      }

      const res = await fetch('/api/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ devices: toQuery }),
      });

      if (!res.ok) {
        isPollingRef.current = false;
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
          updateDeviceHealthRef.current(deviceId, result.health, status);
          delete offlineTimestamps.current[deviceId];
        } else {
          // Device unreachable
          updateDeviceStatusRef.current(deviceId, 'offline');
          offlineTimestamps.current[deviceId] = now;
        }
      }
    } catch (err) {
      console.warn('[DevicePolling] Failed to reach /api/health:', err);
    } finally {
      isPollingRef.current = false;
    }
  }, []); // stable — reads fresh data via refs on every invocation

  useEffect(() => {
    if (!enabled) return;

    // Initial poll on mount
    pollDevices();

    // Create interval once; store ID in ref for reliable cleanup
    intervalRef.current = setInterval(pollDevices, intervalMs);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, intervalMs, pollDevices]); // pollDevices is now stable, so effect only re-runs when enabled/intervalMs change
}
