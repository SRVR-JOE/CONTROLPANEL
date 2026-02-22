'use client';

import React from 'react';
import { Square, Play, ChevronRight, ChevronLeft, Circle } from 'lucide-react';

type TransportState = 'recording' | 'stopped' | 'playing' | 'preview' | 'forward' | 'rewind' | 'unknown';
type TransportAction = 'record' | 'stop' | 'play' | 'ff' | 'rew';

interface TransportControlsProps {
  transportState: TransportState;
  timecode: string;
  isConnected: boolean;
  isLoading: boolean;
  onTransport: (action: TransportAction) => void;
}

const STATE_LABELS: Record<TransportState, string> = {
  recording: 'RECORDING',
  stopped:   'STOPPED',
  playing:   'PLAYING',
  preview:   'PREVIEW',
  forward:   'FAST FWD',
  rewind:    'REWIND',
  unknown:   'NO DECK',
};

const STATE_COLORS: Record<TransportState, string> = {
  recording: '#ef4444',
  stopped:   '#6b7280',
  playing:   '#22c55e',
  preview:   '#f59e0b',
  forward:   '#3b82f6',
  rewind:    '#3b82f6',
  unknown:   '#4a4a5e',
};

export default function TransportControls({
  transportState,
  timecode,
  isConnected,
  isLoading,
  onTransport,
}: TransportControlsProps) {
  const isRecording = transportState === 'recording';
  const isPlaying   = transportState === 'playing';
  const disabled    = !isConnected || isLoading;
  const stateColor  = STATE_COLORS[transportState];

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Status badge */}
      <div className="flex items-center gap-2">
        <span
          className="inline-block w-2.5 h-2.5 rounded-full"
          style={{
            backgroundColor: stateColor,
            boxShadow: isRecording ? `0 0 12px ${stateColor}, 0 0 24px ${stateColor}` : 'none',
            animation: isRecording ? 'pulse 1.2s ease-in-out infinite' : 'none',
          }}
        />
        <span
          className="text-xs font-mono tracking-[0.25em] uppercase font-semibold"
          style={{ color: stateColor }}
        >
          {isConnected ? STATE_LABELS[transportState] : 'NO DECK'}
        </span>
      </div>

      {/* Timecode display */}
      <div
        className="px-6 py-4 rounded-xl border"
        style={{
          background: 'rgba(0,0,0,0.4)',
          borderColor: isRecording ? `${stateColor}60` : 'rgba(255,255,255,0.06)',
          boxShadow: isRecording ? `0 0 20px ${stateColor}20, inset 0 0 20px rgba(0,0,0,0.5)` : 'inset 0 0 20px rgba(0,0,0,0.5)',
        }}
      >
        <p
          className="text-5xl font-mono font-bold tracking-widest tabular-nums"
          style={{
            color: isConnected ? (isRecording ? '#ef4444' : '#f0f0f8') : '#2a2a3a',
            textShadow: isRecording ? `0 0 20px #ef444460` : 'none',
            letterSpacing: '0.1em',
          }}
        >
          {isConnected ? timecode : '00:00:00:00'}
        </p>
      </div>

      {/* Transport button row */}
      <div className="flex items-center gap-3">
        {/* Rewind */}
        <TransportButton
          onClick={() => onTransport('rew')}
          disabled={disabled}
          active={transportState === 'rewind'}
          title="Rewind"
          activeColor="#3b82f6"
        >
          <ChevronLeft className="w-5 h-5" />
          <ChevronLeft className="w-5 h-5 -ml-3" />
        </TransportButton>

        {/* Stop */}
        <TransportButton
          onClick={() => onTransport('stop')}
          disabled={disabled}
          active={transportState === 'stopped'}
          title="Stop"
          activeColor="#6b7280"
          size="md"
        >
          <Square className="w-5 h-5 fill-current" />
        </TransportButton>

        {/* Record — large, center, red */}
        <button
          onClick={() => onTransport('record')}
          disabled={disabled}
          title="Record"
          className="relative flex items-center justify-center rounded-full transition-all duration-150 focus:outline-none"
          style={{
            width: 72,
            height: 72,
            background: disabled
              ? 'rgba(30,30,40,0.6)'
              : isRecording
              ? 'radial-gradient(circle, #ef4444 0%, #b91c1c 100%)'
              : 'radial-gradient(circle, #991b1b 0%, #450a0a 100%)',
            border: isRecording
              ? '2px solid #ef4444'
              : disabled
              ? '2px solid rgba(255,255,255,0.05)'
              : '2px solid #7f1d1d',
            boxShadow: isRecording
              ? '0 0 20px #ef444480, 0 0 40px #ef444440, inset 0 1px 0 rgba(255,255,255,0.1)'
              : 'inset 0 1px 0 rgba(255,255,255,0.05)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.4 : 1,
          }}
        >
          <Circle
            className="fill-current"
            style={{
              width: 26,
              height: 26,
              color: disabled ? '#4a4a5e' : isRecording ? '#fff' : '#fca5a5',
            }}
          />
          {isRecording && (
            <span
              className="absolute inset-0 rounded-full"
              style={{
                border: '2px solid #ef4444',
                animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite',
                opacity: 0.4,
              }}
            />
          )}
        </button>

        {/* Play */}
        <TransportButton
          onClick={() => onTransport('play')}
          disabled={disabled}
          active={isPlaying}
          title="Play"
          activeColor="#22c55e"
          size="md"
        >
          <Play className="w-5 h-5 fill-current" />
        </TransportButton>

        {/* Fast Forward */}
        <TransportButton
          onClick={() => onTransport('ff')}
          disabled={disabled}
          active={transportState === 'forward'}
          title="Fast Forward"
          activeColor="#3b82f6"
        >
          <ChevronRight className="w-5 h-5" />
          <ChevronRight className="w-5 h-5 -ml-3" />
        </TransportButton>
      </div>

      {/* Loading overlay indicator */}
      {isLoading && (
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-3 h-3 rounded-full border-2 border-t-transparent"
            style={{
              borderColor: '#3b82f6',
              borderTopColor: 'transparent',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <span className="text-xs font-mono" style={{ color: '#6b7280' }}>
            Sending command...
          </span>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: generic transport button
// ---------------------------------------------------------------------------

interface TransportButtonProps {
  onClick: () => void;
  disabled: boolean;
  active: boolean;
  title: string;
  activeColor: string;
  size?: 'sm' | 'md';
  children: React.ReactNode;
}

function TransportButton({
  onClick,
  disabled,
  active,
  title,
  activeColor,
  size = 'sm',
  children,
}: TransportButtonProps) {
  const dim = size === 'md' ? 52 : 44;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="flex items-center justify-center rounded-xl transition-all duration-150 focus:outline-none"
      style={{
        width: dim,
        height: dim,
        background: active
          ? `${activeColor}25`
          : disabled
          ? 'rgba(20,20,30,0.4)'
          : 'rgba(26,26,36,0.8)',
        border: active
          ? `1px solid ${activeColor}80`
          : '1px solid rgba(255,255,255,0.08)',
        color: active
          ? activeColor
          : disabled
          ? '#2a2a3a'
          : '#9ca3af',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        boxShadow: active
          ? `0 0 10px ${activeColor}40`
          : 'none',
      }}
    >
      {children}
    </button>
  );
}
