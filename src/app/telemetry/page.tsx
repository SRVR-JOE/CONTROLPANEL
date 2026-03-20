'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useStore } from '@/store';
import { useTelemetry } from '@/hooks/useTelemetry';
import { triggerSnapshot } from '@/lib/telemetry-api';
import { METRICS, CHART_COLORS } from '@/lib/metric-definitions';
import type { TimeRange, MetricSeries } from '@/lib/telemetry-types';

import TimeRangeSelector from '@/components/telemetry/TimeRangeSelector';
import TimeSeriesChart from '@/components/telemetry/TimeSeriesChart';
import ServerSparklineCard from '@/components/telemetry/ServerSparklineCard';
import HeatmapGrid from '@/components/telemetry/HeatmapGrid';
import AnomalyTimeline from '@/components/telemetry/AnomalyTimeline';

import {
  BarChart3,
  Grid3x3,
  AlertTriangle,
  Play,
  Pause,
  RefreshCw,
  LayoutGrid,
  TrendingUp,
} from 'lucide-react';

type TabId = 'charts' | 'sparklines' | 'heatmap' | 'anomalies';

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'charts', label: 'Charts', icon: <TrendingUp size={14} /> },
  { id: 'sparklines', label: 'Sparklines', icon: <LayoutGrid size={14} /> },
  { id: 'heatmap', label: 'Heatmap', icon: <Grid3x3 size={14} /> },
  { id: 'anomalies', label: 'Anomalies', icon: <AlertTriangle size={14} /> },
];

export default function TelemetryPage() {
  const devices = useStore((s) => s.devices);

  const [timeRange, setTimeRange] = useState<TimeRange>('15m');
  const [liveMode, setLiveMode] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('charts');
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
  const [compareMode, setCompareMode] = useState(true); // overlay vs split
  const [initialized, setInitialized] = useState(false);

  const { series, anomalies, snapshots, loading, latestSnapshot } = useTelemetry(timeRange, liveMode);

  // Auto-populate from store devices and push to backend
  useEffect(() => {
    if (initialized || devices.length === 0) return;

    const tracked = devices
      .filter((d) => d.ipAddress)
      .map((d) => ({
        id: d.id,
        name: d.name,
        ip: d.ipAddress,
        manufacturer: d.manufacturer,
      }));

    if (tracked.length > 0) {
      fetch('/api/telemetry/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ devices: tracked }),
      }).catch(console.error);

      setSelectedDeviceIds(tracked.map((d) => d.id));
      setInitialized(true);
    }
  }, [devices, initialized]);

  // Toggle device selection
  const toggleDevice = useCallback((deviceId: string) => {
    setSelectedDeviceIds((prev) =>
      prev.includes(deviceId)
        ? prev.filter((id) => id !== deviceId)
        : [...prev, deviceId]
    );
  }, []);

  // Select/deselect all
  const toggleAll = useCallback(() => {
    const allIds = devices.filter((d) => d.ipAddress).map((d) => d.id);
    setSelectedDeviceIds((prev) =>
      prev.length === allIds.length ? [] : allIds
    );
  }, [devices]);

  // Filter series by selected devices
  const filteredSeries = useMemo(
    () => series.filter((s) => selectedDeviceIds.includes(s.deviceId)),
    [series, selectedDeviceIds]
  );

  // Group series by metric category
  const seriesByCategory = useMemo(() => {
    const groups: Record<string, MetricSeries[]> = {};
    for (const s of filteredSeries) {
      const def = METRICS.find((m) => m.key === s.metricKey);
      const cat = def?.category ?? 'other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(s);
    }
    return groups;
  }, [filteredSeries]);

  // Filter anomalies by selected devices
  const filteredAnomalies = useMemo(
    () => anomalies.filter((a) => selectedDeviceIds.includes(a.deviceId)),
    [anomalies, selectedDeviceIds]
  );

  // Device color map
  const deviceColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    devices.filter((d) => d.ipAddress).forEach((d, i) => {
      map[d.id] = CHART_COLORS[i % CHART_COLORS.length];
    });
    return map;
  }, [devices]);

  const handleSnapshot = async () => {
    await triggerSnapshot();
  };

  const categoryLabels: Record<string, string> = {
    temperature: 'Temperatures',
    utilization: 'Utilization',
    fan: 'Fan Speed',
    power: 'Power Draw',
    voltage: 'Voltages',
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border bg-surface">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-accent/10 rounded-lg">
              <BarChart3 size={20} className="text-accent" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Telemetry</h1>
              <p className="text-[12px] text-muted">
                Historical trends, real-time charts, and anomaly detection
              </p>
            </div>
          </div>

          {/* Controls bar */}
          <div className="flex flex-wrap items-center gap-3">
            <TimeRangeSelector value={timeRange} onChange={setTimeRange} />

            {/* Live mode toggle */}
            <button
              onClick={() => setLiveMode(!liveMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-lg border transition-colors ${
                liveMode
                  ? 'bg-green-500/15 text-green-400 border-green-500/30'
                  : 'text-muted hover:text-foreground bg-surface-2 border-border'
              }`}
            >
              {liveMode ? <Pause size={12} /> : <Play size={12} />}
              <span>{liveMode ? 'Live' : 'Paused'}</span>
              {liveMode && (
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              )}
            </button>

            {/* Manual snapshot */}
            <button
              onClick={handleSnapshot}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-muted hover:text-foreground bg-surface-2 rounded-lg border border-border transition-colors"
            >
              <RefreshCw size={12} />
              <span>Snapshot</span>
            </button>

            {/* Snapshot count */}
            <span className="text-[11px] text-muted px-2 py-0.5 bg-surface-2 rounded-full border border-border">
              {snapshots.length} samples
            </span>

            {/* Compare toggle (charts tab only) */}
            {activeTab === 'charts' && (
              <button
                onClick={() => setCompareMode(!compareMode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-lg border transition-colors ml-auto ${
                  compareMode
                    ? 'bg-accent/15 text-accent border-accent/30'
                    : 'text-muted hover:text-foreground bg-surface-2 border-border'
                }`}
              >
                {compareMode ? 'Overlay' : 'Split'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-4 space-y-4">
        {/* Server selector pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={toggleAll}
            className={`px-2.5 py-1 text-[10px] font-medium rounded-full border transition-colors ${
              selectedDeviceIds.length === devices.filter((d) => d.ipAddress).length
                ? 'bg-accent/15 text-accent border-accent/30'
                : 'text-muted hover:text-foreground bg-surface-2 border-border'
            }`}
          >
            ALL
          </button>
          {devices
            .filter((d) => d.ipAddress)
            .map((device, i) => {
              const color = CHART_COLORS[i % CHART_COLORS.length];
              const isSelected = selectedDeviceIds.includes(device.id);
              return (
                <button
                  key={device.id}
                  onClick={() => toggleDevice(device.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-medium rounded-full border transition-all ${
                    isSelected
                      ? 'border-opacity-50'
                      : 'opacity-40 hover:opacity-70 bg-surface-2 border-border'
                  }`}
                  style={
                    isSelected
                      ? {
                          backgroundColor: `${color}20`,
                          borderColor: `${color}50`,
                          color: color,
                        }
                      : undefined
                  }
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  {device.name}
                </button>
              );
            })}
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-1 bg-surface-2 rounded-lg border border-border p-1 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-accent text-white'
                  : 'text-muted hover:text-foreground hover:bg-surface'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.id === 'anomalies' && filteredAnomalies.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-red-500/20 text-red-400">
                  {filteredAnomalies.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw size={20} className="animate-spin text-accent" />
            <span className="ml-2 text-sm text-muted">Loading telemetry data...</span>
          </div>
        )}

        {/* Tab content */}
        {!loading && activeTab === 'charts' && (
          <div className="space-y-6">
            {Object.entries(seriesByCategory).map(([category, catSeries]) => {
              const def = METRICS.find((m) => m.category === category);
              const title = categoryLabels[category] ?? category;
              const unit = catSeries[0]?.unit ?? '';

              if (compareMode) {
                // Overlay all devices on one chart per category
                return (
                  <TimeSeriesChart
                    key={category}
                    series={catSeries}
                    title={title}
                    unit={unit}
                    height={280}
                    thresholds={def ? def.thresholds as [number, number] : undefined}
                    nominal={def?.nominal}
                  />
                );
              }

              // Split: one chart per device per category
              const deviceGroups: Record<string, MetricSeries[]> = {};
              for (const s of catSeries) {
                if (!deviceGroups[s.deviceId]) deviceGroups[s.deviceId] = [];
                deviceGroups[s.deviceId].push(s);
              }

              return (
                <div key={category} className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {Object.entries(deviceGroups).map(([deviceId, dSeries]) => (
                      <TimeSeriesChart
                        key={`${category}-${deviceId}`}
                        series={dSeries}
                        title={dSeries[0]?.deviceName ?? deviceId}
                        unit={unit}
                        height={200}
                        thresholds={def ? def.thresholds as [number, number] : undefined}
                        nominal={def?.nominal}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
            {Object.keys(seriesByCategory).length === 0 && (
              <EmptyState message="No chart data yet. Waiting for telemetry snapshots..." />
            )}
          </div>
        )}

        {!loading && activeTab === 'sparklines' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {devices
              .filter((d) => d.ipAddress && selectedDeviceIds.includes(d.id))
              .map((device, i) => {
                const deviceSeries = filteredSeries.filter(
                  (s) => s.deviceId === device.id
                );
                return (
                  <ServerSparklineCard
                    key={device.id}
                    deviceId={device.id}
                    deviceName={device.name}
                    series={deviceSeries}
                    color={CHART_COLORS[i % CHART_COLORS.length]}
                  />
                );
              })}
            {selectedDeviceIds.length === 0 && (
              <EmptyState message="Select devices above to view sparklines." />
            )}
          </div>
        )}

        {!loading && activeTab === 'heatmap' && (
          <HeatmapGrid
            snapshots={snapshots}
            selectedDeviceIds={selectedDeviceIds}
          />
        )}

        {!loading && activeTab === 'anomalies' && (
          <div className="space-y-6">
            <AnomalyTimeline
              anomalies={filteredAnomalies}
              timeRange={timeRange}
            />
            {filteredAnomalies.length === 0 && (
              <EmptyState message="No anomalies detected in the selected time range." />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12 text-muted col-span-full">
      <BarChart3 size={32} className="mx-auto mb-3 opacity-40" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
