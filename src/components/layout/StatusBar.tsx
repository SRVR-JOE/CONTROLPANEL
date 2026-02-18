'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store';

export default function StatusBar() {
  const devices = useStore((state) => state.devices);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(
        new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const statusCounts = {
    online: devices.filter((d) => d.status === 'online').length,
    warning: devices.filter((d) => d.status === 'warning').length,
    error: devices.filter((d) => d.status === 'error').length,
    offline: devices.filter((d) => d.status === 'offline').length,
  };

  return (
    <header className="fixed left-16 right-0 top-0 z-30 flex h-10 items-center justify-between border-b border-border bg-surface/80 px-4 backdrop-blur-xl">
      {/* System status */}
      <div className="flex items-center gap-4">
        <span className="text-xs font-medium text-muted">SYSTEM STATUS</span>
        <div className="flex items-center gap-3">
          {statusCounts.online > 0 && (
            <div className="flex items-center gap-1.5" aria-label={`${statusCounts.online} online`}>
              <span className="inline-block h-2 w-2 rounded-full bg-success" />
              <span className="text-xs text-foreground">{statusCounts.online}</span>
              <span className="sr-only">online</span>
            </div>
          )}
          {statusCounts.warning > 0 && (
            <div className="flex items-center gap-1.5" aria-label={`${statusCounts.warning} warning`}>
              <span className="inline-block h-2 w-2 rounded-full bg-warning" />
              <span className="text-xs text-foreground">{statusCounts.warning}</span>
              <span className="sr-only">warning</span>
            </div>
          )}
          {statusCounts.error > 0 && (
            <div className="flex items-center gap-1.5" aria-label={`${statusCounts.error} error`}>
              <span className="inline-block h-2 w-2 rounded-full bg-error" />
              <span className="text-xs text-foreground">{statusCounts.error}</span>
              <span className="sr-only">error</span>
            </div>
          )}
          {statusCounts.offline > 0 && (
            <div className="flex items-center gap-1.5" aria-label={`${statusCounts.offline} offline`}>
              <span className="inline-block h-2 w-2 rounded-full bg-muted" />
              <span className="text-xs text-foreground">{statusCounts.offline}</span>
              <span className="sr-only">offline</span>
            </div>
          )}
        </div>
        <span className="text-xs text-muted">
          {devices.length} device{devices.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Current time */}
      <div className="font-mono text-xs text-muted">{currentTime}</div>
    </header>
  );
}
