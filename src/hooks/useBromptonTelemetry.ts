'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { BromptonTelemetry } from '@/types';

const POLLING_INTERVAL = 3000;
const BROMPTON_IP = '192.168.100.80';

interface UseBromptonTelemetryResult {
  telemetry: BromptonTelemetry | null;
  isConnected: boolean;
  lastError: string | null;
  /** History of temperature readings for sparkline charts */
  tempHistory: { timestamp: number; ambient: number; cpu: number; gpu: number; fpga: number; psu: number }[];
}

const MAX_HISTORY = 60; // 3 minutes at 3s intervals

export function useBromptonTelemetry(
  ip: string = BROMPTON_IP,
  intervalMs = POLLING_INTERVAL,
  enabled = true
): UseBromptonTelemetryResult {
  const [telemetry, setTelemetry] = useState<BromptonTelemetry | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [tempHistory, setTempHistory] = useState<UseBromptonTelemetryResult['tempHistory']>([]);

  const isPollingRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = useCallback(async () => {
    if (isPollingRef.current) return;
    isPollingRef.current = true;

    try {
      const res = await fetch(`/api/brompton-telemetry?ip=${encodeURIComponent(ip)}`);
      if (!res.ok) {
        setIsConnected(false);
        setLastError(`HTTP ${res.status}`);
        return;
      }

      const data: BromptonTelemetry = await res.json();
      setTelemetry(data);
      setIsConnected(true);
      setLastError(null);

      // Append to temperature history
      setTempHistory((prev) => {
        const next = [
          ...prev,
          {
            timestamp: Date.now(),
            ambient: data.temperatures.ambient,
            cpu: data.temperatures.cpu,
            gpu: data.temperatures.gpu,
            fpga: data.temperatures.fpga,
            psu: data.temperatures.psu,
          },
        ];
        return next.length > MAX_HISTORY ? next.slice(-MAX_HISTORY) : next;
      });
    } catch (err) {
      setIsConnected(false);
      setLastError(String(err));
    } finally {
      isPollingRef.current = false;
    }
  }, [ip]);

  useEffect(() => {
    if (!enabled) return;
    poll();
    intervalRef.current = setInterval(poll, intervalMs);
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, intervalMs, poll]);

  return { telemetry, isConnected, lastError, tempHistory };
}
