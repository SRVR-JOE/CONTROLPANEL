'use client';

import { useState } from 'react';
import { useStore } from '@/store';
import { MatrixPreset } from '@/types';
import { Play, Trash2, Clock, Route, AlertTriangle } from 'lucide-react';

const routerColorMap: Record<string, string> = {
  lightware: '#ff9800',
  aja: '#ffc107',
  blackmagic: '#607d8b',
};

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface PresetCardProps {
  preset: MatrixPreset;
}

export default function PresetCard({ preset }: PresetCardProps) {
  const routers = useStore((s) => s.routers);
  const recallMatrixPreset = useStore((s) => s.recallMatrixPreset);
  const deletePreset = useStore((s) => s.deletePreset);

  const [confirmDelete, setConfirmDelete] = useState(false);

  const router = routers.find((r) => r.id === preset.routerId);
  const routerColor = router
    ? routerColorMap[router.manufacturer] || '#3b82f6'
    : '#6b7280';

  const handleRecall = () => {
    recallMatrixPreset(preset.id);
  };

  const handleDelete = () => {
    if (confirmDelete) {
      deletePreset(preset.id);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  return (
    <div className="glass-card flex flex-col overflow-hidden transition-all hover:border-accent/30">
      {/* Router indicator bar */}
      <div className="h-1" style={{ backgroundColor: routerColor }} />

      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">{preset.name}</h3>
            {preset.description && (
              <p className="text-xs leading-relaxed text-muted">{preset.description}</p>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Router badge */}
          {router && (
            <div
              className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: `${routerColor}15`,
                color: routerColor,
              }}
            >
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: routerColor }}
              />
              {router.name}
            </div>
          )}

          {/* Route count */}
          <div className="flex items-center gap-1 text-xs text-muted">
            <Route className="h-3.5 w-3.5" />
            <span>{preset.routes.length} route{preset.routes.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Date */}
          <div className="flex items-center gap-1 text-xs text-muted">
            <Clock className="h-3.5 w-3.5" />
            <span>{formatDate(preset.createdAt)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-auto flex items-center gap-2 pt-2">
          <button
            onClick={handleRecall}
            className="flex flex-1 items-center justify-center gap-2 rounded-md bg-accent/15 px-3 py-2 text-xs font-medium text-accent transition-colors hover:bg-accent/25"
          >
            <Play className="h-3.5 w-3.5" />
            Recall
          </button>
          <button
            onClick={handleDelete}
            className={`flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
              confirmDelete
                ? 'bg-error/15 text-error hover:bg-error/25'
                : 'bg-surface-2 text-muted hover:bg-surface-2 hover:text-foreground'
            }`}
          >
            {confirmDelete ? (
              <>
                <AlertTriangle className="h-3.5 w-3.5" />
                Confirm
              </>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
