'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Camera,
  HardDrive,
  MoveHorizontal,
  LayoutGrid,
  Info,
  ChevronRight,
} from 'lucide-react';
import { useStore } from '@/store';
import { Device } from '@/types';
import CameraSelector from '@/components/robo/CameraSelector';
import PTZController from '@/components/robo/PTZController';
import PresetGrid from '@/components/robo/PresetGrid';
import CameraPreview from '@/components/robo/CameraPreview';

// ---------------------------------------------------------------------------
// Section card wrapper
// ---------------------------------------------------------------------------

function SectionCard({
  title,
  icon: Icon,
  iconColor,
  children,
  className,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  iconColor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-border overflow-hidden ${className ?? ''}`}
      style={{ backgroundColor: 'var(--surface)' }}
    >
      <div
        className="flex items-center gap-2.5 border-b border-border px-4 py-3"
      >
        <Icon
          className="h-4 w-4 flex-shrink-0"
          style={{ color: iconColor ?? 'var(--muted)' }}
        />
        <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
          {title}
        </span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function NoCamerasState() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
      <div
        className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
        style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)' }}
      >
        <Camera className="h-8 w-8" style={{ color: 'var(--muted)', opacity: 0.5 }} />
      </div>
      <h2 className="mb-2 text-base font-semibold" style={{ color: 'var(--foreground)' }}>
        No Panasonic PTZ Cameras Found
      </h2>
      <p className="mb-6 max-w-sm text-sm" style={{ color: 'var(--muted)' }}>
        Add a Panasonic PTZ camera to your device list to start controlling it from
        this page. Make sure the manufacturer is set to &ldquo;Panasonic&rdquo; and the
        category is &ldquo;PTZ Camera&rdquo;.
      </p>
      <Link
        href="/devices"
        className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all"
        style={{
          backgroundColor: 'var(--accent)',
          color: '#fff',
        }}
      >
        <HardDrive className="h-4 w-4" />
        Go to Devices
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function RoboPage() {
  const devices = useStore((state) => state.devices);

  // Filter for Panasonic PTZ cameras only
  const panasonicCameras = useMemo<Device[]>(() => {
    return devices.filter(
      (d) => d.manufacturer === 'panasonic' && d.category === 'ptz-camera'
    );
  }, [devices]);

  const [selectedCamera, setSelectedCamera] = useState<Device | null>(
    panasonicCameras[0] ?? null
  );

  // Keep selection valid when devices change
  const validSelectedCamera = useMemo(() => {
    if (!selectedCamera) return panasonicCameras[0] ?? null;
    const stillExists = panasonicCameras.find((c) => c.id === selectedCamera.id);
    return stillExists ?? panasonicCameras[0] ?? null;
  }, [selectedCamera, panasonicCameras]);

  const cameraIp = validSelectedCamera?.ipAddress ?? '';
  const isDisabled = !validSelectedCamera || validSelectedCamera.status === 'offline';

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Page header */}
      <div
        className="border-b border-border"
        style={{ backgroundColor: 'var(--surface)' }}
      >
        <div className="mx-auto max-w-[1400px] px-6 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Title */}
            <div className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)' }}
              >
                <Camera className="h-5 w-5" style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <h1 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
                  ROBO Camera Control
                </h1>
                <p className="text-[12px]" style={{ color: 'var(--muted)' }}>
                  Panasonic PTZ — CGI protocol
                </p>
              </div>
            </div>

            {/* Camera selector */}
            {panasonicCameras.length > 0 && (
              <CameraSelector
                cameras={panasonicCameras}
                selectedCamera={validSelectedCamera}
                onSelect={setSelectedCamera}
              />
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-[1400px] px-6 py-6">
        {panasonicCameras.length === 0 ? (
          <NoCamerasState />
        ) : (
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_320px]">

            {/* Left column: PTZ + Presets */}
            <div className="flex flex-col gap-5">

              {/* Offline / standby notice */}
              {validSelectedCamera && validSelectedCamera.status === 'offline' && (
                <div
                  className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm"
                  style={{
                    backgroundColor: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.25)',
                    color: 'var(--error)',
                  }}
                >
                  <Info className="h-4 w-4 flex-shrink-0" />
                  <span>
                    <strong>{validSelectedCamera.name}</strong> is offline. Controls are
                    disabled until the camera is reachable.
                  </span>
                </div>
              )}

              {/* PTZ controller */}
              <SectionCard
                title="Pan / Tilt / Zoom"
                icon={MoveHorizontal}
                iconColor="var(--accent)"
              >
                {validSelectedCamera ? (
                  <PTZController
                    cameraIp={cameraIp}
                    disabled={isDisabled}
                  />
                ) : (
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>
                    Select a camera above to start controlling it.
                  </p>
                )}
              </SectionCard>

              {/* Preset grid */}
              <SectionCard
                title="Camera Presets"
                icon={LayoutGrid}
                iconColor="var(--warning)"
              >
                {validSelectedCamera ? (
                  <PresetGrid
                    cameraIp={cameraIp}
                    disabled={isDisabled}
                  />
                ) : (
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>
                    Select a camera to manage presets.
                  </p>
                )}
              </SectionCard>
            </div>

            {/* Right column: Status */}
            <div className="flex flex-col gap-5">
              <SectionCard
                title="Camera Status"
                icon={Info}
                iconColor="var(--muted)"
              >
                {validSelectedCamera ? (
                  <CameraPreview
                    camera={validSelectedCamera}
                  />
                ) : (
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>
                    No camera selected.
                  </p>
                )}
              </SectionCard>

              {/* Quick-tips card */}
              <div
                className="rounded-xl border border-border px-4 py-4"
                style={{ backgroundColor: 'var(--surface)' }}
              >
                <p
                  className="mb-3 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--muted)' }}
                >
                  Tips
                </p>
                <ul className="space-y-2 text-[11px]" style={{ color: 'var(--muted)' }}>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="mt-0.5 h-3 w-3 flex-shrink-0 text-accent" />
                    Drag the joystick pad for smooth pan/tilt control. Release to stop.
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="mt-0.5 h-3 w-3 flex-shrink-0 text-accent" />
                    Arrow buttons send a short velocity burst at the configured speed.
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="mt-0.5 h-3 w-3 flex-shrink-0 text-accent" />
                    Click a preset to recall it. Hold or right-click a preset to store the current position.
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="mt-0.5 h-3 w-3 flex-shrink-0 text-accent" />
                    Status is polled every 5 seconds. Click Refresh for an immediate update.
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="mt-0.5 h-3 w-3 flex-shrink-0 text-accent" />
                    Add cameras at{' '}
                    <Link href="/devices" className="underline" style={{ color: 'var(--accent)' }}>
                      /devices
                    </Link>{' '}
                    — set manufacturer to &ldquo;Panasonic&rdquo;, category to &ldquo;PTZ Camera&rdquo;.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
