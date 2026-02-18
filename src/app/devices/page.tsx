'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store';
import { DeviceManufacturer, DeviceCategory, DeviceStatus } from '@/types';
import {
  HardDrive,
  Filter,
  Thermometer,
  Server,
} from 'lucide-react';

const manufacturerColors: Record<DeviceManufacturer, string> = {
  disguise: '#e91e63',
  barco: '#00bcd4',
  brompton: '#4caf50',
  lightware: '#ff9800',
  aja: '#ffc107',
  blackmagic: '#607d8b',
  ross: '#9c27b0',
};

const statusColors: Record<DeviceStatus, string> = {
  online: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
  offline: 'bg-muted',
};

const categoryLabels: Record<DeviceCategory, string> = {
  'media-server': 'Media Server',
  'led-processor': 'LED Processor',
  'matrix-switcher': 'Matrix Switcher',
  'video-processor': 'Video Processor',
  converter: 'Converter',
  'production-switcher': 'Production Switcher',
};

const allManufacturers: DeviceManufacturer[] = [
  'disguise', 'barco', 'brompton', 'lightware', 'aja', 'blackmagic', 'ross',
];

const allCategories: DeviceCategory[] = [
  'media-server', 'led-processor', 'matrix-switcher', 'video-processor', 'converter', 'production-switcher',
];

const allStatuses: DeviceStatus[] = ['online', 'warning', 'error', 'offline'];

export default function DevicesPage() {
  const devices = useStore((s) => s.devices);
  const racks = useStore((s) => s.racks);
  const router = useRouter();

  const [filterManufacturer, setFilterManufacturer] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredDevices = devices.filter((d) => {
    if (filterManufacturer !== 'all' && d.manufacturer !== filterManufacturer) return false;
    if (filterCategory !== 'all' && d.category !== filterCategory) return false;
    if (filterStatus !== 'all' && d.status !== filterStatus) return false;
    return true;
  });

  const getRackName = (rackId?: string) => {
    if (!rackId) return '-';
    const rack = racks.find((r) => r.id === rackId);
    return rack ? rack.name : '-';
  };

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        {/* Page header */}
        <div>
          <h1 className="text-xl font-bold text-foreground">Devices</h1>
          <p className="mt-1 text-sm text-muted">
            {filteredDevices.length} of {devices.length} devices
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="h-4 w-4 text-muted" />

          <select
            value={filterManufacturer}
            onChange={(e) => setFilterManufacturer(e.target.value)}
            className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-foreground outline-none transition-colors focus:border-accent"
          >
            <option value="all">All Manufacturers</option>
            {allManufacturers.map((m) => (
              <option key={m} value={m}>
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </option>
            ))}
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-foreground outline-none transition-colors focus:border-accent"
          >
            <option value="all">All Categories</option>
            {allCategories.map((c) => (
              <option key={c} value={c}>
                {categoryLabels[c]}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-foreground outline-none transition-colors focus:border-accent"
          >
            <option value="all">All Status</option>
            {allStatuses.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Device table */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted">Manufacturer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted">Model</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted">IP Address</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted">Rack / Slot</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted">Temp</th>
                </tr>
              </thead>
              <tbody>
                {filteredDevices.map((device) => {
                  const mfgColor = manufacturerColors[device.manufacturer];
                  return (
                    <tr
                      key={device.id}
                      onClick={() => router.push(`/devices/${device.id}`)}
                      className="cursor-pointer border-b border-border/50 transition-colors hover:bg-surface-2/50"
                    >
                      {/* Name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <HardDrive className="h-4 w-4 flex-shrink-0 text-muted" />
                          <span className="text-sm font-medium text-foreground">
                            {device.name}
                          </span>
                        </div>
                      </td>

                      {/* Manufacturer badge */}
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
                          style={{
                            backgroundColor: `${mfgColor}18`,
                            color: mfgColor,
                          }}
                        >
                          <span
                            className="inline-block h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: mfgColor }}
                          />
                          {device.manufacturer.charAt(0).toUpperCase() +
                            device.manufacturer.slice(1)}
                        </span>
                      </td>

                      {/* Model */}
                      <td className="px-4 py-3 text-sm text-muted">{device.model}</td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-block h-2 w-2 rounded-full ${statusColors[device.status]} ${
                              device.status === 'warning' || device.status === 'error'
                                ? 'status-pulse'
                                : ''
                            }`}
                          />
                          <span className="text-xs text-foreground">
                            {device.status.charAt(0).toUpperCase() + device.status.slice(1)}
                          </span>
                        </div>
                      </td>

                      {/* IP */}
                      <td className="px-4 py-3 font-mono text-sm text-muted">
                        {device.ipAddress}
                      </td>

                      {/* Rack / Slot */}
                      <td className="px-4 py-3">
                        {device.rackId ? (
                          <div className="flex items-center gap-1.5">
                            <Server className="h-3.5 w-3.5 text-muted" />
                            <span className="text-xs text-foreground">
                              {getRackName(device.rackId)}
                            </span>
                            {device.rackSlot && (
                              <span className="text-xs text-muted">
                                / U{device.rackSlot}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted">-</span>
                        )}
                      </td>

                      {/* Temperature */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Thermometer className="h-3.5 w-3.5 text-muted" />
                          {device.health.temperature != null ? (
                            <span
                              className={`font-mono text-sm ${
                                device.health.temperature > 55
                                  ? 'text-error'
                                  : device.health.temperature > 40
                                    ? 'text-warning'
                                    : 'text-success'
                              }`}
                            >
                              {device.health.temperature.toFixed(1)}&deg;C
                            </span>
                          ) : (
                            <span className="font-mono text-sm text-muted">N/A</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredDevices.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <HardDrive className="mb-3 h-8 w-8 text-muted" />
              <p className="text-sm text-muted">No devices match the current filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
