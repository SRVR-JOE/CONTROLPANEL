// ============================================================
// Smart Diagnostics Hook
// Periodically analyzes device health and surfaces alerts
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { useStore } from '@/store';
import type { DiagnosticAlert } from '@/lib/ai/types';
import { v4 as uuidv4 } from 'uuid';

export function useDiagnostics(intervalMs = 15000) {
  const [alerts, setAlerts] = useState<DiagnosticAlert[]>([]);
  const prevAlertsRef = useRef<Set<string>>(new Set());

  const devices = useStore((s) => s.devices);
  const racks = useStore((s) => s.racks);
  const bromptonStatuses = useStore((s) => s.bromptonStatuses);

  const runDiagnostics = useCallback(() => {
    const newAlerts: DiagnosticAlert[] = [];
    const seenKeys = new Set<string>();

    for (const d of devices) {
      // Offline device
      if (d.status === 'offline') {
        const key = `offline-${d.id}`;
        seenKeys.add(key);
        newAlerts.push({
          id: key,
          severity: 'critical',
          title: `${d.name} offline`,
          message: `Device at ${d.ipAddress} is not responding`,
          deviceId: d.id,
          timestamp: new Date().toISOString(),
          dismissed: false,
        });
      }

      // Error state
      if (d.status === 'error') {
        const key = `error-${d.id}`;
        seenKeys.add(key);
        newAlerts.push({
          id: key,
          severity: 'critical',
          title: `${d.name} in error state`,
          message: d.health.errors.join('; ') || 'Device reporting errors',
          deviceId: d.id,
          timestamp: new Date().toISOString(),
          dismissed: false,
        });
      }

      // High temperature
      if (d.health.temperature != null && d.health.temperature > 55) {
        const key = `hightemp-${d.id}`;
        seenKeys.add(key);
        newAlerts.push({
          id: key,
          severity: d.health.temperature > 70 ? 'critical' : 'warning',
          title: `${d.name} overheating`,
          message: `Temperature: ${d.health.temperature.toFixed(1)}°C`,
          deviceId: d.id,
          timestamp: new Date().toISOString(),
          dismissed: false,
        });
      }

      // High CPU
      if (d.health.cpuUsage != null && d.health.cpuUsage > 90) {
        const key = `highcpu-${d.id}`;
        seenKeys.add(key);
        newAlerts.push({
          id: key,
          severity: 'warning',
          title: `${d.name} CPU saturated`,
          message: `CPU: ${d.health.cpuUsage.toFixed(0)}%`,
          deviceId: d.id,
          timestamp: new Date().toISOString(),
          dismissed: false,
        });
      }

      // High GPU
      if (d.health.gpuUsage != null && d.health.gpuUsage > 95) {
        const key = `highgpu-${d.id}`;
        seenKeys.add(key);
        newAlerts.push({
          id: key,
          severity: 'warning',
          title: `${d.name} GPU saturated`,
          message: `GPU: ${d.health.gpuUsage.toFixed(0)}%`,
          deviceId: d.id,
          timestamp: new Date().toISOString(),
          dismissed: false,
        });
      }

      // Device warnings
      for (const w of d.health.warnings) {
        const key = `warn-${d.id}-${w.slice(0, 30)}`;
        seenKeys.add(key);
        newAlerts.push({
          id: key,
          severity: 'warning',
          title: `${d.name} warning`,
          message: w,
          deviceId: d.id,
          timestamp: new Date().toISOString(),
          dismissed: false,
        });
      }
    }

    // Rack thermal checks
    for (const r of racks) {
      if (r.exhaustTemp != null && r.exhaustTemp > 40) {
        const key = `racktemp-${r.id}`;
        seenKeys.add(key);
        newAlerts.push({
          id: key,
          severity: r.exhaustTemp > 50 ? 'critical' : 'warning',
          title: `${r.name} running hot`,
          message: `Exhaust: ${r.exhaustTemp}°C`,
          timestamp: new Date().toISOString(),
          dismissed: false,
        });
      }
    }

    // Brompton link checks
    for (const b of bromptonStatuses) {
      if (b.linkStatus === 'degraded' || b.linkStatus === 'lost') {
        const dev = devices.find((d) => d.id === b.deviceId);
        const key = `bromlink-${b.deviceId}`;
        seenKeys.add(key);
        newAlerts.push({
          id: key,
          severity: b.linkStatus === 'lost' ? 'critical' : 'warning',
          title: `${dev?.name ?? 'Brompton'} link ${b.linkStatus}`,
          message: `${b.onlinePanels}/${b.totalPanels} panels online`,
          deviceId: b.deviceId,
          timestamp: new Date().toISOString(),
          dismissed: false,
        });
      }
    }

    // Merge with existing alerts, preserving dismissed state
    setAlerts((prev) => {
      const dismissedIds = new Set(prev.filter((a) => a.dismissed).map((a) => a.id));
      return newAlerts.map((a) => ({
        ...a,
        dismissed: dismissedIds.has(a.id),
      }));
    });

    prevAlertsRef.current = seenKeys;
  }, [devices, racks, bromptonStatuses]);

  // Run on mount and on interval
  useEffect(() => {
    runDiagnostics();
    const timer = setInterval(runDiagnostics, intervalMs);
    return () => clearInterval(timer);
  }, [runDiagnostics, intervalMs]);

  const dismissAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, dismissed: true } : a));
  }, []);

  return { alerts, dismissAlert, runDiagnostics };
}
