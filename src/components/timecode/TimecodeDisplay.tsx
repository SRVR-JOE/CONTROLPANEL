'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { type Timecode, type FrameRate, isDropFrame, nominalFps, clampTimecode } from '@/lib/timecode/types';

type Field = 'hours' | 'minutes' | 'seconds' | 'frames';

interface TimecodeDisplayProps {
  timecode: Timecode;
  frameRate: FrameRate;
  status: 'running' | 'stopped' | 'error';
  onTimecodeChange?: (tc: Timecode) => void;
  /** Whether TC fields are editable (false while running) */
  editable?: boolean;
}

const FIELD_ORDER: Field[] = ['hours', 'minutes', 'seconds', 'frames'];

const FIELD_MAX: Record<Field, (fr: FrameRate) => number> = {
  hours:   () => 23,
  minutes: () => 59,
  seconds: () => 59,
  frames:  (fr) => nominalFps(fr) - 1,
};

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export default function TimecodeDisplay({
  timecode,
  frameRate,
  status,
  onTimecodeChange,
  editable = true,
}: TimecodeDisplayProps) {
  const [editingField, setEditingField] = useState<Field | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const df = isDropFrame(frameRate);

  // Color scheme based on status
  const colorClass = {
    running: 'text-green-400',
    stopped: 'text-yellow-400',
    error:   'text-red-400',
  }[status];

  const glowClass = {
    running: 'drop-shadow-[0_0_20px_rgba(34,197,94,0.4)]',
    stopped: 'drop-shadow-[0_0_20px_rgba(245,158,11,0.25)]',
    error:   'drop-shadow-[0_0_20px_rgba(239,68,68,0.4)]',
  }[status];

  const startEditing = useCallback(
    (field: Field) => {
      if (!editable || status === 'running') return;
      setEditingField(field);
      setEditValue(pad(timecode[field]));
    },
    [editable, status, timecode]
  );

  const commitEdit = useCallback(() => {
    if (!editingField || !onTimecodeChange) return;
    const raw = parseInt(editValue, 10);
    if (!isNaN(raw)) {
      const max = FIELD_MAX[editingField](frameRate);
      const clamped = Math.max(0, Math.min(max, raw));
      const updated = clampTimecode({ ...timecode, [editingField]: clamped }, frameRate);
      onTimecodeChange(updated);
    }
    setEditingField(null);
    setEditValue('');
  }, [editingField, editValue, timecode, frameRate, onTimecodeChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        commitEdit();
      } else if (e.key === 'Escape') {
        setEditingField(null);
        setEditValue('');
      } else if (e.key === 'Tab') {
        e.preventDefault();
        commitEdit();
        // Move to next/previous field
        const idx = FIELD_ORDER.indexOf(editingField!);
        const next = e.shiftKey ? idx - 1 : idx + 1;
        if (next >= 0 && next < FIELD_ORDER.length) {
          const nextField = FIELD_ORDER[next];
          setEditingField(nextField);
          setEditValue(pad(timecode[nextField]));
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const max = FIELD_MAX[editingField!](frameRate);
        const cur = parseInt(editValue, 10) || 0;
        setEditValue(pad(Math.min(max, cur + 1)));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const cur = parseInt(editValue, 10) || 0;
        setEditValue(pad(Math.max(0, cur - 1)));
      }
    },
    [editingField, editValue, commitEdit, timecode, frameRate]
  );

  // Focus input when editing starts
  useEffect(() => {
    if (editingField && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingField]);

  const renderField = (field: Field, value: number) => {
    const isEditing = editingField === field;
    const canEdit = editable && status !== 'running';

    if (isEditing) {
      return (
        <input
          key={field}
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value.replace(/\D/g, '').slice(0, 2))}
          onKeyDown={handleKeyDown}
          onBlur={commitEdit}
          className={`
            w-[2.8ch] bg-transparent border-b-2 border-accent text-center outline-none
            text-6xl md:text-7xl lg:text-8xl font-mono font-bold tracking-widest
            ${colorClass}
          `}
          style={{ width: '2.8ch' }}
          maxLength={2}
        />
      );
    }

    return (
      <span
        key={field}
        onClick={() => startEditing(field)}
        title={canEdit ? `Click to edit ${field}` : undefined}
        className={`
          font-mono font-bold tracking-widest select-none
          text-6xl md:text-7xl lg:text-8xl
          ${colorClass}
          ${canEdit ? 'cursor-pointer hover:opacity-80 transition-opacity' : 'cursor-default'}
        `}
      >
        {pad(value)}
      </span>
    );
  };

  // Separator between segments — semicolon before frames if drop-frame
  const sep = (index: number) => {
    // Between frames and seconds use ';' for DF, ':' otherwise
    const char = index === 2 && df ? ';' : ':';
    return (
      <span
        key={`sep-${index}`}
        className={`
          font-mono font-bold select-none
          text-6xl md:text-7xl lg:text-8xl
          ${colorClass} opacity-60
          ${status === 'running' ? 'animate-pulse' : ''}
        `}
        style={{ animationDuration: '1s' }}
      >
        {char}
      </span>
    );
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Main timecode display */}
      <div
        className={`
          flex items-center justify-center px-8 py-6
          bg-black/60 rounded-xl border border-border/50
          ${glowClass}
        `}
      >
        {FIELD_ORDER.map((field, idx) => (
          <React.Fragment key={field}>
            {renderField(field, timecode[field])}
            {idx < FIELD_ORDER.length - 1 && sep(idx)}
          </React.Fragment>
        ))}
      </div>

      {/* Metadata row */}
      <div className="flex items-center gap-3">
        {/* DF / NDF badge */}
        <span
          className={`
            text-[10px] font-mono font-bold px-2 py-0.5 rounded
            ${df
              ? 'bg-yellow-400/15 text-yellow-400 border border-yellow-400/30'
              : 'bg-surface-2 text-muted border border-border'
            }
          `}
        >
          {df ? 'DF' : 'NDF'}
        </span>

        {/* Status badge */}
        <span
          className={`
            flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded
            ${status === 'running'
              ? 'bg-green-400/10 text-green-400 border border-green-400/25'
              : status === 'error'
              ? 'bg-red-400/10 text-red-400 border border-red-400/25'
              : 'bg-surface-2 text-muted border border-border'
            }
          `}
        >
          {status === 'running' && (
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          )}
          {status === 'running' ? 'GENERATING' : status === 'error' ? 'ERROR' : 'STOPPED'}
        </span>

        {/* Edit hint */}
        {editable && status !== 'running' && (
          <span className="text-[10px] text-muted">
            Click a field to edit
          </span>
        )}
      </div>
    </div>
  );
}
