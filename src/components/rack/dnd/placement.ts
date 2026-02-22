/**
 * Rack placement validation utilities.
 *
 * Extracted from InteractiveRackEditor so they can be unit-tested in isolation
 * without requiring React, DnD context, or a rendered component.
 */

import type { Rack, Device } from '@/types';

/**
 * Determines whether a device of `deviceRU` rack units can be placed starting
 * at `targetRU` in `targetColumn` of `rack`.
 *
 * Rules:
 *  - Every slot in the span [targetRU, targetRU + deviceRU) must exist in the rack.
 *  - Every slot in the span must either be empty OR already occupied by the device
 *    being dragged (self-overlap is allowed so a device can be "dropped" on its
 *    own current position).
 *  - The span must not extend beyond rack.totalRU.
 */
export function canPlace(
  rack: Rack,
  deviceRU: number,
  targetRU: number,
  targetColumn: number,
  draggedDeviceId: string
): boolean {
  for (let ru = targetRU; ru < targetRU + deviceRU; ru++) {
    if (ru > rack.totalRU) return false;
    const slot = rack.slots.find((s) => s.ru === ru && (s.column ?? 0) === targetColumn);
    if (!slot) return false;
    if (slot.deviceId && slot.deviceId !== draggedDeviceId) return false;
  }
  return true;
}

/**
 * Returns the set of RU numbers that are valid drop-target start positions for
 * `device` in `column` of `rack`.
 *
 * For multi-RU devices all RU numbers in a valid span are included in the
 * returned set (so the drag overlay can highlight the full span, not just the
 * topmost slot).
 */
export function getValidDropRUs(
  rack: Rack,
  device: Device,
  column: number,
  draggedDeviceId: string
): Set<number> {
  const valid = new Set<number>();
  for (let ru = 1; ru <= rack.totalRU - device.rackUnits + 1; ru++) {
    if (canPlace(rack, device.rackUnits, ru, column, draggedDeviceId)) {
      for (let r = ru; r < ru + device.rackUnits; r++) {
        valid.add(r);
      }
    }
  }
  return valid;
}
