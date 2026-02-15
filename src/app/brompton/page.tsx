'use client';

import React, { useMemo } from 'react';
import { useStore } from '@/store';
import BromptonStatusPanel from '@/components/health/BromptonStatusPanel';
import {
  Layers,
  Monitor,
  Thermometer,
  CheckCircle,
  AlertTriangle,
  Wifi,
} from 'lucide-react';

export default function BromptonPage() {
  const devices = useStore((state) => state.devices);
  const bromptonStatuses = useStore((state) => state.bromptonStatuses);

  // Get Brompton devices with their statuses
  const bromptonProcessors = useMemo(() => {
    return bromptonStatuses
      .map((status) => {
        const device = devices.find((d) => d.id === status.deviceId);
        return device ? { status, device } : null;
      })
      .filter(
        (item): item is { status: (typeof bromptonStatuses)[0]; device: (typeof devices)[0] } =>
          item !== null
      );
  }, [devices, bromptonStatuses]);

  // Summary stats
  const totalPanels = bromptonStatuses.reduce(
    (sum, s) => sum + s.totalPanels,
    0
  );
  const onlinePanels = bromptonStatuses.reduce(
    (sum, s) => sum + s.onlinePanels,
    0
  );
  const allTemps = bromptonStatuses.flatMap((s) => s.panelTemperatures);
  const avgTemp =
    allTemps.length > 0
      ? allTemps.reduce((a, b) => a + b, 0) / allTemps.length
      : 0;
  const maxTemp = allTemps.length > 0 ? Math.max(...allTemps) : 0;

  const processorsOnline = bromptonProcessors.filter(
    (p) => p.device.status === 'online'
  ).length;
  const processorsWarning = bromptonProcessors.filter(
    (p) => p.device.status === 'warning'
  ).length;

  const overallHealthy = onlinePanels === totalPanels && processorsWarning === 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border bg-surface">
        <div className="max-w-[1400px] mx-auto px-6 py-4">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: 'rgba(0, 204, 136, 0.1)' }}
            >
              <Monitor size={20} style={{ color: '#00cc88' }} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">
                Brompton LED Wall Control
              </h1>
              <p className="text-[12px] text-muted">
                LED processor status, panel health, and output configuration
              </p>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Overall Health */}
            <div className="bg-surface-2 rounded-lg px-4 py-2.5 border border-border">
              <div
                className={`flex items-center gap-2 mb-1 ${
                  overallHealthy ? 'text-green-400' : 'text-yellow-400'
                }`}
              >
                {overallHealthy ? (
                  <CheckCircle size={12} />
                ) : (
                  <AlertTriangle size={12} />
                )}
                <span className="text-[10px] uppercase tracking-wider">
                  Health
                </span>
              </div>
              <span
                className={`text-sm font-bold ${
                  overallHealthy ? 'text-green-400' : 'text-yellow-400'
                }`}
              >
                {overallHealthy ? 'Nominal' : 'Attention'}
              </span>
            </div>

            {/* Processors */}
            <div className="bg-surface-2 rounded-lg px-4 py-2.5 border border-border">
              <div className="flex items-center gap-2 text-muted mb-1">
                <Wifi size={12} />
                <span className="text-[10px] uppercase tracking-wider">
                  Processors
                </span>
              </div>
              <span className="text-xl font-bold font-mono text-foreground">
                {bromptonProcessors.length}
              </span>
              <span className="text-[10px] text-green-400 ml-1">
                {processorsOnline} online
              </span>
            </div>

            {/* Total Panels */}
            <div className="bg-surface-2 rounded-lg px-4 py-2.5 border border-border">
              <div className="flex items-center gap-2 text-muted mb-1">
                <Layers size={12} />
                <span className="text-[10px] uppercase tracking-wider">
                  Total Panels
                </span>
              </div>
              <span className="text-xl font-bold font-mono text-foreground">
                {totalPanels}
              </span>
            </div>

            {/* Online Panels */}
            <div className="bg-surface-2 rounded-lg px-4 py-2.5 border border-border">
              <div className="flex items-center gap-2 text-green-400 mb-1">
                <CheckCircle size={12} />
                <span className="text-[10px] uppercase tracking-wider">
                  Online Panels
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold font-mono text-green-400">
                  {onlinePanels}
                </span>
                <span className="text-[10px] text-muted">
                  / {totalPanels}
                </span>
              </div>
            </div>

            {/* Avg Temperature */}
            <div className="bg-surface-2 rounded-lg px-4 py-2.5 border border-border">
              <div className="flex items-center gap-2 text-muted mb-1">
                <Thermometer size={12} />
                <span className="text-[10px] uppercase tracking-wider">
                  Avg Temp
                </span>
              </div>
              <span className="text-xl font-bold font-mono text-foreground">
                {Math.round(avgTemp)}
              </span>
              <span className="text-[10px] text-muted">{'\u00B0C'}</span>
            </div>

            {/* Max Temperature */}
            <div className="bg-surface-2 rounded-lg px-4 py-2.5 border border-border">
              <div className="flex items-center gap-2 text-muted mb-1">
                <Thermometer size={12} />
                <span className="text-[10px] uppercase tracking-wider">
                  Max Temp
                </span>
              </div>
              <span
                className={`text-xl font-bold font-mono ${
                  maxTemp > 50 ? 'text-red-400' : maxTemp > 42 ? 'text-yellow-400' : 'text-foreground'
                }`}
              >
                {Math.round(maxTemp)}
              </span>
              <span className="text-[10px] text-muted">{'\u00B0C'}</span>
            </div>
          </div>

          {/* Panel health bar */}
          {totalPanels > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-muted">Panel Availability</span>
                <span className="font-mono text-foreground">
                  {((onlinePanels / totalPanels) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-2 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(onlinePanels / totalPanels) * 100}%`,
                    backgroundColor:
                      onlinePanels === totalPanels ? '#22c55e' : '#f59e0b',
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Processor Panels */}
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        {bromptonProcessors.length === 0 ? (
          <div className="text-center py-16 text-muted">
            <Monitor size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No Brompton processors found</p>
            <p className="text-[11px] mt-1">
              Add Brompton Tessera processors to see LED wall status
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {bromptonProcessors.map(({ status, device }) => (
              <BromptonStatusPanel
                key={status.deviceId}
                status={status}
                device={device}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
