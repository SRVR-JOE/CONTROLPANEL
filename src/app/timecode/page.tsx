'use client';

import { useState } from 'react';
import { Clock, Volume2, Settings } from 'lucide-react';
import TimecodeDisplay from '@/components/timecode/TimecodeDisplay';
import AudioOutputRouter from '@/components/timecode/AudioOutputRouter';
import TimecodeSettings from '@/components/timecode/TimecodeSettings';

type Tab = 'generators' | 'routing' | 'settings';

const tabs: { id: Tab; label: string; icon: typeof Clock }[] = [
  { id: 'generators', label: 'Generators', icon: Clock },
  { id: 'routing', label: 'Audio Routing', icon: Volume2 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function TimecodePage() {
  const [activeTab, setActiveTab] = useState<Tab>('generators');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Timecode Generator</h1>
        <p className="text-sm text-muted mt-1">Generate and route LTC, MTC, Art-Net and sACN timecode to soundcards and Dante networks</p>
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
      {activeTab === 'generators' && <TimecodeDisplay />}
      {activeTab === 'routing' && <AudioOutputRouter />}
      {activeTab === 'settings' && <TimecodeSettings />}
    </div>
  );
}
