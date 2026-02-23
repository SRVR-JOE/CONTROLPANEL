/**
 * Unit tests for the canPlace() and getValidDropRUs() placement utilities.
 *
 * canPlace() is the pure validation function that determines whether a device
 * of N rack-units can be dropped starting at a given RU in a given column.
 *
 * These tests exercise the function in complete isolation — no React, no store,
 * no DnD context. Only plain objects that match the Rack / Slot type shapes.
 */

import { describe, it, expect } from 'vitest';
import { canPlace, getValidDropRUs } from '../placement';
import type { Rack, Device } from '@/types';

// ============================================================
// Test data builders
// ============================================================

/** Create a Rack with `totalRU` empty slots in a single column (width: 1). */
function makeEmptyRack(totalRU: number, width: 1 | 2 | 3 = 1): Rack {
  const slots: Rack['slots'] = [];
  for (let col = 0; col < width; col++) {
    for (let ru = 1; ru <= totalRU; ru++) {
      slots.push({ ru, column: col });
    }
  }
  return {
    id: 'test-rack',
    name: 'Test Rack',
    location: 'Stage',
    width,
    totalRU,
    slots,
  };
}

/**
 * Fill slots in `rack` with the given `deviceId` from `startRU` to
 * `startRU + count - 1` (in column 0) — mutates and returns the rack.
 */
function occupySlots(rack: Rack, startRU: number, count: number, deviceId: string, column = 0): Rack {
  const updated = {
    ...rack,
    slots: rack.slots.map((s) => {
      if (s.column === column && s.ru >= startRU && s.ru < startRU + count) {
        return { ...s, deviceId };
      }
      return s;
    }),
  };
  return updated;
}

/** A minimal Device shape for getValidDropRUs tests. */
function makeDevice(rackUnits: number, id = 'device-x'): Device {
  return {
    id,
    name: 'Test',
    manufacturer: 'blackmagic',
    model: 'Test',
    category: 'converter',
    status: 'online',
    rackUnits,
    ports: [],
    health: { temperature: 30 },
  };
}

// ============================================================
// canPlace — empty rack (all slots available)
// ============================================================

describe('canPlace — empty rack', () => {
  it('returns true when a 1U device targets an empty slot', () => {
    const rack = makeEmptyRack(10);
    expect(canPlace(rack, 1, 5, 0, 'dev-a')).toBe(true);
  });

  it('returns true for a 4U device at slot 1 in a 10U rack', () => {
    const rack = makeEmptyRack(10);
    expect(canPlace(rack, 4, 1, 0, 'dev-a')).toBe(true);
  });

  it('returns true for a 4U device at slot 7 (last valid start) in a 10U rack', () => {
    const rack = makeEmptyRack(10);
    expect(canPlace(rack, 4, 7, 0, 'dev-a')).toBe(true);
  });

  it('returns true for a 1U device at the last RU', () => {
    const rack = makeEmptyRack(10);
    expect(canPlace(rack, 1, 10, 0, 'dev-a')).toBe(true);
  });
});

// ============================================================
// canPlace — slot occupied by another device
// ============================================================

describe('canPlace — occupied slots (another device)', () => {
  it('returns false when the target slot is occupied by a different device', () => {
    let rack = makeEmptyRack(10);
    rack = occupySlots(rack, 3, 1, 'blocker');
    expect(canPlace(rack, 1, 3, 0, 'dev-a')).toBe(false);
  });

  it('returns false when any slot in a multi-RU span is occupied by a different device', () => {
    let rack = makeEmptyRack(10);
    rack = occupySlots(rack, 5, 1, 'blocker'); // blocks slot 5
    // 4U device starting at slot 3 would span 3,4,5,6 — blocked by slot 5
    expect(canPlace(rack, 4, 3, 0, 'dev-a')).toBe(false);
  });

  it('returns false when the first slot is free but later slots in the span are occupied', () => {
    let rack = makeEmptyRack(10);
    rack = occupySlots(rack, 4, 3, 'blocker'); // slots 4,5,6 occupied
    // 4U device at slot 3 spans 3,4,5,6 — first slot free but rest blocked
    expect(canPlace(rack, 4, 3, 0, 'dev-a')).toBe(false);
  });
});

// ============================================================
// canPlace — extends beyond rack capacity
// ============================================================

describe('canPlace — beyond rack totalRU', () => {
  it('returns false when the device would extend past the last RU', () => {
    const rack = makeEmptyRack(10);
    // 4U device starting at slot 8 would occupy 8,9,10,11 — but rack only has 10 RU
    expect(canPlace(rack, 4, 8, 0, 'dev-a')).toBe(false);
  });

  it('returns false for a 1U device at RU 11 in a 10U rack', () => {
    const rack = makeEmptyRack(10);
    expect(canPlace(rack, 1, 11, 0, 'dev-a')).toBe(false);
  });

  it('returns false when startRU + deviceRU - 1 equals totalRU + 1 (off-by-one boundary)', () => {
    const rack = makeEmptyRack(5);
    // 2U device at slot 5: would need slots 5 and 6. Slot 6 > totalRU (5).
    expect(canPlace(rack, 2, 5, 0, 'dev-a')).toBe(false);
  });

  it('returns true for the last valid 2U position (slot 4 in a 5U rack)', () => {
    const rack = makeEmptyRack(5);
    expect(canPlace(rack, 2, 4, 0, 'dev-a')).toBe(true);
  });
});

// ============================================================
// canPlace — self-overlap (device at its own current position)
// ============================================================

describe('canPlace — self-overlap allowed', () => {
  it('returns true when a 1U device is dropped onto its own occupied slot', () => {
    let rack = makeEmptyRack(10);
    rack = occupySlots(rack, 3, 1, 'dev-a');
    // dev-a is already at slot 3 — dragging it back to slot 3 must be valid
    expect(canPlace(rack, 1, 3, 0, 'dev-a')).toBe(true);
  });

  it('returns true when a 4U device is dropped onto its own span', () => {
    let rack = makeEmptyRack(10);
    rack = occupySlots(rack, 2, 4, 'dev-a'); // slots 2,3,4,5
    expect(canPlace(rack, 4, 2, 0, 'dev-a')).toBe(true);
  });

  it('returns true when device partially overlaps its old position (shift by 1)', () => {
    let rack = makeEmptyRack(10);
    rack = occupySlots(rack, 2, 4, 'dev-a'); // slots 2,3,4,5
    // Shift down by 1: new span is 3,4,5,6. Slots 3,4,5 are self-occupied; slot 6 is free.
    expect(canPlace(rack, 4, 3, 0, 'dev-a')).toBe(true);
  });

  it('returns false when self-overlap AND another device blocks part of the new span', () => {
    let rack = makeEmptyRack(10);
    rack = occupySlots(rack, 2, 2, 'dev-a'); // slots 2,3
    rack = occupySlots(rack, 4, 1, 'blocker'); // slot 4
    // 4U span starting at 2 needs 2,3,4,5. Slot 4 is blocked by a different device.
    expect(canPlace(rack, 4, 2, 0, 'dev-a')).toBe(false);
  });
});

// ============================================================
// canPlace — multi-column rack
// ============================================================

describe('canPlace — multi-column rack', () => {
  it('validates in the correct column only', () => {
    let rack = makeEmptyRack(10, 2);
    rack = occupySlots(rack, 1, 1, 'blocker', 0); // col 0 slot 1 blocked
    // col 1 slot 1 should be free
    expect(canPlace(rack, 1, 1, 1, 'dev-a')).toBe(true);
    // col 0 slot 1 should be blocked
    expect(canPlace(rack, 1, 1, 0, 'dev-a')).toBe(false);
  });

  it('returns false for a slot index in a column that does not exist', () => {
    const rack = makeEmptyRack(10, 1); // single-wide rack
    // Column 1 doesn't exist — no slot found → false
    expect(canPlace(rack, 1, 1, 1, 'dev-a')).toBe(false);
  });
});

// ============================================================
// getValidDropRUs
// ============================================================

describe('getValidDropRUs', () => {
  it('returns all RUs for a 1U device in a fully empty rack', () => {
    const rack = makeEmptyRack(5);
    const device = makeDevice(1, 'dev-a');
    const valid = getValidDropRUs(rack, device, 0, 'dev-a');
    expect([...valid].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
  });

  it('returns only valid start spans for a 2U device in a 5U rack', () => {
    const rack = makeEmptyRack(5);
    const device = makeDevice(2, 'dev-a');
    const valid = getValidDropRUs(rack, device, 0, 'dev-a');
    // Valid start positions: 1,2,3,4 → spans (1,2),(2,3),(3,4),(4,5)
    // All RUs in those spans: 1,2,3,4,5
    expect([...valid].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
  });

  it('excludes RUs that would overlap an occupied slot', () => {
    let rack = makeEmptyRack(5);
    rack = occupySlots(rack, 3, 1, 'blocker'); // slot 3 blocked
    const device = makeDevice(2, 'dev-a');
    const valid = getValidDropRUs(rack, device, 0, 'dev-a');
    // 2U spans: (1,2) OK, (2,3) blocked (slot 3), (3,4) blocked (slot 3), (4,5) OK
    expect([...valid].sort((a, b) => a - b)).toEqual([1, 2, 4, 5]);
  });

  it('returns empty set when the device is larger than the rack', () => {
    const rack = makeEmptyRack(3);
    const device = makeDevice(5, 'dev-a');
    const valid = getValidDropRUs(rack, device, 0, 'dev-a');
    expect(valid.size).toBe(0);
  });

  it('includes self-occupied slots as valid (device can stay in place)', () => {
    let rack = makeEmptyRack(5);
    rack = occupySlots(rack, 2, 2, 'dev-a'); // slots 2,3 occupied by self
    const device = makeDevice(2, 'dev-a');
    const valid = getValidDropRUs(rack, device, 0, 'dev-a');
    // span (2,3) is self-overlap → valid
    expect(valid.has(2)).toBe(true);
    expect(valid.has(3)).toBe(true);
  });
});
