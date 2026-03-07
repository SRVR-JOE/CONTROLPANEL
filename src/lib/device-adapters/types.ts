import { DeviceHealth, DeviceManufacturer } from '@/types';

export interface BromptonInputSource {
  portType: string;
  portNumber: number;
}

export interface BromptonInputMetadata {
  bitDepth?: number;
  refreshRate?: number;
  resolution?: { width: number; height: number };
  sampling?: string;
}

export interface BromptonDeviceDetails {
  ethernetTemperatures?: {
    copper?: { a: number; b: number };
    sfp?: { a: number; b: number; c: number; d: number };
  };
  panelDeviceCount?: number;
  panelDeviceTypes?: string[];
  inputSource?: BromptonInputSource;
  inputMetadata?: BromptonInputMetadata;
  processorName?: string;
  processorType?: string;
  serialNumber?: string;
}

export interface DeviceQueryResult {
  reachable: boolean;
  health: DeviceHealth | null;
  firmware?: string;
  errors?: string[];
  details?: BromptonDeviceDetails;
}

export interface DeviceAdapter {
  manufacturer: DeviceManufacturer;
  queryHealth(ip: string, port?: number): Promise<DeviceQueryResult>;
}
