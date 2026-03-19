/**
 * Shared visual constants for Virtual Rack.
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
  brainstorm: '#00ACC1',
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

/**
 * Severity level colors for system events and notifications.
 * Used across UI components, email, Slack, and Discord notification channels.
 * Discord requires integer colors — see channels/discord.ts for the conversion.
 */
export const SEVERITY_COLORS: Record<string, string> = {
  info: '#3b82f6',
  warning: '#f59e0b',
  error: '#ef4444',
  critical: '#dc2626',
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
  'timecode-analyzer': 'Timecode Analyzer',
  'master-clock': 'Master Clock',
};

// --- Naming Ideology ---

import type { LocationType, NamingTemplate } from '@/types';

export const LOCATION_TYPE_CONFIG: Record<LocationType, { label: string; color: string; icon: string }> = {
  truss: { label: 'Truss', color: '#f59e0b', icon: 'truss' },
  rack: { label: 'Rack', color: '#3b82f6', icon: 'rack' },
  floor: { label: 'Floor', color: '#22c55e', icon: 'floor' },
};

export const NAMING_PRESETS: Omit<NamingTemplate, 'createdAt' | 'updatedAt'>[] = [
  { id: 'preset-foh-rack', name: 'FOH Rack', locationType: 'rack', pattern: 'FOH-{type}-{number}', variables: { type: 'RACK', number: '01' }, isBuiltIn: true },
  { id: 'preset-stage-floor', name: 'Stage Floor', locationType: 'floor', pattern: 'STAGE-{zone}-{number}', variables: { zone: 'A', number: '01' }, isBuiltIn: true },
  { id: 'preset-broadcast', name: 'Broadcast', locationType: 'rack', pattern: 'BX-{type}-{number}', variables: { type: 'RACK', number: '01' }, isBuiltIn: true },
  { id: 'preset-truss-ds', name: 'Truss DS', locationType: 'truss', pattern: 'TRUSS-DS-{number}', variables: { number: '01' }, isBuiltIn: true },
  { id: 'preset-truss-us', name: 'Truss US', locationType: 'truss', pattern: 'TRUSS-US-{number}', variables: { number: '01' }, isBuiltIn: true },
  { id: 'preset-truss-sl', name: 'Truss SL', locationType: 'truss', pattern: 'TRUSS-SL-{number}', variables: { number: '01' }, isBuiltIn: true },
  { id: 'preset-truss-sr', name: 'Truss SR', locationType: 'truss', pattern: 'TRUSS-SR-{number}', variables: { number: '01' }, isBuiltIn: true },
  { id: 'preset-pit-floor', name: 'Pit Floor', locationType: 'floor', pattern: 'PIT-FL-{number}', variables: { number: '01' }, isBuiltIn: true },
  { id: 'preset-delay-truss', name: 'Delay Truss', locationType: 'truss', pattern: 'DLY-{zone}-{number}', variables: { zone: 'A', number: '01' }, isBuiltIn: true },
  { id: 'preset-dimmers-sr', name: 'Dimmers SR', locationType: 'rack', pattern: 'DIM-SR-{number}', variables: { number: '01' }, isBuiltIn: true },
  { id: 'preset-dimmers-sl', name: 'Dimmers SL', locationType: 'rack', pattern: 'DIM-SL-{number}', variables: { number: '01' }, isBuiltIn: true },
  { id: 'preset-thrust', name: 'Thrust', locationType: 'floor', pattern: 'THRUST-{number}', variables: { number: '01' }, isBuiltIn: true },
  { id: 'preset-tower', name: 'Tower', locationType: 'truss', pattern: 'TOWER-{number}', variables: { number: '01' }, isBuiltIn: true },
];

export const ALL_MANUFACTURERS: DeviceManufacturer[] = [
  'disguise', 'barco', 'brompton', 'lightware', 'aja', 'blackmagic', 'ross',
  'novastar', 'panasonic', 'sony', 'christie', 'epson', 'shure', 'qsc',
  'audinate', 'luminex', 'crestron', 'extron', 'netgear', 'avitech', 'adder',
  'sonifex', 'eaton', 'toshiba', 'gude', 'raritan', 'apc', 'cyberpower',
  'brainstorm',
];

export const ALL_CATEGORIES: DeviceCategory[] = [
  'media-server', 'led-processor', 'matrix-switcher', 'video-processor',
  'converter', 'production-switcher', 'ptz-camera', 'camera-controller',
  'projector', 'wireless-microphone', 'audio-dsp', 'audio-interface',
  'amplifier', 'network-switch', 'control-processor', 'streaming-processor',
  'recorder', 'fiber-extender', 'encoder-decoder', 'graphics-processor',
  'ups', 'pdu', 'kvm-switch', 'kvm-extender', 'multiviewer', 'opengear-frame',
  'audio-monitor', 'timecode-analyzer', 'master-clock',
];
