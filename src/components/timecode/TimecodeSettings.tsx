'use client';

import { useState } from 'react';
import { Settings, Link2, Clock, Zap } from 'lucide-react';
import { useStore } from '@/store';
import { TimecodeFormat, TimecodeState } from '@/types';

function padTC(n: number): string {
  return n.toString().padStart(2, '0');
}

export default function TimecodeSettings() {
  const generators = useStore((s) => s.timecodeGenerators);
  const updateTimecodeGenerator = useStore((s) => s.updateTimecodeGenerator);
  const jamSyncTimecode = useStore((s) => s.jamSyncTimecode);
  const setTimecodeFormat = useStore((s) => s.setTimecodeFormat);
  const setTimecodeValue = useStore((s) => s.setTimecodeValue);
  const [selectedGenId, setSelectedGenId] = useState<string>(generators[0]?.id ?? '');

  const gen = generators.find((g) => g.id === selectedGenId);

  const handleOffsetChange = (field: keyof TimecodeState, value: string) => {
    if (!gen) return;
    const num = parseInt(value) || 0;
    const clamped = field === 'hours' ? Math.min(Math.max(num, 0), 23) :
                    field === 'frames' ? Math.min(Math.max(num, 0), Math.ceil(gen.frameRate) - 1) :
                    Math.min(Math.max(num, 0), 59);
    updateTimecodeGenerator(gen.id, {
      offset: { ...gen.offset, [field]: clamped },
    });
  };

  const handleStartTimeChange = (field: keyof TimecodeState, value: string) => {
    if (!gen || gen.running) return;
    const num = parseInt(value) || 0;
    const clamped = field === 'hours' ? Math.min(Math.max(num, 0), 23) :
                    field === 'frames' ? Math.min(Math.max(num, 0), Math.ceil(gen.frameRate) - 1) :
                    Math.min(Math.max(num, 0), 59);
    setTimecodeValue(gen.id, { ...gen.timecode, [field]: clamped });
  };

  if (generators.length === 0) {
    return (
      <div className="glass-card p-8 text-center text-muted">
        <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No generators to configure</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Generator Settings</h2>

      {/* Generator selector */}
      <div className="flex gap-2">
        {generators.map((g) => (
          <button
            key={g.id}
            onClick={() => setSelectedGenId(g.id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              selectedGenId === g.id
                ? 'bg-accent text-white'
                : 'bg-surface-2 text-muted hover:text-foreground'
            }`}
          >
            {g.name}
          </button>
        ))}
      </div>

      {gen && (
        <div className="space-y-4">
          {/* Name */}
          <div className="glass-card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium text-foreground">General</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted mb-1">Generator Name</label>
                <input
                  type="text"
                  value={gen.name}
                  onChange={(e) => updateTimecodeGenerator(gen.id, { name: e.target.value })}
                  className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-foreground focus:border-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Format</label>
                <select
                  value={gen.format}
                  onChange={(e) => setTimecodeFormat(gen.id, e.target.value as TimecodeFormat)}
                  className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-foreground"
                >
                  <option value="SMPTE">SMPTE</option>
                  <option value="EBU">EBU</option>
                  <option value="MIDI">MIDI</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={gen.dropFrame}
                  onChange={(e) => updateTimecodeGenerator(gen.id, { dropFrame: e.target.checked })}
                  className="rounded border-border"
                />
                Drop Frame
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={gen.freeRunning}
                  onChange={(e) => updateTimecodeGenerator(gen.id, { freeRunning: e.target.checked })}
                  className="rounded border-border"
                />
                Free Running
              </label>
            </div>
          </div>

          {/* Start time */}
          <div className="glass-card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-success" />
              <span className="text-sm font-medium text-foreground">Start Time</span>
              {gen.running && <span className="text-xs text-warning">(stop to edit)</span>}
            </div>
            <div className="flex items-center gap-1 font-mono">
              {(['hours', 'minutes', 'seconds', 'frames'] as const).map((field, i) => (
                <div key={field} className="flex items-center">
                  {i > 0 && <span className="text-muted mx-1">{i === 3 && gen.dropFrame ? ';' : ':'}</span>}
                  <input
                    type="number"
                    value={padTC(gen.timecode[field])}
                    onChange={(e) => handleStartTimeChange(field, e.target.value)}
                    disabled={gen.running}
                    className="w-12 rounded-md border border-border bg-surface px-2 py-1.5 text-center text-sm font-mono text-foreground disabled:opacity-50 focus:border-accent focus:outline-none"
                    min={0}
                    max={field === 'hours' ? 23 : field === 'frames' ? Math.ceil(gen.frameRate) - 1 : 59}
                  />
                  <span className="ml-1 text-xs text-muted">
                    {field === 'hours' ? 'HH' : field === 'minutes' ? 'MM' : field === 'seconds' ? 'SS' : 'FF'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Offset */}
          <div className="glass-card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-warning" />
              <span className="text-sm font-medium text-foreground">TC Offset</span>
            </div>
            <div className="flex items-center gap-1 font-mono">
              {(['hours', 'minutes', 'seconds', 'frames'] as const).map((field, i) => (
                <div key={field} className="flex items-center">
                  {i > 0 && <span className="text-muted mx-1">:</span>}
                  <input
                    type="number"
                    value={padTC(gen.offset[field])}
                    onChange={(e) => handleOffsetChange(field, e.target.value)}
                    className="w-12 rounded-md border border-border bg-surface px-2 py-1.5 text-center text-sm font-mono text-foreground focus:border-accent focus:outline-none"
                    min={0}
                    max={field === 'hours' ? 23 : field === 'frames' ? Math.ceil(gen.frameRate) - 1 : 59}
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-muted">Offset applied to timecode output relative to the internal clock</p>
          </div>

          {/* Jam Sync */}
          <div className="glass-card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-purple-400" />
              <span className="text-sm font-medium text-foreground">Jam Sync</span>
            </div>

            <div className="flex items-center gap-3">
              <div className={`h-2.5 w-2.5 rounded-full ${gen.jamSynced ? 'bg-success status-pulse' : 'bg-muted'}`} />
              <span className="text-sm text-foreground">
                {gen.jamSynced ? `Synced to ${gen.jamSyncSource}` : 'Not synced'}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => jamSyncTimecode(gen.id, 'External LTC Input')}
                className="rounded-lg bg-surface-2 px-3 py-1.5 text-sm text-muted hover:text-foreground transition-colors"
              >
                Jam to LTC
              </button>
              <button
                onClick={() => jamSyncTimecode(gen.id, 'Network NTP')}
                className="rounded-lg bg-surface-2 px-3 py-1.5 text-sm text-muted hover:text-foreground transition-colors"
              >
                Jam to NTP
              </button>
              <button
                onClick={() => jamSyncTimecode(gen.id, 'GPS PPS')}
                className="rounded-lg bg-surface-2 px-3 py-1.5 text-sm text-muted hover:text-foreground transition-colors"
              >
                Jam to GPS
              </button>
              {gen.jamSynced && (
                <button
                  onClick={() => updateTimecodeGenerator(gen.id, { jamSynced: false, jamSyncSource: undefined })}
                  className="rounded-lg bg-error/15 px-3 py-1.5 text-sm text-error hover:bg-error/25 transition-colors"
                >
                  Release Sync
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
