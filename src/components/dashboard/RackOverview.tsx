"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Server } from "lucide-react";
import { useStore } from "@/store";
import { useShallow } from "zustand/react/shallow";
import { STATUS_COLORS, MANUFACTURER_COLORS } from "@/lib/constants";
import type { DeviceStatus, Rack, Device } from "@/types";

// ============================================================
// Types
// ============================================================

type RackStatus = DeviceStatus | "empty";

// ============================================================
// Helpers
// ============================================================

function deriveRackStatus(devices: Device[]): RackStatus {
  if (devices.length === 0) return "empty";
  if (devices.some((d) => d.status === "error")) return "error";
  if (devices.some((d) => d.status === "warning")) return "warning";
  if (devices.some((d) => d.status === "offline")) return "offline";
  return "online";
}

const RACK_STATUS_COLOR: Record<RackStatus, string> = {
  online: STATUS_COLORS.online,
  warning: STATUS_COLORS.warning,
  error: STATUS_COLORS.error,
  offline: STATUS_COLORS.offline,
  empty: "#3a3a52",
};

const RACK_STATUS_LABEL: Record<RackStatus, string> = {
  online: "ONLINE",
  warning: "WARN",
  error: "ERROR",
  offline: "OFFLINE",
  empty: "EMPTY",
};

// ============================================================
// RackMiniBar — thin vertical bar showing 26RU slot occupancy
// ============================================================

interface SlotInfo {
  ru: number;
  statusColor: string | null; // null = empty
  mfgColor: string | null;
}

function RackMiniBar({
  rack,
  devicesByRack,
}: {
  rack: Rack;
  devicesByRack: Device[];
}) {
  const slots = useMemo((): SlotInfo[] => {
    // Build a map: ru → Device (for the device's starting slot only)
    const ruToDevice = new Map<number, Device>();
    for (const device of devicesByRack) {
      if (device.rackSlot != null) {
        ruToDevice.set(device.rackSlot, device);
      }
    }

    // Track RUs consumed by multi-RU devices so we don't double-render
    const consumed = new Set<number>();
    for (const device of devicesByRack) {
      if (device.rackSlot != null && device.rackUnits > 1) {
        for (let i = 1; i < device.rackUnits; i++) {
          consumed.add(device.rackSlot + i);
        }
      }
    }

    const totalRU = rack.totalRU || 26;
    const result: SlotInfo[] = [];

    // Render top-to-bottom: highest RU number first (matches physical rack)
    for (let ru = totalRU; ru >= 1; ru--) {
      if (consumed.has(ru)) continue;

      const device = ruToDevice.get(ru);
      result.push({
        ru,
        statusColor: device ? STATUS_COLORS[device.status] : null,
        mfgColor: device ? MANUFACTURER_COLORS[device.manufacturer] : null,
      });
    }

    return result;
  }, [rack, devicesByRack]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "2px",
        padding: "6px",
        background: "rgba(0,0,0,0.35)",
        borderRadius: "6px",
        border: "1px solid rgba(255,255,255,0.04)",
        minHeight: "80px",
      }}
    >
      {slots.map((slot) => {
        const isOccupied = slot.mfgColor !== null;
        return (
          <div
            key={slot.ru}
            title={isOccupied ? `RU ${slot.ru} — occupied` : `RU ${slot.ru} — empty`}
            style={{
              height: "4px",
              borderRadius: "2px",
              background: isOccupied
                ? `${slot.mfgColor}55`
                : "rgba(255,255,255,0.05)",
              borderLeft: isOccupied
                ? `2px solid ${slot.statusColor}`
                : "2px solid transparent",
              transition: "background 0.15s",
            }}
          />
        );
      })}
    </div>
  );
}

// ============================================================
// RackCard
// ============================================================

function RackCard({
  rack,
  devices,
}: {
  rack: Rack;
  devices: Device[];
}) {
  const rackDevices = useMemo(
    () => devices.filter((d) => d.rackId === rack.id),
    [devices, rack.id]
  );

  const status = useMemo(() => deriveRackStatus(rackDevices), [rackDevices]);

  const occupiedSlots = rack.slots.filter((s) => s.deviceId != null).length;
  const totalRU = rack.totalRU || 26;
  const utilizationPct = Math.round((occupiedSlots / totalRU) * 100);

  const statusColor = RACK_STATUS_COLOR[status];

  return (
    <Link
      href={`/racks/${rack.id}`}
      style={{ display: "block" }}
    >
      <div
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "12px",
          padding: "16px",
          transition: "border-color 0.2s, background 0.2s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.background =
            "rgba(255,255,255,0.055)";
          (e.currentTarget as HTMLDivElement).style.borderColor =
            "rgba(255,255,255,0.12)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.background =
            "rgba(255,255,255,0.03)";
          (e.currentTarget as HTMLDivElement).style.borderColor =
            "rgba(255,255,255,0.06)";
        }}
      >
        {/* Card header: name + status dot */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "12px",
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                marginBottom: "3px",
              }}
            >
              {/* Status dot */}
              <span
                style={{
                  flexShrink: 0,
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: statusColor,
                  boxShadow:
                    status !== "empty"
                      ? `0 0 6px ${statusColor}88`
                      : undefined,
                }}
              />
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  fontFamily: "var(--font-mono, monospace)",
                  color: "#d0d0de",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {rack.name}
              </span>
            </div>
            <span
              style={{
                fontSize: "10px",
                fontFamily: "var(--font-mono, monospace)",
                color: "#5a5a6e",
                display: "block",
              }}
            >
              {rack.location}
            </span>
          </div>

          {/* Status badge */}
          <span
            style={{
              flexShrink: 0,
              fontSize: "9px",
              fontFamily: "var(--font-mono, monospace)",
              fontWeight: 600,
              letterSpacing: "0.08em",
              color: statusColor,
              background: `${statusColor}18`,
              padding: "2px 7px",
              borderRadius: "20px",
              border: `1px solid ${statusColor}30`,
              marginLeft: "8px",
            }}
          >
            {RACK_STATUS_LABEL[status]}
          </span>
        </div>

        {/* Mini rack bar */}
        <RackMiniBar rack={rack} devicesByRack={rackDevices} />

        {/* Stats row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginTop: "10px",
          }}
        >
          <span
            style={{
              fontSize: "10px",
              fontFamily: "var(--font-mono, monospace)",
              color: "#7a7a8e",
            }}
          >
            {rackDevices.length} device{rackDevices.length !== 1 ? "s" : ""}
          </span>

          <span style={{ color: "#2a2a3d", fontSize: "10px" }}>|</span>

          <span
            style={{
              fontSize: "10px",
              fontFamily: "var(--font-mono, monospace)",
              color: "#7a7a8e",
            }}
          >
            {occupiedSlots}/{totalRU} RU
          </span>

          <span style={{ color: "#2a2a3d", fontSize: "10px" }}>|</span>

          {/* Utilization badge */}
          <span
            style={{
              fontSize: "9px",
              fontFamily: "var(--font-mono, monospace)",
              fontWeight: 600,
              color:
                utilizationPct >= 95
                  ? STATUS_COLORS.error
                  : utilizationPct >= 80
                  ? STATUS_COLORS.warning
                  : "#6366f1",
              background:
                utilizationPct >= 95
                  ? "rgba(239,68,68,0.1)"
                  : utilizationPct >= 80
                  ? "rgba(245,158,11,0.1)"
                  : "rgba(99,102,241,0.1)",
              padding: "1px 6px",
              borderRadius: "10px",
            }}
          >
            {utilizationPct}%
          </span>
        </div>
      </div>
    </Link>
  );
}

// ============================================================
// RackOverview (exported)
// ============================================================

export default function RackOverview() {
  const { racks, devices } = useStore(
    useShallow((s) => ({
      racks: s.racks,
      devices: s.devices,
    }))
  );

  return (
    <section>
      {/* Section header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Server
            style={{ width: "14px", height: "14px", color: "#6366f1" }}
          />
          <h2
            style={{
              fontSize: "10px",
              fontFamily: "var(--font-mono, monospace)",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#7a7a8e",
              margin: 0,
              fontWeight: 600,
            }}
          >
            Racks
          </h2>
          <span
            style={{
              fontSize: "10px",
              fontFamily: "var(--font-mono, monospace)",
              color: "#4a4a5e",
              background: "rgba(255,255,255,0.04)",
              padding: "1px 7px",
              borderRadius: "10px",
            }}
          >
            {racks.length}
          </span>
        </div>

        <Link
          href="/racks"
          style={{
            fontSize: "10px",
            fontFamily: "var(--font-mono, monospace)",
            color: "#6366f1",
            textDecoration: "none",
            letterSpacing: "0.05em",
            display: "flex",
            alignItems: "center",
            gap: "3px",
            opacity: 0.85,
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLAnchorElement).style.opacity = "1")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLAnchorElement).style.opacity = "0.85")
          }
        >
          View All →
        </Link>
      </div>

      {/* Rack grid */}
      {racks.length === 0 ? (
        <div
          style={{
            padding: "32px",
            textAlign: "center",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.05)",
            borderRadius: "12px",
          }}
        >
          <p
            style={{
              fontSize: "12px",
              fontFamily: "var(--font-mono, monospace)",
              color: "#4a4a5e",
              margin: 0,
            }}
          >
            No racks configured.{" "}
            <Link href="/racks" style={{ color: "#6366f1" }}>
              Add a rack
            </Link>
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "12px",
          }}
        >
          {racks.map((rack) => (
            <RackCard key={rack.id} rack={rack} devices={devices} />
          ))}
        </div>
      )}
    </section>
  );
}
