import { v4 as uuidv4 } from 'uuid';
import { Device, DeviceManufacturer, CatalogProduct, DevicePort, DeviceHealth } from '@/types';

function expandCatalogPorts(product: CatalogProduct): DevicePort[] {
  const ports: DevicePort[] = [];
  for (const template of product.defaultPorts) {
    for (let i = 1; i <= template.count; i++) {
      ports.push({
        id: uuidv4(),
        label: template.count > 1 ? `${template.label} ${i}` : template.label,
        type: template.type,
        direction: template.direction,
        signal: false,
      });
    }
  }
  return ports;
}

function createDefaultHealth(): DeviceHealth {
  return {
    temperature: 0,
    uptime: 0,
    errors: [],
    warnings: [],
  };
}

/**
 * Creates a Device object from catalog data. Returns everything needed
 * for the store except the `id`, which the store generates.
 */
export function createDeviceFromCatalog(
  manufacturer: DeviceManufacturer,
  product: CatalogProduct,
  ipAddress: string,
  name?: string,
  extra?: {
    rackId?: string;
    rackSlot?: number;
    serialNumber?: string;
    firmware?: string;
  }
): Omit<Device, 'id'> {
  return {
    name: name || `${product.modelName}`,
    manufacturer,
    model: product.modelName,
    category: product.category,
    status: 'offline',
    ipAddress,
    rackUnits: product.rackUnits || 1,
    ports: expandCatalogPorts(product),
    health: createDefaultHealth(),
    rackId: extra?.rackId,
    rackSlot: extra?.rackSlot,
    serialNumber: extra?.serialNumber,
    firmware: extra?.firmware,
  };
}
