'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useStore } from '@/store';
import { Timer, Play, Pause, RotateCcw, Plus, Trash2, Settings, Link2 } from 'lucide-react';
import type { TimecodeFrameRate, TimecodeSource, TimecodeGenerator } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const FRAME_RATES: TimecodeFrameRate[] = [23.976, 24, 25, 29.97, 30, 50, 59.94, 60];
const SOURCES: { value: TimecodeSource; label: string }[] = [
  { value: 'internal', label: 'Internal' },
  { value: 'ltc', label: 'LTC' },
  { value: 'mtc', label: 'MTC (MIDI)' },
  { value: 'artnet', label: 'Art-Net' },
];

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

function formatTC(g: TimecodeGenerator): string {
  const sep = g.dropFrame ? ';' : ':';
  return `${pad2(g.hours)}:${pad2(g.minutes)}:${pad2(g.seconds)}${sep}${pad2(g.frames)}`;
}

function TCDigit({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-5xl font-mono font-bold tabular-nums tracking-tight">{value}</span>
      <span className="text-[9px] uppercase tracking-widest text-muted mt-1">{label}</span>
    </div>
  );
}

function Separator({ char }: { char: string }) {
  return <span className="text-5xl font-mono font-bold text-muted/50 mx-0.5">{char}</span>;
}

function TimecodeDisplay({ gen }: { gen: TimecodeGenerator }) {
  const sep = gen.dropFrame ? ';' : ':';

  return (
    <div className="flex items-baseline justify-center py-4">
      <TCDigit value={pad2(gen.hours)} label="HH" />
      <Separator char=":" />
      <TCDigit value={pad2(gen.minutes)} label="MM" />
      <Separator char=":" />
      <TCDigit value={pad2(gen.seconds)} label="SS" />
      <Separator char={sep} />
      <TCDigit value={pad2(gen.frames)} label="FF" />
    </div>
  );
}

function TimecodeCard({ gen }: { gen: TimecodeGenerator }) {
  const toggleRunning = useStore((s) => s.toggleTimecodeRunning);
  const resetTC = useStore((s) => s.resetTimecode);
  const updateGen = useStore((s) => s.updateTimecodeGenerator);
  const removeGen = useStore((s) => s.removeTimecodeGenerator);
  const devices = useStore((s) => s.devices);
  const [showSettings, setShowSettings] = useState(false);

  const linkedDevice = gen.linkedDeviceId ? devices.find((d) => d.id === gen.linkedDeviceId) : null;

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${gen.running ? 'bg-success animate-pulse' : 'bg-muted/40'}`} />
          <h3 className="text-sm font-semibold">{gen.name}</h3>
        </div>
        <div className="flex items-center gap-1">
          <span className="rounded bg-surface-2 px-2 py-0.5 text-[10px] font-mono text-muted">
            {gen.frameRate}{gen.dropFrame ? ' DF' : ' NDF'} &middot; {gen.source.toUpperCase()}
          </span>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-foreground"
            aria-label="Timecode settings"
          >
            <Settings className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Linked device */}
      {linkedDevice && (
        <div className="flex items-center gap-1.5 mb-2 text-xs text-muted">
          <Link2 className="h-3 w-3" />
          <span>Linked to {linkedDevice.name}</span>
        </div>
      )}

      {/* TC Display */}
      <div className={`rounded-xl border px-6 py-3 font-mono transition-colors ${
        gen.running ? 'border-success/30 bg-success/5' : 'border-border bg-background'
      }`}>
        <TimecodeDisplay gen={gen} />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2 mt-4">
        <button
          onClick={() => resetTC(gen.id)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted hover:bg-surface-2 hover:text-foreground"
          aria-label="Reset timecode"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        <button
          onClick={() => toggleRunning(gen.id)}
          className={`flex h-12 w-12 items-center justify-center rounded-xl text-white transition-colors ${
            gen.running
              ? 'bg-warning hover:bg-warning/80'
              : 'bg-success hover:bg-success/80'
          }`}
          aria-label={gen.running ? 'Pause' : 'Play'}
        >
          {gen.running ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
        </button>
        <button
          onClick={() => removeGen(gen.id)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted hover:bg-error/10 hover:text-error hover:border-error/30"
          aria-label="Remove generator"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="mt-4 space-y-3 rounded-xl border border-border bg-background p-4">
          <div>
            <label className="text-xs text-muted">Name</label>
            <input
              type="text"
              value={gen.name}
              onChange={(e) => updateGen(gen.id, { name: e.target.value })}
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm focus:border-accent focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted">Frame Rate</label>
              <select
                value={gen.frameRate}
                onChange={(e) => updateGen(gen.id, { frameRate: Number(e.target.value) as TimecodeFrameRate })}
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm focus:border-accent focus:outline-none"
              >
                {FRAME_RATES.map((fr) => (
                  <option key={fr} value={fr}>{fr} fps</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted">Source</label>
              <select
                value={gen.source}
                onChange={(e) => updateGen(gen.id, { source: e.target.value as TimecodeSource })}
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm focus:border-accent focus:outline-none"
              >
                {SOURCES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={gen.dropFrame}
              onChange={(e) => updateGen(gen.id, { dropFrame: e.target.checked })}
              className="rounded border-border"
            />
            <span className="text-xs">Drop-frame</span>
            {(gen.frameRate !== 29.97 && gen.frameRate !== 59.94) && gen.dropFrame && (
              <span className="text-[10px] text-warning">(only applies to 29.97/59.94)</span>
            )}
          </label>
          <div>
            <label className="text-xs text-muted">Link to Device</label>
            <select
              value={gen.linkedDeviceId ?? ''}
              onChange={(e) => updateGen(gen.id, { linkedDeviceId: e.target.value || undefined })}
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm focus:border-accent focus:outline-none"
            >
              <option value="">None</option>
              {devices.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted">Set Start Time</label>
            <div className="mt-1 flex items-center gap-1">
              {(['hours', 'minutes', 'seconds', 'frames'] as const).map((field) => (
                <input
                  key={field}
                  type="number"
                  min={0}
                  max={field === 'hours' ? 23 : field === 'frames' ? Math.ceil(gen.frameRate) - 1 : 59}
                  value={gen[field]}
                  onChange={(e) => updateGen(gen.id, { [field]: Math.max(0, parseInt(e.target.value) || 0) })}
                  className="w-14 rounded-lg border border-border bg-surface px-2 py-1.5 text-center text-sm font-mono focus:border-accent focus:outline-none"
                  aria-label={field}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TimecodePage() {
  const generators = useStore((s) => s.timecodeGenerators);
  const addGenerator = useStore((s) => s.addTimecodeGenerator);
  const tickTimecode = useStore((s) => s.tickTimecode);
  const intervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Manage tick intervals for running generators
  useEffect(() => {
    const currentIntervals = intervalsRef.current;

    for (const gen of generators) {
      if (gen.running && !currentIntervals.has(gen.id)) {
        const intervalMs = 1000 / Math.ceil(gen.frameRate);
        const interval = setInterval(() => tickTimecode(gen.id), intervalMs);
        currentIntervals.set(gen.id, interval);
      } else if (!gen.running && currentIntervals.has(gen.id)) {
        clearInterval(currentIntervals.get(gen.id)!);
        currentIntervals.delete(gen.id);
      }
    }

    // Clean up intervals for removed generators
    Array.from(currentIntervals.entries()).forEach(([id, interval]) => {
      if (!generators.find((g) => g.id === id)) {
        clearInterval(interval);
        currentIntervals.delete(id);
      }
    });

    return () => {
      Array.from(currentIntervals.values()).forEach((interval) => {
        clearInterval(interval);
      });
      currentIntervals.clear();
    };
  }, [generators, tickTimecode]);

  const handleAddGenerator = useCallback(() => {
    addGenerator({
      id: uuidv4(),
      name: `TC ${generators.length + 1}`,
      frameRate: 25,
      dropFrame: false,
      source: 'internal',
      running: false,
      hours: 0,
      minutes: 0,
      seconds: 0,
      frames: 0,
    });
  }, [addGenerator, generators.length]);

  // Count running
  const runningCount = generators.filter((g) => g.running).length;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Timer className="h-5 w-5 text-accent" />
            Timecode
          </h1>
          <p className="text-xs text-muted mt-0.5">
            {generators.length} generator{generators.length !== 1 ? 's' : ''} &middot; {runningCount} running
          </p>
        </div>
        <button
          onClick={handleAddGenerator}
          className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/80"
        >
          <Plus className="h-4 w-4" />
          Add Generator
        </button>
      </div>

      {/* Generators grid */}
      {generators.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
          <Timer className="h-12 w-12 text-muted/30 mb-3" />
          <p className="text-sm text-muted mb-1">No timecode generators</p>
          <p className="text-xs text-muted/60 mb-4">Add a generator to start producing timecode</p>
          <button
            onClick={handleAddGenerator}
            className="flex items-center gap-2 rounded-xl bg-surface-2 px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-white"
          >
            <Plus className="h-4 w-4" />
            Add Generator
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {generators.map((gen) => (
            <TimecodeCard key={gen.id} gen={gen} />
          ))}
        </div>
      )}

      {/* Reference info */}
      <div className="mt-8 rounded-xl border border-border bg-surface/50 p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Reference</h3>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs text-muted sm:grid-cols-4">
          <div><span className="font-mono text-foreground">25 fps</span> — PAL / EBU</div>
          <div><span className="font-mono text-foreground">29.97 DF</span> — NTSC broadcast</div>
          <div><span className="font-mono text-foreground">30 fps</span> — NTSC (non-drop)</div>
          <div><span className="font-mono text-foreground">24 fps</span> — Film / Cinema</div>
          <div><span className="font-mono text-foreground">23.976</span> — Film pulldown</div>
          <div><span className="font-mono text-foreground">50 fps</span> — PAL progressive</div>
          <div><span className="font-mono text-foreground">59.94</span> — NTSC progressive</div>
          <div><span className="font-mono text-foreground">60 fps</span> — High frame rate</div>
        </div>
      </div>
    </div>
  );
}
