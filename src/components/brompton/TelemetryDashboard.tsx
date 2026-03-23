'use client';

import React from 'react';
import type { BromptonTelemetry } from '@/types';
import {
  Thermometer,
  Fan,
  Monitor,
  Sun,
  Palette,
  Layers,
  Shield,
  Activity,
  Clock,
  Server,
  Eye,
  Sparkles,
  Zap,
  AlertTriangle,
  XCircle,
  Snowflake,
  Tv,
  SlidersHorizontal,
  Radio,
  Hash,
  Box,
  Camera,
  GitBranch,
} from 'lucide-react';

// ============================================================
// Shared sub-components
// ============================================================

function StatusDot({ active, color }: { active: boolean; color?: string }) {
  return (
    <span
      className="inline-block w-2 h-2 rounded-full shrink-0"
      style={{ backgroundColor: active ? (color ?? '#22c55e') : '#374151' }}
    />
  );
}

function Badge({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'success' | 'warning' | 'error' | 'info' }) {
  const colors = {
    default: 'bg-[#1c1c2b] text-[#9ca3af] border-[#2a2a3d]',
    success: 'bg-green-500/10 text-green-400 border-green-500/20',
    warning: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    error: 'bg-red-500/10 text-red-400 border-red-500/20',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${colors[variant]}`}>
      {children}
    </span>
  );
}

function FeatureChip({ label, enabled, icon }: { label: string; enabled: boolean; icon: React.ReactNode }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
      enabled ? 'bg-green-500/5 border-green-500/20 text-green-400' : 'bg-[#1c1c2b] border-[#2a2a3d] text-[#6b7280]'
    }`}>
      {icon}
      <span className="text-[11px] font-medium">{label}</span>
      <div className={`ml-auto w-7 h-4 rounded-full flex items-center px-0.5 transition-colors ${
        enabled ? 'bg-green-500/30 justify-end' : 'bg-[#2a2a3d] justify-start'
      }`}>
        <div className={`w-3 h-3 rounded-full transition-colors ${enabled ? 'bg-green-400' : 'bg-[#6b7280]'}`} />
      </div>
    </div>
  );
}

function TempBar({ label, value, max = 85, warning = 55, critical = 75, unit = '°C' }: {
  label: string; value: number; max?: number; warning?: number; critical?: number; unit?: string;
}) {
  const pct = Math.min(100, (value / max) * 100);
  const color = value >= critical ? '#ef4444' : value >= warning ? '#f59e0b' : value >= warning * 0.7 ? '#84cc16' : '#22c55e';
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-[#9ca3af]">{label}</span>
        <span className="font-mono font-semibold" style={{ color }}>{value.toFixed(1)}{unit}</span>
      </div>
      <div className="h-1.5 bg-[#1c1c2b] rounded-full overflow-hidden border border-[#2a2a3d]">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function SectionCard({ title, icon, children, accent, rightContent }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; accent?: string; rightContent?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[#2a2a3d] bg-[#14141f] overflow-hidden" style={accent ? { borderTopWidth: 2, borderTopColor: accent } : undefined}>
      <div className="px-4 py-2.5 border-b border-[#2a2a3d] flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-[12px] font-semibold text-[#e0e0e8]">{title}</span>
        </div>
        {rightContent}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function StatBox({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-[#1c1c2b] rounded-lg px-3 py-2 border border-[#2a2a3d]">
      <span className="text-[9px] text-[#6b7280] uppercase tracking-wider block mb-0.5">{label}</span>
      <span className="text-[13px] font-bold font-mono" style={{ color: color ?? '#e0e0e8' }}>{value}</span>
      {sub && <span className="text-[9px] text-[#6b7280] ml-1">{sub}</span>}
    </div>
  );
}

// ============================================================
// 1. System Identity
// ============================================================

export function SystemIdentityPanel({ t }: { t: BromptonTelemetry }) {
  return (
    <SectionCard title="System Identity" icon={<Server size={14} className="text-[#00cc88]" />} accent="#00cc88">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatBox label="Processor" value={t.processorName} />
        <StatBox label="Type" value={t.processorType.toUpperCase()} color="#00cc88" />
        <StatBox label="Serial" value={t.serialNumber} />
        <StatBox label="Firmware" value={`v${t.softwareVersion}`} color="#3b82f6" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
        <div className="bg-[#1c1c2b] rounded-lg px-3 py-2 border border-[#2a2a3d] flex items-center gap-2">
          <Clock size={12} className="text-[#6b7280]" />
          <div>
            <span className="text-[9px] text-[#6b7280] uppercase tracking-wider block">Uptime</span>
            <span className="text-[12px] font-mono text-[#e0e0e8]">{t.uptime}</span>
          </div>
        </div>
        <div className="bg-[#1c1c2b] rounded-lg px-3 py-2 border border-[#2a2a3d] flex items-center gap-2">
          <Box size={12} className="text-[#6b7280]" />
          <div>
            <span className="text-[9px] text-[#6b7280] uppercase tracking-wider block">Project</span>
            <span className="text-[12px] font-mono text-[#e0e0e8] truncate block max-w-[140px]">{t.projectName || 'None'}</span>
          </div>
        </div>
        <div className="bg-[#1c1c2b] rounded-lg px-3 py-2 border border-[#2a2a3d] flex items-center gap-2">
          <Hash size={12} className="text-[#6b7280]" />
          <div>
            <span className="text-[9px] text-[#6b7280] uppercase tracking-wider block">Preset</span>
            <span className="text-[12px] font-mono text-[#e0e0e8]">
              {t.activePreset.name || `#${t.activePreset.number}`}
            </span>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

// ============================================================
// 2. Thermal Overview (all 12 sensors)
// ============================================================

export function ThermalOverviewPanel({ t, tempHistory }: {
  t: BromptonTelemetry;
  tempHistory: { timestamp: number; cpu: number; gpu: number; fpga: number; psu: number; ambient: number }[];
}) {
  const temps = t.temperatures;
  const maxSensor = Math.max(temps.cpu, temps.gpu, temps.fpga, temps.psu, temps.main, temps.ambient);

  return (
    <SectionCard
      title="Thermal Monitoring"
      icon={<Thermometer size={14} className="text-[#f59e0b]" />}
      accent="#f59e0b"
      rightContent={
        <Badge variant={maxSensor >= 70 ? 'error' : maxSensor >= 55 ? 'warning' : 'success'}>
          Peak {maxSensor.toFixed(1)}°C
        </Badge>
      }
    >
      {/* Core sensors */}
      <div className="space-y-2.5">
        <TempBar label="CPU" value={temps.cpu} warning={70} critical={80} />
        <TempBar label="GPU" value={temps.gpu} warning={75} critical={85} />
        <TempBar label="FPGA" value={temps.fpga} warning={70} critical={80} />
        <TempBar label="PSU" value={temps.psu} warning={55} critical={65} />
        <TempBar label="Main Board" value={temps.main} warning={50} critical={65} />
        <TempBar label="Ambient" value={temps.ambient} warning={40} critical={50} />
      </div>

      {/* Ethernet sensors */}
      <div className="mt-3 pt-3 border-t border-[#2a2a3d]">
        <span className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider mb-2 block">Ethernet Ports</span>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <TempBar label="Copper A" value={temps.ethernet.copper.a} warning={50} critical={60} max={70} />
          <TempBar label="Copper B" value={temps.ethernet.copper.b} warning={50} critical={60} max={70} />
          <TempBar label="SFP+ A" value={temps.ethernet.sfp.a} warning={50} critical={60} max={70} />
          <TempBar label="SFP+ B" value={temps.ethernet.sfp.b} warning={50} critical={60} max={70} />
          <TempBar label="SFP+ C" value={temps.ethernet.sfp.c} warning={50} critical={60} max={70} />
          <TempBar label="SFP+ D" value={temps.ethernet.sfp.d} warning={50} critical={60} max={70} />
        </div>
      </div>

      {/* Mini sparkline */}
      {tempHistory.length > 2 && (
        <div className="mt-3 pt-3 border-t border-[#2a2a3d]">
          <span className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider mb-2 block">Temperature Trend (3 min)</span>
          <div className="h-16 flex items-end gap-[2px]">
            {tempHistory.map((h, i) => {
              const maxVal = Math.max(h.cpu, h.gpu, h.fpga);
              const height = Math.max(4, (maxVal / 85) * 100);
              const c = maxVal >= 70 ? '#ef4444' : maxVal >= 55 ? '#f59e0b' : '#22c55e';
              return (
                <div
                  key={i}
                  className="flex-1 rounded-t-sm transition-all duration-300"
                  style={{ height: `${height}%`, backgroundColor: c, opacity: 0.7 + (i / tempHistory.length) * 0.3 }}
                  title={`CPU: ${h.cpu.toFixed(1)}° GPU: ${h.gpu.toFixed(1)}° FPGA: ${h.fpga.toFixed(1)}°`}
                />
              );
            })}
          </div>
        </div>
      )}
    </SectionCard>
  );
}

// ============================================================
// 3. Fan Status
// ============================================================

export function FanStatusPanel({ t }: { t: BromptonTelemetry }) {
  const fans = [
    { label: 'Case Fan 1', ...t.fans.case1, max: 3000 },
    { label: 'Case Fan 2', ...t.fans.case2, max: 3000 },
    { label: 'FPGA Fan', ...t.fans.fpga, max: 8000 },
  ];

  return (
    <SectionCard title="Fan Status" icon={<Fan size={14} className="text-[#3b82f6]" />} accent="#3b82f6">
      <div className="space-y-3">
        {fans.map((fan) => {
          const pct = Math.min(100, (fan.speed / fan.max) * 100);
          const isLow = fan.speed > 0 && fan.speed < 500;
          return (
            <div key={fan.label}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <StatusDot active={fan.status} color={isLow ? '#f59e0b' : '#22c55e'} />
                  <span className="text-[11px] text-[#9ca3af]">{fan.label}</span>
                </div>
                <span className={`text-[12px] font-mono font-semibold ${isLow ? 'text-yellow-400' : 'text-[#e0e0e8]'}`}>
                  {fan.speed.toLocaleString()} RPM
                </span>
              </div>
              <div className="h-2 bg-[#1c1c2b] rounded-full overflow-hidden border border-[#2a2a3d]">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    background: `linear-gradient(to right, #1e40af, #3b82f6, #60a5fa)`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

// ============================================================
// 4. Input Signal
// ============================================================

export function InputSignalPanel({ t }: { t: BromptonTelemetry }) {
  const inp = t.input;
  const hasSignal = inp.metadata.refreshRate > 0;
  const resStr = hasSignal
    ? `${inp.metadata.resolution.width}x${inp.metadata.resolution.height}`
    : 'No Signal';

  return (
    <SectionCard
      title="Input Signal"
      icon={<Monitor size={14} className="text-[#a855f7]" />}
      accent="#a855f7"
      rightContent={
        <Badge variant={hasSignal ? 'success' : 'error'}>
          {hasSignal ? <><StatusDot active color="#22c55e" /> Live</> : <><StatusDot active={false} /> No Signal</>}
        </Badge>
      }
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <StatBox label="Source" value={`${inp.activeSource.portType.toUpperCase()} ${inp.activeSource.portNumber}`} color="#a855f7" />
        <StatBox label="Resolution" value={resStr} />
        <StatBox label="Frame Rate" value={hasSignal ? `${inp.metadata.refreshRate} Hz` : '—'} />
        <StatBox label="Bit Depth" value={hasSignal ? `${inp.metadata.bitDepth}-bit` : '—'} />
        <StatBox label="Sampling" value={hasSignal ? inp.metadata.sampling.toUpperCase() : '—'} />
        <StatBox label="HDR" value={inp.metadata.hdr === 'standard-dynamic-range' ? 'SDR' : inp.metadata.hdr} />
      </div>

      {/* Colour controls */}
      <div className="mt-3 pt-3 border-t border-[#2a2a3d]">
        <span className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider mb-2 block">Input Controls</span>
        <div className="grid grid-cols-2 gap-2">
          <StatBox label="Colour Space" value={inp.controls.colourSpace || 'Auto'} />
          <StatBox label="HDMI Format" value={inp.controls.hdmiColourFormat || 'Auto'} />
          <StatBox label="Quantisation" value={inp.controls.quantisationRange || 'Auto'} />
          <StatBox label="HDR Mode" value={inp.controls.hdrFormat || 'Auto'} />
        </div>
      </div>

      {/* Proc Amp */}
      <div className="mt-3 pt-3 border-t border-[#2a2a3d]">
        <span className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider mb-2 block">Proc Amp</span>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Black Level', value: inp.procAmp.blackLevel },
            { label: 'Contrast', value: inp.procAmp.contrast },
            { label: 'Hue', value: inp.procAmp.hue },
            { label: 'Saturation', value: inp.procAmp.saturation },
          ].map((p) => (
            <div key={p.label} className="text-center bg-[#1c1c2b] rounded-lg px-2 py-1.5 border border-[#2a2a3d]">
              <span className="text-[8px] text-[#6b7280] uppercase tracking-wider block">{p.label}</span>
              <span className={`text-[12px] font-mono font-semibold ${p.value !== 100 && p.value !== 0 ? 'text-yellow-400' : 'text-[#e0e0e8]'}`}>
                {p.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

// ============================================================
// 5. Output / Global Colour
// ============================================================

export function OutputColorPanel({ t }: { t: BromptonTelemetry }) {
  const out = t.output;
  const brightnessPct = ((out.brightness / 10000) * 100).toFixed(1);

  return (
    <SectionCard title="Output / Global Colour" icon={<Palette size={14} className="text-[#f59e0b]" />} accent="#f59e0b">
      {/* Brightness */}
      <div className="space-y-1 mb-4">
        <div className="flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5 text-[#9ca3af]">
            <Sun size={12} />
            <span>Brightness</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[#e0e0e8] font-semibold">{brightnessPct}%</span>
            <span className="text-[9px] text-[#6b7280]">({out.brightness} / 10000)</span>
          </div>
        </div>
        <div className="h-3 bg-[#1c1c2b] rounded-full overflow-hidden border border-[#2a2a3d]">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${brightnessPct}%`,
              background: 'linear-gradient(to right, #374151, #fbbf24, #ffffff)',
            }}
          />
        </div>
        {out.brightnessLimit.enabled && (
          <div className="text-[9px] text-yellow-400 flex items-center gap-1">
            <AlertTriangle size={10} /> Brightness limit active: {out.brightnessLimit.value / 100}%
          </div>
        )}
      </div>

      {/* Gamma & Color Temp */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#9ca3af]">Gamma</span>
            <span className="font-mono text-[#e0e0e8] font-semibold">{out.gamma}</span>
          </div>
          <div className="h-2 bg-[#1c1c2b] rounded-full overflow-hidden border border-[#2a2a3d]">
            <div className="h-full rounded-full bg-[#8b5cf6] transition-all" style={{ width: `${((out.gamma - 1) / 2) * 100}%` }} />
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#9ca3af]">Colour Temp</span>
            <span className="font-mono text-[#e0e0e8] font-semibold">{out.colourTemperature}K</span>
          </div>
          <div className="h-2 bg-[#1c1c2b] rounded-full overflow-hidden border border-[#2a2a3d]">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, ((out.colourTemperature - 2700) / 7300) * 100)}%`,
                background: 'linear-gradient(to right, #ff8c42, #fff5e0, #a5c8ff)',
              }}
            />
          </div>
        </div>
      </div>

      {/* RGB Gains */}
      <div className="mb-3">
        <span className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider mb-2 block">RGB Gains</span>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'R', value: out.gains.red, color: '#ef4444' },
            { label: 'G', value: out.gains.green, color: '#22c55e' },
            { label: 'B', value: out.gains.blue, color: '#3b82f6' },
            { label: 'I', value: out.gains.intensity, color: '#e0e0e8' },
          ].map((g) => (
            <div key={g.label} className="text-center">
              <div className="h-12 bg-[#1c1c2b] rounded-lg border border-[#2a2a3d] flex items-end justify-center pb-1 overflow-hidden relative">
                <div
                  className="absolute bottom-0 w-full rounded-b-lg transition-all duration-500"
                  style={{ height: `${g.value}%`, backgroundColor: g.color, opacity: 0.2 }}
                />
                <span className="text-[13px] font-mono font-bold relative z-10" style={{ color: g.color }}>{g.value}</span>
              </div>
              <span className="text-[9px] text-[#6b7280] mt-1 block">{g.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Processing Features */}
      <div className="grid grid-cols-2 gap-2">
        <FeatureChip label="DarkMagic" enabled={out.darkMagic} icon={<Eye size={13} />} />
        <FeatureChip label="PureTone" enabled={out.pureTone} icon={<Sparkles size={13} />} />
        <FeatureChip label="Extended Bit Depth" enabled={out.extendedBitDepth} icon={<Layers size={13} />} />
        <FeatureChip label="Overdrive" enabled={out.overdrive} icon={<Zap size={13} />} />
      </div>
    </SectionCard>
  );
}

// ============================================================
// 6. Processing Pipeline
// ============================================================

export function ProcessingPanel({ t }: { t: BromptonTelemetry }) {
  const p = t.processing;
  const activeCount = [p.lut3d.enabled, p.colourCorrect.enabled, p.colourReplace.enabled, p.curves.enabled, p.osca.moduleCorrection, p.osca.seamCorrection, p.scaler.enabled].filter(Boolean).length;

  return (
    <SectionCard
      title="Processing Pipeline"
      icon={<SlidersHorizontal size={14} className="text-[#ec4899]" />}
      accent="#ec4899"
      rightContent={<Badge variant={activeCount > 0 ? 'info' : 'default'}>{activeCount} active</Badge>}
    >
      <div className="space-y-2">
        {/* 3D LUT */}
        <div className={`flex items-center justify-between px-3 py-2 rounded-lg border ${p.lut3d.enabled ? 'bg-blue-500/5 border-blue-500/20' : 'bg-[#1c1c2b] border-[#2a2a3d]'}`}>
          <div className="flex items-center gap-2">
            <StatusDot active={p.lut3d.enabled} color="#3b82f6" />
            <span className="text-[11px] text-[#e0e0e8]">3D LUT</span>
          </div>
          <span className="text-[10px] font-mono text-[#6b7280] truncate max-w-[150px]">
            {p.lut3d.enabled ? `${p.lut3d.filename} @ ${p.lut3d.strength}%` : 'Disabled'}
          </span>
        </div>

        {/* Colour Correct */}
        <div className={`flex items-center justify-between px-3 py-2 rounded-lg border ${p.colourCorrect.enabled ? 'bg-blue-500/5 border-blue-500/20' : 'bg-[#1c1c2b] border-[#2a2a3d]'}`}>
          <div className="flex items-center gap-2">
            <StatusDot active={p.colourCorrect.enabled} color="#3b82f6" />
            <span className="text-[11px] text-[#e0e0e8]">Colour Correct</span>
          </div>
          <span className="text-[10px] text-[#6b7280]">{p.colourCorrect.enabled ? 'Active' : 'Disabled'}</span>
        </div>

        {/* Colour Replace */}
        <div className={`flex items-center justify-between px-3 py-2 rounded-lg border ${p.colourReplace.enabled ? 'bg-blue-500/5 border-blue-500/20' : 'bg-[#1c1c2b] border-[#2a2a3d]'}`}>
          <div className="flex items-center gap-2">
            <StatusDot active={p.colourReplace.enabled} color="#3b82f6" />
            <span className="text-[11px] text-[#e0e0e8]">Colour Replace</span>
          </div>
          <span className="text-[10px] text-[#6b7280]">
            {p.colourReplace.enabled ? `${p.colourReplace.method} @ ${p.colourReplace.strength}%` : 'Disabled'}
          </span>
        </div>

        {/* Curves */}
        <div className={`flex items-center justify-between px-3 py-2 rounded-lg border ${p.curves.enabled ? 'bg-blue-500/5 border-blue-500/20' : 'bg-[#1c1c2b] border-[#2a2a3d]'}`}>
          <div className="flex items-center gap-2">
            <StatusDot active={p.curves.enabled} color="#3b82f6" />
            <span className="text-[11px] text-[#e0e0e8]">Curves</span>
          </div>
          <span className="text-[10px] text-[#6b7280]">{p.curves.enabled ? 'Active' : 'Disabled'}</span>
        </div>

        {/* OSCA */}
        <div className={`flex items-center justify-between px-3 py-2 rounded-lg border ${(p.osca.moduleCorrection || p.osca.seamCorrection) ? 'bg-blue-500/5 border-blue-500/20' : 'bg-[#1c1c2b] border-[#2a2a3d]'}`}>
          <div className="flex items-center gap-2">
            <StatusDot active={p.osca.moduleCorrection || p.osca.seamCorrection} color="#3b82f6" />
            <span className="text-[11px] text-[#e0e0e8]">OSCA</span>
          </div>
          <div className="flex gap-2 text-[10px] text-[#6b7280]">
            <span className={p.osca.moduleCorrection ? 'text-blue-400' : ''}>Module {p.osca.moduleCorrection ? 'ON' : 'OFF'}</span>
            <span className={p.osca.seamCorrection ? 'text-blue-400' : ''}>Seam {p.osca.seamCorrection ? 'ON' : 'OFF'}</span>
          </div>
        </div>

        {/* Scaler */}
        <div className={`flex items-center justify-between px-3 py-2 rounded-lg border ${p.scaler.enabled ? 'bg-green-500/5 border-green-500/20' : 'bg-[#1c1c2b] border-[#2a2a3d]'}`}>
          <div className="flex items-center gap-2">
            <StatusDot active={p.scaler.enabled} color="#22c55e" />
            <span className="text-[11px] text-[#e0e0e8]">Scaler</span>
          </div>
          <span className="text-[10px] text-[#6b7280]">{p.scaler.enabled ? 'Active' : 'Disabled'}</span>
        </div>
      </div>
    </SectionCard>
  );
}

// ============================================================
// 7. Network / Genlock / Failover
// ============================================================

export function NetworkGenlockPanel({ t }: { t: BromptonTelemetry }) {
  const net = t.network;

  return (
    <SectionCard title="Network / Genlock" icon={<Radio size={14} className="text-[#06b6d4]" />} accent="#06b6d4">
      {/* Core network info */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <StatBox label="Output Bit Depth" value={`${net.bitDepth}-bit`} color="#06b6d4" />
        <StatBox label="Frame Rate Mult." value={`${net.frameRateMultiplier}x`} />
        <StatBox label="Frame Remap" value={net.frameRemapping.enabled ? 'ON' : 'OFF'} color={net.frameRemapping.enabled ? '#22c55e' : '#6b7280'} />
      </div>

      {/* Genlock */}
      <div className="bg-[#1c1c2b] rounded-lg border border-[#2a2a3d] p-3 mb-3">
        <div className="flex items-center gap-2 mb-2">
          <Activity size={12} className="text-[#06b6d4]" />
          <span className="text-[11px] font-semibold text-[#e0e0e8]">Genlock</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[9px] text-[#6b7280] uppercase block">Source</span>
            <span className="text-[11px] font-mono text-[#e0e0e8]">{net.genlock.source || '—'}</span>
          </div>
          <div>
            <span className="text-[9px] text-[#6b7280] uppercase block">Internal Rate</span>
            <span className="text-[11px] font-mono text-[#e0e0e8]">{net.genlock.internalRate} Hz</span>
          </div>
          <div>
            <span className="text-[9px] text-[#6b7280] uppercase block">Phase Mode</span>
            <span className="text-[11px] font-mono text-[#e0e0e8]">{net.genlock.phaseOffset.mode}</span>
          </div>
          <div>
            <span className="text-[9px] text-[#6b7280] uppercase block">Phase Offset</span>
            <span className="text-[11px] font-mono text-[#e0e0e8]">
              {net.genlock.phaseOffset.lines}L / {net.genlock.phaseOffset.pixels}px
            </span>
          </div>
        </div>
      </div>

      {/* Failover */}
      <div className="bg-[#1c1c2b] rounded-lg border border-[#2a2a3d] p-3 mb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Shield size={12} className={net.failover.enabled ? 'text-green-400' : 'text-[#6b7280]'} />
            <span className="text-[11px] font-semibold text-[#e0e0e8]">Failover</span>
          </div>
          <Badge variant={net.failover.enabled ? 'success' : 'default'}>{net.failover.enabled ? 'Enabled' : 'Disabled'}</Badge>
        </div>
        <div className="grid grid-cols-3 gap-2 text-[10px]">
          <div>
            <span className="text-[#6b7280] block">Role</span>
            <span className="text-[#e0e0e8] font-mono capitalize">{net.failover.role}</span>
          </div>
          <div>
            <span className="text-[#6b7280] block">Active</span>
            <span className={net.failover.isActive ? 'text-green-400' : 'text-[#e0e0e8]'}>{net.failover.isActive ? 'Yes' : 'No'}</span>
          </div>
          <div>
            <span className="text-[#6b7280] block">Partner</span>
            <span className={net.failover.isPartnerPresent ? 'text-green-400' : 'text-[#6b7280]'}>
              {net.failover.isPartnerPresent ? net.failover.partnerName || 'Connected' : 'None'}
            </span>
          </div>
        </div>
      </div>

      {/* ShutterSync & Tracking */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[#1c1c2b] rounded-lg border border-[#2a2a3d] p-3">
          <div className="flex items-center gap-2 mb-1">
            <Camera size={12} className="text-[#6b7280]" />
            <span className="text-[10px] font-semibold text-[#e0e0e8]">ShutterSync</span>
          </div>
          <span className="text-[10px] font-mono text-[#6b7280] block">{net.shutterSync.mode === 'none' ? 'Disabled' : net.shutterSync.mode}</span>
          {net.shutterSync.mode !== 'none' && (
            <span className="text-[9px] text-[#6b7280]">{net.shutterSync.shutterAngle}° / {net.shutterSync.viewer}</span>
          )}
        </div>
        <div className="bg-[#1c1c2b] rounded-lg border border-[#2a2a3d] p-3">
          <div className="flex items-center gap-2 mb-1">
            <GitBranch size={12} className="text-[#6b7280]" />
            <span className="text-[10px] font-semibold text-[#e0e0e8]">Tracking</span>
          </div>
          <div className="flex gap-2 text-[10px]">
            <span className={net.hiddenMarkers.enabled ? 'text-blue-400' : 'text-[#6b7280]'}>
              Markers: {net.hiddenMarkers.enabled ? net.hiddenMarkers.mode : 'OFF'}
            </span>
          </div>
          <div className="flex gap-2 text-[10px]">
            <span className={net.starTracker.enabled ? 'text-blue-400' : 'text-[#6b7280]'}>
              StarTracker: {net.starTracker.enabled ? 'ON' : 'OFF'}
            </span>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

// ============================================================
// 8. Override Status (Blackout / Freeze / Test Pattern)
// ============================================================

export function OverrideStatusPanel({ t }: { t: BromptonTelemetry }) {
  const ovr = t.override;
  const anyActive = ovr.blackout.enabled || ovr.freeze.enabled || ovr.testPattern.enabled;

  return (
    <SectionCard
      title="Override Status"
      icon={<AlertTriangle size={14} className={anyActive ? 'text-red-400' : 'text-[#6b7280]'} />}
      accent={anyActive ? '#ef4444' : undefined}
      rightContent={anyActive ? <Badge variant="error">ACTIVE</Badge> : undefined}
    >
      <div className="grid grid-cols-3 gap-2">
        {/* Blackout */}
        <div className={`rounded-lg border p-3 text-center ${ovr.blackout.enabled ? 'bg-red-500/10 border-red-500/30' : 'bg-[#1c1c2b] border-[#2a2a3d]'}`}>
          <XCircle size={20} className={`mx-auto mb-1 ${ovr.blackout.enabled ? 'text-red-400' : 'text-[#374151]'}`} />
          <span className={`text-[11px] font-semibold block ${ovr.blackout.enabled ? 'text-red-400' : 'text-[#6b7280]'}`}>
            Blackout
          </span>
          <span className="text-[9px] text-[#6b7280]">
            {ovr.blackout.enabled ? `Fade: ${ovr.blackout.fadeTime}s` : 'OFF'}
          </span>
        </div>

        {/* Freeze */}
        <div className={`rounded-lg border p-3 text-center ${ovr.freeze.enabled ? 'bg-blue-500/10 border-blue-500/30' : 'bg-[#1c1c2b] border-[#2a2a3d]'}`}>
          <Snowflake size={20} className={`mx-auto mb-1 ${ovr.freeze.enabled ? 'text-blue-400' : 'text-[#374151]'}`} />
          <span className={`text-[11px] font-semibold block ${ovr.freeze.enabled ? 'text-blue-400' : 'text-[#6b7280]'}`}>
            Freeze
          </span>
          <span className="text-[9px] text-[#6b7280]">{ovr.freeze.enabled ? 'ACTIVE' : 'OFF'}</span>
        </div>

        {/* Test Pattern */}
        <div className={`rounded-lg border p-3 text-center ${ovr.testPattern.enabled ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-[#1c1c2b] border-[#2a2a3d]'}`}>
          <Tv size={20} className={`mx-auto mb-1 ${ovr.testPattern.enabled ? 'text-yellow-400' : 'text-[#374151]'}`} />
          <span className={`text-[11px] font-semibold block ${ovr.testPattern.enabled ? 'text-yellow-400' : 'text-[#6b7280]'}`}>
            Test Pattern
          </span>
          <span className="text-[9px] text-[#6b7280]">
            {ovr.testPattern.enabled ? ovr.testPattern.type : 'OFF'}
          </span>
        </div>
      </div>
    </SectionCard>
  );
}

// ============================================================
// 9. Panel Statistics
// ============================================================

export function PanelStatisticsPanel({ t }: { t: BromptonTelemetry }) {
  return (
    <SectionCard
      title="Connected Panels"
      icon={<Layers size={14} className="text-[#22c55e]" />}
      accent="#22c55e"
      rightContent={
        <Badge variant={t.panels.errorCount > 0 ? 'error' : t.panels.onlineCount > 0 ? 'success' : 'warning'}>
          {t.panels.onlineCount} online
        </Badge>
      }
    >
      <div className="grid grid-cols-3 gap-2 mb-3">
        <StatBox label="Online" value={t.panels.onlineCount} color="#22c55e" />
        <StatBox label="Errors" value={t.panels.errorCount} color={t.panels.errorCount > 0 ? '#ef4444' : '#6b7280'} />
        <StatBox label="Associated" value={t.panels.associatedCount} />
      </div>

      {/* Panel types */}
      {t.panelTypes.length > 0 && (
        <div className="mb-3">
          <span className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider mb-1.5 block">Calibrated Panel Types</span>
          <div className="flex flex-wrap gap-1.5">
            {t.panelTypes.map((pt) => (
              <span key={pt} className="px-2 py-1 bg-[#1c1c2b] border border-[#2a2a3d] rounded text-[10px] font-mono text-[#e0e0e8]">{pt}</span>
            ))}
          </div>
        </div>
      )}

      {/* Device list */}
      {t.panels.items.length > 0 && (
        <div>
          <span className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider mb-1.5 block">Registered Devices</span>
          <div className="space-y-1">
            {t.panels.items.map((item) => (
              <div key={item.serial} className="flex items-center justify-between px-3 py-1.5 bg-[#1c1c2b] rounded border border-[#2a2a3d]">
                <div className="flex items-center gap-2">
                  <StatusDot active={t.panels.onlineCount > 0} />
                  <span className="text-[11px] font-mono text-[#e0e0e8]">{item.serial}</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-[#6b7280]">
                  <span>Type: <span className="text-[#e0e0e8]">{item.type}</span></span>
                  <span>FW: <span className="text-[#e0e0e8]">{item.firmware}</span></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </SectionCard>
  );
}
