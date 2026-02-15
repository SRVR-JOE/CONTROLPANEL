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
  TimecodeGenerator,
  TimecodeState,
  TimecodeFrameRate,
  TimecodeFormat,
  TimecodeOutputType,
  AudioOutput,
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

function createMixedPorts(config: { sdiIn?: number; sdiOut?: number; hdmiIn?: number; hdmiOut?: number; dpOut?: number; fiberIn?: number; fiberOut?: number; ethPorts?: number; ndiOut?: number; danteIn?: number; danteOut?: number }): Device['ports'] {
  const ports: Device['ports'] = [];
  for (let i = 1; i <= (config.sdiIn || 0); i++) ports.push({ id: uuidv4(), label: `SDI In ${i}`, type: 'sdi', direction: 'input', signal: Math.random() > 0.3 });
  for (let i = 1; i <= (config.sdiOut || 0); i++) ports.push({ id: uuidv4(), label: `SDI Out ${i}`, type: 'sdi', direction: 'output', signal: Math.random() > 0.2 });
  for (let i = 1; i <= (config.hdmiIn || 0); i++) ports.push({ id: uuidv4(), label: `HDMI In ${i}`, type: 'hdmi', direction: 'input', signal: Math.random() > 0.3 });
  for (let i = 1; i <= (config.hdmiOut || 0); i++) ports.push({ id: uuidv4(), label: `HDMI Out ${i}`, type: 'hdmi', direction: 'output', signal: Math.random() > 0.2 });
  for (let i = 1; i <= (config.dpOut || 0); i++) ports.push({ id: uuidv4(), label: `DP Out ${i}`, type: 'displayport', direction: 'output', signal: true });
  for (let i = 1; i <= (config.fiberIn || 0); i++) ports.push({ id: uuidv4(), label: `Fiber In ${i}`, type: 'fiber', direction: 'input', signal: Math.random() > 0.2 });
  for (let i = 1; i <= (config.fiberOut || 0); i++) ports.push({ id: uuidv4(), label: `Fiber Out ${i}`, type: 'fiber', direction: 'output', signal: true });
  for (let i = 1; i <= (config.ethPorts || 0); i++) ports.push({ id: uuidv4(), label: `Ethernet ${i}`, type: 'ethernet', direction: 'input', signal: true });
  for (let i = 1; i <= (config.ndiOut || 0); i++) ports.push({ id: uuidv4(), label: `NDI Out ${i}`, type: 'ndi', direction: 'output', signal: Math.random() > 0.3 });
  for (let i = 1; i <= (config.danteIn || 0); i++) ports.push({ id: uuidv4(), label: `Dante In ${i}`, type: 'dante', direction: 'input', signal: Math.random() > 0.3 });
  for (let i = 1; i <= (config.danteOut || 0); i++) ports.push({ id: uuidv4(), label: `Dante Out ${i}`, type: 'dante', direction: 'output', signal: true });
  return ports;
}

const initialDevices: Device[] = [
  // ============================================================
  // DISGUISE - Media Servers
  // ============================================================
  {
    id: 'dev-disguise-gx3-1', name: 'Disguise GX3', manufacturer: 'disguise', model: 'gx 3', category: 'media-server',
    status: 'online', ipAddress: '10.0.1.10', rackId: 'rack-1', rackSlot: 1, rackUnits: 4,
    ports: createMixedPorts({ sdiOut: 4, dpOut: 2, ethPorts: 2 }),
    health: { ...createMockHealth('disguise'), temperature: 42, cpuUsage: 55, gpuUsage: 72, gpuTemp: 68 },
    firmware: '22.3.2', serialNumber: 'DGX3-2024-0042',
  },
  {
    id: 'dev-disguise-gx3-2', name: 'Disguise GX3 #2', manufacturer: 'disguise', model: 'gx 3', category: 'media-server',
    status: 'online', ipAddress: '10.0.1.11', rackId: 'rack-1', rackSlot: 5, rackUnits: 4,
    ports: createMixedPorts({ sdiOut: 4, dpOut: 2, ethPorts: 2 }),
    health: { ...createMockHealth('disguise'), temperature: 44, cpuUsage: 48, gpuUsage: 65, gpuTemp: 62 },
    firmware: '22.3.2', serialNumber: 'DGX3-2024-0043',
  },
  {
    id: 'dev-disguise-gx2c', name: 'Disguise GX2c', manufacturer: 'disguise', model: 'gx 2c', category: 'media-server',
    status: 'online', ipAddress: '10.0.1.12', rackUnits: 4,
    ports: createMixedPorts({ sdiOut: 4, dpOut: 4, ethPorts: 2 }),
    health: { ...createMockHealth('disguise'), temperature: 40, cpuUsage: 38, gpuUsage: 50, gpuTemp: 55 },
    firmware: '22.3.2', serialNumber: 'DGX2C-2024-018',
  },
  {
    id: 'dev-disguise-vx4', name: 'Disguise VX4', manufacturer: 'disguise', model: 'vx 4', category: 'media-server',
    status: 'online', ipAddress: '10.0.1.13', rackUnits: 4,
    ports: createMixedPorts({ sdiOut: 8, dpOut: 4, hdmiOut: 1, ethPorts: 2 }),
    health: { ...createMockHealth('disguise'), temperature: 46, cpuUsage: 60, gpuUsage: 78, gpuTemp: 72 },
    firmware: '22.3.2', serialNumber: 'DVX4-2024-007',
  },
  {
    id: 'dev-disguise-vx2', name: 'Disguise VX2', manufacturer: 'disguise', model: 'vx 2', category: 'media-server',
    status: 'online', ipAddress: '10.0.1.14', rackUnits: 4,
    ports: createMixedPorts({ sdiOut: 4, dpOut: 2, ethPorts: 2 }),
    health: { ...createMockHealth('disguise'), temperature: 39, cpuUsage: 35, gpuUsage: 45, gpuTemp: 50 },
    firmware: '22.3.2', serialNumber: 'DVX2-2024-031',
  },
  {
    id: 'dev-disguise-vx1', name: 'Disguise VX1', manufacturer: 'disguise', model: 'vx 1', category: 'media-server',
    status: 'offline', ipAddress: '10.0.1.15', rackUnits: 2,
    ports: createMixedPorts({ sdiOut: 2, dpOut: 2, ethPorts: 1 }),
    health: { ...createMockHealth('disguise'), temperature: 25, cpuUsage: 0, gpuUsage: 0, gpuTemp: 25 },
    firmware: '22.3.2', serialNumber: 'DVX1-2024-055',
  },
  {
    id: 'dev-disguise-solo', name: 'Disguise Solo', manufacturer: 'disguise', model: 'solo', category: 'media-server',
    status: 'online', ipAddress: '10.0.1.16', rackUnits: 1,
    ports: createMixedPorts({ hdmiOut: 1, dpOut: 1, ethPorts: 1 }),
    health: { ...createMockHealth('disguise'), temperature: 35, cpuUsage: 28, gpuUsage: 32, gpuTemp: 40 },
    firmware: '22.3.2', serialNumber: 'DSOLO-2024-090',
  },
  {
    id: 'dev-disguise-rx2', name: 'Disguise RX II', manufacturer: 'disguise', model: 'rx II', category: 'media-server',
    status: 'online', ipAddress: '10.0.1.17', rackUnits: 2,
    ports: createMixedPorts({ sdiIn: 2, sdiOut: 2, hdmiIn: 1, ethPorts: 1 }),
    health: { ...createMockHealth('disguise'), temperature: 37, cpuUsage: 22, gpuUsage: 30, gpuTemp: 42 },
    firmware: '22.3.2', serialNumber: 'DRXII-2024-014',
  },

  // ============================================================
  // BARCO - Video Processors & Event Masters
  // ============================================================
  {
    id: 'dev-barco-e2', name: 'Barco E2', manufacturer: 'barco', model: 'E2', category: 'video-processor',
    status: 'online', ipAddress: '10.0.1.20', rackId: 'rack-1', rackSlot: 9, rackUnits: 4,
    ports: createSDIPorts(8, 8),
    health: { ...createMockHealth('barco'), temperature: 38 },
    firmware: '7.2.1', serialNumber: 'BAR-E2-2024-105',
  },
  {
    id: 'dev-barco-ex', name: 'Barco EX', manufacturer: 'barco', model: 'EX', category: 'video-processor',
    status: 'online', ipAddress: '10.0.1.21', rackUnits: 2,
    ports: createMixedPorts({ sdiIn: 4, sdiOut: 4, hdmiIn: 2, hdmiOut: 2, ethPorts: 1 }),
    health: { ...createMockHealth('barco'), temperature: 35 },
    firmware: '7.2.1', serialNumber: 'BAR-EX-2024-043',
  },
  {
    id: 'dev-barco-s3', name: 'Barco S3-4K', manufacturer: 'barco', model: 'S3-4K', category: 'video-processor',
    status: 'online', ipAddress: '10.0.1.22', rackUnits: 1,
    ports: createMixedPorts({ sdiIn: 4, sdiOut: 2, hdmiIn: 4, hdmiOut: 4, dpOut: 2, ethPorts: 1 }),
    health: { ...createMockHealth('barco'), temperature: 34 },
    firmware: '2.8.0', serialNumber: 'BAR-S3-2024-088',
  },
  {
    id: 'dev-barco-ec210', name: 'Barco EC-210', manufacturer: 'barco', model: 'EC-210', category: 'video-processor',
    status: 'online', ipAddress: '10.0.1.23', rackUnits: 1,
    ports: createMixedPorts({ sdiIn: 2, sdiOut: 2, hdmiIn: 1, hdmiOut: 1, ethPorts: 1 }),
    health: { ...createMockHealth('barco'), temperature: 32 },
    firmware: '2.8.0', serialNumber: 'BAR-EC210-2024-120',
  },
  {
    id: 'dev-barco-pds4k', name: 'Barco PDS-4K', manufacturer: 'barco', model: 'PDS-4K', category: 'video-processor',
    status: 'warning', ipAddress: '10.0.1.24', rackUnits: 1,
    ports: createMixedPorts({ sdiIn: 6, sdiOut: 2, hdmiIn: 2, hdmiOut: 2, ethPorts: 1 }),
    health: { ...createMockHealth('barco'), temperature: 52, warnings: ['Fan 2 running at reduced speed'] },
    firmware: '6.1.3', serialNumber: 'BAR-PDS4K-2024-067',
  },
  {
    id: 'dev-barco-imgpro', name: 'Barco ImagePRO-4K', manufacturer: 'barco', model: 'ImagePRO-4K', category: 'video-processor',
    status: 'online', ipAddress: '10.0.1.25', rackUnits: 1,
    ports: createMixedPorts({ sdiIn: 2, sdiOut: 2, hdmiIn: 2, hdmiOut: 2, dpOut: 1, ethPorts: 1 }),
    health: { ...createMockHealth('barco'), temperature: 36 },
    firmware: '3.2.0', serialNumber: 'BAR-IP4K-2024-034',
  },

  // ============================================================
  // BROMPTON - LED Processors
  // ============================================================
  {
    id: 'dev-brompton-1', name: 'Brompton Tessera SX40', manufacturer: 'brompton', model: 'Tessera SX40', category: 'led-processor',
    status: 'online', ipAddress: '10.0.1.30', rackId: 'rack-2', rackSlot: 1, rackUnits: 1,
    ports: createMixedPorts({ sdiIn: 1, hdmiIn: 1, ethPorts: 4 }),
    health: { ...createMockHealth('brompton'), temperature: 36, powerDraw: 65 },
    firmware: '3.4.0', serialNumber: 'BRP-SX40-2024-221',
  },
  {
    id: 'dev-brompton-2', name: 'Brompton Tessera SX40 #2', manufacturer: 'brompton', model: 'Tessera SX40', category: 'led-processor',
    status: 'warning', ipAddress: '10.0.1.31', rackId: 'rack-2', rackSlot: 2, rackUnits: 1,
    ports: createMixedPorts({ sdiIn: 1, ethPorts: 4 }),
    health: { ...createMockHealth('brompton'), temperature: 48, warnings: ['Panel chain 3 - 2 panels reporting high temperature'] },
    firmware: '3.4.0', serialNumber: 'BRP-SX40-2024-222',
  },
  {
    id: 'dev-brompton-s8', name: 'Brompton Tessera S8', manufacturer: 'brompton', model: 'Tessera S8', category: 'led-processor',
    status: 'online', ipAddress: '10.0.1.32', rackUnits: 1,
    ports: createMixedPorts({ sdiIn: 1, hdmiIn: 1, dpOut: 1, ethPorts: 2 }),
    health: { ...createMockHealth('brompton'), temperature: 33, powerDraw: 45 },
    firmware: '3.4.0', serialNumber: 'BRP-S8-2024-150',
  },
  {
    id: 'dev-brompton-xd', name: 'Brompton Tessera XD', manufacturer: 'brompton', model: 'Tessera XD', category: 'led-processor',
    status: 'online', ipAddress: '10.0.1.33', rackUnits: 1,
    ports: createMixedPorts({ sdiIn: 2, hdmiIn: 2, dpOut: 1, ethPorts: 4 }),
    health: { ...createMockHealth('brompton'), temperature: 37, powerDraw: 80 },
    firmware: '3.4.0', serialNumber: 'BRP-XD-2024-075',
  },
  {
    id: 'dev-brompton-t1', name: 'Brompton Tessera T1', manufacturer: 'brompton', model: 'Tessera T1', category: 'led-processor',
    status: 'online', ipAddress: '10.0.1.34', rackUnits: 0,
    ports: createMixedPorts({ ethPorts: 1 }),
    health: { ...createMockHealth('brompton'), temperature: 30, powerDraw: 12 },
    firmware: '3.4.0', serialNumber: 'BRP-T1-2024-310',
  },

  // ============================================================
  // LIGHTWARE - Matrix Switchers & Signal Management
  // ============================================================
  {
    id: 'dev-lightware-1', name: 'Lightware MX2-16x16', manufacturer: 'lightware', model: 'MX2-16x16-HDMI20', category: 'matrix-switcher',
    status: 'online', ipAddress: '10.0.1.40', rackId: 'rack-2', rackSlot: 4, rackUnits: 2,
    ports: [
      ...Array.from({ length: 16 }, (_, i) => ({ id: uuidv4(), label: `HDMI In ${i + 1}`, type: 'hdmi' as const, direction: 'input' as const, signal: Math.random() > 0.4 })),
      ...Array.from({ length: 16 }, (_, i) => ({ id: uuidv4(), label: `HDMI Out ${i + 1}`, type: 'hdmi' as const, direction: 'output' as const, signal: true })),
    ],
    health: { ...createMockHealth('lightware'), temperature: 34 },
    firmware: '4.6.1', serialNumber: 'LW-MX2-16-2024-88',
  },
  {
    id: 'dev-lightware-mx8', name: 'Lightware MX2-8x8', manufacturer: 'lightware', model: 'MX2-8x8-HDMI20', category: 'matrix-switcher',
    status: 'online', ipAddress: '10.0.1.41', rackUnits: 1,
    ports: createMixedPorts({ hdmiIn: 8, hdmiOut: 8 }),
    health: { ...createMockHealth('lightware'), temperature: 32 },
    firmware: '4.6.1', serialNumber: 'LW-MX2-8-2024-142',
  },
  {
    id: 'dev-lightware-mmx6', name: 'Lightware MMX6x2', manufacturer: 'lightware', model: 'MMX6x2-HT200', category: 'matrix-switcher',
    status: 'online', ipAddress: '10.0.1.42', rackUnits: 1,
    ports: createMixedPorts({ hdmiIn: 6, hdmiOut: 2 }),
    health: { ...createMockHealth('lightware'), temperature: 30 },
    firmware: '4.2.0', serialNumber: 'LW-MMX6-2024-201',
  },
  {
    id: 'dev-lightware-ucx', name: 'Lightware UCX-4x2-HC40', manufacturer: 'lightware', model: 'UCX-4x2-HC40', category: 'matrix-switcher',
    status: 'online', ipAddress: '10.0.1.43', rackUnits: 1,
    ports: createMixedPorts({ hdmiIn: 2, hdmiOut: 2, dpOut: 1, ethPorts: 2 }),
    health: { ...createMockHealth('lightware'), temperature: 29 },
    firmware: '1.5.2', serialNumber: 'LW-UCX4-2024-088',
  },
  {
    id: 'dev-lightware-ubex', name: 'Lightware UBEX-Pro20-HDMI-F100', manufacturer: 'lightware', model: 'UBEX-Pro20-HDMI-F100', category: 'matrix-switcher',
    status: 'online', ipAddress: '10.0.1.44', rackUnits: 0,
    ports: createMixedPorts({ hdmiIn: 1, hdmiOut: 1, fiberIn: 1, fiberOut: 1, ethPorts: 1 }),
    health: { ...createMockHealth('lightware'), temperature: 28 },
    firmware: '2.1.0', serialNumber: 'LW-UBEX-2024-330',
  },
  {
    id: 'dev-lightware-mx32', name: 'Lightware MX2-24x24', manufacturer: 'lightware', model: 'MX2-24x24-DH-24DPi-A', category: 'matrix-switcher',
    status: 'online', ipAddress: '10.0.1.45', rackUnits: 4,
    ports: [
      ...Array.from({ length: 24 }, (_, i) => ({ id: uuidv4(), label: `DP In ${i + 1}`, type: 'displayport' as const, direction: 'input' as const, signal: Math.random() > 0.4 })),
      ...Array.from({ length: 24 }, (_, i) => ({ id: uuidv4(), label: `HDMI Out ${i + 1}`, type: 'hdmi' as const, direction: 'output' as const, signal: true })),
    ],
    health: { ...createMockHealth('lightware'), temperature: 38 },
    firmware: '4.6.1', serialNumber: 'LW-MX24-2024-012',
  },

  // ============================================================
  // AJA - Routers, Converters & Recorders
  // ============================================================
  {
    id: 'dev-aja-1', name: 'AJA KUMO 3232', manufacturer: 'aja', model: 'KUMO 3232-12G', category: 'matrix-switcher',
    status: 'online', ipAddress: '10.0.1.50', rackId: 'rack-2', rackSlot: 6, rackUnits: 2,
    ports: createSDIPorts(32, 32),
    health: { ...createMockHealth('aja'), temperature: 37 },
    firmware: '9.0.0', serialNumber: 'AJA-K3232-2024-51',
  },
  {
    id: 'dev-aja-kumo1616', name: 'AJA KUMO 1616', manufacturer: 'aja', model: 'KUMO 1616-12G', category: 'matrix-switcher',
    status: 'online', ipAddress: '10.0.1.51', rackUnits: 1,
    ports: createSDIPorts(16, 16),
    health: { ...createMockHealth('aja'), temperature: 34 },
    firmware: '9.0.0', serialNumber: 'AJA-K1616-2024-72',
  },
  {
    id: 'dev-aja-kumo1604', name: 'AJA KUMO 1604', manufacturer: 'aja', model: 'KUMO 1604', category: 'matrix-switcher',
    status: 'online', ipAddress: '10.0.1.52', rackUnits: 1,
    ports: createSDIPorts(16, 4),
    health: { ...createMockHealth('aja'), temperature: 32 },
    firmware: '9.0.0', serialNumber: 'AJA-K1604-2024-95',
  },
  {
    id: 'dev-aja-fs4', name: 'AJA FS4', manufacturer: 'aja', model: 'FS4', category: 'converter',
    status: 'online', ipAddress: '10.0.1.53', rackUnits: 1,
    ports: createMixedPorts({ sdiIn: 4, sdiOut: 4, hdmiOut: 4, fiberIn: 4, ethPorts: 1 }),
    health: { ...createMockHealth('aja'), temperature: 35 },
    firmware: '4.1.0', serialNumber: 'AJA-FS4-2024-130',
  },
  {
    id: 'dev-aja-fshdr', name: 'AJA FS-HDR', manufacturer: 'aja', model: 'FS-HDR', category: 'converter',
    status: 'online', ipAddress: '10.0.1.54', rackUnits: 1,
    ports: createMixedPorts({ sdiIn: 4, sdiOut: 4, fiberIn: 4, ethPorts: 1 }),
    health: { ...createMockHealth('aja'), temperature: 33 },
    firmware: '4.0.2', serialNumber: 'AJA-FSHDR-2024-044',
  },
  {
    id: 'dev-aja-kipro', name: 'AJA Ki Pro Ultra 12G', manufacturer: 'aja', model: 'Ki Pro Ultra 12G', category: 'media-server',
    status: 'online', ipAddress: '10.0.1.55', rackUnits: 2,
    ports: createMixedPorts({ sdiIn: 4, sdiOut: 4, hdmiIn: 1, hdmiOut: 1, fiberIn: 4, ethPorts: 1 }),
    health: { ...createMockHealth('aja'), temperature: 36 },
    firmware: '3.0.0', serialNumber: 'AJA-KPU12-2024-021',
  },
  {
    id: 'dev-aja-corvid44', name: 'AJA Corvid 44 12G', manufacturer: 'aja', model: 'Corvid 44 12G', category: 'converter',
    status: 'online', ipAddress: '10.0.1.56', rackUnits: 0,
    ports: createMixedPorts({ sdiIn: 4, sdiOut: 4 }),
    health: { ...createMockHealth('aja'), temperature: 30 },
    firmware: '16.2.0', serialNumber: 'AJA-C44-2024-188',
  },
  {
    id: 'dev-aja-ipr10g2', name: 'AJA IPR-10G2-HDMI', manufacturer: 'aja', model: 'IPR-10G2-HDMI', category: 'converter',
    status: 'online', ipAddress: '10.0.1.57', rackUnits: 1,
    ports: createMixedPorts({ hdmiOut: 1, ethPorts: 2 }),
    health: { ...createMockHealth('aja'), temperature: 31 },
    firmware: '2.0.0', serialNumber: 'AJA-IPR10-2024-065',
  },

  // ============================================================
  // BLACKMAGIC DESIGN - Routers, Converters, Switchers & Recorders
  // ============================================================
  {
    id: 'dev-bmd-1', name: 'BMD Smart Videohub 40x40', manufacturer: 'blackmagic', model: 'Smart Videohub 40x40', category: 'matrix-switcher',
    status: 'online', ipAddress: '10.0.1.60', rackId: 'rack-3', rackSlot: 1, rackUnits: 4,
    ports: createSDIPorts(40, 40),
    health: { ...createMockHealth('blackmagic'), temperature: 39 },
    firmware: '8.6.1', serialNumber: 'BMD-VH40-2024-17',
  },
  {
    id: 'dev-bmd-vh2020', name: 'BMD Smart Videohub 20x20', manufacturer: 'blackmagic', model: 'Smart Videohub 20x20', category: 'matrix-switcher',
    status: 'online', ipAddress: '10.0.1.61', rackUnits: 1,
    ports: createSDIPorts(20, 20),
    health: { ...createMockHealth('blackmagic'), temperature: 35 },
    firmware: '8.6.1', serialNumber: 'BMD-VH20-2024-44',
  },
  {
    id: 'dev-bmd-vh1212', name: 'BMD Smart Videohub CleanSwitch 12x12', manufacturer: 'blackmagic', model: 'Smart Videohub CleanSwitch 12x12', category: 'matrix-switcher',
    status: 'online', ipAddress: '10.0.1.62', rackUnits: 1,
    ports: createSDIPorts(12, 12),
    health: { ...createMockHealth('blackmagic'), temperature: 33 },
    firmware: '8.6.1', serialNumber: 'BMD-VH12-2024-89',
  },
  {
    id: 'dev-bmd-atem8k', name: 'BMD ATEM Constellation 8K', manufacturer: 'blackmagic', model: 'ATEM Constellation 8K', category: 'production-switcher',
    status: 'online', ipAddress: '10.0.1.63', rackUnits: 4,
    ports: createMixedPorts({ sdiIn: 40, sdiOut: 24, ethPorts: 2 }),
    health: { ...createMockHealth('blackmagic'), temperature: 45 },
    firmware: '9.6.2', serialNumber: 'BMD-ATEM8K-2024-009',
  },
  {
    id: 'dev-bmd-atem4me', name: 'BMD ATEM 4 M/E Constellation 4K', manufacturer: 'blackmagic', model: 'ATEM 4 M/E Constellation 4K', category: 'production-switcher',
    status: 'online', ipAddress: '10.0.1.64', rackUnits: 2,
    ports: createMixedPorts({ sdiIn: 20, sdiOut: 12, ethPorts: 1 }),
    health: { ...createMockHealth('blackmagic'), temperature: 40 },
    firmware: '9.6.2', serialNumber: 'BMD-A4ME-2024-028',
  },
  {
    id: 'dev-bmd-conv-1', name: 'BMD Teranex Mini', manufacturer: 'blackmagic', model: 'Teranex Mini SDI to HDMI 12G', category: 'converter',
    status: 'online', ipAddress: '10.0.1.65', rackId: 'rack-3', rackSlot: 9, rackUnits: 1,
    ports: createMixedPorts({ sdiIn: 1, hdmiOut: 1 }),
    health: { ...createMockHealth('blackmagic'), temperature: 31 },
    firmware: '8.6.1', serialNumber: 'BMD-TNX-2024-92',
  },
  {
    id: 'dev-bmd-teranex', name: 'BMD Teranex AV', manufacturer: 'blackmagic', model: 'Teranex AV', category: 'converter',
    status: 'online', ipAddress: '10.0.1.66', rackUnits: 2,
    ports: createMixedPorts({ sdiIn: 2, sdiOut: 2, hdmiIn: 2, hdmiOut: 2, ethPorts: 1 }),
    health: { ...createMockHealth('blackmagic'), temperature: 34 },
    firmware: '8.6.1', serialNumber: 'BMD-TAV-2024-055',
  },
  {
    id: 'dev-bmd-hyperdeck', name: 'BMD HyperDeck Studio 4K Pro', manufacturer: 'blackmagic', model: 'HyperDeck Studio 4K Pro', category: 'media-server',
    status: 'online', ipAddress: '10.0.1.67', rackUnits: 1,
    ports: createMixedPorts({ sdiIn: 2, sdiOut: 2, hdmiOut: 1, ethPorts: 1 }),
    health: { ...createMockHealth('blackmagic'), temperature: 32 },
    firmware: '8.6.1', serialNumber: 'BMD-HD4K-2024-076',
  },
  {
    id: 'dev-bmd-microconv', name: 'BMD Micro Converter BiDirect SDI/HDMI 12G', manufacturer: 'blackmagic', model: 'Micro Converter BiDirectional SDI/HDMI 12G', category: 'converter',
    status: 'online', ipAddress: '10.0.1.68', rackUnits: 0,
    ports: createMixedPorts({ sdiIn: 1, sdiOut: 1, hdmiIn: 1, hdmiOut: 1 }),
    health: { ...createMockHealth('blackmagic'), temperature: 28 },
    firmware: '8.6.1', serialNumber: 'BMD-MC12-2024-440',
  },
  {
    id: 'dev-bmd-webpresenter', name: 'BMD Web Presenter 4K', manufacturer: 'blackmagic', model: 'Web Presenter 4K', category: 'converter',
    status: 'online', ipAddress: '10.0.1.69', rackUnits: 1,
    ports: createMixedPorts({ sdiIn: 2, hdmiIn: 1, ethPorts: 1 }),
    health: { ...createMockHealth('blackmagic'), temperature: 30 },
    firmware: '8.6.1', serialNumber: 'BMD-WP4K-2024-112',
  },

  // ============================================================
  // ROSS - Production Switchers & Infrastructure
  // ============================================================
  {
    id: 'dev-ross-1', name: 'Ross Carbonite Ultra', manufacturer: 'ross', model: 'Carbonite Ultra', category: 'production-switcher',
    status: 'online', ipAddress: '10.0.1.70', rackId: 'rack-3', rackSlot: 5, rackUnits: 4,
    ports: createSDIPorts(24, 16),
    health: { ...createMockHealth('ross'), temperature: 41 },
    firmware: '15.1.0', serialNumber: 'ROSS-CU-2024-33',
  },
  {
    id: 'dev-ross-cbp', name: 'Ross Carbonite Black Plus', manufacturer: 'ross', model: 'Carbonite Black Plus', category: 'production-switcher',
    status: 'online', ipAddress: '10.0.1.71', rackUnits: 3,
    ports: createMixedPorts({ sdiIn: 22, sdiOut: 14, ethPorts: 2 }),
    health: { ...createMockHealth('ross'), temperature: 39 },
    firmware: '15.1.0', serialNumber: 'ROSS-CBP-2024-018',
  },
  {
    id: 'dev-ross-ultrix', name: 'Ross Ultrix FR5', manufacturer: 'ross', model: 'Ultrix FR5', category: 'matrix-switcher',
    status: 'online', ipAddress: '10.0.1.72', rackUnits: 5,
    ports: createMixedPorts({ sdiIn: 32, sdiOut: 32, fiberIn: 8, fiberOut: 8, ethPorts: 2 }),
    health: { ...createMockHealth('ross'), temperature: 43 },
    firmware: '6.4.0', serialNumber: 'ROSS-UFR5-2024-007',
  },
  {
    id: 'dev-ross-ultrix2', name: 'Ross Ultrix FR2', manufacturer: 'ross', model: 'Ultrix FR2', category: 'matrix-switcher',
    status: 'online', ipAddress: '10.0.1.73', rackUnits: 2,
    ports: createMixedPorts({ sdiIn: 16, sdiOut: 16, ethPorts: 2 }),
    health: { ...createMockHealth('ross'), temperature: 38 },
    firmware: '6.4.0', serialNumber: 'ROSS-UFR2-2024-022',
  },
  {
    id: 'dev-ross-nk', name: 'Ross NK-3G34', manufacturer: 'ross', model: 'NK-3G34', category: 'matrix-switcher',
    status: 'online', ipAddress: '10.0.1.74', rackUnits: 2,
    ports: createSDIPorts(34, 34),
    health: { ...createMockHealth('ross'), temperature: 36 },
    firmware: '3.2.1', serialNumber: 'ROSS-NK34-2024-051',
  },
  {
    id: 'dev-ross-acuity', name: 'Ross Acuity', manufacturer: 'ross', model: 'Acuity', category: 'production-switcher',
    status: 'error', ipAddress: '10.0.1.75', rackUnits: 6,
    ports: createMixedPorts({ sdiIn: 48, sdiOut: 32, fiberIn: 12, fiberOut: 12, ethPorts: 4 }),
    health: { ...createMockHealth('ross'), temperature: 58, errors: ['PSU 2 failure - running on redundant supply'], warnings: ['System temperature elevated'] },
    firmware: '12.0.2', serialNumber: 'ROSS-ACU-2024-003',
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
  {
    deviceId: 'dev-brompton-s8',
    panelType: 'Absen PL2.5 Pro',
    totalPanels: 48,
    onlinePanels: 48,
    brightness: 70,
    colorTemp: 5600,
    inputSource: 'HDMI 1',
    inputResolution: '3840x2160',
    inputFrameRate: 30,
    linkStatus: 'active',
    darkMagicEnabled: true,
    dynastaTuneEnabled: false,
    pureToneEnabled: true,
    outputColorSpace: 'Rec. 709',
    panelTemperatures: Array.from({ length: 48 }, () => 28 + Math.random() * 12),
    chainLengths: [24, 24],
  },
  {
    deviceId: 'dev-brompton-xd',
    panelType: 'ROE Carbon CB5',
    totalPanels: 200,
    onlinePanels: 199,
    brightness: 100,
    colorTemp: 6500,
    inputSource: 'SDI 1',
    inputResolution: '3840x2160',
    inputFrameRate: 60,
    linkStatus: 'active',
    darkMagicEnabled: true,
    dynastaTuneEnabled: true,
    pureToneEnabled: true,
    outputColorSpace: 'Rec. 2020',
    panelTemperatures: Array.from({ length: 200 }, () => 32 + Math.random() * 18),
    chainLengths: [50, 50, 50, 49],
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
// Initial audio outputs & timecode generators
// ============================================================

const initialAudioOutputs: AudioOutput[] = [
  {
    id: 'audio-out-1',
    name: 'System Default',
    type: 'soundcard',
    channels: 2,
    sampleRate: 48000,
    active: true,
    latencyMs: 5,
  },
  {
    id: 'audio-out-2',
    name: 'RME MADIface XT',
    type: 'soundcard',
    channels: 196,
    sampleRate: 48000,
    active: true,
    latencyMs: 3,
  },
  {
    id: 'audio-out-3',
    name: 'Focusrite RedNet PCIeNX',
    type: 'dante',
    channels: 128,
    sampleRate: 48000,
    active: true,
    danteDeviceName: 'RedNet-PCIeNX-01',
    danteChannel: 1,
    latencyMs: 1,
  },
  {
    id: 'audio-out-4',
    name: 'Dante Virtual Soundcard',
    type: 'dante',
    channels: 64,
    sampleRate: 48000,
    active: true,
    danteDeviceName: 'DVS-AV-CTRL',
    danteChannel: 1,
    latencyMs: 4,
  },
  {
    id: 'audio-out-5',
    name: 'Audinate AVIO Adapter',
    type: 'dante',
    channels: 2,
    sampleRate: 48000,
    active: true,
    danteDeviceName: 'AVIO-AES3-01',
    danteChannel: 1,
    latencyMs: 1,
  },
  {
    id: 'audio-out-6',
    name: 'MOTU 16A',
    type: 'soundcard',
    channels: 16,
    sampleRate: 48000,
    active: false,
    latencyMs: 4,
  },
];

const zeroTC: TimecodeState = { hours: 0, minutes: 0, seconds: 0, frames: 0 };

const initialTimecodeGenerators: TimecodeGenerator[] = [
  {
    id: 'tc-gen-1',
    name: 'Master Show TC',
    running: false,
    timecode: { hours: 1, minutes: 0, seconds: 0, frames: 0 },
    frameRate: 25,
    format: 'SMPTE',
    dropFrame: false,
    outputType: 'ltc',
    audioOutputId: 'audio-out-2',
    offset: zeroTC,
    jamSynced: false,
    freeRunning: true,
    createdAt: '2024-12-01T10:00:00Z',
  },
  {
    id: 'tc-gen-2',
    name: 'Dante TC Feed',
    running: false,
    timecode: { hours: 10, minutes: 0, seconds: 0, frames: 0 },
    frameRate: 25,
    format: 'SMPTE',
    dropFrame: false,
    outputType: 'ltc',
    audioOutputId: 'audio-out-3',
    offset: zeroTC,
    jamSynced: false,
    freeRunning: true,
    createdAt: '2024-12-01T10:05:00Z',
  },
  {
    id: 'tc-gen-3',
    name: 'MTC to disguise',
    running: false,
    timecode: { hours: 0, minutes: 0, seconds: 0, frames: 0 },
    frameRate: 30,
    format: 'SMPTE',
    dropFrame: true,
    outputType: 'mtc',
    audioOutputId: null,
    offset: zeroTC,
    jamSynced: false,
    freeRunning: true,
    createdAt: '2024-12-01T10:10:00Z',
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

  // Timecode
  timecodeGenerators: TimecodeGenerator[];
  audioOutputs: AudioOutput[];

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

  // Timecode actions
  addTimecodeGenerator: (name: string) => void;
  removeTimecodeGenerator: (id: string) => void;
  updateTimecodeGenerator: (id: string, updates: Partial<TimecodeGenerator>) => void;
  setTimecodeRunning: (id: string, running: boolean) => void;
  setTimecodeValue: (id: string, tc: TimecodeState) => void;
  setTimecodeFrameRate: (id: string, frameRate: TimecodeFrameRate) => void;
  setTimecodeFormat: (id: string, format: TimecodeFormat) => void;
  setTimecodeOutputType: (id: string, outputType: TimecodeOutputType) => void;
  setTimecodeAudioOutput: (id: string, audioOutputId: string | null) => void;
  jamSyncTimecode: (id: string, source: string) => void;
  resetTimecode: (id: string) => void;
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
  timecodeGenerators: initialTimecodeGenerators,
  audioOutputs: initialAudioOutputs,
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

  // Timecode actions
  addTimecodeGenerator: (name) =>
    set((state) => ({
      timecodeGenerators: [
        ...state.timecodeGenerators,
        {
          id: uuidv4(),
          name,
          running: false,
          timecode: { hours: 0, minutes: 0, seconds: 0, frames: 0 },
          frameRate: 25 as TimecodeFrameRate,
          format: 'SMPTE' as TimecodeFormat,
          dropFrame: false,
          outputType: 'ltc' as TimecodeOutputType,
          audioOutputId: null,
          offset: { hours: 0, minutes: 0, seconds: 0, frames: 0 },
          jamSynced: false,
          freeRunning: true,
          createdAt: new Date().toISOString(),
        },
      ],
    })),

  removeTimecodeGenerator: (id) =>
    set((state) => ({
      timecodeGenerators: state.timecodeGenerators.filter((g) => g.id !== id),
    })),

  updateTimecodeGenerator: (id, updates) =>
    set((state) => ({
      timecodeGenerators: state.timecodeGenerators.map((g) =>
        g.id === id ? { ...g, ...updates } : g
      ),
    })),

  setTimecodeRunning: (id, running) =>
    set((state) => ({
      timecodeGenerators: state.timecodeGenerators.map((g) =>
        g.id === id ? { ...g, running } : g
      ),
    })),

  setTimecodeValue: (id, tc) =>
    set((state) => ({
      timecodeGenerators: state.timecodeGenerators.map((g) =>
        g.id === id ? { ...g, timecode: tc } : g
      ),
    })),

  setTimecodeFrameRate: (id, frameRate) =>
    set((state) => ({
      timecodeGenerators: state.timecodeGenerators.map((g) =>
        g.id === id ? { ...g, frameRate } : g
      ),
    })),

  setTimecodeFormat: (id, format) =>
    set((state) => ({
      timecodeGenerators: state.timecodeGenerators.map((g) =>
        g.id === id ? { ...g, format } : g
      ),
    })),

  setTimecodeOutputType: (id, outputType) =>
    set((state) => ({
      timecodeGenerators: state.timecodeGenerators.map((g) =>
        g.id === id ? { ...g, outputType } : g
      ),
    })),

  setTimecodeAudioOutput: (id, audioOutputId) =>
    set((state) => ({
      timecodeGenerators: state.timecodeGenerators.map((g) =>
        g.id === id ? { ...g, audioOutputId } : g
      ),
    })),

  jamSyncTimecode: (id, source) =>
    set((state) => ({
      timecodeGenerators: state.timecodeGenerators.map((g) =>
        g.id === id ? { ...g, jamSynced: true, jamSyncSource: source } : g
      ),
    })),

  resetTimecode: (id) =>
    set((state) => ({
      timecodeGenerators: state.timecodeGenerators.map((g) =>
        g.id === id
          ? { ...g, timecode: { hours: 0, minutes: 0, seconds: 0, frames: 0 }, running: false, jamSynced: false }
          : g
      ),
    })),
}));
