'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Focus,
  Home,
} from 'lucide-react';

interface PTZControllerProps {
  cameraIp: string;
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// CGI command builders — Panasonic protocol
// ---------------------------------------------------------------------------

/**
 * Pan/Tilt move command. PP=pan (00-FF hex), TT=tilt (00-FF hex), SS=speed (01-49).
 * Center position is 0x80 = 128, encoded as "80".
 */
function buildPTSCommand(panHex: string, tiltHex: string, speedHex: string): string {
  return `aw_ptz?cmd=%23PTS${panHex}${tiltHex}S${speedHex}&res=1`;
}

/**
 * Continuous pan/tilt velocity command. Used while dragging the joystick.
 * Values 0-99 for direction/speed. 50=stopped, <50=negative, >50=positive.
 */
function buildPTVCommand(panSpeed: number, tiltSpeed: number): string {
  const p = String(panSpeed).padStart(2, '0');
  const t = String(tiltSpeed).padStart(2, '0');
  return `aw_ptz?cmd=%23PTV${p}${t}&res=1`;
}

/** Stop continuous pan/tilt */
function buildPTVStopCommand(): string {
  return buildPTVCommand(50, 50);
}

/**
 * Zoom command. ZZZ = 000-999 (wide to tele).
 */
function buildZoomCommand(zoom: number): string {
  const z = String(Math.max(0, Math.min(999, zoom))).padStart(3, '0');
  return `aw_ptz?cmd=%23Z${z}&res=1`;
}

/**
 * Zoom velocity. 00-99, 50=stopped, <50=wide, >50=tele.
 */
function buildZoomVelocityCommand(speed: number): string {
  const s = String(Math.max(0, Math.min(99, speed))).padStart(2, '0');
  return `aw_ptz?cmd=%23APC${s}&res=1`;
}

/**
 * Focus command. FFF = 000-999 (near to far).
 */
function buildFocusCommand(focus: number): string {
  const f = String(Math.max(0, Math.min(999, focus))).padStart(3, '0');
  return `aw_ptz?cmd=%23F${f}&res=1`;
}

/**
 * Auto-focus. 0 = manual, 1 = auto.
 */
function buildAutoFocusCommand(auto: boolean): string {
  return `aw_ptz?cmd=%23D1${auto ? '1' : '0'}&res=1`;
}

// ---------------------------------------------------------------------------
// API helper
// ---------------------------------------------------------------------------

async function sendCgiCommand(ip: string, command: string): Promise<string | null> {
  try {
    const res = await fetch('/api/robo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip, command }),
    });
    const data = (await res.json()) as { success: boolean; response?: string; error?: string };
    if (!data.success) return null;
    return data.response ?? 'OK';
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Joystick pad component
// ---------------------------------------------------------------------------

interface JoystickPadProps {
  onMove: (panSpeed: number, tiltSpeed: number) => void;
  onStop: () => void;
  disabled: boolean;
}

function JoystickPad({ onMove, onStop, disabled }: JoystickPadProps) {
  const padRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const animRef = useRef<number | null>(null);
  const lastSentRef = useRef<{ pan: number; tilt: number } | null>(null);

  const PAD_RADIUS = 68; // half the pad size minus knob radius
  const KNOB_RADIUS = 20;
  const DEAD_ZONE = 0.08; // 8% dead zone at center

  const getRelativePos = useCallback(
    (clientX: number, clientY: number) => {
      if (!padRef.current) return { x: 0, y: 0 };
      const rect = padRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = clientX - cx;
      let dy = clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > PAD_RADIUS) {
        dx = (dx / dist) * PAD_RADIUS;
        dy = (dy / dist) * PAD_RADIUS;
      }
      return { x: dx, y: dy };
    },
    [PAD_RADIUS]
  );

  const posToSpeed = useCallback(
    (x: number, y: number) => {
      const normX = x / PAD_RADIUS;
      const normY = y / PAD_RADIUS;
      const applyDeadZone = (v: number) =>
        Math.abs(v) < DEAD_ZONE ? 0 : (v - Math.sign(v) * DEAD_ZONE) / (1 - DEAD_ZONE);
      const panNorm = applyDeadZone(normX);
      const tiltNorm = applyDeadZone(-normY); // invert Y: up = positive tilt
      // Map -1..1 to Panasonic PTV range: 01..49 for negative, 50=stop, 51..99 for positive
      const toSpeed = (v: number) => Math.round(50 + v * 49);
      return { pan: toSpeed(panNorm), tilt: toSpeed(tiltNorm) };
    },
    [PAD_RADIUS]
  );

  const handleDown = useCallback(
    (clientX: number, clientY: number) => {
      if (disabled) return;
      dragging.current = true;
      const pos = getRelativePos(clientX, clientY);
      setKnobPos(pos);
      const { pan, tilt } = posToSpeed(pos.x, pos.y);
      onMove(pan, tilt);
    },
    [disabled, getRelativePos, posToSpeed, onMove]
  );

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!dragging.current) return;
      const pos = getRelativePos(clientX, clientY);
      setKnobPos(pos);

      // Throttle commands via rAF
      if (animRef.current) return;
      animRef.current = requestAnimationFrame(() => {
        animRef.current = null;
        const { pan, tilt } = posToSpeed(pos.x, pos.y);
        if (
          lastSentRef.current?.pan !== pan ||
          lastSentRef.current?.tilt !== tilt
        ) {
          lastSentRef.current = { pan, tilt };
          onMove(pan, tilt);
        }
      });
    },
    [getRelativePos, posToSpeed, onMove]
  );

  const handleUp = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
    setKnobPos({ x: 0, y: 0 });
    lastSentRef.current = null;
    onStop();
  }, [onStop]);

  // Mouse events
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDown(e.clientX, e.clientY);
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onMouseUp = () => handleUp();
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [handleMove, handleUp]);

  // Touch events
  const onTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const t = e.touches[0];
    handleDown(t.clientX, t.clientY);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    const t = e.touches[0];
    handleMove(t.clientX, t.clientY);
  };

  const onTouchEnd = () => handleUp();

  const PAD_SIZE = PAD_RADIUS * 2 + KNOB_RADIUS * 2;

  return (
    <div
      ref={padRef}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="relative select-none rounded-full border-2 border-border"
      style={{
        width: PAD_SIZE,
        height: PAD_SIZE,
        background:
          'radial-gradient(circle at center, var(--surface-2) 0%, var(--surface) 100%)',
        cursor: disabled ? 'not-allowed' : dragging.current ? 'grabbing' : 'grab',
        opacity: disabled ? 0.5 : 1,
        touchAction: 'none',
      }}
    >
      {/* Crosshair lines */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
          backgroundSize: `${PAD_SIZE / 2}px ${PAD_SIZE / 2}px`,
          backgroundPosition: 'center center',
          borderRadius: '100%',
          opacity: 0.4,
        }}
      />

      {/* Center dot */}
      <div
        className="pointer-events-none absolute rounded-full border border-border"
        style={{
          width: 8,
          height: 8,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'var(--muted)',
        }}
      />

      {/* Knob */}
      <div
        className="pointer-events-none absolute rounded-full border-2 border-accent shadow-lg transition-shadow"
        style={{
          width: KNOB_RADIUS * 2,
          height: KNOB_RADIUS * 2,
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${knobPos.x}px), calc(-50% + ${knobPos.y}px))`,
          backgroundColor: 'var(--accent)',
          opacity: 0.9,
          boxShadow:
            knobPos.x !== 0 || knobPos.y !== 0
              ? '0 0 12px var(--accent)'
              : '0 2px 6px rgba(0,0,0,0.4)',
          transition:
            knobPos.x === 0 && knobPos.y === 0
              ? 'transform 0.15s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.15s ease'
              : 'none',
        }}
      />

      {/* Direction labels */}
      <span
        className="pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase tracking-widest"
        style={{ color: 'var(--muted)' }}
      >
        T+
      </span>
      <span
        className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase tracking-widest"
        style={{ color: 'var(--muted)' }}
      >
        T-
      </span>
      <span
        className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-bold uppercase tracking-widest"
        style={{ color: 'var(--muted)' }}
      >
        P-
      </span>
      <span
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold uppercase tracking-widest"
        style={{ color: 'var(--muted)' }}
      >
        P+
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Slider component
// ---------------------------------------------------------------------------

interface SliderProps {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  onCommit: (v: number) => void;
  disabled?: boolean;
  label: string;
  leftLabel?: string;
  rightLabel?: string;
  color?: string;
}

function ControlSlider({
  value,
  min,
  max,
  onChange,
  onCommit,
  disabled,
  label,
  leftLabel,
  rightLabel,
  color = 'var(--accent)',
}: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
          {label}
        </span>
        <span className="font-mono text-[11px]" style={{ color: 'var(--foreground)' }}>
          {value}
        </span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          onMouseUp={(e) => onCommit(Number((e.target as HTMLInputElement).value))}
          onTouchEnd={(e) => onCommit(Number((e.target as HTMLInputElement).value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-full outline-none"
          style={{
            background: `linear-gradient(90deg, ${color} ${pct}%, var(--border) ${pct}%)`,
            opacity: disabled ? 0.4 : 1,
          }}
        />
        {leftLabel && rightLabel && (
          <div className="mt-0.5 flex justify-between text-[9px]" style={{ color: 'var(--muted)' }}>
            <span>{leftLabel}</span>
            <span>{rightLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Arrow button
// ---------------------------------------------------------------------------

interface ArrowButtonProps {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  title?: string;
}

function ArrowButton({ onClick, disabled, children, title }: ArrowButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="flex h-9 w-9 items-center justify-center rounded-md border border-border transition-all"
      style={{
        backgroundColor: 'var(--surface-2)',
        color: disabled ? 'var(--muted)' : 'var(--foreground)',
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.borderColor = 'var(--accent)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)';
      }}
      onMouseDown={(e) => {
        if (!disabled) e.currentTarget.style.backgroundColor = 'var(--accent-dim)';
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--surface-2)';
      }}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main PTZController
// ---------------------------------------------------------------------------

export default function PTZController({ cameraIp, disabled = false }: PTZControllerProps) {
  const [speed, setSpeed] = useState(20);
  const [zoom, setZoom] = useState(500);
  const [focus, setFocus] = useState(500);
  const [autoFocus, setAutoFocus] = useState(true);
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const send = useCallback(
    async (command: string) => {
      if (disabled || !cameraIp) return;
      setSending(true);
      const response = await sendCgiCommand(cameraIp, command);
      setLastResponse(response ?? 'No response');
      setSending(false);
    },
    [cameraIp, disabled]
  );

  // Joystick handlers — send PTV velocity commands
  const handleJoystickMove = useCallback(
    (panSpeed: number, tiltSpeed: number) => {
      send(buildPTVCommand(panSpeed, tiltSpeed));
    },
    [send]
  );

  const handleJoystickStop = useCallback(() => {
    send(buildPTVStopCommand());
  }, [send]);

  // Arrow button nudge — uses PTS to move to absolute offset from center
  // Simplified: send a short velocity burst via PTV
  function nudge(panDir: -1 | 0 | 1, tiltDir: -1 | 0 | 1) {
    const panSpeed = 50 + panDir * speed;
    const tiltSpeed = 50 + tiltDir * speed;
    send(buildPTVCommand(panSpeed, tiltSpeed));
    setTimeout(() => send(buildPTVStopCommand()), 200);
  }

  function goHome() {
    // Send PTS command to center position (0x80 = "80" for both pan and tilt)
    send(buildPTSCommand('80', '80', '10'));
  }

  function handleAutoFocusToggle() {
    const next = !autoFocus;
    setAutoFocus(next);
    send(buildAutoFocusCommand(next));
  }

  return (
    <div className="space-y-5">
      {/* Pan/Tilt section */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
            Pan / Tilt
          </span>
          {sending && (
            <span className="text-[10px]" style={{ color: 'var(--accent)' }}>
              Sending...
            </span>
          )}
        </div>

        <div className="flex items-center gap-6">
          {/* Joystick pad */}
          <JoystickPad
            onMove={handleJoystickMove}
            onStop={handleJoystickStop}
            disabled={disabled}
          />

          {/* Arrow buttons + home */}
          <div className="flex flex-col items-center gap-1.5">
            <ArrowButton
              onClick={() => nudge(0, 1)}
              disabled={disabled}
              title="Tilt Up"
            >
              <ChevronUp className="h-4 w-4" />
            </ArrowButton>
            <div className="flex items-center gap-1.5">
              <ArrowButton
                onClick={() => nudge(-1, 0)}
                disabled={disabled}
                title="Pan Left"
              >
                <ChevronLeft className="h-4 w-4" />
              </ArrowButton>
              <button
                onClick={goHome}
                disabled={disabled}
                title="Center / Home"
                className="flex h-9 w-9 items-center justify-center rounded-md border border-accent/40 text-[9px] font-bold uppercase tracking-wider transition-all"
                style={{
                  backgroundColor: 'var(--accent-dim)',
                  color: 'var(--accent)',
                  opacity: disabled ? 0.5 : 1,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                }}
              >
                <Home className="h-3.5 w-3.5" />
              </button>
              <ArrowButton
                onClick={() => nudge(1, 0)}
                disabled={disabled}
                title="Pan Right"
              >
                <ChevronRight className="h-4 w-4" />
              </ArrowButton>
            </div>
            <ArrowButton
              onClick={() => nudge(0, -1)}
              disabled={disabled}
              title="Tilt Down"
            >
              <ChevronDown className="h-4 w-4" />
            </ArrowButton>
          </div>
        </div>
      </div>

      {/* Speed control */}
      <ControlSlider
        label="Speed"
        value={speed}
        min={1}
        max={49}
        onChange={setSpeed}
        onCommit={setSpeed}
        disabled={disabled}
        leftLabel="Slow"
        rightLabel="Fast"
        color="var(--warning)"
      />

      {/* Zoom control */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
            Zoom
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const next = Math.max(0, zoom - 50);
                setZoom(next);
                send(buildZoomCommand(next));
              }}
              disabled={disabled}
              className="flex h-7 w-7 items-center justify-center rounded border border-border"
              style={{
                backgroundColor: 'var(--surface-2)',
                color: disabled ? 'var(--muted)' : 'var(--foreground)',
              }}
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="w-10 text-center font-mono text-[11px]" style={{ color: 'var(--foreground)' }}>
              {zoom}
            </span>
            <button
              onClick={() => {
                const next = Math.min(999, zoom + 50);
                setZoom(next);
                send(buildZoomCommand(next));
              }}
              disabled={disabled}
              className="flex h-7 w-7 items-center justify-center rounded border border-border"
              style={{
                backgroundColor: 'var(--surface-2)',
                color: disabled ? 'var(--muted)' : 'var(--foreground)',
              }}
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <ControlSlider
          label=""
          value={zoom}
          min={0}
          max={999}
          onChange={setZoom}
          onCommit={(v) => send(buildZoomCommand(v))}
          disabled={disabled}
          leftLabel="Wide"
          rightLabel="Tele"
          color="var(--success)"
        />
      </div>

      {/* Focus control */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Focus className="h-3.5 w-3.5" style={{ color: 'var(--muted)' }} />
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
              Focus
            </span>
          </div>
          <button
            onClick={handleAutoFocusToggle}
            disabled={disabled}
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider transition-all"
            style={{
              backgroundColor: autoFocus ? 'var(--accent-dim)' : 'var(--surface-2)',
              color: autoFocus ? 'var(--accent)' : 'var(--muted)',
              border: `1px solid ${autoFocus ? 'var(--accent)' : 'var(--border)'}`,
              opacity: disabled ? 0.5 : 1,
              cursor: disabled ? 'not-allowed' : 'pointer',
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: autoFocus ? 'var(--accent)' : 'var(--muted)' }}
            />
            {autoFocus ? 'Auto' : 'Manual'}
          </button>
        </div>
        <ControlSlider
          label=""
          value={focus}
          min={0}
          max={999}
          onChange={setFocus}
          onCommit={(v) => {
            if (!autoFocus) send(buildFocusCommand(v));
          }}
          disabled={disabled || autoFocus}
          leftLabel="Near"
          rightLabel="Far"
          color="var(--accent)"
        />
      </div>

      {/* Last response */}
      {lastResponse !== null && (
        <div
          className="rounded-md px-3 py-2 text-[10px] font-mono"
          style={{
            backgroundColor: 'var(--surface-2)',
            color: 'var(--muted)',
            borderLeft: '2px solid var(--border)',
          }}
        >
          <span style={{ color: 'var(--muted)' }}>Camera: </span>
          <span style={{ color: 'var(--foreground)' }}>{lastResponse}</span>
        </div>
      )}
    </div>
  );
}
