'use client';

import { useState } from 'react';
import { useStore } from '@/store';
import { CompanionModule, DeviceManufacturer } from '@/types';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Zap,
  MessageSquare,
  Variable,
  Network,
  Hash,
} from 'lucide-react';

const manufacturerColors: Record<DeviceManufacturer, string> = {
  disguise: '#ff3366',
  barco: '#00b4d8',
  brompton: '#10b981',
  lightware: '#8b5cf6',
  aja: '#f59e0b',
  blackmagic: '#6366f1',
  ross: '#ef4444',
  yamaha: '#7c3aed',
  'allen-heath': '#06b6d4',
  behringer: '#f97316',
  shure: '#14b8a6',
  sennheiser: '#64748b',
  panasonic: '#0ea5e9',
  sony: '#1d4ed8',
  etc: '#a855f7',
  'ma-lighting': '#ec4899',
  qsc: '#84cc16',
  'clear-com': '#f43f5e',
  riedel: '#0d9488',
  magewell: '#6366f1',
  teradek: '#e11d48',
  extron: '#059669',
  crestron: '#2563eb',
  ptzoptics: '#d97706',
  datavideo: '#7c2d12',
  roland: '#dc2626',
};

interface CompanionModuleCardProps {
  module: CompanionModule;
}

export default function CompanionModuleCard({ module }: CompanionModuleCardProps) {
  const addModuleInstance = useStore((s) => s.addModuleInstance);
  const [expanded, setExpanded] = useState(false);

  const accentColor = manufacturerColors[module.manufacturer];

  const handleAddInstance = () => {
    const label = `${module.name} #${Date.now().toString(36).slice(-4)}`;
    const defaultConfig: Record<string, string | number | boolean> = {};

    // Build default config from all action options
    for (const action of module.actions) {
      for (const opt of action.options) {
        if (opt.default !== undefined) {
          defaultConfig[opt.id] = opt.default;
        }
      }
    }

    if (module.defaultPort) {
      defaultConfig['port'] = module.defaultPort;
    }

    addModuleInstance(module.moduleId, undefined, label, defaultConfig);
  };

  return (
    <div
      className="glass-card overflow-hidden transition-all hover:border-accent/30"
      style={{ borderLeftWidth: 3, borderLeftColor: accentColor }}
    >
      {/* Header */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-foreground truncate">{module.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-mono font-medium"
                style={{
                  backgroundColor: `${accentColor}15`,
                  color: accentColor,
                }}
              >
                {module.moduleId}
              </span>
            </div>
          </div>
          <button
            onClick={handleAddInstance}
            className="flex items-center gap-1.5 rounded-md bg-accent/15 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/25 shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Instance
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="px-4 pb-3 space-y-2.5">
        <p className="text-xs text-muted leading-relaxed">{module.description}</p>

        {/* Protocol & Port */}
        <div className="flex items-center gap-4 text-xs text-muted">
          <div className="flex items-center gap-1.5">
            <Network className="h-3.5 w-3.5" />
            <span>{module.protocol}</span>
          </div>
          {module.defaultPort && (
            <div className="flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5" />
              <span>Port {module.defaultPort}</span>
            </div>
          )}
        </div>

        {/* Stat badges */}
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-foreground">
            <Zap className="h-3 w-3 text-warning" />
            {module.actions.length} Action{module.actions.length !== 1 ? 's' : ''}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-foreground">
            <MessageSquare className="h-3 w-3 text-accent" />
            {module.feedbacks.length} Feedback{module.feedbacks.length !== 1 ? 's' : ''}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-foreground">
            <Variable className="h-3 w-3 text-success" />
            {module.variables.length} Variable{module.variables.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Supported models */}
        {module.supportedModels.length > 0 && (
          <div className="text-xs">
            <span className="text-muted">Models: </span>
            <span className="text-foreground">{module.supportedModels.join(', ')}</span>
          </div>
        )}

        {/* Expand / Collapse */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors pt-1"
        >
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
          {expanded ? 'Hide details' : 'Show details'}
        </button>

        {/* Expanded details */}
        {expanded && (
          <div className="space-y-4 pt-2 border-t border-border">
            {/* Actions */}
            {module.actions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-warning" />
                  Actions
                </h4>
                <div className="space-y-2">
                  {module.actions.map((action) => (
                    <div
                      key={action.id}
                      className="rounded-md bg-surface-2 p-2.5 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-foreground">{action.name}</span>
                        <span className="text-[10px] font-mono text-muted">{action.id}</span>
                      </div>
                      {action.description && (
                        <p className="text-[11px] text-muted">{action.description}</p>
                      )}
                      {action.options.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {action.options.map((opt) => (
                            <span
                              key={opt.id}
                              className="inline-flex items-center rounded bg-background px-1.5 py-0.5 text-[10px] font-mono text-muted"
                            >
                              {opt.label}
                              <span className="ml-1 text-accent/60">({opt.type})</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Feedbacks */}
            {module.feedbacks.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-accent" />
                  Feedbacks
                </h4>
                <div className="space-y-1.5">
                  {module.feedbacks.map((fb) => (
                    <div
                      key={fb.id}
                      className="rounded-md bg-surface-2 px-2.5 py-2 flex items-center justify-between"
                    >
                      <div>
                        <span className="text-xs font-medium text-foreground">{fb.name}</span>
                        {fb.description && (
                          <p className="text-[11px] text-muted mt-0.5">{fb.description}</p>
                        )}
                      </div>
                      <span className="rounded bg-background px-1.5 py-0.5 text-[10px] font-mono text-muted shrink-0 ml-2">
                        {fb.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Variables */}
            {module.variables.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Variable className="h-3.5 w-3.5 text-success" />
                  Variables
                </h4>
                <div className="grid grid-cols-2 gap-1.5">
                  {module.variables.map((v) => (
                    <div
                      key={v.id}
                      className="rounded-md bg-surface-2 px-2.5 py-2"
                    >
                      <span className="block text-[10px] font-mono text-muted">{v.id}</span>
                      <span className="text-xs text-foreground">{v.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
