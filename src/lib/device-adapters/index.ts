import { DeviceManufacturer } from '@/types';
import { DeviceAdapter } from './types';
import { DisguiseAdapter } from './disguise';
import { BromptonAdapter } from './brompton';
import { BlackmagicAdapter } from './blackmagic';
import { LightwareAdapter } from './lightware';
import { GenericAdapter } from './generic';

export type { DeviceAdapter, DeviceQueryResult } from './types';
export { fetchWithTimeout, fetchJson } from './utils';

const disguiseAdapter = new DisguiseAdapter();
const bromptonAdapter = new BromptonAdapter();
const blackmagicAdapter = new BlackmagicAdapter();
const lightwareAdapter = new LightwareAdapter();
const genericAja = new GenericAdapter('aja');
const genericRoss = new GenericAdapter('ross');
const genericBarco = new GenericAdapter('barco');

const adapterMap: Record<DeviceManufacturer, DeviceAdapter> = {
  disguise: disguiseAdapter,
  brompton: bromptonAdapter,
  blackmagic: blackmagicAdapter,
  lightware: lightwareAdapter,
  aja: genericAja,
  ross: genericRoss,
  barco: genericBarco,
};

/**
 * Returns the appropriate device adapter for the given manufacturer.
 * Falls back to the generic adapter for unknown manufacturers.
 */
export function getAdapter(manufacturer: DeviceManufacturer): DeviceAdapter {
  return adapterMap[manufacturer] ?? new GenericAdapter(manufacturer);
}
