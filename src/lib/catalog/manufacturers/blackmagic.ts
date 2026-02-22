import { CatalogManufacturer } from '@/types';

export const blackmagicCatalog: CatalogManufacturer = {
  id: 'blackmagic',
  displayName: 'Blackmagic Design',
  brandColor: '#607d8b',
  website: 'https://www.blackmagicdesign.com',
  products: [
    // ─── Videohub Routers (TCP :9990) ──────────────────────────

    {
      modelId: 'bmd-vh-smart-12x12',
      modelName: 'Smart Videohub 12x12',
      category: 'matrix-switcher',
      rackUnits: 1,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 12 },
        { label: 'SDI Out', type: 'sdi', direction: 'output', count: 12 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'tcp', defaultPort: 9990, notes: 'Videohub Ethernet Protocol' },
      features: ['6G-SDI', '12x12 non-blocking routing', 'Front panel buttons', 'Deck control RS-422'],
      description: 'Compact 1RU 6G-SDI router supporting up to 2160p30 per port.',
    },

    {
      modelId: 'bmd-vh-smart-20x20',
      modelName: 'Smart Videohub 20x20',
      category: 'matrix-switcher',
      rackUnits: 2,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 20 },
        { label: 'SDI Out', type: 'sdi', direction: 'output', count: 20 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'tcp', defaultPort: 9990, notes: 'Videohub Ethernet Protocol' },
      features: ['12G-SDI', '20x20 non-blocking routing', 'Front panel LCD', 'Deck control RS-422'],
      description: '2RU 12G-SDI router supporting single-link 4K up to 2160p60.',
    },

    {
      modelId: 'bmd-vh-smart-40x40',
      modelName: 'Smart Videohub 40x40',
      category: 'matrix-switcher',
      rackUnits: 4,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 40 },
        { label: 'SDI Out', type: 'sdi', direction: 'output', count: 40 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'tcp', defaultPort: 9990, notes: 'Videohub Ethernet Protocol' },
      features: ['12G-SDI', '40x40 non-blocking routing', 'Redundant PSU', 'Deck control RS-422'],
      description: 'Large-format 4RU 12G-SDI broadcast router for live production.',
    },

    {
      modelId: 'bmd-vh-universal-72',
      modelName: 'Universal Videohub 72',
      category: 'matrix-switcher',
      rackUnits: 20,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 72 },
        { label: 'SDI Out', type: 'sdi', direction: 'output', count: 72 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 2 },
      ],
      connectionInfo: { protocol: 'tcp', defaultPort: 9990, notes: 'Videohub Ethernet Protocol' },
      features: ['12G-SDI', '72x72 non-blocking routing', 'Redundant PSU and cooling', 'Remote control panel support'],
      description: '20RU enterprise-grade 72x72 12G-SDI router with redundant power.',
    },

    {
      modelId: 'bmd-vh-universal-288',
      modelName: 'Universal Videohub 288',
      category: 'matrix-switcher',
      rackUnits: 40,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 288 },
        { label: 'SDI Out', type: 'sdi', direction: 'output', count: 288 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 2 },
      ],
      connectionInfo: { protocol: 'tcp', defaultPort: 9990, notes: 'Videohub Ethernet Protocol' },
      features: ['12G-SDI', '288x288 fully non-blocking', 'Redundant control cards', 'Hot-swap power supplies'],
      description: '40RU flagship 288x288 12G-SDI broadcast router for large facilities.',
    },

    {
      modelId: 'bmd-vh-micro',
      modelName: 'Micro Videohub',
      category: 'matrix-switcher',
      rackUnits: 1,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 4 },
        { label: 'SDI Out', type: 'sdi', direction: 'output', count: 16 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'tcp', defaultPort: 9990, notes: 'Videohub Ethernet Protocol' },
      features: ['3G-SDI', '4x16 routing', 'Compact 1RU', 'USB control'],
      description: 'Entry-level 4-input 16-output SDI distribution router.',
    },

    {
      modelId: 'bmd-vh-cleanswitch-12x12',
      modelName: 'Smart Videohub CleanSwitch 12x12',
      category: 'matrix-switcher',
      rackUnits: 1,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 12 },
        { label: 'SDI Out', type: 'sdi', direction: 'output', count: 12 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'tcp', defaultPort: 9990, notes: 'Videohub Ethernet Protocol' },
      features: ['6G-SDI', 'Re-syncing clean switch', 'Glitch-free transitions', 'Built-in frame sync on all outputs'],
      description: '1RU 12x12 6G-SDI router with per-output re-synchronization for glitch-free switching.',
    },

    // ─── ATEM Production Switchers (REST :80) ─────────────────

    {
      modelId: 'bmd-atem-constellation-8k',
      modelName: 'ATEM Constellation 8K',
      category: 'production-switcher',
      rackUnits: 4,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 40 },
        { label: 'SDI Out', type: 'sdi', direction: 'output', count: 24 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: ['8K switching', '40 SDI inputs', '4 M/E buses', 'SuperSource and DVE', 'Fairlight audio DSP'],
      description: 'Flagship 4RU production switcher with native 8K capability and 40 inputs.',
    },

    {
      modelId: 'bmd-atem-4me-constellation-hd',
      modelName: 'ATEM 4 M/E Constellation HD',
      category: 'production-switcher',
      rackUnits: 4,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 20 },
        { label: 'SDI Out', type: 'sdi', direction: 'output', count: 12 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: ['4 M/E buses', '20 SDI inputs', 'SuperSource', 'DVE', 'Fairlight audio DSP'],
      description: '4RU HD production switcher with 4 M/E buses and 20 SDI inputs.',
    },

    {
      modelId: 'bmd-atem-2me-constellation-hd',
      modelName: 'ATEM 2 M/E Constellation HD',
      category: 'production-switcher',
      rackUnits: 2,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 20 },
        { label: 'SDI Out', type: 'sdi', direction: 'output', count: 12 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: ['2 M/E buses', '20 SDI inputs', 'SuperSource', 'DVE', 'Fairlight audio DSP'],
      description: '2RU HD production switcher with 2 M/E buses and 20 SDI inputs.',
    },

    {
      modelId: 'bmd-atem-1me-constellation-hd',
      modelName: 'ATEM 1 M/E Constellation HD',
      category: 'production-switcher',
      rackUnits: 1,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 10 },
        { label: 'SDI Out', type: 'sdi', direction: 'output', count: 6 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: ['1 M/E bus', '10 SDI inputs', 'SuperSource', 'DVE', 'Fairlight audio DSP'],
      description: 'Compact 1RU HD production switcher with 10 SDI inputs.',
    },

    {
      modelId: 'bmd-atem-tv-studio-4k8',
      modelName: 'ATEM Television Studio 4K8',
      category: 'production-switcher',
      rackUnits: 1,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 4 },
        { label: 'HDMI In', type: 'hdmi', direction: 'input', count: 4 },
        { label: 'SDI Out', type: 'sdi', direction: 'output', count: 2 },
        { label: 'HDMI Out', type: 'hdmi', direction: 'output', count: 1 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: ['4K60 switching', '8 mixed inputs (SDI + HDMI)', 'Built-in streaming encoder', 'Fairlight audio'],
      description: '1RU production switcher with 4 SDI and 4 HDMI inputs supporting up to 4K60.',
    },

    {
      modelId: 'bmd-atem-mini-extreme-iso',
      modelName: 'ATEM Mini Extreme ISO',
      category: 'production-switcher',
      rackUnits: 0,
      formFactor: 'desktop',
      defaultPorts: [
        { label: 'HDMI In', type: 'hdmi', direction: 'input', count: 8 },
        { label: 'USB-C Out', type: 'usb', direction: 'output', count: 1 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: ['8 HDMI inputs', 'ISO recording all inputs', 'USB-C streaming output', 'Built-in chroma key'],
      description: 'Desktop production switcher with 8 HDMI inputs and individual ISO recording.',
    },

    // ─── HyperDeck Recorders (TCP :9993) ──────────────────────

    {
      modelId: 'bmd-hyperdeck-studio-4k-pro',
      modelName: 'HyperDeck Studio 4K Pro',
      category: 'recorder',
      rackUnits: 1,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 2 },
        { label: 'SDI Out', type: 'sdi', direction: 'output', count: 2 },
        { label: 'HDMI Out', type: 'hdmi', direction: 'output', count: 1 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'tcp', defaultPort: 9993, notes: 'HyperDeck Ethernet Protocol' },
      features: ['12G-SDI', '4K ProRes and H.265 recording', 'Dual CFast/SD slots', 'Timecode and genlock'],
      description: '1RU 4K broadcast recorder with 12G-SDI and dual media slots.',
    },

    {
      modelId: 'bmd-hyperdeck-studio-hd-pro',
      modelName: 'HyperDeck Studio HD Pro',
      category: 'recorder',
      rackUnits: 1,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 2 },
        { label: 'SDI Out', type: 'sdi', direction: 'output', count: 2 },
        { label: 'HDMI Out', type: 'hdmi', direction: 'output', count: 1 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'tcp', defaultPort: 9993, notes: 'HyperDeck Ethernet Protocol' },
      features: ['3G-SDI', 'HD ProRes and H.265 recording', 'Dual CFast/SD slots', 'RS-422 deck control'],
      description: '1RU HD broadcast recorder with 3G-SDI and RS-422 deck control.',
    },

    {
      modelId: 'bmd-hyperdeck-studio-hd-plus',
      modelName: 'HyperDeck Studio HD Plus',
      category: 'recorder',
      rackUnits: 1,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 1 },
        { label: 'SDI Out', type: 'sdi', direction: 'output', count: 1 },
        { label: 'HDMI In', type: 'hdmi', direction: 'input', count: 1 },
        { label: 'HDMI Out', type: 'hdmi', direction: 'output', count: 1 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'tcp', defaultPort: 9993, notes: 'HyperDeck Ethernet Protocol' },
      features: ['3G-SDI and HDMI inputs', 'HD ProRes recording', 'USB-C media', 'Network file transfer'],
      description: '1RU HD recorder with both SDI and HDMI inputs for flexible integration.',
    },

    {
      modelId: 'bmd-hyperdeck-studio-mini',
      modelName: 'HyperDeck Studio Mini',
      category: 'recorder',
      rackUnits: 1,
      formFactor: 'half-rack',
      defaultPorts: [
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 1 },
        { label: 'SDI Out', type: 'sdi', direction: 'output', count: 1 },
        { label: 'HDMI Out', type: 'hdmi', direction: 'output', count: 1 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'tcp', defaultPort: 9993, notes: 'HyperDeck Ethernet Protocol' },
      features: ['6G-SDI', 'UHD ProRes recording', 'CFast 2.0 and SD slots', 'Compact half-rack'],
      description: 'Half-rack 6G-SDI recorder for UHD production.',
    },

    {
      modelId: 'bmd-hyperdeck-extreme-8k-hdr',
      modelName: 'HyperDeck Extreme 8K HDR',
      category: 'recorder',
      rackUnits: 0,
      formFactor: 'desktop',
      defaultPorts: [
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 4 },
        { label: 'SDI Out', type: 'sdi', direction: 'output', count: 4 },
        { label: 'HDMI Out', type: 'hdmi', direction: 'output', count: 1 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'tcp', defaultPort: 9993, notes: 'HyperDeck Ethernet Protocol' },
      features: ['8K Quad-link 12G-SDI', 'HDR recording', 'CFast 2.0 dual slots', 'Built-in LCD monitor'],
      description: 'Desktop 8K HDR recorder using Quad-link 12G-SDI with built-in touchscreen.',
    },

    // ─── Converters (REST :80, /control/api/v1) ───────────────

    {
      modelId: 'bmd-teranex-mini-sdi-hdmi-12g',
      modelName: 'Teranex Mini SDI to HDMI 12G',
      category: 'converter',
      rackUnits: 1,
      formFactor: 'half-rack',
      defaultPorts: [
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 1 },
        { label: 'HDMI Out', type: 'hdmi', direction: 'output', count: 1 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80, apiBasePath: '/control/api/v1' },
      features: ['12G-SDI input', 'HDMI 2.0 output', 'HDR metadata passthrough', 'Front panel LCD and controls'],
      description: 'Half-rack 12G-SDI to HDMI 2.0 converter with HDR support.',
    },

    {
      modelId: 'bmd-teranex-mini-hdmi-sdi-12g',
      modelName: 'Teranex Mini HDMI to SDI 12G',
      category: 'converter',
      rackUnits: 1,
      formFactor: 'half-rack',
      defaultPorts: [
        { label: 'HDMI In', type: 'hdmi', direction: 'input', count: 1 },
        { label: 'SDI Out', type: 'sdi', direction: 'output', count: 1 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80, apiBasePath: '/control/api/v1' },
      features: ['HDMI 2.0 input', '12G-SDI output', 'HDR passthrough', 'Front panel LCD and controls'],
      description: 'Half-rack HDMI 2.0 to 12G-SDI converter for broadcast integration.',
    },

    {
      modelId: 'bmd-teranex-av',
      modelName: 'Teranex AV',
      category: 'converter',
      rackUnits: 1,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 2 },
        { label: 'HDMI In', type: 'hdmi', direction: 'input', count: 1 },
        { label: 'SDI Out', type: 'sdi', direction: 'output', count: 2 },
        { label: 'HDMI Out', type: 'hdmi', direction: 'output', count: 1 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80, apiBasePath: '/control/api/v1' },
      features: ['Up/down/cross conversion', 'Standards conversion', 'Frame rate conversion', 'Noise reduction'],
      description: '1RU standards converter supporting up, down, and cross conversion with advanced processing.',
    },

    {
      modelId: 'bmd-mini-converter-sdi-hdmi-6g',
      modelName: 'Mini Converter SDI to HDMI 6G',
      category: 'converter',
      rackUnits: 0,
      formFactor: 'portable',
      defaultPorts: [
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 1 },
        { label: 'SDI Out', type: 'sdi', direction: 'output', count: 1 },
        { label: 'HDMI Out', type: 'hdmi', direction: 'output', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80, apiBasePath: '/control/api/v1', notes: 'USB config only; no network port' },
      features: ['6G-SDI input with loop-through', 'HDMI 1.4 output', 'Supports UHD up to 2160p30', 'USB-powered'],
      description: 'Portable 6G-SDI to HDMI converter with SDI loop-through output.',
    },

    {
      modelId: 'bmd-mini-converter-hdmi-sdi-6g',
      modelName: 'Mini Converter HDMI to SDI 6G',
      category: 'converter',
      rackUnits: 0,
      formFactor: 'portable',
      defaultPorts: [
        { label: 'HDMI In', type: 'hdmi', direction: 'input', count: 1 },
        { label: 'SDI Out', type: 'sdi', direction: 'output', count: 2 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80, apiBasePath: '/control/api/v1', notes: 'USB config only; no network port' },
      features: ['HDMI 1.4 input', 'Dual 6G-SDI outputs', 'HDCP removal', 'USB-powered'],
      description: 'Portable HDMI to dual 6G-SDI converter for broadcast infrastructure integration.',
    },

    {
      modelId: 'bmd-mini-converter-optical-fiber-12g',
      modelName: 'Mini Converter Optical Fiber 12G',
      category: 'converter',
      rackUnits: 0,
      formFactor: 'portable',
      defaultPorts: [
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 1 },
        { label: 'SDI Out', type: 'sdi', direction: 'output', count: 1 },
        { label: 'SFP', type: 'sfp', direction: 'input', count: 1 },
        { label: 'SFP', type: 'sfp', direction: 'output', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80, apiBasePath: '/control/api/v1', notes: 'USB config only; no network port' },
      features: ['12G-SDI to/from optical fiber', 'SFP cage accepts single/multimode modules', 'Bidirectional conversion', 'USB-powered'],
      description: 'Portable bidirectional 12G-SDI to optical fiber converter with SFP cage.',
    },

    {
      modelId: 'bmd-micro-converter-sdi-hdmi-12g',
      modelName: 'Micro Converter SDI to HDMI 12G',
      category: 'converter',
      rackUnits: 0,
      formFactor: 'portable',
      defaultPorts: [
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 1 },
        { label: 'HDMI Out', type: 'hdmi', direction: 'output', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80, apiBasePath: '/control/api/v1', notes: 'USB config only; no network port' },
      features: ['12G-SDI input', 'HDMI 2.0 output', '4K60 capable', 'Pocket-sized with USB-C power'],
      description: 'Ultra-compact 12G-SDI to HDMI 2.0 micro converter supporting 4K60.',
    },

    {
      modelId: 'bmd-micro-converter-hdmi-sdi-12g',
      modelName: 'Micro Converter HDMI to SDI 12G',
      category: 'converter',
      rackUnits: 0,
      formFactor: 'portable',
      defaultPorts: [
        { label: 'HDMI In', type: 'hdmi', direction: 'input', count: 1 },
        { label: 'SDI Out', type: 'sdi', direction: 'output', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80, apiBasePath: '/control/api/v1', notes: 'USB config only; no network port' },
      features: ['HDMI 2.0 input', '12G-SDI output', '4K60 capable', 'Pocket-sized with USB-C power'],
      description: 'Ultra-compact HDMI 2.0 to 12G-SDI micro converter supporting 4K60.',
    },

    {
      modelId: 'bmd-micro-converter-bidirectional-12g',
      modelName: 'Micro Converter Bidirectional SDI/HDMI 12G',
      category: 'converter',
      rackUnits: 0,
      formFactor: 'portable',
      defaultPorts: [
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 1 },
        { label: 'SDI Out', type: 'sdi', direction: 'output', count: 1 },
        { label: 'HDMI In', type: 'hdmi', direction: 'input', count: 1 },
        { label: 'HDMI Out', type: 'hdmi', direction: 'output', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80, apiBasePath: '/control/api/v1', notes: 'USB config only; no network port' },
      features: ['Bidirectional SDI/HDMI conversion', '12G-SDI and HDMI 2.0', '4K60 capable', 'Single USB-C powered unit'],
      description: 'Pocket-sized bidirectional 12G-SDI and HDMI 2.0 converter in a single unit.',
    },

    // ─── Multiviewers ─────────────────────────────────────────

    {
      modelId: 'bmd-multiview-16',
      modelName: 'MultiView 16',
      category: 'multiviewer',
      rackUnits: 1,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 16 },
        { label: 'SDI Out', type: 'sdi', direction: 'output', count: 1 },
        { label: 'HDMI Out', type: 'hdmi', direction: 'output', count: 1 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80, apiBasePath: '/control/api/v1' },
      features: ['16 SDI inputs', 'Configurable layout', 'Audio meters per source', 'UHD output'],
      description: '1RU 16-input SDI multiviewer with configurable layout and UHD output.',
    },

    {
      modelId: 'bmd-multiview-4',
      modelName: 'MultiView 4',
      category: 'multiviewer',
      rackUnits: 1,
      formFactor: 'half-rack',
      defaultPorts: [
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 4 },
        { label: 'SDI Out', type: 'sdi', direction: 'output', count: 1 },
        { label: 'HDMI Out', type: 'hdmi', direction: 'output', count: 1 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80, apiBasePath: '/control/api/v1' },
      features: ['4 SDI inputs', 'Quad-split and solo modes', 'Tally indicators', 'Compact half-rack'],
      description: 'Half-rack 4-input SDI multiviewer with tally support.',
    },

    // ─── Streaming Processors ─────────────────────────────────

    {
      modelId: 'bmd-web-presenter-4k',
      modelName: 'Web Presenter 4K',
      category: 'streaming-processor',
      rackUnits: 1,
      formFactor: 'half-rack',
      defaultPorts: [
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 1 },
        { label: 'HDMI In', type: 'hdmi', direction: 'input', count: 1 },
        { label: 'USB-C Out', type: 'usb', direction: 'output', count: 1 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80, apiBasePath: '/control/api/v1' },
      features: ['4K SDI and HDMI inputs', 'USB-C webcam output', 'H.264 streaming encoder', 'Teaming with HyperDeck'],
      description: 'Half-rack 4K streaming device that converts SDI/HDMI to USB-C webcam for software-based streaming.',
    },

    {
      modelId: 'bmd-web-presenter-hd',
      modelName: 'Web Presenter HD',
      category: 'streaming-processor',
      rackUnits: 1,
      formFactor: 'half-rack',
      defaultPorts: [
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 1 },
        { label: 'HDMI In', type: 'hdmi', direction: 'input', count: 1 },
        { label: 'USB Out', type: 'usb', direction: 'output', count: 1 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80, apiBasePath: '/control/api/v1' },
      features: ['HD SDI and HDMI inputs', 'USB webcam output', 'H.264 streaming encoder', 'Works with any streaming software'],
      description: 'Half-rack HD streaming device presenting as a USB webcam to any streaming application.',
    },

    // ─── DeckLink Capture Cards ────────────────────────────────

    {
      modelId: 'bmd-decklink-8k-pro',
      modelName: 'DeckLink 8K Pro',
      category: 'converter',
      rackUnits: 0,
      formFactor: 'card',
      defaultPorts: [
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 4 },
        { label: 'SDI Out', type: 'sdi', direction: 'output', count: 4 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80, notes: 'PCIe card — no network port; controlled via Desktop Video API' },
      features: ['Quad-link 12G-SDI', '8K capture and playback', 'Hardware keying', 'Genlock and reference'],
      description: 'PCIe capture card with Quad-link 12G-SDI for 8K capture and playback.',
    },

    {
      modelId: 'bmd-decklink-quad-hdmi-recorder',
      modelName: 'DeckLink Quad HDMI Recorder',
      category: 'converter',
      rackUnits: 0,
      formFactor: 'card',
      defaultPorts: [
        { label: 'HDMI In', type: 'hdmi', direction: 'input', count: 4 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80, notes: 'PCIe card — no network port; controlled via Desktop Video API' },
      features: ['4x simultaneous HDMI capture', 'Up to 4K60 per channel', 'Ideal for multi-camera capture', 'Low-latency preview'],
      description: 'PCIe card capturing four independent HDMI sources simultaneously at up to 4K60.',
    },
  ],
};
