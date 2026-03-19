'use client';

import type { LocationType } from '@/types';
import { LOCATION_TYPE_CONFIG } from '@/lib/constants';

interface LocationTypeBadgeProps {
  type: LocationType;
  size?: 'sm' | 'md';
}

export default function LocationTypeBadge({ type, size = 'sm' }: LocationTypeBadgeProps) {
  const config = LOCATION_TYPE_CONFIG[type];

  const px = size === 'sm' ? '6px' : '8px';
  const py = size === 'sm' ? '1px' : '2px';
  const fontSize = size === 'sm' ? '9px' : '10px';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize,
        fontFamily: 'var(--font-mono, monospace)',
        fontWeight: 600,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        color: config.color,
        background: `${config.color}18`,
        padding: `${py} ${px}`,
        borderRadius: '4px',
        border: `1px solid ${config.color}30`,
        lineHeight: 1.2,
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '2px',
          background: config.color,
          flexShrink: 0,
        }}
      />
      {config.label}
    </span>
  );
}
