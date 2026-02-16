"use client";

import Link from "next/link";
import { useStore } from "@/store";
import {
  Activity,
  AlertTriangle,
  ChevronRight,
  CircuitBoard,
  Grid3X3,
  Heart,
  Layers,
  Monitor,
  Pin,
  Power,
  Server,
  Thermometer,
  Wifi,
  WifiOff,
  XCircle,
  Zap,
} from "lucide-react";
import { useMemo } from "react";
import type { DeviceManufacturer, DeviceStatus } from "@/types";

// ============================================================
// Constants
// ============================================================

const MANUFACTURER_COLORS: Record<DeviceManufacturer, string> = {
  disguise: "#e91e63",
  barco: "#00bcd4",
  brompton: "#4caf50",
  lightware: "#ff9800",
  aja: "#ffc107",
  blackmagic: "#607d8b",
  ross: "#9c27b0",
  yamaha: "#7c3aed",
  "allen-heath": "#06b6d4",
  behringer: "#f97316",
  shure: "#14b8a6",
  sennheiser: "#64748b",
  panasonic: "#0ea5e9",
  sony: "#1d4ed8",
  etc: "#a855f7",
  "ma-lighting": "#ec4899",
  qsc: "#84cc16",
  "clear-com": "#f43f5e",
  riedel: "#0d9488",
  magewell: "#6366f1",
  teradek: "#e11d48",
  extron: "#059669",
  crestron: "#2563eb",
  ptzoptics: "#d97706",
  datavideo: "#7c2d12",
  roland: "#dc2626",
};

const STATUS_COLORS: Record<DeviceStatus, string> = {
  online: "#22c55e",
  warning: "#f59e0b",
  error: "#ef4444",
  offline: "#6b7280",
};

const STATUS_LABELS: Record<DeviceStatus, string> = {
  online: "Online",
  warning: "Warning",
  error: "Error",
  offline: "Offline",
};

// ============================================================
// Helper: format seconds to human-readable uptime
// ============================================================

function formatTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  return `${diffHr}h ${diffMin % 60}m ago`;
}

// ============================================================
// Main Dashboard Page
// ============================================================

export default function DashboardPage() {
  const devices = useStore((s) => s.devices);
  const racks = useStore((s) => s.racks);
  const commandHistory = useStore((s) => s.commandHistory);

  // --- Computed stats ---
  const stats = useMemo(() => {
    const statusCounts: Record<DeviceStatus, number> = {
      online: 0,
      warning: 0,
      error: 0,
      offline: 0,
    };
    let totalTemp = 0;
    let tempCount = 0;
    let totalPower = 0;

    for (const d of devices) {
      statusCounts[d.status]++;
      if (d.health.temperature != null) {
        totalTemp += d.health.temperature;
        tempCount++;
      }
      if (d.health.powerDraw != null) {
        totalPower += d.health.powerDraw;
      }
    }

    const avgTemp = tempCount > 0 ? totalTemp / tempCount : 0;

    // Determine overall system status
    let systemStatus: DeviceStatus = "online";
    if (statusCounts.error > 0) systemStatus = "error";
    else if (statusCounts.warning > 0) systemStatus = "warning";
    else if (statusCounts.offline > 0 && statusCounts.online === 0)
      systemStatus = "offline";

    return { statusCounts, avgTemp, totalPower, systemStatus };
  }, [devices]);

  const recentCommands = commandHistory.slice(0, 5);

  // --- Build a device lookup map for racks ---
  const deviceMap = useMemo(() => {
    const map = new Map<string, (typeof devices)[0]>();
    for (const d of devices) {
      map.set(d.id, d);
    }
    return map;
  }, [devices]);

  return (
    <div
      className="min-h-screen w-full"
      style={{ backgroundColor: "#0c0c14", color: "#e0e0e8" }}
    >
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* ============================================================ */}
        {/* HERO SECTION */}
        {/* ============================================================ */}
        <header className="relative overflow-hidden rounded-xl border"
          style={{
            background: "linear-gradient(135deg, rgba(14,14,24,0.95) 0%, rgba(20,20,36,0.9) 100%)",
            borderColor: "rgba(255,255,255,0.06)",
          }}
        >
          {/* Decorative grid lines */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          <div className="relative px-6 py-8 sm:px-10 sm:py-10">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Server className="w-6 h-6" style={{ color: "#6366f1" }} />
                  <span
                    className="text-[10px] tracking-[0.3em] uppercase font-mono"
                    style={{ color: "#6366f1" }}
                  >
                    System Dashboard
                  </span>
                </div>
                <h1
                  className="text-3xl sm:text-4xl font-bold tracking-tight font-mono"
                  style={{ color: "#f0f0f8" }}
                >
                  AV RACK CONTROL
                </h1>
                <p className="mt-2 text-sm font-mono" style={{ color: "#7a7a8e" }}>
                  {devices.length} devices across {racks.length} racks
                  <span className="mx-2" style={{ color: "#333346" }}>|</span>
                  System{" "}
                  <span
                    className="font-semibold"
                    style={{ color: STATUS_COLORS[stats.systemStatus] }}
                  >
                    {STATUS_LABELS[stats.systemStatus].toUpperCase()}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="inline-block w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: STATUS_COLORS[stats.systemStatus] }}
                />
                <span className="text-xs font-mono" style={{ color: "#7a7a8e" }}>
                  LIVE
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* ============================================================ */}
        {/* RACK OVERVIEW ROW */}
        {/* ============================================================ */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4" style={{ color: "#6366f1" }} />
            <h2 className="text-xs font-mono tracking-[0.2em] uppercase" style={{ color: "#7a7a8e" }}>
              Rack Overview
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {racks.map((rack) => (
              <MiniRack key={rack.id} rack={rack} deviceMap={deviceMap} />
            ))}
          </div>
        </section>

        {/* ============================================================ */}
        {/* QUICK STATUS GRID */}
        {/* ============================================================ */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4" style={{ color: "#6366f1" }} />
            <h2 className="text-xs font-mono tracking-[0.2em] uppercase" style={{ color: "#7a7a8e" }}>
              System Status
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Status counts */}
            <StatCard
              label="Online"
              value={stats.statusCounts.online}
              borderColor={STATUS_COLORS.online}
              icon={<Wifi className="w-4 h-4" />}
            />
            <StatCard
              label="Warning"
              value={stats.statusCounts.warning}
              borderColor={STATUS_COLORS.warning}
              icon={<AlertTriangle className="w-4 h-4" />}
            />
            <StatCard
              label="Error"
              value={stats.statusCounts.error}
              borderColor={STATUS_COLORS.error}
              icon={<XCircle className="w-4 h-4" />}
            />
            <StatCard
              label="Offline"
              value={stats.statusCounts.offline}
              borderColor={STATUS_COLORS.offline}
              icon={<WifiOff className="w-4 h-4" />}
            />
            {/* Avg temp */}
            <StatCard
              label="Avg Temp"
              value={`${stats.avgTemp.toFixed(1)}\u00B0C`}
              borderColor="#6366f1"
              icon={<Thermometer className="w-4 h-4" />}
            />
            {/* Total power */}
            <StatCard
              label="Power Draw"
              value={`${stats.totalPower.toFixed(0)}W`}
              borderColor="#8b5cf6"
              icon={<Zap className="w-4 h-4" />}
            />
          </div>
        </section>

        {/* ============================================================ */}
        {/* RECENT ACTIVITY & QUICK ACTIONS */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <Monitor className="w-4 h-4" style={{ color: "#6366f1" }} />
              <h2 className="text-xs font-mono tracking-[0.2em] uppercase" style={{ color: "#7a7a8e" }}>
                Recent Activity
              </h2>
            </div>
            <div
              className="rounded-xl border overflow-hidden"
              style={{
                background: "rgba(14,14,24,0.6)",
                borderColor: "rgba(255,255,255,0.06)",
                backdropFilter: "blur(12px)",
              }}
            >
              {recentCommands.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <p className="text-sm font-mono" style={{ color: "#4a4a5e" }}>
                    No commands sent yet. Activity will appear here.
                  </p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                  {recentCommands.map((cmd) => {
                    const device = deviceMap.get(cmd.deviceId);
                    return (
                      <div
                        key={cmd.id}
                        className="flex items-center gap-3 px-5 py-3"
                      >
                        {/* Status dot */}
                        <span
                          className="flex-shrink-0 w-2 h-2 rounded-full"
                          style={{
                            backgroundColor:
                              cmd.status === "success"
                                ? STATUS_COLORS.online
                                : cmd.status === "error"
                                ? STATUS_COLORS.error
                                : cmd.status === "sent"
                                ? STATUS_COLORS.warning
                                : "#6b7280",
                          }}
                        />
                        {/* Command info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-mono truncate" style={{ color: "#c8c8d8" }}>
                            <span style={{ color: device ? MANUFACTURER_COLORS[device.manufacturer] : "#888" }}>
                              {device?.name ?? cmd.deviceId}
                            </span>
                            <span style={{ color: "#4a4a5e" }}> &gt; </span>
                            {cmd.command}
                          </p>
                        </div>
                        {/* Status badge */}
                        <span
                          className="flex-shrink-0 text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider"
                          style={{
                            color:
                              cmd.status === "success"
                                ? STATUS_COLORS.online
                                : cmd.status === "error"
                                ? STATUS_COLORS.error
                                : "#888",
                            background:
                              cmd.status === "success"
                                ? "rgba(34,197,94,0.1)"
                                : cmd.status === "error"
                                ? "rgba(239,68,68,0.1)"
                                : "rgba(255,255,255,0.05)",
                          }}
                        >
                          {cmd.status}
                        </span>
                        {/* Timestamp */}
                        <span className="flex-shrink-0 text-[10px] font-mono" style={{ color: "#4a4a5e" }}>
                          {formatTime(cmd.sentAt)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Power className="w-4 h-4" style={{ color: "#6366f1" }} />
              <h2 className="text-xs font-mono tracking-[0.2em] uppercase" style={{ color: "#7a7a8e" }}>
                Quick Actions
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <QuickActionButton
                href="/matrix"
                label="Open Matrix"
                sublabel="Signal routing"
                icon={<Grid3X3 className="w-5 h-5" />}
                accentColor="#6366f1"
              />
              <QuickActionButton
                href="/health"
                label="Health Monitor"
                sublabel="Temperatures & alerts"
                icon={<Heart className="w-5 h-5" />}
                accentColor="#22c55e"
              />
              <QuickActionButton
                href="/brompton"
                label="Brompton Status"
                sublabel="LED processor panels"
                icon={<CircuitBoard className="w-5 h-5" />}
                accentColor="#4caf50"
              />
              <QuickActionButton
                href="/pinboard"
                label="Pin Board"
                sublabel="Custom device layout"
                icon={<Pin className="w-5 h-5" />}
                accentColor="#f59e0b"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MiniRack Component
// ============================================================

function MiniRack({
  rack,
  deviceMap,
}: {
  rack: ReturnType<typeof useStore.getState>["racks"][0];
  deviceMap: Map<string, ReturnType<typeof useStore.getState>["devices"][0]>;
}) {
  // Build an array of 26 RUs, top to bottom (RU 26 at top, RU 1 at bottom, like a real rack)
  const ruSlots = useMemo(() => {
    const slots: {
      ru: number;
      deviceId?: string;
      device?: ReturnType<typeof useStore.getState>["devices"][0];
      isStart: boolean;
      spanHeight: number;
    }[] = [];

    // Track which RUs are consumed by multi-RU devices (not the start slot)
    const consumed = new Set<number>();
    for (const slot of rack.slots) {
      if (slot.deviceId) {
        const dev = deviceMap.get(slot.deviceId);
        if (dev && dev.rackSlot === slot.ru) {
          // This is the starting slot
          for (let i = 1; i < dev.rackUnits; i++) {
            consumed.add(slot.ru + i);
          }
        }
      }
    }

    for (let ru = 26; ru >= 1; ru--) {
      if (consumed.has(ru)) continue;

      const slot = rack.slots.find((s) => s.ru === ru);
      const device = slot?.deviceId ? deviceMap.get(slot.deviceId) : undefined;
      const isStart = device ? device.rackSlot === ru : false;

      slots.push({
        ru,
        deviceId: slot?.deviceId,
        device: isStart ? device : undefined,
        isStart,
        spanHeight: isStart && device ? device.rackUnits : 1,
      });
    }

    return slots;
  }, [rack, deviceMap]);

  return (
    <Link href={`/racks/${rack.id}`} className="group block">
      <div
        className="rounded-xl border p-4 transition-all duration-200 group-hover:border-opacity-40"
        style={{
          background: "rgba(14,14,24,0.6)",
          borderColor: "rgba(255,255,255,0.06)",
          backdropFilter: "blur(12px)",
        }}
      >
        {/* Rack visualization */}
        <div
          className="rounded-lg border overflow-hidden mb-3"
          style={{
            background: "rgba(0,0,0,0.4)",
            borderColor: "rgba(255,255,255,0.04)",
          }}
        >
          <div className="flex flex-col gap-px p-1.5">
            {ruSlots.map((slot) => {
              if (slot.device) {
                // Device block
                const mfgColor = MANUFACTURER_COLORS[slot.device.manufacturer];
                const statusColor = STATUS_COLORS[slot.device.status];
                return (
                  <div
                    key={slot.ru}
                    className="rounded-sm flex items-center gap-1.5 px-1.5 transition-colors"
                    style={{
                      height: `${slot.spanHeight * 8}px`,
                      background: `${mfgColor}18`,
                      borderLeft: `2px solid ${mfgColor}`,
                    }}
                    title={`${slot.device.name} (RU ${slot.ru}${slot.spanHeight > 1 ? `-${slot.ru + slot.spanHeight - 1}` : ""})`}
                  >
                    <span
                      className="flex-shrink-0 w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: statusColor }}
                    />
                    <span
                      className="text-[8px] font-mono truncate leading-none"
                      style={{ color: mfgColor }}
                    >
                      {slot.device.name}
                    </span>
                  </div>
                );
              }
              // Empty slot
              return (
                <div
                  key={slot.ru}
                  className="rounded-sm"
                  style={{
                    height: "8px",
                    background: "rgba(255,255,255,0.015)",
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Rack info */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-mono font-semibold" style={{ color: "#d0d0de" }}>
              {rack.name}
            </p>
            <p className="text-[10px] font-mono mt-0.5" style={{ color: "#4a4a5e" }}>
              {rack.location} &bull; {rack.slots.filter((s) => s.deviceId).length}/{rack.totalRU} RU used
            </p>
          </div>
          <ChevronRight
            className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
            style={{ color: "#4a4a5e" }}
          />
        </div>
      </div>
    </Link>
  );
}

// ============================================================
// StatCard Component
// ============================================================

function StatCard({
  label,
  value,
  borderColor,
  icon,
}: {
  label: string;
  value: string | number;
  borderColor: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{
        background: "rgba(14,14,24,0.6)",
        borderColor: "rgba(255,255,255,0.06)",
        borderLeftWidth: "3px",
        borderLeftColor: borderColor,
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span style={{ color: borderColor }}>{icon}</span>
        <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: "#5a5a6e" }}>
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold font-mono" style={{ color: "#f0f0f8" }}>
        {value}
      </p>
    </div>
  );
}

// ============================================================
// QuickActionButton Component
// ============================================================

function QuickActionButton({
  href,
  label,
  sublabel,
  icon,
  accentColor,
}: {
  href: string;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  accentColor: string;
}) {
  return (
    <Link href={href} className="group block">
      <div
        className="rounded-xl border px-4 py-3 flex items-center gap-3 transition-all duration-200 group-hover:border-opacity-40"
        style={{
          background: "rgba(14,14,24,0.6)",
          borderColor: "rgba(255,255,255,0.06)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div
          className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
          style={{
            background: `${accentColor}15`,
            color: accentColor,
          }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-mono font-semibold" style={{ color: "#d0d0de" }}>
            {label}
          </p>
          <p className="text-[10px] font-mono" style={{ color: "#4a4a5e" }}>
            {sublabel}
          </p>
        </div>
        <ChevronRight
          className="w-4 h-4 flex-shrink-0 transition-transform group-hover:translate-x-0.5"
          style={{ color: "#4a4a5e" }}
        />
      </div>
    </Link>
  );
}
