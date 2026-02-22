'use client';

import { useMemo } from 'react';
import { useStore } from '@/store';
import {
  X,
  Thermometer,
  Clock,
  Hash,
  Cpu,
  AlertTriangle,
  CheckCircle,
  WifiOff,
  Zap,
  Palette,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import type { LEDTileErrorType } from '@/types';

const ERROR_TYPE_ICONS: Record<LEDTileErrorType, React.ReactNode> = {
  'high-temperature': <Thermometer className="h-3 w-3" />,
  'communication-lost': <WifiOff className="h-3 w-3" />,
  'driver-fault': <AlertCircle className="h-3 w-3" />,
  'power-fault': <Zap className="h-3 w-3" />,
  'color-calibration': <Palette className="h-3 w-3" />,
  'pixel-failure': <Sparkles className="h-3 w-3" />,
};

const ERROR_TYPE_LABELS: Record<LEDTileErrorType, string> = {
  'high-temperature': 'High Temperature',
  'communication-lost': 'Communication Lost',
  'driver-fault': 'Driver Fault',
  'power-fault': 'Power Fault',
  'color-calibration': 'Color Calibration',
  'pixel-failure': 'Pixel Failure',
};

function statusBadge(status: string) {
  const configs = {
    online: { color: 'text-green-400', bg: 'bg-green-500/10', ring: 'ring-green-500/20', icon: <CheckCircle className="h-3 w-3" /> },
    warning: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', ring: 'ring-yellow-500/20', icon: <AlertTriangle className="h-3 w-3" /> },
    error: { color: 'text-red-400', bg: 'bg-red-500/10', ring: 'ring-red-500/20', icon: <AlertTriangle className="h-3 w-3" /> },
    offline: { color: 'text-[#6b7280]', bg: 'bg-[#1c1c2b]', ring: 'ring-[#2a2a3d]', icon: <WifiOff className="h-3 w-3" /> },
    unknown: { color: 'text-[#6b7280]', bg: 'bg-[#1c1c2b]', ring: 'ring-[#2a2a3d]', icon: <AlertCircle className="h-3 w-3" /> },
  };
  const cfg = configs[status as keyof typeof configs] ?? configs.unknown;
  return (
    <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ${cfg.color} ${cfg.bg} ${cfg.ring}`}>
      {cfg.icon}
      {status}
    </span>
  );
}

function tempColor(temp: number): string {
  if (temp === 0) return '#6b7280';
  if (temp < 38) return '#22c55e';
  if (temp < 44) return '#84cc16';
  if (temp < 48) return '#eab308';
  if (temp < 52) return '#f59e0b';
  return '#ef4444';
}

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return iso;
  }
}

export default function TileDetailPanel() {
  const selectedTileId = useStore((s) => s.selectedTileId);
  const selectedBromptonProcessorId = useStore((s) => s.selectedBromptonProcessorId);
  const bromptonStatuses = useStore((s) => s.bromptonStatuses);
  const devices = useStore((s) => s.devices);
  const setSelectedTile = useStore((s) => s.setSelectedTile);

  const processorStatus = useMemo(
    () => bromptonStatuses.find((s) => s.deviceId === selectedBromptonProcessorId),
    [bromptonStatuses, selectedBromptonProcessorId]
  );

  const tile = useMemo(
    () => processorStatus?.tiles?.find((t) => t.id === selectedTileId) ?? null,
    [processorStatus, selectedTileId]
  );

  const processorDevice = useMemo(
    () => devices.find((d) => d.id === selectedBromptonProcessorId),
    [devices, selectedBromptonProcessorId]
  );

  if (!tile) return null;

  const tc = tempColor(tile.temperature);

  return (
    <div className="w-80 shrink-0 rounded-lg bg-[#14141f] border border-[#2a2a3d] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a3d]">
        <div>
          <span className="text-sm font-bold text-[#e0e0e8]">
            Panel {tile.chainIndex + 1}-{tile.positionInChain + 1}
          </span>
          <p className="text-[10px] text-[#6b7280] mt-0.5">
            Chain {tile.chainIndex + 1}, Position {tile.positionInChain + 1}
          </p>
        </div>
        <button
          onClick={() => setSelectedTile(null)}
          className="rounded-md p-1.5 text-[#6b7280] hover:bg-[#1c1c2b] hover:text-[#e0e0e8] transition-colors"
          title="Close panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Status + Temperature */}
        <div className="flex items-center justify-between">
          {statusBadge(tile.status)}
          {tile.status !== 'offline' && (
            <div className="flex items-center gap-1.5">
              <Thermometer className="h-4 w-4" style={{ color: tc }} />
              <span className="text-2xl font-bold font-mono" style={{ color: tc }}>
                {Math.round(tile.temperature)}
              </span>
              <span className="text-[#6b7280] text-sm">°C</span>
            </div>
          )}
        </div>

        {/* Location details */}
        <div className="rounded-lg bg-[#1c1c2b] border border-[#2a2a3d] p-3 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6b7280] mb-2">Location</p>

          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-[#6b7280]">
              <Hash className="h-3 w-3" />
              Chain
            </span>
            <span className="font-mono text-[#e0e0e8]">{tile.chainIndex + 1}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-[#6b7280]">
              <Hash className="h-3 w-3" />
              Position
            </span>
            <span className="font-mono text-[#e0e0e8]">{tile.positionInChain + 1}</span>
          </div>

          {processorDevice && (
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-[#6b7280]">
                <Cpu className="h-3 w-3" />
                Processor
              </span>
              <span className="text-[#e0e0e8] truncate ml-2 text-right">{processorDevice.name}</span>
            </div>
          )}
        </div>

        {/* Metadata */}
        {(tile.serialNumber || tile.firmwareVersion) && (
          <div className="rounded-lg bg-[#1c1c2b] border border-[#2a2a3d] p-3 space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6b7280] mb-2">Panel Info</p>

            {tile.serialNumber && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#6b7280]">Serial</span>
                <span className="font-mono text-[#e0e0e8] text-[10px]">{tile.serialNumber}</span>
              </div>
            )}

            {tile.firmwareVersion && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#6b7280]">Firmware</span>
                <span className="font-mono text-[#e0e0e8]">{tile.firmwareVersion}</span>
              </div>
            )}
          </div>
        )}

        {/* Errors */}
        {tile.errors.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6b7280]">
              Active Errors ({tile.errors.length})
            </p>
            {tile.errors.map((err, i) => (
              <div
                key={i}
                className={`rounded-lg border p-3 space-y-1.5 ${
                  err.severity === 'error'
                    ? 'bg-red-500/5 border-red-500/20'
                    : 'bg-yellow-500/5 border-yellow-500/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`flex items-center gap-1.5 text-[11px] font-semibold ${
                      err.severity === 'error' ? 'text-red-400' : 'text-yellow-400'
                    }`}
                  >
                    <span className={err.severity === 'error' ? 'text-red-400' : 'text-yellow-400'}>
                      {ERROR_TYPE_ICONS[err.type]}
                    </span>
                    {ERROR_TYPE_LABELS[err.type]}
                  </span>
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                      err.severity === 'error'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}
                  >
                    {err.severity}
                  </span>
                </div>
                <p className="text-[11px] text-[#6b7280]">{err.message}</p>
                <div className="flex items-center gap-1 text-[10px] text-[#6b7280]">
                  <Clock className="h-2.5 w-2.5" />
                  {formatTimestamp(err.timestamp)}
                </div>
              </div>
            ))}
          </div>
        )}

        {tile.errors.length === 0 && tile.status !== 'offline' && (
          <div className="flex items-center gap-2 text-[11px] text-green-400 bg-green-500/5 rounded-lg px-3 py-2 border border-green-500/10">
            <CheckCircle className="h-3 w-3 shrink-0" />
            No active errors
          </div>
        )}

        {/* Last seen */}
        <div className="flex items-center gap-1.5 text-[10px] text-[#6b7280] pt-1 border-t border-[#2a2a3d]">
          <Clock className="h-3 w-3" />
          Last seen: {formatTimestamp(tile.lastSeen)}
        </div>
      </div>
    </div>
  );
}
