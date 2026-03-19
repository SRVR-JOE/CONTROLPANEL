import { AjaMatrixAdapter } from './aja';
import { BlackmagicMatrixAdapter } from './blackmagic';
import { LightwareMatrixAdapter } from './lightware';
import type { MatrixAdapter } from './types';

/**
 * Registry of matrix switcher adapters keyed by manufacturer slug.
 *
 * To add a new manufacturer, import the adapter class and register it below.
 */
const adapters: Record<string, MatrixAdapter> = {
  lightware: new LightwareMatrixAdapter(),
  blackmagic: new BlackmagicMatrixAdapter(),
  aja: new AjaMatrixAdapter(),
};

/**
 * Look up a matrix adapter by manufacturer name.
 * Returns `null` when no adapter is registered for the given manufacturer.
 */
export function getMatrixAdapter(manufacturer: string): MatrixAdapter | null {
  return adapters[manufacturer.toLowerCase()] ?? null;
}

export type { MatrixAdapter, MatrixState, MatrixPort } from './types';
