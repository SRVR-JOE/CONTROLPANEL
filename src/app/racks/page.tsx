'use client';

import React, { useState } from 'react';
import { useStore } from '@/store';
import { Plus, Server } from 'lucide-react';
import RackView from '@/components/rack/RackView';
import DeviceSlotAssigner from '@/components/rack/DeviceSlotAssigner';
import { useRouter } from 'next/navigation';

// ============================================================
// Racks overview page
// ============================================================

export default function RacksPage() {
  const racks = useStore((s) => s.racks);
  const [assignerOpen, setAssignerOpen] = useState(false);
  const router = useRouter();

  const handleDeviceClick = (id: string) => {
    router.push(`/devices/${id}`);
  };

  const handleRackClick = (rackId: string) => {
    router.push(`/racks/${rackId}`);
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Page header */}
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <Server size={20} style={{ color: 'var(--accent)' }} />
          <h1
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: 'var(--foreground)',
              margin: 0,
            }}
          >
            Rack Overview
          </h1>
          <span
            style={{
              fontSize: '12px',
              color: 'var(--muted)',
              background: 'var(--surface)',
              padding: '2px 8px',
              borderRadius: '10px',
            }}
          >
            {racks.length} rack{racks.length !== 1 ? 's' : ''}
          </span>
        </div>

        <button
          onClick={() => setAssignerOpen(true)}
          className="flex items-center gap-2"
          style={{
            background: 'var(--accent)',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 16px',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'opacity 0.15s ease',
          }}
        >
          <Plus size={14} />
          Add Device to Rack
        </button>
      </div>

      {/* Racks grid */}
      <div
        className="p-6"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '24px',
          alignItems: 'flex-start',
        }}
      >
        {racks.map((rack) => (
          <div key={rack.id} className="flex flex-col gap-2">
            <div
              onClick={() => handleRackClick(rack.id)}
              style={{ cursor: 'pointer' }}
              title={`Click to view ${rack.name} detail`}
            >
              <RackView
                rack={rack}
                onDeviceClick={handleDeviceClick}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Device slot assigner modal */}
      <DeviceSlotAssigner open={assignerOpen} onClose={() => setAssignerOpen(false)} />
    </div>
  );
}
