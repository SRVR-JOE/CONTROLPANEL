'use client';

import React from 'react';
import { BromptonProcessorStatus, Device } from '@/types';
import TemperatureGauge from './TemperatureGauge';
import {
  Monitor,
  Link,
  Sparkles,
  Palette,
  Sun,
  Thermometer,
  WifiOff,
  Signal,
  Layers,
  Eye,
} from 'lucide-react';

interface BromptonStatusPanelProps {
  status: BromptonProcessorStatus;
  device: Device;
}

function panelTempColor(temp: number): string {
  if (temp < 30) return '#3b82f6';
  if (temp <= 38) return '#22c55e';
  if (temp <= 44) return '#84cc16';
  if (temp <= 48) return '#eab308';
  if (temp <= 52) return '#f59e0b';
  return '#ef4444';
}

const linkStatusConfig: Record<
  BromptonProcessorStatus['linkStatus'],
  { color: string; bg: string; label: string }
> = {
  active: { color: '#22c55e', bg: 'bg-green-500/10', label: 'Active' },
  degraded: { color: '#f59e0b', bg: 'bg-yellow-500/10', label: 'Degraded' },
  lost: { color: '#ef4444', bg: 'bg-red-500/10', label: 'Lost' },
};

interface FeatureToggleProps {
  label: string;
  enabled: boolean;
  icon: React.ReactNode;
}

function FeatureToggle({ label, enabled, icon }: FeatureToggleProps) {
  return (
    <div
      aria-label={`${label}: ${enabled ? 'Enabled' : 'Disabled'}`}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
        enabled
          ? 'bg-green-500/5 border-green-500/20 text-green-400'
          : 'bg-surface-2 border-border text-muted'
      }`}
    >
      {icon}
      <span className="text-[11px] font-medium">{label}</span>
      <div
        className={`ml-auto w-7 h-4 rounded-full flex items-center px-0.5 transition-colors ${
          enabled ? 'bg-green-500/30 justify-end' : 'bg-border justify-start'
        }`}
      >
        <div
          className={`w-3 h-3 rounded-full transition-colors ${
            enabled ? 'bg-green-400' : 'bg-muted'
          }`}
        />
      </div>
    </div>
  );
}

export default function BromptonStatusPanel({
  status,
  device,
}: BromptonStatusPanelProps) {
  const linkInfo = linkStatusConfig[status.linkStatus];

  // Calculate panel grid dimensions
  const totalPanels = status.totalPanels;
  const cols = Math.ceil(Math.sqrt(totalPanels * 2)); // wider than tall

  // Average temperature
  const avgTemp =
    status.panelTemperatures.length > 0
      ? status.panelTemperatures.reduce((a, b) => a + b, 0) /
        status.panelTemperatures.length
      : 0;
  const maxTemp =
    status.panelTemperatures.length > 0
      ? Math.max(...status.panelTemperatures)
      : 0;
  const minTemp =
    status.panelTemperatures.length > 0
      ? Math.min(...status.panelTemperatures)
      : 0;

  return (
    <div className="bg-surface rounded-lg border border-border overflow-hidden"
      style={{ borderLeftWidth: 3, borderLeftColor: '#00cc88' }}
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-3 border-b border-border">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-bold text-foreground">{device.name}</h3>
            <p className="text-[11px] text-muted mt-0.5">
              {device.model} &middot; {status.panelType}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Link status */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${linkInfo.bg}`}
            >
              <Signal size={11} style={{ color: linkInfo.color }} />
              <span style={{ color: linkInfo.color }}>{linkInfo.label}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Panel Grid Visualization */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Layers size={13} className="text-muted" />
              <span className="text-[11px] font-medium text-foreground">
                Panel Grid
              </span>
            </div>
            <span className="text-[11px] text-muted">
              {status.onlinePanels}/{status.totalPanels} online
            </span>
          </div>

          <div
            className="grid gap-[2px] p-2 bg-surface-2 rounded-lg border border-border"
            style={{
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
            }}
          >
            {Array.from({ length: totalPanels }, (_, i) => {
              const isOnline = i < status.onlinePanels;
              const temp =
                i < status.panelTemperatures.length
                  ? status.panelTemperatures[i]
                  : 0;

              return (
                <div
                  key={i}
                  className="aspect-square rounded-[2px] transition-colors"
                  style={{
                    backgroundColor: isOnline
                      ? panelTempColor(temp)
                      : '#1c1c2b',
                    opacity: isOnline ? 0.85 : 0.3,
                    minWidth: 4,
                    minHeight: 4,
                  }}
                  title={
                    isOnline
                      ? `Panel ${i + 1}: ${Math.round(temp)}\u00B0C`
                      : `Panel ${i + 1}: Offline`
                  }
                />
              );
            })}
          </div>

          {/* Panel temperature stats */}
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div className="text-center bg-surface-2 rounded px-2 py-1.5 border border-border">
              <span className="text-[9px] text-muted uppercase tracking-wider block">
                Min
              </span>
              <span className="text-xs font-mono text-blue-400">
                {Math.round(minTemp)}{'\u00B0C'}
              </span>
            </div>
            <div className="text-center bg-surface-2 rounded px-2 py-1.5 border border-border">
              <span className="text-[9px] text-muted uppercase tracking-wider block">
                Avg
              </span>
              <span className="text-xs font-mono text-foreground">
                {Math.round(avgTemp)}{'\u00B0C'}
              </span>
            </div>
            <div className="text-center bg-surface-2 rounded px-2 py-1.5 border border-border">
              <span className="text-[9px] text-muted uppercase tracking-wider block">
                Max
              </span>
              <span className="text-xs font-mono text-orange-400">
                {Math.round(maxTemp)}{'\u00B0C'}
              </span>
            </div>
          </div>
        </div>

        {/* Chain Status */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Link size={13} className="text-muted" />
            <span className="text-[11px] font-medium text-foreground">
              Chain Status
            </span>
          </div>
          <div className="space-y-1.5">
            {status.chainLengths.map((length, i) => {
              const maxChain = Math.max(...status.chainLengths);
              const pct = maxChain > 0 ? (length / maxChain) * 100 : 0;
              return (
                <div key={i} className="space-y-0.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-muted">Chain {i + 1}</span>
                    <span className="font-mono text-foreground">
                      {length} panels
                    </span>
                  </div>
                  <div className="h-1.5 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Processing Features */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles size={13} className="text-muted" />
            <span className="text-[11px] font-medium text-foreground">
              Processing Features
            </span>
          </div>
          <div className="space-y-1.5">
            <FeatureToggle
              label="DarkMagic"
              enabled={status.darkMagicEnabled}
              icon={<Eye size={13} />}
            />
            <FeatureToggle
              label="DynastaTune"
              enabled={status.dynastaTuneEnabled}
              icon={<Palette size={13} />}
            />
            <FeatureToggle
              label="PureTone"
              enabled={status.pureToneEnabled}
              icon={<Sparkles size={13} />}
            />
          </div>
        </div>

        {/* Input Signal */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Monitor size={13} className="text-muted" />
            <span className="text-[11px] font-medium text-foreground">
              Input Signal
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-surface-2 rounded-lg px-3 py-2 border border-border">
              <span className="text-[9px] text-muted uppercase tracking-wider block mb-0.5">
                Source
              </span>
              <span className="text-[12px] font-medium text-foreground">
                {status.inputSource}
              </span>
            </div>
            <div className="bg-surface-2 rounded-lg px-3 py-2 border border-border">
              <span className="text-[9px] text-muted uppercase tracking-wider block mb-0.5">
                Resolution
              </span>
              <span className="text-[12px] font-medium text-foreground">
                {status.inputResolution}
              </span>
            </div>
            <div className="bg-surface-2 rounded-lg px-3 py-2 border border-border">
              <span className="text-[9px] text-muted uppercase tracking-wider block mb-0.5">
                Frame Rate
              </span>
              <span className="text-[12px] font-medium text-foreground">
                {status.inputFrameRate}fps
              </span>
            </div>
          </div>
        </div>

        {/* Output Settings */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Palette size={13} className="text-muted" />
            <span className="text-[11px] font-medium text-foreground">
              Output Settings
            </span>
          </div>
          <div className="space-y-3">
            {/* Brightness slider (display only) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 text-muted">
                  <Sun size={11} />
                  <span>Brightness</span>
                </div>
                <span className="font-mono text-foreground">
                  {status.brightness}%
                </span>
              </div>
              <div className="h-2 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${status.brightness}%`,
                    background:
                      'linear-gradient(to right, #374151, #fbbf24, #ffffff)',
                  }}
                />
              </div>
            </div>

            {/* Color Temp slider (display only) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 text-muted">
                  <Thermometer size={11} />
                  <span>Color Temp</span>
                </div>
                <span className="font-mono text-foreground">
                  {status.colorTemp}K
                </span>
              </div>
              <div className="h-2 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, ((status.colorTemp - 2700) / (10000 - 2700)) * 100)}%`,
                    background:
                      'linear-gradient(to right, #ff8c42, #fff5e0, #a5c8ff)',
                  }}
                />
              </div>
              <div className="flex justify-between text-[8px] text-muted px-0.5">
                <span>2700K</span>
                <span>10000K</span>
              </div>
            </div>

            {/* Color Space */}
            <div className="flex items-center justify-between bg-surface-2 rounded-lg px-3 py-2 border border-border">
              <span className="text-[11px] text-muted">Output Color Space</span>
              <span className="text-[11px] font-medium text-foreground">
                {status.outputColorSpace}
              </span>
            </div>
          </div>
        </div>

        {/* Device Health */}
        <div className="pt-3 border-t border-border">
          <div className="flex items-center gap-3">
            <TemperatureGauge
              value={device.health.temperature ?? 0}
              label="PROCESSOR"
            />
            <div className="flex-1 grid grid-cols-2 gap-2">
              {device.health.fanSpeed !== undefined && (
                <div className="bg-surface-2 rounded px-3 py-1.5 border border-border">
                  <span className="text-[9px] text-muted uppercase tracking-wider block">
                    Fan
                  </span>
                  <span className="text-xs font-mono text-foreground">
                    {Math.round(device.health.fanSpeed)} RPM
                  </span>
                </div>
              )}
              {device.health.powerDraw !== undefined && (
                <div className="bg-surface-2 rounded px-3 py-1.5 border border-border">
                  <span className="text-[9px] text-muted uppercase tracking-wider block">
                    Power
                  </span>
                  <span className="text-xs font-mono text-foreground">
                    {Math.round(device.health.powerDraw)}W
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Warnings from device */}
        {device.health.warnings.length > 0 && (
          <div className="space-y-1">
            {device.health.warnings.map((warn, i) => (
              <div
                key={i}
                className="flex items-start gap-1.5 text-[11px] text-yellow-400 bg-yellow-500/5 rounded-lg px-3 py-2 border border-yellow-500/10"
              >
                <WifiOff size={12} className="shrink-0 mt-0.5" />
                <span>{warn}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
