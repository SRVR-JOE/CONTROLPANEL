'use client';

import SessionBar from '@/components/disguise/SessionBar';
import ProfileBar from '@/components/disguise/ProfileBar';
import MachineIdentitySection from '@/components/disguise/MachineIdentitySection';
import NetworkAdaptersSection from '@/components/disguise/NetworkAdaptersSection';
import SMBSettingsSection from '@/components/disguise/SMBSettingsSection';
import WindowsSettingsSection from '@/components/disguise/WindowsSettingsSection';
import D3ServiceSection from '@/components/disguise/D3ServiceSection';
import PerformanceTweaksSection from '@/components/disguise/PerformanceTweaksSection';

export default function DisguiseConfigPage() {
  return (
    <div className="space-y-4">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Disguise Server Config</h1>
        <p className="text-sm text-muted">
          Configure profiles for disguise media servers. Select a session, pick a machine, and edit settings.
        </p>
      </div>

      {/* Session & machine selector */}
      <SessionBar />

      {/* Profile selector & bulk actions */}
      <ProfileBar />

      {/* Configuration sections */}
      <MachineIdentitySection />
      <NetworkAdaptersSection />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SMBSettingsSection />
        <WindowsSettingsSection />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <D3ServiceSection />
        <PerformanceTweaksSection />
      </div>
    </div>
  );
}
