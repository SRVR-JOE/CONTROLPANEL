import { CatalogManufacturer } from '@/types';

// ─── Adder ────────────────────────────────────────────────────

export const adderCatalog: CatalogManufacturer = {
  id: 'adder',
  displayName: 'Adder',
  brandColor: '#00897b',
  website: 'https://www.adder.com',
  products: [
    // ─── KVM Extenders ────────────────────────────────────────

    {
      modelId: 'adder-alif4021t',
      modelName: 'ALIF4021T',
      category: 'kvm-extender',
      rackUnits: 1,
      formFactor: 'half-rack',
      defaultPorts: [
        { label: 'HDMI In', type: 'hdmi', direction: 'input', count: 1 },
        { label: 'USB', type: 'usb', direction: 'input', count: 2 },
        { label: 'Ethernet', type: 'ethernet', direction: 'output', count: 2 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        '4K60 KVM over IP transmitter',
        'INFINITY 4K platform',
        'USB and audio transport over IP',
        '1GbE and 10GbE network support',
        'Web management interface',
      ],
      description: 'INFINITY 4K transmitter for 4K60 KVM over IP with USB and audio, supporting 1GbE and 10G networks.',
    },

    {
      modelId: 'adder-alif4021r',
      modelName: 'ALIF4021R',
      category: 'kvm-extender',
      rackUnits: 1,
      formFactor: 'half-rack',
      defaultPorts: [
        { label: 'HDMI Out', type: 'hdmi', direction: 'output', count: 1 },
        { label: 'USB', type: 'usb', direction: 'output', count: 2 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 2 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        '4K60 KVM over IP receiver',
        'INFINITY 4K platform',
        'USB and audio transport over IP',
        '1GbE and 10GbE network support',
        'Web management interface',
      ],
      description: 'INFINITY 4K receiver for 4K60 KVM over IP with USB and audio, supporting 1GbE and 10G networks.',
    },

    {
      modelId: 'adder-alif2020t',
      modelName: 'ALIF2020T',
      category: 'kvm-extender',
      rackUnits: 1,
      formFactor: 'half-rack',
      defaultPorts: [
        { label: 'HDMI In', type: 'hdmi', direction: 'input', count: 2 },
        { label: 'USB', type: 'usb', direction: 'input', count: 2 },
        { label: 'Ethernet', type: 'ethernet', direction: 'output', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        'Dual-head 1080p KVM over IP transmitter',
        'INFINITY platform',
        'Dual HDMI video transport over IP',
        'USB and audio extension',
        '1GbE network support',
      ],
      description: 'INFINITY dual-head transmitter extending 1080p dual-display KVM over IP.',
    },

    {
      modelId: 'adder-alif2020r',
      modelName: 'ALIF2020R',
      category: 'kvm-extender',
      rackUnits: 1,
      formFactor: 'half-rack',
      defaultPorts: [
        { label: 'HDMI Out', type: 'hdmi', direction: 'output', count: 2 },
        { label: 'USB', type: 'usb', direction: 'output', count: 2 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        'Dual-head 1080p KVM over IP receiver',
        'INFINITY platform',
        'Dual HDMI output',
        'USB and audio extension',
        '1GbE network support',
      ],
      description: 'INFINITY dual-head receiver providing dual 1080p display KVM over IP.',
    },

    {
      modelId: 'adder-alif1002t',
      modelName: 'ALIF1002T',
      category: 'kvm-extender',
      rackUnits: 1,
      formFactor: 'half-rack',
      defaultPorts: [
        { label: 'HDMI In', type: 'hdmi', direction: 'input', count: 1 },
        { label: 'USB', type: 'usb', direction: 'input', count: 2 },
        { label: 'Ethernet', type: 'ethernet', direction: 'output', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        'Single-head 1080p KVM over IP transmitter',
        'INFINITY platform',
        'USB and audio transport',
        '1GbE network support',
        'Web management interface',
      ],
      description: 'INFINITY 1080p single-head transmitter for KVM over IP extension.',
    },

    {
      modelId: 'adder-alif1002r',
      modelName: 'ALIF1002R',
      category: 'kvm-extender',
      rackUnits: 1,
      formFactor: 'half-rack',
      defaultPorts: [
        { label: 'HDMI Out', type: 'hdmi', direction: 'output', count: 1 },
        { label: 'USB', type: 'usb', direction: 'output', count: 2 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        'Single-head 1080p KVM over IP receiver',
        'INFINITY platform',
        'USB and audio transport',
        '1GbE network support',
        'Web management interface',
      ],
      description: 'INFINITY 1080p single-head receiver for KVM over IP extension.',
    },

    {
      modelId: 'adder-xd-150',
      modelName: 'XD-150',
      category: 'kvm-extender',
      rackUnits: 1,
      formFactor: 'half-rack',
      defaultPorts: [
        { label: 'DVI In', type: 'dvi', direction: 'input', count: 1 },
        { label: 'DVI Out', type: 'dvi', direction: 'output', count: 1 },
        { label: 'USB', type: 'usb', direction: 'input', count: 2 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        'Point-to-point DVI KVM extender',
        'AdderLink XD150 platform',
        'USB keyboard and mouse extension',
        'Lossless DVI-D video transport',
        'Audio extension support',
      ],
      description: 'AdderLink XD150 point-to-point DVI KVM extender for single-link DVI video and USB.',
    },

    {
      modelId: 'adder-xd-ip',
      modelName: 'XD-IP',
      category: 'kvm-extender',
      rackUnits: 1,
      formFactor: 'half-rack',
      defaultPorts: [
        { label: 'DVI In', type: 'dvi', direction: 'input', count: 1 },
        { label: 'USB', type: 'usb', direction: 'input', count: 2 },
        { label: 'Ethernet', type: 'ethernet', direction: 'output', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        'KVM over IP extender',
        'DVI video over network',
        'USB keyboard and mouse extension',
        'Web-based management',
        '1GbE network transport',
      ],
      description: 'AdderLink XD-IP KVM over IP extender transporting DVI video and USB over Ethernet.',
    },

    {
      modelId: 'adder-ipeps-plus',
      modelName: 'ipeps+',
      category: 'kvm-extender',
      rackUnits: 0,
      formFactor: 'portable',
      defaultPorts: [
        { label: 'USB', type: 'usb', direction: 'input', count: 1 },
        { label: 'HDMI In', type: 'hdmi', direction: 'input', count: 1 },
        { label: 'Ethernet', type: 'ethernet', direction: 'output', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        'Single-port IP KVM dongle',
        'HTML5 browser-based access — no client software required',
        'Remote access from anywhere over IP',
        'HDMI video capture',
        'Compact portable form factor',
      ],
      description: 'ipeps+ single-port IP KVM access dongle with HTML5 browser interface for remote HDMI access.',
    },

    {
      modelId: 'adder-ipeps-da',
      modelName: 'ipeps DA',
      category: 'kvm-extender',
      rackUnits: 0,
      formFactor: 'portable',
      defaultPorts: [
        { label: 'USB', type: 'usb', direction: 'input', count: 1 },
        { label: 'HDMI In', type: 'hdmi', direction: 'input', count: 1 },
        { label: 'Ethernet', type: 'ethernet', direction: 'output', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        'Dual-access IP KVM dongle',
        'Supports two simultaneous remote users',
        'HTML5 browser-based access',
        'HDMI video capture',
        'Compact portable form factor',
      ],
      description: 'ipeps DA dual-access IP KVM dongle allowing two simultaneous remote users via HTML5 browser.',
    },

    // ─── KVM Switches ─────────────────────────────────────────

    {
      modelId: 'adder-av4pro-dvi',
      modelName: 'AV4PRO-DVI',
      category: 'kvm-switch',
      rackUnits: 0,
      formFactor: 'desktop',
      defaultPorts: [
        { label: 'DVI In', type: 'dvi', direction: 'input', count: 4 },
        { label: 'DVI Out', type: 'dvi', direction: 'output', count: 1 },
        { label: 'USB', type: 'usb', direction: 'input', count: 4 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        '4-port DVI KVM switch',
        'USB keyboard and mouse sharing',
        'Audio switching',
        'Desktop form factor',
        'Hotkey and front-panel switching',
      ],
      description: 'AdderView Pro 4-port DVI KVM desktop switch for sharing one workstation across four computers.',
    },

    {
      modelId: 'adder-av4pro-dp',
      modelName: 'AV4PRO-DP',
      category: 'kvm-switch',
      rackUnits: 0,
      formFactor: 'desktop',
      defaultPorts: [
        { label: 'DisplayPort In', type: 'displayport', direction: 'input', count: 4 },
        { label: 'DisplayPort Out', type: 'displayport', direction: 'output', count: 1 },
        { label: 'USB', type: 'usb', direction: 'input', count: 4 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        '4-port DisplayPort KVM switch',
        'USB keyboard and mouse sharing',
        'Audio switching',
        'Desktop form factor',
        'Hotkey and front-panel switching',
      ],
      description: 'AdderView Pro 4-port DisplayPort KVM desktop switch for high-resolution multi-computer sharing.',
    },

    {
      modelId: 'adder-ccs-pro8',
      modelName: 'CCS-PRO8',
      category: 'kvm-switch',
      rackUnits: 1,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'USB', type: 'usb', direction: 'input', count: 8 },
        { label: 'DisplayPort In', type: 'displayport', direction: 'input', count: 8 },
        { label: 'DisplayPort Out', type: 'displayport', direction: 'output', count: 1 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        '8-port rackmount KVM switch',
        'Cascadable for expanded port count',
        'USB keyboard, mouse, and peripheral sharing',
        'Web-based management',
        '1RU rackmount chassis',
      ],
      description: 'AdderView CCS-PRO 8-port rackmount KVM switch with cascading support for larger installations.',
    },

    {
      modelId: 'adder-ccs-mv4224',
      modelName: 'CCS-MV4224',
      category: 'kvm-switch',
      rackUnits: 1,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'USB', type: 'usb', direction: 'input', count: 42 },
        { label: 'DisplayPort In', type: 'displayport', direction: 'input', count: 42 },
        { label: 'DisplayPort Out', type: 'displayport', direction: 'output', count: 24 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        '42-port matrix KVM switch, 24-user access',
        'Multi-user simultaneous access',
        'USB keyboard, mouse, and audio sharing',
        'Web-based management',
        '1RU rackmount chassis',
      ],
      description: 'AdderView CCS-MV 42-port KVM matrix switch supporting up to 24 simultaneous users.',
    },

    {
      modelId: 'adder-ddx30',
      modelName: 'DDX30',
      category: 'kvm-switch',
      rackUnits: 4,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'USB', type: 'usb', direction: 'input', count: 30 },
        { label: 'DisplayPort In', type: 'displayport', direction: 'input', count: 30 },
        { label: 'DisplayPort Out', type: 'displayport', direction: 'output', count: 30 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        '30-port KVM matrix switch',
        'ADDERLink DDX30 platform',
        'Full any-to-any matrix routing',
        'USB keyboard, mouse, and audio switching',
        '4RU rackmount chassis',
      ],
      description: 'ADDERLink DDX30 30-port KVM matrix switch with full any-to-any routing in a 4RU chassis.',
    },

    {
      modelId: 'adder-aim-24',
      modelName: 'AIM-24',
      category: 'kvm-switch',
      rackUnits: 1,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 2 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        'ADDERLink INFINITY Manager',
        'Manages up to 1000 INFINITY endpoints',
        'Centralized access control and configuration',
        'Web-based management dashboard',
        '1RU rackmount chassis',
      ],
      description: 'ADDERLink INFINITY Manager appliance for centralized management of up to 1000 INFINITY KVM endpoints.',
    },
  ],
};

// ─── Avitech ──────────────────────────────────────────────────

export const avitechCatalog: CatalogManufacturer = {
  id: 'avitech',
  displayName: 'Avitech',
  brandColor: '#e65100',
  website: 'https://www.avitechvideo.com',
  products: [
    // ─── Multiviewers ─────────────────────────────────────────

    {
      modelId: 'avitech-sequoia-4k-mv',
      modelName: 'Sequoia 4K-MV',
      category: 'multiviewer',
      rackUnits: 1,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'HDMI In', type: 'hdmi', direction: 'input', count: 2 },
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 2 },
        { label: 'HDMI Out', type: 'hdmi', direction: 'output', count: 1 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        '4K multiviewer with 4 inputs',
        'Mixed HDMI and SDI input support',
        '4K HDMI output',
        'Customizable window layout',
        'Web-based control interface',
      ],
      description: '1RU 4K multiviewer with 4x HDMI/SDI inputs and a single 4K HDMI output with customizable layouts.',
    },

    {
      modelId: 'avitech-sequoia-4k-mv16',
      modelName: 'Sequoia 4K-MV16',
      category: 'multiviewer',
      rackUnits: 2,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 8 },
        { label: 'HDMI In', type: 'hdmi', direction: 'input', count: 8 },
        { label: 'HDMI Out', type: 'hdmi', direction: 'output', count: 1 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        '16-input 4K multiviewer',
        'Mixed SDI and HDMI inputs',
        '4K output',
        'UMD and tally support',
        'Audio level metering per source',
      ],
      description: '2RU 16-input 4K multiviewer supporting mixed SDI/HDMI with UMD, tally, and audio metering.',
    },

    {
      modelId: 'avitech-sequoia-kvm-16',
      modelName: 'Sequoia KVM-16',
      category: 'multiviewer',
      rackUnits: 2,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'HDMI In', type: 'hdmi', direction: 'input', count: 16 },
        { label: 'HDMI Out', type: 'hdmi', direction: 'output', count: 1 },
        { label: 'USB', type: 'usb', direction: 'input', count: 16 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        '16-input KVM multiviewer',
        'Keyboard and mouse switching per source',
        'HDMI input support',
        'Customizable window layout',
        'Web-based control',
      ],
      description: '2RU 16-input KVM multiviewer with integrated keyboard and mouse switching for operator workstation consolidation.',
    },

    {
      modelId: 'avitech-sequoia-kvm-32',
      modelName: 'Sequoia KVM-32',
      category: 'multiviewer',
      rackUnits: 4,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'HDMI In', type: 'hdmi', direction: 'input', count: 32 },
        { label: 'HDMI Out', type: 'hdmi', direction: 'output', count: 1 },
        { label: 'USB', type: 'usb', direction: 'input', count: 32 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        '32-input KVM multiviewer',
        'Keyboard and mouse switching per source',
        'HDMI input support',
        'Customizable window layout',
        'Web-based control',
      ],
      description: '4RU 32-input KVM multiviewer with integrated keyboard and mouse switching for large-scale operator environments.',
    },

    {
      modelId: 'avitech-rainier-16-sdi',
      modelName: 'Rainier 16-SDI',
      category: 'multiviewer',
      rackUnits: 1,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 16 },
        { label: 'SDI Out', type: 'sdi', direction: 'output', count: 1 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        '16-input SDI broadcast multiviewer',
        '3G-SDI input support',
        'SDI mosaic output',
        'Broadcast-grade signal monitoring',
        'Web-based control',
      ],
      description: '1RU 16x SDI broadcast multiviewer with SDI mosaic output for on-air signal monitoring.',
    },

    {
      modelId: 'avitech-rainier-32-sdi',
      modelName: 'Rainier 32-SDI',
      category: 'multiviewer',
      rackUnits: 2,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 32 },
        { label: 'SDI Out', type: 'sdi', direction: 'output', count: 2 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        '32-input SDI broadcast multiviewer',
        '3G-SDI input support',
        'Dual SDI mosaic outputs',
        'Broadcast-grade signal monitoring',
        'Web-based control',
      ],
      description: '2RU 32x SDI broadcast multiviewer with dual SDI mosaic outputs for large-scale broadcast monitoring.',
    },

    {
      modelId: 'avitech-rainier-4-sdi',
      modelName: 'Rainier 4-SDI',
      category: 'multiviewer',
      rackUnits: 1,
      formFactor: 'half-rack',
      defaultPorts: [
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 4 },
        { label: 'SDI Out', type: 'sdi', direction: 'output', count: 1 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        '4-input compact SDI multiviewer',
        '3G-SDI input support',
        'SDI mosaic output',
        'Compact half-rack chassis',
        'Broadcast-grade signal monitoring',
      ],
      description: 'Compact half-rack 4x SDI broadcast multiviewer with SDI mosaic output for space-constrained installations.',
    },

    // ─── Matrix Switchers ──────────────────────────────────────

    {
      modelId: 'avitech-pacific-ms-16x16',
      modelName: 'Pacific MS-16x16',
      category: 'matrix-switcher',
      rackUnits: 2,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 16 },
        { label: 'SDI Out', type: 'sdi', direction: 'output', count: 16 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        '16x16 SDI matrix switcher',
        '3G-SDI signal support',
        'Web-based control interface',
        'Router control protocol support',
        '2RU rackmount chassis',
      ],
      description: '2RU 16x16 3G-SDI matrix switcher with web-based control for broadcast routing applications.',
    },

    {
      modelId: 'avitech-pacific-ms-32x32',
      modelName: 'Pacific MS-32x32',
      category: 'matrix-switcher',
      rackUnits: 4,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'SDI In', type: 'sdi', direction: 'input', count: 32 },
        { label: 'SDI Out', type: 'sdi', direction: 'output', count: 32 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        '32x32 SDI matrix switcher',
        '3G-SDI signal support',
        'Web-based control interface',
        'Router control protocol support',
        '4RU rackmount chassis',
      ],
      description: '4RU 32x32 3G-SDI matrix switcher with web-based control for large broadcast routing environments.',
    },
  ],
};

// ─── Sonifex ──────────────────────────────────────────────────

export const sonifexCatalog: CatalogManufacturer = {
  id: 'sonifex',
  displayName: 'Sonifex',
  brandColor: '#d32f2f',
  website: 'https://www.sonifex.co.uk',
  products: [
    // ─── Redbox Audio Interfaces ──────────────────────────────

    {
      modelId: 'sonifex-rb-vhcmd8',
      modelName: 'RB-VHCMD8',
      category: 'audio-interface',
      rackUnits: 1,
      formFactor: 'half-rack',
      defaultPorts: [
        { label: 'Dante', type: 'dante', direction: 'input', count: 1 },
        { label: 'Headphone Out', type: 'analog-audio', direction: 'output', count: 8 },
        { label: 'Ethernet PoE', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        '8-channel Dante/AES67 headphone amplifier',
        'PoE powered — no external PSU required',
        'Individual volume control per channel',
        'AES67 interoperability',
        'Compact half-rack chassis',
      ],
      description: 'Redbox 8-channel Dante/AES67 headphone amplifier with PoE, providing 8 independent headphone outputs.',
    },

    {
      modelId: 'sonifex-rb-vhcmd4',
      modelName: 'RB-VHCMD4',
      category: 'audio-interface',
      rackUnits: 1,
      formFactor: 'half-rack',
      defaultPorts: [
        { label: 'Dante', type: 'dante', direction: 'input', count: 1 },
        { label: 'Headphone Out', type: 'analog-audio', direction: 'output', count: 4 },
        { label: 'Ethernet PoE', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        '4-channel Dante headphone amplifier',
        'PoE powered — no external PSU required',
        'Individual volume control per channel',
        'Compact half-rack chassis',
        'Web management interface',
      ],
      description: 'Redbox 4-channel Dante headphone amplifier with PoE for compact monitoring setups.',
    },

    {
      modelId: 'sonifex-rb-dhad4',
      modelName: 'RB-DHAD4',
      category: 'audio-interface',
      rackUnits: 1,
      formFactor: 'half-rack',
      defaultPorts: [
        { label: 'Dante', type: 'dante', direction: 'input', count: 1 },
        { label: 'Analog Out', type: 'analog-audio', direction: 'output', count: 4 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        '4-channel Dante to analog converter',
        'Balanced XLR analog outputs',
        'Low-latency Dante audio conversion',
        'Web management interface',
        'Compact half-rack chassis',
      ],
      description: 'Redbox 4-channel Dante to balanced analog converter for integrating Dante networks with analog equipment.',
    },

    {
      modelId: 'sonifex-rb-dhda4',
      modelName: 'RB-DHDA4',
      category: 'audio-interface',
      rackUnits: 1,
      formFactor: 'half-rack',
      defaultPorts: [
        { label: 'Analog In', type: 'analog-audio', direction: 'input', count: 4 },
        { label: 'Dante', type: 'dante', direction: 'output', count: 1 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        '4-channel analog to Dante converter',
        'Balanced XLR analog inputs',
        'Low-latency Dante audio conversion',
        'Web management interface',
        'Compact half-rack chassis',
      ],
      description: 'Redbox 4-channel balanced analog to Dante converter for feeding analog sources into Dante networks.',
    },

    {
      modelId: 'sonifex-rb-dhad8',
      modelName: 'RB-DHAD8',
      category: 'audio-interface',
      rackUnits: 1,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'Dante', type: 'dante', direction: 'input', count: 1 },
        { label: 'Analog Out', type: 'analog-audio', direction: 'output', count: 8 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        '8-channel Dante to analog converter',
        'Balanced XLR analog outputs',
        'Low-latency Dante audio conversion',
        'Web management interface',
        '1RU rackmount chassis',
      ],
      description: 'Redbox 8-channel Dante to balanced analog converter in 1RU for larger analog integration needs.',
    },

    {
      modelId: 'sonifex-rb-dhda8',
      modelName: 'RB-DHDA8',
      category: 'audio-interface',
      rackUnits: 1,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'Analog In', type: 'analog-audio', direction: 'input', count: 8 },
        { label: 'Dante', type: 'dante', direction: 'output', count: 1 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        '8-channel analog to Dante converter',
        'Balanced XLR analog inputs',
        'Low-latency Dante audio conversion',
        'Web management interface',
        '1RU rackmount chassis',
      ],
      description: 'Redbox 8-channel balanced analog to Dante converter in 1RU for high-density analog source integration.',
    },

    {
      modelId: 'sonifex-rb-aec4',
      modelName: 'RB-AEC4',
      category: 'audio-interface',
      rackUnits: 1,
      formFactor: 'half-rack',
      defaultPorts: [
        { label: 'AES3 In', type: 'aes-ebu', direction: 'input', count: 4 },
        { label: 'Dante', type: 'dante', direction: 'output', count: 1 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        '4-channel AES3 to Dante bridge',
        'AES/EBU digital audio input',
        'Low-latency conversion to Dante',
        'Sample rate conversion',
        'Compact half-rack chassis',
      ],
      description: 'Redbox 4-channel AES3 to Dante bridge for integrating AES/EBU digital audio sources into Dante networks.',
    },

    {
      modelId: 'sonifex-rb-tghd',
      modelName: 'RB-TGHD',
      category: 'audio-interface',
      rackUnits: 1,
      formFactor: 'half-rack',
      defaultPorts: [
        { label: 'Dante', type: 'dante', direction: 'input', count: 1 },
        { label: 'Dante', type: 'dante', direction: 'output', count: 1 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        'Dante/AES67 telephone hybrid',
        'POTS line interface for broadcast use',
        'Send and receive audio over Dante',
        'AES67 interoperability',
        'Compact half-rack chassis',
      ],
      description: 'Redbox Dante/AES67 telephone hybrid for integrating POTS telephone lines into Dante audio networks.',
    },

    // ─── AVN Dante/RAVENNA Audio Interfaces ───────────────────

    {
      modelId: 'sonifex-avn-di04',
      modelName: 'AVN-DI04',
      category: 'audio-interface',
      rackUnits: 1,
      formFactor: 'half-rack',
      defaultPorts: [
        { label: 'Analog In', type: 'analog-audio', direction: 'input', count: 4 },
        { label: 'Dante', type: 'dante', direction: 'output', count: 1 },
        { label: 'Ethernet PoE', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        '4-input Dante audio interface',
        'PoE powered — no external PSU required',
        'Balanced analog inputs',
        'Web management interface',
        'Compact half-rack chassis',
      ],
      description: 'AVN 4-input Dante audio interface with PoE for feeding analog sources into Dante networks without external power.',
    },

    {
      modelId: 'sonifex-avn-do04',
      modelName: 'AVN-DO04',
      category: 'audio-interface',
      rackUnits: 1,
      formFactor: 'half-rack',
      defaultPorts: [
        { label: 'Dante', type: 'dante', direction: 'input', count: 1 },
        { label: 'Analog Out', type: 'analog-audio', direction: 'output', count: 4 },
        { label: 'Ethernet PoE', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        '4-output Dante audio interface',
        'PoE powered — no external PSU required',
        'Balanced analog outputs',
        'Web management interface',
        'Compact half-rack chassis',
      ],
      description: 'AVN 4-output Dante audio interface with PoE for distributing Dante audio to analog destinations.',
    },

    {
      modelId: 'sonifex-avn-dio08',
      modelName: 'AVN-DIO08',
      category: 'audio-interface',
      rackUnits: 1,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'Analog In', type: 'analog-audio', direction: 'input', count: 8 },
        { label: 'Analog Out', type: 'analog-audio', direction: 'output', count: 8 },
        { label: 'Dante', type: 'dante', direction: 'input', count: 1 },
        { label: 'Dante', type: 'dante', direction: 'output', count: 1 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        '8-in/8-out Dante audio interface',
        'Balanced analog inputs and outputs',
        'Bidirectional Dante conversion',
        'Web management interface',
        '1RU rackmount chassis',
      ],
      description: 'AVN 8-in/8-out Dante audio interface in 1RU for bidirectional analog and Dante integration.',
    },

    {
      modelId: 'sonifex-avn-ai12',
      modelName: 'AVN-AI12',
      category: 'audio-interface',
      rackUnits: 1,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'MADI In', type: 'aes-ebu', direction: 'input', count: 1 },
        { label: 'Dante', type: 'dante', direction: 'output', count: 1 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        '12-channel MADI to Dante bridge',
        'MADI coaxial and optical input support',
        'Up to 12 channels of Dante output',
        'Sample rate conversion',
        '1RU rackmount chassis',
      ],
      description: 'AVN 12-channel MADI to Dante bridge for integrating MADI infrastructure into Dante IP audio networks.',
    },

    {
      modelId: 'sonifex-avn-gmcu',
      modelName: 'AVN-GMCU',
      category: 'audio-interface',
      rackUnits: 1,
      formFactor: 'half-rack',
      defaultPorts: [
        { label: 'Dante', type: 'dante', direction: 'input', count: 1 },
        { label: 'Ethernet PoE', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        'Dante GPIO control unit',
        '8 GPIO channels for logic control',
        'PoE powered — no external PSU required',
        'Integrates GPIO with Dante network events',
        'Compact half-rack chassis',
      ],
      description: 'AVN Dante GPIO control unit with 8 GPIO channels for integrating logic control into Dante audio networks.',
    },

    // ─── Audio Monitors ───────────────────────────────────────

    {
      modelId: 'sonifex-avn-pm8r',
      modelName: 'AVN-PM8R',
      category: 'audio-monitor',
      rackUnits: 1,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'Dante', type: 'dante', direction: 'input', count: 1 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        '8-channel Dante audio monitor',
        'LCD level meters per channel',
        'Dante source selection',
        'Web management interface',
        '1RU rackmount chassis',
      ],
      description: '1RU 8-channel Dante audio monitor with LCD metering for live level monitoring of Dante audio sources.',
    },

    {
      modelId: 'sonifex-avn-pd8d',
      modelName: 'AVN-PD8D',
      category: 'audio-monitor',
      rackUnits: 1,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'Dante', type: 'dante', direction: 'input', count: 1 },
        { label: 'Ethernet', type: 'ethernet', direction: 'input', count: 1 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        '8-channel Dante audio level display',
        'High-brightness LED bar meters',
        'Dante source monitoring',
        'Web management interface',
        '1RU rackmount chassis',
      ],
      description: '1RU 8-channel Dante audio level display with bright LED meters for at-a-glance signal monitoring.',
    },

    {
      modelId: 'sonifex-rm-ca2',
      modelName: 'RM-CA2',
      category: 'audio-monitor',
      rackUnits: 1,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'Analog In', type: 'analog-audio', direction: 'input', count: 2 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        'Stereo reference monitor amplifier',
        'Built-in studio-quality speakers',
        'Compact 1RU self-contained unit',
        'Volume and balance control',
        'Analog stereo input',
      ],
      description: '1RU stereo reference monitor amplifier with built-in speakers for compact rackmount studio monitoring.',
    },

    {
      modelId: 'sonifex-rm-4c8-hde',
      modelName: 'RM-4C8-HDE',
      category: 'audio-monitor',
      rackUnits: 1,
      formFactor: 'rack',
      defaultPorts: [
        { label: 'HDMI In', type: 'hdmi', direction: 'input', count: 1 },
        { label: 'Analog In', type: 'analog-audio', direction: 'input', count: 2 },
      ],
      connectionInfo: { protocol: 'rest', defaultPort: 80 },
      features: [
        'Quad 4" reference monitor speakers in 1RU',
        'HDMI audio de-embedder',
        'Extracts and monitors audio from HDMI sources',
        'Compact 1RU four-speaker array',
        'Analog stereo input for A/B monitoring',
      ],
      description: '1RU quad 4" reference monitor with HDMI de-embedder for monitoring audio from HDMI video sources alongside analog.',
    },
  ],
};
