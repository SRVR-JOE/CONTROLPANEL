import { CatalogManufacturer } from '@/types';

export const lightwareCatalog: CatalogManufacturer = {
  id: 'lightware',
  displayName: 'Lightware',
  brandColor: '#ff9800',
  website: 'https://www.lightware.com',
  products: [
    // ─── MX2 HDMI Matrix Switchers ───────────────────────────────

    {
      modelId: 'lw-mx2-48x48',
      modelName: 'MX2-48x48-HDMI20',
      category: 'matrix-switcher',
      rackUnits: 6,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'HDMI In', type: 'hdmi', direction: 'input', count: 48 },
        { label: 'HDMI Out', type: 'hdmi', direction: 'output', count: 48 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80, apiBasePath: '/api' },
      features: ['HDMI 2.0', '4K60 4:4:4', '48x48 routing', 'EDID management', 'HDR10 support'],
      description: 'Flagship full-size HDMI 2.0 matrix switcher for large-scale AV installations.',
    },

    {
      modelId: 'lw-mx2-32x32',
      modelName: 'MX2-32x32-HDMI20',
      category: 'matrix-switcher',
      rackUnits: 4,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'HDMI In', type: 'hdmi', direction: 'input', count: 32 },
        { label: 'HDMI Out', type: 'hdmi', direction: 'output', count: 32 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80, apiBasePath: '/api' },
      features: ['HDMI 2.0', '4K60', '32x32 routing', 'EDID management', 'HDR support'],
    },

    {
      modelId: 'lw-mx2-16x16',
      modelName: 'MX2-16x16-HDMI20',
      category: 'matrix-switcher',
      rackUnits: 2,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'HDMI In', type: 'hdmi', direction: 'input', count: 16 },
        { label: 'HDMI Out', type: 'hdmi', direction: 'output', count: 16 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80, apiBasePath: '/api' },
      features: ['HDMI 2.0', '4K60 4:4:4', '16x16 routing', 'EDID management'],
    },

    {
      modelId: 'lw-mx2-8x8',
      modelName: 'MX2-8x8-HDMI20',
      category: 'matrix-switcher',
      rackUnits: 1,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'HDMI In', type: 'hdmi', direction: 'input', count: 8 },
        { label: 'HDMI Out', type: 'hdmi', direction: 'output', count: 8 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80, apiBasePath: '/api' },
      features: ['HDMI 2.0', '4K60', '8x8 routing', 'Compact 1RU'],
    },

    {
      modelId: 'lw-mx2-8x8-dh-dpoe',
      modelName: 'MX2-8x8-DH-8DPOE',
      category: 'matrix-switcher',
      rackUnits: 1,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'DisplayPort In', type: 'displayport', direction: 'input', count: 8 },
        { label: 'HDMI Out', type: 'hdmi', direction: 'output', count: 8 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80, apiBasePath: '/api' },
      features: ['DisplayPort input', 'HDMI output', '8x8 routing', 'DP 1.2 support', 'Compact 1RU'],
    },

    {
      modelId: 'lw-mx2-4x4',
      modelName: 'MX2-4x4-HDMI20',
      category: 'matrix-switcher',
      rackUnits: 1,
      formFactor: 'half-rack',
      defaultPorts: [
        { label: 'HDMI In', type: 'hdmi', direction: 'input', count: 4 },
        { label: 'HDMI Out', type: 'hdmi', direction: 'output', count: 4 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80, apiBasePath: '/api' },
      features: ['HDMI 2.0', '4K60', '4x4 routing', 'EDID management', 'Half-rack form factor'],
    },

    // ─── MMX Multi-format Matrices ────────────────────────────────

    {
      modelId: 'lw-mmx6x2-ht',
      modelName: 'MMX6x2-HT200',
      category: 'matrix-switcher',
      rackUnits: 1,
      formFactor: 'half-rack',
      defaultPorts: [
        { label: 'HDMI In', type: 'hdmi', direction: 'input', count: 4 },
        { label: 'HDBaseT In', type: 'hdbaset', direction: 'input', count: 2 },
        { label: 'HDMI Out', type: 'hdmi', direction: 'output', count: 1 },
        { label: 'HDBaseT Out', type: 'hdbaset', direction: 'output', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80, apiBasePath: '/api' },
      features: ['6x2 matrix', 'HDBaseT 2.0', 'Audio de-embedding', '4K60 support'],
      description: 'Compact multi-format matrix with HDMI and HDBaseT I/O.',
    },

    {
      modelId: 'lw-mmx4x2-ht',
      modelName: 'MMX4x2-HT200',
      category: 'matrix-switcher',
      rackUnits: 1,
      formFactor: 'half-rack',
      defaultPorts: [
        { label: 'HDMI In', type: 'hdmi', direction: 'input', count: 2 },
        { label: 'HDBaseT In', type: 'hdbaset', direction: 'input', count: 2 },
        { label: 'HDMI Out', type: 'hdmi', direction: 'output', count: 1 },
        { label: 'HDBaseT Out', type: 'hdbaset', direction: 'output', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80, apiBasePath: '/api' },
      features: ['4x2 matrix', 'HDBaseT 2.0', 'Audio de-embedding', 'Compact half-rack'],
    },

    {
      modelId: 'lw-mmx8x4-ht420',
      modelName: 'MMX8x4-HT420',
      category: 'matrix-switcher',
      rackUnits: 1,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'HDMI In', type: 'hdmi', direction: 'input', count: 4 },
        { label: 'HDBaseT In', type: 'hdbaset', direction: 'input', count: 4 },
        { label: 'HDMI Out', type: 'hdmi', direction: 'output', count: 2 },
        { label: 'HDBaseT Out', type: 'hdbaset', direction: 'output', count: 2 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80, apiBasePath: '/api' },
      features: ['8x4 matrix', 'HDBaseT 2.0', '4K60 support', 'Audio embedding', 'RS-232 control'],
    },

    // ─── UBEX Fiber Extenders ─────────────────────────────────────

    {
      modelId: 'lw-ubex-pro20-f100',
      modelName: 'UBEX-Pro20-HDMI-F100',
      category: 'fiber-extender',
      rackUnits: 1,
      formFactor: 'half-rack',
      defaultPorts: [
        { label: 'HDMI In', type: 'hdmi', direction: 'input', count: 1 },
        { label: 'SFP+', type: 'sfp', direction: 'output', count: 2 },
        { label: 'USB', type: 'usb', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80, apiBasePath: '/api' },
      features: ['4K60 over fiber', 'USB 2.0 extension', 'Zero-compression', '10G SFP+'],
      description: 'Pro-grade fiber transmitter for zero-latency 4K60 extension over 10G.',
    },

    {
      modelId: 'lw-ubex-pro20-r100',
      modelName: 'UBEX-Pro20-HDMI-R100',
      category: 'fiber-extender',
      rackUnits: 1,
      formFactor: 'half-rack',
      defaultPorts: [
        { label: 'SFP+', type: 'sfp', direction: 'input', count: 2 },
        { label: 'HDMI Out', type: 'hdmi', direction: 'output', count: 1 },
        { label: 'USB', type: 'usb', direction: 'output', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80, apiBasePath: '/api' },
      features: ['4K60 fiber receiver', 'USB 2.0 extension', 'Zero-compression', '10G SFP+'],
    },

    {
      modelId: 'lw-ubex-pro20-f210',
      modelName: 'UBEX-Pro20-HDMI-F210',
      category: 'fiber-extender',
      rackUnits: 1,
      formFactor: 'half-rack',
      defaultPorts: [
        { label: 'HDMI In', type: 'hdmi', direction: 'input', count: 1 },
        { label: 'SFP+', type: 'sfp', direction: 'output', count: 2 },
        { label: 'USB', type: 'usb', direction: 'input', count: 2 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80, apiBasePath: '/api' },
      features: ['4K60 over fiber', 'USB 2.0 multi-port', '10G SFP+', 'HDCP 2.2', 'Zero-latency'],
    },

    // ─── Taurus UCX / TPX / TPN Series ───────────────────────────

    {
      modelId: 'lw-taurus-ucx-4x2',
      modelName: 'Taurus UCX-4x2-HC40',
      category: 'matrix-switcher',
      rackUnits: 1,
      formFactor: 'half-rack',
      defaultPorts: [
        { label: 'USB-C In', type: 'usb', direction: 'input', count: 2 },
        { label: 'HDMI In', type: 'hdmi', direction: 'input', count: 2 },
        { label: 'HDMI Out', type: 'hdmi', direction: 'output', count: 2 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80, apiBasePath: '/api' },
      features: ['4x2 USB-C/HDMI matrix', '4K60 switching', 'USB-C with power delivery', 'Dante audio', 'AV-over-IP'],
      description: 'Unified collaboration matrix with USB-C, HDMI, and Dante over 1GbE.',
    },

    {
      modelId: 'lw-taurus-tpx-tx220',
      modelName: 'Taurus TPX-TX220',
      category: 'encoder-decoder',
      rackUnits: 1,
      formFactor: 'half-rack',
      defaultPorts: [
        { label: 'HDMI In', type: 'hdmi', direction: 'input', count: 1 },
        { label: 'HDBaseT Out', type: 'hdbaset', direction: 'output', count: 1 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80, apiBasePath: '/api' },
      features: ['HDBaseT transmitter', '4K60 extension', 'PoH power output', 'RS-232 pass-through', '100m range'],
    },

    {
      modelId: 'lw-taurus-tpx-rx220',
      modelName: 'Taurus TPX-RX220',
      category: 'encoder-decoder',
      rackUnits: 1,
      formFactor: 'half-rack',
      defaultPorts: [
        { label: 'HDBaseT In', type: 'hdbaset', direction: 'input', count: 1 },
        { label: 'HDMI Out', type: 'hdmi', direction: 'output', count: 1 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80, apiBasePath: '/api' },
      features: ['HDBaseT receiver', '4K60 extension', 'PoH powered', 'RS-232 pass-through', '100m range'],
    },

    {
      modelId: 'lw-taurus-tpn-tx220-plus',
      modelName: 'Taurus TPN-TX220-Plus',
      category: 'encoder-decoder',
      rackUnits: 1,
      formFactor: 'half-rack',
      defaultPorts: [
        { label: 'HDMI In', type: 'hdmi', direction: 'input', count: 1 },
        { label: 'Ethernet', type: 'ethernet', direction: 'output', count: 2 },
        { label: 'USB', type: 'usb', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80, apiBasePath: '/api' },
      features: ['4K60 AV-over-IP transmitter', '1GbE network output', 'USB extension', 'Zero-frame latency', 'HDCP 2.2'],
      description: 'AV-over-IP 4K60 encoder transmitter for 1GbE network distribution.',
    },

    {
      modelId: 'lw-taurus-tpn-rx220-plus',
      modelName: 'Taurus TPN-RX220-Plus',
      category: 'encoder-decoder',
      rackUnits: 1,
      formFactor: 'half-rack',
      defaultPorts: [
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 2 },
        { label: 'HDMI Out', type: 'hdmi', direction: 'output', count: 1 },
        { label: 'USB', type: 'usb', direction: 'output', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80, apiBasePath: '/api' },
      features: ['4K60 AV-over-IP receiver', '1GbE network input', 'USB extension', 'Zero-frame latency', 'HDCP 2.2'],
    },

    // ─── VINX AV-over-IP Encoders / Decoders ─────────────────────

    {
      modelId: 'lw-vinx-120-enc',
      modelName: 'VINX-120-HDMI-ENC',
      category: 'encoder-decoder',
      rackUnits: 1,
      formFactor: 'half-rack',
      defaultPorts: [
        { label: 'HDMI In', type: 'hdmi', direction: 'input', count: 1 },
        { label: 'Ethernet', type: 'ethernet', direction: 'output', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80, apiBasePath: '/api' },
      features: ['4K60 AV-over-IP encoder', '1GbE output', 'Low latency', 'HDCP 2.2'],
      description: 'Compact 4K60 HDMI encoder for 1GbE AV-over-IP distribution.',
    },

    {
      modelId: 'lw-vinx-120-dec',
      modelName: 'VINX-120-HDMI-DEC',
      category: 'encoder-decoder',
      rackUnits: 1,
      formFactor: 'half-rack',
      defaultPorts: [
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
        { label: 'HDMI Out', type: 'hdmi', direction: 'output', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80, apiBasePath: '/api' },
      features: ['4K60 AV-over-IP decoder', '1GbE input', 'Low latency', 'HDCP 2.2'],
    },

    {
      modelId: 'lw-vinx-110-enc',
      modelName: 'VINX-110-HDMI-ENC',
      category: 'encoder-decoder',
      rackUnits: 1,
      formFactor: 'half-rack',
      defaultPorts: [
        { label: 'HDMI In', type: 'hdmi', direction: 'input', count: 1 },
        { label: 'Ethernet', type: 'ethernet', direction: 'output', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80, apiBasePath: '/api' },
      features: ['4K30 AV-over-IP encoder', '1GbE output', 'Visually lossless', 'EDID management'],
    },

    {
      modelId: 'lw-vinx-110-dec',
      modelName: 'VINX-110-HDMI-DEC',
      category: 'encoder-decoder',
      rackUnits: 1,
      formFactor: 'half-rack',
      defaultPorts: [
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
        { label: 'HDMI Out', type: 'hdmi', direction: 'output', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80, apiBasePath: '/api' },
      features: ['4K30 AV-over-IP decoder', '1GbE input', 'Visually lossless', 'EDID management'],
    },

    // ─── Distribution Amplifiers ──────────────────────────────────

    {
      modelId: 'lw-da4-hdmi20',
      modelName: 'DA4-HDMI20',
      category: 'converter',
      rackUnits: 1,
      formFactor: 'half-rack',
      defaultPorts: [
        { label: 'HDMI In', type: 'hdmi', direction: 'input', count: 1 },
        { label: 'HDMI Out', type: 'hdmi', direction: 'output', count: 4 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80, apiBasePath: '/api' },
      features: ['1-in 4-out distribution', 'HDMI 2.0', '4K60 4:4:4', 'EDID management', 'HDR10 pass-through'],
      description: 'Professional HDMI 2.0 distribution amplifier with 4K60 and HDR10 support.',
    },
  ],
};
