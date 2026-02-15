// ============================================================
// Bitfocus Companion Module Registry
// Complete module definitions for all supported AV manufacturers
// ============================================================

import { CompanionModule } from '@/types';

export const companionModules: CompanionModule[] = [
  // ============================================================
  // DISGUISE - 3 modules
  // ============================================================

  // --- disguise-osc ---
  {
    id: 'companion-mod-disguise-osc',
    moduleId: 'disguise-osc',
    name: 'disguise OSC',
    manufacturer: 'disguise',
    protocol: 'OSC/UDP',
    defaultPort: 8000,
    description:
      'Control disguise media servers via OSC. Supports transport control, track and section navigation, cue triggering, and output level management.',
    actions: [
      {
        id: 'play',
        name: 'Play',
        description: 'Start playback on the current track',
        options: [],
      },
      {
        id: 'play_section',
        name: 'Play Section',
        description: 'Play a specific section by name or index',
        options: [
          {
            id: 'section',
            type: 'textinput',
            label: 'Section Name or Index',
            default: '',
          },
        ],
      },
      {
        id: 'loop_section',
        name: 'Loop Section',
        description: 'Loop a specific section',
        options: [
          {
            id: 'section',
            type: 'textinput',
            label: 'Section Name or Index',
            default: '',
          },
        ],
      },
      {
        id: 'stop',
        name: 'Stop',
        description: 'Stop playback',
        options: [],
      },
      {
        id: 'hold',
        name: 'Hold',
        description: 'Hold playback at current position',
        options: [],
      },
      {
        id: 'prev_section',
        name: 'Previous Section',
        description: 'Go to the previous section in the current track',
        options: [],
      },
      {
        id: 'next_section',
        name: 'Next Section',
        description: 'Go to the next section in the current track',
        options: [],
      },
      {
        id: 'return_to_start',
        name: 'Return to Start',
        description: 'Return playback to the start of the current track',
        options: [],
      },
      {
        id: 'prev_track',
        name: 'Previous Track',
        description: 'Go to the previous track',
        options: [],
      },
      {
        id: 'next_track',
        name: 'Next Track',
        description: 'Go to the next track',
        options: [],
      },
      {
        id: 'goto_track_id',
        name: 'Go to Track by ID',
        description: 'Jump to a specific track by its numeric ID',
        options: [
          {
            id: 'track_id',
            type: 'number',
            label: 'Track ID',
            default: 1,
          },
        ],
      },
      {
        id: 'goto_track_name',
        name: 'Go to Track by Name',
        description: 'Jump to a specific track by its name',
        options: [
          {
            id: 'track_name',
            type: 'textinput',
            label: 'Track Name',
            default: '',
          },
        ],
      },
      {
        id: 'trigger_cue',
        name: 'Trigger Cue',
        description: 'Trigger a numbered cue',
        options: [
          {
            id: 'cue_number',
            type: 'number',
            label: 'Cue Number',
            default: 1,
          },
        ],
      },
      {
        id: 'float_cue',
        name: 'Float Cue',
        description: 'Float a numbered cue value',
        options: [
          {
            id: 'cue_number',
            type: 'number',
            label: 'Cue Number',
            default: 1,
          },
          {
            id: 'value',
            type: 'number',
            label: 'Value (0.0 - 1.0)',
            default: 0,
          },
        ],
      },
      {
        id: 'set_volume',
        name: 'Set Volume',
        description: 'Set the master audio volume',
        options: [
          {
            id: 'volume',
            type: 'number',
            label: 'Volume (0 - 100)',
            default: 100,
          },
        ],
      },
      {
        id: 'set_brightness',
        name: 'Set Brightness',
        description: 'Set the overall output brightness',
        options: [
          {
            id: 'brightness',
            type: 'number',
            label: 'Brightness (0 - 100)',
            default: 100,
          },
        ],
      },
      {
        id: 'fade_up',
        name: 'Fade Up',
        description: 'Fade output to full brightness',
        options: [
          {
            id: 'duration',
            type: 'number',
            label: 'Duration (seconds)',
            default: 2,
          },
        ],
      },
      {
        id: 'fade_down',
        name: 'Fade Down',
        description: 'Fade output to black',
        options: [
          {
            id: 'duration',
            type: 'number',
            label: 'Duration (seconds)',
            default: 2,
          },
        ],
      },
    ],
    feedbacks: [],
    variables: [],
    supportedModels: ['gx 3', 'gx 2c', 'vx 4', 'vx 2', 'vx 1', 'solo', 'rx II'],
  },

  // --- disguise-smc ---
  {
    id: 'companion-mod-disguise-smc',
    moduleId: 'disguise-smc',
    name: 'disguise SMC',
    manufacturer: 'disguise',
    protocol: 'HTTP',
    defaultPort: 80,
    description:
      'Manage disguise servers via the SMC (Server Management Controller). Provides power control, identification, and system monitoring.',
    actions: [
      {
        id: 'power_on',
        name: 'Power On',
        description: 'Power on the disguise server',
        options: [
          {
            id: 'target',
            type: 'dropdown',
            label: 'Target',
            default: 'all',
            choices: [
              { id: 'all', label: 'All Machines' },
              { id: 'director', label: 'Director Only' },
              { id: 'actors', label: 'Actors Only' },
              { id: 'understudy', label: 'Understudy Only' },
            ],
          },
        ],
      },
      {
        id: 'power_off',
        name: 'Power Off',
        description: 'Power off the disguise server',
        options: [
          {
            id: 'target',
            type: 'dropdown',
            label: 'Target',
            default: 'all',
            choices: [
              { id: 'all', label: 'All Machines' },
              { id: 'director', label: 'Director Only' },
              { id: 'actors', label: 'Actors Only' },
              { id: 'understudy', label: 'Understudy Only' },
            ],
          },
        ],
      },
      {
        id: 'power_cycle',
        name: 'Power Cycle',
        description: 'Restart the disguise server',
        options: [
          {
            id: 'target',
            type: 'dropdown',
            label: 'Target',
            default: 'all',
            choices: [
              { id: 'all', label: 'All Machines' },
              { id: 'director', label: 'Director Only' },
              { id: 'actors', label: 'Actors Only' },
              { id: 'understudy', label: 'Understudy Only' },
            ],
          },
        ],
      },
      {
        id: 'flash_lcd',
        name: 'Flash LCD',
        description: 'Flash the front-panel LCD to physically identify the server',
        options: [
          {
            id: 'duration',
            type: 'number',
            label: 'Duration (seconds)',
            default: 5,
          },
        ],
      },
      {
        id: 'send_notification',
        name: 'Send Notification',
        description: 'Send a text notification to the SMC display',
        options: [
          {
            id: 'message',
            type: 'textinput',
            label: 'Notification Message',
            default: '',
          },
        ],
      },
      {
        id: 'set_led_strip',
        name: 'Set LED Strip',
        description: 'Set the LED strip colour mode on the server chassis',
        options: [
          {
            id: 'mode',
            type: 'dropdown',
            label: 'LED Strip Mode',
            default: 'role',
            choices: [
              { id: 'role', label: 'Role Colour' },
              { id: 'status', label: 'Status Indicator' },
              { id: 'off', label: 'Off' },
              { id: 'custom', label: 'Custom Colour' },
            ],
          },
          {
            id: 'color',
            type: 'textinput',
            label: 'Custom Colour (hex, e.g. #FF3366)',
            default: '#FF3366',
          },
        ],
      },
    ],
    feedbacks: [
      {
        id: 'system_power',
        name: 'System Power',
        description: 'Indicates whether the server is powered on',
        type: 'boolean',
      },
      {
        id: 'power_fault',
        name: 'Power Fault',
        description: 'Indicates a power supply fault condition',
        type: 'boolean',
      },
    ],
    variables: [
      { id: 'serial', name: 'Serial Number' },
      { id: 'name', name: 'Machine Name' },
      { id: 'type', name: 'Machine Type' },
      { id: 'role', name: 'Machine Role' },
      { id: 'systemPower', name: 'System Power State' },
      { id: 'powerOverload', name: 'Power Overload' },
      { id: 'mainPowerFault', name: 'Main Power Fault' },
      { id: 'powerControlFault', name: 'Power Control Fault' },
      { id: 'ledStripMode', name: 'LED Strip Mode' },
    ],
    supportedModels: ['gx 3', 'gx 2c', 'vx 4', 'vx 2', 'vx 1', 'solo', 'rx II'],
  },

  // --- disguise-liveupdate ---
  {
    id: 'companion-mod-disguise-liveupdate',
    moduleId: 'disguise-liveupdate',
    name: 'disguise LiveUpdate',
    manufacturer: 'disguise',
    protocol: 'WebSocket',
    defaultPort: 80,
    description:
      'Push and receive live variable values to/from disguise via the LiveUpdate WebSocket API. Supports string, number, boolean, and JSON variable types.',
    actions: [
      {
        id: 'set_string',
        name: 'Set to Disguise (String)',
        description: 'Set a string variable on the disguise project',
        options: [
          {
            id: 'variable_name',
            type: 'textinput',
            label: 'Variable Name',
            default: '',
          },
          {
            id: 'value',
            type: 'textinput',
            label: 'String Value',
            default: '',
          },
        ],
      },
      {
        id: 'set_number',
        name: 'Set to Disguise (Number)',
        description: 'Set a numeric variable on the disguise project',
        options: [
          {
            id: 'variable_name',
            type: 'textinput',
            label: 'Variable Name',
            default: '',
          },
          {
            id: 'value',
            type: 'number',
            label: 'Numeric Value',
            default: 0,
          },
        ],
      },
      {
        id: 'set_boolean',
        name: 'Set to Disguise (Boolean)',
        description: 'Set a boolean variable on the disguise project',
        options: [
          {
            id: 'variable_name',
            type: 'textinput',
            label: 'Variable Name',
            default: '',
          },
          {
            id: 'value',
            type: 'checkbox',
            label: 'Boolean Value',
            default: false,
          },
        ],
      },
      {
        id: 'set_json',
        name: 'Set to Disguise (JSON)',
        description: 'Set a JSON-encoded variable on the disguise project',
        options: [
          {
            id: 'variable_name',
            type: 'textinput',
            label: 'Variable Name',
            default: '',
          },
          {
            id: 'value',
            type: 'textinput',
            label: 'JSON Value',
            default: '{}',
          },
        ],
      },
    ],
    feedbacks: [
      {
        id: 'liveupdate_variable',
        name: 'LiveUpdate Variable',
        description: 'Feedback when a LiveUpdate variable changes value',
        type: 'advanced',
      },
      {
        id: 'connection_ok',
        name: 'Connection OK',
        description: 'Indicates WebSocket connection to disguise is active',
        type: 'boolean',
      },
    ],
    variables: [
      { id: 'connection_status', name: 'Connection Status' },
    ],
    supportedModels: ['gx 3', 'gx 2c', 'vx 4', 'vx 2', 'vx 1', 'solo', 'rx II'],
  },

  // ============================================================
  // BARCO - 2 modules
  // ============================================================

  // --- barco-eventmaster ---
  {
    id: 'companion-mod-barco-eventmaster',
    moduleId: 'barco-eventmaster',
    name: 'Barco Event Master',
    manufacturer: 'barco',
    protocol: 'JSON API',
    defaultPort: 9999,
    description:
      'Full control of Barco E2/EX/S3-4K Event Master processors. Recall and manage presets, cues, sources, destinations, and multi-viewer layouts via the JSON-based API.',
    actions: [
      {
        id: 'recall_preset',
        name: 'Recall Preset',
        description: 'Recall a preset by ID',
        options: [
          {
            id: 'preset_id',
            type: 'number',
            label: 'Preset ID',
            default: 0,
          },
          {
            id: 'transition_type',
            type: 'dropdown',
            label: 'Transition Type',
            default: 'cut',
            choices: [
              { id: 'cut', label: 'Cut' },
              { id: 'trans', label: 'Transition' },
            ],
          },
        ],
      },
      {
        id: 'save_preset',
        name: 'Save Preset',
        description: 'Save the current state to a preset slot',
        options: [
          {
            id: 'preset_id',
            type: 'number',
            label: 'Preset ID',
            default: 0,
          },
          {
            id: 'preset_name',
            type: 'textinput',
            label: 'Preset Name',
            default: '',
          },
        ],
      },
      {
        id: 'delete_preset',
        name: 'Delete Preset',
        description: 'Delete a preset by ID',
        options: [
          {
            id: 'preset_id',
            type: 'number',
            label: 'Preset ID',
            default: 0,
          },
        ],
      },
      {
        id: 'rename_preset',
        name: 'Rename Preset',
        description: 'Rename an existing preset',
        options: [
          {
            id: 'preset_id',
            type: 'number',
            label: 'Preset ID',
            default: 0,
          },
          {
            id: 'new_name',
            type: 'textinput',
            label: 'New Preset Name',
            default: '',
          },
        ],
      },
      {
        id: 'recall_next',
        name: 'Recall Next',
        description: 'Recall the next preset in sequence',
        options: [],
      },
      {
        id: 'cut',
        name: 'Cut',
        description: 'Execute a cut transition on all armed destinations',
        options: [],
      },
      {
        id: 'trans_take',
        name: 'Trans/Take',
        description: 'Execute a programmed transition on all armed destinations',
        options: [],
      },
      {
        id: 'play_cue',
        name: 'Play Cue',
        description: 'Play a cue by ID',
        options: [
          {
            id: 'cue_id',
            type: 'number',
            label: 'Cue ID',
            default: 0,
          },
        ],
      },
      {
        id: 'stop_cue',
        name: 'Stop Cue',
        description: 'Stop a running cue by ID',
        options: [
          {
            id: 'cue_id',
            type: 'number',
            label: 'Cue ID',
            default: 0,
          },
        ],
      },
      {
        id: 'pause_cue',
        name: 'Pause Cue',
        description: 'Pause a running cue by ID',
        options: [
          {
            id: 'cue_id',
            type: 'number',
            label: 'Cue ID',
            default: 0,
          },
        ],
      },
      {
        id: 'freeze_source',
        name: 'Freeze Source',
        description: 'Freeze a source input',
        options: [
          {
            id: 'source_id',
            type: 'number',
            label: 'Source ID',
            default: 0,
          },
        ],
      },
      {
        id: 'unfreeze_source',
        name: 'Unfreeze Source',
        description: 'Unfreeze a source input',
        options: [
          {
            id: 'source_id',
            type: 'number',
            label: 'Source ID',
            default: 0,
          },
        ],
      },
      {
        id: 'freeze_destination',
        name: 'Freeze Destination',
        description: 'Freeze a destination output',
        options: [
          {
            id: 'destination_id',
            type: 'number',
            label: 'Destination ID',
            default: 0,
          },
        ],
      },
      {
        id: 'unfreeze_destination',
        name: 'Unfreeze Destination',
        description: 'Unfreeze a destination output',
        options: [
          {
            id: 'destination_id',
            type: 'number',
            label: 'Destination ID',
            default: 0,
          },
        ],
      },
      {
        id: 'arm_destination',
        name: 'Arm Destination',
        description: 'Arm a screen destination for the next transition',
        options: [
          {
            id: 'destination_id',
            type: 'number',
            label: 'Destination ID',
            default: 0,
          },
        ],
      },
      {
        id: 'unarm_destination',
        name: 'Unarm Destination',
        description: 'Unarm a screen destination',
        options: [
          {
            id: 'destination_id',
            type: 'number',
            label: 'Destination ID',
            default: 0,
          },
        ],
      },
      {
        id: 'change_aux_content',
        name: 'Change AUX Content',
        description: 'Change the source assigned to an AUX output',
        options: [
          {
            id: 'aux_id',
            type: 'number',
            label: 'AUX Destination ID',
            default: 0,
          },
          {
            id: 'source_id',
            type: 'number',
            label: 'Source ID',
            default: 0,
          },
        ],
      },
      {
        id: 'change_screen_content',
        name: 'Change Screen Content',
        description: 'Change the source assigned to a screen layer',
        options: [
          {
            id: 'screen_id',
            type: 'number',
            label: 'Screen Destination ID',
            default: 0,
          },
          {
            id: 'layer_id',
            type: 'number',
            label: 'Layer ID',
            default: 0,
          },
          {
            id: 'source_id',
            type: 'number',
            label: 'Source ID',
            default: 0,
          },
        ],
      },
      {
        id: 'activate_dest_group',
        name: 'Activate Destination Group',
        description: 'Activate a destination group by ID',
        options: [
          {
            id: 'group_id',
            type: 'number',
            label: 'Destination Group ID',
            default: 0,
          },
        ],
      },
      {
        id: 'activate_mvr_preset',
        name: 'Activate MVR Preset',
        description: 'Activate a multi-viewer preset',
        options: [
          {
            id: 'mvr_preset_id',
            type: 'number',
            label: 'MVR Preset ID',
            default: 0,
          },
        ],
      },
    ],
    feedbacks: [
      {
        id: 'simple_tally',
        name: 'Simple Tally',
        description: 'Indicates whether a source is live on any destination',
        type: 'boolean',
      },
      {
        id: 'advanced_tally',
        name: 'Advanced Tally',
        description: 'Detailed tally information per source/destination pair',
        type: 'advanced',
      },
    ],
    variables: [
      { id: 'frame_IP', name: 'Frame IP Address' },
      { id: 'frame_version', name: 'Frame Firmware Version' },
      { id: 'frame_os_version', name: 'Frame OS Version' },
      { id: 'power_status_1', name: 'Power Supply 1 Status' },
      { id: 'power_status_2', name: 'Power Supply 2 Status' },
    ],
    supportedModels: ['E2', 'EX', 'S3-4K'],
  },

  // --- barco-pds ---
  {
    id: 'companion-mod-barco-pds',
    moduleId: 'barco-pds',
    name: 'Barco PDS',
    manufacturer: 'barco',
    protocol: 'Serial/TCP',
    defaultPort: 3000,
    description:
      'Control Barco PDS seamless switchers via serial or TCP. Manage input selection, transitions, freeze, test patterns, and logo recall.',
    actions: [
      {
        id: 'take',
        name: 'Take',
        description: 'Execute a take transition to the preview source',
        options: [],
      },
      {
        id: 'select_input',
        name: 'Select Input',
        description: 'Select an input source for preview',
        options: [
          {
            id: 'input',
            type: 'dropdown',
            label: 'Input',
            default: '1',
            choices: [
              { id: '1', label: 'Input 1' },
              { id: '2', label: 'Input 2' },
              { id: '3', label: 'Input 3' },
              { id: '4', label: 'Input 4' },
              { id: '5', label: 'Input 5' },
              { id: '6', label: 'Input 6' },
              { id: '7', label: 'Input 7' },
              { id: '8', label: 'Input 8' },
            ],
          },
        ],
      },
      {
        id: 'freeze',
        name: 'Freeze',
        description: 'Toggle freeze on the output',
        options: [
          {
            id: 'state',
            type: 'dropdown',
            label: 'Freeze State',
            default: 'toggle',
            choices: [
              { id: 'on', label: 'Freeze On' },
              { id: 'off', label: 'Freeze Off' },
              { id: 'toggle', label: 'Toggle' },
            ],
          },
        ],
      },
      {
        id: 'set_black_output',
        name: 'Set Black Output',
        description: 'Set the output to black',
        options: [
          {
            id: 'state',
            type: 'dropdown',
            label: 'Black State',
            default: 'toggle',
            choices: [
              { id: 'on', label: 'Black On' },
              { id: 'off', label: 'Black Off' },
              { id: 'toggle', label: 'Toggle' },
            ],
          },
        ],
      },
      {
        id: 'set_test_pattern',
        name: 'Set Test Pattern',
        description: 'Display a test pattern on the output',
        options: [
          {
            id: 'pattern',
            type: 'dropdown',
            label: 'Test Pattern',
            default: 'off',
            choices: [
              { id: 'off', label: 'Off' },
              { id: 'colorbars', label: 'Color Bars' },
              { id: 'grid', label: 'Grid' },
              { id: 'white', label: 'White Field' },
              { id: 'red', label: 'Red Field' },
              { id: 'green', label: 'Green Field' },
              { id: 'blue', label: 'Blue Field' },
            ],
          },
        ],
      },
      {
        id: 'set_transition_time',
        name: 'Set Transition Time',
        description: 'Set the transition duration in frames',
        options: [
          {
            id: 'frames',
            type: 'number',
            label: 'Duration (frames)',
            default: 30,
          },
        ],
      },
      {
        id: 'save_logo',
        name: 'Save Logo',
        description: 'Save the current input to a logo slot',
        options: [
          {
            id: 'slot',
            type: 'dropdown',
            label: 'Logo Slot',
            default: '1',
            choices: [
              { id: '1', label: 'Logo 1' },
              { id: '2', label: 'Logo 2' },
              { id: '3', label: 'Logo 3' },
              { id: '4', label: 'Logo 4' },
            ],
          },
        ],
      },
      {
        id: 'set_autotake',
        name: 'Set Autotake',
        description: 'Enable or disable autotake mode',
        options: [
          {
            id: 'enabled',
            type: 'checkbox',
            label: 'Autotake Enabled',
            default: false,
          },
        ],
      },
    ],
    feedbacks: [],
    variables: [],
    supportedModels: ['PDS-4K', 'PDS-701', 'PDS-901', 'PDS-902'],
  },

  // ============================================================
  // BROMPTON - 1 module
  // ============================================================

  // --- brompton-tessera ---
  {
    id: 'companion-mod-brompton-tessera',
    moduleId: 'brompton-tessera',
    name: 'Brompton Tessera',
    manufacturer: 'brompton',
    protocol: 'HTTP REST API',
    defaultPort: 80,
    description:
      'Comprehensive control of Brompton Tessera LED processors. Manage input routing, colour processing, brightness, test patterns, presets, and system functions via the REST API.',
    actions: [
      {
        id: 'set_input_port',
        name: 'Set Input Port',
        description: 'Select the active input port number',
        options: [
          {
            id: 'port',
            type: 'dropdown',
            label: 'Input Port',
            default: '1',
            choices: [
              { id: '1', label: 'Port 1' },
              { id: '2', label: 'Port 2' },
              { id: '3', label: 'Port 3' },
              { id: '4', label: 'Port 4' },
            ],
          },
        ],
      },
      {
        id: 'set_input_type',
        name: 'Set Input Type',
        description: 'Set the input signal type',
        options: [
          {
            id: 'type',
            type: 'dropdown',
            label: 'Input Type',
            default: 'sdi',
            choices: [
              { id: 'sdi', label: 'SDI' },
              { id: 'hdmi', label: 'HDMI' },
              { id: 'displayport', label: 'DisplayPort' },
              { id: 'dvi', label: 'DVI' },
            ],
          },
        ],
      },
      {
        id: 'toggle_scaler',
        name: 'Toggle Scaler',
        description: 'Enable or disable the input scaler',
        options: [
          {
            id: 'enabled',
            type: 'checkbox',
            label: 'Scaler Enabled',
            default: false,
          },
        ],
      },
      {
        id: 'toggle_colour_replace',
        name: 'Toggle Colour Replace',
        description: 'Enable or disable colour replacement processing',
        options: [
          {
            id: 'enabled',
            type: 'checkbox',
            label: 'Colour Replace Enabled',
            default: false,
          },
        ],
      },
      {
        id: 'toggle_14way_correction',
        name: 'Toggle 14-Way Correction',
        description: 'Enable or disable 14-way colour correction',
        options: [
          {
            id: 'enabled',
            type: 'checkbox',
            label: '14-Way Correction Enabled',
            default: true,
          },
        ],
      },
      {
        id: 'toggle_curves',
        name: 'Toggle Curves',
        description: 'Enable or disable colour curves',
        options: [
          {
            id: 'enabled',
            type: 'checkbox',
            label: 'Curves Enabled',
            default: false,
          },
        ],
      },
      {
        id: 'toggle_3d_lut',
        name: 'Toggle 3D LUT',
        description: 'Enable or disable the 3D lookup table',
        options: [
          {
            id: 'enabled',
            type: 'checkbox',
            label: '3D LUT Enabled',
            default: false,
          },
        ],
      },
      {
        id: 'set_lut_strength',
        name: 'Set LUT Strength',
        description: 'Set the LUT blending strength',
        options: [
          {
            id: 'strength',
            type: 'number',
            label: 'LUT Strength (0 - 100)',
            default: 100,
          },
        ],
      },
      {
        id: 'toggle_blackout',
        name: 'Toggle Blackout',
        description: 'Enable or disable output blackout',
        options: [
          {
            id: 'enabled',
            type: 'checkbox',
            label: 'Blackout Enabled',
            default: false,
          },
        ],
      },
      {
        id: 'toggle_freeze',
        name: 'Toggle Freeze',
        description: 'Enable or disable output freeze',
        options: [
          {
            id: 'enabled',
            type: 'checkbox',
            label: 'Freeze Enabled',
            default: false,
          },
        ],
      },
      {
        id: 'toggle_test_pattern',
        name: 'Toggle Test Pattern',
        description: 'Enable or disable the test pattern output',
        options: [
          {
            id: 'enabled',
            type: 'checkbox',
            label: 'Test Pattern Enabled',
            default: false,
          },
        ],
      },
      {
        id: 'set_test_pattern_type',
        name: 'Set Test Pattern Type',
        description: 'Select the test pattern to display',
        options: [
          {
            id: 'pattern',
            type: 'dropdown',
            label: 'Test Pattern',
            default: 'white',
            choices: [
              { id: 'white', label: 'White' },
              { id: 'red', label: 'Red' },
              { id: 'green', label: 'Green' },
              { id: 'blue', label: 'Blue' },
              { id: 'cyan', label: 'Cyan' },
              { id: 'magenta', label: 'Magenta' },
              { id: 'yellow', label: 'Yellow' },
              { id: 'grid', label: 'Grid' },
              { id: 'gradient', label: 'Gradient' },
              { id: 'smpte', label: 'SMPTE Bars' },
              { id: 'custom', label: 'Custom' },
            ],
          },
        ],
      },
      {
        id: 'set_brightness',
        name: 'Set Brightness',
        description: 'Set the output brightness percentage',
        options: [
          {
            id: 'brightness',
            type: 'number',
            label: 'Brightness (0 - 100)',
            default: 100,
          },
        ],
      },
      {
        id: 'increase_brightness',
        name: 'Increase Brightness',
        description: 'Increase brightness by a specified step',
        options: [
          {
            id: 'step',
            type: 'number',
            label: 'Step (%)',
            default: 5,
          },
        ],
      },
      {
        id: 'decrease_brightness',
        name: 'Decrease Brightness',
        description: 'Decrease brightness by a specified step',
        options: [
          {
            id: 'step',
            type: 'number',
            label: 'Step (%)',
            default: 5,
          },
        ],
      },
      {
        id: 'max_brightness',
        name: 'Max Brightness',
        description: 'Set brightness to the maximum value',
        options: [],
      },
      {
        id: 'toggle_overdrive',
        name: 'Toggle Overdrive',
        description: 'Enable or disable LED overdrive',
        options: [
          {
            id: 'enabled',
            type: 'checkbox',
            label: 'Overdrive Enabled',
            default: false,
          },
        ],
      },
      {
        id: 'set_colour_temperature',
        name: 'Set Colour Temperature',
        description: 'Set the output colour temperature in Kelvin',
        options: [
          {
            id: 'kelvin',
            type: 'number',
            label: 'Colour Temperature (K)',
            default: 6500,
          },
        ],
      },
      {
        id: 'toggle_dark_magic',
        name: 'Toggle Dark Magic',
        description: 'Enable or disable Dark Magic low-brightness processing',
        options: [
          {
            id: 'enabled',
            type: 'checkbox',
            label: 'Dark Magic Enabled',
            default: true,
          },
        ],
      },
      {
        id: 'toggle_extended_bit_depth',
        name: 'Toggle Extended Bit Depth',
        description: 'Enable or disable extended bit depth output',
        options: [
          {
            id: 'enabled',
            type: 'checkbox',
            label: 'Extended Bit Depth Enabled',
            default: true,
          },
        ],
      },
      {
        id: 'toggle_puretone',
        name: 'Toggle PureTone',
        description: 'Enable or disable PureTone colour calibration',
        options: [
          {
            id: 'enabled',
            type: 'checkbox',
            label: 'PureTone Enabled',
            default: true,
          },
        ],
      },
      {
        id: 'select_preset',
        name: 'Select Preset',
        description: 'Load a numbered preset',
        options: [
          {
            id: 'preset_number',
            type: 'number',
            label: 'Preset Number',
            default: 1,
          },
        ],
      },
      {
        id: 'next_preset',
        name: 'Next Preset',
        description: 'Load the next preset in sequence',
        options: [],
      },
      {
        id: 'previous_preset',
        name: 'Previous Preset',
        description: 'Load the previous preset in sequence',
        options: [],
      },
      {
        id: 'toggle_hidden_markers',
        name: 'Toggle Hidden Markers',
        description: 'Enable or disable hidden panel markers',
        options: [
          {
            id: 'enabled',
            type: 'checkbox',
            label: 'Hidden Markers Enabled',
            default: false,
          },
        ],
      },
      {
        id: 'toggle_frame_remapping',
        name: 'Toggle Frame Remapping',
        description: 'Enable or disable frame rate remapping',
        options: [
          {
            id: 'enabled',
            type: 'checkbox',
            label: 'Frame Remapping Enabled',
            default: false,
          },
        ],
      },
      {
        id: 'shutdown',
        name: 'Shutdown',
        description: 'Shut down the Tessera processor',
        options: [],
      },
      {
        id: 'reboot',
        name: 'Reboot',
        description: 'Reboot the Tessera processor',
        options: [],
      },
      {
        id: 'failover',
        name: 'Failover',
        description: 'Trigger manual failover to the backup processor',
        options: [],
      },
    ],
    feedbacks: [
      {
        id: 'connection_status',
        name: 'Connection Status',
        description: 'Indicates whether the module is connected to the Tessera processor',
        type: 'boolean',
      },
    ],
    variables: [
      { id: 'inputPortNumber', name: 'Input Port Number' },
      { id: 'inputPortType', name: 'Input Port Type' },
      { id: 'scaler', name: 'Scaler State' },
      { id: 'colourReplace', name: 'Colour Replace State' },
      { id: 'blackout', name: 'Blackout State' },
      { id: 'freeze', name: 'Freeze State' },
      { id: 'testPattern', name: 'Test Pattern State' },
      { id: 'outputBrightness', name: 'Output Brightness' },
      { id: 'outputBrightnessPercentage', name: 'Output Brightness (%)' },
      { id: 'overdrive', name: 'Overdrive State' },
      { id: 'outputColourTemperature', name: 'Output Colour Temperature' },
      { id: 'darkMagic', name: 'Dark Magic State' },
      { id: 'extendedBitDepth', name: 'Extended Bit Depth State' },
      { id: 'pureTone', name: 'PureTone State' },
      { id: 'activePresetNumber', name: 'Active Preset Number' },
      { id: 'activePresetName', name: 'Active Preset Name' },
      { id: 'ambientTemperature', name: 'Ambient Temperature' },
      { id: 'cpuTemperature', name: 'CPU Temperature' },
      { id: 'fpgaTemperature', name: 'FPGA Temperature' },
      { id: 'uptime', name: 'System Uptime' },
      { id: 'serialNumber', name: 'Serial Number' },
      { id: 'softwareVersion', name: 'Software Version' },
    ],
    supportedModels: ['Tessera SX40', 'Tessera S8', 'Tessera S4', 'Tessera XD'],
  },

  // ============================================================
  // LIGHTWARE - 1 module
  // ============================================================

  // --- lightware-lw3 ---
  {
    id: 'companion-mod-lightware-lw3',
    moduleId: 'lightware-lw3',
    name: 'Lightware LW3',
    manufacturer: 'lightware',
    protocol: 'LW3 TCP',
    defaultPort: 6107,
    description:
      'Control Lightware matrix switchers and AV devices via the LW3 protocol. Route crosspoints, manage presets, and run macros.',
    actions: [
      {
        id: 'route_crosspoint',
        name: 'Route Crosspoint',
        description: 'Route a specific input to a specific output',
        options: [
          {
            id: 'input',
            type: 'number',
            label: 'Input Number',
            default: 1,
          },
          {
            id: 'output',
            type: 'number',
            label: 'Output Number',
            default: 1,
          },
        ],
      },
      {
        id: 'select_input',
        name: 'Select Input',
        description: 'Pre-select an input for later routing',
        options: [
          {
            id: 'input',
            type: 'number',
            label: 'Input Number',
            default: 1,
          },
        ],
      },
      {
        id: 'select_output',
        name: 'Select Output',
        description: 'Pre-select an output for later routing',
        options: [
          {
            id: 'output',
            type: 'number',
            label: 'Output Number',
            default: 1,
          },
        ],
      },
      {
        id: 'lock_output',
        name: 'Lock Output',
        description: 'Lock an output to prevent routing changes',
        options: [
          {
            id: 'output',
            type: 'number',
            label: 'Output Number',
            default: 1,
          },
        ],
      },
      {
        id: 'unlock_output',
        name: 'Unlock Output',
        description: 'Unlock an output to allow routing changes',
        options: [
          {
            id: 'output',
            type: 'number',
            label: 'Output Number',
            default: 1,
          },
        ],
      },
      {
        id: 'load_preset',
        name: 'Load Preset',
        description: 'Load a stored routing preset',
        options: [
          {
            id: 'preset',
            type: 'number',
            label: 'Preset Number',
            default: 1,
          },
        ],
      },
      {
        id: 'run_macro',
        name: 'Run Macro',
        description: 'Execute a stored macro by number',
        options: [
          {
            id: 'macro',
            type: 'number',
            label: 'Macro Number',
            default: 1,
          },
        ],
      },
    ],
    feedbacks: [
      {
        id: 'crosspoint_status',
        name: 'Crosspoint Status',
        description: 'Indicates whether a specific input-to-output route is active',
        type: 'boolean',
      },
    ],
    variables: [
      { id: 'input_names', name: 'Input Names (dynamic)' },
      { id: 'output_names', name: 'Output Names (dynamic)' },
    ],
    supportedModels: [
      'MX2-16x16',
      'MX2-8x8',
      'MX2-24x24',
      'MMX6x2',
      'UCX-4x2',
      'UBEX-Pro20',
    ],
  },

  // ============================================================
  // AJA - 1 module
  // ============================================================

  // --- aja-kumo ---
  {
    id: 'companion-mod-aja-kumo',
    moduleId: 'aja-kumo',
    name: 'AJA KUMO',
    manufacturer: 'aja',
    protocol: 'HTTP REST API',
    defaultPort: 80,
    description:
      'Control AJA KUMO SDI/IP routers via the HTTP REST API. Route sources to destinations, manage salvos, and swap routes.',
    actions: [
      {
        id: 'route_source_to_dest',
        name: 'Route Source to Destination',
        description: 'Route a specific source to a specific destination',
        options: [
          {
            id: 'source',
            type: 'number',
            label: 'Source Number',
            default: 1,
          },
          {
            id: 'destination',
            type: 'number',
            label: 'Destination Number',
            default: 1,
          },
        ],
      },
      {
        id: 'preselect_destination',
        name: 'Pre-select Destination',
        description: 'Pre-select a destination for subsequent source assignment',
        options: [
          {
            id: 'destination',
            type: 'number',
            label: 'Destination Number',
            default: 1,
          },
        ],
      },
      {
        id: 'send_source_to_selected',
        name: 'Send Source to Selected',
        description: 'Send a source to the currently pre-selected destination',
        options: [
          {
            id: 'source',
            type: 'number',
            label: 'Source Number',
            default: 1,
          },
        ],
      },
      {
        id: 'take_salvo',
        name: 'Take Salvo',
        description: 'Execute a stored salvo (batch routing preset)',
        options: [
          {
            id: 'salvo',
            type: 'number',
            label: 'Salvo Number',
            default: 1,
          },
        ],
      },
      {
        id: 'swap_source',
        name: 'Swap Source Between Destinations',
        description: 'Swap the sources routed to two destinations',
        options: [
          {
            id: 'destination_a',
            type: 'number',
            label: 'Destination A',
            default: 1,
          },
          {
            id: 'destination_b',
            type: 'number',
            label: 'Destination B',
            default: 2,
          },
        ],
      },
    ],
    feedbacks: [
      {
        id: 'active_destination',
        name: 'Active Destination',
        description: 'Indicates which destination is currently selected',
        type: 'boolean',
      },
      {
        id: 'active_source',
        name: 'Active Source',
        description: 'Indicates which source is currently selected',
        type: 'boolean',
      },
      {
        id: 'source_match',
        name: 'Source Match',
        description: 'True when a specific source is routed to the selected destination',
        type: 'boolean',
      },
      {
        id: 'destination_match',
        name: 'Destination Match',
        description: 'True when the selected destination is routed from a specific source',
        type: 'boolean',
      },
    ],
    variables: [
      { id: 'src_name_N', name: 'Source Name (N = source number)' },
      { id: 'dest_name_N', name: 'Destination Name (N = destination number)' },
      { id: 'source', name: 'Selected Source' },
      { id: 'destination', name: 'Selected Destination' },
      { id: 'dest_N_routed', name: 'Destination N Routed Source (N = destination number)' },
      { id: 'salvo_name_N', name: 'Salvo Name (N = salvo number)' },
    ],
    supportedModels: ['KUMO 3232', 'KUMO 1616', 'KUMO 1604', 'KUMO 6464'],
  },

  // ============================================================
  // BLACKMAGIC DESIGN - 3 modules
  // ============================================================

  // --- bmd-videohub ---
  {
    id: 'companion-mod-bmd-videohub',
    moduleId: 'bmd-videohub',
    name: 'Blackmagic Videohub',
    manufacturer: 'blackmagic',
    protocol: 'BMD TCP Protocol',
    defaultPort: 9990,
    description:
      'Control Blackmagic Design Videohub SDI routers via the native TCP protocol. Route sources to destinations, lock/unlock outputs, manage routing tables, and send serial commands.',
    actions: [
      {
        id: 'route_source_to_dest',
        name: 'Route Source to Destination',
        description: 'Route a specific source to a specific destination',
        options: [
          {
            id: 'source',
            type: 'number',
            label: 'Source Number',
            default: 1,
          },
          {
            id: 'destination',
            type: 'number',
            label: 'Destination Number',
            default: 1,
          },
        ],
      },
      {
        id: 'select_destination',
        name: 'Select Destination',
        description: 'Pre-select a destination for source assignment',
        options: [
          {
            id: 'destination',
            type: 'number',
            label: 'Destination Number',
            default: 1,
          },
        ],
      },
      {
        id: 'route_to_selected',
        name: 'Route to Selected',
        description: 'Route a source to the currently selected destination',
        options: [
          {
            id: 'source',
            type: 'number',
            label: 'Source Number',
            default: 1,
          },
        ],
      },
      {
        id: 'copy_route',
        name: 'Copy Route',
        description: 'Copy the routing of one destination to another',
        options: [
          {
            id: 'source_dest',
            type: 'number',
            label: 'Source Destination Number',
            default: 1,
          },
          {
            id: 'target_dest',
            type: 'number',
            label: 'Target Destination Number',
            default: 2,
          },
        ],
      },
      {
        id: 'save_routing_table',
        name: 'Save Routing Table',
        description: 'Save the current routing table to a named slot',
        options: [
          {
            id: 'slot_name',
            type: 'textinput',
            label: 'Slot Name',
            default: '',
          },
        ],
      },
      {
        id: 'restore_routing_table',
        name: 'Restore Routing Table',
        description: 'Restore a previously saved routing table',
        options: [
          {
            id: 'slot_name',
            type: 'textinput',
            label: 'Slot Name',
            default: '',
          },
        ],
      },
      {
        id: 'lock_output',
        name: 'Lock Output',
        description: 'Lock a destination output to prevent routing changes',
        options: [
          {
            id: 'destination',
            type: 'number',
            label: 'Destination Number',
            default: 1,
          },
          {
            id: 'lock_type',
            type: 'dropdown',
            label: 'Lock Type',
            default: 'owned',
            choices: [
              { id: 'owned', label: 'Owned (this client only)' },
              { id: 'force', label: 'Force Lock (all clients)' },
            ],
          },
        ],
      },
      {
        id: 'unlock_output',
        name: 'Unlock Output',
        description: 'Unlock a destination output',
        options: [
          {
            id: 'destination',
            type: 'number',
            label: 'Destination Number',
            default: 1,
          },
        ],
      },
      {
        id: 'serial_control',
        name: 'Serial Control',
        description: 'Send a serial control command through a specific port',
        options: [
          {
            id: 'port',
            type: 'number',
            label: 'Serial Port Number',
            default: 1,
          },
          {
            id: 'command',
            type: 'textinput',
            label: 'Serial Command',
            default: '',
          },
        ],
      },
    ],
    feedbacks: [
      {
        id: 'selected_destination_color',
        name: 'Selected Destination Color',
        description: 'Changes button colour when a destination is selected',
        type: 'boolean',
      },
      {
        id: 'route_to_selected_color',
        name: 'Route to Selected Destination Color',
        description: 'Changes button colour when a source is routed to the selected destination',
        type: 'boolean',
      },
    ],
    variables: [
      { id: 'input_labels', name: 'Input Labels (dynamic)' },
      { id: 'output_labels', name: 'Output Labels (dynamic)' },
      { id: 'routes', name: 'Active Routes (dynamic)' },
      { id: 'lock_states', name: 'Output Lock States (dynamic)' },
    ],
    supportedModels: [
      'Smart Videohub 40x40',
      'Smart Videohub 20x20',
      'Smart Videohub 12x12',
      'Smart Videohub CleanSwitch',
    ],
  },

  // --- bmd-atem ---
  {
    id: 'companion-mod-bmd-atem',
    moduleId: 'bmd-atem',
    name: 'Blackmagic ATEM',
    manufacturer: 'blackmagic',
    protocol: 'ATEM UDP Protocol',
    defaultPort: 9910,
    description:
      'Full control of Blackmagic ATEM production switchers. Manage program/preview, transitions, keyers, DSKs, aux outputs, macros, media players, recording, and streaming.',
    actions: [
      {
        id: 'set_program_input',
        name: 'Set Program Input',
        description: 'Set the program (live) input source',
        options: [
          {
            id: 'input',
            type: 'number',
            label: 'Input Number',
            default: 1,
          },
          {
            id: 'me',
            type: 'dropdown',
            label: 'M/E Bus',
            default: '0',
            choices: [
              { id: '0', label: 'M/E 1' },
              { id: '1', label: 'M/E 2' },
              { id: '2', label: 'M/E 3' },
              { id: '3', label: 'M/E 4' },
            ],
          },
        ],
      },
      {
        id: 'set_preview_input',
        name: 'Set Preview Input',
        description: 'Set the preview (next) input source',
        options: [
          {
            id: 'input',
            type: 'number',
            label: 'Input Number',
            default: 1,
          },
          {
            id: 'me',
            type: 'dropdown',
            label: 'M/E Bus',
            default: '0',
            choices: [
              { id: '0', label: 'M/E 1' },
              { id: '1', label: 'M/E 2' },
              { id: '2', label: 'M/E 3' },
              { id: '3', label: 'M/E 4' },
            ],
          },
        ],
      },
      {
        id: 'cut',
        name: 'CUT',
        description: 'Perform a cut transition',
        options: [
          {
            id: 'me',
            type: 'dropdown',
            label: 'M/E Bus',
            default: '0',
            choices: [
              { id: '0', label: 'M/E 1' },
              { id: '1', label: 'M/E 2' },
              { id: '2', label: 'M/E 3' },
              { id: '3', label: 'M/E 4' },
            ],
          },
        ],
      },
      {
        id: 'auto_transition',
        name: 'AUTO Transition',
        description: 'Perform an auto transition using the current transition settings',
        options: [
          {
            id: 'me',
            type: 'dropdown',
            label: 'M/E Bus',
            default: '0',
            choices: [
              { id: '0', label: 'M/E 1' },
              { id: '1', label: 'M/E 2' },
              { id: '2', label: 'M/E 3' },
              { id: '3', label: 'M/E 4' },
            ],
          },
        ],
      },
      {
        id: 'set_transition_type',
        name: 'Set Transition Type',
        description: 'Set the transition style for the next auto transition',
        options: [
          {
            id: 'type',
            type: 'dropdown',
            label: 'Transition Type',
            default: 'mix',
            choices: [
              { id: 'mix', label: 'Mix' },
              { id: 'dip', label: 'Dip' },
              { id: 'wipe', label: 'Wipe' },
              { id: 'sting', label: 'Sting' },
              { id: 'dve', label: 'DVE' },
            ],
          },
          {
            id: 'me',
            type: 'dropdown',
            label: 'M/E Bus',
            default: '0',
            choices: [
              { id: '0', label: 'M/E 1' },
              { id: '1', label: 'M/E 2' },
              { id: '2', label: 'M/E 3' },
              { id: '3', label: 'M/E 4' },
            ],
          },
        ],
      },
      {
        id: 'set_transition_rate',
        name: 'Set Transition Rate',
        description: 'Set the transition rate in frames',
        options: [
          {
            id: 'rate',
            type: 'number',
            label: 'Rate (frames)',
            default: 30,
          },
          {
            id: 'me',
            type: 'dropdown',
            label: 'M/E Bus',
            default: '0',
            choices: [
              { id: '0', label: 'M/E 1' },
              { id: '1', label: 'M/E 2' },
              { id: '2', label: 'M/E 3' },
              { id: '3', label: 'M/E 4' },
            ],
          },
        ],
      },
      {
        id: 'usk_on_air',
        name: 'USK On Air',
        description: 'Toggle an upstream keyer on or off air',
        options: [
          {
            id: 'keyer',
            type: 'dropdown',
            label: 'Upstream Keyer',
            default: '0',
            choices: [
              { id: '0', label: 'USK 1' },
              { id: '1', label: 'USK 2' },
              { id: '2', label: 'USK 3' },
              { id: '3', label: 'USK 4' },
            ],
          },
          {
            id: 'state',
            type: 'dropdown',
            label: 'State',
            default: 'toggle',
            choices: [
              { id: 'on', label: 'On Air' },
              { id: 'off', label: 'Off Air' },
              { id: 'toggle', label: 'Toggle' },
            ],
          },
          {
            id: 'me',
            type: 'dropdown',
            label: 'M/E Bus',
            default: '0',
            choices: [
              { id: '0', label: 'M/E 1' },
              { id: '1', label: 'M/E 2' },
              { id: '2', label: 'M/E 3' },
              { id: '3', label: 'M/E 4' },
            ],
          },
        ],
      },
      {
        id: 'dsk_on_air',
        name: 'DSK On Air',
        description: 'Toggle a downstream keyer on or off air',
        options: [
          {
            id: 'keyer',
            type: 'dropdown',
            label: 'Downstream Keyer',
            default: '0',
            choices: [
              { id: '0', label: 'DSK 1' },
              { id: '1', label: 'DSK 2' },
              { id: '2', label: 'DSK 3' },
              { id: '3', label: 'DSK 4' },
            ],
          },
          {
            id: 'state',
            type: 'dropdown',
            label: 'State',
            default: 'toggle',
            choices: [
              { id: 'on', label: 'On Air' },
              { id: 'off', label: 'Off Air' },
              { id: 'toggle', label: 'Toggle' },
            ],
          },
        ],
      },
      {
        id: 'dsk_auto',
        name: 'DSK Auto',
        description: 'Auto-transition a downstream keyer on/off air',
        options: [
          {
            id: 'keyer',
            type: 'dropdown',
            label: 'Downstream Keyer',
            default: '0',
            choices: [
              { id: '0', label: 'DSK 1' },
              { id: '1', label: 'DSK 2' },
              { id: '2', label: 'DSK 3' },
              { id: '3', label: 'DSK 4' },
            ],
          },
        ],
      },
      {
        id: 'fade_to_black',
        name: 'Fade to Black',
        description: 'Toggle fade to black',
        options: [
          {
            id: 'me',
            type: 'dropdown',
            label: 'M/E Bus',
            default: '0',
            choices: [
              { id: '0', label: 'M/E 1' },
              { id: '1', label: 'M/E 2' },
              { id: '2', label: 'M/E 3' },
              { id: '3', label: 'M/E 4' },
            ],
          },
        ],
      },
      {
        id: 'set_ftb_rate',
        name: 'Set FTB Rate',
        description: 'Set the fade to black rate in frames',
        options: [
          {
            id: 'rate',
            type: 'number',
            label: 'Rate (frames)',
            default: 30,
          },
          {
            id: 'me',
            type: 'dropdown',
            label: 'M/E Bus',
            default: '0',
            choices: [
              { id: '0', label: 'M/E 1' },
              { id: '1', label: 'M/E 2' },
              { id: '2', label: 'M/E 3' },
              { id: '3', label: 'M/E 4' },
            ],
          },
        ],
      },
      {
        id: 'set_aux_source',
        name: 'Set AUX Source',
        description: 'Set the source for an auxiliary output',
        options: [
          {
            id: 'aux',
            type: 'number',
            label: 'AUX Output Number',
            default: 1,
          },
          {
            id: 'source',
            type: 'number',
            label: 'Source Input Number',
            default: 1,
          },
        ],
      },
      {
        id: 'run_macro',
        name: 'Run Macro',
        description: 'Run a stored macro by number',
        options: [
          {
            id: 'macro',
            type: 'number',
            label: 'Macro Number',
            default: 1,
          },
          {
            id: 'action',
            type: 'dropdown',
            label: 'Action',
            default: 'run',
            choices: [
              { id: 'run', label: 'Run' },
              { id: 'stop', label: 'Stop' },
              { id: 'continue', label: 'Continue' },
            ],
          },
        ],
      },
      {
        id: 'set_supersource_box',
        name: 'Set SuperSource Box',
        description: 'Configure a SuperSource box source and position',
        options: [
          {
            id: 'box',
            type: 'dropdown',
            label: 'Box',
            default: '0',
            choices: [
              { id: '0', label: 'Box 1' },
              { id: '1', label: 'Box 2' },
              { id: '2', label: 'Box 3' },
              { id: '3', label: 'Box 4' },
            ],
          },
          {
            id: 'source',
            type: 'number',
            label: 'Source Input Number',
            default: 1,
          },
          {
            id: 'enabled',
            type: 'checkbox',
            label: 'Box Enabled',
            default: true,
          },
        ],
      },
      {
        id: 'change_mv_window',
        name: 'Change MV Window',
        description: 'Change the source shown in a multiview window',
        options: [
          {
            id: 'mv',
            type: 'number',
            label: 'Multiview Index',
            default: 0,
          },
          {
            id: 'window',
            type: 'number',
            label: 'Window Number',
            default: 0,
          },
          {
            id: 'source',
            type: 'number',
            label: 'Source Input Number',
            default: 1,
          },
        ],
      },
      {
        id: 'start_recording',
        name: 'Start Recording',
        description: 'Start recording on all connected HyperDeck or USB recorders',
        options: [],
      },
      {
        id: 'stop_recording',
        name: 'Stop Recording',
        description: 'Stop recording on all connected recorders',
        options: [],
      },
      {
        id: 'start_streaming',
        name: 'Start Streaming',
        description: 'Start streaming output',
        options: [],
      },
      {
        id: 'stop_streaming',
        name: 'Stop Streaming',
        description: 'Stop streaming output',
        options: [],
      },
      {
        id: 'set_media_player_source',
        name: 'Set Media Player Source',
        description: 'Set the source clip or still for a media player',
        options: [
          {
            id: 'player',
            type: 'dropdown',
            label: 'Media Player',
            default: '0',
            choices: [
              { id: '0', label: 'Media Player 1' },
              { id: '1', label: 'Media Player 2' },
            ],
          },
          {
            id: 'source_type',
            type: 'dropdown',
            label: 'Source Type',
            default: 'still',
            choices: [
              { id: 'still', label: 'Still' },
              { id: 'clip', label: 'Clip' },
            ],
          },
          {
            id: 'index',
            type: 'number',
            label: 'Source Index',
            default: 0,
          },
        ],
      },
    ],
    feedbacks: [
      {
        id: 'program_tally',
        name: 'Program Tally',
        description: 'Indicates when an input is on program (live)',
        type: 'boolean',
      },
      {
        id: 'preview_tally',
        name: 'Preview Tally',
        description: 'Indicates when an input is on preview',
        type: 'boolean',
      },
      {
        id: 'usk_onair',
        name: 'USK OnAir',
        description: 'Indicates when an upstream keyer is on air',
        type: 'boolean',
      },
      {
        id: 'dsk_onair',
        name: 'DSK OnAir',
        description: 'Indicates when a downstream keyer is on air',
        type: 'boolean',
      },
      {
        id: 'transition_state',
        name: 'Transition State',
        description: 'Indicates an active transition in progress',
        type: 'boolean',
      },
      {
        id: 'ftb_active',
        name: 'FTB Active',
        description: 'Indicates when fade to black is active',
        type: 'boolean',
      },
      {
        id: 'macro_running',
        name: 'Macro Running',
        description: 'Indicates when a specific macro is running',
        type: 'boolean',
      },
      {
        id: 'recording_active',
        name: 'Recording Active',
        description: 'Indicates when recording is in progress',
        type: 'boolean',
      },
      {
        id: 'streaming_active',
        name: 'Streaming Active',
        description: 'Indicates when streaming is in progress',
        type: 'boolean',
      },
    ],
    variables: [
      { id: 'pgm_input', name: 'Program Input' },
      { id: 'pvw_input', name: 'Preview Input' },
      { id: 'transition_position', name: 'Transition Position' },
      { id: 'transition_rate', name: 'Transition Rate' },
      { id: 'recording_status', name: 'Recording Status' },
      { id: 'streaming_status', name: 'Streaming Status' },
    ],
    supportedModels: [
      'ATEM Constellation 8K',
      'ATEM 4 M/E Constellation 4K',
      'ATEM Mini',
      'ATEM Mini Pro',
      'ATEM Television Studio',
    ],
  },

  // --- bmd-hyperdeck ---
  {
    id: 'companion-mod-bmd-hyperdeck',
    moduleId: 'bmd-hyperdeck',
    name: 'Blackmagic HyperDeck',
    manufacturer: 'blackmagic',
    protocol: 'HyperDeck TCP Protocol',
    defaultPort: 9993,
    description:
      'Control Blackmagic HyperDeck disk recorders via the native TCP protocol. Manage transport, timecode navigation, slot selection, and remote settings.',
    actions: [
      {
        id: 'play',
        name: 'Play',
        description: 'Start playback at normal speed',
        options: [
          {
            id: 'speed',
            type: 'number',
            label: 'Speed (%)',
            default: 100,
          },
          {
            id: 'loop',
            type: 'checkbox',
            label: 'Loop Playback',
            default: false,
          },
          {
            id: 'single_clip',
            type: 'checkbox',
            label: 'Single Clip Mode',
            default: false,
          },
        ],
      },
      {
        id: 'record',
        name: 'Record',
        description: 'Start recording',
        options: [
          {
            id: 'clip_name',
            type: 'textinput',
            label: 'Clip Name (optional)',
            default: '',
          },
        ],
      },
      {
        id: 'stop',
        name: 'Stop',
        description: 'Stop playback or recording',
        options: [],
      },
      {
        id: 'goto_timecode',
        name: 'Goto Timecode',
        description: 'Jump to a specific timecode position',
        options: [
          {
            id: 'timecode',
            type: 'textinput',
            label: 'Timecode (HH:MM:SS:FF)',
            default: '00:00:00:00',
          },
        ],
      },
      {
        id: 'goto_clip',
        name: 'Goto Clip',
        description: 'Jump to a specific clip by number',
        options: [
          {
            id: 'clip_id',
            type: 'number',
            label: 'Clip Number',
            default: 1,
          },
        ],
      },
      {
        id: 'jog_forward',
        name: 'Jog Forward',
        description: 'Jog forward by a specified number of frames',
        options: [
          {
            id: 'frames',
            type: 'number',
            label: 'Frames',
            default: 1,
          },
        ],
      },
      {
        id: 'jog_backward',
        name: 'Jog Backward',
        description: 'Jog backward by a specified number of frames',
        options: [
          {
            id: 'frames',
            type: 'number',
            label: 'Frames',
            default: 1,
          },
        ],
      },
      {
        id: 'shuttle',
        name: 'Shuttle',
        description: 'Shuttle at a specified speed percentage',
        options: [
          {
            id: 'speed',
            type: 'number',
            label: 'Speed (% — negative for reverse)',
            default: 200,
          },
        ],
      },
      {
        id: 'select_slot',
        name: 'Select Slot',
        description: 'Select the active disk slot',
        options: [
          {
            id: 'slot',
            type: 'dropdown',
            label: 'Slot',
            default: '1',
            choices: [
              { id: '1', label: 'Slot 1' },
              { id: '2', label: 'Slot 2' },
            ],
          },
        ],
      },
      {
        id: 'set_remote_control',
        name: 'Set Remote Control',
        description: 'Enable or disable remote control mode',
        options: [
          {
            id: 'enabled',
            type: 'checkbox',
            label: 'Remote Control Enabled',
            default: true,
          },
        ],
      },
    ],
    feedbacks: [
      {
        id: 'transport_status',
        name: 'Transport Status',
        description: 'Indicates the current transport state (play, record, stop, etc.)',
        type: 'advanced',
      },
      {
        id: 'active_slot',
        name: 'Active Slot',
        description: 'Indicates which disk slot is currently active',
        type: 'boolean',
      },
      {
        id: 'disk_status',
        name: 'Disk Status',
        description: 'Indicates disk health and space status',
        type: 'advanced',
      },
      {
        id: 'loop_status',
        name: 'Loop Status',
        description: 'Indicates whether loop playback is enabled',
        type: 'boolean',
      },
    ],
    variables: [
      { id: 'transport_status', name: 'Transport Status' },
      { id: 'speed', name: 'Playback Speed' },
      { id: 'clip_id', name: 'Current Clip ID' },
      { id: 'slot_id', name: 'Active Slot ID' },
      { id: 'video_format', name: 'Video Format' },
      { id: 'recording_time', name: 'Recording Time Remaining' },
      { id: 'clip_count', name: 'Total Clip Count' },
      { id: 'timecodeHMSF', name: 'Timecode (HH:MM:SS:FF)' },
      { id: 'timecodeH', name: 'Timecode Hours' },
      { id: 'timecodeM', name: 'Timecode Minutes' },
      { id: 'timecodeS', name: 'Timecode Seconds' },
      { id: 'timecodeF', name: 'Timecode Frames' },
    ],
    supportedModels: [
      'HyperDeck Studio 4K Pro',
      'HyperDeck Studio HD Plus',
      'HyperDeck Shuttle',
    ],
  },

  // ============================================================
  // ROSS - 3 modules
  // ============================================================

  // --- rossvideo-rosstalk ---
  {
    id: 'companion-mod-rossvideo-rosstalk',
    moduleId: 'rossvideo-rosstalk',
    name: 'Ross Video RossTalk',
    manufacturer: 'ross',
    protocol: 'RossTalk TCP',
    defaultPort: 7788,
    description:
      'Control Ross Video production switchers via the RossTalk protocol. Fire custom controls, trigger transitions, manage crosspoints, and send GPI commands.',
    actions: [
      {
        id: 'fire_custom_control',
        name: 'Fire Custom Control',
        description: 'Fire a custom control (CC) bank and index',
        options: [
          {
            id: 'bank',
            type: 'number',
            label: 'CC Bank',
            default: 1,
          },
          {
            id: 'index',
            type: 'number',
            label: 'CC Index',
            default: 1,
          },
        ],
      },
      {
        id: 'load_set',
        name: 'Load Set',
        description: 'Load a stored set (memory) by number',
        options: [
          {
            id: 'set_number',
            type: 'number',
            label: 'Set Number',
            default: 1,
          },
        ],
      },
      {
        id: 'cut',
        name: 'Cut',
        description: 'Perform a cut transition on the specified M/E',
        options: [
          {
            id: 'me',
            type: 'dropdown',
            label: 'M/E Bus',
            default: '0',
            choices: [
              { id: '0', label: 'M/E 1' },
              { id: '1', label: 'M/E 2' },
              { id: '2', label: 'M/E 3' },
              { id: '3', label: 'M/E 4' },
            ],
          },
        ],
      },
      {
        id: 'auto_transition',
        name: 'Auto Transition',
        description: 'Perform an auto transition on the specified M/E',
        options: [
          {
            id: 'me',
            type: 'dropdown',
            label: 'M/E Bus',
            default: '0',
            choices: [
              { id: '0', label: 'M/E 1' },
              { id: '1', label: 'M/E 2' },
              { id: '2', label: 'M/E 3' },
              { id: '3', label: 'M/E 4' },
            ],
          },
        ],
      },
      {
        id: 'xpt_crosspoint',
        name: 'XPT Crosspoint',
        description: 'Set a crosspoint on a specific bus',
        options: [
          {
            id: 'bus',
            type: 'dropdown',
            label: 'Bus',
            default: 'pgm',
            choices: [
              { id: 'pgm', label: 'Program' },
              { id: 'pvw', label: 'Preview' },
              { id: 'clean', label: 'Clean Feed' },
              { id: 'aux1', label: 'AUX 1' },
              { id: 'aux2', label: 'AUX 2' },
              { id: 'aux3', label: 'AUX 3' },
              { id: 'aux4', label: 'AUX 4' },
            ],
          },
          {
            id: 'me',
            type: 'dropdown',
            label: 'M/E Bus',
            default: '0',
            choices: [
              { id: '0', label: 'M/E 1' },
              { id: '1', label: 'M/E 2' },
              { id: '2', label: 'M/E 3' },
              { id: '3', label: 'M/E 4' },
            ],
          },
          {
            id: 'source',
            type: 'number',
            label: 'Source Number',
            default: 1,
          },
        ],
      },
      {
        id: 'transition_keyer',
        name: 'Transition Keyer',
        description: 'Transition a keyer on or off air',
        options: [
          {
            id: 'keyer',
            type: 'number',
            label: 'Keyer Number',
            default: 1,
          },
          {
            id: 'me',
            type: 'dropdown',
            label: 'M/E Bus',
            default: '0',
            choices: [
              { id: '0', label: 'M/E 1' },
              { id: '1', label: 'M/E 2' },
              { id: '2', label: 'M/E 3' },
              { id: '3', label: 'M/E 4' },
            ],
          },
          {
            id: 'state',
            type: 'dropdown',
            label: 'State',
            default: 'toggle',
            choices: [
              { id: 'on', label: 'On Air' },
              { id: 'off', label: 'Off Air' },
              { id: 'toggle', label: 'Toggle' },
            ],
          },
        ],
      },
      {
        id: 'fade_to_black',
        name: 'Fade to Black',
        description: 'Toggle fade to black',
        options: [
          {
            id: 'me',
            type: 'dropdown',
            label: 'M/E Bus',
            default: '0',
            choices: [
              { id: '0', label: 'M/E 1' },
              { id: '1', label: 'M/E 2' },
              { id: '2', label: 'M/E 3' },
              { id: '3', label: 'M/E 4' },
            ],
          },
        ],
      },
      {
        id: 'trigger_gpi',
        name: 'Trigger GPI',
        description: 'Trigger a GPI output',
        options: [
          {
            id: 'gpi',
            type: 'number',
            label: 'GPI Number',
            default: 1,
          },
        ],
      },
      {
        id: 'run_custom_command',
        name: 'Run Custom Command',
        description: 'Send a raw RossTalk command string',
        options: [
          {
            id: 'command',
            type: 'textinput',
            label: 'RossTalk Command',
            default: '',
          },
        ],
      },
    ],
    feedbacks: [],
    variables: [],
    supportedModels: ['Carbonite Ultra', 'Carbonite Black Plus', 'Acuity'],
  },

  // --- rossvideo-nkrouter ---
  {
    id: 'companion-mod-rossvideo-nkrouter',
    moduleId: 'rossvideo-nkrouter',
    name: 'Ross Video NK Router',
    manufacturer: 'ross',
    protocol: 'NK Protocol TCP',
    defaultPort: 5000,
    description:
      'Control Ross Video NK series routers via the NK protocol. Route sources to destinations with simple crosspoint commands.',
    actions: [
      {
        id: 'route_source_to_dest',
        name: 'Route Source to Destination',
        description: 'Route a specific source to a specific destination',
        options: [
          {
            id: 'source',
            type: 'number',
            label: 'Source Number',
            default: 1,
          },
          {
            id: 'destination',
            type: 'number',
            label: 'Destination Number',
            default: 1,
          },
          {
            id: 'level',
            type: 'dropdown',
            label: 'Level',
            default: 'all',
            choices: [
              { id: 'all', label: 'All Levels' },
              { id: 'video', label: 'Video Only' },
              { id: 'audio', label: 'Audio Only' },
            ],
          },
        ],
      },
      {
        id: 'select_source',
        name: 'Select Source',
        description: 'Pre-select a source for later routing',
        options: [
          {
            id: 'source',
            type: 'number',
            label: 'Source Number',
            default: 1,
          },
        ],
      },
      {
        id: 'select_destination',
        name: 'Select Destination',
        description: 'Pre-select a destination for later routing',
        options: [
          {
            id: 'destination',
            type: 'number',
            label: 'Destination Number',
            default: 1,
          },
        ],
      },
    ],
    feedbacks: [],
    variables: [],
    supportedModels: ['NK-3G34'],
  },

  // --- generic-swp08 (Ross Ultrix / NK via SW-P-08) ---
  {
    id: 'companion-mod-generic-swp08',
    moduleId: 'generic-swp08',
    name: 'SW-P-08 Router Control',
    manufacturer: 'ross',
    protocol: 'SW-P-08 TCP',
    defaultPort: 8910,
    description:
      'Control routers using the SW-P-08 (PROBEL) protocol. Supports Ross Ultrix, NK series, and any SW-P-08-compatible matrix. Manage crosspoints, levels, salvos, and named routing.',
    actions: [
      {
        id: 'set_crosspoint',
        name: 'Set Crosspoint',
        description: 'Set a crosspoint by source and destination number',
        options: [
          {
            id: 'source',
            type: 'number',
            label: 'Source Number',
            default: 1,
          },
          {
            id: 'destination',
            type: 'number',
            label: 'Destination Number',
            default: 1,
          },
        ],
      },
      {
        id: 'set_crosspoint_by_name',
        name: 'Set Crosspoint by Name',
        description: 'Set a crosspoint using source and destination names',
        options: [
          {
            id: 'source_name',
            type: 'textinput',
            label: 'Source Name',
            default: '',
          },
          {
            id: 'destination_name',
            type: 'textinput',
            label: 'Destination Name',
            default: '',
          },
        ],
      },
      {
        id: 'select_levels',
        name: 'Select Levels',
        description: 'Select which levels to operate on',
        options: [
          {
            id: 'levels',
            type: 'dropdown',
            label: 'Levels',
            default: 'all',
            choices: [
              { id: 'all', label: 'All Levels' },
              { id: 'video', label: 'Video' },
              { id: 'audio', label: 'Audio' },
              { id: 'data', label: 'Data' },
            ],
          },
        ],
      },
      {
        id: 'toggle_levels',
        name: 'Toggle Levels',
        description: 'Toggle specific levels on or off for the next route operation',
        options: [
          {
            id: 'level',
            type: 'dropdown',
            label: 'Level',
            default: 'video',
            choices: [
              { id: 'video', label: 'Video' },
              { id: 'audio', label: 'Audio' },
              { id: 'data', label: 'Data' },
            ],
          },
          {
            id: 'state',
            type: 'checkbox',
            label: 'Enabled',
            default: true,
          },
        ],
      },
      {
        id: 'select_destination',
        name: 'Select Destination',
        description: 'Pre-select a destination for subsequent routing',
        options: [
          {
            id: 'destination',
            type: 'number',
            label: 'Destination Number',
            default: 1,
          },
        ],
      },
      {
        id: 'select_source',
        name: 'Select Source',
        description: 'Pre-select a source for subsequent routing',
        options: [
          {
            id: 'source',
            type: 'number',
            label: 'Source Number',
            default: 1,
          },
        ],
      },
      {
        id: 'route_source_to_selected',
        name: 'Route Source to Selected',
        description: 'Route the specified source to the currently selected destination',
        options: [
          {
            id: 'source',
            type: 'number',
            label: 'Source Number',
            default: 1,
          },
        ],
      },
      {
        id: 'take',
        name: 'Take',
        description: 'Execute the pending route change',
        options: [],
      },
      {
        id: 'clear',
        name: 'Clear',
        description: 'Clear the current source and destination selection',
        options: [],
      },
      {
        id: 'refresh_names',
        name: 'Refresh Names',
        description: 'Re-read all source and destination names from the router',
        options: [],
      },
    ],
    feedbacks: [
      {
        id: 'crosspoint_connected',
        name: 'Crosspoint Connected',
        description: 'Indicates when a specific source-to-destination route is active',
        type: 'boolean',
      },
      {
        id: 'selected_levels',
        name: 'Selected Levels',
        description: 'Shows which levels are currently selected for routing',
        type: 'advanced',
      },
      {
        id: 'selected_destination',
        name: 'Selected Destination',
        description: 'Indicates which destination is currently selected',
        type: 'boolean',
      },
      {
        id: 'selected_source',
        name: 'Selected Source',
        description: 'Indicates which source is currently selected',
        type: 'boolean',
      },
      {
        id: 'source_routed_to_selected',
        name: 'Source Routed to Selected',
        description: 'Indicates when a source is currently routed to the selected destination',
        type: 'boolean',
      },
    ],
    variables: [
      { id: 'num_sources', name: 'Number of Sources' },
      { id: 'num_destinations', name: 'Number of Destinations' },
      { id: 'selected_destination', name: 'Selected Destination' },
      { id: 'selected_source', name: 'Selected Source' },
      { id: 'source_N', name: 'Source Name (N = source number)' },
      { id: 'destination_N', name: 'Destination Name (N = destination number)' },
    ],
    supportedModels: ['Ultrix FR5', 'Ultrix FR2', 'NK-3G34'],
  },
];
