'use client';

import { useState, useCallback } from 'react';
import { useStore } from '@/store';
import { companionModules } from '@/store/companion-modules';
import { CompanionModuleInstance, DeviceManufacturer } from '@/types';
import {
  ChevronDown,
  ChevronRight,
  Trash2,
  Play,
  Power,
  PowerOff,
  AlertTriangle,
  Variable,
  Zap,
} from 'lucide-react';

const manufacturerColors: Record<DeviceManufacturer, string> = {
  disguise: '#ff3366',
  barco: '#00b4d8',
  brompton: '#10b981',
  lightware: '#8b5cf6',
  aja: '#f59e0b',
  blackmagic: '#6366f1',
  ross: '#ef4444',
};

const instanceStatusConfig: Record<
  CompanionModuleInstance['status'],
  { color: string; label: string }
> = {
  ok: { color: 'var(--success)', label: 'OK' },
  warning: { color: 'var(--warning)', label: 'Warning' },
  error: { color: 'var(--error)', label: 'Error' },
  disabled: { color: 'var(--muted)', label: 'Disabled' },
};

function InstanceRow({ instance }: { instance: CompanionModuleInstance }) {
  const devices = useStore((s) => s.devices);
  const toggleModuleInstance = useStore((s) => s.toggleModuleInstance);
  const removeModuleInstance = useStore((s) => s.removeModuleInstance);
  const executeCompanionAction = useStore((s) => s.executeCompanionAction);

  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const parentModule = companionModules.find((m) => m.moduleId === instance.moduleId);
  const linkedDevice = instance.deviceId
    ? devices.find((d) => d.id === instance.deviceId)
    : undefined;
  const statusCfg = instanceStatusConfig[instance.status];
  const accentColor = parentModule
    ? manufacturerColors[parentModule.manufacturer]
    : 'var(--accent)';

  const handleToggle = useCallback(() => {
    toggleModuleInstance(instance.id);
  }, [toggleModuleInstance, instance.id]);

  const handleDelete = useCallback(() => {
    if (confirmDelete) {
      removeModuleInstance(instance.id);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  }, [confirmDelete, removeModuleInstance, instance.id]);

  const handleFireAction = useCallback(
    (actionId: string) => {
      executeCompanionAction(instance.id, actionId, {});
    },
    [executeCompanionAction, instance.id],
  );

  const variableEntries = Object.entries(instance.variableValues);

  return (
    <div
      className="glass-card overflow-hidden transition-all"
      style={{ borderLeftWidth: 3, borderLeftColor: accentColor }}
    >
      {/* Instance header */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-muted hover:text-foreground transition-colors shrink-0"
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        {/* Status dot */}
        <span
          className="h-2.5 w-2.5 rounded-full shrink-0"
          style={{ backgroundColor: statusCfg.color }}
        />

        {/* Label & info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground truncate">
              {instance.label}
            </span>
            <span className="text-[10px] font-medium" style={{ color: statusCfg.color }}>
              {statusCfg.label}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {parentModule && (
              <span className="text-[11px] text-muted">{parentModule.name}</span>
            )}
            {linkedDevice && (
              <>
                <span className="text-[10px] text-muted/50">|</span>
                <span className="text-[11px] text-accent">{linkedDevice.name}</span>
              </>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Enable/Disable toggle */}
          <button
            onClick={handleToggle}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
              instance.enabled
                ? 'bg-success/15 text-success hover:bg-success/25'
                : 'bg-surface-2 text-muted hover:text-foreground'
            }`}
            title={instance.enabled ? 'Disable instance' : 'Enable instance'}
          >
            {instance.enabled ? (
              <Power className="h-3.5 w-3.5" />
            ) : (
              <PowerOff className="h-3.5 w-3.5" />
            )}
            {instance.enabled ? 'On' : 'Off'}
          </button>

          {/* Delete */}
          <button
            onClick={handleDelete}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
              confirmDelete
                ? 'bg-error/15 text-error hover:bg-error/25'
                : 'bg-surface-2 text-muted hover:text-foreground'
            }`}
            title="Remove instance"
          >
            {confirmDelete ? (
              <>
                <AlertTriangle className="h-3.5 w-3.5" />
                Confirm
              </>
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-border px-4 py-3 space-y-4">
          {/* Actions panel */}
          {parentModule && parentModule.actions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-warning" />
                Actions
              </h4>
              <div className="space-y-1.5">
                {parentModule.actions.map((action) => (
                  <div
                    key={action.id}
                    className="flex items-center justify-between gap-3 rounded-md bg-surface-2 px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-medium text-foreground">
                        {action.name}
                      </span>
                      {action.description && (
                        <p className="text-[10px] text-muted mt-0.5 truncate">
                          {action.description}
                        </p>
                      )}
                      {action.options.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {action.options.map((opt) => (
                            <span
                              key={opt.id}
                              className="inline-flex items-center rounded bg-background px-1.5 py-0.5 text-[9px] font-mono text-muted"
                            >
                              {opt.label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleFireAction(action.id)}
                      disabled={!instance.enabled}
                      className="flex items-center gap-1.5 rounded-md bg-accent/15 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/25 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                    >
                      <Play className="h-3 w-3" />
                      Fire
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Variable values */}
          {variableEntries.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Variable className="h-3.5 w-3.5 text-success" />
                Variable Values
              </h4>
              <div className="grid grid-cols-2 gap-1.5">
                {variableEntries.map(([key, value]) => (
                  <div
                    key={key}
                    className="rounded-md bg-surface-2 px-2.5 py-2"
                  >
                    <span className="block text-[10px] font-mono text-muted truncate">
                      {key}
                    </span>
                    <span className="text-xs font-mono text-foreground">
                      {value || '--'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Config display */}
          {Object.keys(instance.config).length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted">Configuration</h4>
              <div className="rounded-md bg-surface-2 p-2.5">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {Object.entries(instance.config).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between text-[11px]">
                      <span className="text-muted font-mono">{key}</span>
                      <span className="text-foreground font-mono">{String(val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CompanionInstanceList() {
  const instances = useStore((s) => s.companionModuleInstances);

  if (instances.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 mx-auto mb-3">
          <Zap className="h-6 w-6 text-muted" />
        </div>
        <p className="text-sm text-muted">No module instances configured</p>
        <p className="text-xs text-muted/60 mt-1">
          Add instances from the module catalog to get started
        </p>
      </div>
    );
  }

  const enabledCount = instances.filter((i) => i.enabled).length;
  const errorCount = instances.filter((i) => i.status === 'error').length;

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center gap-4 text-xs text-muted">
        <span>
          <span className="font-mono text-foreground">{instances.length}</span>{' '}
          instance{instances.length !== 1 ? 's' : ''}
        </span>
        <span>
          <span className="font-mono text-success">{enabledCount}</span> enabled
        </span>
        {errorCount > 0 && (
          <span>
            <span className="font-mono text-error">{errorCount}</span> error{errorCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Instance list */}
      <div className="space-y-2">
        {instances.map((instance) => (
          <InstanceRow key={instance.id} instance={instance} />
        ))}
      </div>
    </div>
  );
}
