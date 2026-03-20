// ============================================================
// Telemetry — Shared Type Definitions
// ============================================================

/** A single device's health snapshot at a point in time */
export interface ServerSnapshot {
  deviceId: string;
  deviceName: string;
  ip: string;
  manufacturer: string;
  status: 'online' | 'warning' | 'error' | 'offline';
  temperature: number;
  cpuUsage?: number;
  memoryUsage?: number;
  gpuUsage?: number;
  gpuTemp?: number;
  fanSpeed?: number;
  powerDraw?: number;
  uptime: number;
  /** Multi-sensor temperatures */
  temperatures?: { label: string; value: number; warning?: number; critical?: number }[];
  /** Fan PWM readings */
  fans?: { label: string; pwm: number }[];
  psu1?: string;
  psu2?: string;
  errors: string[];
  warnings: string[];
}

/** A full telemetry snapshot across all monitored devices */
export interface TelemetrySnapshot {
  timestamp: number; // epoch ms
  servers: ServerSnapshot[];
}

/** A single data point for charting */
export interface DataPoint {
  timestamp: number;
  value: number;
}

/** A named time-series for a specific metric on a specific device */
export interface MetricSeries {
  deviceId: string;
  deviceName: string;
  metricKey: string;
  label: string;
  unit: string;
  data: DataPoint[];
  color: string;
}

/** Severity levels for anomalies */
export type AnomalySeverity = 'warning' | 'critical';

/** A detected threshold violation */
export interface AnomalyEvent {
  id: string;
  timestamp: number;
  deviceId: string;
  deviceName: string;
  metricKey: string;
  metricLabel: string;
  value: number;
  threshold: number;
  severity: AnomalySeverity;
  unit: string;
}

/** Time range options */
export type TimeRange = '5m' | '15m' | '1h' | '6h' | '24h';

/** Telemetry polling configuration */
export interface TelemetryConfig {
  pollIntervalMs: number;
  retentionMs: number;
}
