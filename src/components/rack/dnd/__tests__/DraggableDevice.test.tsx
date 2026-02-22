/**
 * Render tests for the DraggableDevice component.
 *
 * DraggableDevice uses @dnd-kit/core's useDraggable hook which requires a
 * DndContext ancestor and browser pointer events. We mock useDraggable so the
 * component renders as a plain div — letting us assert on text, colours, and
 * conditional UI without any DnD infrastructure.
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { Device } from '@/types';
import { MANUFACTURER_COLORS } from '@/lib/constants';

// ============================================================
// Mock @dnd-kit/core — useDraggable hook
// ============================================================

vi.mock('@dnd-kit/core', () => ({
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: () => {},
    transform: null,
    isDragging: false,
  }),
  DndContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DragOverlay: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  PointerSensor: class {},
  useSensor: () => ({}),
  useSensors: (...args: unknown[]) => args,
}));

// Mock CSS.Translate.toString used in the component
vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Translate: { toString: () => '' },
  },
}));

// ============================================================
// Mock RackUnit import (RU_HEIGHT constant)
// ============================================================

vi.mock('@/components/rack/RackUnit', () => ({
  RU_HEIGHT: 20,
}));

// ============================================================
// Helpers
// ============================================================

/**
 * Convert a CSS hex color string (e.g. "#e91e63") to the rgb() form that
 * jsdom renders in computed styles (e.g. "rgb(233, 30, 99)").
 * This allows querySelector on style attributes to work reliably.
 */
function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Returns true if any element in the container has a style attribute that
 * contains the color (hex or rgb form).
 */
function containerHasColor(container: HTMLElement, hexColor: string): boolean {
  const rgb = hexToRgb(hexColor);
  return (
    container.innerHTML.includes(hexColor) ||
    container.innerHTML.includes(rgb)
  );
}

function makeDevice(overrides: Partial<Device> = {}): Device {
  return {
    id: 'dev-test',
    name: 'Disguise GX3',
    manufacturer: 'disguise',
    model: 'gx3',
    category: 'media-server',
    status: 'online',
    rackUnits: 1,
    ports: [],
    health: { temperature: 40 },
    ...overrides,
  };
}

// ============================================================
// Import component after mocks are defined
// ============================================================

import DraggableDevice from '../DraggableDevice';

// ============================================================
// Tests — tray variant (inRack = false, default)
// ============================================================

describe('DraggableDevice — tray (inRack=false)', () => {
  it('renders the device name', () => {
    render(<DraggableDevice device={makeDevice({ name: 'My Media Server' })} />);
    expect(screen.getByText('My Media Server')).toBeInTheDocument();
  });

  it('renders the rack-unit size badge (e.g. "1U")', () => {
    render(<DraggableDevice device={makeDevice({ rackUnits: 1 })} />);
    expect(screen.getByText('1U')).toBeInTheDocument();
  });

  it('renders the correct RU count in the badge for a 4U device', () => {
    render(<DraggableDevice device={makeDevice({ rackUnits: 4 })} />);
    expect(screen.getByText('4U')).toBeInTheDocument();
  });

  it('applies the disguise manufacturer color somewhere in the rendered output', () => {
    const device = makeDevice({ manufacturer: 'disguise', rackUnits: 1 });
    const { container } = render(<DraggableDevice device={device} />);
    const expectedColor = MANUFACTURER_COLORS['disguise'];
    // jsdom renders hex colors as rgb() in border/background style properties
    expect(containerHasColor(container, expectedColor)).toBe(true);
  });

  it('applies the brompton manufacturer color in the rendered output', () => {
    const device = makeDevice({ manufacturer: 'brompton', rackUnits: 1 });
    const { container } = render(<DraggableDevice device={device} />);
    const expectedColor = MANUFACTURER_COLORS['brompton'];
    expect(containerHasColor(container, expectedColor)).toBe(true);
  });

  it('uses a different color for disguise vs brompton', () => {
    const { container: containerA } = render(
      <DraggableDevice device={makeDevice({ manufacturer: 'disguise' })} />
    );
    const { container: containerB } = render(
      <DraggableDevice device={makeDevice({ manufacturer: 'brompton' })} />
    );
    // The disguise color should not appear in brompton's output
    const disguiseColor = MANUFACTURER_COLORS['disguise'];
    expect(containerHasColor(containerB, disguiseColor)).toBe(false);
  });
});

// ============================================================
// Tests — rack variant (inRack = true)
// ============================================================

describe('DraggableDevice — rack variant (inRack=true)', () => {
  it('renders the device name in rack mode', () => {
    render(
      <DraggableDevice
        device={makeDevice({ name: 'Brompton SX40' })}
        inRack
        ru={3}
        spanHeight={80}
      />
    );
    expect(screen.getByText('Brompton SX40')).toBeInTheDocument();
  });

  it('renders the RU range badge for a multi-RU device in rack mode', () => {
    // A 4U device at ru=1 should show "1", "-", and "4" in the RU label area
    render(
      <DraggableDevice
        device={makeDevice({ rackUnits: 4 })}
        inRack
        ru={1}
        spanHeight={80}
      />
    );
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('renders the RU size badge for multi-RU device in rack mode (e.g. "4U")', () => {
    render(
      <DraggableDevice
        device={makeDevice({ rackUnits: 4 })}
        inRack
        ru={2}
        spanHeight={80}
      />
    );
    expect(screen.getByText('4U')).toBeInTheDocument();
  });

  it('does NOT render a RU size badge for a 1U device in rack mode', () => {
    render(
      <DraggableDevice
        device={makeDevice({ rackUnits: 1 })}
        inRack
        ru={5}
        spanHeight={20}
      />
    );
    // Single-RU devices don't show the "1U" badge in rack mode
    expect(screen.queryByText('1U')).toBeNull();
  });

  it('applies barco manufacturer color in rack mode', () => {
    const device = makeDevice({ manufacturer: 'barco', rackUnits: 1 });
    const { container } = render(<DraggableDevice device={device} inRack ru={1} spanHeight={20} />);
    const expectedColor = MANUFACTURER_COLORS['barco'];
    expect(containerHasColor(container, expectedColor)).toBe(true);
  });
});

// ============================================================
// Tests — tray vs rack render difference
// ============================================================

describe('DraggableDevice — inRack vs tray structural differences', () => {
  it('tray variant shows the RU badge regardless of rackUnits count', () => {
    // Tray always shows the RU count badge
    render(<DraggableDevice device={makeDevice({ rackUnits: 2 })} inRack={false} />);
    expect(screen.getByText('2U')).toBeInTheDocument();
  });

  it('rack variant shows RU badge only for multi-RU devices', () => {
    const { rerender } = render(
      <DraggableDevice device={makeDevice({ rackUnits: 1 })} inRack ru={1} spanHeight={20} />
    );
    // 1U in rack — no badge
    expect(screen.queryByText('1U')).toBeNull();

    rerender(
      <DraggableDevice device={makeDevice({ rackUnits: 3 })} inRack ru={1} spanHeight={60} />
    );
    // 3U in rack — badge present
    expect(screen.getByText('3U')).toBeInTheDocument();
  });
});
