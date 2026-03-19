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
import type { DeviceStatus } from "@/types";
import { MANUFACTURER_COLORS, STATUS_COLORS } from "@/lib/constants";
import RackOverview from "@/components/dashboard/RackOverview";
import PresetShortcuts from "@/components/dashboard/PresetShortcuts";
import TimecodeWidget from "@/components/dashboard/TimecodeWidget";

const STATUS_LABELS: Record<DeviceStatus, string> = {
  online: "Online",
  warning: "Warning",
  error: "Error",
  offline: "Offline",
};

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

export default function DashboardPage() {
  const devices = useStore((s) => s.devices);
  const racks = useStore((s) => s.racks);
  const commandHistory = useStore((s) => s.commandHistory);

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

    let systemStatus: DeviceStatus = "online";
    if (statusCounts.error > 0) systemStatus = "error";
    else if (statusCounts.warning > 0) systemStatus = "warning";
    else if (statusCounts.offline > 0 && statusCounts.online === 0)
      systemStatus = "offline";

    return { statusCounts, avgTemp, totalPower, systemStatus };
  }, [devices]);

  const recentCommands = commandHistory.slice(0, 5);

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
        {/* HERO HEADER */}
        {/* ============================================================ */}
        <header className="relative overflow-hidden rounded-xl border"
          style={{
            background: "linear-gradient(135deg, rgba(14,14,24,0.95) 0%, rgba(20,20,36,0.9) 100%)",
            borderColor: "rgba(255,255,255,0.06)",
          }}
        >
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          <div className="relative px-6 py-6 sm:px-10 sm:py-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <Server className="w-5 h-5" style={{ color: "#6366f1" }} />
                  <span
                    className="text-[10px] tracking-[0.3em] uppercase font-mono"
                    style={{ color: "#6366f1" }}
                  >
                    Virtual Rack
                  </span>
                </div>
                <h1
                  className="text-2xl sm:text-3xl font-bold tracking-tight font-mono"
                  style={{ color: "#f0f0f8" }}
                >
                  VIRTUAL RACK
                </h1>
                <p className="mt-1 text-sm font-mono" style={{ color: "#7a7a8e" }}>
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
        {/* RACKS — PRIMARY SECTION */}
        {/* ============================================================ */}
        <RackOverview />

        {/* ============================================================ */}
        {/* PRESETS + TIMECODE ROW */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <PresetShortcuts />
          </div>
          <div>
            <TimecodeWidget />
          </div>
        </div>

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
            <StatCard
              label="Avg Temp"
              value={`${stats.avgTemp.toFixed(1)}\u00B0C`}
              borderColor="#6366f1"
              icon={<Thermometer className="w-4 h-4" />}
            />
            <StatCard
              label="Power Draw"
              value={`${stats.totalPower.toFixed(0)}W`}
              borderColor="#8b5cf6" // violet-500 — power accent
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
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-mono truncate" style={{ color: "#c8c8d8" }}>
                            <span style={{ color: device ? MANUFACTURER_COLORS[device.manufacturer] : STATUS_COLORS.offline }}>
                              {device?.name ?? cmd.deviceId}
                            </span>
                            <span style={{ color: "#4a4a5e" }}> &gt; </span>
                            {cmd.command}
                          </p>
                        </div>
                        <span
                          className="flex-shrink-0 text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider"
                          style={{
                            color:
                              cmd.status === "success"
                                ? STATUS_COLORS.online
                                : cmd.status === "error"
                                ? STATUS_COLORS.error
                                : STATUS_COLORS.offline,
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
