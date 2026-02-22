import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  Device,
  DeviceHealth,
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
  DeploymentJob,
  DeploymentSection,
  MachineDeploymentState,
  DiscoveredMachine,
  DiscoveryScan,
  LEDTileInfo,
  LEDTileErrorType,
  TileViewMode,
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

function generateMockTiles(deviceId: string, chainLengths: number[], onlinePanels: number): LEDTileInfo[] {
  const errorTypes: LEDTileErrorType[] = [
    'high-temperature',
    'communication-lost',
    'driver-fault',
    'power-fault',
    'color-calibration',
    'pixel-failure',
  ];

  const errorMessages: Record<LEDTileErrorType, { message: string; severity: 'warning' | 'error' }> = {
    'high-temperature': { message: 'Panel temperature exceeds safe operating threshold', severity: 'warning' },
    'communication-lost': { message: 'No response from panel over Ethernet link', severity: 'error' },
    'driver-fault': { message: 'LED driver IC reporting fault condition', severity: 'error' },
    'power-fault': { message: 'Power supply voltage out of tolerance', severity: 'error' },
    'color-calibration': { message: 'Color calibration data mismatch detected', severity: 'warning' },
    'pixel-failure': { message: 'One or more pixel sub-elements unresponsive', severity: 'warning' },
  };

  const tiles: LEDTileInfo[] = [];
  let tileGlobalIndex = 0;

  for (let chainIdx = 0; chainIdx < chainLengths.length; chainIdx++) {
    const chainLength = chainLengths[chainIdx];

    for (let pos = 0; pos < chainLength; pos++) {
      const rng = Math.random();
      const isOffline = rng < 0.08;
      const isWarning = !isOffline && rng < 0.13; // next 5% after offline band

      let status: LEDTileInfo['status'];
      let temperature: number;
      const tileErrors: LEDTileInfo['errors'] = [];

      if (isOffline) {
        status = 'offline';
        temperature = 0;
      } else if (isWarning) {
        status = 'warning';
        // Hotspot temperature: 48-55C
        temperature = 48 + Math.random() * 7;
        // Add a high-temperature or driver-fault error
        const errType = Math.random() < 0.6 ? 'high-temperature' : 'driver-fault';
        const errInfo = errorMessages[errType];
        tileErrors.push({
          type: errType,
          message: errInfo.message,
          severity: errInfo.severity,
          timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        });
        // Sometimes add a second error
        if (Math.random() < 0.3) {
          const secondErrType = errorTypes.filter((t) => t !== errType)[Math.floor(Math.random() * 5)];
          const secondErrInfo = errorMessages[secondErrType];
          tileErrors.push({
            type: secondErrType,
            message: secondErrInfo.message,
            severity: secondErrInfo.severity,
            timestamp: new Date(Date.now() - Math.random() * 7200000).toISOString(),
          });
        }
      } else if (tileGlobalIndex >= onlinePanels) {
        // Excess panels beyond onlinePanels count go offline
        status = 'offline';
        temperature = 0;
      } else {
        // Determine if error (beyond the warning band)
        const hasError = rng > 0.96;
        if (hasError) {
          status = 'error';
          temperature = 52 + Math.random() * 5;
          const errType = errorTypes[Math.floor(Math.random() * errorTypes.length)];
          const errInfo = errorMessages[errType];
          tileErrors.push({
            type: errType,
            message: errInfo.message,
            severity: 'error',
            timestamp: new Date(Date.now() - Math.random() * 1800000).toISOString(),
          });
        } else {
          status = 'online';
          // Normal temperature: 30-45C, with occasional hotspot cluster
          const isHotspot = Math.random() < 0.07;
          temperature = isHotspot
            ? 43 + Math.random() * 5
            : 30 + Math.random() * 15;
        }
      }

      tiles.push({
        id: `${deviceId}-chain${chainIdx}-pos${pos}`,
        chainIndex: chainIdx,
        positionInChain: pos,
        status,
        temperature,
        errors: tileErrors,
        lastSeen: status === 'offline'
          ? new Date(Date.now() - 60000 - Math.random() * 300000).toISOString()
          : new Date(Date.now() - Math.random() * 5000).toISOString(),
        serialNumber: status !== 'offline' ? `SN-${deviceId.slice(-3).toUpperCase()}-C${chainIdx + 1}P${String(pos + 1).padStart(2, '0')}` : undefined,
        firmwareVersion: status !== 'offline' ? '2.4.1' : undefined,
      });

      tileGlobalIndex++;
    }
  }

  return tiles;
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
    tiles: generateMockTiles('dev-brompton-1', [30, 30, 30, 30], 120),
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
    tiles: generateMockTiles('dev-brompton-2', [24, 24, 24, 22], 94),
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
      passwordProtected: true,
      guestAccess: false,
      smbVersion: 'SMBv3',
      allowInsecureGuest: false,
    },
    windowsSettings: {
      powerPlan: 'ultimate-performance',
      sleepWhenPlugged: false,
      hibernate: false,
      windowsFirewall: true,
      remoteDesktop: true,
      windowsUpdate: 'paused',
      antivirus: true,
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
const us1Profile = createDefaultProfile('Show Config', 'GX3-US1', 'understudy', 1, 15);
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
  renameProfile: (sessionId: string, profileId: string, newName: string) => void;
  renameSession: (sessionId: string, newName: string) => void;
  updateSessionSettings: (sessionId: string, updates: Partial<Pick<DisguiseSession, 'workgroup' | 'designerVersion'>>) => void;
  copySettingsToMachines: (sessionId: string, sourceProfileId: string, targetMachineIds: string[], sections: DeploymentSection[]) => void;
  exportSession: (sessionId: string) => string;
  importSession: (json: string) => boolean;

  // Deployment
  deploymentJobs: DeploymentJob[];
  activeDeploymentId: string | null;
  startDeployment: (sessionId: string, machineIds: string[], sections: DeploymentSection[]) => string;
  updateMachineDeploymentState: (jobId: string, machineId: string, state: Partial<MachineDeploymentState>) => void;
  completeDeployment: (jobId: string) => void;

  // Discovery
  discoveryScans: DiscoveryScan[];
  activeDiscoveryId: string | null;
  startDiscovery: (subnet: string, rangeStart: number, rangeEnd: number, port: number) => string;
  updateDiscoveryScan: (scanId: string, update: Partial<DiscoveryScan>) => void;
  addDiscoveredToSession: (sessionId: string, discovered: DiscoveredMachine, profileId?: string) => void;

  // Selected state
  selectedRouterId: string | null;

  // Brompton tile visualization
  selectedBromptonProcessorId: string | null;
  tileViewMode: TileViewMode;
  selectedTileId: string | null;
  tileErrorFilter: LEDTileErrorType | null;
  setSelectedBromptonProcessor: (deviceId: string) => void;
  setTileViewMode: (mode: TileViewMode) => void;
  setSelectedTile: (tileId: string | null) => void;
  setTileErrorFilter: (errorType: LEDTileErrorType | null) => void;
  updateBromptonTiles: (deviceId: string, tiles: LEDTileInfo[]) => void;

  // Device actions
  updateDeviceStatus: (deviceId: string, status: DeviceStatus) => void;
  updateDeviceHealth: (deviceId: string, health: DeviceHealth, status?: DeviceStatus) => void;
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
        // Prevent removing the last director
        if (machine?.role === 'director') {
          const directorCount = s.machines.filter((m) => m.role === 'director').length;
          if (directorCount <= 1) return s;
        }
        return {
          ...s,
          // Clear understudyFor on any machine that was understudying the removed machine
          machines: s.machines
            .filter((m) => m.id !== machineId)
            .map((m) => m.understudyFor === machineId ? { ...m, understudyFor: '' } : m),
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
        // Sequential: director first, then actors by index, then understudies — all .11, .12, .13, ...
        const directors = s.machines.filter((m) => m.role === 'director');
        const actors = s.machines.filter((m) => m.role === 'actor').sort((a, b) => a.index - b.index);
        const understudies = s.machines.filter((m) => m.role === 'understudy').sort((a, b) => a.index - b.index);
        const ordered = [...directors, ...actors, ...understudies];

        // Bounds check: ensure we won't exceed .254
        if (baseOctet + ordered.length - 1 > 254) return s;

        const assignOctet = (machine: SessionMachine, octet: number) => {
          const profile = s.profiles.find((p) => p.id === machine.activeProfileId);
          if (!profile) return profile;
          return {
            ...profile,
            networkAdapters: profile.networkAdapters.map((adapter) => {
              const parts = adapter.ipAddress.split('.');
              if (parts.length === 4) {
                parts[3] = String(Math.min(254, octet));
                return { ...adapter, ipAddress: parts.join('.') };
              }
              return adapter;
            }),
            updatedAt: new Date().toISOString(),
          };
        };

        const updatedProfiles = [...s.profiles];
        let octet = baseOctet;

        for (const machine of ordered) {
          const updated = assignOctet(machine, octet);
          if (updated) {
            const idx = updatedProfiles.findIndex((p) => p.id === machine.activeProfileId);
            if (idx >= 0) updatedProfiles[idx] = updated;
          }
          octet++;
        }

        return { ...s, profiles: updatedProfiles, updatedAt: new Date().toISOString() };
      }),
    })),

  renameProfile: (sessionId, profileId, newName) =>
    set((state) => ({
      disguiseSessions: state.disguiseSessions.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              profiles: s.profiles.map((p) =>
                p.id === profileId ? { ...p, name: newName, updatedAt: new Date().toISOString() } : p
              ),
              updatedAt: new Date().toISOString(),
            }
          : s
      ),
    })),

  renameSession: (sessionId, newName) =>
    set((state) => ({
      disguiseSessions: state.disguiseSessions.map((s) =>
        s.id === sessionId ? { ...s, name: newName, updatedAt: new Date().toISOString() } : s
      ),
    })),

  updateSessionSettings: (sessionId, updates) =>
    set((state) => ({
      disguiseSessions: state.disguiseSessions.map((s) =>
        s.id === sessionId ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
      ),
    })),

  copySettingsToMachines: (sessionId, sourceProfileId, targetMachineIds, sections) =>
    set((state) => ({
      disguiseSessions: state.disguiseSessions.map((s) => {
        if (s.id !== sessionId) return s;
        const source = s.profiles.find((p) => p.id === sourceProfileId);
        if (!source) return s;
        const targetProfileIds = s.machines
          .filter((m) => targetMachineIds.includes(m.id))
          .map((m) => m.activeProfileId);
        return {
          ...s,
          profiles: s.profiles.map((p) => {
            if (!targetProfileIds.includes(p.id) || p.id === sourceProfileId) return p;
            const updates: Partial<DisguiseProfile> = {};
            for (const section of sections) {
              if (section === 'networkAdapters') {
                // Copy adapter configs but keep original IDs
                updates.networkAdapters = source.networkAdapters.map((srcAdapter, i) => ({
                  ...srcAdapter,
                  id: p.networkAdapters[i]?.id ?? srcAdapter.id,
                }));
              } else if (section === 'machineIdentity') {
                // Copy identity but keep hostname
                updates.machineIdentity = { ...source.machineIdentity, hostname: p.machineIdentity.hostname };
              } else {
                (updates as unknown as Record<string, unknown>)[section] = JSON.parse(JSON.stringify((source as unknown as Record<string, unknown>)[section]));
              }
            }
            return { ...p, ...updates, updatedAt: new Date().toISOString() };
          }),
          updatedAt: new Date().toISOString(),
        };
      }),
    })),

  exportSession: (sessionId) => {
    const state = get();
    const session = state.disguiseSessions.find((s) => s.id === sessionId);
    if (!session) return '{}';
    return JSON.stringify(session, null, 2);
  },

  importSession: (json) => {
    try {
      const session = JSON.parse(json) as DisguiseSession;

      // Top-level structure check
      if (!session.id || !session.name || !session.machines || !session.profiles) {
        console.warn('[importSession] Invalid session: missing required top-level fields (id, name, machines, profiles)');
        return false;
      }

      // machines must be a non-empty array
      if (!Array.isArray(session.machines) || session.machines.length === 0) {
        console.warn('[importSession] Invalid session: machines must be a non-empty array');
        return false;
      }

      // profiles must be an array
      if (!Array.isArray(session.profiles)) {
        console.warn('[importSession] Invalid session: profiles must be an array');
        return false;
      }

      // Validate each machine has required fields
      for (const machine of session.machines) {
        if (!machine.id || typeof machine.id !== 'string') {
          console.warn('[importSession] Invalid machine: missing or non-string id', machine);
          return false;
        }
        if (!machine.name || typeof machine.name !== 'string') {
          console.warn('[importSession] Invalid machine: missing or non-string name', machine);
          return false;
        }
        if (!machine.role || typeof machine.role !== 'string') {
          console.warn('[importSession] Invalid machine: missing or non-string role', machine);
          return false;
        }
        if (!machine.activeProfileId || typeof machine.activeProfileId !== 'string') {
          console.warn('[importSession] Invalid machine: missing or non-string activeProfileId', machine);
          return false;
        }
      }

      // Validate each profile has required fields
      for (const profile of session.profiles) {
        if (!profile.id || typeof profile.id !== 'string') {
          console.warn('[importSession] Invalid profile: missing or non-string id', profile);
          return false;
        }
        if (!profile.name || typeof profile.name !== 'string') {
          console.warn('[importSession] Invalid profile: missing or non-string name', profile);
          return false;
        }
        if (!profile.machineIdentity || typeof profile.machineIdentity !== 'object') {
          console.warn('[importSession] Invalid profile: missing or invalid machineIdentity', profile);
          return false;
        }
        if (!Array.isArray(profile.networkAdapters)) {
          console.warn('[importSession] Invalid profile: networkAdapters must be an array', profile);
          return false;
        }
      }

      // Validate each machine's activeProfileId references an existing profile
      const profileIds = new Set(session.profiles.map((p) => p.id));
      for (const machine of session.machines) {
        if (!profileIds.has(machine.activeProfileId)) {
          console.warn(
            `[importSession] Machine "${machine.name}" references activeProfileId "${machine.activeProfileId}" ` +
            'which does not exist in the session profiles array'
          );
          return false;
        }
      }

      // Validation passed — generate new IDs to avoid collisions with existing data
      const newId = uuidv4();
      session.id = newId;
      session.name = `${session.name} (Imported)`;
      session.createdAt = new Date().toISOString();
      session.updatedAt = new Date().toISOString();
      set((state) => ({
        disguiseSessions: [...state.disguiseSessions, session],
        selectedSessionId: newId,
        selectedMachineId: session.machines[0]?.id ?? null,
      }));
      return true;
    } catch (err) {
      console.warn('[importSession] Failed to parse session JSON:', err);
      return false;
    }
  },

  // Deployment
  deploymentJobs: [],
  activeDeploymentId: null,

  startDeployment: (sessionId, machineIds, sections) => {
    const jobId = uuidv4();
    const machineStates: MachineDeploymentState[] = machineIds.map((id) => ({
      machineId: id,
      status: 'idle',
      progress: 0,
      message: 'Waiting...',
    }));
    const job: DeploymentJob = {
      id: jobId,
      sessionId,
      machineIds,
      status: 'deploying',
      machineStates,
      startedAt: new Date().toISOString(),
      sections,
    };
    set((state) => ({
      deploymentJobs: [job, ...state.deploymentJobs].slice(0, 50),
      activeDeploymentId: jobId,
    }));

    // Simulate deployment to each machine
    const state = get();
    const session = state.disguiseSessions.find((s) => s.id === sessionId);
    if (!session) return jobId;

    machineIds.forEach((machineId, i) => {
      const machine = session.machines.find((m) => m.id === machineId);
      const profile = session.profiles.find((p) => p.id === machine?.activeProfileId);
      if (!machine || !profile) return;

      const d3netIp = profile.networkAdapters.find((a) => a.role === 'd3net')?.ipAddress ?? 'unknown';
      const delay = i * 800; // Stagger starts

      // Phase 1: Connecting
      setTimeout(() => {
        get().updateMachineDeploymentState(jobId, machineId, {
          status: 'deploying',
          progress: 10,
          message: `Connecting to ${d3netIp}...`,
        });
      }, delay);

      // Phase 2: Pushing config sections
      sections.forEach((section, si) => {
        setTimeout(() => {
          const pct = 10 + Math.round(((si + 1) / sections.length) * 70);
          get().updateMachineDeploymentState(jobId, machineId, {
            status: 'deploying',
            progress: pct,
            message: `Applying ${section}...`,
          });
        }, delay + 1000 + si * 600);
      });

      // Phase 3: Verifying
      setTimeout(() => {
        get().updateMachineDeploymentState(jobId, machineId, {
          status: 'deploying',
          progress: 90,
          message: 'Verifying configuration...',
        });
      }, delay + 1000 + sections.length * 600 + 400);

      // Phase 4: Complete (simulate random success/failure)
      setTimeout(() => {
        const success = Math.random() > 0.1; // 90% success rate
        get().updateMachineDeploymentState(jobId, machineId, {
          status: success ? 'success' : 'failed',
          progress: success ? 100 : 85,
          message: success ? 'Configuration applied' : 'Connection timeout',
          lastDeployedAt: success ? new Date().toISOString() : undefined,
          error: success ? undefined : `Failed to reach ${d3netIp}: connection timeout`,
        });
        // Check if all machines are done
        const currentJob = get().deploymentJobs.find((j) => j.id === jobId);
        if (currentJob) {
          const allDone = currentJob.machineStates.every((ms) =>
            ms.status === 'success' || ms.status === 'failed'
          );
          if (allDone) {
            get().completeDeployment(jobId);
          }
        }
      }, delay + 1000 + sections.length * 600 + 1200);
    });

    return jobId;
  },

  updateMachineDeploymentState: (jobId, machineId, stateUpdate) =>
    set((state) => ({
      deploymentJobs: state.deploymentJobs.map((j) =>
        j.id === jobId
          ? {
              ...j,
              machineStates: j.machineStates.map((ms) =>
                ms.machineId === machineId ? { ...ms, ...stateUpdate } : ms
              ),
            }
          : j
      ),
    })),

  completeDeployment: (jobId) =>
    set((state) => ({
      deploymentJobs: state.deploymentJobs.map((j) => {
        if (j.id !== jobId) return j;
        const allSuccess = j.machineStates.every((ms) => ms.status === 'success');
        const allFailed = j.machineStates.every((ms) => ms.status === 'failed');
        return {
          ...j,
          status: allSuccess ? 'success' : allFailed ? 'failed' : 'partial',
          completedAt: new Date().toISOString(),
        };
      }),
      activeDeploymentId: null,
    })),

  // Discovery
  discoveryScans: [],
  activeDiscoveryId: null,

  startDiscovery: (subnet, rangeStart, rangeEnd, port) => {
    const scanId = uuidv4();
    const totalCount = rangeEnd - rangeStart + 1;
    const scan: DiscoveryScan = {
      id: scanId,
      subnet,
      rangeStart,
      rangeEnd,
      port,
      status: 'scanning',
      progress: 0,
      found: [],
      scannedCount: 0,
      totalCount,
      startedAt: new Date().toISOString(),
    };
    set((state) => ({
      discoveryScans: [scan, ...state.discoveryScans].slice(0, 20),
      activeDiscoveryId: scanId,
    }));

    // Fire the API call to scan
    fetch('/api/discover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subnet, rangeStart, rangeEnd, port }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.machines) {
          get().updateDiscoveryScan(scanId, {
            status: 'done',
            progress: 100,
            found: data.machines,
            scannedCount: totalCount,
            completedAt: new Date().toISOString(),
          });
        }
      })
      .catch((err) => {
        get().updateDiscoveryScan(scanId, {
          status: 'error',
          error: String(err),
          completedAt: new Date().toISOString(),
        });
      })
      .finally(() => {
        set({ activeDiscoveryId: null });
      });

    // Simulate progress updates while waiting
    let scanned = 0;
    const interval = setInterval(() => {
      scanned += Math.floor(Math.random() * 8) + 3;
      if (scanned >= totalCount) {
        clearInterval(interval);
        return;
      }
      get().updateDiscoveryScan(scanId, {
        progress: Math.round((scanned / totalCount) * 90),
        scannedCount: scanned,
      });
    }, 300);

    // Safety: clear interval after scan should be done
    setTimeout(() => clearInterval(interval), totalCount * 100 + 5000);

    return scanId;
  },

  updateDiscoveryScan: (scanId, update) =>
    set((state) => ({
      discoveryScans: state.discoveryScans.map((s) =>
        s.id === scanId ? { ...s, ...update } : s
      ),
    })),

  addDiscoveredToSession: (sessionId, discovered, profileId) => {
    const state = get();
    const session = state.disguiseSessions.find((s) => s.id === sessionId);
    if (!session) return;

    const machineId = uuidv4();
    const newProfileId = profileId ?? uuidv4();

    // If a profileId was given, duplicate that profile for this machine
    let profile: DisguiseProfile;
    const sourceProfile = profileId ? session.profiles.find((p) => p.id === profileId) : null;

    if (sourceProfile) {
      // Clone the selected profile, update identity to match discovered machine
      profile = {
        ...JSON.parse(JSON.stringify(sourceProfile)),
        id: newProfileId,
        name: `${sourceProfile.name} (${discovered.hostname})`,
        machineIdentity: {
          ...sourceProfile.machineIdentity,
          hostname: discovered.hostname,
          role: discovered.role,
          actorIndex: discovered.role === 'director' ? 0 :
            session.machines.filter((m) => m.role === discovered.role).length + 1,
          workgroup: discovered.workgroup || sourceProfile.machineIdentity.workgroup,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      // Update d3Net adapter IP to match discovered IP
      profile.networkAdapters = profile.networkAdapters.map((a) =>
        a.role === 'd3net' ? { ...a, ipAddress: discovered.ip } : a
      );
      profile.d3ServiceSettings = {
        ...profile.d3ServiceSettings,
        apiPort: discovered.apiPort,
        designerVersion: discovered.designerVersion || profile.d3ServiceSettings.designerVersion,
      };
    } else {
      // Create a bare-bones profile from discovered info
      const actorIndex = discovered.role === 'director' ? 0 :
        session.machines.filter((m) => m.role === discovered.role).length + 1;
      profile = {
        id: newProfileId,
        name: `Discovered - ${discovered.hostname}`,
        machineIdentity: {
          hostname: discovered.hostname,
          role: discovered.role,
          actorIndex,
          understudyFor: '',
          workgroup: discovered.workgroup || session.workgroup,
          description: `Auto-discovered at ${discovered.ip}`,
        },
        networkAdapters: [
          { id: uuidv4(), role: 'd3net', adapterName: 'NIC A - d3Net', enabled: true, dhcp: false, ipAddress: discovered.ip, subnetMask: '255.255.255.0', gateway: discovered.ip.replace(/\.\d+$/, '.1'), dnsPrimary: '', dnsSecondary: '', vlanId: 0, linkSpeed: '10GbE', mtu: 1500 },
          { id: uuidv4(), role: 'media', adapterName: 'NIC B - Media', enabled: true, dhcp: false, ipAddress: '0.0.0.0', subnetMask: '255.255.255.0', gateway: '', dnsPrimary: '', dnsSecondary: '', vlanId: 0, linkSpeed: '10GbE', mtu: 1500 },
          { id: uuidv4(), role: 'artnet-sacn', adapterName: 'NIC C - Art-Net/sACN', enabled: true, dhcp: false, ipAddress: '2.0.0.1', subnetMask: '255.0.0.0', gateway: '', dnsPrimary: '', dnsSecondary: '', vlanId: 0, linkSpeed: '1GbE', mtu: 1500 },
          { id: uuidv4(), role: 'kvm', adapterName: 'NIC D - KVM', enabled: true, dhcp: false, ipAddress: '0.0.0.0', subnetMask: '255.255.255.0', gateway: '', dnsPrimary: '', dnsSecondary: '', vlanId: 0, linkSpeed: '1GbE', mtu: 1500 },
          { id: uuidv4(), role: 'control', adapterName: 'NIC E - Control', enabled: true, dhcp: false, ipAddress: '0.0.0.0', subnetMask: '255.255.255.0', gateway: '', dnsPrimary: '', dnsSecondary: '', vlanId: 0, linkSpeed: '1GbE', mtu: 1500 },
          { id: uuidv4(), role: 'mgmt', adapterName: 'NIC F - MGMT', enabled: true, dhcp: false, ipAddress: '0.0.0.0', subnetMask: '255.255.255.0', gateway: '', dnsPrimary: '', dnsSecondary: '', vlanId: 0, linkSpeed: '1GbE', mtu: 1500 },
        ],
        smbSettings: { enabled: true, sharePath: 'C:\\d3 Projects', shareName: 'd3Projects', networkDiscovery: true, passwordProtected: true, guestAccess: false, smbVersion: 'SMBv3', allowInsecureGuest: false },
        windowsSettings: { powerPlan: 'ultimate-performance', sleepWhenPlugged: false, hibernate: false, windowsFirewall: true, remoteDesktop: true, windowsUpdate: 'paused', antivirus: true, visualEffectsPerformance: true, usbSelectiveSuspend: false },
        d3ServiceSettings: { startup: 'auto', apiPort: discovered.apiPort, designerVersion: discovered.designerVersion || session.designerVersion, d3netAdapter: 'NIC A - d3Net', genlock: false, syncPort: 7542, vsyncPort: 7968 },
        performanceTweaks: { gpuDriverLock: true, gpuDriverVersion: '546.33', codecPreference: 'hap-hapq', guiOnActor: discovered.role === 'actor' ? 'disabled' : 'full', ndiTools5Installed: false },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    const machine: SessionMachine = {
      id: machineId,
      name: discovered.hostname,
      model: discovered.model,
      role: discovered.role,
      index: discovered.role === 'director' ? 0 :
        session.machines.filter((m) => m.role === discovered.role).length + 1,
      understudyFor: '',
      activeProfileId: newProfileId,
      status: discovered.d3ServiceRunning ? 'online' : 'offline',
    };

    set((state) => ({
      disguiseSessions: state.disguiseSessions.map((s) => {
        if (s.id !== sessionId) return s;
        return {
          ...s,
          machines: [...s.machines, machine],
          profiles: [...s.profiles, profile],
          updatedAt: new Date().toISOString(),
        };
      }),
      selectedMachineId: machineId,
    }));
  },

  selectedRouterId: initialRouters[0]?.id ?? null,

  // Brompton tile visualization state
  selectedBromptonProcessorId: initialBromptonStatuses[0]?.deviceId ?? null,
  tileViewMode: 'status' as TileViewMode,
  selectedTileId: null,
  tileErrorFilter: null,

  setSelectedBromptonProcessor: (deviceId) =>
    set({ selectedBromptonProcessorId: deviceId, selectedTileId: null }),

  setTileViewMode: (mode) =>
    set({ tileViewMode: mode, selectedTileId: null, tileErrorFilter: null }),

  setSelectedTile: (tileId) => set({ selectedTileId: tileId }),

  setTileErrorFilter: (errorType) => set({ tileErrorFilter: errorType }),

  updateBromptonTiles: (deviceId, tiles) =>
    set((state) => ({
      bromptonStatuses: state.bromptonStatuses.map((s) =>
        s.deviceId === deviceId ? { ...s, tiles } : s
      ),
    })),

  updateDeviceStatus: (deviceId, status) =>
    set((state) => ({
      devices: state.devices.map((d) => (d.id === deviceId ? { ...d, status } : d)),
    })),

  updateDeviceHealth: (deviceId, health, status) =>
    set((state) => ({
      devices: state.devices.map((d) =>
        d.id === deviceId
          ? { ...d, health, ...(status !== undefined ? { status } : {}) }
          : d
      ),
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
