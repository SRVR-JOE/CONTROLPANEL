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
      description: 'Set LED panel brightness percentage',
      category: 'control',
      params: {
        value: { type: 'number', label: 'Brightness %', min: 0, max: 100 },
      },
    },
    {
      type: 'blackout',
      label: 'Blackout',
      description: 'Toggle blackout on all outputs',
      category: 'control',
      params: {
        enabled: { type: 'boolean', label: 'Enable' },
      },
      confirmRequired: true,
    },
    {
      type: 'test-pattern',
      label: 'Test Pattern',
      description: 'Display a test pattern on all outputs',
      category: 'diagnostic',
      params: {
        pattern: {
          type: 'string',
          label: 'Pattern',
          options: ['color-bars', 'white', 'red', 'green', 'blue', 'gradient', 'grid'],
        },
      },
    },
    {
      type: 'freeze',
      label: 'Freeze Frame',
      description: 'Freeze the current output frame',
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
          options: ['SDI 1', 'SDI 2', 'HDMI 1', 'DP 1'],
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
};
