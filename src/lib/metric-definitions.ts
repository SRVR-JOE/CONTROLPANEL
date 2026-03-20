// ============================================================
// Telemetry — Metric Definitions
// ============================================================

export type MetricCategory = 'temperature' | 'voltage' | 'fan' | 'utilization' | 'power';

export interface MetricDefinition {
  key: string;
  label: string;
  category: MetricCategory;
  unit: string;
  /** Extract value from a server snapshot */
  extract: (s: { temperature: number; cpuUsage?: number; memoryUsage?: number; gpuUsage?: number; gpuTemp?: number; fanSpeed?: number; powerDraw?: number }) => number | undefined;
  /** Thresholds: [green→amber, amber→red] */
  thresholds: [number, number];
  /** Direction: 'above' means exceeding threshold is bad, 'below' means dropping below is bad */
  direction: 'above' | 'below';
  /** Nominal / reference value (if applicable) */
  nominal?: number;
}

export const METRICS: MetricDefinition[] = [
  {
    key: 'temperature',
    label: 'CPU Temperature',
    category: 'temperature',
    unit: '\u00B0C',
    extract: (s) => s.temperature,
    thresholds: [60, 75],
    direction: 'above',
  },
  {
    key: 'gpuTemp',
    label: 'GPU Temperature',
    category: 'temperature',
    unit: '\u00B0C',
    extract: (s) => s.gpuTemp,
    thresholds: [65, 80],
    direction: 'above',
  },
  {
    key: 'cpuUsage',
    label: 'CPU Usage',
    category: 'utilization',
    unit: '%',
    extract: (s) => s.cpuUsage,
    thresholds: [60, 80],
    direction: 'above',
  },
  {
    key: 'memoryUsage',
    label: 'Memory Usage',
    category: 'utilization',
    unit: '%',
    extract: (s) => s.memoryUsage,
    thresholds: [70, 90],
    direction: 'above',
  },
  {
    key: 'gpuUsage',
    label: 'GPU Usage',
    category: 'utilization',
    unit: '%',
    extract: (s) => s.gpuUsage,
    thresholds: [70, 90],
    direction: 'above',
  },
  {
    key: 'fanSpeed',
    label: 'Fan Speed',
    category: 'fan',
    unit: 'RPM',
    extract: (s) => s.fanSpeed,
    thresholds: [1000, 500],
    direction: 'below',
  },
  {
    key: 'powerDraw',
    label: 'Power Draw',
    category: 'power',
    unit: 'W',
    extract: (s) => s.powerDraw,
    thresholds: [300, 500],
    direction: 'above',
  },
];

/** Chart colors — one per device, cycles */
export const CHART_COLORS = [
  '#7C3AED', // violet
  '#06B6D4', // cyan
  '#22c55e', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#EC4899', // pink
  '#8B5CF6', // purple
  '#14B8A6', // teal
];

/** Theme constants for charts */
export const CHART_THEME = {
  grid: '#2A2A3C',
  axis: '#64748B',
  tooltipBg: '#1E1E2E',
  tooltipBorder: '#2A2A3C',
  fontFamily: 'JetBrains Mono, ui-monospace, monospace',
};

/** Get status color for a metric value */
export function getMetricColor(def: MetricDefinition, value: number): string {
  const [t1, t2] = def.thresholds;
  if (def.direction === 'above') {
    if (value >= t2) return '#EF4444'; // red
    if (value >= t1) return '#F59E0B'; // amber
    return '#22c55e'; // green
  }
  // 'below' — thresholds are in descending order: [green_floor, red_floor]
  if (value <= t2) return '#EF4444';
  if (value <= t1) return '#F59E0B';
  return '#22c55e';
}
