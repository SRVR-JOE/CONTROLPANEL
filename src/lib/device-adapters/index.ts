import { DeviceManufacturer } from '@/types';
import { DeviceAdapter } from './types';
import { DisguiseAdapter } from './disguise';
import { BromptonAdapter } from './brompton';
import { BlackmagicAdapter } from './blackmagic';
import { LightwareAdapter } from './lightware';
import { AJAAdapter } from './aja';
import { GenericAdapter } from './generic';

export type { DeviceAdapter, DeviceQueryResult } from './types';

const disguiseAdapter = new DisguiseAdapter();
const bromptonAdapter = new BromptonAdapter();
const blackmagicAdapter = new BlackmagicAdapter();
const lightwareAdapter = new LightwareAdapter();
const ajaAdapter = new AJAAdapter();
const genericAdapter = new GenericAdapter();

const adapterMap: Record<DeviceManufacturer, DeviceAdapter> = {
  disguise: disguiseAdapter,
  brompton: bromptonAdapter,
  blackmagic: blackmagicAdapter,
  lightware: lightwareAdapter,
  aja: ajaAdapter,
  ross: genericAdapter,
  barco: genericAdapter,
};

/**
 * Returns the appropriate device adapter for the given manufacturer.
 * Falls back to the generic adapter for unknown manufacturers.
 */
export function getAdapter(manufacturer: DeviceManufacturer): DeviceAdapter {
  return adapterMap[manufacturer] ?? genericAdapter;
}
