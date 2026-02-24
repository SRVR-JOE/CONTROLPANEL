import { v4 as uuidv4 } from 'uuid';
import type { DeviceStatus, DeviceHealth, EventSettings, SystemEvent } from '@/types';

// ============================================================
// Previous state cache — singleton, persists across polls
// ============================================================

interface DeviceSnapshot {
  status: DeviceStatus;
  health: DeviceHealth | null;
  errorSet: Set<string>;
  warningSet: Set<string>;
}

const previousStates = new Map<string, DeviceSnapshot>();

// Flapping prevention: tracks last notification time per device+eventType
const lastNotificationTime = new Map<string, number>();

export function shouldNotify(deviceId: string, eventType: string, cooldownMs: number): boolean {
  const key = `${deviceId}:${eventType}`;
  const last = lastNotificationTime.get(key);
  const now = Date.now();
  if (last && now - last < cooldownMs) return false;
  lastNotificationTime.set(key, now);
  return true;
}

// ============================================================
// Event detection
// ============================================================

export function detectEvents(
  deviceId: string,
  deviceName: string,
  currentStatus: DeviceStatus,
  currentHealth: DeviceHealth | null,
  settings: EventSettings
): SystemEvent[] {
  const events: SystemEvent[] = [];
  const prev = previousStates.get(deviceId);
  const now = new Date().toISOString();

  // --- Status change detection ---
  if (prev && prev.status !== currentStatus) {
    const severity = currentStatus === 'offline' ? 'critical' as const
      : currentStatus === 'error' ? 'error' as const
      : currentStatus === 'warning' ? 'warning' as const
      : 'info' as const;

    events.push({
      id: uuidv4(),
      deviceId,
      deviceName,
      eventType: 'status_change',
      severity,
      title: `${deviceName} is now ${currentStatus}`,
      message: `Device status changed from ${prev.status} to ${currentStatus}`,
      metadata: { previousStatus: prev.status, currentStatus },
      acknowledged: false,
      createdAt: now,
    });
  }

  // --- Temperature alerts ---
  if (currentHealth && prev?.health) {
    const prevTemp = prev.health.temperature;
    const curTemp = currentHealth.temperature;

    // CPU/board temperature
    if (curTemp >= settings.temperatureThresholds.critical && prevTemp < settings.temperatureThresholds.critical) {
      events.push({
        id: uuidv4(), deviceId, deviceName,
        eventType: 'temperature_alert', severity: 'critical',
        title: `${deviceName} critical temperature: ${curTemp.toFixed(1)}°C`,
        message: `Temperature crossed critical threshold (${settings.temperatureThresholds.critical}°C)`,
        metadata: { temperature: curTemp, threshold: settings.temperatureThresholds.critical, type: 'cpu' },
        acknowledged: false, createdAt: now,
      });
    } else if (curTemp >= settings.temperatureThresholds.warning && prevTemp < settings.temperatureThresholds.warning) {
      events.push({
        id: uuidv4(), deviceId, deviceName,
        eventType: 'temperature_alert', severity: 'warning',
        title: `${deviceName} high temperature: ${curTemp.toFixed(1)}°C`,
        message: `Temperature crossed warning threshold (${settings.temperatureThresholds.warning}°C)`,
        metadata: { temperature: curTemp, threshold: settings.temperatureThresholds.warning, type: 'cpu' },
        acknowledged: false, createdAt: now,
      });
    }

    // GPU temperature
    if (currentHealth.gpuTemp !== undefined && prev.health.gpuTemp !== undefined) {
      const prevGpu = prev.health.gpuTemp;
      const curGpu = currentHealth.gpuTemp;
      if (curGpu >= settings.gpuTemperatureThresholds.critical && prevGpu < settings.gpuTemperatureThresholds.critical) {
        events.push({
          id: uuidv4(), deviceId, deviceName,
          eventType: 'temperature_alert', severity: 'critical',
          title: `${deviceName} GPU critical temperature: ${curGpu.toFixed(1)}°C`,
          message: `GPU temperature crossed critical threshold (${settings.gpuTemperatureThresholds.critical}°C)`,
          metadata: { temperature: curGpu, threshold: settings.gpuTemperatureThresholds.critical, type: 'gpu' },
          acknowledged: false, createdAt: now,
        });
      } else if (curGpu >= settings.gpuTemperatureThresholds.warning && prevGpu < settings.gpuTemperatureThresholds.warning) {
        events.push({
          id: uuidv4(), deviceId, deviceName,
          eventType: 'temperature_alert', severity: 'warning',
          title: `${deviceName} GPU high temperature: ${curGpu.toFixed(1)}°C`,
          message: `GPU temperature crossed warning threshold (${settings.gpuTemperatureThresholds.warning}°C)`,
          metadata: { temperature: curGpu, threshold: settings.gpuTemperatureThresholds.warning, type: 'gpu' },
          acknowledged: false, createdAt: now,
        });
      }
    }
  }

  // --- Signal loss detection ---
  if (currentHealth && prev) {
    const prevErrors = prev.errorSet;
    const signalPattern = /signal|no signal|no routed source|no input|link lost/i;

    // FIX 8: defensive guard — errors may be undefined/null
    for (const err of currentHealth.errors ?? []) {
      if (signalPattern.test(err) && !prevErrors.has(err)) {
        events.push({
          id: uuidv4(), deviceId, deviceName,
          eventType: 'signal_loss', severity: 'error',
          title: `${deviceName} signal loss detected`,
          message: err,
          metadata: { error: err },
          acknowledged: false, createdAt: now,
        });
      }
    }
  }

  // --- Power events ---
  if (currentHealth && prev) {
    const prevErrors = prev.errorSet;
    const prevWarnings = prev.warningSet;
    const powerPattern = /battery|power|overload|ups|surge|output load|current|inlet/i;

    // FIX 8: defensive guard — errors may be undefined/null
    for (const err of currentHealth.errors ?? []) {
      if (powerPattern.test(err) && !prevErrors.has(err)) {
        events.push({
          id: uuidv4(), deviceId, deviceName,
          eventType: 'power_event', severity: 'error',
          title: `${deviceName} power event`,
          message: err,
          metadata: { error: err },
          acknowledged: false, createdAt: now,
        });
      }
    }
    // FIX 8: defensive guard — warnings may be undefined/null
    for (const warn of currentHealth.warnings ?? []) {
      if (powerPattern.test(warn) && !prevWarnings.has(warn)) {
        events.push({
          id: uuidv4(), deviceId, deviceName,
          eventType: 'power_event', severity: 'warning',
          title: `${deviceName} power warning`,
          message: warn,
          metadata: { warning: warn },
          acknowledged: false, createdAt: now,
        });
      }
    }
  }

  // Update cache
  const prevSnapshot = previousStates.get(deviceId);
  previousStates.set(deviceId, {
    status: currentStatus,
    health: currentHealth,
    errorSet: currentHealth ? new Set(currentHealth.errors) : (prevSnapshot?.errorSet ?? new Set()),
    warningSet: currentHealth ? new Set(currentHealth.warnings) : (prevSnapshot?.warningSet ?? new Set()),
  });

  return events;
}

/** Clear state for a device (e.g. when removed) */
export function clearDeviceState(deviceId: string): void {
  previousStates.delete(deviceId);
  // Clean up lastNotificationTime entries to prevent memory leak
  Array.from(lastNotificationTime.keys()).forEach((key) => {
    if (key.startsWith(`${deviceId}:`)) lastNotificationTime.delete(key);
  });
}
