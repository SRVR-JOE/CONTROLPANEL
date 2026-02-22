import { CatalogManufacturer } from '@/types';

export const ajaCatalog: CatalogManufacturer = {
  id: 'aja',
  displayName: 'AJA Video Systems',
  brandColor: '#ffc107',
  website: 'https://www.aja.com',
  products: [
    // ─── KUMO Routers ─────────────────────────────────────────────

    {
      modelId: 'aja-kumo-6464-12g',
      modelName: 'KUMO 6464-12G',
      category: 'matrix-switcher',
      rackUnits: 4,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 64 },
        { label: 'SDI Out', type: 'sdi', direction: 'output', count: 64 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 2 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        '64x64 12G-SDI routing',
        'Supports SD/HD/3G/6G/12G-SDI',
        'Redundant power supplies',
        'Web-based control UI',
        'Third-party control via REST API',
      ],
      description: 'Large-format 64x64 12G-SDI routing switcher in 4RU.',
    },

    {
      modelId: 'aja-kumo-3232-12g',
      modelName: 'KUMO 3232-12G',
      category: 'matrix-switcher',
      rackUnits: 2,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 32 },
        { label: 'SDI Out', type: 'sdi', direction: 'output', count: 32 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 2 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        '32x32 12G-SDI routing',
        'Supports SD/HD/3G/6G/12G-SDI auto-detection',
        'Embedded web UI for local control',
        'SNMP and REST API support',
        'Redundant power supplies',
      ],
      description: 'Compact 32x32 12G-SDI routing switcher in 2RU.',
    },

    {
      modelId: 'aja-kumo-1616-12g',
      modelName: 'KUMO 1616-12G',
      category: 'matrix-switcher',
      rackUnits: 1,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 16 },
        { label: 'SDI Out', type: 'sdi', direction: 'output', count: 16 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 2 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        '16x16 12G-SDI routing',
        'Supports 4K/UHD at 12G-SDI single-link',
        'Compact 1RU half-depth chassis',
        'Web-based and REST API control',
        'SNMP monitoring',
      ],
      description: 'Compact 16x16 12G-SDI routing switcher in 1RU.',
    },

    {
      modelId: 'aja-kumo-1604',
      modelName: 'KUMO 1604',
      category: 'matrix-switcher',
      rackUnits: 1,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 16 },
        { label: 'SDI Out', type: 'sdi', direction: 'output', count: 4 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        '16x4 3G-SDI routing',
        'Supports SD/HD/3G-SDI auto-detection',
        'Compact 1RU form factor',
        'Web-based control interface',
        'Cost-effective distribution routing',
      ],
      description: 'Compact 16-input, 4-output 3G-SDI routing switcher in 1RU.',
    },

    {
      modelId: 'aja-kumo-3232',
      modelName: 'KUMO 3232',
      category: 'matrix-switcher',
      rackUnits: 2,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 32 },
        { label: 'SDI Out', type: 'sdi', direction: 'output', count: 32 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        '32x32 3G-SDI routing',
        'Supports SD/HD/3G-SDI formats',
        'Web-based control UI',
        'REST API and SNMP control',
        'Redundant power option',
      ],
      description: '32x32 3G-SDI routing switcher in 2RU.',
    },

    // ─── Ki Pro Recorders ──────────────────────────────────────────

    {
      modelId: 'aja-ki-pro-ultra-12g',
      modelName: 'Ki Pro Ultra 12G',
      category: 'recorder',
      rackUnits: 2,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 4 },
        { label: 'SDI Out', type: 'sdi', direction: 'output', count: 4 },
        { label: 'HDMI In', type: 'hdmi', direction: 'input', count: 1 },
        { label: 'HDMI Out', type: 'hdmi', direction: 'output', count: 1 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        '4-channel simultaneous 4K/UHD recording',
        'Apple ProRes and Avid DNxHD/DNxHR codecs',
        '12G-SDI single-link 4K input',
        'Up to 4K 60p recording',
        'SSD media with CFast 2.0 slots',
      ],
      description: 'Multi-channel 4K/UHD 12G-SDI recorder with ProRes and DNx support in 2RU.',
    },

    {
      modelId: 'aja-ki-pro-go',
      modelName: 'Ki Pro GO',
      category: 'recorder',
      rackUnits: 1,
      formFactor: 'half-rack',
      defaultPorts: [
        { label: 'HDMI In', type: 'hdmi', direction: 'input', count: 4 },
        { label: 'HDMI Out', type: 'hdmi', direction: 'output', count: 1 },
        { label: 'USB', type: 'usb', direction: 'output', count: 2 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        'Multi-channel H.264 recording to USB drives',
        '4-channel simultaneous HDMI capture',
        'Records to standard USB media',
        'Web UI and REST API control',
        'Compact half-rack 1RU chassis',
      ],
      description: 'Multi-channel H.264 recorder with 4x HDMI inputs and USB media recording.',
    },

    {
      modelId: 'aja-ki-pro-ultra-plus',
      modelName: 'Ki Pro Ultra Plus',
      category: 'recorder',
      rackUnits: 2,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 4 },
        { label: 'SDI Out', type: 'sdi', direction: 'output', count: 4 },
        { label: 'HDMI In', type: 'hdmi', direction: 'input', count: 1 },
        { label: 'HDMI Out', type: 'hdmi', direction: 'output', count: 1 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        '4K/UHD multi-channel recording with HDR',
        'Apple ProRes and Avid DNxHD/DNxHR codecs',
        'HLG and PQ HDR format support',
        'Dual SSD recording slots',
        'Quad 3G-SDI or single 12G-SDI input modes',
      ],
      description: '4K/UHD multi-channel recorder with HDR and expanded codec support in 2RU.',
    },

    // ─── FS Frame Syncs / Converters ──────────────────────────────

    {
      modelId: 'aja-fs-hdr',
      modelName: 'FS-HDR',
      category: 'converter',
      rackUnits: 1,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 4 },
        { label: 'SDI Out', type: 'sdi', direction: 'output', count: 4 },
        { label: 'SFP', type: 'sfp', direction: 'input', count: 1 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        'Real-time HDR/WCG conversion and frame sync',
        'Colorfront Tone Management engine',
        'Supports HLG, PQ, SDR conversion',
        '12G-SDI, 4x 3G-SDI and fiber SFP inputs',
        '4-channel simultaneous processing',
      ],
      description: '1RU real-time HDR/WCG up/down/cross-conversion with Colorfront engine.',
    },

    {
      modelId: 'aja-fs4',
      modelName: 'FS4',
      category: 'converter',
      rackUnits: 1,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 4 },
        { label: 'SDI Out', type: 'sdi', direction: 'output', count: 4 },
        { label: 'HDMI In', type: 'hdmi', direction: 'input', count: 1 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        '4-channel frame sync and up/down/cross-conversion',
        'Supports SD, HD, 3G, 4K/UHD formats',
        'Independent per-channel processing',
        'Audio embedding and de-embedding',
        'Genlock and reference sync',
      ],
      description: '1RU 4-channel frame sync with up/down/cross-conversion for multi-format workflows.',
    },

    {
      modelId: 'aja-fs1',
      modelName: 'FS1',
      category: 'converter',
      rackUnits: 1,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 2 },
        { label: 'SDI Out', type: 'sdi', direction: 'output', count: 2 },
        { label: 'HDMI Out', type: 'hdmi', direction: 'output', count: 1 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        'Universal frame sync and format conversion',
        'Supports SD, HD, 3G-SDI formats',
        'Up, down, and cross-conversion',
        'Audio embedding and de-embedding',
        'HDMI monitoring output',
      ],
      description: '1RU universal frame sync with up/down/cross-conversion for SD and HD workflows.',
    },

    // ─── Mini / Micro Converters ───────────────────────────────────

    {
      modelId: 'aja-hi5-12g',
      modelName: 'Hi5-12G',
      category: 'converter',
      rackUnits: 0,
      formFactor: 'portable',
      defaultPorts: [
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 1 },
        { label: 'HDMI Out', type: 'hdmi', direction: 'output', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        '12G-SDI to HDMI 2.0 conversion',
        '4K/UHD up to 60p output',
        'HDR10 and HLG passthrough',
        'Supports SD/HD/3G/6G/12G-SDI input',
        'Bus-powered mini converter',
      ],
      description: 'Mini converter from 12G-SDI to HDMI 2.0 supporting 4K/UHD up to 60p.',
    },

    {
      modelId: 'aja-ha5-12g',
      modelName: 'HA5-12G',
      category: 'converter',
      rackUnits: 0,
      formFactor: 'portable',
      defaultPorts: [
        { label: 'HDMI In', type: 'hdmi', direction: 'input', count: 1 },
        { label: 'SDI Out', type: 'sdi', direction: 'output', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        'HDMI 2.0 to 12G-SDI conversion',
        '4K/UHD up to 60p input',
        'HDR10 and HLG passthrough',
        'Reclocked 12G-SDI output',
        'Bus-powered mini converter',
      ],
      description: 'Mini converter from HDMI 2.0 to 12G-SDI supporting 4K/UHD up to 60p.',
    },

    {
      modelId: 'aja-12gm',
      modelName: '12GM',
      category: 'converter',
      rackUnits: 0,
      formFactor: 'portable',
      defaultPorts: [
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 4 },
        { label: 'SDI Out', type: 'sdi', direction: 'output', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        '12G-SDI mux/demux — 4x 3G to 1x 12G and reverse',
        'Converts quad-link 3G-SDI to single-link 12G-SDI',
        'Reclocked outputs for signal integrity',
        'Supports 4K/UHD signal transport over single cable',
        'Bus-powered mini converter',
      ],
      description: 'Mini 12G-SDI mux/demux converting between quad 3G-SDI and single 12G-SDI.',
    },

    {
      modelId: 'aja-fido-tr-12g',
      modelName: 'FiDO-TR-12G',
      category: 'converter',
      rackUnits: 0,
      formFactor: 'portable',
      defaultPorts: [
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 1 },
        { label: 'SDI Out', type: 'sdi', direction: 'output', count: 1 },
        { label: 'SFP', type: 'sfp', direction: 'input', count: 1 },
        { label: 'SFP', type: 'sfp', direction: 'output', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        'Bidirectional 12G-SDI fiber transceiver',
        'SFP optical module slot for fiber connectivity',
        'Single-fiber or dual-fiber operation',
        'Reclocked 12G-SDI electrical output',
        'Bus-powered mini converter',
      ],
      description: 'Mini 12G-SDI fiber transceiver with SFP for long-distance signal transport.',
    },

    {
      modelId: 'aja-fido-2t-12g',
      modelName: 'FiDO-2T-12G',
      category: 'converter',
      rackUnits: 0,
      formFactor: 'portable',
      defaultPorts: [
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 2 },
        { label: 'Fiber Out', type: 'fiber', direction: 'output', count: 2 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        'Dual 12G-SDI to fiber transmitter',
        'Two independent SDI to optical conversion paths',
        'SFP optical module slots',
        'Supports SD/HD/3G/6G/12G-SDI formats',
        'Bus-powered mini converter',
      ],
      description: 'Mini dual-channel 12G-SDI to fiber transmitter with SFP optical outputs.',
    },

    {
      modelId: 'aja-fido-2r-12g',
      modelName: 'FiDO-2R-12G',
      category: 'converter',
      rackUnits: 0,
      formFactor: 'portable',
      defaultPorts: [
        { label: 'Fiber In', type: 'fiber', direction: 'input', count: 2 },
        { label: 'SDI Out', type: 'sdi', direction: 'output', count: 2 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        'Dual fiber to 12G-SDI receiver',
        'Two independent optical to SDI conversion paths',
        'SFP optical module slots',
        'Reclocked 12G-SDI electrical outputs',
        'Bus-powered mini converter',
      ],
      description: 'Mini dual-channel fiber to 12G-SDI receiver with reclocked SDI outputs.',
    },

    {
      modelId: 'aja-12g-am',
      modelName: '12G-AM',
      category: 'converter',
      rackUnits: 0,
      formFactor: 'portable',
      defaultPorts: [
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 1 },
        { label: 'SDI Out', type: 'sdi', direction: 'output', count: 1 },
        { label: 'HDMI In', type: 'hdmi', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        '12G-SDI audio embedder and de-embedder',
        'Embeds analog or AES audio into SDI stream',
        'De-embeds audio from 12G-SDI to analog outputs',
        'Supports up to 16-channel audio embedding',
        'Bus-powered mini converter',
      ],
      description: 'Mini 12G-SDI audio embedder/de-embedder for embedding analog and AES audio.',
    },

    // ─── Streaming / IP ────────────────────────────────────────────

    {
      modelId: 'aja-bridge-live',
      modelName: 'BRIDGE LIVE',
      category: 'streaming-processor',
      rackUnits: 1,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 4 },
        { label: 'SDI Out', type: 'sdi', direction: 'output', count: 4 },
        { label: 'NDI', type: 'ndi', direction: 'input', count: 1 },
        { label: 'NDI', type: 'ndi', direction: 'output', count: 1 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 2 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        'Multi-channel live encode and decode in 1RU',
        'SRT, RIST, RTMP, and NDI protocol support',
        'Up to 4K/UHD encode and decode simultaneously',
        'Contribution-quality streaming over IP',
        'Redundant streaming output paths',
      ],
      description: '1RU multi-channel live streaming encoder/decoder supporting SRT, RIST, RTMP, and NDI.',
    },

    {
      modelId: 'aja-bridge-ndi-3g',
      modelName: 'Bridge NDI 3G',
      category: 'streaming-processor',
      rackUnits: 1,
      formFactor: 'half-rack',
      defaultPorts: [
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 1 },
        { label: 'SDI Out', type: 'sdi', direction: 'output', count: 1 },
        { label: 'NDI', type: 'ndi', direction: 'output', count: 1 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        'SDI to NDI bidirectional conversion',
        '3G-SDI input and output',
        'NDI encode and decode over IP network',
        'Web-based configuration and control',
        'Compact half-rack 1RU chassis',
      ],
      description: 'Compact half-rack SDI-to-NDI bidirectional converter for IP workflow integration.',
    },

    // ─── openGear Cards ────────────────────────────────────────────

    {
      modelId: 'aja-og-hi5-12g-r',
      modelName: 'OG-Hi5-12G-R',
      category: 'opengear-frame',
      rackUnits: 0,
      formFactor: 'card',
      defaultPorts: [
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 1 },
        { label: 'HDMI Out', type: 'hdmi', direction: 'output', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        '12G-SDI to HDMI 2.0 conversion on openGear card',
        '4K/UHD up to 60p HDMI output',
        'HDR10 and HLG metadata passthrough',
        'Supports SD/HD/3G/6G/12G-SDI input',
        'Frame-managed via openGear Dashboard',
      ],
      description: 'openGear card converting 12G-SDI input to HDMI 2.0 output for 4K/UHD monitoring.',
    },

    {
      modelId: 'aja-og-ha5-12g-r',
      modelName: 'OG-HA5-12G-R',
      category: 'opengear-frame',
      rackUnits: 0,
      formFactor: 'card',
      defaultPorts: [
        { label: 'HDMI In', type: 'hdmi', direction: 'input', count: 1 },
        { label: 'SDI Out', type: 'sdi', direction: 'output', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        'HDMI 2.0 to 12G-SDI conversion on openGear card',
        '4K/UHD up to 60p input support',
        'HDR10 and HLG passthrough',
        'Reclocked 12G-SDI output',
        'Frame-managed via openGear Dashboard',
      ],
      description: 'openGear card converting HDMI 2.0 input to 12G-SDI output for broadcast integration.',
    },

    {
      modelId: 'aja-og-12gda-2x4',
      modelName: 'OG-12GDA-2x4',
      category: 'opengear-frame',
      rackUnits: 0,
      formFactor: 'card',
      defaultPorts: [
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 2 },
        { label: 'SDI Out', type: 'sdi', direction: 'output', count: 8 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        'Dual 12G-SDI distribution amplifier on openGear card',
        '2 inputs each distributed to 4 reclocked outputs (2x4)',
        'Supports SD/HD/3G/6G/12G-SDI auto-detection',
        'Reclocked and re-equalized outputs',
        'Frame-managed via openGear Dashboard',
      ],
      description: 'openGear dual 12G-SDI distribution amplifier with 2 inputs and 8 reclocked outputs.',
    },
  ],
};
