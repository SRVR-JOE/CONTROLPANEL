'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Square, RotateCcw, Edit3, Radio } from 'lucide-react';
import { type Timecode, type FrameRate, parseTimecodeString, clampTimecode, formatTimecode } from '@/lib/timecode/types';

type TransportStatus = 'running' | 'stopped' | 'error';

interface TransportControlsProps {
  status: TransportStatus;
  timecode: Timecode;
  frameRate: FrameRate;
  hasOutputDevice: boolean;
  onPlay: () => void;
  onStop: () => void;
  onReset: () => void;
  onSetTimecode: (tc: Timecode) => void;
}

export default function TransportControls({
  status,
  timecode,
  frameRate,
  hasOutputDevice,
  onPlay,
  onStop,
  onReset,
  onSetTimecode,
}: TransportControlsProps) {
  const [showSetDialog, setShowSetDialog] = useState(false);
  const [setInput, setSetInput] = useState('');
  const [setError, setSetError] = useState('');
  const setInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showSetDialog) {
      setSetInput(formatTimecode(timecode, frameRate));
      setSetError('');
      setTimeout(() => setInputRef.current?.select(), 50);
    }
  }, [showSetDialog, timecode, frameRate]);

  const handleSet = () => {
    const parsed = parseTimecodeString(setInput);
    if (!parsed) {
      setSetError('Invalid format. Use HH:MM:SS:FF');
      return;
    }
    const clamped = clampTimecode(parsed, frameRate);
    onSetTimecode(clamped);
    setShowSetDialog(false);
  };

  const handleSetKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSet();
    else if (e.key === 'Escape') setShowSetDialog(false);
  };

  const isRunning = status === 'running';
  const canPlay = !isRunning && hasOutputDevice;

  return (
    <div className="flex flex-col gap-3">
      {/* Main transport row */}
      <div className="flex items-center gap-2">
        {/* Play */}
        <button
          onClick={onPlay}
          disabled={!canPlay}
          title={!hasOutputDevice ? 'Select an audio output device first' : isRunning ? 'Already running' : 'Start generating LTC'}
          className={`
            flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm
            transition-all duration-150 select-none
            ${canPlay
              ? 'bg-green-500/20 text-green-400 border border-green-500/40 hover:bg-green-500/30 hover:border-green-400/60 active:scale-95'
              : 'bg-surface text-muted border border-border cursor-not-allowed opacity-50'
            }
          `}
        >
          <Play size={16} fill={canPlay ? 'currentColor' : 'none'} />
          <span>Play</span>
        </button>

        {/* Stop */}
        <button
          onClick={onStop}
          disabled={!isRunning}
          title="Stop generating LTC"
          className={`
            flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm
            transition-all duration-150 select-none
            ${isRunning
              ? 'bg-red-500/15 text-red-400 border border-red-500/40 hover:bg-red-500/25 hover:border-red-400/60 active:scale-95'
              : 'bg-surface text-muted border border-border cursor-not-allowed opacity-50'
            }
          `}
        >
          <Square size={16} fill={isRunning ? 'currentColor' : 'none'} />
          <span>Stop</span>
        </button>

        {/* Divider */}
        <div className="w-px h-8 bg-border mx-1" />

        {/* Reset */}
        <button
          onClick={onReset}
          disabled={isRunning}
          title="Reset to 00:00:00:00"
          className={`
            flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm
            transition-all duration-150 select-none
            ${!isRunning
              ? 'bg-surface-2 text-foreground border border-border hover:border-accent/50 hover:text-accent active:scale-95'
              : 'bg-surface text-muted border border-border cursor-not-allowed opacity-50'
            }
          `}
        >
          <RotateCcw size={15} />
          <span>Reset</span>
        </button>

        {/* Set */}
        <button
          onClick={() => setShowSetDialog(true)}
          disabled={isRunning}
          title="Manually set timecode position"
          className={`
            flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm
            transition-all duration-150 select-none
            ${!isRunning
              ? 'bg-surface-2 text-foreground border border-border hover:border-accent/50 hover:text-accent active:scale-95'
              : 'bg-surface text-muted border border-border cursor-not-allowed opacity-50'
            }
          `}
        >
          <Edit3 size={15} />
          <span>Set</span>
        </button>
      </div>

      {/* Status indicator */}
      <div className="flex items-center gap-2 text-xs">
        <Radio
          size={12}
          className={
            status === 'running' ? 'text-green-400 animate-pulse' :
            status === 'error'   ? 'text-red-400' :
                                   'text-muted'
          }
        />
        <span
          className={
            status === 'running' ? 'text-green-400' :
            status === 'error'   ? 'text-red-400' :
            !hasOutputDevice     ? 'text-yellow-400' :
                                   'text-muted'
          }
        >
          {status === 'running' ? 'LTC signal active — generating frames' :
           status === 'error'   ? 'Generator error — check console' :
           !hasOutputDevice     ? 'No output device selected' :
                                  'Ready — press Play to start'}
        </span>
      </div>

      {/* Set timecode dialog (inline popover) */}
      {showSetDialog && (
        <div className="flex flex-col gap-3 p-4 bg-surface-2 border border-border rounded-lg">
          <p className="text-xs font-medium text-foreground">Set timecode position</p>
          <div className="flex items-center gap-2">
            <input
              ref={setInputRef}
              type="text"
              value={setInput}
              onChange={(e) => {
                setSetInput(e.target.value);
                setSetError('');
              }}
              onKeyDown={handleSetKeyDown}
              placeholder="HH:MM:SS:FF"
              className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:border-accent"
              maxLength={11}
            />
            <button
              onClick={handleSet}
              className="px-4 py-2 bg-accent text-white rounded-md text-sm font-medium hover:bg-accent/80 transition-colors"
            >
              Set
            </button>
            <button
              onClick={() => setShowSetDialog(false)}
              className="px-3 py-2 bg-surface-2 text-muted border border-border rounded-md text-sm hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
          {setError && (
            <p className="text-xs text-red-400">{setError}</p>
          )}
          <p className="text-[10px] text-muted">
            Format: HH:MM:SS:FF (e.g. 01:00:00:00). Use semicolon before frames for drop-frame (01:00:00;00).
          </p>
        </div>
      )}
    </div>
  );
}
