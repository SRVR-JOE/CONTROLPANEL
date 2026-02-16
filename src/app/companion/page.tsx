'use client';

import { useState } from 'react';
import { Blocks, Network, Layers, Zap } from 'lucide-react';
import CompanionConnectionPanel from '@/components/companion/CompanionConnectionPanel';
import CompanionModuleCard from '@/components/companion/CompanionModuleCard';
import CompanionInstanceList from '@/components/companion/CompanionInstanceList';
import { companionModules } from '@/store/companion-modules';
import { DeviceManufacturer } from '@/types';

type Tab = 'connection' | 'modules' | 'instances';

const tabs: { id: Tab; label: string; icon: typeof Blocks }[] = [
  { id: 'connection', label: 'Connection', icon: Network },
  { id: 'modules', label: 'Modules', icon: Blocks },
  { id: 'instances', label: 'Instances', icon: Layers },
];

const manufacturers: DeviceManufacturer[] = [
  'disguise', 'barco', 'brompton', 'lightware', 'aja', 'blackmagic', 'ross',
  'yamaha', 'allen-heath', 'behringer', 'shure', 'sennheiser', 'panasonic', 'sony',
  'etc', 'ma-lighting', 'qsc', 'clear-com', 'riedel', 'magewell', 'teradek',
  'extron', 'crestron', 'ptzoptics', 'datavideo', 'roland',
];

const manufacturerLabels: Record<DeviceManufacturer, string> = {
  disguise: 'disguise',
  barco: 'Barco',
  brompton: 'Brompton',
  lightware: 'Lightware',
  aja: 'AJA',
  blackmagic: 'Blackmagic Design',
  ross: 'Ross',
  yamaha: 'Yamaha',
  'allen-heath': 'Allen & Heath',
  behringer: 'Behringer',
  shure: 'Shure',
  sennheiser: 'Sennheiser',
  panasonic: 'Panasonic',
  sony: 'Sony',
  etc: 'ETC',
  'ma-lighting': 'MA Lighting',
  qsc: 'QSC',
  'clear-com': 'Clear-Com',
  riedel: 'Riedel',
  magewell: 'Magewell',
  teradek: 'Teradek',
  extron: 'Extron',
  crestron: 'Crestron',
  ptzoptics: 'PTZOptics',
  datavideo: 'Datavideo',
  roland: 'Roland',
};

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

export default function CompanionPage() {
  const [activeTab, setActiveTab] = useState<Tab>('modules');
  const [filterMfr, setFilterMfr] = useState<DeviceManufacturer | 'all'>('all');

  const filteredModules = filterMfr === 'all'
    ? companionModules
    : companionModules.filter((m) => m.manufacturer === filterMfr);

  const totalActions = companionModules.reduce((sum, m) => sum + m.actions.length, 0);
  const totalFeedbacks = companionModules.reduce((sum, m) => sum + m.feedbacks.length, 0);
  const totalVariables = companionModules.reduce((sum, m) => sum + m.variables.length, 0);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">Bitfocus Companion</h1>
          <span className="rounded bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">Integration</span>
        </div>
        <p className="text-sm text-muted mt-1">
          Connect to Bitfocus Companion for unified device control via HTTP, TCP, OSC, and WebSocket APIs
        </p>
      </div>

      {/* Stats bar */}
      <div className="flex gap-4">
        <div className="glass-card px-4 py-2 flex items-center gap-2">
          <Blocks className="h-4 w-4 text-accent" />
          <span className="text-sm text-foreground font-medium">{companionModules.length}</span>
          <span className="text-xs text-muted">Modules</span>
        </div>
        <div className="glass-card px-4 py-2 flex items-center gap-2">
          <Zap className="h-4 w-4 text-success" />
          <span className="text-sm text-foreground font-medium">{totalActions}</span>
          <span className="text-xs text-muted">Actions</span>
        </div>
        <div className="glass-card px-4 py-2 flex items-center gap-2">
          <Layers className="h-4 w-4 text-warning" />
          <span className="text-sm text-foreground font-medium">{totalFeedbacks}</span>
          <span className="text-xs text-muted">Feedbacks</span>
        </div>
        <div className="glass-card px-4 py-2 flex items-center gap-2">
          <Network className="h-4 w-4 text-purple-400" />
          <span className="text-sm text-foreground font-medium">{totalVariables}</span>
          <span className="text-xs text-muted">Variables</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-surface p-1 w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-accent text-white'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'connection' && <CompanionConnectionPanel />}

      {activeTab === 'modules' && (
        <div className="space-y-4">
          {/* Manufacturer filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterMfr('all')}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                filterMfr === 'all' ? 'bg-accent text-white' : 'bg-surface-2 text-muted hover:text-foreground'
              }`}
            >
              All ({companionModules.length})
            </button>
            {manufacturers.map((mfr) => {
              const count = companionModules.filter((m) => m.manufacturer === mfr).length;
              if (count === 0) return null;
              return (
                <button
                  key={mfr}
                  onClick={() => setFilterMfr(mfr)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    filterMfr === mfr ? 'text-white' : 'text-muted hover:text-foreground'
                  }`}
                  style={{
                    backgroundColor: filterMfr === mfr ? manufacturerColors[mfr] : undefined,
                    border: filterMfr !== mfr ? '1px solid var(--border)' : undefined,
                  }}
                >
                  {manufacturerLabels[mfr]} ({count})
                </button>
              );
            })}
          </div>

          {/* Module cards */}
          <div className="grid gap-4">
            {filteredModules.map((mod) => (
              <CompanionModuleCard key={mod.id} module={mod} />
            ))}
          </div>
        </div>
      )}

      {activeTab === 'instances' && <CompanionInstanceList />}
    </div>
  );
}
