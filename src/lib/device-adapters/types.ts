import { DeviceHealth, DeviceManufacturer } from '@/types';

export interface DeviceQueryResult {
  reachable: boolean;
  health: DeviceHealth | null;
  firmware?: string;
  errors?: string[];
}

export interface DeviceAdapter {
  manufacturer: DeviceManufacturer;
  queryHealth(ip: string, port?: number): Promise<DeviceQueryResult>;
}
