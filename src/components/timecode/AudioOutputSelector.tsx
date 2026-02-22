'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, Volume2, Speaker, ChevronDown, AlertCircle } from 'lucide-react';

interface AudioOutputSelectorProps {
  selectedDeviceId: string | null;
  onDeviceChange: (device: MediaDeviceInfo | null) => void;
  isRunning: boolean;
  /** Live signal level 0–1 for the VU meter, or null when stopped */
  signalLevel?: number | null;
}

export default function AudioOutputSelector({
  selectedDeviceId,
  onDeviceChange,
  isRunning,
  signalLevel = null,
}: AudioOutputSelectorProps) {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedDevice = devices.find((d) => d.deviceId === selectedDeviceId) ?? null;

  const enumerateDevices = useCallback(async (requestPermission = false) => {
    setLoading(true);
    setError(null);
    try {
      // On first call, or if labels are empty, request microphone permission
      // to unlock device labels (browsers require this even for audio output enumeration)
      const existing = await navigator.mediaDevices.enumerateDevices();
      const hasLabels = existing.some((d) => d.label !== '');

      if (requestPermission || !hasLabels) {
        try {
          // Request a temporary stream just to unlock device labels
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach((t) => t.stop());
          setPermissionGranted(true);
        } catch {
          // Permission denied — still list devices but without labels
          setPermissionGranted(false);
        }
      }

      const all = await navigator.mediaDevices.enumerateDevices();
      const outputs = all.filter((d) => d.kind === 'audiooutput');
      setDevices(outputs);

      // Auto-select default if nothing is selected
      if (!selectedDeviceId && outputs.length > 0) {
        const defaultDevice = outputs.find((d) => d.deviceId === 'default') ?? outputs[0];
        onDeviceChange(defaultDevice);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enumerate audio devices');
    } finally {
      setLoading(false);
    }
  }, [selectedDeviceId, onDeviceChange]);

  // Initial enumeration on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.mediaDevices) {
      enumerateDevices();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Listen for device changes (e.g. Dante device plugged in)
  useEffect(() => {
    if (!navigator.mediaDevices) return;
    const handler = () => enumerateDevices();
    navigator.mediaDevices.addEventListener('devicechange', handler);
    return () => navigator.mediaDevices.removeEventListener('devicechange', handler);
  }, [enumerateDevices]);

  const handleSelect = (device: MediaDeviceInfo) => {
    onDeviceChange(device);
    setShowDropdown(false);
  };

  const isWebAudioAvailable = typeof window !== 'undefined' && 'AudioContext' in window;

  // VU meter bar — maps signal level (0–1) to a dBFS-like visual
  const meterPercent = signalLevel !== null ? Math.min(100, signalLevel * 100) : 0;
  // Colour the meter: green until -6dBFS (~0.5), yellow to -1dBFS (~0.89), red above
  const meterColor =
    meterPercent > 89 ? 'bg-red-400' :
    meterPercent > 50 ? 'bg-yellow-400' :
                        'bg-green-400';

  if (!isWebAudioAvailable) {
    return (
      <div className="flex items-center gap-2 p-3 bg-red-400/10 border border-red-400/20 rounded-lg">
        <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
        <span className="text-xs text-red-400">
          Web Audio API not available in this browser. LTC output requires a modern Chromium-based browser.
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Speaker size={14} className="text-accent" />
          <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Audio Output
          </span>
        </div>
        <button
          onClick={() => enumerateDevices(true)}
          disabled={loading || isRunning}
          title="Refresh device list"
          className="flex items-center gap-1.5 text-[11px] text-muted hover:text-foreground disabled:opacity-40 transition-colors"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-2.5 bg-red-400/10 border border-red-400/20 rounded-lg">
          <AlertCircle size={12} className="text-red-400 flex-shrink-0" />
          <span className="text-[11px] text-red-400">{error}</span>
        </div>
      )}

      {/* Permission hint */}
      {!permissionGranted && devices.length > 0 && devices.every((d) => !d.label) && (
        <div className="flex items-center gap-2 p-2.5 bg-yellow-400/10 border border-yellow-400/20 rounded-lg">
          <AlertCircle size={12} className="text-yellow-400 flex-shrink-0" />
          <p className="text-[11px] text-yellow-400">
            Device names hidden. Click Refresh and allow microphone access to see full device names (required by browser API).
          </p>
        </div>
      )}

      {/* Device selector dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => !isRunning && setShowDropdown((v) => !v)}
          disabled={isRunning || devices.length === 0}
          className={`
            w-full flex items-center justify-between gap-2 px-3 py-2.5
            bg-surface-2 border rounded-lg text-sm transition-colors
            ${isRunning
              ? 'border-border text-muted cursor-not-allowed opacity-60'
              : 'border-border hover:border-accent/50 text-foreground cursor-pointer'
            }
          `}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Volume2 size={14} className="text-muted flex-shrink-0" />
            <span className="truncate text-left">
              {devices.length === 0
                ? loading ? 'Scanning devices...' : 'No audio outputs found'
                : selectedDevice
                ? (selectedDevice.label || `Output Device (${selectedDevice.deviceId.slice(0, 8)}…)`)
                : 'Select output device'}
            </span>
          </div>
          <ChevronDown
            size={14}
            className={`text-muted flex-shrink-0 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
          />
        </button>

        {showDropdown && devices.length > 0 && (
          <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-surface-2 border border-border rounded-lg shadow-xl overflow-hidden">
            {devices.map((device) => {
              const isSelected = device.deviceId === selectedDeviceId;
              const label = device.label || `Audio Output (${device.deviceId.slice(0, 12)}…)`;
              const isDante = label.toLowerCase().includes('dante') || label.toLowerCase().includes('dvs');
              return (
                <button
                  key={device.deviceId}
                  onClick={() => handleSelect(device)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors
                    ${isSelected
                      ? 'bg-accent/15 text-accent'
                      : 'text-foreground hover:bg-surface'
                    }
                  `}
                >
                  <Volume2 size={13} className="flex-shrink-0" />
                  <span className="flex-1 truncate">{label}</span>
                  {isDante && (
                    <span className="flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded">
                      DANTE
                    </span>
                  )}
                  {isSelected && (
                    <span className="flex-shrink-0 text-[9px] font-bold text-accent">
                      ACTIVE
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* VU Meter */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted uppercase tracking-wider">LTC Level</span>
          <span className="text-[10px] font-mono text-muted">
            {isRunning ? '-10 dBFS' : '---'}
          </span>
        </div>
        <div className="relative h-2 bg-surface rounded-full overflow-hidden">
          {/* Scale markers */}
          <div className="absolute inset-0 flex">
            {/* Zones: 0–50% green, 50–89% yellow, 89%+ red */}
            <div className="flex-1 bg-green-400/10" />
            <div className="w-px bg-border" style={{ left: '50%' }} />
          </div>
          {/* Live bar */}
          <div
            className={`absolute left-0 top-0 h-full transition-all duration-75 ${meterColor}`}
            style={{ width: `${isRunning ? meterPercent : 0}%` }}
          />
        </div>
        <div className="flex justify-between text-[9px] text-muted font-mono">
          <span>-∞</span>
          <span>-20</span>
          <span>-10</span>
          <span>-6</span>
          <span>0dB</span>
        </div>
      </div>

      {/* Device count info */}
      <p className="text-[10px] text-muted">
        {devices.length} audio output{devices.length !== 1 ? 's' : ''} detected
        {devices.some((d) => d.label?.toLowerCase().includes('dante')) && (
          <span className="ml-1 text-blue-400">including Dante</span>
        )}
      </p>
    </div>
  );
}
