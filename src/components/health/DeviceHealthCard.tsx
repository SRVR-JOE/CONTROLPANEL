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
  Thermometer,
  Power,
  Radio,
  Signal,
  CheckCircle,
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

        {/* Sensors — multiple temperature readings */}
        {health.temperatures && health.temperatures.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-border">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted">
              <Thermometer size={10} />
              <span>Sensors</span>
            </div>
            <div className="space-y-1">
              {health.temperatures.map((sensor, i) => {
                const pct = sensor.critical
                  ? Math.min(100, (sensor.value / sensor.critical) * 100)
                  : Math.min(100, (sensor.value / 100) * 100);
                let tempColor = 'text-green-400';
                if (sensor.critical && sensor.value >= sensor.critical) tempColor = 'text-red-400';
                else if (sensor.warning && sensor.value >= sensor.warning) tempColor = 'text-yellow-400';
                else if (sensor.value >= 70) tempColor = 'text-yellow-400';
                return (
                  <div key={i} className="flex items-center gap-2 text-[11px]">
                    <span className="text-muted min-w-[80px] truncate">{sensor.label}</span>
                    <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          sensor.critical && sensor.value >= sensor.critical
                            ? 'bg-red-400'
                            : sensor.warning && sensor.value >= sensor.warning
                              ? 'bg-yellow-400'
                              : 'bg-green-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className={`font-mono ${tempColor} min-w-[36px] text-right`}>
                      {Math.round(sensor.value)}{'\u00B0C'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Power — PSU status indicators */}
        {(health.psu1 || health.psu2) && (
          <div className="space-y-1.5 pt-2 border-t border-border">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted">
              <Power size={10} />
              <span>Power Supply</span>
            </div>
            <div className="flex items-center gap-3">
              {health.psu1 && (
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      health.psu1 === 'running' ? 'bg-green-400' : health.psu1 === 'error' ? 'bg-red-400' : 'bg-gray-500'
                    }`}
                  />
                  <span className="text-muted">PSU1:</span>
                  <span className={`font-mono capitalize ${
                    health.psu1 === 'running' ? 'text-green-400' : health.psu1 === 'error' ? 'text-red-400' : 'text-gray-400'
                  }`}>
                    {health.psu1}
                  </span>
                </div>
              )}
              {health.psu2 && (
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      health.psu2 === 'running' ? 'bg-green-400' : health.psu2 === 'error' ? 'bg-red-400' : 'bg-gray-500'
                    }`}
                  />
                  <span className="text-muted">PSU2:</span>
                  <span className={`font-mono capitalize ${
                    health.psu2 === 'running' ? 'text-green-400' : health.psu2 === 'error' ? 'text-red-400' : 'text-gray-400'
                  }`}>
                    {health.psu2}
                  </span>
                </div>
              )}
              {health.psuStatus && (
                <div className="flex items-center gap-1 text-[11px] ml-auto">
                  {health.psuStatus === 'ok' ? (
                    <CheckCircle size={10} className="text-green-400" />
                  ) : health.psuStatus === 'error' ? (
                    <AlertCircle size={10} className="text-red-400" />
                  ) : (
                    <AlertTriangle size={10} className="text-gray-400" />
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reference — sync/genlock status */}
        {health.referenceFormat && (
          <div className="space-y-1.5 pt-2 border-t border-border">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted">
              <Radio size={10} />
              <span>Reference</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-mono text-foreground">{health.referenceFormat}</span>
              {health.referenceStatus && (
                <span className={`flex items-center gap-1 font-mono text-[10px] px-1.5 py-0.5 rounded ${
                  health.referenceStatus === 'locked'
                    ? 'bg-green-500/10 text-green-400'
                    : health.referenceStatus === 'unlocked'
                      ? 'bg-yellow-500/10 text-yellow-400'
                      : 'bg-gray-500/10 text-gray-400'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    health.referenceStatus === 'locked' ? 'bg-green-400' : health.referenceStatus === 'unlocked' ? 'bg-yellow-400' : 'bg-gray-500'
                  }`} />
                  {health.referenceStatus}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Fans — multiple fan readings */}
        {health.fans && health.fans.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-border">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted">
              <Fan size={10} />
              <span>Fans</span>
            </div>
            <div className="space-y-1">
              {health.fans.map((fan, i) => {
                const pct = Math.round((fan.pwm / 255) * 100);
                return (
                  <div key={i} className="flex items-center gap-2 text-[11px]">
                    <span className="text-muted min-w-[48px] truncate">{fan.label}</span>
                    <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-accent transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="font-mono text-foreground min-w-[32px] text-right">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Signal — input signal count */}
        {health.signalCount !== undefined && health.totalInputs !== undefined && health.totalInputs > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-border">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted">
              <Signal size={10} />
              <span>Signal</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted">Active inputs</span>
                <span className="font-mono text-foreground">
                  {health.signalCount}/{health.totalInputs}
                </span>
              </div>
              <div className="h-1.5 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-500"
                  style={{ width: `${(health.signalCount / health.totalInputs) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
