import { CatalogManufacturer } from '@/types';

export const rossCatalog: CatalogManufacturer = {
  id: 'ross',
  displayName: 'Ross Video',
  brandColor: '#9c27b0',
  website: 'https://www.rossvideo.com',
  products: [
    // ─── Production Switchers ──────────────────────────────────────

    {
      modelId: 'ross-carbonite-bp',
      modelName: 'Carbonite Black Plus',
      category: 'production-switcher',
      rackUnits: 3,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 24 },
        { label: 'SDI Out', type: 'sdi', direction: 'output', count: 16 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 2 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        '2 M/E production switcher',
        '24 SDI inputs, 16 SDI outputs',
        'Integrated MultiViewer',
        'UltraChrome keying',
        'Built-in frame sync on all inputs',
      ],
      description: 'Compact 3RU production switcher with 2 M/E and UltraChrome keying for live events.',
    },

    {
      modelId: 'ross-carbonite-ultra',
      modelName: 'Carbonite Ultra',
      category: 'production-switcher',
      rackUnits: 4,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 36 },
        { label: 'SDI Out', type: 'sdi', direction: 'output', count: 24 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 2 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        '3 M/E production switcher',
        '36 SDI inputs, 24 SDI outputs',
        '4K-capable signal path',
        'XPression CG built-in option',
        'Integrated MultiViewer with multiple outputs',
      ],
      description: '4RU flagship Carbonite switcher with 3 M/E, 36 inputs, and optional integrated XPression CG.',
    },

    {
      modelId: 'ross-carbonite-bp-12g',
      modelName: 'Carbonite Black Plus 12G',
      category: 'production-switcher',
      rackUnits: 3,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 24 },
        { label: 'SDI Out', type: 'sdi', direction: 'output', count: 16 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 2 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        '2 M/E production switcher with 12G-SDI',
        '4K native single-link 12G-SDI I/O',
        'UltraChrome chroma and linear keying',
        'Integrated MultiViewer on 12G-SDI output',
        'Compact 3RU chassis for mobile production',
      ],
      description: '3RU 12G-SDI production switcher supporting 4K native workflows with 2 M/E and UltraChrome keying.',
    },

    {
      modelId: 'ross-acuity',
      modelName: 'Acuity',
      category: 'production-switcher',
      rackUnits: 8,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 48 },
        { label: 'SDI Out', type: 'sdi', direction: 'output', count: 32 },
        { label: 'NDI', type: 'ndi', direction: 'input', count: 1 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 4 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        '4+ M/E flagship broadcast production switcher',
        '48 SDI inputs and 32 SDI outputs',
        'NDI and IP gateway integration',
        'UltraChrome HR advanced keying engine',
        'Expandable I/O with optional card modules',
      ],
      description: '8RU flagship broadcast production switcher with 4+ M/E, 48 SDI inputs, and advanced IP integration.',
    },

    // ─── Matrix Switchers / Routers ────────────────────────────────

    {
      modelId: 'ross-ultrix-fr5',
      modelName: 'Ultrix-FR5',
      category: 'matrix-switcher',
      rackUnits: 5,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'SDI/IP In', type: 'sdi', direction: 'input', count: 80 },
        { label: 'SDI/IP Out', type: 'sdi', direction: 'output', count: 80 },
        { label: 'SFP', type: 'sfp', direction: 'input', count: 8 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 2 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        '80x80 SDI/IP hybrid routing matrix',
        'SMPTE ST 2110 IP media gateway',
        'Integrated MultiViewer — 4 outputs, 16 windows each',
        'Softgear processing engine',
        'Redundant power supplies and hot-swap modules',
      ],
      description: '5RU SDI/IP hybrid router with 80x80 capacity, SMPTE 2110 support, and built-in MultiViewer.',
    },

    {
      modelId: 'ross-ultrix-fr2',
      modelName: 'Ultrix-FR2',
      category: 'matrix-switcher',
      rackUnits: 2,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'SDI/IP In', type: 'sdi', direction: 'input', count: 32 },
        { label: 'SDI/IP Out', type: 'sdi', direction: 'output', count: 32 },
        { label: 'SFP', type: 'sfp', direction: 'input', count: 4 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 2 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        '32x32 SDI/IP hybrid routing matrix',
        'SMPTE ST 2110 IP media support',
        'Softgear processing and MultiViewer option',
        'Compact 2RU chassis for OB and studios',
        'SFP slots for fiber connectivity',
      ],
      description: '2RU compact SDI/IP hybrid router with 32x32 capacity and optional integrated MultiViewer.',
    },

    {
      modelId: 'ross-ultrix-fr1',
      modelName: 'Ultrix-FR1',
      category: 'matrix-switcher',
      rackUnits: 1,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'SDI/IP In', type: 'sdi', direction: 'input', count: 16 },
        { label: 'SDI/IP Out', type: 'sdi', direction: 'output', count: 16 },
        { label: 'SFP', type: 'sfp', direction: 'input', count: 2 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 2 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        '16x16 SDI/IP hybrid routing matrix',
        'SMPTE ST 2110 IP gateway support',
        'Compact 1RU chassis for space-constrained installs',
        'Softgear processing engine',
        'Unified REST and web-based control',
      ],
      description: '1RU entry-level SDI/IP hybrid router with 16x16 capacity and SMPTE 2110 support.',
    },

    {
      modelId: 'ross-nk-ips',
      modelName: 'NK-IPS',
      category: 'matrix-switcher',
      rackUnits: 2,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 64 },
        { label: 'SDI Out', type: 'sdi', direction: 'output', count: 64 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 2 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80, notes: 'SW-P-08 serial control protocol also supported' },
      features: [
        '64x64 clean and quiet SDI routing',
        'SW-P-08 third-party control protocol support',
        'Modular I/O card architecture',
        '2RU compact chassis with redundant PSU',
        'No frame sync required — transparent pass-through',
      ],
      description: '2RU 64x64 clean/quiet SDI router with modular I/O and SW-P-08 protocol support.',
    },

    {
      modelId: 'ross-nk-3g64',
      modelName: 'NK-3G64',
      category: 'matrix-switcher',
      rackUnits: 2,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 64 },
        { label: 'SDI Out', type: 'sdi', direction: 'output', count: 64 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 2 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        '64x64 3G-SDI routing matrix',
        'Modular card-based I/O architecture',
        'Supports SD, HD, and 3G-SDI signal formats',
        '2RU chassis with hot-swappable modules',
        'Redundant power supply option',
      ],
      description: '2RU modular 64x64 3G-SDI routing matrix with hot-swappable I/O cards.',
    },

    {
      modelId: 'ross-nk-3g34',
      modelName: 'NK-3G34',
      category: 'matrix-switcher',
      rackUnits: 1,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 34 },
        { label: 'SDI Out', type: 'sdi', direction: 'output', count: 34 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        '34x34 3G-SDI routing matrix in 1RU',
        'Supports SD, HD, and 3G-SDI formats',
        'Compact fixed I/O chassis',
        'Web-based and third-party control support',
        'Cost-effective for small facility routing',
      ],
      description: '1RU compact 34x34 3G-SDI routing matrix for small-to-mid facility deployments.',
    },

    // ─── Graphics ──────────────────────────────────────────────────

    {
      modelId: 'ross-xpression',
      modelName: 'XPression',
      category: 'graphics-processor',
      rackUnits: 4,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'SDI Out', type: 'sdi', direction: 'output', count: 4 },
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 2 },
        { label: 'NDI', type: 'ndi', direction: 'output', count: 1 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 2 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        'Real-time 3D character generator and CG engine',
        'Multi-channel simultaneous output',
        'Social media and data integration',
        'NDI output for IP workflows',
        'Sports scoring and data-driven graphics',
      ],
      description: '4RU real-time 3D motion graphics and CG system for broadcast and live events.',
    },

    {
      modelId: 'ross-xpression-bluebox',
      modelName: 'XPression BlueBox',
      category: 'graphics-processor',
      rackUnits: 2,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'SDI Out', type: 'sdi', direction: 'output', count: 2 },
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 1 },
        { label: 'NDI', type: 'ndi', direction: 'output', count: 1 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 2 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        'Compact 2RU real-time CG engine',
        'XPression graphics runtime on smaller chassis',
        'NDI output for IP-based distribution',
        'Social media and data-driven template support',
        'Ideal for satellite studios and remote production',
      ],
      description: '2RU compact XPression real-time CG system for smaller studios and remote production workflows.',
    },

    // ─── Multiviewers ──────────────────────────────────────────────

    {
      modelId: 'ross-ultrix-mv',
      modelName: 'Ultrix-MV',
      category: 'multiviewer',
      rackUnits: 5,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'SDI/IP In', type: 'sdi', direction: 'input', count: 80 },
        { label: 'SDI MV Out', type: 'sdi', direction: 'output', count: 4 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 2 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        '4 independent MultiViewer outputs from Ultrix frame',
        'Up to 16 windows per MultiViewer output',
        'Fully integrated within Ultrix-FR5 chassis',
        'Custom window layouts and UMD labels',
        'SMPTE 2110 source monitoring support',
      ],
      description: 'Integrated MultiViewer within the Ultrix-FR5, providing 4 MV outputs each with up to 16 windows.',
    },

    // ─── OpenGear Frames ───────────────────────────────────────────

    {
      modelId: 'ross-ogx-fr-cn-p',
      modelName: 'OGX-FR-CN-P',
      category: 'opengear-frame',
      rackUnits: 2,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 2 },
      ],
      connectionInfo: { protocol: 'dashboard', defaultPort: 5253, notes: 'Ross DashBoard control; openGear standard frame' },
      features: [
        '20-slot openGear frame in 2RU',
        'Dual redundant hot-swappable power supplies',
        'DashBoard network control and monitoring',
        'Front and rear card access',
        'Compatible with all openGear and Ross OGX cards',
      ],
      description: '2RU 20-slot openGear frame with dual redundant PSU and DashBoard network control.',
    },

    {
      modelId: 'ross-ogx-fr-c',
      modelName: 'OGX-FR-C',
      category: 'opengear-frame',
      rackUnits: 2,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'dashboard', defaultPort: 5253, notes: 'Ross DashBoard control; openGear standard frame' },
      features: [
        '20-slot openGear frame in 2RU',
        'Single internal power supply',
        'DashBoard network control and monitoring',
        'Cost-effective openGear chassis option',
        'Compatible with all openGear and Ross OGX cards',
      ],
      description: '2RU 20-slot openGear frame with single PSU and DashBoard network control.',
    },

    {
      modelId: 'ross-dfr-8321',
      modelName: 'DFR-8321',
      category: 'opengear-frame',
      rackUnits: 1,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'dashboard', defaultPort: 5253, notes: 'Ross DashBoard control; compact openGear frame' },
      features: [
        'Compact 1RU 10-slot openGear frame',
        'DashBoard network control and monitoring',
        'Ideal for small systems and satellite locations',
        'Single power supply with alarm contact',
        'Compatible with standard openGear cards',
      ],
      description: '1RU compact 10-slot openGear frame with DashBoard control for smaller installations.',
    },

    {
      modelId: 'ross-ogx-fr-12g',
      modelName: 'OGX-FR-12G',
      category: 'opengear-frame',
      rackUnits: 2,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 2 },
      ],
      connectionInfo: { protocol: 'dashboard', defaultPort: 5253, notes: 'Ross DashBoard control; 12G-SDI ready openGear frame' },
      features: [
        '20-slot openGear frame optimized for 12G-SDI cards',
        'Enhanced backplane power for 12G card demands',
        'Dual redundant hot-swappable power supplies',
        'DashBoard network monitoring and control',
        'Compatible with OGX 12G-SDI card series',
      ],
      description: '2RU 20-slot 12G-SDI-ready openGear frame with enhanced backplane and DashBoard control.',
    },

    {
      modelId: 'ross-rcp-nk',
      modelName: 'RCP-NK',
      category: 'opengear-frame',
      rackUnits: 1,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'dashboard', defaultPort: 5253, notes: 'DashBoard control; physical remote control panel for NK routers' },
      features: [
        '1RU openGear remote control panel for NK routers',
        'Physical pushbutton routing control',
        'DashBoard-integrated configuration',
        'Supports NK-IPS, NK-3G64, and NK-3G34 routers',
        'Salvo and preset recall from front panel',
      ],
      description: '1RU openGear remote control panel for Ross NK router series with DashBoard integration.',
    },

    // ─── OpenGear Cards ────────────────────────────────────────────

    {
      modelId: 'ross-ogx-da-cn',
      modelName: 'OGX-DA-CN',
      category: 'opengear-frame',
      rackUnits: 0,
      formFactor: 'card',
      defaultPorts: [
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 1 },
        { label: 'SDI Out', type: 'sdi', direction: 'output', count: 8 },
      ],
      connectionInfo: { protocol: 'dashboard', defaultPort: 5253, notes: 'Managed via DashBoard through parent openGear frame' },
      features: [
        '12G-SDI distribution amplifier — 1-in, 8-out',
        'Supports SD/HD/3G/6G/12G-SDI auto-detection',
        'Reclocked and re-equalized outputs',
        'DashBoard remote monitoring per card',
        'Hot-swappable within openGear frame',
      ],
      description: 'openGear 12G-SDI DA card with 1 input and 8 reclocked outputs, managed via DashBoard.',
    },

    {
      modelId: 'ross-ogx-fs-cn',
      modelName: 'OGX-FS-CN',
      category: 'opengear-frame',
      rackUnits: 0,
      formFactor: 'card',
      defaultPorts: [
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 1 },
        { label: 'SDI Out', type: 'sdi', direction: 'output', count: 2 },
        { label: 'Analog Ref In', type: 'analog-audio', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'dashboard', defaultPort: 5253, notes: 'Managed via DashBoard through parent openGear frame' },
      features: [
        '12G-SDI frame synchronizer and format converter',
        'Up/down/cross-conversion on a single card',
        'Genlock to analog black burst or tri-level sync',
        'DashBoard-configurable processing chain',
        'Hot-swappable within openGear frame',
      ],
      description: 'openGear 12G-SDI frame sync and up/down/cross-converter card with DashBoard control.',
    },

    {
      modelId: 'ross-ogx-usr-cn',
      modelName: 'OGX-USR-CN',
      category: 'opengear-frame',
      rackUnits: 0,
      formFactor: 'card',
      defaultPorts: [
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 1 },
        { label: 'SDI Out', type: 'sdi', direction: 'output', count: 2 },
      ],
      connectionInfo: { protocol: 'dashboard', defaultPort: 5253, notes: 'Managed via DashBoard through parent openGear frame' },
      features: [
        '12G-SDI up/down/cross-converter card',
        'Converts between SD, HD, and 4K/UHD formats',
        'Aspect ratio conversion and picture adjust',
        'DashBoard parameter control and preset storage',
        'Hot-swappable within openGear frame',
      ],
      description: 'openGear 12G-SDI up/down/cross-converter card with aspect ratio conversion and DashBoard control.',
    },

    {
      modelId: 'ross-sra-8601',
      modelName: 'SRA-8601',
      category: 'opengear-frame',
      rackUnits: 0,
      formFactor: 'card',
      defaultPorts: [
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 1 },
        { label: 'SDI Out', type: 'sdi', direction: 'output', count: 1 },
        { label: 'AES In', type: 'aes-ebu', direction: 'input', count: 4 },
        { label: 'Analog Audio In', type: 'analog-audio', direction: 'input', count: 8 },
      ],
      connectionInfo: { protocol: 'dashboard', defaultPort: 5253, notes: 'Managed via DashBoard through parent openGear frame' },
      features: [
        '8-channel SDI audio embedder and de-embedder',
        'Embeds AES/EBU and analog audio into SDI stream',
        'De-embeds audio groups from SDI to AES or analog',
        'Per-channel gain and delay control',
        'DashBoard remote configuration and monitoring',
      ],
      description: 'openGear 8-channel SDI audio embedder/de-embedder supporting AES/EBU and analog audio.',
    },

    {
      modelId: 'ross-spg-8260',
      modelName: 'SPG-8260',
      category: 'opengear-frame',
      rackUnits: 0,
      formFactor: 'card',
      defaultPorts: [
        { label: 'Ref Out (Black Burst)', type: 'analog-audio', direction: 'output', count: 4 },
        { label: 'Ref Out (Tri-Level)', type: 'analog-audio', direction: 'output', count: 4 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'dashboard', defaultPort: 5253, notes: 'Managed via DashBoard through parent openGear frame; GPS/LTC sync optional' },
      features: [
        'HD/SD sync pulse generator card',
        'Black burst and tri-level sync outputs',
        'NTP and GPS synchronization support',
        'LTC time code output option',
        'DashBoard monitoring and frequency adjustment',
      ],
      description: 'openGear HD/SD sync pulse generator card with black burst, tri-level sync, and DashBoard control.',
    },

    {
      modelId: 'ross-mux-8252',
      modelName: 'MUX-8252',
      category: 'opengear-frame',
      rackUnits: 0,
      formFactor: 'card',
      defaultPorts: [
        { label: 'SDI In (Quad-Link)', type: 'sdi', direction: 'input', count: 4 },
        { label: 'SDI Out (12G)', type: 'sdi', direction: 'output', count: 1 },
      ],
      connectionInfo: { protocol: 'dashboard', defaultPort: 5253, notes: 'Managed via DashBoard through parent openGear frame' },
      features: [
        '12G-SDI mux/demux for quad-link 4K signals',
        'Converts 4x 3G-SDI quad-link to single 12G-SDI',
        'Supports both mux and demux directions',
        'Transparent signal pass with reclocking',
        'DashBoard mode selection and monitoring',
      ],
      description: 'openGear 12G-SDI mux/demux card converting between quad-link 3G-SDI and single-link 12G-SDI.',
    },

    {
      modelId: 'ross-adc-8032',
      modelName: 'ADC-8032',
      category: 'opengear-frame',
      rackUnits: 0,
      formFactor: 'card',
      defaultPorts: [
        { label: 'Analog Audio In', type: 'analog-audio', direction: 'input', count: 2 },
        { label: 'AES Out', type: 'aes-ebu', direction: 'output', count: 2 },
      ],
      connectionInfo: { protocol: 'dashboard', defaultPort: 5253, notes: 'Managed via DashBoard through parent openGear frame' },
      features: [
        '2-channel analog to AES/EBU digital audio converter',
        'High-quality 24-bit A/D conversion',
        'Per-channel gain trim and metering',
        'Sample-rate conversion on output',
        'DashBoard monitoring and level control',
      ],
      description: 'openGear 2-channel analog to AES/EBU digital audio converter card with DashBoard control.',
    },

    {
      modelId: 'ross-dac-8016',
      modelName: 'DAC-8016',
      category: 'opengear-frame',
      rackUnits: 0,
      formFactor: 'card',
      defaultPorts: [
        { label: 'AES In', type: 'aes-ebu', direction: 'input', count: 2 },
        { label: 'Analog Audio Out', type: 'analog-audio', direction: 'output', count: 2 },
      ],
      connectionInfo: { protocol: 'dashboard', defaultPort: 5253, notes: 'Managed via DashBoard through parent openGear frame' },
      features: [
        '2-channel AES/EBU to analog audio converter',
        'High-quality 24-bit D/A conversion',
        'Per-channel output level trim and muting',
        'XLR balanced analog outputs',
        'DashBoard monitoring and configuration',
      ],
      description: 'openGear 2-channel AES/EBU to analog audio converter card with balanced XLR outputs and DashBoard control.',
    },
  ],
};
