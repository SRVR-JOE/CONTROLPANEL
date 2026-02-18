'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/store';
import { DeviceStatus } from '@/types';
import DeviceHealthCard from '@/components/health/DeviceHealthCard';
import RackThermalView from '@/components/health/RackThermalView';
import {
  Activity,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  WifiOff,
  ArrowUpDown,
  Filter,
  Thermometer,
  Server,
} from 'lucide-react';

type StatusFilter = 'all' | DeviceStatus;
type SortMode = 'name' | 'temperature';

const filterOptions: { value: StatusFilter; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'All', icon: <Server size={13} /> },
  { value: 'online', label: 'Online', icon: <CheckCircle size={13} /> },
  { value: 'warning', label: 'Warning', icon: <AlertTriangle size={13} /> },
  { value: 'error', label: 'Error', icon: <AlertCircle size={13} /> },
  { value: 'offline', label: 'Offline', icon: <WifiOff size={13} /> },
];

export default function HealthPage() {
  const devices = useStore((state) => state.devices);
  const racks = useStore((state) => state.racks);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('name');

  // Summary stats
  const totalDevices = devices.length;
  const onlineCount = devices.filter((d) => d.status === 'online').length;
  const warningCount = devices.filter((d) => d.status === 'warning').length;
  const errorCount = devices.filter((d) => d.status === 'error').length;
  const offlineCount = devices.filter((d) => d.status === 'offline').length;

  // Filter and sort devices
  const filteredDevices = useMemo(() => {
    let result = [...devices];

    if (statusFilter !== 'all') {
      result = result.filter((d) => d.status === statusFilter);
    }

    if (sortMode === 'temperature') {
      result.sort((a, b) => (b.health.temperature ?? 0) - (a.health.temperature ?? 0));
    } else {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [devices, statusFilter, sortMode]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border bg-surface">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-accent/10 rounded-lg">
              <Activity size={20} className="text-accent" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">
                Health & Temperature Monitoring
              </h1>
              <p className="text-[12px] text-muted">
                Real-time device health, thermal overview, and system diagnostics
              </p>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-surface-2 rounded-lg px-4 py-2.5 border border-border">
              <div className="flex items-center gap-2 text-muted mb-1">
                <Server size={12} />
                <span className="text-[10px] uppercase tracking-wider">Total</span>
              </div>
              <span className="text-xl font-bold font-mono text-foreground">
                {totalDevices}
              </span>
            </div>
            <div className="bg-surface-2 rounded-lg px-4 py-2.5 border border-border">
              <div className="flex items-center gap-2 text-green-400 mb-1">
                <CheckCircle size={12} />
                <span className="text-[10px] uppercase tracking-wider">Online</span>
              </div>
              <span className="text-xl font-bold font-mono text-green-400">
                {onlineCount}
              </span>
            </div>
            <div className="bg-surface-2 rounded-lg px-4 py-2.5 border border-border">
              <div className="flex items-center gap-2 text-yellow-400 mb-1">
                <AlertTriangle size={12} />
                <span className="text-[10px] uppercase tracking-wider">Warnings</span>
              </div>
              <span className="text-xl font-bold font-mono text-yellow-400">
                {warningCount}
              </span>
            </div>
            <div className="bg-surface-2 rounded-lg px-4 py-2.5 border border-border">
              <div className="flex items-center gap-2 text-red-400 mb-1">
                <AlertCircle size={12} />
                <span className="text-[10px] uppercase tracking-wider">Errors</span>
              </div>
              <span className="text-xl font-bold font-mono text-red-400">
                {errorCount}
              </span>
            </div>
            <div className="bg-surface-2 rounded-lg px-4 py-2.5 border border-border">
              <div className="flex items-center gap-2 text-muted mb-1">
                <WifiOff size={12} />
                <span className="text-[10px] uppercase tracking-wider">Offline</span>
              </div>
              <span className="text-xl font-bold font-mono text-muted">
                {offlineCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
        {/* Rack Thermal Views */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Thermometer size={16} className="text-accent" />
            <h2 className="text-sm font-semibold text-foreground">
              Rack Thermal Overview
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {racks.map((rack) => (
              <RackThermalView key={rack.id} rack={rack} devices={devices} />
            ))}
          </div>
        </section>

        {/* Device Health Cards */}
        <section>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-accent" />
              <h2 className="text-sm font-semibold text-foreground">Device Health</h2>
              <span className="text-[11px] text-muted px-2 py-0.5 bg-surface-2 rounded-full">
                {filteredDevices.length} device{filteredDevices.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Status Filter */}
              <div className="flex items-center gap-1">
                <Filter size={12} className="text-muted" />
                <div className="flex bg-surface-2 rounded-lg border border-border overflow-hidden">
                  {filterOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setStatusFilter(opt.value)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                        statusFilter === opt.value
                          ? 'bg-accent text-white'
                          : 'text-muted hover:text-foreground hover:bg-surface'
                      }`}
                    >
                      {opt.icon}
                      <span className="hidden sm:inline">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <button
                onClick={() =>
                  setSortMode((prev) =>
                    prev === 'name' ? 'temperature' : 'name'
                  )
                }
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-muted hover:text-foreground bg-surface-2 rounded-lg border border-border transition-colors"
              >
                <ArrowUpDown size={12} />
                <span>{sortMode === 'name' ? 'By Name' : 'By Temp'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredDevices.map((device) => (
              <DeviceHealthCard key={device.id} device={device} />
            ))}
          </div>

          {filteredDevices.length === 0 && (
            <div className="text-center py-12 text-muted">
              <WifiOff size={32} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm">No devices match the selected filter</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
