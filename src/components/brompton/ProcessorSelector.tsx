'use client';

import { useStore } from '@/store';
import { Signal, WifiOff, AlertTriangle } from 'lucide-react';

export default function ProcessorSelector() {
  const devices = useStore((s) => s.devices);
  const bromptonStatuses = useStore((s) => s.bromptonStatuses);
  const selectedBromptonProcessorId = useStore((s) => s.selectedBromptonProcessorId);
  const setSelectedBromptonProcessor = useStore((s) => s.setSelectedBromptonProcessor);

  const processors = bromptonStatuses.map((status) => {
    const device = devices.find((d) => d.id === status.deviceId);
    return device ? { status, device } : null;
  }).filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <div className="flex items-center gap-1 overflow-x-auto rounded-lg bg-[#14141f] border border-[#2a2a3d] p-1">
      {processors.map(({ status, device }) => {
        const isActive = device.id === selectedBromptonProcessorId;
        const linkColors = {
          active: '#22c55e',
          degraded: '#f59e0b',
          lost: '#ef4444',
        };
        const linkColor = linkColors[status.linkStatus];
        const offlinePanels = status.totalPanels - status.onlinePanels;

        return (
          <button
            key={device.id}
            onClick={() => setSelectedBromptonProcessor(device.id)}
            className={`flex items-center gap-2.5 rounded-md px-3.5 py-2 text-sm font-medium transition-all duration-150 whitespace-nowrap ${
              isActive
                ? 'bg-[#1c1c2b] text-[#e0e0e8] shadow-sm'
                : 'text-[#6b7280] hover:bg-[#1c1c2b]/50 hover:text-[#e0e0e8]'
            }`}
          >
            {/* Link status indicator */}
            <div className="flex items-center gap-1.5">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor: linkColor,
                  boxShadow: isActive ? `0 0 6px ${linkColor}60` : 'none',
                }}
              />
            </div>

            {/* Device name */}
            <span className="text-xs">{device.name}</span>

            {/* Panel count badge */}
            <span className="flex items-center gap-1 rounded bg-[#0c0c14] px-1.5 py-0.5 text-[10px] text-[#6b7280]">
              {offlinePanels === 0 ? (
                <Signal className="h-2.5 w-2.5" />
              ) : (
                <AlertTriangle className="h-2.5 w-2.5 text-yellow-400" />
              )}
              <span className={offlinePanels > 0 ? 'text-yellow-400' : ''}>
                {status.onlinePanels}/{status.totalPanels}
              </span>
            </span>

            {/* Link status label */}
            <span
              className="text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: linkColor }}
            >
              {status.linkStatus === 'active' ? 'Active' : status.linkStatus === 'degraded' ? 'Degraded' : 'Lost'}
            </span>

            {/* Offline badge */}
            {device.status === 'offline' && (
              <span className="flex items-center gap-1 rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] text-red-400">
                <WifiOff className="h-2.5 w-2.5" />
                Offline
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
