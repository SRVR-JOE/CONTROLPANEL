import { CatalogManufacturer } from '@/types';

export const brainstormCatalog: CatalogManufacturer = {
  id: 'brainstorm',
  displayName: 'Brainstorm Electronics',
  brandColor: '#00ACC1',
  website: 'https://www.brainstormtime.com',
  products: [
    {
      modelId: 'brainstorm-sr112',
      modelName: 'SR-112',
      category: 'timecode-analyzer',
      rackUnits: 1,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'LTC In', type: 'analog-audio', direction: 'input', count: 2 },
        { label: 'LTC Out', type: 'analog-audio', direction: 'output', count: 6 },
        { label: 'VITC In', type: 'sdi', direction: 'input', count: 1 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80, notes: 'Web interface for status monitoring' },
      features: ['12-output timecode distributor', 'LTC/VITC analysis', 'Timecode display', 'Re-generation'],
      description: '1RU timecode distripalyzer — distributes, analyzes, and displays LTC/VITC timecode.',
    },
    {
      modelId: 'brainstorm-dxd8',
      modelName: 'DXD-8',
      category: 'master-clock',
      rackUnits: 1,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'Word Clock Out', type: 'analog-audio', direction: 'output', count: 8 },
        { label: 'AES Out', type: 'aes-ebu', direction: 'output', count: 4 },
        { label: 'Video Ref In', type: 'sdi', direction: 'input', count: 2 },
        { label: 'Word Clock In', type: 'analog-audio', direction: 'input', count: 1 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80, notes: 'Web interface for configuration and status' },
      features: ['Multi-format sync generator', 'Word clock', 'AES11', 'Video reference', 'PTP/IEEE 1588'],
      description: '1RU master clock and sync generator with word clock, AES, and video reference outputs.',
    },
  ],
};
