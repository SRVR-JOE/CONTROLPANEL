'use client';

import React from 'react';
import { Rack, Device } from '@/types';
import { Thermometer, ArrowDown, ArrowUp, Wind } from 'lucide-react';

interface RackThermalViewProps {
  rack: Rack;
  devices: Device[];
}

function temperatureToColor(temp: number): string {
  // Cool blue (20) -> green (35) -> yellow (45) -> hot red (60+)
  if (temp <= 20) return '#1e40af'; // deep blue
  if (temp <= 30) return '#3b82f6'; // blue
  if (temp <= 35) return '#22c55e'; // green
  if (temp <= 40) return '#84cc16'; // lime
  if (temp <= 45) return '#eab308'; // yellow
  if (temp <= 50) return '#f59e0b'; // amber
  if (temp <= 55) return '#f97316'; // orange
  return '#ef4444'; // red
}

function temperatureToOpacity(temp: number): number {
  const normalized = Math.min(1, Math.max(0.3, (temp - 15) / 55));
  return normalized;
}

export default function RackThermalView({ rack, devices }: RackThermalViewProps) {
  // Build a map of slot -> device
  const slotDeviceMap = new Map<number, Device>();
  for (const slot of rack.slots) {
    if (slot.deviceId) {
      const device = devices.find((d) => d.id === slot.deviceId);
      if (device) {
        slotDeviceMap.set(slot.ru, device);
      }
    }
  }

  // Figure out which RUs are occupied and by which device
  const ruInfo: {
    ru: number;
    device: Device | null;
    isStart: boolean;
    spanHeight: number;
  }[] = [];

  const visitedDevices = new Set<string>();

  for (let ru = 1; ru <= rack.totalRU; ru++) {
    const slot = rack.slots.find((s) => s.ru === ru);
    if (slot?.deviceId) {
      const device = devices.find((d) => d.id === slot.deviceId);
      if (device && !visitedDevices.has(device.id)) {
        visitedDevices.add(device.id);
        ruInfo.push({
          ru,
          device,
          isStart: true,
          spanHeight: device.rackUnits,
        });
        // Skip remaining RUs for this device
        for (let j = 1; j < device.rackUnits; j++) {
          ru++;
        }
      } else if (!device) {
        ruInfo.push({ ru, device: null, isStart: false, spanHeight: 1 });
      }
      // If device already visited, this RU is part of a multi-RU device and we skip
      if (device && visitedDevices.has(device.id) && device.rackSlot !== ru) {
        continue;
      }
    } else {
      ruInfo.push({ ru, device: null, isStart: false, spanHeight: 1 });
    }
  }

  const slotHeight = 14; // px per RU

  return (
    <div className="bg-surface rounded-lg border border-border p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{rack.name}</h3>
          <p className="text-[11px] text-muted">{rack.location}</p>
        </div>
        <Thermometer size={16} className="text-muted" />
      </div>

      {/* Thermal rack visualization */}
      <div className="flex gap-3">
        {/* Rack body */}
        <div className="flex-1">
          <div
            className="relative bg-surface-2 rounded border border-border overflow-hidden"
            style={{ minHeight: rack.totalRU * slotHeight }}
          >
            {ruInfo.map((info) => {
              if (!info.isStart && info.device) return null;

              const top = (info.ru - 1) * slotHeight;
              const height = info.spanHeight * slotHeight;

              if (!info.device) {
                return (
                  <div
                    key={`empty-${info.ru}`}
                    className="absolute left-0 right-0 border-b border-border/30"
                    style={{
                      top,
                      height: slotHeight,
                    }}
                  />
                );
              }

              const temp = info.device.health.temperature ?? 0;
              const color = temperatureToColor(temp);
              const opacity = temperatureToOpacity(temp);

              return (
                <div
                  key={info.device.id}
                  className="absolute left-0 right-0 flex items-center justify-between px-2 border-b border-black/20"
                  style={{
                    top,
                    height,
                    backgroundColor: color,
                    opacity,
                  }}
                  title={`${info.device.name} - ${Math.round(temp)}\u00B0C`}
                >
                  <span
                    className="text-[9px] font-medium truncate"
                    style={{ color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                  >
                    {info.device.name}
                  </span>
                  <span
                    className="text-[9px] font-mono font-bold shrink-0 ml-1"
                    style={{ color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                  >
                    {Math.round(temp)}{'\u00B0'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* RU scale */}
          <div className="flex justify-between mt-1 px-1">
            <span className="text-[9px] text-muted">1U</span>
            <span className="text-[9px] text-muted">{rack.totalRU}U</span>
          </div>
        </div>

        {/* Temperature legend */}
        <div className="flex flex-col items-center gap-0.5 pt-1">
          <div
            className="w-3 rounded-t"
            style={{
              height: 60,
              background:
                'linear-gradient(to bottom, #ef4444, #f97316, #f59e0b, #eab308, #84cc16, #22c55e, #3b82f6, #1e40af)',
            }}
          />
          <div className="flex flex-col items-center">
            <span className="text-[8px] text-muted">60+</span>
            <span className="text-[8px] text-muted">20</span>
          </div>
        </div>
      </div>

      {/* Environmental readings */}
      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border">
        {rack.inletTemp !== undefined && (
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-muted mb-0.5">
              <ArrowDown size={10} />
              <span className="text-[9px] uppercase tracking-wider">Inlet</span>
            </div>
            <span className="text-xs font-mono text-blue-400">
              {rack.inletTemp}{'\u00B0C'}
            </span>
          </div>
        )}
        {rack.exhaustTemp !== undefined && (
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-muted mb-0.5">
              <ArrowUp size={10} />
              <span className="text-[9px] uppercase tracking-wider">Exhaust</span>
            </div>
            <span className="text-xs font-mono text-orange-400">
              {rack.exhaustTemp}{'\u00B0C'}
            </span>
          </div>
        )}
        {rack.ambientTemp !== undefined && (
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-muted mb-0.5">
              <Wind size={10} />
              <span className="text-[9px] uppercase tracking-wider">Ambient</span>
            </div>
            <span className="text-xs font-mono text-foreground">
              {rack.ambientTemp}{'\u00B0C'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
