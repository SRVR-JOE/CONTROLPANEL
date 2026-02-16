import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  Device,
  Rack,
  MatrixRouter,
  PinBoard,
  PinBoardItem,
  MatrixPreset,
  SystemPreset,
  DeviceCommand,
  BromptonProcessorStatus,
  DeviceStatus,
  DisguiseSession,
  DisguiseProfile,
  SessionMachine,
  NetworkAdapterConfig,
  NetworkAdapterRole,
} from '@/types';

// ============================================================
// Mock data generators
// ============================================================

function createMockHealth(manufacturer: string) {
  const base = {
    temperature: 35 + Math.random() * 25,
    cpuUsage: 10 + Math.random() * 60,
    memoryUsage: 20 + Math.random() * 50,
    fanSpeed: 1200 + Math.random() * 2000,
    powerDraw: 80 + Math.random() * 400,
    uptime: Math.floor(Math.random() * 864000),
    errors: [] as string[],
    warnings: [] as string[],
  };
  if (manufacturer === 'disguise' || manufacturer === 'barco') {
    return { ...base, gpuUsage: 15 + Math.random() * 70, gpuTemp: 40 + Math.random() * 30 };
  }
  return base;
}

function createSDIPorts(inputs: number, outputs: number): Device['ports'] {
  const ports: Device['ports'] = [];
  for (let i = 1; i <= inputs; i++) {
    ports.push({ id: uuidv4(), label: `SDI In ${i}`, type: 'sdi', direction: 'input', signal: Math.random() > 0.3 });
  }
  for (let i = 1; i <= outputs; i++) {
    ports.push({ id: uuidv4(), label: `SDI Out ${i}`, type: 'sdi', direction: 'output', signal: Math.random() > 0.2 });
  }
  return ports;
}

// ============================================================
// Initial devices
// ============================================================

const initialDevices: Device[] = [
  {
    id: 'dev-disguise-1',
    name: 'Disguise GX3',
    manufacturer: 'disguise',
    model: 'gx3',
    category: 'media-server',
    status: 'online',
    ipAddress: '10.0.1.10',
    rackId: 'rack-1',
    rackSlot: 1,
    rackUnits: 4,
    ports: [
      ...createSDIPorts(0, 4),
      { id: uuidv4(), label: 'DP Out 1', type: 'displayport', direction: 'output', signal: true },
      { id: uuidv4(), label: 'DP Out 2', type: 'displayport', direction: 'output', signal: true },
      { id: uuidv4(), label: 'Ethernet', type: 'ethernet', direction: 'input', signal: true },
    ],
    health: { ...createMockHealth('disguise'), temperature: 42, cpuUsage: 55, gpuUsage: 72, gpuTemp: 68 },
    firmware: '22.3.2',
    serialNumber: 'DGX3-2024-0042',
  },
  {
    id: 'dev-disguise-2',
    name: 'Disguise GX3 #2',
    manufacturer: 'disguise',
    model: 'gx3',
    category: 'media-server',
    status: 'online',
    ipAddress: '10.0.1.11',
    rackId: 'rack-1',
    rackSlot: 5,
    rackUnits: 4,
    ports: [
      ...createSDIPorts(0, 4),
      { id: uuidv4(), label: 'DP Out 1', type: 'displayport', direction: 'output', signal: true },
      { id: uuidv4(), label: 'Ethernet', type: 'ethernet', direction: 'input', signal: true },
    ],
    health: { ...createMockHealth('disguise'), temperature: 44, cpuUsage: 48, gpuUsage: 65, gpuTemp: 62 },
    firmware: '22.3.2',
    serialNumber: 'DGX3-2024-0043',
  },
  {
    id: 'dev-barco-1',
    name: 'Barco E2',
    manufacturer: 'barco',
    model: 'E2',
    category: 'video-processor',
    status: 'online',
    ipAddress: '10.0.1.20',
    rackId: 'rack-1',
    rackSlot: 9,
    rackUnits: 4,
    ports: createSDIPorts(8, 8),
    health: { ...createMockHealth('barco'), temperature: 38 },
    firmware: '7.2.1',
    serialNumber: 'BAR-E2-2024-105',
  },
  {
    id: 'dev-brompton-1',
    name: 'Brompton Tessera SX40',
    manufacturer: 'brompton',
    model: 'Tessera SX40',
    category: 'led-processor',
    status: 'online',
    ipAddress: '10.0.1.30',
    rackId: 'rack-2',
    rackSlot: 1,
    rackUnits: 1,
    ports: [
      { id: uuidv4(), label: 'SDI In 1', type: 'sdi', direction: 'input', signal: true },
      { id: uuidv4(), label: 'HDMI In 1', type: 'hdmi', direction: 'input', signal: false },
      { id: uuidv4(), label: 'Ethernet 1', type: 'ethernet', direction: 'output', signal: true },
      { id: uuidv4(), label: 'Ethernet 2', type: 'ethernet', direction: 'output', signal: true },
    ],
    health: { ...createMockHealth('brompton'), temperature: 36, powerDraw: 65 },
    firmware: '3.4.0',
    serialNumber: 'BRP-SX40-2024-221',
  },
  {
    id: 'dev-brompton-2',
    name: 'Brompton Tessera SX40 #2',
    manufacturer: 'brompton',
    model: 'Tessera SX40',
    category: 'led-processor',
    status: 'warning',
    ipAddress: '10.0.1.31',
    rackId: 'rack-2',
    rackSlot: 2,
    rackUnits: 1,
    ports: [
      { id: uuidv4(), label: 'SDI In 1', type: 'sdi', direction: 'input', signal: true },
      { id: uuidv4(), label: 'Ethernet 1', type: 'ethernet', direction: 'output', signal: true },
      { id: uuidv4(), label: 'Ethernet 2', type: 'ethernet', direction: 'output', signal: true },
    ],
    health: {
      ...createMockHealth('brompton'),
      temperature: 48,
      warnings: ['Panel chain 3 - 2 panels reporting high temperature'],
    },
    firmware: '3.4.0',
    serialNumber: 'BRP-SX40-2024-222',
  },
  {
    id: 'dev-lightware-1',
    name: 'Lightware MX2-16x16',
    manufacturer: 'lightware',
    model: 'MX2-16x16-HDMI20',
    category: 'matrix-switcher',
    status: 'online',
    ipAddress: '10.0.1.40',
    rackId: 'rack-2',
    rackSlot: 4,
    rackUnits: 2,
    ports: [
      ...Array.from({ length: 16 }, (_, i) => ({
        id: uuidv4(),
        label: `HDMI In ${i + 1}`,
        type: 'hdmi' as const,
        direction: 'input' as const,
        signal: Math.random() > 0.4,
      })),
      ...Array.from({ length: 16 }, (_, i) => ({
        id: uuidv4(),
        label: `HDMI Out ${i + 1}`,
        type: 'hdmi' as const,
        direction: 'output' as const,
        signal: true,
      })),
    ],
    health: { ...createMockHealth('lightware'), temperature: 34 },
    firmware: '4.6.1',
    serialNumber: 'LW-MX2-16-2024-88',
  },
  {
    id: 'dev-aja-1',
    name: 'AJA Kumo 3232',
    manufacturer: 'aja',
    model: 'KUMO 3232-12G',
    category: 'matrix-switcher',
    status: 'online',
    ipAddress: '10.0.1.50',
    rackId: 'rack-2',
    rackSlot: 6,
    rackUnits: 2,
    ports: createSDIPorts(32, 32),
    health: { ...createMockHealth('aja'), temperature: 37 },
    firmware: '9.0.0',
    serialNumber: 'AJA-K3232-2024-51',
  },
  {
    id: 'dev-bmd-1',
    name: 'BMD Smart Videohub 40x40',
    manufacturer: 'blackmagic',
    model: 'Smart Videohub 40x40',
    category: 'matrix-switcher',
    status: 'online',
    ipAddress: '10.0.1.60',
    rackId: 'rack-3',
    rackSlot: 1,
    rackUnits: 4,
    ports: createSDIPorts(40, 40),
    health: { ...createMockHealth('blackmagic'), temperature: 39 },
    firmware: '8.6.1',
    serialNumber: 'BMD-VH40-2024-17',
  },
  {
    id: 'dev-ross-1',
    name: 'Ross Carbonite Ultra',
    manufacturer: 'ross',
    model: 'Carbonite Ultra',
    category: 'production-switcher',
    status: 'online',
    ipAddress: '10.0.1.70',
    rackId: 'rack-3',
    rackSlot: 5,
    rackUnits: 4,
    ports: createSDIPorts(24, 16),
    health: { ...createMockHealth('ross'), temperature: 41 },
    firmware: '15.1.0',
    serialNumber: 'ROSS-CU-2024-33',
  },
  {
    id: 'dev-bmd-conv-1',
    name: 'BMD Teranex Mini',
    manufacturer: 'blackmagic',
    model: 'Teranex Mini SDI to HDMI 12G',
    category: 'converter',
    status: 'online',
    ipAddress: '10.0.1.80',
    rackId: 'rack-3',
    rackSlot: 9,
    rackUnits: 1,
    ports: [
      { id: uuidv4(), label: 'SDI In', type: 'sdi', direction: 'input', signal: true },
      { id: uuidv4(), label: 'HDMI Out', type: 'hdmi', direction: 'output', signal: true },
    ],
    health: { ...createMockHealth('blackmagic'), temperature: 31 },
    firmware: '8.6.1',
    serialNumber: 'BMD-TNX-2024-92',
  },
];

// ============================================================
// Initial racks
// ============================================================

function createSlots(devices: Device[], rackId: string): Rack['slots'] {
  const slots: Rack['slots'] = [];
  for (let ru = 1; ru <= 26; ru++) {
    const device = devices.find((d) => d.rackId === rackId && d.rackSlot === ru);
    slots.push({ ru, deviceId: device?.id });
  }
  return slots;
}

const initialRacks: Rack[] = [
  {
    id: 'rack-1',
    name: 'Media Server Rack A',
    location: 'Stage Left',
    width: 2,
    totalRU: 26,
    slots: createSlots(initialDevices, 'rack-1'),
    ambientTemp: 22,
    inletTemp: 24,
    exhaustTemp: 34,
  },
  {
    id: 'rack-2',
    name: 'Processing Rack B',
    location: 'FOH',
    width: 1,
    totalRU: 26,
    slots: createSlots(initialDevices, 'rack-2'),
    ambientTemp: 21,
    inletTemp: 23,
    exhaustTemp: 31,
  },
  {
    id: 'rack-3',
    name: 'Routing Rack C',
    location: 'Stage Right',
    width: 3,
    totalRU: 26,
    slots: createSlots(initialDevices, 'rack-3'),
    ambientTemp: 23,
    inletTemp: 25,
    exhaustTemp: 36,
  },
];

// ============================================================
// Initial matrix routers
// ============================================================

function createMatrixInputs(count: number): MatrixRouter['inputs'] {
  return Array.from({ length: count }, (_, i) => ({
    id: uuidv4(),
    index: i + 1,
    label: `Input ${i + 1}`,
    signal: Math.random() > 0.3,
    format: Math.random() > 0.5 ? '1080p60' : '2160p30',
  }));
}

function createMatrixOutputs(count: number, inputCount: number): MatrixRouter['outputs'] {
  return Array.from({ length: count }, (_, i) => ({
    id: uuidv4(),
    index: i + 1,
    label: `Output ${i + 1}`,
    routedFrom: Math.floor(Math.random() * inputCount) + 1,
  }));
}

const initialRouters: MatrixRouter[] = [
  {
    id: 'router-lw-1',
    name: 'Lightware MX2-16x16',
    manufacturer: 'lightware',
    model: 'MX2-16x16-HDMI20',
    deviceId: 'dev-lightware-1',
    inputs: createMatrixInputs(16),
    outputs: createMatrixOutputs(16, 16),
    size: '16x16',
  },
  {
    id: 'router-aja-1',
    name: 'AJA Kumo 3232',
    manufacturer: 'aja',
    model: 'KUMO 3232-12G',
    deviceId: 'dev-aja-1',
    inputs: createMatrixInputs(32),
    outputs: createMatrixOutputs(32, 32),
    size: '32x32',
  },
  {
    id: 'router-bmd-1',
    name: 'BMD Smart Videohub 40x40',
    manufacturer: 'blackmagic',
    model: 'Smart Videohub 40x40',
    deviceId: 'dev-bmd-1',
    inputs: createMatrixInputs(40),
    outputs: createMatrixOutputs(40, 40),
    size: '40x40',
  },
];

// ============================================================
// Brompton statuses
// ============================================================

const initialBromptonStatuses: BromptonProcessorStatus[] = [
  {
    deviceId: 'dev-brompton-1',
    panelType: 'ROE Black Pearl BP2V2',
    totalPanels: 120,
    onlinePanels: 120,
    brightness: 85,
    colorTemp: 6500,
    inputSource: 'SDI 1',
    inputResolution: '1920x1080',
    inputFrameRate: 60,
    linkStatus: 'active',
    darkMagicEnabled: true,
    dynastaTuneEnabled: true,
    pureToneEnabled: true,
    outputColorSpace: 'Rec. 709',
    panelTemperatures: Array.from({ length: 120 }, () => 30 + Math.random() * 15),
    chainLengths: [30, 30, 30, 30],
  },
  {
    deviceId: 'dev-brompton-2',
    panelType: 'ROE Black Pearl BP2V2',
    totalPanels: 96,
    onlinePanels: 94,
    brightness: 80,
    colorTemp: 6500,
    inputSource: 'SDI 1',
    inputResolution: '1920x1080',
    inputFrameRate: 60,
    linkStatus: 'degraded',
    darkMagicEnabled: true,
    dynastaTuneEnabled: true,
    pureToneEnabled: false,
    outputColorSpace: 'Rec. 709',
    panelTemperatures: Array.from({ length: 96 }, () => 32 + Math.random() * 20),
    chainLengths: [24, 24, 24, 22],
  },
];

// ============================================================
// Initial pin board
// ============================================================

const initialPinBoard: PinBoard = {
  id: 'pinboard-1',
  name: 'Main Overview',
  items: [
    { id: uuidv4(), deviceId: 'dev-disguise-1', position: { x: 20, y: 20 }, size: { width: 280, height: 160 }, showHealth: true, showTemperature: true, showPorts: false },
    { id: uuidv4(), deviceId: 'dev-brompton-1', position: { x: 320, y: 20 }, size: { width: 280, height: 160 }, showHealth: true, showTemperature: true, showPorts: false },
    { id: uuidv4(), deviceId: 'dev-aja-1', position: { x: 20, y: 200 }, size: { width: 280, height: 160 }, showHealth: false, showTemperature: true, showPorts: true },
  ],
};

// ============================================================
// Presets
// ============================================================

const initialMatrixPresets: MatrixPreset[] = [
  {
    id: 'preset-1',
    name: 'Show Mode A',
    description: 'Main show routing - all screens active',
    routerId: 'router-bmd-1',
    routes: [
      { input: 1, output: 1 }, { input: 1, output: 2 },
      { input: 2, output: 3 }, { input: 2, output: 4 },
      { input: 3, output: 5 }, { input: 3, output: 6 },
    ],
    createdAt: '2024-12-01T10:00:00Z',
  },
  {
    id: 'preset-2',
    name: 'Rehearsal Mode',
    description: 'Rehearsal routing - monitors only',
    routerId: 'router-bmd-1',
    routes: [
      { input: 1, output: 1 }, { input: 2, output: 2 },
    ],
    createdAt: '2024-12-02T14:00:00Z',
  },
  {
    id: 'preset-3',
    name: 'AJA Default',
    description: 'Default routing for AJA Kumo',
    routerId: 'router-aja-1',
    routes: Array.from({ length: 32 }, (_, i) => ({ input: i + 1, output: i + 1 })),
    createdAt: '2024-12-03T09:00:00Z',
  },
];

const initialSystemPresets: SystemPreset[] = [
  {
    id: 'sys-preset-1',
    name: 'Full Show',
    description: 'Complete show configuration with all routes and device settings',
    matrixPresets: ['preset-1', 'preset-3'],
    deviceSettings: [],
    createdAt: '2024-12-05T10:00:00Z',
  },
];

// ============================================================
// Disguise Server Config - Mock Data
// ============================================================

function createDefaultAdapters(lastOctet: number): NetworkAdapterConfig[] {
  const roles: { role: NetworkAdapterRole; name: string; baseIp: string; subnet: string; gateway: string; speed: NetworkAdapterConfig['linkSpeed'] }[] = [
    { role: 'd3net', name: 'NIC A - d3Net', baseIp: `10.0.0.${lastOctet}`, subnet: '255.255.255.0', gateway: '10.0.0.1', speed: '10GbE' },
    { role: 'media', name: 'NIC B - Media', baseIp: `192.168.10.${lastOctet}`, subnet: '255.255.255.0', gateway: '192.168.10.1', speed: '10GbE' },
    { role: 'artnet-sacn', name: 'NIC C - Art-Net/sACN', baseIp: `2.0.0.${lastOctet}`, subnet: '255.0.0.0', gateway: '', speed: '1GbE' },
    { role: 'kvm', name: 'NIC D - KVM', baseIp: `192.168.20.${lastOctet}`, subnet: '255.255.255.0', gateway: '', speed: '1GbE' },
    { role: 'control', name: 'NIC E - Control', baseIp: `192.168.30.${lastOctet}`, subnet: '255.255.255.0', gateway: '', speed: '1GbE' },
    { role: 'mgmt', name: 'NIC F - MGMT', baseIp: `192.168.100.${lastOctet}`, subnet: '255.255.255.0', gateway: '192.168.100.1', speed: '1GbE' },
  ];
  return roles.map((r) => ({
    id: uuidv4(),
    role: r.role,
    adapterName: r.name,
    enabled: true,
    dhcp: false,
    ipAddress: r.baseIp,
    subnetMask: r.subnet,
    gateway: r.gateway,
    dnsPrimary: '',
    dnsSecondary: '',
    vlanId: 0,
    linkSpeed: r.speed,
    mtu: 1500,
  }));
}

function createDefaultProfile(name: string, hostname: string, role: 'director' | 'actor' | 'understudy', index: number, lastOctet: number): DisguiseProfile {
  return {
    id: uuidv4(),
    name,
    machineIdentity: {
      hostname,
      role,
      actorIndex: index,
      understudyFor: '',
      workgroup: 'DISGUISE',
      description: '',
    },
    networkAdapters: createDefaultAdapters(lastOctet),
    smbSettings: {
      enabled: true,
      sharePath: 'C:\\d3 Projects',
      shareName: 'd3Projects',
      networkDiscovery: true,
      passwordProtected: false,
      guestAccess: true,
      smbVersion: 'SMBv3',
      allowInsecureGuest: true,
    },
    windowsSettings: {
      powerPlan: 'ultimate-performance',
      sleepWhenPlugged: false,
      hibernate: false,
      windowsFirewall: false,
      remoteDesktop: true,
      windowsUpdate: 'paused',
      antivirus: false,
      visualEffectsPerformance: true,
      usbSelectiveSuspend: false,
    },
    d3ServiceSettings: {
      startup: 'auto',
      apiPort: 80,
      designerVersion: 'r27.1',
      d3netAdapter: 'NIC A - d3Net',
      genlock: false,
      syncPort: 7542,
      vsyncPort: 7968,
    },
    performanceTweaks: {
      gpuDriverLock: true,
      gpuDriverVersion: '546.33',
      codecPreference: 'hap-hapq',
      guiOnActor: role === 'actor' ? 'disabled' : 'full',
      ndiTools5Installed: false,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

const directorProfile = createDefaultProfile('Show Config', 'GX3-DIR', 'director', 0, 11);
const actor1Profile = createDefaultProfile('Show Config', 'GX3-A1', 'actor', 1, 12);
const actor2Profile = createDefaultProfile('Show Config', 'GX3-A2', 'actor', 2, 13);
const actor3Profile = createDefaultProfile('Show Config', 'VX4-A3', 'actor', 3, 14);
const us1Profile = createDefaultProfile('Show Config', 'GX3-US1', 'understudy', 1, 21);
us1Profile.machineIdentity.understudyFor = 'machine-actor-1';

const initialDisguiseSessions: DisguiseSession[] = [
  {
    id: 'session-1',
    name: 'Show "Illuminate"',
    workgroup: 'DISGUISE',
    designerVersion: 'r27.1',
    machines: [
      { id: 'machine-director', name: 'GX3-DIR', model: 'GX 3', role: 'director', index: 0, understudyFor: '', deviceId: 'dev-disguise-1', activeProfileId: directorProfile.id, status: 'online' },
      { id: 'machine-actor-1', name: 'GX3-A1', model: 'GX 3', role: 'actor', index: 1, understudyFor: '', deviceId: 'dev-disguise-2', activeProfileId: actor1Profile.id, status: 'online' },
      { id: 'machine-actor-2', name: 'GX3-A2', model: 'GX 3', role: 'actor', index: 2, understudyFor: '', activeProfileId: actor2Profile.id, status: 'online' },
      { id: 'machine-actor-3', name: 'VX4-A3', model: 'VX 4', role: 'actor', index: 3, understudyFor: '', activeProfileId: actor3Profile.id, status: 'warning' },
      { id: 'machine-us-1', name: 'GX3-US1', model: 'GX 3', role: 'understudy', index: 1, understudyFor: 'machine-actor-1', activeProfileId: us1Profile.id, status: 'standby' },
    ],
    profiles: [directorProfile, actor1Profile, actor2Profile, actor3Profile, us1Profile],
    createdAt: '2024-12-01T10:00:00Z',
    updatedAt: '2024-12-10T14:30:00Z',
  },
];

// ============================================================
// Store interface
// ============================================================

interface AppStore {
  // Data
  devices: Device[];
  racks: Rack[];
  routers: MatrixRouter[];
  bromptonStatuses: BromptonProcessorStatus[];
  pinBoards: PinBoard[];
  matrixPresets: MatrixPreset[];
  systemPresets: SystemPreset[];
  commandHistory: DeviceCommand[];

  // Disguise config
  disguiseSessions: DisguiseSession[];
  selectedSessionId: string | null;
  selectedMachineId: string | null;

  // Disguise actions
  setSelectedSession: (sessionId: string) => void;
  setSelectedMachine: (machineId: string) => void;
  updateProfile: (sessionId: string, profileId: string, updates: Partial<DisguiseProfile>) => void;
  addSession: (session: DisguiseSession) => void;
  addMachineToSession: (sessionId: string, machine: SessionMachine, profile: DisguiseProfile) => void;
  removeMachineFromSession: (sessionId: string, machineId: string) => void;
  duplicateProfile: (sessionId: string, profileId: string, newName: string) => DisguiseProfile | null;
  deleteProfile: (sessionId: string, profileId: string) => void;
  setMachineActiveProfile: (sessionId: string, machineId: string, profileId: string) => void;
  autoIncrementIPs: (sessionId: string, baseOctet: number) => void;

  // Selected state
  selectedRouterId: string | null;

  // Device actions
  updateDeviceStatus: (deviceId: string, status: DeviceStatus) => void;
  assignDeviceToRack: (deviceId: string, rackId: string, startSlot: number) => void;
  removeDeviceFromRack: (deviceId: string) => void;
  sendCommand: (deviceId: string, command: string, params?: Record<string, unknown>) => void;

  // Matrix actions
  setSelectedRouter: (routerId: string) => void;
  setRoute: (routerId: string, outputIndex: number, inputIndex: number) => void;

  // Pin board actions
  addPinBoardItem: (boardId: string, item: Omit<PinBoardItem, 'id'>) => void;
  removePinBoardItem: (boardId: string, itemId: string) => void;
  updatePinBoardItem: (boardId: string, itemId: string, updates: Partial<PinBoardItem>) => void;

  // Preset actions
  recallMatrixPreset: (presetId: string) => void;
  saveMatrixPreset: (preset: Omit<MatrixPreset, 'id' | 'createdAt'>) => void;
  deletePreset: (presetId: string) => void;
}

// ============================================================
// Store implementation
// ============================================================

export const useStore = create<AppStore>((set, get) => ({
  devices: initialDevices,
  racks: initialRacks,
  routers: initialRouters,
  bromptonStatuses: initialBromptonStatuses,
  pinBoards: [initialPinBoard],
  matrixPresets: initialMatrixPresets,
  systemPresets: initialSystemPresets,
  commandHistory: [],

  // Disguise config
  disguiseSessions: initialDisguiseSessions,
  selectedSessionId: initialDisguiseSessions[0]?.id ?? null,
  selectedMachineId: initialDisguiseSessions[0]?.machines[0]?.id ?? null,

  setSelectedSession: (sessionId) => {
    const session = get().disguiseSessions.find((s) => s.id === sessionId);
    set({ selectedSessionId: sessionId, selectedMachineId: session?.machines[0]?.id ?? null });
  },

  setSelectedMachine: (machineId) => set({ selectedMachineId: machineId }),

  updateProfile: (sessionId, profileId, updates) =>
    set((state) => ({
      disguiseSessions: state.disguiseSessions.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              profiles: s.profiles.map((p) =>
                p.id === profileId ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
              ),
              updatedAt: new Date().toISOString(),
            }
          : s
      ),
    })),

  addSession: (session) =>
    set((state) => ({ disguiseSessions: [...state.disguiseSessions, session] })),

  addMachineToSession: (sessionId, machine, profile) =>
    set((state) => ({
      disguiseSessions: state.disguiseSessions.map((s) =>
        s.id === sessionId
          ? { ...s, machines: [...s.machines, machine], profiles: [...s.profiles, profile], updatedAt: new Date().toISOString() }
          : s
      ),
    })),

  removeMachineFromSession: (sessionId, machineId) =>
    set((state) => ({
      disguiseSessions: state.disguiseSessions.map((s) => {
        if (s.id !== sessionId) return s;
        const machine = s.machines.find((m) => m.id === machineId);
        return {
          ...s,
          machines: s.machines.filter((m) => m.id !== machineId),
          profiles: machine ? s.profiles.filter((p) => p.id !== machine.activeProfileId) : s.profiles,
          updatedAt: new Date().toISOString(),
        };
      }),
    })),

  duplicateProfile: (sessionId, profileId, newName) => {
    const state = get();
    const session = state.disguiseSessions.find((s) => s.id === sessionId);
    const original = session?.profiles.find((p) => p.id === profileId);
    if (!original) return null;
    const newProfile: DisguiseProfile = {
      ...JSON.parse(JSON.stringify(original)),
      id: uuidv4(),
      name: newName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    // Re-generate adapter IDs
    newProfile.networkAdapters = newProfile.networkAdapters.map((a: NetworkAdapterConfig) => ({ ...a, id: uuidv4() }));
    set((s) => ({
      disguiseSessions: s.disguiseSessions.map((sess) =>
        sess.id === sessionId ? { ...sess, profiles: [...sess.profiles, newProfile], updatedAt: new Date().toISOString() } : sess
      ),
    }));
    return newProfile;
  },

  deleteProfile: (sessionId, profileId) =>
    set((state) => ({
      disguiseSessions: state.disguiseSessions.map((s) =>
        s.id === sessionId
          ? { ...s, profiles: s.profiles.filter((p) => p.id !== profileId), updatedAt: new Date().toISOString() }
          : s
      ),
    })),

  setMachineActiveProfile: (sessionId, machineId, profileId) =>
    set((state) => ({
      disguiseSessions: state.disguiseSessions.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              machines: s.machines.map((m) => (m.id === machineId ? { ...m, activeProfileId: profileId } : m)),
              updatedAt: new Date().toISOString(),
            }
          : s
      ),
    })),

  autoIncrementIPs: (sessionId, baseOctet) =>
    set((state) => ({
      disguiseSessions: state.disguiseSessions.map((s) => {
        if (s.id !== sessionId) return s;
        // Sort: director first (.baseOctet), then actors by index (.baseOctet+1, +2...), then understudies (.baseOctet+10, +11...)
        const directors = s.machines.filter((m) => m.role === 'director');
        const actors = s.machines.filter((m) => m.role === 'actor').sort((a, b) => a.index - b.index);
        const understudies = s.machines.filter((m) => m.role === 'understudy').sort((a, b) => a.index - b.index);

        const assignOctet = (machine: SessionMachine, octet: number) => {
          const profile = s.profiles.find((p) => p.id === machine.activeProfileId);
          if (!profile) return profile;
          return {
            ...profile,
            networkAdapters: profile.networkAdapters.map((adapter) => {
              const parts = adapter.ipAddress.split('.');
              if (parts.length === 4) {
                parts[3] = String(octet);
                return { ...adapter, ipAddress: parts.join('.') };
              }
              return adapter;
            }),
            updatedAt: new Date().toISOString(),
          };
        };

        const updatedProfiles = [...s.profiles];
        let octet = baseOctet;

        for (const dir of directors) {
          const updated = assignOctet(dir, octet);
          if (updated) {
            const idx = updatedProfiles.findIndex((p) => p.id === dir.activeProfileId);
            if (idx >= 0) updatedProfiles[idx] = updated;
          }
          octet++;
        }
        for (const actor of actors) {
          const updated = assignOctet(actor, octet);
          if (updated) {
            const idx = updatedProfiles.findIndex((p) => p.id === actor.activeProfileId);
            if (idx >= 0) updatedProfiles[idx] = updated;
          }
          octet++;
        }
        let usOctet = baseOctet + 10;
        for (const us of understudies) {
          const updated = assignOctet(us, usOctet);
          if (updated) {
            const idx = updatedProfiles.findIndex((p) => p.id === us.activeProfileId);
            if (idx >= 0) updatedProfiles[idx] = updated;
          }
          usOctet++;
        }

        return { ...s, profiles: updatedProfiles, updatedAt: new Date().toISOString() };
      }),
    })),

  selectedRouterId: initialRouters[0]?.id ?? null,

  updateDeviceStatus: (deviceId, status) =>
    set((state) => ({
      devices: state.devices.map((d) => (d.id === deviceId ? { ...d, status } : d)),
    })),

  assignDeviceToRack: (deviceId, rackId, startSlot) =>
    set((state) => {
      const device = state.devices.find((d) => d.id === deviceId);
      if (!device) return state;

      const updatedDevices = state.devices.map((d) =>
        d.id === deviceId ? { ...d, rackId, rackSlot: startSlot } : d
      );

      const updatedRacks = state.racks.map((rack) => {
        if (rack.id !== rackId) return rack;
        const newSlots = rack.slots.map((slot) => {
          if (slot.ru >= startSlot && slot.ru < startSlot + device.rackUnits) {
            return { ...slot, deviceId };
          }
          return slot.deviceId === deviceId ? { ...slot, deviceId: undefined } : slot;
        });
        return { ...rack, slots: newSlots };
      });

      return { devices: updatedDevices, racks: updatedRacks };
    }),

  removeDeviceFromRack: (deviceId) =>
    set((state) => ({
      devices: state.devices.map((d) =>
        d.id === deviceId ? { ...d, rackId: undefined, rackSlot: undefined } : d
      ),
      racks: state.racks.map((rack) => ({
        ...rack,
        slots: rack.slots.map((slot) =>
          slot.deviceId === deviceId ? { ...slot, deviceId: undefined } : slot
        ),
      })),
    })),

  sendCommand: (deviceId, command, params) => {
    const cmd: DeviceCommand = {
      id: uuidv4(),
      deviceId,
      command,
      params,
      sentAt: new Date().toISOString(),
      status: 'sent',
    };
    set((state) => ({ commandHistory: [cmd, ...state.commandHistory].slice(0, 100) }));
    // Simulate response
    setTimeout(() => {
      set((state) => ({
        commandHistory: state.commandHistory.map((c) =>
          c.id === cmd.id ? { ...c, status: 'success', response: `OK: ${command}` } : c
        ),
      }));
    }, 500 + Math.random() * 1000);
  },

  setSelectedRouter: (routerId) => set({ selectedRouterId: routerId }),

  setRoute: (routerId, outputIndex, inputIndex) =>
    set((state) => ({
      routers: state.routers.map((r) =>
        r.id === routerId
          ? {
              ...r,
              outputs: r.outputs.map((o) =>
                o.index === outputIndex ? { ...o, routedFrom: inputIndex } : o
              ),
            }
          : r
      ),
    })),

  addPinBoardItem: (boardId, item) =>
    set((state) => ({
      pinBoards: state.pinBoards.map((b) =>
        b.id === boardId ? { ...b, items: [...b.items, { ...item, id: uuidv4() }] } : b
      ),
    })),

  removePinBoardItem: (boardId, itemId) =>
    set((state) => ({
      pinBoards: state.pinBoards.map((b) =>
        b.id === boardId ? { ...b, items: b.items.filter((i) => i.id !== itemId) } : b
      ),
    })),

  updatePinBoardItem: (boardId, itemId, updates) =>
    set((state) => ({
      pinBoards: state.pinBoards.map((b) =>
        b.id === boardId
          ? { ...b, items: b.items.map((i) => (i.id === itemId ? { ...i, ...updates } : i)) }
          : b
      ),
    })),

  recallMatrixPreset: (presetId) => {
    const state = get();
    const preset = state.matrixPresets.find((p) => p.id === presetId);
    if (!preset) return;

    set((s) => ({
      routers: s.routers.map((r) => {
        if (r.id !== preset.routerId) return r;
        const newOutputs = r.outputs.map((o) => {
          const route = preset.routes.find((rt) => rt.output === o.index);
          return route ? { ...o, routedFrom: route.input } : o;
        });
        return { ...r, outputs: newOutputs };
      }),
    }));
  },

  saveMatrixPreset: (preset) =>
    set((state) => ({
      matrixPresets: [
        ...state.matrixPresets,
        { ...preset, id: uuidv4(), createdAt: new Date().toISOString() },
      ],
    })),

  deletePreset: (presetId) =>
    set((state) => ({
      matrixPresets: state.matrixPresets.filter((p) => p.id !== presetId),
    })),
}));
