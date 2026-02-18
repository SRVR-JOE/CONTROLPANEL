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
  | 'ross';

export type DeviceCategory =
  | 'media-server'
  | 'led-processor'
  | 'matrix-switcher'
  | 'video-processor'
  | 'converter'
  | 'production-switcher';

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
  temperature?: number; // Celsius
  cpuUsage?: number; // percent
  memoryUsage?: number; // percent
  gpuUsage?: number; // percent
  gpuTemp?: number;
  fanSpeed?: number; // RPM
  powerDraw?: number; // Watts
  uptime?: number; // seconds
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
  lastPolledAt?: string;
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

export type MatrixManufacturer = 'aja' | 'lightware' | 'blackmagic';

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

// --- Disguise Server Configuration ---

export type DisguiseModel = 'GX 3' | 'GX 3c' | 'VX 4' | 'VX 4+' | 'VX 2' | 'VX 2+' | 'EX 3' | 'EX 2' | 'EX 2C' | 'Custom';

export type D3NetRole = 'director' | 'actor' | 'understudy';

export type NetworkAdapterRole = 'd3net' | 'media' | 'artnet-sacn' | 'kvm' | 'control' | 'mgmt';

export type PowerPlan = 'balanced' | 'high-performance' | 'ultimate-performance';

export type SMBVersion = 'SMBv1' | 'SMBv2' | 'SMBv3';

export type WindowsUpdatePolicy = 'enabled' | 'paused' | 'disabled';

export type D3ServiceStartup = 'auto' | 'manual' | 'disabled';

export type CodecPreference = 'hap-hapq' | 'notch' | 'photo-jpeg' | 'h264-h265';

export type ActorGUIMode = 'disabled' | 'minimal' | 'full';

export type LinkSpeed = 'auto' | '100Mbps' | '1GbE' | '2.5GbE' | '5GbE' | '10GbE' | '25GbE' | '40GbE' | '100GbE';

export interface NetworkAdapterConfig {
  id: string;
  role: NetworkAdapterRole;
  adapterName: string;
  enabled: boolean;
  dhcp: boolean;
  ipAddress: string;
  subnetMask: string;
  gateway: string;
  dnsPrimary: string;
  dnsSecondary: string;
  vlanId: number;
  linkSpeed: LinkSpeed;
  mtu: number;
}

export interface MachineIdentity {
  hostname: string;
  role: D3NetRole;
  actorIndex: number;
  understudyFor: string;
  workgroup: string;
  description: string;
}

export interface SMBSettings {
  enabled: boolean;
  sharePath: string;
  shareName: string;
  networkDiscovery: boolean;
  passwordProtected: boolean;
  guestAccess: boolean;
  smbVersion: SMBVersion;
  allowInsecureGuest: boolean;
}

export interface WindowsSettings {
  powerPlan: PowerPlan;
  sleepWhenPlugged: boolean;
  hibernate: boolean;
  windowsFirewall: boolean;
  remoteDesktop: boolean;
  windowsUpdate: WindowsUpdatePolicy;
  antivirus: boolean;
  visualEffectsPerformance: boolean;
  usbSelectiveSuspend: boolean;
}

export interface D3ServiceSettings {
  startup: D3ServiceStartup;
  apiPort: number;
  designerVersion: string;
  d3netAdapter: string;
  genlock: boolean;
  syncPort: number;
  vsyncPort: number;
}

export interface PerformanceTweaks {
  gpuDriverLock: boolean;
  gpuDriverVersion: string;
  codecPreference: CodecPreference;
  guiOnActor: ActorGUIMode;
  ndiTools5Installed: boolean;
}

export interface DisguiseProfile {
  id: string;
  name: string;
  machineIdentity: MachineIdentity;
  networkAdapters: NetworkAdapterConfig[];
  smbSettings: SMBSettings;
  windowsSettings: WindowsSettings;
  d3ServiceSettings: D3ServiceSettings;
  performanceTweaks: PerformanceTweaks;
  createdAt: string;
  updatedAt: string;
}

export interface SessionMachine {
  id: string;
  name: string;
  model: DisguiseModel;
  role: D3NetRole;
  index: number;
  understudyFor: string;
  deviceId?: string;
  activeProfileId: string;
  status: 'online' | 'offline' | 'standby' | 'warning';
}

export interface DisguiseSession {
  id: string;
  name: string;
  workgroup: string;
  designerVersion: string;
  machines: SessionMachine[];
  profiles: DisguiseProfile[];
  createdAt: string;
  updatedAt: string;
}

// --- Network Deployment ---

export type DeploymentStatus = 'idle' | 'deploying' | 'success' | 'failed' | 'partial';

export interface MachineDeploymentState {
  machineId: string;
  status: DeploymentStatus;
  progress: number; // 0-100
  message: string;
  lastDeployedAt?: string;
  error?: string;
}

export interface DeploymentJob {
  id: string;
  sessionId: string;
  machineIds: string[];
  status: DeploymentStatus;
  machineStates: MachineDeploymentState[];
  startedAt: string;
  completedAt?: string;
  sections: DeploymentSection[];
}

export type DeploymentSection =
  | 'machineIdentity'
  | 'networkAdapters'
  | 'smbSettings'
  | 'windowsSettings'
  | 'd3ServiceSettings'
  | 'performanceTweaks';

// --- Network Discovery ---

export interface DiscoveredMachine {
  ip: string;
  hostname: string;
  model: DisguiseModel;
  role: D3NetRole;
  designerVersion: string;
  apiPort: number;
  workgroup: string;
  uptime: number; // seconds
  d3ServiceRunning: boolean;
  gpuName?: string;
  currentProject?: string;
  discoveredAt: string;
}

export type DiscoveryStatus = 'idle' | 'scanning' | 'done' | 'error';

export interface DiscoveryScan {
  id: string;
  subnet: string;
  rangeStart: number;
  rangeEnd: number;
  port: number;
  status: DiscoveryStatus;
  progress: number; // 0-100
  found: DiscoveredMachine[];
  scannedCount: number;
  totalCount: number;
  startedAt: string;
  completedAt?: string;
  error?: string;
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
