'use client';

import { useMemo } from 'react';
import { useStore } from '@/store';
import type { LEDTileStatus } from '@/types';

interface StatusCount {
  status: LEDTileStatus;
  label: string;
  count: number;
  color: string;
  bg: string;
  ring: string;
}

export default function TileStatusSummary() {
  const selectedBromptonProcessorId = useStore((s) => s.selectedBromptonProcessorId);
  const bromptonStatuses = useStore((s) => s.bromptonStatuses);

  const tiles = useMemo(() => {
    const processorStatus = bromptonStatuses.find(
      (s) => s.deviceId === selectedBromptonProcessorId
    );
    return processorStatus?.tiles ?? [];
  }, [bromptonStatuses, selectedBromptonProcessorId]);

  const counts = useMemo<StatusCount[]>(() => {
    const online = tiles.filter((t) => t.status === 'online').length;
    const warning = tiles.filter((t) => t.status === 'warning').length;
    const error = tiles.filter((t) => t.status === 'error').length;
    const offline = tiles.filter((t) => t.status === 'offline').length;

    return [
      {
        status: 'online',
        label: 'Online',
        count: online,
        color: 'text-green-400',
        bg: 'bg-green-500/10',
        ring: 'ring-green-500/20',
      },
      {
        status: 'warning',
        label: 'Warning',
        count: warning,
        color: 'text-yellow-400',
        bg: 'bg-yellow-500/10',
        ring: 'ring-yellow-500/20',
      },
      {
        status: 'error',
        label: 'Error',
        count: error,
        color: 'text-red-400',
        bg: 'bg-red-500/10',
        ring: 'ring-red-500/20',
      },
      {
        status: 'offline',
        label: 'Offline',
        count: offline,
        color: 'text-[#6b7280]',
        bg: 'bg-[#1c1c2b]',
        ring: 'ring-[#2a2a3d]',
      },
    ];
  }, [tiles]);

  if (tiles.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      {counts.map((item) => (
        <div
          key={item.status}
          className={`flex items-center gap-2 rounded-lg px-3 py-1.5 ring-1 ${item.bg} ${item.ring} cursor-default transition-all`}
          title={`${item.count} ${item.label.toLowerCase()} panels`}
        >
          <div
            className="h-2 w-2 rounded-full"
            style={{
              backgroundColor:
                item.status === 'online'
                  ? '#22c55e'
                  : item.status === 'warning'
                  ? '#f59e0b'
                  : item.status === 'error'
                  ? '#ef4444'
                  : '#374151',
            }}
          />
          <span className={`text-xs font-bold font-mono ${item.color}`}>
            {item.count}
          </span>
          <span className="text-[10px] text-[#6b7280]">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
