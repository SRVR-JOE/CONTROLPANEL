'use client';

import { useState } from 'react';
import { Blocks, Zap, Eye, Variable, ChevronDown, ChevronRight, Play, Network } from 'lucide-react';
import { useStore } from '@/store';
import { companionModules } from '@/store/companion-modules';
import { Device, DeviceManufacturer, CompanionModule, CompanionModuleAction } from '@/types';

const manufacturerColors: Record<DeviceManufacturer, string> = {
  disguise: '#ff3366',
  barco: '#00b4d8',
  brompton: '#10b981',
  lightware: '#8b5cf6',
  aja: '#f59e0b',
  blackmagic: '#6366f1',
  ross: '#ef4444',
};

interface CompanionDevicePanelProps {
  device: Device;
}

function ActionRow({ action, onFire }: { action: CompanionModuleAction; onFire: (actionId: string) => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-border/50 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 hover:bg-surface-2/30 transition-colors">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 flex-1 text-left"
        >
          {expanded ? <ChevronDown className="h-3 w-3 text-muted" /> : <ChevronRight className="h-3 w-3 text-muted" />}
          <span className="text-sm text-foreground">{action.name}</span>
          {action.options.length > 0 && (
            <span className="text-[10px] text-muted">({action.options.length} params)</span>
          )}
        </button>
        <button
          onClick={() => onFire(action.id)}
          className="flex items-center gap-1 rounded bg-accent/15 px-2 py-1 text-xs text-accent hover:bg-accent/25 transition-colors"
        >
          <Play className="h-3 w-3" />
          Fire
        </button>
      </div>
      {expanded && action.options.length > 0 && (
        <div className="px-3 pb-2 pt-1 border-t border-border/30 space-y-1.5">
          {action.options.map((opt) => (
            <div key={opt.id} className="flex items-center gap-2 text-xs">
              <span className="text-muted w-28 truncate">{opt.label}:</span>
              {opt.type === 'dropdown' && opt.choices ? (
                <select className="flex-1 rounded border border-border bg-surface px-2 py-1 text-xs text-foreground">
                  {opt.choices.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              ) : opt.type === 'checkbox' ? (
                <input type="checkbox" defaultChecked={opt.default as boolean} className="rounded border-border" />
              ) : opt.type === 'number' ? (
                <input type="number" defaultValue={opt.default as number} className="flex-1 rounded border border-border bg-surface px-2 py-1 text-xs text-foreground w-20" />
              ) : (
                <input type="text" defaultValue={opt.default as string} placeholder={opt.label} className="flex-1 rounded border border-border bg-surface px-2 py-1 text-xs text-foreground" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ModuleSection({ module, device }: { module: CompanionModule; device: Device }) {
  const [activeSection, setActiveSection] = useState<'actions' | 'feedbacks' | 'variables'>('actions');
  const executeCompanionAction = useStore((s) => s.executeCompanionAction);
  const addModuleInstance = useStore((s) => s.addModuleInstance);
  const instances = useStore((s) => s.companionModuleInstances.filter((i) => i.moduleId === module.moduleId && i.deviceId === device.id));
  const companionConnection = useStore((s) => s.companionConnection);

  const handleFire = (actionId: string) => {
    if (instances.length > 0) {
      executeCompanionAction(instances[0].id, actionId, {});
    } else if (companionConnection) {
      // Auto-create instance and fire
      addModuleInstance(module.moduleId, device.id, `${device.name} - ${module.name}`, { host: device.ipAddress });
    }
  };

  const accentColor = manufacturerColors[device.manufacturer];

  return (
    <div className="rounded-lg border border-border bg-surface overflow-hidden">
      {/* Module header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accentColor }} />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{module.name}</span>
            <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-mono text-muted">{module.moduleId}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <Network className="h-3 w-3 text-muted" />
            <span className="text-[11px] text-muted">{module.protocol}</span>
            {module.defaultPort && <span className="text-[11px] text-muted">port {module.defaultPort}</span>}
          </div>
        </div>
        <div className="flex gap-1.5">
          <span className="flex items-center gap-1 rounded bg-accent/10 px-1.5 py-0.5 text-[10px] text-accent">
            <Zap className="h-2.5 w-2.5" />{module.actions.length}
          </span>
          <span className="flex items-center gap-1 rounded bg-success/10 px-1.5 py-0.5 text-[10px] text-success">
            <Eye className="h-2.5 w-2.5" />{module.feedbacks.length}
          </span>
          <span className="flex items-center gap-1 rounded bg-purple-400/10 px-1.5 py-0.5 text-[10px] text-purple-400">
            <Variable className="h-2.5 w-2.5" />{module.variables.length}
          </span>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex border-b border-border">
        {(['actions', 'feedbacks', 'variables'] as const).map((section) => {
          const count = section === 'actions' ? module.actions.length : section === 'feedbacks' ? module.feedbacks.length : module.variables.length;
          return (
            <button
              key={section}
              onClick={() => setActiveSection(section)}
              className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                activeSection === section ? 'text-accent border-b-2 border-accent' : 'text-muted hover:text-foreground'
              }`}
            >
              {section.charAt(0).toUpperCase() + section.slice(1)} ({count})
            </button>
          );
        })}
      </div>

      {/* Section content */}
      <div className="p-3 max-h-80 overflow-y-auto space-y-2">
        {activeSection === 'actions' && module.actions.map((action) => (
          <ActionRow key={action.id} action={action} onFire={handleFire} />
        ))}

        {activeSection === 'feedbacks' && module.feedbacks.map((fb) => (
          <div key={fb.id} className="flex items-center gap-2 rounded-lg border border-border/50 px-3 py-2">
            <Eye className="h-3.5 w-3.5 text-success" />
            <div>
              <div className="text-sm text-foreground">{fb.name}</div>
              <div className="text-[10px] text-muted">Type: {fb.type}</div>
            </div>
          </div>
        ))}

        {activeSection === 'variables' && module.variables.map((v) => (
          <div key={v.id} className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2">
            <div className="flex items-center gap-2">
              <Variable className="h-3.5 w-3.5 text-purple-400" />
              <div>
                <div className="text-sm text-foreground">{v.name}</div>
                <div className="text-[10px] font-mono text-muted">${`(${module.moduleId}:${v.id})`}</div>
              </div>
            </div>
            <span className="text-xs font-mono text-muted">{v.value ?? '—'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CompanionDevicePanel({ device }: CompanionDevicePanelProps) {
  const moduleIds = device.companionModuleIds ?? [];
  const deviceModules = companionModules.filter((m) => moduleIds.includes(m.moduleId));

  if (deviceModules.length === 0) {
    return null;
  }

  const totalActions = deviceModules.reduce((sum, m) => sum + m.actions.length, 0);
  const totalFeedbacks = deviceModules.reduce((sum, m) => sum + m.feedbacks.length, 0);
  const totalVariables = deviceModules.reduce((sum, m) => sum + m.variables.length, 0);

  return (
    <div className="space-y-4">
      <div className="bg-[#14141f] rounded-lg border border-[#2a2a3d] p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Blocks size={18} className="text-accent" />
            Companion Modules
          </h2>
          <div className="flex gap-3 text-xs text-muted">
            <span>{deviceModules.length} module{deviceModules.length !== 1 ? 's' : ''}</span>
            <span>{totalActions} actions</span>
            <span>{totalFeedbacks} feedbacks</span>
            <span>{totalVariables} variables</span>
          </div>
        </div>

        <div className="space-y-4">
          {deviceModules.map((mod) => (
            <ModuleSection key={mod.id} module={mod} device={device} />
          ))}
        </div>
      </div>
    </div>
  );
}
