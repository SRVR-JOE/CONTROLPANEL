'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store';
import { DeviceStatus } from '@/types';
import { MANUFACTURER_COLORS, CATEGORY_LABELS, ALL_MANUFACTURERS, ALL_CATEGORIES } from '@/lib/constants';
import AddDeviceDialog from '@/components/devices/AddDeviceDialog';
import {
  HardDrive,
  Filter,
  Thermometer,
  Server,
  Plus,
  Trash2,
} from 'lucide-react';

const statusColors: Record<DeviceStatus, string> = {
  online: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
  offline: 'bg-muted',
};

const allStatuses: DeviceStatus[] = ['online', 'warning', 'error', 'offline'];

export default function DevicesPage() {
  const devices = useStore((s) => s.devices);
  const racks = useStore((s) => s.racks);
  const removeDevice = useStore((s) => s.removeDevice);
  const router = useRouter();

  const [filterManufacturer, setFilterManufacturer] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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

  const handleDelete = (e: React.MouseEvent, deviceId: string) => {
    e.stopPropagation();
    if (deleteConfirmId === deviceId) {
      removeDevice(deviceId);
      setDeleteConfirmId(null);
    } else {
      setDeleteConfirmId(deviceId);
      // Auto-reset confirmation after 3 seconds
      setTimeout(() => setDeleteConfirmId((prev) => (prev === deviceId ? null : prev)), 3000);
    }
  };

  return (
    <div className="min-h-screen pl-16 pt-10">
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Devices</h1>
            <p className="mt-1 text-sm text-muted">
              {filteredDevices.length} of {devices.length} devices
            </p>
          </div>
          <button
            onClick={() => setAddDialogOpen(true)}
            className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/80"
          >
            <Plus className="h-4 w-4" />
            Add Device
          </button>
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
            {ALL_MANUFACTURERS.map((m) => (
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
            {ALL_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
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
                  <th className="w-10 px-2 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filteredDevices.map((device) => {
                  const mfgColor = MANUFACTURER_COLORS[device.manufacturer];
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
                        </div>
                      </td>

                      {/* Delete */}
                      <td className="px-2 py-3">
                        <button
                          onClick={(e) => handleDelete(e, device.id)}
                          className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
                            deleteConfirmId === device.id
                              ? 'bg-error/10 text-error hover:bg-error/20'
                              : 'text-muted hover:bg-surface-2 hover:text-foreground'
                          }`}
                          title={deleteConfirmId === device.id ? 'Click again to confirm' : 'Delete device'}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
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

      {/* Add Device Dialog */}
      <AddDeviceDialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} />
    </div>
  );
}
