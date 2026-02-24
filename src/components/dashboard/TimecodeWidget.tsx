'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Clock, ChevronRight } from 'lucide-react';

import { LTCGenerator } from '@/lib/timecode/ltc-generator';
import { type Timecode, type GeneratorStatus } from '@/lib/timecode/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const FRAME_RATE = '25' as const;
const TEST_TC: Timecode = { hours: 4, minutes: 20, seconds: 0, frames: 0 };
const ACCENT = '#6366f1';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function formatDisplay(tc: Timecode): string {
  return `${pad(tc.hours)}:${pad(tc.minutes)}:${pad(tc.seconds)}:${pad(tc.frames)}`;
}

// ─── TimecodeWidget ───────────────────────────────────────────────────────────

export default function TimecodeWidget() {
  const [timecode, setTimecode]         = useState<Timecode>(TEST_TC);
  const [status, setStatus]             = useState<GeneratorStatus>('stopped');
  const [devices, setDevices]           = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<MediaDeviceInfo | null>(null);

  const generatorRef = useRef<LTCGenerator | null>(null);

  // ── Enumerate audio output devices ──────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function loadDevices() {
      try {
        // Request permission so device labels are populated
        await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => {});
        const all = await navigator.mediaDevices.enumerateDevices();
        if (cancelled) return;
        const outputs = all.filter((d) => d.kind === 'audiooutput');
        setDevices(outputs);
        if (outputs.length > 0 && !selectedDevice) {
          setSelectedDevice(outputs[0]);
        }
      } catch {
        // Silently fail — browser may not support enumerateDevices
      }
    }

    loadDevices();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Cleanup on unmount ───────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      generatorRef.current?.stop();
    };
  }, []);

  // ── Start handler ────────────────────────────────────────────────────────────
  const handleStart = useCallback(async () => {
    if (status === 'running') return;
    if (!selectedDevice) return;

    // Stop any existing generator first
    generatorRef.current?.stop();
    generatorRef.current = null;

    const gen = new LTCGenerator(FRAME_RATE);
    gen.setTimecode(TEST_TC.hours, TEST_TC.minutes, TEST_TC.seconds, TEST_TC.frames);

    gen.onFrame = (tc: Timecode) => {
      setTimecode({ ...tc });
    };

    gen.onError = (err: Error) => {
      console.error('[TimecodeWidget]', err);
      setStatus('error');
    };

    generatorRef.current = gen;

    try {
      await gen.start(selectedDevice);
      setTimecode({ ...TEST_TC }); // reset display to starting position
      setStatus('running');
    } catch {
      setStatus('error');
    }
  }, [status, selectedDevice]);

  // ── Stop handler ─────────────────────────────────────────────────────────────
  const handleStop = useCallback(() => {
    generatorRef.current?.stop();
    generatorRef.current = null;
    setStatus('stopped');
    // timecode state stays at whatever the last frame was — intentional
  }, []);

  // ── Derived ──────────────────────────────────────────────────────────────────
  const isRunning   = status === 'running';
  const hasDevice   = selectedDevice !== null;
  const displayStr  = formatDisplay(timecode);

  const statusDotColor =
    status === 'running' ? '#22c55e' :
    status === 'error'   ? '#ef4444' :
                           '#4a4a5e';

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '12px',
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        maxHeight: '200px',
        boxSizing: 'border-box',
      }}
    >
      {/* ── Header row ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={13} style={{ color: ACCENT }} />
          <span
            style={{
              fontSize: '10px',
              fontFamily: 'monospace',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: ACCENT,
              fontWeight: 600,
            }}
          >
            Timecode
          </span>
        </div>

        {/* Status dot + label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: statusDotColor,
              display: 'inline-block',
              ...(isRunning && {
                boxShadow: `0 0 0 0 ${statusDotColor}`,
                animation: 'tc-pulse 1.6s ease-out infinite',
              }),
            }}
          />
          <span
            style={{
              fontSize: '10px',
              fontFamily: 'monospace',
              color: '#5a5a6e',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            {status === 'running' ? 'Running' : status === 'error' ? 'Error' : 'Stopped'}
          </span>
        </div>
      </div>

      {/* ── Timecode display row ── */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <span
          style={{
            fontFamily: 'monospace',
            fontSize: '28px',
            fontWeight: 700,
            letterSpacing: '0.05em',
            color: isRunning ? '#f0f0f8' : '#7a7a8e',
            lineHeight: 1,
            transition: 'color 0.2s',
          }}
        >
          {displayStr}
        </span>
        <span
          style={{
            fontSize: '10px',
            fontFamily: 'monospace',
            color: ACCENT,
            background: `${ACCENT}18`,
            border: `1px solid ${ACCENT}30`,
            borderRadius: '4px',
            padding: '1px 6px',
            letterSpacing: '0.08em',
            flexShrink: 0,
          }}
        >
          {FRAME_RATE}fps
        </span>
      </div>

      {/* ── Audio output selector ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <select
          disabled={isRunning || devices.length === 0}
          value={selectedDevice?.deviceId ?? ''}
          onChange={(e) => {
            const found = devices.find((d) => d.deviceId === e.target.value) ?? null;
            setSelectedDevice(found);
          }}
          style={{
            flex: 1,
            minWidth: 0,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '6px',
            color: devices.length === 0 ? '#4a4a5e' : '#c0c0d0',
            fontSize: '11px',
            fontFamily: 'monospace',
            padding: '4px 8px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            opacity: isRunning ? 0.5 : 1,
            outline: 'none',
            // Ensure truncation on long device names
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          aria-label="Audio output device"
        >
          {devices.length === 0 ? (
            <option value="">No audio outputs found</option>
          ) : (
            devices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || `Output ${d.deviceId.slice(0, 8)}`}
              </option>
            ))
          )}
        </select>
      </div>

      {/* ── Controls row ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
        }}
      >
        {/* Buttons */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {/* Start Test */}
          <button
            onClick={handleStart}
            disabled={isRunning || !hasDevice}
            style={{
              fontSize: '11px',
              fontFamily: 'monospace',
              fontWeight: 600,
              padding: '5px 12px',
              borderRadius: '6px',
              border: 'none',
              cursor: isRunning || !hasDevice ? 'not-allowed' : 'pointer',
              background: isRunning || !hasDevice ? 'rgba(99,102,241,0.25)' : ACCENT,
              color: isRunning || !hasDevice ? 'rgba(255,255,255,0.3)' : '#fff',
              letterSpacing: '0.04em',
              transition: 'background 0.15s, color 0.15s',
              whiteSpace: 'nowrap',
            }}
            title="Start at 04:20:00:00 @ 25fps"
          >
            Start Test
          </button>

          {/* Stop */}
          <button
            onClick={handleStop}
            disabled={!isRunning}
            style={{
              fontSize: '11px',
              fontFamily: 'monospace',
              fontWeight: 600,
              padding: '5px 12px',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.08)',
              cursor: !isRunning ? 'not-allowed' : 'pointer',
              background: !isRunning ? 'transparent' : 'rgba(255,255,255,0.06)',
              color: !isRunning ? '#3a3a4e' : '#c0c0d0',
              letterSpacing: '0.04em',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            Stop
          </button>
        </div>

        {/* Full page link */}
        <Link
          href="/timecode"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            fontSize: '10px',
            fontFamily: 'monospace',
            color: '#4a4a5e',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            letterSpacing: '0.05em',
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.color = '#9a9aae';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.color = '#4a4a5e';
          }}
        >
          Full Timecode
          <ChevronRight size={11} />
        </Link>
      </div>

      {/* ── Keyframe for status-dot pulse (injected once) ── */}
      <style>{`
        @keyframes tc-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(34,197,94,0.7); }
          70%  { box-shadow: 0 0 0 5px rgba(34,197,94,0); }
          100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
        }
      `}</style>
    </div>
  );
}
