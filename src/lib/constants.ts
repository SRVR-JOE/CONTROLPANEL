/**
 * Shared visual constants for the AV Rack Control Panel.
 *
 * This is the single source of truth for manufacturer and status color
 * mappings. All components must import from here rather than defining
 * their own local copies.
 *
 * Canonical values sourced from RackUnit.tsx (most widely imported file).
 */

import type { DeviceManufacturer, DeviceStatus } from '@/types';

/**
 * Brand accent colors for each device manufacturer.
 * Used for color-coded rack slots, device cards, and dashboard highlights.
 */
export const MANUFACTURER_COLORS: Record<DeviceManufacturer, string> = {
  disguise: '#e91e63',
  barco: '#00bcd4',
  brompton: '#4caf50',
  lightware: '#ff9800',
  aja: '#ffc107',
  blackmagic: '#607d8b',
  ross: '#9c27b0',
};

/**
 * Status indicator colors for device operational states.
 * Matches Tailwind bg-success / bg-warning / bg-error / bg-muted where used
 * as inline hex values.
 */
export const STATUS_COLORS: Record<DeviceStatus, string> = {
  online: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  offline: '#6b7280',
};
