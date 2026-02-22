'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Clock, Info } from 'lucide-react';

import TimecodeDisplay from '@/components/timecode/TimecodeDisplay';
import TransportControls from '@/components/timecode/TransportControls';
import AudioOutputSelector from '@/components/timecode/AudioOutputSelector';
import QuickPlay from '@/components/timecode/QuickPlay';
import FrameRateSelector from '@/components/timecode/FrameRateSelector';

import { LTCGenerator } from '@/lib/timecode/ltc-generator';
import {
  type FrameRate,
  type Timecode,
  type GeneratorStatus,
} from '@/lib/timecode/types';

const ZERO_TC: Timecode = { hours: 0, minutes: 0, seconds: 0, frames: 0 };

export default function TimecodePage() {
  // ─── Generator state ─────────────────────────────────────────────────────
  const [frameRate, setFrameRate] = useState<FrameRate>('25');
  const [timecode, setTimecode] = useState<Timecode>(ZERO_TC);
  const [status, setStatus] = useState<GeneratorStatus>('stopped');
  const [selectedDevice, setSelectedDevice] = useState<MediaDeviceInfo | null>(null);
  const [signalLevel, setSignalLevel] = useState<number | null>(null);

  const generatorRef = useRef<LTCGenerator | null>(null);

  // ─── Keep generator frame rate in sync ───────────────────────────────────
  useEffect(() => {
    if (generatorRef.current) {
      // setFrameRate internally stops if running
      generatorRef.current.setFrameRate(frameRate);
    }
  }, [frameRate]);

  // ─── Transport handlers ───────────────────────────────────────────────────
  const handlePlay = useCallback(async () => {
    if (status === 'running') return;
    if (!selectedDevice) return;

    // Create a new generator (fresh AudioContext) each time play is pressed
    const gen = new LTCGenerator(frameRate);

    // Seed timecode position
    gen.setTimecode(timecode.hours, timecode.minutes, timecode.seconds, timecode.frames);

    // Wire up frame callback to drive the display
    gen.onFrame = (tc: Timecode) => {
      setTimecode({ ...tc });
      // Pulse the signal level meter while running (LTC is a fixed level signal)
      setSignalLevel(0.316); // -10 dBFS
    };

    gen.onError = (err: Error) => {
      console.error('[LTCGenerator]', err);
      setStatus('error');
      setSignalLevel(null);
    };

    generatorRef.current = gen;

    try {
      await gen.start(selectedDevice);
      setStatus('running');
    } catch {
      setStatus('error');
    }
  }, [status, selectedDevice, frameRate, timecode]);

  const handleStop = useCallback(() => {
    generatorRef.current?.stop();
    generatorRef.current = null;
    setStatus('stopped');
    setSignalLevel(null);
    // Capture current TC position from the generator before it's disposed
    // (already set via onFrame callbacks, so timecode state is up to date)
  }, []);

  const handleReset = useCallback(() => {
    if (status === 'running') return;
    setTimecode(ZERO_TC);
    if (generatorRef.current) {
      generatorRef.current.setTimecode(0, 0, 0, 0);
    }
  }, [status]);

  const handleSetTimecode = useCallback((tc: Timecode) => {
    setTimecode(tc);
    if (generatorRef.current) {
      generatorRef.current.setTimecode(tc.hours, tc.minutes, tc.seconds, tc.frames);
    }
  }, []);

  const handleFrameRateChange = useCallback((fr: FrameRate) => {
    if (status === 'running') return;
    setFrameRate(fr);
    setTimecode(ZERO_TC); // Reset position on frame rate change to avoid invalid frames
  }, [status]);

  // Quick Play: jump to HH:00:00:00 and immediately start
  const handleQuickPlay = useCallback(async (hour: number) => {
    if (status === 'running') {
      // Stop current, then start from new hour
      handleStop();
      // Small delay to let AudioContext close
      await new Promise<void>((resolve) => setTimeout(resolve, 150));
    }
    const tc: Timecode = { hours: hour, minutes: 0, seconds: 0, frames: 0 };
    setTimecode(tc);

    // Play from the selected hour
    const gen = new LTCGenerator(frameRate);
    gen.setTimecode(hour, 0, 0, 0);
    gen.onFrame = (newTc: Timecode) => {
      setTimecode({ ...newTc });
      setSignalLevel(0.316);
    };
    gen.onError = (err: Error) => {
      console.error('[LTCGenerator]', err);
      setStatus('error');
      setSignalLevel(null);
    };
    generatorRef.current = gen;

    try {
      if (selectedDevice) {
        await gen.start(selectedDevice);
        setStatus('running');
      }
    } catch {
      setStatus('error');
    }
  }, [status, selectedDevice, frameRate, handleStop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      generatorRef.current?.stop();
    };
  }, []);

  // Derive active hour for QuickPlay highlight
  const activeHour = status === 'running' ? timecode.hours : null;

  // Display status maps to TimecodeDisplay's simpler status type
  const displayStatus: 'running' | 'stopped' | 'error' =
    status === 'running' ? 'running' :
    status === 'error'   ? 'error' :
                           'stopped';

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Page header */}
      <div className="border-b border-border bg-surface">
        <div className="max-w-[1400px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Clock size={20} className="text-accent" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">LTC Timecode Generator</h1>
                <p className="text-[12px] text-muted">
                  SMPTE 12M Linear Timecode output via Web Audio API — supports Dante and virtual sound cards
                </p>
              </div>
            </div>

            {/* Browser support badge */}
            <div className="hidden md:flex items-center gap-1.5 text-[11px] text-muted bg-surface-2 border border-border px-3 py-1.5 rounded-lg">
              <Info size={12} />
              <span>Requires Chrome/Edge for device routing</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">

          {/* Left column — main controls */}
          <div className="flex flex-col gap-6">

            {/* Hero: Timecode display */}
            <div className="glass-card p-8 flex flex-col items-center gap-6">
              <TimecodeDisplay
                timecode={timecode}
                frameRate={frameRate}
                status={displayStatus}
                onTimecodeChange={handleSetTimecode}
                editable={status !== 'running'}
              />

              {/* Frame rate selector sits just below the display */}
              <FrameRateSelector
                value={frameRate}
                onChange={handleFrameRateChange}
                disabled={status === 'running'}
              />
            </div>

            {/* Transport controls */}
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">
                  Transport
                </span>
              </div>
              <TransportControls
                status={displayStatus}
                timecode={timecode}
                frameRate={frameRate}
                hasOutputDevice={selectedDevice !== null}
                onPlay={handlePlay}
                onStop={handleStop}
                onReset={handleReset}
                onSetTimecode={handleSetTimecode}
              />
            </div>

            {/* Quick Play */}
            <div className="glass-card p-5">
              <QuickPlay
                activeHour={activeHour}
                onHourSelect={handleQuickPlay}
                disabled={!selectedDevice}
              />
            </div>

          </div>

          {/* Right column — audio output panel */}
          <div className="flex flex-col gap-6">

            {/* Audio Output Selector */}
            <div className="glass-card p-5">
              <AudioOutputSelector
                selectedDeviceId={selectedDevice?.deviceId ?? null}
                onDeviceChange={setSelectedDevice}
                isRunning={status === 'running'}
                signalLevel={signalLevel}
              />
            </div>

            {/* LTC Technical Reference */}
            <div className="glass-card p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Info size={13} className="text-accent" />
                <span className="text-[10px] font-semibold text-foreground uppercase tracking-wider">
                  LTC Reference
                </span>
              </div>

              <div className="space-y-2 text-[11px] text-muted">
                <div className="flex justify-between">
                  <span>Encoding</span>
                  <span className="text-foreground font-mono">Manchester bi-phase</span>
                </div>
                <div className="flex justify-between">
                  <span>Frame size</span>
                  <span className="text-foreground font-mono">80 bits</span>
                </div>
                <div className="flex justify-between">
                  <span>Sync word</span>
                  <span className="text-foreground font-mono">0x3FFD</span>
                </div>
                <div className="flex justify-between">
                  <span>Output level</span>
                  <span className="text-foreground font-mono">-10 dBFS</span>
                </div>
                <div className="flex justify-between">
                  <span>Sample rate</span>
                  <span className="text-foreground font-mono">48 kHz</span>
                </div>
                <div className="flex justify-between">
                  <span>Standard</span>
                  <span className="text-foreground font-mono">SMPTE 12M</span>
                </div>
              </div>

              <div className="pt-2 border-t border-border">
                <p className="text-[10px] text-muted leading-relaxed">
                  Bit rates: 25fps = 2000 bps, 30fps = 2400 bps.
                  Use 25fps for PAL/EBU systems, 29.97DF for NTSC broadcast.
                  Drop-frame compensates for 29.97 vs 30fps drift by skipping
                  frames 0 and 1 at the start of each non-10th minute.
                </p>
              </div>
            </div>

            {/* Usage tips */}
            <div className="glass-card p-5 flex flex-col gap-3">
              <span className="text-[10px] font-semibold text-foreground uppercase tracking-wider">
                Usage Tips
              </span>
              <ul className="space-y-2 text-[11px] text-muted list-disc list-inside">
                <li>
                  For Dante: install Dante Virtual Soundcard, create a transmit flow,
                  and it will appear as an audio output here.
                </li>
                <li>
                  Connect a physical cable from the audio output to the LTC input
                  of your device (e.g. camera, DAW, lighting desk).
                </li>
                <li>
                  Chrome and Edge support per-device routing via{' '}
                  <code className="text-[10px] bg-surface px-1 rounded">setSinkId()</code>.
                  Firefox routes to the system default.
                </li>
                <li>
                  For broadcast use, match the frame rate to your video standard.
                  Mismatched rates will cause sync drift.
                </li>
              </ul>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
