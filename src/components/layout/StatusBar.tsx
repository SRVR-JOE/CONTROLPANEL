'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store';
import { useShallow } from 'zustand/react/shallow';

export default function StatusBar() {
  // Compute status counts inside the selector so StatusBar only re-renders
  // when a device's status field actually changes, not on any device mutation.
  const { online, warning, error, offline, total } = useStore(
    useShallow((state) => {
      let online = 0, warning = 0, error = 0, offline = 0;
      for (const d of state.devices) {
        if (d.status === 'online') online++;
        else if (d.status === 'warning') warning++;
        else if (d.status === 'error') error++;
        else if (d.status === 'offline') offline++;
      }
      return { online, warning, error, offline, total: state.devices.length };
    })
  );

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

  return (
    <header className="fixed left-16 right-0 top-0 z-30 flex h-10 items-center justify-between border-b border-border bg-surface/80 px-4 backdrop-blur-xl">
      {/* System status */}
      <div className="flex items-center gap-4">
        <span className="text-xs font-medium text-muted">SYSTEM STATUS</span>
        <div className="flex items-center gap-3">
          {online > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-success" />
              <span className="text-xs text-foreground">{online}</span>
            </div>
          )}
          {warning > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-warning" />
              <span className="text-xs text-foreground">{warning}</span>
            </div>
          )}
          {error > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-error" />
              <span className="text-xs text-foreground">{error}</span>
            </div>
          )}
          {offline > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-muted" />
              <span className="text-xs text-foreground">{offline}</span>
            </div>
          )}
        </div>
        <span className="text-xs text-muted">
          {total} device{total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Current time */}
      <div className="font-mono text-xs text-muted">{currentTime}</div>
    </header>
  );
}
