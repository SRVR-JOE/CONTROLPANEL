'use client';

import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/store';
import { useState } from 'react';
import {
  ArrowLeft, Send, Thermometer, Cpu, HardDrive, Zap, Fan, Clock, Wifi, WifiOff,
} from 'lucide-react';
import CompanionDevicePanel from '@/components/companion/CompanionDevicePanel';

const MANUFACTURER_COLORS: Record<string, string> = {
  disguise: '#e91e63', barco: '#00bcd4', brompton: '#4caf50',
  lightware: '#ff9800', aja: '#ffc107', blackmagic: '#607d8b', ross: '#9c27b0',
  yamaha: '#7c3aed', 'allen-heath': '#06b6d4', behringer: '#f97316',
  shure: '#14b8a6', sennheiser: '#64748b', panasonic: '#0ea5e9',
  sony: '#1d4ed8', etc: '#a855f7', 'ma-lighting': '#ec4899',
  qsc: '#84cc16', 'clear-com': '#f43f5e', riedel: '#0d9488',
  magewell: '#6366f1', teradek: '#e11d48', extron: '#059669',
  crestron: '#2563eb', ptzoptics: '#d97706', datavideo: '#7c2d12',
  roland: '#dc2626',
};

const STATUS_COLORS: Record<string, string> = {
  online: '#22c55e', warning: '#f59e0b', error: '#ef4444', offline: '#6b7280',
};

function formatUptime(seconds: number) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}

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
  const [cmdInput, setCmdInput] = useState('');

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

  const handleSend = () => {
    if (!cmdInput.trim()) return;
    sendCommand(device.id, cmdInput.trim());
    setCmdInput('');
  };

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
                ['Category', device.category.replace('-', ' ')],
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

      {/* Companion Modules */}
      <CompanionDevicePanel device={device} />

      {/* Command Console */}
      <div className="bg-[#14141f] rounded-lg border border-[#2a2a3d] p-5">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><Send size={18} /> Command Console</h2>
        <div className="flex gap-2 mb-4">
          <input
            value={cmdInput}
            onChange={(e) => setCmdInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={`Send command to ${device.name}...`}
            className="flex-1 bg-[#0c0c14] border border-[#2a2a3d] rounded-lg px-4 py-2 text-sm font-mono focus:outline-none focus:border-blue-500"
          />
          <button onClick={handleSend} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition flex items-center gap-2">
            <Send size={14} /> Send
          </button>
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {commandHistory.length === 0 && <p className="text-sm text-gray-500">No commands sent yet</p>}
          {commandHistory.map((cmd) => (
            <div key={cmd.id} className="font-mono text-xs bg-[#0c0c14] rounded px-3 py-2 flex items-start justify-between">
              <div>
                <span className="text-blue-400">$ </span>
                <span>{cmd.command}</span>
                {cmd.response && <div className="text-green-400 mt-1">{cmd.response}</div>}
              </div>
              <span className={`text-xs px-1.5 py-0.5 rounded ${
                cmd.status === 'success' ? 'bg-green-900/50 text-green-300' :
                cmd.status === 'error' ? 'bg-red-900/50 text-red-300' :
                'bg-yellow-900/50 text-yellow-300'
              }`}>{cmd.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
