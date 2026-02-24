'use client';

import { useEffect, useState, useRef } from 'react';
import { useStore } from '@/store';
import { useShallow } from 'zustand/react/shallow';
import { Bell } from 'lucide-react';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';

export default function StatusBar() {
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

  const unreadCount = useStore((s) => s.unreadNotificationCount);

  const [currentTime, setCurrentTime] = useState<string>('');
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!bellOpen) return;
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [bellOpen]);

  // Close dropdown on Escape key
  useEffect(() => {
    if (!bellOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setBellOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [bellOpen]);

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

      {/* Right side: notification bell + clock */}
      <div className="flex items-center gap-4">
        {/* Notification bell */}
        <div ref={bellRef} style={{ position: 'relative' }}>
          <button
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
            aria-expanded={bellOpen}
            aria-haspopup="true"
            onClick={() => setBellOpen((o) => !o)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '4px', display: 'flex', alignItems: 'center', position: 'relative',
              color: unreadCount > 0 ? 'var(--accent)' : 'var(--muted)',
            }}
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: '0px', right: '0px',
                minWidth: '14px', height: '14px',
                background: '#ef4444', borderRadius: '7px',
                fontSize: '9px', fontWeight: 700, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 3px', lineHeight: 1,
              }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          {bellOpen && <NotificationDropdown onClose={() => setBellOpen(false)} />}
        </div>

        {/* Current time */}
        <div className="font-mono text-xs text-muted">{currentTime}</div>
      </div>
    </header>
  );
}
