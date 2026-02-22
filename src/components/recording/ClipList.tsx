'use client';

import React from 'react';
import { Film, Play } from 'lucide-react';

interface ClipInfo {
  clipId: number;
  name: string;
  duration: string;
  format?: string;
  resolution?: string;
  frameRate?: string;
  fileSize?: number;
  startTimecode?: string;
}

interface ClipListProps {
  clips: ClipInfo[];
  isLoading: boolean;
  isConnected: boolean;
  onCueClip: (clipId: number) => void;
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return '';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export default function ClipList({
  clips,
  isLoading,
  isConnected,
  onCueClip,
}: ClipListProps) {
  return (
    <div
      className="rounded-xl border flex flex-col"
      style={{
        background: 'rgba(14,14,24,0.6)',
        borderColor: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(12px)',
        minHeight: 200,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4" style={{ color: '#6366f1' }} />
          <span className="text-xs font-mono uppercase tracking-[0.2em]" style={{ color: '#7a7a8e' }}>
            Clips
          </span>
        </div>
        <span className="text-[10px] font-mono" style={{ color: '#4a4a5e' }}>
          {clips.length > 0 ? `${clips.length} clip${clips.length !== 1 ? 's' : ''}` : ''}
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto" style={{ maxHeight: 280 }}>
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <span
              className="inline-block w-5 h-5 rounded-full border-2"
              style={{
                borderColor: '#3b82f6',
                borderTopColor: 'transparent',
                animation: 'spin 0.8s linear infinite',
              }}
            />
          </div>
        ) : !isConnected ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <Film className="w-8 h-8" style={{ color: '#2a2a3a' }} />
            <p className="text-xs font-mono" style={{ color: '#4a4a5e' }}>
              Connect a recorder to browse clips
            </p>
          </div>
        ) : clips.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <Film className="w-8 h-8" style={{ color: '#2a2a3a' }} />
            <p className="text-xs font-mono" style={{ color: '#4a4a5e' }}>
              No clips on this slot
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            {clips.map((clip) => (
              <ClipRow key={clip.clipId} clip={clip} onCue={onCueClip} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ClipRow sub-component
// ---------------------------------------------------------------------------

interface ClipRowProps {
  clip: ClipInfo;
  onCue: (clipId: number) => void;
}

function ClipRow({ clip, onCue }: ClipRowProps) {
  return (
    <div
      className="group flex items-center gap-3 px-4 py-2.5 transition-colors"
      style={{ cursor: 'default' }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = 'transparent';
      }}
    >
      {/* Clip ID */}
      <span
        className="flex-shrink-0 text-[10px] font-mono w-6 text-right"
        style={{ color: '#4a4a5e' }}
      >
        {clip.clipId}
      </span>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-mono font-medium truncate" style={{ color: '#c8c8d8' }}>
          {clip.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] font-mono" style={{ color: '#6b7280' }}>
            {clip.duration}
          </span>
          {clip.format && (
            <span
              className="text-[9px] font-mono px-1.5 py-0.5 rounded"
              style={{
                background: 'rgba(99,102,241,0.12)',
                color: '#8b8fdf',
                border: '1px solid rgba(99,102,241,0.2)',
              }}
            >
              {clip.format}
            </span>
          )}
          {clip.resolution && (
            <span className="text-[10px] font-mono" style={{ color: '#4a4a5e' }}>
              {clip.resolution}
            </span>
          )}
          {clip.frameRate && (
            <span className="text-[10px] font-mono" style={{ color: '#4a4a5e' }}>
              {clip.frameRate}fps
            </span>
          )}
          {clip.fileSize ? (
            <span className="text-[10px] font-mono" style={{ color: '#4a4a5e' }}>
              {formatBytes(clip.fileSize)}
            </span>
          ) : null}
        </div>
      </div>

      {/* Cue button */}
      <button
        onClick={() => onCue(clip.clipId)}
        className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 focus:outline-none"
        style={{
          background: 'rgba(34,197,94,0.15)',
          border: '1px solid rgba(34,197,94,0.3)',
          color: '#22c55e',
        }}
        title={`Cue clip ${clip.name}`}
      >
        <Play className="w-3 h-3 fill-current" />
      </button>
    </div>
  );
}
