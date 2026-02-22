'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Activity,
  Radio,
  Wifi,
  WifiOff,
  RefreshCw,
  Power,
  AlertTriangle,
} from 'lucide-react';
import { Device } from '@/types';

interface CameraStatus {
  power: boolean | null;
  panPosition: number | null;
  tiltPosition: number | null;
  reachable: boolean;
  lastChecked: Date | null;
}

interface CameraPreviewProps {
  camera: Device;
  tallyActive?: boolean;
}

// ---------------------------------------------------------------------------
// API helper
// ---------------------------------------------------------------------------

async function sendCgiCommand(
  ip: string,
  command: string
): Promise<string | null> {
  try {
    const res = await fetch('/api/robo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip, command }),
    });
    const data = (await res.json()) as {
      success: boolean;
      response?: string;
    };
    return data.success ? (data.response ?? '') : null;
  } catch {
    return null;
  }
}

/**
 * Parse Panasonic GPI response.
 * Response format: "gpI{PPPP}{TTTT}" where PPPP and TTTT are hex pan/tilt positions (0x0000-0xFFFF).
 */
function parseGpiResponse(raw: string): { pan: number; tilt: number } | null {
  const match = raw.match(/gpI([0-9a-fA-F]{4})([0-9a-fA-F]{4})/i);
  if (!match) return null;
  const pan = parseInt(match[1], 16);
  const tilt = parseInt(match[2], 16);
  return { pan, tilt };
}

/** Map raw 0x0000-0xFFFF pan position to degrees (-175 to +175). */
function panToDegrees(raw: number): number {
  return Math.round(((raw - 0x8000) / 0x8000) * 175);
}

/** Map raw 0x0000-0xFFFF tilt position to degrees (-90 to +90). */
function tiltToDegrees(raw: number): number {
  return Math.round(((raw - 0x8000) / 0x8000) * 90);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatBox({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: string | number | null;
  unit?: string;
  color?: string;
}) {
  return (
    <div
      className="flex flex-col rounded-md px-3 py-2"
      style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)' }}
    >
      <span
        className="text-[10px] uppercase tracking-wider"
        style={{ color: 'var(--muted)' }}
      >
        {label}
      </span>
      <div className="mt-0.5 flex items-baseline gap-1">
        <span
          className="font-mono text-lg font-bold leading-none"
          style={{ color: color ?? 'var(--foreground)' }}
        >
          {value !== null ? value : '—'}
        </span>
        {unit && value !== null && (
          <span className="text-[10px]" style={{ color: 'var(--muted)' }}>
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function CameraPreview({
  camera,
  tallyActive = false,
}: CameraPreviewProps) {
  const [status, setStatus] = useState<CameraStatus>({
    power: null,
    panPosition: null,
    tiltPosition: null,
    reachable: camera.status === 'online',
    lastChecked: null,
  });
  const [polling, setPolling] = useState(false);
  const [powerSending, setPowerSending] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = useCallback(async () => {
    if (!camera.ipAddress) return;
    setPolling(true);

    // Query power status
    const powerRaw = await sendCgiCommand(
      camera.ipAddress,
      'aw_ptz?cmd=%23O&res=1'
    );

    // Query pan/tilt position
    const gpiRaw = await sendCgiCommand(
      camera.ipAddress,
      'aw_ptz?cmd=%23GPI&res=1'
    );

    const reachable = powerRaw !== null || gpiRaw !== null;
    const power = powerRaw !== null ? powerRaw.toLowerCase().includes('p1') : null;

    let panPosition: number | null = null;
    let tiltPosition: number | null = null;

    if (gpiRaw) {
      const parsed = parseGpiResponse(gpiRaw);
      if (parsed) {
        panPosition = panToDegrees(parsed.pan);
        tiltPosition = tiltToDegrees(parsed.tilt);
      }
    }

    setStatus({
      power,
      panPosition,
      tiltPosition,
      reachable,
      lastChecked: new Date(),
    });
    setPolling(false);
  }, [camera.ipAddress]);

  // Initial poll + 5-second interval
  useEffect(() => {
    poll();
    intervalRef.current = setInterval(poll, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [poll]);

  async function togglePower() {
    if (!camera.ipAddress || status.power === null) return;
    setPowerSending(true);
    const cmd = status.power
      ? 'aw_ptz?cmd=%23O0&res=1'
      : 'aw_ptz?cmd=%23O1&res=1';
    await sendCgiCommand(camera.ipAddress, cmd);
    // Re-poll after a short delay to see the new state
    setTimeout(poll, 1500);
    setPowerSending(false);
  }

  const connectionColor = status.reachable
    ? camera.status === 'warning'
      ? 'var(--warning)'
      : 'var(--success)'
    : 'var(--error)';

  const lastCheckedStr = status.lastChecked
    ? status.lastChecked.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : null;

  return (
    <div className="space-y-4">
      {/* Connection status header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {status.reachable ? (
            <Wifi className="h-4 w-4" style={{ color: connectionColor }} />
          ) : (
            <WifiOff className="h-4 w-4" style={{ color: 'var(--error)' }} />
          )}
          <span
            className="text-sm font-medium"
            style={{ color: connectionColor }}
          >
            {status.reachable
              ? camera.status === 'warning'
                ? 'Connected — Warning'
                : 'Connected'
              : 'Unreachable'}
          </span>
          {camera.status === 'warning' && (
            <AlertTriangle className="h-3.5 w-3.5" style={{ color: 'var(--warning)' }} />
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Manual refresh */}
          <button
            onClick={poll}
            disabled={polling}
            title="Refresh status"
            className="flex h-7 w-7 items-center justify-center rounded border border-border transition-colors"
            style={{
              backgroundColor: 'var(--surface-2)',
              color: 'var(--muted)',
            }}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${polling ? 'animate-spin' : ''}`}
            />
          </button>

          {/* Power toggle */}
          <button
            onClick={togglePower}
            disabled={powerSending || status.power === null || !status.reachable}
            title={status.power ? 'Power off' : 'Power on'}
            className="flex h-7 items-center gap-1.5 rounded border px-2.5 text-[11px] font-semibold transition-all"
            style={{
              backgroundColor: status.power
                ? 'rgba(34,197,94,0.1)'
                : 'var(--surface-2)',
              borderColor: status.power ? 'var(--success)' : 'var(--border)',
              color: status.power ? 'var(--success)' : 'var(--muted)',
              opacity:
                powerSending || status.power === null || !status.reachable
                  ? 0.5
                  : 1,
              cursor:
                powerSending || status.power === null || !status.reachable
                  ? 'not-allowed'
                  : 'pointer',
            }}
          >
            <Power className="h-3.5 w-3.5" />
            {status.power ? 'On' : 'Standby'}
          </button>
        </div>
      </div>

      {/* Tally indicator */}
      <div
        className="flex items-center gap-2.5 rounded-lg px-3 py-2.5"
        style={{
          backgroundColor: tallyActive
            ? 'rgba(239,68,68,0.12)'
            : 'var(--surface-2)',
          border: `1px solid ${tallyActive ? 'var(--error)' : 'var(--border)'}`,
          transition: 'all 0.2s ease',
        }}
      >
        <Radio
          className="h-4 w-4"
          style={{
            color: tallyActive ? 'var(--error)' : 'var(--muted)',
          }}
        />
        <span
          className="text-sm font-bold uppercase tracking-widest"
          style={{ color: tallyActive ? 'var(--error)' : 'var(--muted)' }}
        >
          {tallyActive ? 'ON AIR' : 'OFF AIR'}
        </span>
        {tallyActive && (
          <span
            className="ml-auto h-2 w-2 rounded-full status-pulse"
            style={{ backgroundColor: 'var(--error)' }}
          />
        )}
      </div>

      {/* Position stats */}
      <div className="grid grid-cols-2 gap-2">
        <StatBox
          label="Pan"
          value={status.panPosition !== null ? status.panPosition : null}
          unit="°"
          color={
            status.panPosition !== null && Math.abs(status.panPosition) > 150
              ? 'var(--warning)'
              : 'var(--foreground)'
          }
        />
        <StatBox
          label="Tilt"
          value={status.tiltPosition !== null ? status.tiltPosition : null}
          unit="°"
          color={
            status.tiltPosition !== null && Math.abs(status.tiltPosition) > 80
              ? 'var(--warning)'
              : 'var(--foreground)'
          }
        />
      </div>

      {/* Camera info */}
      <div
        className="rounded-lg px-3 py-2.5 space-y-1.5 text-[11px]"
        style={{
          backgroundColor: 'var(--surface-2)',
          border: '1px solid var(--border)',
        }}
      >
        <div className="flex items-center justify-between">
          <span style={{ color: 'var(--muted)' }}>IP Address</span>
          <span className="font-mono" style={{ color: 'var(--foreground)' }}>
            {camera.ipAddress || '—'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span style={{ color: 'var(--muted)' }}>Model</span>
          <span style={{ color: 'var(--foreground)' }}>{camera.model}</span>
        </div>
        {camera.firmware && (
          <div className="flex items-center justify-between">
            <span style={{ color: 'var(--muted)' }}>Firmware</span>
            <span className="font-mono" style={{ color: 'var(--foreground)' }}>
              {camera.firmware}
            </span>
          </div>
        )}
        {camera.serialNumber && (
          <div className="flex items-center justify-between">
            <span style={{ color: 'var(--muted)' }}>S/N</span>
            <span className="font-mono" style={{ color: 'var(--foreground)' }}>
              {camera.serialNumber}
            </span>
          </div>
        )}
      </div>

      {/* Last updated */}
      {lastCheckedStr && (
        <div className="flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--muted)' }}>
          <Activity className="h-3 w-3" />
          <span>Last polled: {lastCheckedStr}</span>
          {polling && (
            <RefreshCw className="h-2.5 w-2.5 animate-spin" />
          )}
        </div>
      )}
    </div>
  );
}
