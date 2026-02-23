'use client';

import { useEffect, useState } from 'react';
import { X, AlertTriangle, AlertCircle, Info, Flame } from 'lucide-react';
import type { EventSeverity } from '@/types';

interface ToastProps {
  id: string;
  title: string;
  message: string;
  severity: EventSeverity;
  onDismiss: (id: string) => void;
  autoDismissMs?: number;
}

const severityConfig: Record<EventSeverity, { bg: string; border: string; icon: typeof Info; color: string }> = {
  info: { bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.3)', icon: Info, color: '#3b82f6' },
  warning: { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)', icon: AlertTriangle, color: '#f59e0b' },
  error: { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)', icon: AlertCircle, color: '#ef4444' },
  critical: { bg: 'rgba(220, 38, 38, 0.15)', border: 'rgba(220, 38, 38, 0.4)', icon: Flame, color: '#dc2626' },
};

export default function Toast({ id, title, message, severity, onDismiss, autoDismissMs = 5000 }: ToastProps) {
  const [exiting, setExiting] = useState(false);
  const config = severityConfig[severity];
  const Icon = config.icon;

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onDismiss(id), 300);
    }, autoDismissMs);
    return () => clearTimeout(timer);
  }, [id, autoDismissMs, onDismiss]);

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: `1px solid ${config.border}`,
        borderLeft: `3px solid ${config.color}`,
        borderRadius: '8px',
        padding: '12px 16px',
        maxWidth: '380px',
        minWidth: '300px',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
        transform: exiting ? 'translateX(120%)' : 'translateX(0)',
        opacity: exiting ? 0 : 1,
        transition: 'transform 0.3s ease, opacity 0.3s ease',
        display: 'flex',
        gap: '10px',
        alignItems: 'flex-start',
      }}
    >
      <Icon size={16} style={{ color: config.color, flexShrink: 0, marginTop: '2px' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {title}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {message}
        </div>
      </div>
      <button
        onClick={() => { setExiting(true); setTimeout(() => onDismiss(id), 300); }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'var(--muted)', flexShrink: 0 }}
      >
        <X size={14} />
      </button>
    </div>
  );
}
