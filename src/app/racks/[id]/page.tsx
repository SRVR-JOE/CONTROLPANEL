'use client';

import { useMemo } from 'react';
import { useStore } from '@/store';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Thermometer,
  Cpu,
  HardDrive,
  Activity,
  Zap,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import RackView from '@/components/rack/RackView';
import { MANUFACTURER_COLORS, STATUS_COLORS } from '@/lib/constants';
import { formatUptime } from '@/lib/utils';
import { Device } from '@/types';

function TempDisplay({
  label,
  value,
  large = false,
}: {
  label: string;
  value?: number;
  large?: boolean;
}) {
  if (value == null) return null;

  let colorClass = 'text-sky-400';
  let bgClass = 'temp-cool';
  if (value > 40) {
    colorClass = 'text-red-400';
    bgClass = 'temp-hot';
  } else if (value > 30) {
    colorClass = 'text-amber-400';
    bgClass = 'temp-warm';
  }

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg ${bgClass}`}
      style={{
        padding: large ? '16px 24px' : '12px 16px',
        minWidth: large ? '140px' : '100px',
      }}
    >
      <Thermometer size={large ? 20 : 16} className={colorClass} />
      <span
        className={colorClass}
        style={{
          fontSize: large ? '28px' : '20px',
          fontWeight: 700,
          lineHeight: 1.2,
          marginTop: '4px',
        }}
      >
        {value.toFixed(1)}&deg;C
      </span>
      <span
        style={{
          fontSize: large ? '12px' : '10px',
          color: 'var(--muted)',
          marginTop: '2px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ============================================================
// Device health card
// ============================================================

function DeviceHealthCard({ device }: { device: Device }) {
  const color = MANUFACTURER_COLORS[device.manufacturer];
  const statusColor = STATUS_COLORS[device.status];
  const h = device.health;

  return (
    <div
      className="glass-card overflow-hidden"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      {/* Device header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: statusColor,
              boxShadow: `0 0 6px ${statusColor}`,
            }}
          />
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>
              {device.name}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
              {device.manufacturer} {device.model} &middot; RU {device.rackSlot}
              {device.rackUnits > 1 ? `-${(device.rackSlot ?? 0) + device.rackUnits - 1}` : ''}
              &middot; {device.rackUnits}U
            </div>
          </div>
        </div>
        <div
          className="px-2 py-1 rounded"
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: statusColor,
            background: `${statusColor}18`,
            textTransform: 'uppercase',
          }}
        >
          {device.status}
        </div>
      </div>

      {/* Health metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4">
        {/* Temperature */}
        <div className="flex items-center gap-2">
          <Thermometer size={14} className="text-amber-400" />
          <div>
            <div style={{ fontSize: '10px', color: 'var(--muted)' }}>Temp</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>
              {h.temperature.toFixed(1)}&deg;C
            </div>
          </div>
        </div>

        {/* CPU */}
        {h.cpuUsage != null && (
          <div className="flex items-center gap-2">
            <Cpu size={14} className="text-blue-400" />
            <div>
              <div style={{ fontSize: '10px', color: 'var(--muted)' }}>CPU</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>
                {h.cpuUsage.toFixed(0)}%
              </div>
            </div>
          </div>
        )}

        {/* Memory */}
        {h.memoryUsage != null && (
          <div className="flex items-center gap-2">
            <HardDrive size={14} className="text-purple-400" />
            <div>
              <div style={{ fontSize: '10px', color: 'var(--muted)' }}>Memory</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>
                {h.memoryUsage.toFixed(0)}%
              </div>
            </div>
          </div>
        )}

        {/* GPU */}
        {h.gpuUsage != null && (
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-green-400" />
            <div>
              <div style={{ fontSize: '10px', color: 'var(--muted)' }}>GPU</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>
                {h.gpuUsage.toFixed(0)}%
                {h.gpuTemp != null && (
                  <span style={{ fontSize: '10px', color: 'var(--muted)', marginLeft: '4px' }}>
                    ({h.gpuTemp.toFixed(0)}&deg;)
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Power */}
        {h.powerDraw != null && (
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-yellow-400" />
            <div>
              <div style={{ fontSize: '10px', color: 'var(--muted)' }}>Power</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>
                {h.powerDraw.toFixed(0)}W
              </div>
            </div>
          </div>
        )}

        {/* Uptime */}
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-cyan-400" />
          <div>
            <div style={{ fontSize: '10px', color: 'var(--muted)' }}>Uptime</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>
              {formatUptime(h.uptime)}
            </div>
          </div>
        </div>
      </div>

      {/* Warnings / Errors */}
      {(h.warnings.length > 0 || h.errors.length > 0) && (
        <div className="px-4 pb-3 flex flex-col gap-1">
          {h.errors.map((err, i) => (
            <div
              key={`err-${i}`}
              className="flex items-center gap-2 px-2 py-1 rounded"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                fontSize: '11px',
                color: '#ef4444',
              }}
            >
              <AlertTriangle size={12} />
              {err}
            </div>
          ))}
          {h.warnings.map((warn, i) => (
            <div
              key={`warn-${i}`}
              className="flex items-center gap-2 px-2 py-1 rounded"
              style={{
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                fontSize: '11px',
                color: '#f59e0b',
              }}
            >
              <AlertTriangle size={12} />
              {warn}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Single rack detail page
// ============================================================

export default function RackDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rackId = params.id as string;

  const racks = useStore((s) => s.racks);
  const devices = useStore((s) => s.devices);

  const rack = useMemo(() => racks.find((r) => r.id === rackId), [racks, rackId]);

  // All devices installed in this rack
  const rackDevices = useMemo(
    () =>
      devices
        .filter((d) => d.rackId === rackId)
        .sort((a, b) => (a.rackSlot ?? 0) - (b.rackSlot ?? 0)),
    [devices, rackId]
  );

  // Utilization stats
  const occupiedSlots = useMemo(() => {
    if (!rack) return 0;
    return rack.slots.filter((s) => s.deviceId).length;
  }, [rack]);

  if (!rack) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--background)' }}
      >
        <div className="text-center">
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>404</div>
          <div style={{ fontSize: '16px', color: 'var(--muted)', marginBottom: '24px' }}>
            Rack not found
          </div>
          <button
            onClick={() => router.push('/racks')}
            className="flex items-center gap-2 mx-auto"
            style={{
              background: 'var(--accent)',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={14} />
            Back to Racks
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Page header */}
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/racks')}
            className="flex items-center justify-center"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              cursor: 'pointer',
              color: 'var(--foreground)',
            }}
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: 'var(--foreground)',
                margin: 0,
              }}
            >
              {rack.name}
            </h1>
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
              {rack.location} &middot; {rack.totalRU}U &middot; {rackDevices.length} device
              {rackDevices.length !== 1 ? 's' : ''} &middot;{' '}
              {((occupiedSlots / rack.totalRU) * 100).toFixed(0)}% utilized
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col lg:flex-row gap-6 p-6">
        {/* Left: Rack visualization */}
        <div className="flex-shrink-0">
          <RackView rack={rack} />
        </div>

        {/* Right: Details */}
        <div className="flex-1 flex flex-col gap-6 min-w-0">
          {/* Temperature readings */}
          <div className="glass-card p-4">
            <h2
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: 'var(--foreground)',
                marginBottom: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Temperature Readings
            </h2>
            <div className="flex flex-wrap gap-4">
              <TempDisplay label="Inlet" value={rack.inletTemp} large />
              <TempDisplay label="Exhaust" value={rack.exhaustTemp} large />
              <TempDisplay label="Ambient" value={rack.ambientTemp} large />
              {rack.inletTemp != null && rack.exhaustTemp != null && (
                <div
                  className="flex flex-col items-center justify-center rounded-lg"
                  style={{
                    padding: '16px 24px',
                    minWidth: '140px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <Activity size={20} className="text-orange-400" />
                  <span
                    className="text-orange-400"
                    style={{
                      fontSize: '28px',
                      fontWeight: 700,
                      lineHeight: 1.2,
                      marginTop: '4px',
                    }}
                  >
                    +{(rack.exhaustTemp - rack.inletTemp).toFixed(1)}&deg;C
                  </span>
                  <span
                    style={{
                      fontSize: '12px',
                      color: 'var(--muted)',
                      marginTop: '2px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Delta
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Device list */}
          <div>
            <h2
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: 'var(--foreground)',
                marginBottom: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Installed Devices ({rackDevices.length})
            </h2>
            <div className="flex flex-col gap-3">
              {rackDevices.length === 0 ? (
                <div
                  className="glass-card p-6 text-center"
                  style={{ color: 'var(--muted)', fontSize: '13px' }}
                >
                  No devices installed in this rack.
                </div>
              ) : (
                rackDevices.map((device) => (
                  <DeviceHealthCard key={device.id} device={device} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
