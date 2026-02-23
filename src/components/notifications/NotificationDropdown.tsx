'use client';

import { useStore } from '@/store';
import { useShallow } from 'zustand/react/shallow';
import { Bell, CheckCheck, AlertTriangle, AlertCircle, Info, Flame, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import type { EventSeverity } from '@/types';

const severityIcons: Record<EventSeverity, typeof Info> = {
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
  critical: Flame,
};

const severityColors: Record<EventSeverity, string> = {
  info: '#3b82f6',
  warning: '#f59e0b',
  error: '#ef4444',
  critical: '#dc2626',
};

interface NotificationDropdownProps {
  onClose: () => void;
}

export default function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useStore(
    useShallow((s) => ({
      notifications: s.notifications.slice(0, 20),
      markNotificationRead: s.markNotificationRead,
      markAllNotificationsRead: s.markAllNotificationsRead,
    }))
  );

  return (
    <div
      style={{
        position: 'absolute',
        top: '100%',
        right: 0,
        marginTop: '4px',
        width: '360px',
        maxHeight: '480px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        overflow: 'hidden',
        zIndex: 50,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bell size={14} style={{ color: 'var(--accent)' }} />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)' }}>Notifications</span>
        </div>
        <button
          onClick={markAllNotificationsRead}
          style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '11px', color: 'var(--accent)',
          }}
        >
          <CheckCheck size={12} />
          Mark all read
        </button>
      </div>

      {/* Notification list */}
      <div style={{ overflowY: 'auto', maxHeight: '380px' }}>
        {notifications.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--muted)', fontSize: '12px' }}>
            No notifications yet
          </div>
        ) : (
          notifications.map((n) => {
            const Icon = severityIcons[n.severity];
            return (
              <button
                key={n.id}
                onClick={() => markNotificationRead(n.id)}
                style={{
                  display: 'flex',
                  gap: '10px',
                  padding: '10px 16px',
                  width: '100%',
                  textAlign: 'left',
                  background: n.read ? 'transparent' : 'rgba(59, 130, 246, 0.04)',
                  border: 'none',
                  borderBottom: '1px solid var(--border)',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
              >
                <Icon size={14} style={{ color: severityColors[n.severity], flexShrink: 0, marginTop: '2px' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: n.read ? 400 : 600,
                    color: 'var(--foreground)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {n.title}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {n.message}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px', fontFamily: 'var(--font-mono, monospace)' }}>
                    {n.deviceName} &middot; {new Date(n.createdAt).toLocaleTimeString()}
                  </div>
                </div>
                {!n.read && (
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, marginTop: '6px' }} />
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Footer */}
      <Link
        href="/events"
        onClick={onClose}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          padding: '10px', borderTop: '1px solid var(--border)',
          fontSize: '12px', fontWeight: 600, color: 'var(--accent)',
          textDecoration: 'none',
        }}
      >
        View all events
        <ExternalLink size={12} />
      </Link>
    </div>
  );
}
