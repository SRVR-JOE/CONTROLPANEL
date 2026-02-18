'use client';

import Sidebar from './Sidebar';
import StatusBar from './StatusBar';
import CopilotWrapper from '@/components/copilot/CopilotWrapper';
import { useDevicePolling } from '@/hooks/useDevicePolling';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  // Poll all devices for real health data every 5 seconds
  useDevicePolling(5000);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar />
      <StatusBar />
      <main className="pl-16 pt-10">
        <div className="p-6">{children}</div>
      </main>
      <CopilotWrapper />
    </div>
  );
}
