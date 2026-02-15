'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store';
import { DeviceManufacturer, DeviceCategory, DeviceStatus } from '@/types';
import {
  HardDrive,
  Filter,
  Thermometer,
  Server,
  LayoutGrid,
  List,
  ChevronDown,
  ChevronRight,
  Blocks,
} from 'lucide-react';

const MANUFACTURER_COLORS: Record<DeviceManufacturer, string> = {
  disguise: '#e91e63',
  barco: '#00bcd4',
  brompton: '#4caf50',
  lightware: '#ff9800',
  aja: '#ffc107',
  blackmagic: '#607d8b',
  ross: '#9c27b0',
};

const MANUFACTURER_LABELS: Record<DeviceManufacturer, string> = {
  disguise: 'disguise',
  barco: 'Barco',
  brompton: 'Brompton',
  lightware: 'Lightware',
  aja: 'AJA',
  blackmagic: 'Blackmagic Design',
  ross: 'Ross Video',
};

const STATUS_COLORS: Record<DeviceStatus, string> = {
  online: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  offline: '#6b7280',
};

const CATEGORY_LABELS: Record<DeviceCategory, string> = {
  'media-server': 'Media Server',
  'led-processor': 'LED Processor',
  'matrix-switcher': 'Matrix / Router',
  'video-processor': 'Video Processor',
  converter: 'Converter',
  'production-switcher': 'Production Switcher',
};

const ALL_MANUFACTURERS: DeviceManufacturer[] = [
  'disguise', 'barco', 'brompton', 'lightware', 'aja', 'blackmagic', 'ross',
];

const ALL_CATEGORIES: DeviceCategory[] = [
  'media-server', 'led-processor', 'matrix-switcher', 'video-processor', 'converter', 'production-switcher',
];

const ALL_STATUSES: DeviceStatus[] = ['online', 'warning', 'error', 'offline'];

type ViewMode = 'table' | 'grid';

export default function DevicesPage() {
  const devices = useStore((s) => s.devices);
  const racks = useStore((s) => s.racks);
  const router = useRouter();

  const [filterManufacturer, setFilterManufacturer] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [collapsedMfgs, setCollapsedMfgs] = useState<Set<string>>(new Set());

  const filteredDevices = useMemo(() => devices.filter((d) => {
    if (filterManufacturer !== 'all' && d.manufacturer !== filterManufacturer) return false;
    if (filterCategory !== 'all' && d.category !== filterCategory) return false;
    if (filterStatus !== 'all' && d.status !== filterStatus) return false;
    return true;
  }), [devices, filterManufacturer, filterCategory, filterStatus]);

  const groupedByManufacturer = useMemo(() => {
    const groups: Record<string, typeof filteredDevices> = {};
    for (const mfg of ALL_MANUFACTURERS) {
      const devs = filteredDevices.filter((d) => d.manufacturer === mfg);
      if (devs.length > 0) groups[mfg] = devs;
    }
    return groups;
  }, [filteredDevices]);

  const statusCounts = useMemo(() => {
    const counts = { online: 0, warning: 0, error: 0, offline: 0 };
    for (const d of devices) counts[d.status]++;
    return counts;
  }, [devices]);

  const getRackName = (rackId?: string) => {
    if (!rackId) return null;
    return racks.find((r) => r.id === rackId)?.name ?? null;
  };

  const toggleMfg = (mfg: string) => {
    setCollapsedMfgs((prev) => {
      const next = new Set(prev);
      if (next.has(mfg)) next.delete(mfg); else next.add(mfg);
      return next;
    });
  };

  return (
    <div className="min-h-screen pl-16 pt-10">
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Device Catalog</h1>
            <p className="mt-1 text-sm text-muted">
              {filteredDevices.length} of {devices.length} devices across {Object.keys(groupedByManufacturer).length} manufacturers
            </p>
          </div>
          {/* Status pills */}
          <div className="flex items-center gap-3">
            {ALL_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(filterStatus === s ? 'all' : s)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                  filterStatus === s ? 'ring-1 ring-white/20' : 'opacity-70 hover:opacity-100'
                }`}
                style={{ backgroundColor: `${STATUS_COLORS[s]}18`, color: STATUS_COLORS[s] }}
              >
                <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[s] }} />
                {statusCounts[s]} {s}
              </button>
            ))}
          </div>
        </div>

        {/* Filters & View Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <Filter className="h-4 w-4 text-muted" />
            <select
              value={filterManufacturer}
              onChange={(e) => setFilterManufacturer(e.target.value)}
              className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-foreground outline-none focus:border-accent"
            >
              <option value="all">All Manufacturers</option>
              {ALL_MANUFACTURERS.map((m) => (
                <option key={m} value={m}>{MANUFACTURER_LABELS[m]}</option>
              ))}
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-foreground outline-none focus:border-accent"
            >
              <option value="all">All Categories</option>
              {ALL_CATEGORIES.map((c) => (
                <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1 rounded-md border border-border bg-surface p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`rounded p-1.5 transition ${viewMode === 'grid' ? 'bg-accent/20 text-accent' : 'text-muted hover:text-foreground'}`}
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`rounded p-1.5 transition ${viewMode === 'table' ? 'bg-accent/20 text-accent' : 'text-muted hover:text-foreground'}`}
            >
              <List size={14} />
            </button>
          </div>
        </div>

        {/* Grouped Device List */}
        {viewMode === 'grid' ? (
          <div className="space-y-6">
            {Object.entries(groupedByManufacturer).map(([mfg, devs]) => {
              const color = MANUFACTURER_COLORS[mfg as DeviceManufacturer];
              const isCollapsed = collapsedMfgs.has(mfg);
              return (
                <div key={mfg} className="rounded-lg border border-border bg-surface overflow-hidden">
                  {/* Manufacturer Header */}
                  <button
                    onClick={() => toggleMfg(mfg)}
                    className="flex w-full items-center gap-3 px-5 py-3 transition hover:bg-surface-2/50"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-md" style={{ backgroundColor: `${color}20` }}>
                      <span className="text-xs font-bold" style={{ color }}>{mfg.slice(0, 2).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 text-left">
                      <span className="text-sm font-semibold" style={{ color }}>{MANUFACTURER_LABELS[mfg as DeviceManufacturer]}</span>
                      <span className="ml-2 text-xs text-muted">{devs.length} device{devs.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-2 mr-2">
                      {['online', 'warning', 'error', 'offline'].map((s) => {
                        const count = devs.filter((d) => d.status === s).length;
                        if (count === 0) return null;
                        return (
                          <span key={s} className="flex items-center gap-1 text-[10px]" style={{ color: STATUS_COLORS[s as DeviceStatus] }}>
                            <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[s as DeviceStatus] }} />
                            {count}
                          </span>
                        );
                      })}
                    </div>
                    {isCollapsed ? <ChevronRight size={16} className="text-muted" /> : <ChevronDown size={16} className="text-muted" />}
                  </button>

                  {/* Device Cards */}
                  {!isCollapsed && (
                    <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {devs.map((device) => {
                        const rackName = getRackName(device.rackId);
                        return (
                          <div
                            key={device.id}
                            onClick={() => router.push(`/devices/${device.id}`)}
                            className="group cursor-pointer rounded-lg border border-border/50 bg-background p-4 transition-all hover:border-border hover:shadow-lg hover:shadow-black/20"
                            style={{ borderLeftColor: color, borderLeftWidth: '3px' }}
                          >
                            {/* Top: status + model */}
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-foreground truncate group-hover:text-accent transition-colors">
                                  {device.model}
                                </div>
                                <div className="text-[11px] text-muted truncate">{device.name}</div>
                              </div>
                              <span className="ml-2 flex-shrink-0 flex items-center gap-1.5">
                                <span
                                  className={`inline-block h-2 w-2 rounded-full ${device.status === 'warning' || device.status === 'error' ? 'status-pulse' : ''}`}
                                  style={{ backgroundColor: STATUS_COLORS[device.status] }}
                                />
                                <span className="text-[10px] capitalize" style={{ color: STATUS_COLORS[device.status] }}>
                                  {device.status}
                                </span>
                              </span>
                            </div>

                            {/* Category + Companion badge */}
                            <div className="mb-3 flex items-center gap-1.5">
                              <span className="inline-block rounded bg-surface-2 px-2 py-0.5 text-[10px] text-muted">
                                {CATEGORY_LABELS[device.category]}
                              </span>
                              {device.companionModuleIds && device.companionModuleIds.length > 0 && (
                                <span className="inline-flex items-center gap-0.5 rounded bg-accent/10 px-1.5 py-0.5 text-[9px] text-accent">
                                  <Blocks size={9} />
                                  {device.companionModuleIds.length}
                                </span>
                              )}
                            </div>

                            {/* Stats row */}
                            <div className="flex items-center gap-4 text-[11px]">
                              <div className="flex items-center gap-1">
                                <Thermometer size={11} className={device.health.temperature > 55 ? 'text-error' : device.health.temperature > 45 ? 'text-warning' : 'text-success'} />
                                <span className="font-mono" style={{ color: device.health.temperature > 55 ? '#ef4444' : device.health.temperature > 45 ? '#f59e0b' : '#22c55e' }}>
                                  {device.health.temperature.toFixed(0)}°C
                                </span>
                              </div>
                              <span className="font-mono text-muted">{device.ipAddress}</span>
                            </div>

                            {/* Rack location */}
                            <div className="mt-2 flex items-center gap-1 text-[10px] text-muted">
                              {rackName ? (
                                <>
                                  <Server size={10} />
                                  <span>{rackName}</span>
                                  {device.rackSlot && <span>/ U{device.rackSlot}</span>}
                                </>
                              ) : (
                                <span className="italic">Unassigned</span>
                              )}
                              <span className="ml-auto">{device.rackUnits > 0 ? `${device.rackUnits}RU` : 'Ext'}</span>
                            </div>

                            {/* Ports summary */}
                            <div className="mt-2 flex flex-wrap gap-1">
                              {(() => {
                                const portTypes: Record<string, number> = {};
                                for (const p of device.ports) {
                                  portTypes[p.type] = (portTypes[p.type] || 0) + 1;
                                }
                                return Object.entries(portTypes).map(([type, count]) => (
                                  <span key={type} className="rounded bg-surface-2 px-1.5 py-0.5 text-[9px] uppercase text-muted">
                                    {count}x {type}
                                  </span>
                                ));
                              })()}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted">Manufacturer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted">Model</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted">IP Address</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted">Rack / Slot</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted">RU</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted">Companion</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted">Temp</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDevices.map((device) => {
                    const mfgColor = MANUFACTURER_COLORS[device.manufacturer];
                    const rackName = getRackName(device.rackId);
                    return (
                      <tr
                        key={device.id}
                        onClick={() => router.push(`/devices/${device.id}`)}
                        className="cursor-pointer border-b border-border/50 transition-colors hover:bg-surface-2/50"
                      >
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <HardDrive className="h-3.5 w-3.5 flex-shrink-0 text-muted" />
                            <span className="text-sm font-medium text-foreground">{device.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium"
                            style={{ backgroundColor: `${mfgColor}18`, color: mfgColor }}
                          >
                            <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: mfgColor }} />
                            {MANUFACTURER_LABELS[device.manufacturer]}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted">{device.model}</td>
                        <td className="px-4 py-2.5">
                          <span className="text-[10px] text-muted">{CATEGORY_LABELS[device.category]}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`inline-block h-2 w-2 rounded-full ${device.status === 'warning' || device.status === 'error' ? 'status-pulse' : ''}`}
                              style={{ backgroundColor: STATUS_COLORS[device.status] }}
                            />
                            <span className="text-xs capitalize" style={{ color: STATUS_COLORS[device.status] }}>{device.status}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-xs text-muted">{device.ipAddress}</td>
                        <td className="px-4 py-2.5">
                          {rackName ? (
                            <div className="flex items-center gap-1">
                              <Server className="h-3 w-3 text-muted" />
                              <span className="text-xs text-foreground">{rackName}</span>
                              {device.rackSlot && <span className="text-xs text-muted">/ U{device.rackSlot}</span>}
                            </div>
                          ) : (
                            <span className="text-[10px] text-muted italic">Unassigned</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted text-center">
                          {device.rackUnits > 0 ? `${device.rackUnits}` : '-'}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          {device.companionModuleIds && device.companionModuleIds.length > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] text-accent">
                              <Blocks size={10} />
                              {device.companionModuleIds.length} module{device.companionModuleIds.length !== 1 ? 's' : ''}
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <span
                            className="font-mono text-xs"
                            style={{ color: device.health.temperature > 55 ? '#ef4444' : device.health.temperature > 45 ? '#f59e0b' : '#22c55e' }}
                          >
                            {device.health.temperature.toFixed(1)}°C
                          </span>
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
        )}
      </div>
    </div>
  );
}
