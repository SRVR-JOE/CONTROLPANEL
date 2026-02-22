/**
 * Shared visual constants for the AV Rack Control Panel.
 *
 * This is the single source of truth for manufacturer and status color
 * mappings. All components must import from here rather than defining
 * their own local copies.
 */

import type { DeviceManufacturer, DeviceStatus, DeviceCategory } from '@/types';

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
  novastar: '#f44336',
  panasonic: '#0068b5',
  sony: '#0066cc',
  christie: '#c62828',
  epson: '#003399',
  shure: '#1a237e',
  qsc: '#2e7d32',
  audinate: '#00838f',
  luminex: '#6a1b9a',
  crestron: '#263238',
  extron: '#1565c0',
  netgear: '#4a90d9',
  avitech: '#e65100',
  adder: '#00897b',
  sonifex: '#d32f2f',
  eaton: '#1b5e20',
  toshiba: '#e60012',
  gude: '#0277bd',
  raritan: '#6d4c41',
  apc: '#ff6f00',
  cyberpower: '#37474f',
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

export const CATEGORY_LABELS: Record<DeviceCategory, string> = {
  'media-server': 'Media Server',
  'led-processor': 'LED Processor',
  'matrix-switcher': 'Matrix Switcher',
  'video-processor': 'Video Processor',
  converter: 'Converter',
  'production-switcher': 'Production Switcher',
  'ptz-camera': 'PTZ Camera',
  'camera-controller': 'Camera Controller',
  projector: 'Projector',
  'wireless-microphone': 'Wireless Microphone',
  'audio-dsp': 'Audio DSP',
  'audio-interface': 'Audio Interface',
  amplifier: 'Amplifier',
  'network-switch': 'Network Switch',
  'control-processor': 'Control Processor',
  'streaming-processor': 'Streaming Processor',
  recorder: 'Recorder',
  'fiber-extender': 'Fiber Extender',
  'encoder-decoder': 'Encoder/Decoder',
  'graphics-processor': 'Graphics Processor',
  ups: 'UPS',
  pdu: 'PDU',
  'kvm-switch': 'KVM Switch',
  'kvm-extender': 'KVM Extender',
  multiviewer: 'Multiviewer',
  'opengear-frame': 'OpenGear Frame',
  'audio-monitor': 'Audio Monitor',
};

export const ALL_MANUFACTURERS: DeviceManufacturer[] = [
  'disguise', 'barco', 'brompton', 'lightware', 'aja', 'blackmagic', 'ross',
  'novastar', 'panasonic', 'sony', 'christie', 'epson', 'shure', 'qsc',
  'audinate', 'luminex', 'crestron', 'extron', 'netgear', 'avitech', 'adder',
  'sonifex', 'eaton', 'toshiba', 'gude', 'raritan', 'apc', 'cyberpower',
];

export const ALL_CATEGORIES: DeviceCategory[] = [
  'media-server', 'led-processor', 'matrix-switcher', 'video-processor',
  'converter', 'production-switcher', 'ptz-camera', 'camera-controller',
  'projector', 'wireless-microphone', 'audio-dsp', 'audio-interface',
  'amplifier', 'network-switch', 'control-processor', 'streaming-processor',
  'recorder', 'fiber-extender', 'encoder-decoder', 'graphics-processor',
  'ups', 'pdu', 'kvm-switch', 'kvm-extender', 'multiviewer', 'opengear-frame',
  'audio-monitor',
];
