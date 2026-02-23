'use client';

import Sidebar from './Sidebar';
import StatusBar from './StatusBar';
import { StoreHydrator } from '@/components/StoreHydrator';
import { useDevicePolling } from '@/hooks/useDevicePolling';
import { useNotificationPolling } from '@/hooks/useNotificationPolling';
import ToastContainer from '@/components/notifications/ToastContainer';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  // Poll all devices for real health data every 5 seconds
  useDevicePolling(5000);
  // Poll for new events every 10 seconds, trigger toasts
  useNotificationPolling();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <StoreHydrator />
      <Sidebar />
      <StatusBar />
      <main className="pl-16 pt-10">
        <div className="p-6">{children}</div>
      </main>
      <ToastContainer />
    </div>
  );
}
