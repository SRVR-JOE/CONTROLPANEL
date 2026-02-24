"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { Layers, Play } from "lucide-react";
import { useStore } from "@/store";
import { useShallow } from "zustand/react/shallow";
import type { MatrixPreset, MatrixRouter } from "@/types";
import { MANUFACTURER_COLORS } from "@/lib/constants";

function routerAccentColor(manufacturer: string): string {
  return (MANUFACTURER_COLORS as Record<string, string>)[manufacturer] ?? "#6366f1";
}

// ============================================================
// PresetButton
// ============================================================

interface PresetButtonProps {
  preset: MatrixPreset;
  router: MatrixRouter | undefined;
  onRecall: (presetId: string) => void;
  isFlashing: boolean;
}

function PresetButton({
  preset,
  router,
  onRecall,
  isFlashing,
}: PresetButtonProps) {
  const accentColor = router
    ? routerAccentColor(router.manufacturer)
    : "#6366f1";

  const routeCount = preset.routes.length;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        padding: "10px 12px",
        background: isFlashing
          ? "rgba(34,197,94,0.12)"
          : "rgba(255,255,255,0.03)",
        border: isFlashing
          ? "1px solid rgba(34,197,94,0.35)"
          : "1px solid rgba(255,255,255,0.06)",
        borderRadius: "10px",
        minWidth: "160px",
        maxWidth: "220px",
        transition: "background 0.15s, border-color 0.15s",
        position: "relative",
        flexShrink: 0,
      }}
    >
      {/* Preset name */}
      <span
        style={{
          fontSize: "12px",
          fontWeight: 600,
          fontFamily: "var(--font-mono, monospace)",
          color: isFlashing ? "#22c55e" : "#d0d0de",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          transition: "color 0.15s",
          lineHeight: 1.3,
        }}
        title={preset.name}
      >
        {preset.name}
      </span>

      {/* Router name */}
      {router && (
        <span
          style={{
            fontSize: "9px",
            fontFamily: "var(--font-mono, monospace)",
            color: accentColor,
            opacity: 0.8,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            letterSpacing: "0.04em",
          }}
          title={router.name}
        >
          {router.name}
        </span>
      )}

      {/* Bottom row: route count badge + recall button */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "2px",
          gap: "6px",
        }}
      >
        <span
          style={{
            fontSize: "9px",
            fontFamily: "var(--font-mono, monospace)",
            color: "#5a5a6e",
            background: "rgba(255,255,255,0.05)",
            padding: "1px 6px",
            borderRadius: "8px",
            letterSpacing: "0.04em",
            flexShrink: 0,
          }}
        >
          {routeCount} route{routeCount !== 1 ? "s" : ""}
        </span>

        <button
          onClick={() => onRecall(preset.id)}
          aria-label={`Recall preset ${preset.name}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: "3px 8px",
            background: isFlashing
              ? "rgba(34,197,94,0.2)"
              : `${accentColor}18`,
            border: isFlashing
              ? "1px solid rgba(34,197,94,0.5)"
              : `1px solid ${accentColor}35`,
            borderRadius: "6px",
            color: isFlashing ? "#22c55e" : accentColor,
            fontSize: "9px",
            fontFamily: "var(--font-mono, monospace)",
            fontWeight: 600,
            cursor: "pointer",
            letterSpacing: "0.06em",
            transition: "background 0.15s, border-color 0.15s, color 0.15s",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            if (!isFlashing) {
              (e.currentTarget as HTMLButtonElement).style.background =
                `${accentColor}28`;
            }
          }}
          onMouseLeave={(e) => {
            if (!isFlashing) {
              (e.currentTarget as HTMLButtonElement).style.background =
                `${accentColor}18`;
            }
          }}
        >
          <Play style={{ width: "8px", height: "8px" }} />
          {isFlashing ? "RECALLED" : "RECALL"}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// RouterGroup — presets grouped under one router header
// ============================================================

interface RouterGroupProps {
  router: MatrixRouter | undefined;
  routerLabel: string;
  presets: MatrixPreset[];
  accentColor: string;
  onRecall: (presetId: string) => void;
  flashingId: string | null;
}

function RouterGroup({
  router,
  routerLabel,
  presets,
  accentColor,
  onRecall,
  flashingId,
}: RouterGroupProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {/* Router label */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: "8px",
            height: "8px",
            borderRadius: "2px",
            background: accentColor,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: "9px",
            fontFamily: "var(--font-mono, monospace)",
            fontWeight: 600,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: accentColor,
            opacity: 0.8,
          }}
        >
          {routerLabel}
        </span>
        <span
          style={{
            fontSize: "9px",
            fontFamily: "var(--font-mono, monospace)",
            color: "#3a3a52",
          }}
        >
          {presets.length}
        </span>
      </div>

      {/* Horizontally scrollable preset strip */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        {presets.map((preset) => (
          <PresetButton
            key={preset.id}
            preset={preset}
            router={router}
            onRecall={onRecall}
            isFlashing={flashingId === preset.id}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// PresetShortcuts (exported)
// ============================================================

export default function PresetShortcuts() {
  const { matrixPresets, routers, recallMatrixPreset } = useStore(
    useShallow((s) => ({
      matrixPresets: s.matrixPresets,
      routers: s.routers,
      recallMatrixPreset: s.recallMatrixPreset,
    }))
  );

  // flashingId tracks which preset button is showing the 1s green confirmation
  const [flashingId, setFlashingId] = useState<string | null>(null);

  const handleRecall = useCallback(
    (presetId: string) => {
      recallMatrixPreset(presetId);
      setFlashingId(presetId);
      setTimeout(() => {
        setFlashingId((prev) => (prev === presetId ? null : prev));
      }, 1000);
    },
    [recallMatrixPreset]
  );

  // Build a router lookup map
  const routerMap = useMemo(() => {
    const map = new Map<string, MatrixRouter>();
    for (const r of routers) {
      map.set(r.id, r);
    }
    return map;
  }, [routers]);

  // Group presets by routerId, preserving router order from `routers` array.
  // Returns a plain array of [routerId, presets] tuples to avoid Map iteration
  // compatibility issues with the TypeScript downlevelIteration setting.
  const groupedPresets = useMemo((): Array<[string, MatrixPreset[]]> => {
    // Use a plain object keyed by routerId for accumulation
    const groups: Record<string, MatrixPreset[]> = {};

    // Initialize buckets in router order for stable display
    for (const r of routers) {
      groups[r.id] = [];
    }

    // Distribute presets; create a bucket for any unknown routerId
    for (const preset of matrixPresets) {
      if (!groups[preset.routerId]) {
        groups[preset.routerId] = [];
      }
      groups[preset.routerId].push(preset);
    }

    // Build ordered output — routers first, then any orphaned buckets
    const orderedKeys: string[] = [
      ...routers.map((r) => r.id),
      ...Object.keys(groups).filter((k) => !routers.find((r) => r.id === k)),
    ];

    return orderedKeys
      .filter((k) => groups[k] && groups[k].length > 0)
      .map((k) => [k, groups[k]] as [string, MatrixPreset[]]);
  }, [matrixPresets, routers]);

  // Whether we need router section headers
  const showRouterHeaders = groupedPresets.length > 1;

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
          <Layers
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
            Presets
          </h2>
          {matrixPresets.length > 0 && (
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
              {matrixPresets.length}
            </span>
          )}
        </div>

        <Link
          href="/presets"
          style={{
            fontSize: "10px",
            fontFamily: "var(--font-mono, monospace)",
            color: "#6366f1",
            textDecoration: "none",
            letterSpacing: "0.05em",
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

      {/* Content */}
      {matrixPresets.length === 0 ? (
        <div
          style={{
            padding: "28px 20px",
            textAlign: "center",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.05)",
            borderRadius: "12px",
          }}
        >
          <Layers
            style={{
              width: "24px",
              height: "24px",
              color: "#3a3a52",
              margin: "0 auto 8px",
              display: "block",
            }}
          />
          <p
            style={{
              fontSize: "12px",
              fontFamily: "var(--font-mono, monospace)",
              color: "#4a4a5e",
              margin: "0 0 4px",
            }}
          >
            No presets saved.
          </p>
          <Link
            href="/presets"
            style={{
              fontSize: "11px",
              fontFamily: "var(--font-mono, monospace)",
              color: "#6366f1",
            }}
          >
            Create your first preset →
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {groupedPresets.map(([routerId, presets]) => {
            const router = routerMap.get(routerId);
            const routerLabel = router?.name ?? routerId;
            const accentColor = router
              ? routerAccentColor(router.manufacturer)
              : "#6366f1";

            return showRouterHeaders ? (
              <RouterGroup
                key={routerId}
                router={router}
                routerLabel={routerLabel}
                presets={presets}
                accentColor={accentColor}
                onRecall={handleRecall}
                flashingId={flashingId}
              />
            ) : (
              // Single router — skip the group header, just render the buttons
              <div
                key={routerId}
                style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}
              >
                {presets.map((preset) => (
                  <PresetButton
                    key={preset.id}
                    preset={preset}
                    router={router}
                    onRecall={handleRecall}
                    isFlashing={flashingId === preset.id}
                  />
                ))}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
