'use client';

import React from 'react';
import { Device } from '@/types';
import TemperatureGauge from './TemperatureGauge';
import {
  Cpu,
  MemoryStick,
  Fan,
  Zap,
  Clock,
  AlertTriangle,
  AlertCircle,
  MonitorSpeaker,
} from 'lucide-react';
import { MANUFACTURER_COLORS, STATUS_COLORS } from '@/lib/constants';
import { formatUptime } from '@/lib/utils';

const statusConfig: Record<
  Device['status'],
  { bg: string; label: string }
> = {
  online: { bg: 'bg-green-500/10', label: 'Online' },
  warning: { bg: 'bg-yellow-500/10', label: 'Warning' },
  error: { bg: 'bg-red-500/10', label: 'Error' },
  offline: { bg: 'bg-gray-500/10', label: 'Offline' },
};

interface ProgressBarProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  suffix?: string;
}

function ProgressBar({ label, value, icon, suffix = '%' }: ProgressBarProps) {
  const clampedValue = Math.max(0, Math.min(100, value));
  let barColor = 'bg-accent';
  if (clampedValue > 80) barColor = 'bg-error';
  else if (clampedValue > 60) barColor = 'bg-warning';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5 text-muted">
          {icon}
          <span>{label}</span>
        </div>
        <span className="font-mono text-foreground">
          {Math.round(clampedValue)}
          {suffix}
        </span>
      </div>
      <div className="h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}

interface DeviceHealthCardProps {
  device: Device;
}

export default function DeviceHealthCard({ device }: DeviceHealthCardProps) {
  const { health, status, manufacturer, name, model } = device;
  const accentColor = MANUFACTURER_COLORS[manufacturer];
  const statusInfo = statusConfig[status];

  return (
    <div
      className="bg-surface rounded-lg border border-border overflow-hidden transition-all hover:border-accent/30"
      style={{ borderLeftWidth: 3, borderLeftColor: accentColor }}
    >
      {/* Header */}
      <div className="px-4 pt-3 pb-2 flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-foreground truncate">{name}</h3>
          <p className="text-[11px] text-muted truncate">{model}</p>
        </div>
        <div
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ml-2 ${statusInfo.bg}`}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: STATUS_COLORS[status] }}
          />
          <span style={{ color: STATUS_COLORS[status] }}>{statusInfo.label}</span>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 pb-3 space-y-3">
        {/* Temperature + Stats Row */}
        <div className="flex items-start gap-3">
          <TemperatureGauge value={health.temperature} label="TEMP" />

          <div className="flex-1 space-y-2 min-w-0 pt-1">
            {health.cpuUsage !== undefined && (
              <ProgressBar
                label="CPU"
                value={health.cpuUsage}
                icon={<Cpu size={11} />}
              />
            )}
            {health.memoryUsage !== undefined && (
              <ProgressBar
                label="RAM"
                value={health.memoryUsage}
                icon={<MemoryStick size={11} />}
              />
            )}
            {health.gpuUsage !== undefined && (
              <ProgressBar
                label="GPU"
                value={health.gpuUsage}
                icon={<MonitorSpeaker size={11} />}
              />
            )}
          </div>
        </div>

        {/* GPU Temp if present */}
        {health.gpuTemp !== undefined && (
          <div className="flex items-center gap-2 text-[11px]">
            <MonitorSpeaker size={11} className="text-muted" />
            <span className="text-muted">GPU Temp</span>
            <span className="font-mono text-foreground ml-auto">
              {Math.round(health.gpuTemp)}{'\u00B0C'}
            </span>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border">
          {health.fanSpeed !== undefined && (
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted mb-0.5">
                <Fan size={10} />
                <span className="text-[9px] uppercase tracking-wider">Fan</span>
              </div>
              <span className="text-[11px] font-mono text-foreground">
                {Math.round(health.fanSpeed)}
              </span>
              <span className="text-[9px] text-muted ml-0.5">RPM</span>
            </div>
          )}
          {health.powerDraw !== undefined && (
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted mb-0.5">
                <Zap size={10} />
                <span className="text-[9px] uppercase tracking-wider">Power</span>
              </div>
              <span className="text-[11px] font-mono text-foreground">
                {Math.round(health.powerDraw)}
              </span>
              <span className="text-[9px] text-muted ml-0.5">W</span>
            </div>
          )}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted mb-0.5">
              <Clock size={10} />
              <span className="text-[9px] uppercase tracking-wider">Uptime</span>
            </div>
            <span className="text-[11px] font-mono text-foreground">
              {formatUptime(health.uptime)}
            </span>
          </div>
        </div>

        {/* Errors */}
        {health.errors.length > 0 && (
          <div className="space-y-1 pt-1 border-t border-border">
            {health.errors.map((err, i) => (
              <div
                key={i}
                className="flex items-start gap-1.5 text-[11px] text-red-400"
              >
                <AlertCircle size={12} className="shrink-0 mt-0.5" />
                <span>{err}</span>
              </div>
            ))}
          </div>
        )}

        {/* Warnings */}
        {health.warnings.length > 0 && (
          <div className="space-y-1 pt-1 border-t border-border">
            {health.warnings.map((warn, i) => (
              <div
                key={i}
                className="flex items-start gap-1.5 text-[11px] text-yellow-400"
              >
                <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                <span>{warn}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
