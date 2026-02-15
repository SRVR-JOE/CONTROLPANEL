'use client';

import Sidebar from './Sidebar';
import StatusBar from './StatusBar';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar />
      <StatusBar />
      <main className="pl-16 pt-10">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
