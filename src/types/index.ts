// ============================================================
// AV Rack Control Panel - Core Type Definitions
// ============================================================

// --- Device Types ---

export type DeviceManufacturer =
  | 'disguise'
  | 'barco'
  | 'brompton'
  | 'lightware'
  | 'aja'
  | 'blackmagic'
  | 'ross'
  | 'yamaha'
  | 'allen-heath'
  | 'behringer'
  | 'shure'
  | 'sennheiser'
  | 'panasonic'
  | 'sony'
  | 'etc'
  | 'ma-lighting'
  | 'qsc'
  | 'clear-com'
  | 'riedel'
  | 'magewell'
  | 'teradek'
  | 'extron'
  | 'crestron'
  | 'ptzoptics'
  | 'datavideo'
  | 'roland';

export type DeviceCategory =
  | 'media-server'
  | 'led-processor'
  | 'matrix-switcher'
  | 'video-processor'
  | 'converter'
  | 'production-switcher'
  | 'audio-console'
  | 'audio-processor'
  | 'wireless-mic'
  | 'camera'
  | 'lighting-console'
  | 'show-control'
  | 'intercom'
  | 'encoder'
  | 'recorder';

export type DeviceStatus = 'online' | 'warning' | 'error' | 'offline';

export interface DevicePort {
  id: string;
  label: string;
  type: 'sdi' | 'hdmi' | 'displayport' | 'ndi' | 'dante' | 'fiber' | 'ethernet';
  direction: 'input' | 'output';
  connectedTo?: string; // port id
  signal?: boolean;
}

export interface DeviceHealth {
  temperature: number; // Celsius
  cpuUsage?: number; // percent
  memoryUsage?: number; // percent
  gpuUsage?: number; // percent
  gpuTemp?: number;
  fanSpeed?: number; // RPM
  powerDraw?: number; // Watts
  uptime: number; // seconds
  errors: string[];
  warnings: string[];
}

export interface Device {
  id: string;
  name: string;
  manufacturer: DeviceManufacturer;
  model: string;
  category: DeviceCategory;
  status: DeviceStatus;
  ipAddress: string;
  rackId?: string;
  rackSlot?: number; // starting RU
  rackUnits: number; // how many RU this device takes
  ports: DevicePort[];
  health: DeviceHealth;
  firmware?: string;
  serialNumber?: string;
  companionModuleIds?: string[]; // Companion module IDs this device supports
}

// --- Brompton-specific ---

export interface BromptonProcessorStatus {
  deviceId: string;
  panelType: string;
  totalPanels: number;
  onlinePanels: number;
  brightness: number; // percent
  colorTemp: number; // Kelvin
  inputSource: string;
  inputResolution: string;
  inputFrameRate: number;
  linkStatus: 'active' | 'degraded' | 'lost';
  darkMagicEnabled: boolean;
  dynastaTuneEnabled: boolean;
  pureToneEnabled: boolean;
  outputColorSpace: string;
  panelTemperatures: number[];
  chainLengths: number[];
}

// --- Rack Types ---

export type RackWidth = 1 | 2 | 3;

export interface RackSlot {
  ru: number; // 1-26
  deviceId?: string;
}

export interface Rack {
  id: string;
  name: string;
  location: string;
  width: RackWidth;
  totalRU: 26;
  slots: RackSlot[];
  ambientTemp?: number;
  inletTemp?: number;
  exhaustTemp?: number;
}

// --- Matrix Routing ---

export type MatrixManufacturer = 'aja' | 'lightware' | 'blackmagic' | 'ross' | 'extron';

export interface MatrixInput {
  id: string;
  index: number;
  label: string;
  signal: boolean;
  format?: string;
}

export interface MatrixOutput {
  id: string;
  index: number;
  label: string;
  routedFrom?: number; // input index
}

export interface MatrixRouter {
  id: string;
  name: string;
  manufacturer: MatrixManufacturer;
  model: string;
  deviceId: string; // references a Device
  inputs: MatrixInput[];
  outputs: MatrixOutput[];
  size: string; // e.g. "32x32"
}

// --- Pin Board ---

export interface PinBoardItem {
  id: string;
  deviceId: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  showHealth: boolean;
  showTemperature: boolean;
  showPorts: boolean;
  label?: string;
}

export interface PinBoard {
  id: string;
  name: string;
  items: PinBoardItem[];
}

// --- Presets ---

export interface MatrixPreset {
  id: string;
  name: string;
  description: string;
  routerId: string;
  routes: { input: number; output: number }[];
  createdAt: string;
}

export interface SystemPreset {
  id: string;
  name: string;
  description: string;
  matrixPresets: string[]; // preset ids
  deviceSettings: {
    deviceId: string;
    settings: Record<string, unknown>;
  }[];
  createdAt: string;
}

// --- Timecode ---

export type TimecodeFrameRate = 23.976 | 24 | 25 | 29.97 | 30 | 48 | 50 | 59.94 | 60;

export type TimecodeFormat = 'SMPTE' | 'EBU' | 'MIDI';

export type TimecodeOutputType = 'ltc' | 'mtc' | 'artnet' | 'sacn';

export interface TimecodeState {
  hours: number;
  minutes: number;
  seconds: number;
  frames: number;
}

export type AudioOutputType = 'soundcard' | 'dante';

export interface AudioOutput {
  id: string;
  name: string;
  type: AudioOutputType;
  channels: number;
  sampleRate: number; // 44100, 48000, 96000
  active: boolean;
  danteDeviceName?: string; // for Dante outputs
  danteChannel?: number;
  latencyMs?: number;
}

export interface TimecodeGenerator {
  id: string;
  name: string;
  running: boolean;
  timecode: TimecodeState;
  frameRate: TimecodeFrameRate;
  format: TimecodeFormat;
  dropFrame: boolean;
  outputType: TimecodeOutputType;
  audioOutputId: string | null; // which audio output to route LTC to
  offset: TimecodeState; // offset from master
  jamSynced: boolean;
  jamSyncSource?: string;
  freeRunning: boolean;
  createdAt: string;
}

// --- Bitfocus Companion Integration ---

export type CompanionConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export type CompanionProtocol = 'http' | 'tcp' | 'osc' | 'websocket';

export interface CompanionConnection {
  id: string;
  name: string;
  host: string;
  port: number; // default 8000 for HTTP
  protocol: CompanionProtocol;
  status: CompanionConnectionStatus;
  version?: string;
  lastSeen?: string;
}

export interface CompanionModuleAction {
  id: string;
  name: string;
  description?: string;
  options: {
    id: string;
    type: 'textinput' | 'number' | 'dropdown' | 'checkbox';
    label: string;
    default?: string | number | boolean;
    choices?: { id: string; label: string }[];
  }[];
}

export interface CompanionModuleFeedback {
  id: string;
  name: string;
  description?: string;
  type: 'boolean' | 'advanced';
}

export interface CompanionModuleVariable {
  id: string;
  name: string;
  value?: string;
}

export interface CompanionModule {
  id: string;
  moduleId: string; // e.g. 'bmd-videohub', 'disguise-osc'
  name: string;
  manufacturer: DeviceManufacturer;
  protocol: string; // e.g. 'TCP port 9990', 'HTTP REST', 'OSC/UDP'
  defaultPort?: number;
  description: string;
  actions: CompanionModuleAction[];
  feedbacks: CompanionModuleFeedback[];
  variables: CompanionModuleVariable[];
  supportedModels: string[];
}

export interface CompanionModuleInstance {
  id: string;
  moduleId: string; // references CompanionModule.moduleId
  connectionId: string; // references CompanionConnection.id
  deviceId?: string; // optional link to a Device
  label: string;
  enabled: boolean;
  status: 'ok' | 'warning' | 'error' | 'disabled';
  config: Record<string, string | number | boolean>;
  variableValues: Record<string, string>;
}

// --- Commands ---

export interface DeviceCommand {
  id: string;
  deviceId: string;
  command: string;
  params?: Record<string, unknown>;
  sentAt: string;
  response?: string;
  status: 'pending' | 'sent' | 'success' | 'error';
}
