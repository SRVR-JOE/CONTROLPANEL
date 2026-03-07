import { CommandRegistry } from '@/types';

/**
 * Command registry — maps manufacturer slugs to their available structured commands.
 * Each entry describes the command type, human label, category, parameter schema,
 * and whether the operator must confirm before execution.
 */
export const commandRegistry: CommandRegistry = {
  brompton: [
    {
      type: 'set-brightness',
      label: 'Set Brightness',
      description: 'Set LED panel brightness percentage (0-100% maps to device 0-10000 internal scale)',
      category: 'control',
      params: {
        value: { type: 'number', label: 'Brightness %', min: 0, max: 100 },
      },
    },
    {
      type: 'set-blackout',
      label: 'Blackout',
      description: 'Enable/disable blackout on all outputs (override/blackout/enabled) with optional fade time',
      category: 'control',
      params: {
        enabled: { type: 'boolean', label: 'Enable' },
        fadeTime: { type: 'number', label: 'Fade Time (s)', min: 0, max: 10 },
      },
      confirmRequired: true,
    },
    {
      type: 'set-test-pattern',
      label: 'Test Pattern',
      description: 'Enable a test pattern on all outputs (override/test-pattern/*)',
      category: 'diagnostic',
      params: {
        enabled: { type: 'boolean', label: 'Enable' },
        type: {
          type: 'string',
          label: 'Pattern Type',
          options: [
            'brompton', 'red', 'green', 'blue', 'cyan', 'magenta', 'yellow',
            'white', 'black', 'grid', 'scrolling-grid', 'checkerboard',
            'colour-bars', 'gradient', 'smpte-bars', 'custom-colour',
            'custom-gradient', 'forty-five-degree-grid', 'strobe',
          ],
        },
      },
    },
    {
      type: 'set-freeze',
      label: 'Freeze Frame',
      description: 'Enable/disable video freeze (override/freeze/enabled)',
      category: 'control',
      params: {
        enabled: { type: 'boolean', label: 'Enable' },
      },
    },
    {
      type: 'set-color-temp',
      label: 'Color Temperature',
      description: 'Set the output color temperature in Kelvin',
      category: 'control',
      params: {
        kelvin: { type: 'number', label: 'Kelvin', min: 2700, max: 10000 },
      },
    },
    {
      type: 'select-input',
      label: 'Select Input',
      description: 'Switch the active input source',
      category: 'control',
      params: {
        source: {
          type: 'string',
          label: 'Source',
          options: ['HDMI 1', 'SDI 1'],
        },
      },
    },
    {
      type: 'toggle-darkmagic',
      label: 'DarkMagic',
      description: 'Toggle DarkMagic processing on/off',
      category: 'config',
      params: {
        enabled: { type: 'boolean', label: 'Enable' },
      },
    },
    {
      type: 'toggle-puretone',
      label: 'PureTone',
      description: 'Toggle PureTone processing on/off',
      category: 'config',
      params: {
        enabled: { type: 'boolean', label: 'Enable' },
      },
    },
    {
      type: 'identify-panel',
      label: 'Identify Panel',
      description: 'Flash a specific panel for identification',
      category: 'diagnostic',
      params: {
        panelId: { type: 'string', label: 'Panel ID' },
        duration: { type: 'number', label: 'Seconds', min: 1, max: 30 },
      },
    },
    {
      type: 'reload-panels',
      label: 'Reload Panels',
      description: 'Reload all panel calibration data',
      category: 'diagnostic',
      confirmRequired: true,
    },
    {
      type: 'set-gamma',
      label: 'Set Gamma',
      description: 'Set output gamma value',
      category: 'config',
      params: {
        gamma: { type: 'number', label: 'Gamma', min: 1.0, max: 4.0 },
      },
    },
    {
      type: 'set-gains',
      label: 'Set Gains',
      description: 'Set RGBI output gains',
      category: 'config',
      params: {
        red: { type: 'number', label: 'Red %', min: 0, max: 200 },
        green: { type: 'number', label: 'Green %', min: 0, max: 200 },
        blue: { type: 'number', label: 'Blue %', min: 0, max: 200 },
        intensity: { type: 'number', label: 'Intensity %', min: 0, max: 200 },
      },
    },
    {
      type: 'toggle-overdrive',
      label: 'Overdrive',
      description: 'Toggle overdrive processing',
      category: 'config',
      params: {
        enabled: { type: 'boolean', label: 'Enable' },
      },
    },
    {
      type: 'toggle-extended-bit-depth',
      label: 'Extended Bit Depth',
      description: 'Toggle extended bit depth processing',
      category: 'config',
      params: {
        enabled: { type: 'boolean', label: 'Enable' },
      },
    },
    {
      type: 'set-colour-correct-enabled',
      label: 'Colour Correct',
      description: 'Enable/disable 14-way colour correction (processing/colour-correct/enabled)',
      category: 'config',
      params: {
        enabled: { type: 'boolean', label: 'Enable' },
      },
    },
    {
      type: 'set-3d-lut-enabled',
      label: '3D LUT',
      description: 'Enable/disable 3D LUT mapping (processing/3d-lut/enabled)',
      category: 'config',
      params: {
        enabled: { type: 'boolean', label: 'Enable' },
      },
    },
    {
      type: 'set-scaler-enabled',
      label: 'Scaler',
      description: 'Enable/disable scaler (processing/scaler/enabled)',
      category: 'config',
      params: {
        enabled: { type: 'boolean', label: 'Enable' },
      },
    },
    {
      type: 'set-osca-module-correction',
      label: 'OSCA Module Correction',
      description: 'Enable/disable OSCA module correction (processing/osca/module-correction-enabled)',
      category: 'config',
      params: {
        enabled: { type: 'boolean', label: 'Enable' },
      },
    },
    {
      type: 'set-osca-seam-correction',
      label: 'OSCA Seam Correction',
      description: 'Enable/disable OSCA seam correction (processing/osca/seam-correction-enabled)',
      category: 'config',
      params: {
        enabled: { type: 'boolean', label: 'Enable' },
      },
    },
    {
      type: 'get-status',
      label: 'Get Status',
      description: 'Read full processor status (temperatures, fans, uptime, firmware)',
      category: 'diagnostic',
    },
    {
      type: 'set-network-bit-depth',
      label: 'Network Bit Depth',
      description: 'Set the output network bit depth (8, 10, or 12)',
      category: 'config',
      params: {
        bitDepth: { type: 'number', label: 'Bit Depth', min: 8, max: 12 },
      },
    },
    {
      type: 'set-genlock-source',
      label: 'Genlock Source',
      description: 'Set the genlock reference source',
      category: 'config',
      params: {
        source: {
          type: 'string',
          label: 'Source',
          options: ['internal', 'sdi', 'sdi-a', 'sdi-b', 'hdmi', 'dvi', 'ref-in', 'active-input'],
        },
      },
    },
    {
      type: 'set-genlock-internal-rate',
      label: 'Genlock Internal Rate',
      description: 'Set the genlock internal refresh rate in Hz (23.5-251)',
      category: 'config',
      params: {
        rate: { type: 'number', label: 'Rate (Hz)', min: 23.5, max: 251 },
      },
    },
    {
      type: 'set-frame-rate-multiplier',
      label: 'Frame Rate Multiplier',
      description: 'Set the output frame rate multiplier (1-10)',
      category: 'config',
      params: {
        multiplier: { type: 'number', label: 'Multiplier', min: 1, max: 10 },
      },
    },
    {
      type: 'get-failover-status',
      label: 'Failover Status',
      description: 'Read the current failover state (active, partner present)',
      category: 'diagnostic',
    },
    {
      type: 'request-failover',
      label: 'Request Failover',
      description: 'Trigger a manual failover to the partner processor',
      category: 'control',
      confirmRequired: true,
    },
    {
      type: 'set-shuttersync-mode',
      label: 'ShutterSync Mode',
      description: 'Set the ShutterSync mode for camera synchronisation',
      category: 'config',
      params: {
        mode: {
          type: 'string',
          label: 'Mode',
          options: ['none', 'speed', 'angle'],
        },
      },
    },
    {
      type: 'set-hidden-markers',
      label: 'Hidden Markers',
      description: 'Enable/disable hidden markers and set marker mode',
      category: 'config',
      params: {
        enabled: { type: 'boolean', label: 'Enable' },
        mode: {
          type: 'string',
          label: 'Mode',
          options: ['none', 'redspy', 'startracker', 'custom'],
        },
      },
    },
    {
      type: 'get-panel-stats',
      label: 'Panel Statistics',
      description: 'Get panel statistics (associated count, online count, error count)',
      category: 'diagnostic',
    },
    {
      type: 'get-preset-info',
      label: 'Preset Info',
      description: 'Get active preset name and number',
      category: 'diagnostic',
    },
    {
      type: 'get-project-name',
      label: 'Project Name',
      description: 'Get current project name',
      category: 'diagnostic',
    },
    {
      type: 'get-input-info',
      label: 'Input Info',
      description: 'Get current input source, resolution, refresh rate, and HDR format',
      category: 'diagnostic',
    },
    {
      type: 'get-output-settings',
      label: 'Output Settings',
      description: 'Read global colour output settings (brightness, colour-temperature, gamma, gains, dark-magic, puretone, overdrive, extended-bit-depth)',
      category: 'diagnostic',
      confirmRequired: false,
    },
    {
      type: 'get-processing-status',
      label: 'Processing Status',
      description: 'Read processing pipeline status (colour-correct, 3d-lut, osca, scaler, colour-replace, curves)',
      category: 'diagnostic',
      confirmRequired: false,
    },
    {
      type: 'get-override-status',
      label: 'Override Status',
      description: 'Read override state (blackout, freeze, test-pattern)',
      category: 'diagnostic',
      confirmRequired: false,
    },
    {
      type: 'get-network-settings',
      label: 'Network Settings',
      description: 'Read output network settings (bit-depth, genlock, frame-rate-multiplier, shuttersync, hidden-markers, failover)',
      category: 'diagnostic',
      confirmRequired: false,
    },
    {
      type: 'get-device-list',
      label: 'Device List',
      description: 'List connected panels/modules with type, firmware, and statistics',
      category: 'diagnostic',
      confirmRequired: false,
    },
  ],

  disguise: [
    {
      type: 'play',
      label: 'Play',
      description: 'Start transport playback',
      category: 'control',
    },
    {
      type: 'stop',
      label: 'Stop',
      description: 'Stop transport',
      category: 'control',
    },
    {
      type: 'goto-cue',
      label: 'Go to Cue',
      description: 'Jump to a specific cue point',
      category: 'control',
      params: {
        cueId: { type: 'string', label: 'Cue ID' },
      },
    },
    {
      type: 'jump-timecode',
      label: 'Jump to Timecode',
      description: 'Seek to a specific timecode',
      category: 'control',
      params: {
        timecode: { type: 'string', label: 'Timecode (HH:MM:SS:FF)' },
      },
    },
    {
      type: 'restart-service',
      label: 'Restart d3',
      description: 'Restart the d3 service on this machine',
      category: 'config',
      confirmRequired: true,
    },
    {
      type: 'understudy-takeover',
      label: 'Understudy Takeover',
      description: 'Promote an understudy machine to active role',
      category: 'control',
      params: {
        actorIndex: { type: 'number', label: 'Actor Index' },
      },
      confirmRequired: true,
    },
  ],

  aja: [
    {
      type: 'set-crosspoint',
      label: 'Set Route',
      description: 'Route an input to an output',
      category: 'control',
      params: {
        input: { type: 'number', label: 'Input', min: 1 },
        output: { type: 'number', label: 'Output', min: 1 },
      },
    },
    {
      type: 'get-status',
      label: 'Get Status',
      description: 'Read current router configuration and signal state',
      category: 'diagnostic',
    },
    {
      type: 'label-input',
      label: 'Label Input',
      description: 'Rename an input port',
      category: 'config',
      params: {
        index: { type: 'number', label: 'Input #' },
        label: { type: 'string', label: 'Name' },
      },
    },
    {
      type: 'label-output',
      label: 'Label Output',
      description: 'Rename an output port',
      category: 'config',
      params: {
        index: { type: 'number', label: 'Output #' },
        label: { type: 'string', label: 'Name' },
      },
    },
  ],

  lightware: [
    {
      type: 'set-crosspoint',
      label: 'Set Route',
      description: 'Route an input to an output',
      category: 'control',
      params: {
        input: { type: 'number', label: 'Input', min: 1 },
        output: { type: 'number', label: 'Output', min: 1 },
      },
    },
  ],

  blackmagic: [
    {
      type: 'set-crosspoint',
      label: 'Set Route',
      description: 'Route an input to an output',
      category: 'control',
      params: {
        input: { type: 'number', label: 'Input', min: 1 },
        output: { type: 'number', label: 'Output', min: 1 },
      },
    },
  ],

  ross: [
    {
      type: 'get-frame-status',
      label: 'Frame Status',
      description: 'Read openGear frame status (slots, PSU, temperature)',
      category: 'diagnostic',
    },
    {
      type: 'get-card-status',
      label: 'Card Status',
      description: 'Read status of a specific card slot',
      category: 'diagnostic',
      params: {
        slot: { type: 'number', label: 'Slot #', min: 1, max: 20 },
      },
    },
  ],

  brainstorm: [
    {
      type: 'get-timecode-status',
      label: 'Timecode Status',
      description: 'Read current timecode value and sync state',
      category: 'diagnostic',
    },
    {
      type: 'get-sync-status',
      label: 'Sync Status',
      description: 'Read clock sync and reference lock status',
      category: 'diagnostic',
    },
  ],

  barco: [
    {
      type: 'select-input',
      label: 'Select Input',
      description: 'Switch the active input source',
      category: 'control',
      params: {
        input: { type: 'number', label: 'Input #', min: 1, max: 4 },
      },
    },
    {
      type: 'set-output-resolution',
      label: 'Output Resolution',
      description: 'Set the output resolution',
      category: 'config',
      params: {
        resolution: {
          type: 'string',
          label: 'Resolution',
          options: ['1920x1080p60', '1920x1080p50', '3840x2160p60', '3840x2160p30', '1280x720p60'],
        },
      },
    },
    {
      type: 'freeze',
      label: 'Freeze',
      description: 'Freeze the current output frame',
      category: 'control',
      params: {
        enabled: { type: 'boolean', label: 'Enable' },
      },
    },
    {
      type: 'test-pattern',
      label: 'Test Pattern',
      description: 'Display a test pattern on the output',
      category: 'diagnostic',
      params: {
        pattern: {
          type: 'string',
          label: 'Pattern',
          options: ['color-bars', 'white', 'black', 'grid', 'ramp'],
        },
      },
    },
  ],
};
