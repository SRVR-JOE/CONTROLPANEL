'use client';

import { useState, useRef, useCallback } from 'react';
import { Pencil, Check, X } from 'lucide-react';

interface PresetGridProps {
  cameraIp: string;
  disabled?: boolean;
}

const PRESET_COUNT = 20;
const LONG_PRESS_MS = 600;

// ---------------------------------------------------------------------------
// CGI command builders
// ---------------------------------------------------------------------------

function buildPresetRecallCommand(preset: number): string {
  const nn = String(preset - 1).padStart(2, '0'); // Panasonic presets are 0-indexed
  return `aw_ptz?cmd=%23R${nn}&res=1`;
}

function buildPresetStoreCommand(preset: number): string {
  const nn = String(preset - 1).padStart(2, '0');
  return `aw_ptz?cmd=%23M${nn}&res=1`;
}

// ---------------------------------------------------------------------------
// API helper
// ---------------------------------------------------------------------------

async function sendCgiCommand(ip: string, command: string): Promise<boolean> {
  try {
    const res = await fetch('/api/robo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip, command }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { success: boolean };
    return data.success;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Preset button
// ---------------------------------------------------------------------------

interface PresetButtonProps {
  index: number;
  label: string;
  isActive: boolean;
  isStored: boolean;
  disabled: boolean;
  onRecall: (index: number) => void;
  onStore: (index: number) => void;
  onRename: (index: number) => void;
}

function PresetButton({
  index,
  label,
  isActive,
  isStored,
  disabled,
  onRecall,
  onStore,
  onRename,
}: PresetButtonProps) {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  const handlePointerDown = () => {
    if (disabled) return;
    didLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      onStore(index);
    }, LONG_PRESS_MS);
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (!disabled && !didLongPress.current) {
      onRecall(index);
    }
  };

  const handlePointerLeave = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!disabled) onStore(index);
  };

  return (
    <div className="group relative">
      <button
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onContextMenu={handleContextMenu}
        disabled={disabled}
        className="relative h-full w-full overflow-hidden rounded-lg border text-center transition-all duration-150 select-none"
        style={{
          borderColor: isActive
            ? 'var(--accent)'
            : isStored
            ? 'var(--border)'
            : 'var(--border)',
          backgroundColor: isActive
            ? 'var(--accent-dim)'
            : isStored
            ? 'var(--surface-2)'
            : 'var(--surface)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          boxShadow: isActive ? '0 0 8px var(--accent)' : 'none',
        }}
      >
        {/* Stored indicator strip */}
        {isStored && !isActive && (
          <div
            className="absolute left-0 top-0 h-0.5 w-full"
            style={{ backgroundColor: 'var(--accent)', opacity: 0.5 }}
          />
        )}

        {/* Preset number */}
        <div
          className="text-[10px] font-bold"
          style={{ color: isActive ? 'var(--accent)' : 'var(--muted)' }}
        >
          {index}
        </div>

        {/* Label */}
        <div
          className="truncate px-1 text-[10px] font-medium leading-tight"
          style={{ color: isActive ? 'var(--foreground)' : isStored ? 'var(--foreground)' : 'var(--muted)' }}
        >
          {label || (isStored ? 'Preset' : '—')}
        </div>
      </button>

      {/* Rename button — appears on hover */}
      {!disabled && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRename(index);
          }}
          className="absolute right-0.5 top-0.5 hidden rounded p-0.5 group-hover:flex"
          style={{
            backgroundColor: 'var(--surface)',
            color: 'var(--muted)',
          }}
          title="Rename preset"
        >
          <Pencil className="h-2.5 w-2.5" />
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main PresetGrid
// ---------------------------------------------------------------------------

export default function PresetGrid({ cameraIp, disabled = false }: PresetGridProps) {
  // Track which presets have been stored (locally)
  const [storedPresets, setStoredPresets] = useState<Set<number>>(new Set());
  const [activePreset, setActivePreset] = useState<number | null>(null);
  const [presetLabels, setPresetLabels] = useState<Record<number, string>>({});
  const [editingPreset, setEditingPreset] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [feedback, setFeedback] = useState<{ preset: number; action: 'recall' | 'store' } | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const showFeedback = useCallback((preset: number, action: 'recall' | 'store') => {
    setFeedback({ preset, action });
    setTimeout(() => setFeedback(null), 1500);
  }, []);

  const handleRecall = useCallback(
    async (preset: number) => {
      if (!cameraIp) return;
      setActivePreset(preset);
      showFeedback(preset, 'recall');
      await sendCgiCommand(cameraIp, buildPresetRecallCommand(preset));
    },
    [cameraIp, showFeedback]
  );

  const handleStore = useCallback(
    async (preset: number) => {
      if (!cameraIp) return;
      setStoredPresets((prev) => new Set(Array.from(prev).concat(preset)));
      showFeedback(preset, 'store');
      await sendCgiCommand(cameraIp, buildPresetStoreCommand(preset));
    },
    [cameraIp, showFeedback]
  );

  const handleRename = useCallback((preset: number) => {
    setEditingPreset(preset);
    setEditValue(presetLabels[preset] ?? '');
    setTimeout(() => editInputRef.current?.focus(), 50);
  }, [presetLabels]);

  const commitRename = useCallback(() => {
    if (editingPreset === null) return;
    setPresetLabels((prev) => ({ ...prev, [editingPreset]: editValue.trim() }));
    setEditingPreset(null);
    setEditValue('');
  }, [editingPreset, editValue]);

  const cancelRename = useCallback(() => {
    setEditingPreset(null);
    setEditValue('');
  }, []);

  return (
    <div className="space-y-3">
      {/* Feedback toast */}
      {feedback && (
        <div
          className="rounded-md px-3 py-1.5 text-center text-xs font-medium"
          style={{
            backgroundColor: feedback.action === 'store' ? 'var(--warning)' : 'var(--accent)',
            color: '#fff',
          }}
        >
          {feedback.action === 'store'
            ? `Preset ${feedback.preset} stored`
            : `Preset ${feedback.preset} recalled`}
        </div>
      )}

      {/* Rename inline editor */}
      {editingPreset !== null && (
        <div className="flex items-center gap-2 rounded-lg border border-accent/40 px-3 py-2"
          style={{ backgroundColor: 'var(--surface-2)' }}
        >
          <span className="text-[11px]" style={{ color: 'var(--muted)' }}>
            Rename Preset {editingPreset}:
          </span>
          <input
            ref={editInputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename();
              if (e.key === 'Escape') cancelRename();
            }}
            maxLength={16}
            placeholder="Label..."
            className="flex-1 rounded bg-transparent px-1 py-0.5 text-xs outline-none focus:ring-0"
            style={{ color: 'var(--foreground)', border: 'none' }}
          />
          <button onClick={commitRename} title="Save">
            <Check className="h-3.5 w-3.5" style={{ color: 'var(--success)' }} />
          </button>
          <button onClick={cancelRename} title="Cancel">
            <X className="h-3.5 w-3.5" style={{ color: 'var(--muted)' }} />
          </button>
        </div>
      )}

      {/* Preset grid — 5 columns × 4 rows */}
      <div className="grid grid-cols-5 gap-1.5" style={{ gridAutoRows: '52px' }}>
        {Array.from({ length: PRESET_COUNT }, (_, i) => i + 1).map((preset) => (
          <PresetButton
            key={preset}
            index={preset}
            label={presetLabels[preset] ?? ''}
            isActive={activePreset === preset}
            isStored={storedPresets.has(preset)}
            disabled={disabled}
            onRecall={handleRecall}
            onStore={handleStore}
            onRename={handleRename}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px]" style={{ color: 'var(--muted)' }}>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-4 rounded-sm" style={{ backgroundColor: 'var(--accent)' }} />
          Active
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-4 rounded-sm" style={{ backgroundColor: 'var(--border)' }} />
          Stored
        </span>
        <span className="ml-auto">Hold or right-click to store</span>
      </div>
    </div>
  );
}
