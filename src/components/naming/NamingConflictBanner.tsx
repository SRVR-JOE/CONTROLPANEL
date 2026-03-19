'use client';

import { AlertTriangle } from 'lucide-react';
import type { NamingConflict } from '@/lib/naming-engine';

interface NamingConflictBannerProps {
  conflicts: NamingConflict[];
}

export default function NamingConflictBanner({ conflicts }: NamingConflictBannerProps) {
  if (conflicts.length === 0) return null;

  return (
    <div
      style={{
        background: 'rgba(239, 68, 68, 0.08)',
        border: '1px solid rgba(239, 68, 68, 0.25)',
        borderRadius: '8px',
        padding: '10px 14px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        <AlertTriangle style={{ width: '14px', height: '14px', color: '#ef4444', flexShrink: 0 }} />
        <span
          style={{
            fontSize: '11px',
            fontFamily: 'var(--font-mono, monospace)',
            fontWeight: 600,
            color: '#ef4444',
          }}
        >
          {conflicts.length} naming conflict{conflicts.length !== 1 ? 's' : ''} detected
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginLeft: '22px' }}>
        {conflicts.slice(0, 5).map((c, i) => (
          <span
            key={i}
            style={{
              fontSize: '10px',
              fontFamily: 'var(--font-mono, monospace)',
              color: '#b0b0c0',
            }}
          >
            &quot;{c.name}&quot; conflicts with existing device
          </span>
        ))}
        {conflicts.length > 5 && (
          <span
            style={{
              fontSize: '10px',
              fontFamily: 'var(--font-mono, monospace)',
              color: '#7a7a8e',
            }}
          >
            ...and {conflicts.length - 5} more
          </span>
        )}
      </div>
    </div>
  );
}
