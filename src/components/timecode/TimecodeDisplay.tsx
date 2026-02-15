'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Plus, Trash2 } from 'lucide-react';
import { useStore } from '@/store';
import { TimecodeState, TimecodeFrameRate } from '@/types';

function padTC(n: number): string {
  return n.toString().padStart(2, '0');
}

function formatTimecode(tc: TimecodeState, dropFrame: boolean): string {
  const sep = dropFrame ? ';' : ':';
  return `${padTC(tc.hours)}:${padTC(tc.minutes)}:${padTC(tc.seconds)}${sep}${padTC(tc.frames)}`;
}

function incrementTimecode(tc: TimecodeState, frameRate: TimecodeFrameRate, dropFrame: boolean): TimecodeState {
  let { hours, minutes, seconds, frames } = tc;
  const maxFrames = Math.ceil(frameRate);

  frames++;
  if (frames >= maxFrames) {
    frames = 0;
    seconds++;

    // Drop frame logic for 29.97 and 59.94
    if (dropFrame && (frameRate === 29.97 || frameRate === 59.94)) {
      const dropCount = frameRate === 59.94 ? 4 : 2;
      if (seconds >= 60) {
        seconds = 0;
        minutes++;
        // Drop frames at minute boundaries except every 10th minute
        if (minutes % 10 !== 0) {
          frames = dropCount;
        }
      }
    } else if (seconds >= 60) {
      seconds = 0;
      minutes++;
    }
  }

  if (minutes >= 60) {
    minutes = 0;
    hours++;
  }
  if (hours >= 24) {
    hours = 0;
  }

  return { hours, minutes, seconds, frames };
}

const FRAME_RATES: TimecodeFrameRate[] = [23.976, 24, 25, 29.97, 30, 48, 50, 59.94, 60];

export default function TimecodeDisplay() {
  const generators = useStore((s) => s.timecodeGenerators);
  const setTimecodeRunning = useStore((s) => s.setTimecodeRunning);
  const setTimecodeValue = useStore((s) => s.setTimecodeValue);
  const setTimecodeFrameRate = useStore((s) => s.setTimecodeFrameRate);
  const resetTimecode = useStore((s) => s.resetTimecode);
  const addTimecodeGenerator = useStore((s) => s.addTimecodeGenerator);
  const removeTimecodeGenerator = useStore((s) => s.removeTimecodeGenerator);

  const intervalsRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());
  const generatorsRef = useRef(generators);
  generatorsRef.current = generators;

  const tick = useCallback((genId: string) => {
    const gen = generatorsRef.current.find((g) => g.id === genId);
    if (!gen || !gen.running) return;
    const next = incrementTimecode(gen.timecode, gen.frameRate, gen.dropFrame);
    setTimecodeValue(genId, next);
  }, [setTimecodeValue]);

  useEffect(() => {
    generators.forEach((gen) => {
      const existing = intervalsRef.current.get(gen.id);
      if (gen.running && !existing) {
        const intervalMs = 1000 / Math.ceil(gen.frameRate);
        const id = setInterval(() => tick(gen.id), intervalMs);
        intervalsRef.current.set(gen.id, id);
      } else if (!gen.running && existing) {
        clearInterval(existing);
        intervalsRef.current.delete(gen.id);
      }
    });

    // Clean up removed generators
    intervalsRef.current.forEach((intervalId, genId) => {
      if (!generators.find((g) => g.id === genId)) {
        clearInterval(intervalId);
        intervalsRef.current.delete(genId);
      }
    });

    const currentIntervals = intervalsRef.current;
    return () => {
      currentIntervals.forEach((id) => clearInterval(id));
      currentIntervals.clear();
    };
  }, [generators, tick]);

  const handleToggle = (id: string, running: boolean) => {
    setTimecodeRunning(id, !running);
  };

  const handleReset = (id: string) => {
    setTimecodeRunning(id, false);
    resetTimecode(id);
  };

  const outputTypeLabels: Record<string, string> = {
    ltc: 'LTC',
    mtc: 'MTC',
    artnet: 'Art-Net',
    sacn: 'sACN',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Timecode Generators</h2>
        <button
          onClick={() => addTimecodeGenerator(`TC Gen ${generators.length + 1}`)}
          className="flex items-center gap-2 rounded-lg bg-accent/15 px-3 py-2 text-sm text-accent hover:bg-accent/25 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Generator
        </button>
      </div>

      <div className="grid gap-4">
        {generators.map((gen) => (
          <div
            key={gen.id}
            className="glass-card p-5 space-y-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-2.5 w-2.5 rounded-full ${gen.running ? 'bg-success status-pulse' : 'bg-muted'}`} />
                <span className="text-sm font-medium text-foreground">{gen.name}</span>
                <span className="rounded bg-surface-2 px-2 py-0.5 text-xs text-muted">
                  {outputTypeLabels[gen.outputType]}
                </span>
                {gen.dropFrame && (
                  <span className="rounded bg-warning/15 px-2 py-0.5 text-xs text-warning">DF</span>
                )}
              </div>
              <button
                onClick={() => removeTimecodeGenerator(gen.id)}
                className="text-muted hover:text-error transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {/* Timecode display */}
            <div className="flex items-center gap-4">
              <div className="flex-1 rounded-lg bg-[#0a0a12] border border-border px-6 py-4 font-mono">
                <div className="text-4xl font-bold tracking-wider text-center" style={{ color: gen.running ? '#22c55e' : '#e0e0e8' }}>
                  {formatTimecode(gen.timecode, gen.dropFrame)}
                </div>
                <div className="text-center text-xs text-muted mt-1">
                  {gen.frameRate} fps {gen.dropFrame ? '(Drop Frame)' : '(Non-Drop)'} &bull; {gen.format}
                </div>
              </div>
            </div>

            {/* Transport controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleToggle(gen.id, gen.running)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  gen.running
                    ? 'bg-warning/15 text-warning hover:bg-warning/25'
                    : 'bg-success/15 text-success hover:bg-success/25'
                }`}
              >
                {gen.running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {gen.running ? 'Pause' : 'Play'}
              </button>

              <button
                onClick={() => handleReset(gen.id)}
                className="flex items-center gap-2 rounded-lg bg-surface-2 px-4 py-2 text-sm text-muted hover:text-foreground transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>

              {/* Frame rate selector */}
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs text-muted">Frame Rate:</span>
                <select
                  value={gen.frameRate}
                  onChange={(e) => setTimecodeFrameRate(gen.id, parseFloat(e.target.value) as TimecodeFrameRate)}
                  className="rounded-md border border-border bg-surface px-2 py-1 text-sm text-foreground"
                >
                  {FRAME_RATES.map((fr) => (
                    <option key={fr} value={fr}>
                      {fr} fps
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}

        {generators.length === 0 && (
          <div className="glass-card p-12 text-center text-muted">
            <p className="text-lg">No timecode generators</p>
            <p className="text-sm mt-1">Click &quot;Add Generator&quot; to create one</p>
          </div>
        )}
      </div>
    </div>
  );
}
