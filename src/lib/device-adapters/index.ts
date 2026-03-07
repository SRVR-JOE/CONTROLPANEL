import { DeviceManufacturer } from '@/types';
import { DeviceAdapter } from './types';
import { DisguiseAdapter } from './disguise';
import { BromptonAdapter } from './brompton';
import { BlackmagicAdapter } from './blackmagic';
import { LightwareAdapter } from './lightware';
import { AJAAdapter } from './aja';
import { GenericAdapter } from './generic';
import { RossAdapter } from './ross';
import { BrainstormAdapter } from './brainstorm';
import { BarcoImageProAdapter } from './barco-imagepro';
import { NovastarAdapter } from './novastar';
import { PanasonicAdapter } from './panasonic';
import { SonyAdapter } from './sony';
import { ChristieAdapter } from './christie';
import { EpsonAdapter } from './epson';
import { ShureAdapter } from './shure';
import { QSCAdapter } from './qsc';
import { DanteAdapter } from './dante';
import { LuminexAdapter } from './luminex';
import { CrestronAdapter } from './crestron';
import { ExtronAdapter } from './extron';
import { NetgearAdapter } from './netgear';
import { AvitechAdapter } from './avitech';
import { AdderAdapter } from './adder';
import { SonifexAdapter } from './sonifex';
import { EatonAdapter } from './eaton';
import { ToshibaUPSAdapter } from './toshiba-ups';
import { GudeAdapter } from './gude';
import { RaritanAdapter } from './raritan';
import { APCAdapter } from './apc';
import { CyberPowerAdapter } from './cyberpower';

export type { DeviceAdapter, DeviceQueryResult } from './types';

const disguiseAdapter = new DisguiseAdapter();
const bromptonAdapter = new BromptonAdapter();
const blackmagicAdapter = new BlackmagicAdapter();
const lightwareAdapter = new LightwareAdapter();
const ajaAdapter = new AJAAdapter();
const genericAdapter = new GenericAdapter();
const rossAdapter = new RossAdapter();
const brainstormAdapter = new BrainstormAdapter();
const barcoImageProAdapter = new BarcoImageProAdapter();
const novastarAdapter = new NovastarAdapter();
const panasonicAdapter = new PanasonicAdapter();
const sonyAdapter = new SonyAdapter();
const christieAdapter = new ChristieAdapter();
const epsonAdapter = new EpsonAdapter();
const shureAdapter = new ShureAdapter();
const qscAdapter = new QSCAdapter();
const danteAdapter = new DanteAdapter();
const luminexAdapter = new LuminexAdapter();
const crestronAdapter = new CrestronAdapter();
const extronAdapter = new ExtronAdapter();
const netgearAdapter = new NetgearAdapter();
const avitechAdapter = new AvitechAdapter();
const adderAdapter = new AdderAdapter();
const sonifexAdapter = new SonifexAdapter();
const eatonAdapter = new EatonAdapter();
const toshibaAdapter = new ToshibaUPSAdapter();
const gudeAdapter = new GudeAdapter();
const raritanAdapter = new RaritanAdapter();
const apcAdapter = new APCAdapter();
const cyberpowerAdapter = new CyberPowerAdapter();

const adapterMap: Record<DeviceManufacturer, DeviceAdapter> = {
  disguise: disguiseAdapter,
  brompton: bromptonAdapter,
  blackmagic: blackmagicAdapter,
  lightware: lightwareAdapter,
  aja: ajaAdapter,
  ross: rossAdapter,
  barco: barcoImageProAdapter,
  novastar: novastarAdapter,
  panasonic: panasonicAdapter,
  sony: sonyAdapter,
  christie: christieAdapter,
  epson: epsonAdapter,
  shure: shureAdapter,
  qsc: qscAdapter,
  audinate: danteAdapter,
  luminex: luminexAdapter,
  crestron: crestronAdapter,
  extron: extronAdapter,
  netgear: netgearAdapter,
  avitech: avitechAdapter,
  adder: adderAdapter,
  sonifex: sonifexAdapter,
  eaton: eatonAdapter,
  toshiba: toshibaAdapter,
  gude: gudeAdapter,
  raritan: raritanAdapter,
  apc: apcAdapter,
  cyberpower: cyberpowerAdapter,
  brainstorm: brainstormAdapter,
};

/**
 * Returns the appropriate device adapter for the given manufacturer.
 * Falls back to the generic adapter for unknown manufacturers.
 */
export function getAdapter(manufacturer: DeviceManufacturer): DeviceAdapter {
  return adapterMap[manufacturer] ?? genericAdapter;
}
