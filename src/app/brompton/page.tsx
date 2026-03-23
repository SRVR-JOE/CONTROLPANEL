'use client';

import React, { useMemo } from 'react';
import { useStore } from '@/store';
import ProcessorSelector from '@/components/brompton/ProcessorSelector';
import TileViewModeToggle from '@/components/brompton/TileViewModeToggle';
import TileStatusSummary from '@/components/brompton/TileStatusSummary';
import TileErrorLegend from '@/components/brompton/TileErrorLegend';
import LEDTileGrid from '@/components/brompton/LEDTileGrid';
import TileDetailPanel from '@/components/brompton/TileDetailPanel';
import { useBromptonTilePolling } from '@/hooks/useBromptonTilePolling';
import { useBromptonTelemetry } from '@/hooks/useBromptonTelemetry';
import {
  SystemIdentityPanel,
  ThermalOverviewPanel,
  FanStatusPanel,
  InputSignalPanel,
  OutputColorPanel,
  ProcessingPanel,
  NetworkGenlockPanel,
  OverrideStatusPanel,
  PanelStatisticsPanel,
} from '@/components/brompton/TelemetryDashboard';
import {
  Layers,
  Monitor,
  Thermometer,
  CheckCircle,
  AlertTriangle,
  Wifi,
  WifiOff,
  Radio,
  Clock,
  Activity,
} from 'lucide-react';

export default function BromptonPage() {
  const devices = useStore((state) => state.devices);
  const bromptonStatuses = useStore((state) => state.bromptonStatuses);
  const tileViewMode = useStore((s) => s.tileViewMode);
  const selectedTileId = useStore((s) => s.selectedTileId);

  // Enable tile polling for panel visualization
  useBromptonTilePolling();

  // Live telemetry from the real SX40 at 192.168.100.80
  const { telemetry, isConnected, lastError, tempHistory } = useBromptonTelemetry();

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

  // Summary stats from tile data
  const totalPanels = bromptonStatuses.reduce((sum, s) => sum + s.totalPanels, 0);
  const onlinePanels = bromptonStatuses.reduce((sum, s) => sum + s.onlinePanels, 0);
  const allTemps = bromptonStatuses.flatMap((s) => s.panelTemperatures);
  const avgTemp = allTemps.length > 0 ? allTemps.reduce((a, b) => a + b, 0) / allTemps.length : 0;
  const _maxTemp = allTemps.length > 0 ? Math.max(...allTemps) : 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ===== Hero Header ===== */}
      <div className="border-b border-border bg-surface">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl" style={{ backgroundColor: 'rgba(0, 204, 136, 0.1)' }}>
                <Monitor size={22} style={{ color: '#00cc88' }} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">
                  Brompton Tessera SX40
                  {telemetry && (
                    <span className="text-[#00cc88] ml-2 font-mono text-sm">
                      {telemetry.processorName}
                    </span>
                  )}
                </h1>
                <p className="text-[12px] text-muted">
                  LED processor telemetry, panel health, and output configuration
                </p>
              </div>
            </div>

            {/* Connection status */}
            <div className="flex items-center gap-3">
              {telemetry && (
                <div className="flex items-center gap-2 text-[11px] text-[#6b7280]">
                  <Clock size={12} />
                  <span className="font-mono">{telemetry.uptime}</span>
                </div>
              )}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold ${
                isConnected
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
                {isConnected ? 'Live' : 'Disconnected'}
                {isConnected && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Summary Stats Row */}
          <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-9 gap-2">
            {/* Live from telemetry */}
            {telemetry && (
              <>
                <div className="bg-surface-2 rounded-lg px-3 py-2 border border-border">
                  <div className="flex items-center gap-1.5 text-[#00cc88] mb-0.5">
                    <Activity size={10} />
                    <span className="text-[9px] uppercase tracking-wider">Status</span>
                  </div>
                  <span className="text-sm font-bold text-[#00cc88]">Online</span>
                </div>

                <div className="bg-surface-2 rounded-lg px-3 py-2 border border-border">
                  <div className="flex items-center gap-1.5 text-muted mb-0.5">
                    <Monitor size={10} />
                    <span className="text-[9px] uppercase tracking-wider">Input</span>
                  </div>
                  <span className="text-sm font-bold font-mono text-[#a855f7]">
                    {telemetry.input.activeSource.portType.toUpperCase()}
                  </span>
                </div>

                <div className="bg-surface-2 rounded-lg px-3 py-2 border border-border">
                  <div className="flex items-center gap-1.5 text-muted mb-0.5">
                    <Radio size={10} />
                    <span className="text-[9px] uppercase tracking-wider">Resolution</span>
                  </div>
                  <span className="text-[12px] font-bold font-mono text-foreground">
                    {telemetry.input.metadata.resolution.width}x{telemetry.input.metadata.resolution.height}
                  </span>
                </div>

                <div className="bg-surface-2 rounded-lg px-3 py-2 border border-border">
                  <div className="flex items-center gap-1.5 text-muted mb-0.5">
                    <Activity size={10} />
                    <span className="text-[9px] uppercase tracking-wider">Frame Rate</span>
                  </div>
                  <span className="text-sm font-bold font-mono text-foreground">{telemetry.input.metadata.refreshRate} Hz</span>
                </div>

                <div className="bg-surface-2 rounded-lg px-3 py-2 border border-border">
                  <div className="flex items-center gap-1.5 text-[#f59e0b] mb-0.5">
                    <Thermometer size={10} />
                    <span className="text-[9px] uppercase tracking-wider">CPU</span>
                  </div>
                  <span className={`text-sm font-bold font-mono ${telemetry.temperatures.cpu > 70 ? 'text-red-400' : 'text-foreground'}`}>
                    {telemetry.temperatures.cpu.toFixed(1)}°C
                  </span>
                </div>

                <div className="bg-surface-2 rounded-lg px-3 py-2 border border-border">
                  <div className="flex items-center gap-1.5 text-[#f59e0b] mb-0.5">
                    <Thermometer size={10} />
                    <span className="text-[9px] uppercase tracking-wider">FPGA</span>
                  </div>
                  <span className={`text-sm font-bold font-mono ${telemetry.temperatures.fpga > 70 ? 'text-red-400' : 'text-foreground'}`}>
                    {telemetry.temperatures.fpga.toFixed(1)}°C
                  </span>
                </div>
              </>
            )}

            {/* Panel stats from tile polling */}
            <div className="bg-surface-2 rounded-lg px-3 py-2 border border-border">
              <div className="flex items-center gap-1.5 text-muted mb-0.5">
                <Layers size={10} />
                <span className="text-[9px] uppercase tracking-wider">Panels</span>
              </div>
              <span className="text-sm font-bold font-mono text-foreground">{totalPanels}</span>
            </div>

            <div className="bg-surface-2 rounded-lg px-3 py-2 border border-border">
              <div className="flex items-center gap-1.5 text-green-400 mb-0.5">
                <CheckCircle size={10} />
                <span className="text-[9px] uppercase tracking-wider">Online</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-bold font-mono text-green-400">{onlinePanels}</span>
                <span className="text-[9px] text-muted">/ {totalPanels}</span>
              </div>
            </div>

            <div className="bg-surface-2 rounded-lg px-3 py-2 border border-border">
              <div className="flex items-center gap-1.5 text-muted mb-0.5">
                <Thermometer size={10} />
                <span className="text-[9px] uppercase tracking-wider">Avg Temp</span>
              </div>
              <span className="text-sm font-bold font-mono text-foreground">{Math.round(avgTemp)}°C</span>
            </div>
          </div>

          {/* Availability bar */}
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
                    backgroundColor: onlinePanels === totalPanels ? '#22c55e' : '#f59e0b',
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== Main Dashboard ===== */}
      <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">

        {/* ===== Override Alert Banner ===== */}
        {telemetry && (telemetry.override.blackout.enabled || telemetry.override.freeze.enabled || telemetry.override.testPattern.enabled) && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-5 py-3 flex items-center gap-3">
            <AlertTriangle size={20} className="text-red-400 shrink-0" />
            <div>
              <span className="text-sm font-bold text-red-400">Override Active</span>
              <span className="text-[12px] text-red-300 ml-2">
                {[
                  telemetry.override.blackout.enabled && 'BLACKOUT',
                  telemetry.override.freeze.enabled && 'FREEZE',
                  telemetry.override.testPattern.enabled && `TEST PATTERN (${telemetry.override.testPattern.type})`,
                ].filter(Boolean).join(' + ')}
              </span>
            </div>
          </div>
        )}

        {/* ===== Live Telemetry Grid ===== */}
        {telemetry && (
          <>
            {/* Row 1: Identity + Thermal + Fans */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <SystemIdentityPanel t={telemetry} />
              <ThermalOverviewPanel t={telemetry} tempHistory={tempHistory} />
              <FanStatusPanel t={telemetry} />
            </div>

            {/* Row 2: Input Signal + Output Colour */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <InputSignalPanel t={telemetry} />
              <OutputColorPanel t={telemetry} />
            </div>

            {/* Row 3: Processing + Network + Override */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <ProcessingPanel t={telemetry} />
              <NetworkGenlockPanel t={telemetry} />
              <div className="space-y-4">
                <OverrideStatusPanel t={telemetry} />
                <PanelStatisticsPanel t={telemetry} />
              </div>
            </div>
          </>
        )}

        {/* ===== Connection Error ===== */}
        {!isConnected && !telemetry && (
          <div className="rounded-xl border border-[#2a2a3d] bg-[#14141f] p-8 text-center">
            <WifiOff size={40} className="mx-auto mb-3 text-[#374151]" />
            <p className="text-sm text-muted">Connecting to Brompton SX40 at 192.168.100.80...</p>
            {lastError && <p className="text-[11px] text-red-400 mt-1">{lastError}</p>}
          </div>
        )}

        {/* ===== LED Tile Visualization Section ===== */}
        {bromptonProcessors.length > 0 && (
          <div className="rounded-xl border border-[#2a2a3d] bg-[#14141f] overflow-hidden">
            <div className="px-5 py-3 border-b border-[#2a2a3d]">
              <div className="flex items-center gap-2">
                <Layers size={14} className="text-[#6b7280]" />
                <span className="text-sm font-semibold text-[#e0e0e8]">Panel Tile Map</span>
                <span className="text-[10px] text-[#6b7280] ml-1">Real-time per-panel status</span>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <ProcessorSelector />

              <div className="flex items-center justify-between gap-4 flex-wrap">
                <TileViewModeToggle />
                <TileStatusSummary />
              </div>

              {tileViewMode === 'errors' && (
                <div className="rounded-lg bg-[#0c0c14] border border-[#2a2a3d] px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6b7280] mb-2">
                    Filter by Error Type
                  </p>
                  <TileErrorLegend />
                </div>
              )}

              <div className="flex gap-4 items-start">
                <div className="flex-1 min-w-0">
                  <LEDTileGrid />
                </div>
                {selectedTileId && <TileDetailPanel />}
              </div>

              {tileViewMode === 'temperature' && (
                <div className="flex items-center gap-3 text-[10px] text-[#6b7280]">
                  <span className="font-medium">Temperature scale:</span>
                  {[
                    { color: '#3b82f6', label: '<32°C' },
                    { color: '#22c55e', label: '32-38°C' },
                    { color: '#84cc16', label: '38-44°C' },
                    { color: '#eab308', label: '44-48°C' },
                    { color: '#f59e0b', label: '48-52°C' },
                    { color: '#ef4444', label: '>52°C' },
                  ].map(({ color, label }) => (
                    <span key={label} className="flex items-center gap-1">
                      <span className="h-2.5 w-2.5 rounded-sm inline-block" style={{ backgroundColor: color }} />
                      {label}
                    </span>
                  ))}
                </div>
              )}

              {tileViewMode === 'status' && (
                <div className="flex items-center gap-3 text-[10px] text-[#6b7280]">
                  <span className="font-medium">Status:</span>
                  {[
                    { color: '#22c55e', label: 'Online' },
                    { color: '#f59e0b', label: 'Warning' },
                    { color: '#ef4444', label: 'Error' },
                    { color: '#1c1c2b', label: 'Offline', border: '#2a2a3d' },
                  ].map(({ color, label, border }) => (
                    <span key={label} className="flex items-center gap-1">
                      <span
                        className="h-2.5 w-2.5 rounded-sm inline-block"
                        style={{
                          backgroundColor: color,
                          border: border ? `1px solid ${border}` : undefined,
                        }}
                      />
                      {label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* No processors fallback */}
        {bromptonProcessors.length === 0 && !telemetry && (
          <div className="text-center py-16 text-muted">
            <Monitor size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No Brompton processors found</p>
            <p className="text-[11px] mt-1">Add Brompton Tessera processors to see LED wall status</p>
          </div>
        )}
      </div>
    </div>
  );
}
