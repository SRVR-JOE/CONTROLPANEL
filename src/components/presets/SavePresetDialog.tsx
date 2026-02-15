'use client';

import { useState } from 'react';
import { useStore } from '@/store';
import { Save, X, ArrowRight } from 'lucide-react';

export default function SavePresetDialog() {
  const routers = useStore((s) => s.routers);
  const saveMatrixPreset = useStore((s) => s.saveMatrixPreset);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedRouterId, setSelectedRouterId] = useState('');

  const selectedRouter = routers.find((r) => r.id === selectedRouterId);

  const currentRoutes = selectedRouter
    ? selectedRouter.outputs
        .filter((o) => o.routedFrom !== undefined)
        .map((o) => ({ input: o.routedFrom!, output: o.index }))
    : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !selectedRouterId) return;

    saveMatrixPreset({
      name: name.trim(),
      description: description.trim(),
      routerId: selectedRouterId,
      routes: currentRoutes,
    });

    // Reset form
    setName('');
    setDescription('');
    setSelectedRouterId('');
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/80"
      >
        <Save className="h-4 w-4" />
        Save Current Routes
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-card w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <Save className="h-5 w-5 text-accent" />
            <h2 className="text-base font-semibold text-foreground">Save Matrix Preset</h2>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="flex h-7 w-7 items-center justify-center rounded text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted">Preset Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Show Mode B"
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-accent placeholder:text-muted"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this preset is for..."
              rows={3}
              className="w-full resize-none rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-accent placeholder:text-muted"
            />
          </div>

          {/* Router select */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted">Router</label>
            <select
              value={selectedRouterId}
              onChange={(e) => setSelectedRouterId(e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-accent"
            >
              <option value="">Select a router...</option>
              {routers.map((router) => (
                <option key={router.id} value={router.id}>
                  {router.name} ({router.size})
                </option>
              ))}
            </select>
          </div>

          {/* Current routes preview */}
          {selectedRouter && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted">
                Current Routes ({currentRoutes.length})
              </label>
              <div className="max-h-40 overflow-y-auto rounded-md border border-border bg-surface p-2">
                {currentRoutes.length === 0 ? (
                  <p className="py-2 text-center text-xs text-muted">No routes configured</p>
                ) : (
                  <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
                    {currentRoutes.map((route, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1 rounded bg-surface-2 px-2 py-1 text-xs"
                      >
                        <span className="font-mono text-accent">I{route.input}</span>
                        <ArrowRight className="h-3 w-3 text-muted" />
                        <span className="font-mono text-success">O{route.output}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md px-4 py-2 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || !selectedRouterId}
              className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/80 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Save Preset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
