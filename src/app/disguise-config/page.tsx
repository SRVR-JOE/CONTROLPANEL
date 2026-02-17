'use client';

import SessionBar from '@/components/disguise/SessionBar';
import ProfileBar from '@/components/disguise/ProfileBar';
import MachineIdentitySection from '@/components/disguise/MachineIdentitySection';
import NetworkAdaptersSection from '@/components/disguise/NetworkAdaptersSection';
import SMBSettingsSection from '@/components/disguise/SMBSettingsSection';
import WindowsSettingsSection from '@/components/disguise/WindowsSettingsSection';
import D3ServiceSection from '@/components/disguise/D3ServiceSection';
import PerformanceTweaksSection from '@/components/disguise/PerformanceTweaksSection';
import DeploymentPanel from '@/components/disguise/DeploymentPanel';
import DiscoveryPanel from '@/components/disguise/DiscoveryPanel';

export default function DisguiseConfigPage() {
  return (
    <div className="space-y-4">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Disguise Server Config</h1>
        <p className="text-sm text-muted">
          Configure profiles for disguise media servers. Discover machines on the network, configure profiles, and deploy to multiple servers.
        </p>
      </div>

      {/* Session & machine selector */}
      <SessionBar />

      {/* Profile selector & bulk actions */}
      <ProfileBar />

      {/* Network discovery & deployment */}
      <DiscoveryPanel />
      <DeploymentPanel />

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
