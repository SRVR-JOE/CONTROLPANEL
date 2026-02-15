'use client';

import { useState } from 'react';
import { useStore } from '@/store';
import { Plus, X, Check } from 'lucide-react';

interface AddPinDialogProps {
  boardId: string;
  open: boolean;
  onClose: () => void;
}

export default function AddPinDialog({ boardId, open, onClose }: AddPinDialogProps) {
  const devices = useStore((s) => s.devices);
  const addPinBoardItem = useStore((s) => s.addPinBoardItem);

  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [showHealth, setShowHealth] = useState(true);
  const [showTemperature, setShowTemperature] = useState(true);
  const [showPorts, setShowPorts] = useState(false);
  const [label, setLabel] = useState('');

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeviceId) return;

    addPinBoardItem(boardId, {
      deviceId: selectedDeviceId,
      position: { x: 50 + Math.random() * 200, y: 50 + Math.random() * 200 },
      size: { width: 280, height: 160 },
      showHealth,
      showTemperature,
      showPorts,
      label: label.trim() || undefined,
    });

    // Reset form
    setSelectedDeviceId('');
    setShowHealth(true);
    setShowTemperature(true);
    setShowPorts(false);
    setLabel('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-card w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-accent" />
            <h2 className="text-base font-semibold text-foreground">Add Device to Pin Board</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          {/* Device select */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted">Device</label>
            <select
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-accent"
            >
              <option value="">Select a device...</option>
              {devices.map((device) => (
                <option key={device.id} value={device.id}>
                  {device.name} ({device.ipAddress})
                </option>
              ))}
            </select>
          </div>

          {/* Custom label */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted">Custom Label (optional)</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Main Server"
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-accent placeholder:text-muted"
            />
          </div>

          {/* Checkboxes */}
          <div className="space-y-2.5">
            <label className="text-xs font-medium text-muted">Display Options</label>

            <label className="flex cursor-pointer items-center gap-3">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={showHealth}
                  onChange={(e) => setShowHealth(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="flex h-5 w-5 items-center justify-center rounded border border-border bg-surface transition-colors peer-checked:border-accent peer-checked:bg-accent/20">
                  {showHealth && <Check className="h-3 w-3 text-accent" />}
                </div>
              </div>
              <span className="text-sm text-foreground">Show Health Metrics</span>
            </label>

            <label className="flex cursor-pointer items-center gap-3">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={showTemperature}
                  onChange={(e) => setShowTemperature(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="flex h-5 w-5 items-center justify-center rounded border border-border bg-surface transition-colors peer-checked:border-accent peer-checked:bg-accent/20">
                  {showTemperature && <Check className="h-3 w-3 text-accent" />}
                </div>
              </div>
              <span className="text-sm text-foreground">Show Temperature</span>
            </label>

            <label className="flex cursor-pointer items-center gap-3">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={showPorts}
                  onChange={(e) => setShowPorts(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="flex h-5 w-5 items-center justify-center rounded border border-border bg-surface transition-colors peer-checked:border-accent peer-checked:bg-accent/20">
                  {showPorts && <Check className="h-3 w-3 text-accent" />}
                </div>
              </div>
              <span className="text-sm text-foreground">Show Ports</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedDeviceId}
              className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/80 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Add to Board
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
