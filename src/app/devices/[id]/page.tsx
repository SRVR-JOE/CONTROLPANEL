'use client';

import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/store';
import {
  ArrowLeft, Send, Thermometer, Cpu, HardDrive, Zap, Fan, Clock, Wifi, WifiOff,
} from 'lucide-react';
import { MANUFACTURER_COLORS, STATUS_COLORS, CATEGORY_LABELS } from '@/lib/constants';
import { formatUptime } from '@/lib/utils';
import CommandPalette from '@/components/commands/CommandPalette';

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">{label}</span>
        <span style={{ color }}>{value.toFixed(1)}%</span>
      </div>
      <div className="w-full h-2 bg-[#1c1c2b] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function DeviceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const deviceId = params.id as string;
  const device = useStore((s) => s.devices.find((d) => d.id === deviceId));
  const commandHistory = useStore((s) => s.commandHistory.filter((c) => c.deviceId === deviceId));
  const sendCommand = useStore((s) => s.sendCommand);

  if (!device) {
    return (
      <div className="p-8 text-center text-gray-400">
        <p className="text-xl mb-4">Device not found</p>
        <button onClick={() => router.push('/devices')} className="text-blue-400 hover:underline">Back to Devices</button>
      </div>
    );
  }

  const mfgColor = MANUFACTURER_COLORS[device.manufacturer] || '#6b7280';
  const statusColor = STATUS_COLORS[device.status] || '#6b7280';
  const h = device.health;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/devices')} className="p-2 rounded-lg bg-[#1c1c2b] hover:bg-[#2a2a3d] transition">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{device.name}</h1>
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: statusColor }} />
            <span className="text-sm capitalize" style={{ color: statusColor }}>{device.status}</span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
            <span className="px-2 py-0.5 rounded text-xs font-medium text-white" style={{ backgroundColor: mfgColor }}>
              {device.manufacturer.toUpperCase()}
            </span>
            <span>{device.model}</span>
            <span>|</span>
            <span>{device.ipAddress}</span>
            {device.firmware && <><span>|</span><span>FW: {device.firmware}</span></>}
            {device.serialNumber && <><span>|</span><span>S/N: {device.serialNumber}</span></>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Health Metrics */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#14141f] rounded-lg border border-[#2a2a3d] p-5">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Thermometer size={18} /> Health Metrics</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {[
                { icon: Thermometer, label: 'Temp', value: `${h.temperature.toFixed(1)}°C`, color: h.temperature > 55 ? '#ef4444' : h.temperature > 45 ? '#f59e0b' : '#22c55e' },
                { icon: Zap, label: 'Power', value: h.powerDraw ? `${h.powerDraw.toFixed(0)}W` : 'N/A', color: '#3b82f6' },
                { icon: Fan, label: 'Fan', value: h.fanSpeed ? `${h.fanSpeed.toFixed(0)} RPM` : 'N/A', color: '#8b5cf6' },
                { icon: Clock, label: 'Uptime', value: formatUptime(h.uptime), color: '#22c55e' },
              ].map((s) => (
                <div key={s.label} className="bg-[#1c1c2b] rounded-lg p-3 text-center">
                  <s.icon size={16} className="mx-auto mb-1" style={{ color: s.color }} />
                  <div className="text-xs text-gray-400">{s.label}</div>
                  <div className="font-mono font-bold" style={{ color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
            {h.cpuUsage !== undefined && <Bar label="CPU Usage" value={h.cpuUsage} max={100} color={h.cpuUsage > 80 ? '#ef4444' : '#3b82f6'} />}
            {h.memoryUsage !== undefined && <Bar label="Memory Usage" value={h.memoryUsage} max={100} color={h.memoryUsage > 80 ? '#ef4444' : '#8b5cf6'} />}
            {h.gpuUsage !== undefined && <Bar label="GPU Usage" value={h.gpuUsage} max={100} color={h.gpuUsage > 80 ? '#ef4444' : '#22c55e'} />}
            {h.gpuTemp !== undefined && (
              <div className="mt-2 text-sm text-gray-400">GPU Temp: <span className="font-mono text-white">{h.gpuTemp.toFixed(1)}°C</span></div>
            )}
          </div>

          {/* Errors & Warnings */}
          {(h.errors.length > 0 || h.warnings.length > 0) && (
            <div className="bg-[#14141f] rounded-lg border border-[#2a2a3d] p-5">
              <h2 className="text-lg font-semibold mb-3">Alerts</h2>
              {h.errors.map((e, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-red-400 mb-2">
                  <span className="w-2 h-2 rounded-full bg-red-500" />{e}
                </div>
              ))}
              {h.warnings.map((w, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-yellow-400 mb-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-500" />{w}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ports */}
        <div className="space-y-4">
          <div className="bg-[#14141f] rounded-lg border border-[#2a2a3d] p-5">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><HardDrive size={18} /> Ports</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {device.ports.map((port) => (
                <div key={port.id} className="flex items-center justify-between text-sm bg-[#1c1c2b] rounded px-3 py-2">
                  <div className="flex items-center gap-2">
                    {port.signal ? <Wifi size={12} className="text-green-400" /> : <WifiOff size={12} className="text-gray-500" />}
                    <span>{port.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 uppercase">{port.type}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${port.direction === 'input' ? 'bg-blue-900/50 text-blue-300' : 'bg-green-900/50 text-green-300'}`}>
                      {port.direction === 'input' ? 'IN' : 'OUT'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Device Info */}
          <div className="bg-[#14141f] rounded-lg border border-[#2a2a3d] p-5">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><Cpu size={18} /> Info</h2>
            <div className="space-y-2 text-sm">
              {[
                ['Category', CATEGORY_LABELS[device.category] ?? device.category.replace(/-/g, ' ')],
                ['Rack Units', `${device.rackUnits} RU`],
                ['Rack', device.rackId || 'Unassigned'],
                ['Slot', device.rackSlot ? `RU ${device.rackSlot}` : 'N/A'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-gray-400">{k}</span>
                  <span className="capitalize">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Command Console */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Send size={18} className="text-gray-400" />
          <h2 className="text-lg font-semibold">Command Console</h2>
        </div>

        {/* Structured command palette */}
        <CommandPalette
          deviceId={device.id}
          manufacturer={device.manufacturer}
          deviceName={device.name}
          onSendCommand={sendCommand}
        />

        {/* Command history */}
        <div className="bg-[#14141f] rounded-lg border border-[#2a2a3d] p-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Command History</h3>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {commandHistory.length === 0 && (
              <p className="text-sm text-gray-600">No commands sent yet</p>
            )}
            {commandHistory.map((cmd) => (
              <div key={cmd.id} className="font-mono text-xs bg-[#0c0c14] rounded px-3 py-2 flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <span className="text-blue-400">$ </span>
                  <span className="text-gray-200">{cmd.command}</span>
                  {cmd.params && Object.keys(cmd.params).length > 0 && (
                    <span className="text-gray-500 ml-1">{JSON.stringify(cmd.params)}</span>
                  )}
                  {cmd.response && (
                    <div className={`mt-1 break-all ${cmd.status === 'error' ? 'text-red-400' : 'text-green-400'}`}>
                      {cmd.response}
                    </div>
                  )}
                  <div className="text-gray-600 text-[10px] mt-0.5">
                    {new Date(cmd.sentAt).toLocaleTimeString()}
                  </div>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${
                  cmd.status === 'success' ? 'bg-green-900/50 text-green-300' :
                  cmd.status === 'error' ? 'bg-red-900/50 text-red-300' :
                  'bg-yellow-900/50 text-yellow-300'
                }`}>{cmd.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
