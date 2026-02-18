'use client';

import { useState } from 'react';
import { useStore } from '@/store';
import PresetCard from '@/components/presets/PresetCard';
import SavePresetDialog from '@/components/presets/SavePresetDialog';
import { Save, Filter, Layers } from 'lucide-react';

export default function PresetsPage() {
  const matrixPresets = useStore((s) => s.matrixPresets);
  const systemPresets = useStore((s) => s.systemPresets);
  const routers = useStore((s) => s.routers);

  const [filterRouterId, setFilterRouterId] = useState<string>('all');

  const filteredPresets =
    filterRouterId === 'all'
      ? matrixPresets
      : matrixPresets.filter((p) => p.routerId === filterRouterId);

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl space-y-8 p-6">
        {/* Page header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Presets</h1>
            <p className="mt-1 text-sm text-muted">
              Manage matrix routing presets and system configurations
            </p>
          </div>
          <SavePresetDialog />
        </div>

        {/* Matrix Presets Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Save className="h-4 w-4 text-accent" />
              <h2 className="text-sm font-semibold text-foreground">Matrix Presets</h2>
              <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted">
                {filteredPresets.length}
              </span>
            </div>

            {/* Router filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-muted" />
              <select
                value={filterRouterId}
                onChange={(e) => setFilterRouterId(e.target.value)}
                className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-foreground outline-none transition-colors focus:border-accent"
              >
                <option value="all">All Routers</option>
                {routers.map((router) => (
                  <option key={router.id} value={router.id}>
                    {router.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredPresets.length === 0 ? (
            <div className="glass-card flex flex-col items-center justify-center py-12">
              <Save className="mb-3 h-8 w-8 text-muted" />
              <p className="text-sm text-muted">No presets found</p>
              <p className="mt-1 text-xs text-muted">
                Save current routes to create your first preset.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPresets.map((preset) => (
                <PresetCard key={preset.id} preset={preset} />
              ))}
            </div>
          )}
        </section>

        {/* System Presets Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold text-foreground">System Presets</h2>
            <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted">
              {systemPresets.length}
            </span>
          </div>

          {systemPresets.length === 0 ? (
            <div className="glass-card flex flex-col items-center justify-center py-12">
              <Layers className="mb-3 h-8 w-8 text-muted" />
              <p className="text-sm text-muted">No system presets configured</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {systemPresets.map((sp) => {
                const linkedPresets = matrixPresets.filter((mp) =>
                  sp.matrixPresets.includes(mp.id)
                );
                return (
                  <div key={sp.id} className="glass-card overflow-hidden">
                    <div className="h-1 bg-accent" />
                    <div className="space-y-3 p-4">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{sp.name}</h3>
                        {sp.description && (
                          <p className="mt-1 text-xs text-muted">{sp.description}</p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-xs text-muted">
                          Includes {linkedPresets.length} matrix preset
                          {linkedPresets.length !== 1 ? 's' : ''}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {linkedPresets.map((lp) => (
                            <span
                              key={lp.id}
                              className="rounded bg-accent/10 px-2 py-0.5 text-xs text-accent"
                            >
                              {lp.name}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="text-xs text-muted">
                        Created{' '}
                        {new Date(sp.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
