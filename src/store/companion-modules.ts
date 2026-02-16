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

  // ============================================================
  // AUDIO / MIXER MODULES
  // ============================================================

  // --- yamaha-rcp ---
  {
    id: 'companion-mod-yamaha-rcp',
    moduleId: 'yamaha-rcp',
    name: 'Yamaha Remote Control Protocol',
    manufacturer: 'yamaha',
    protocol: 'TCP',
    defaultPort: 49280,
    description:
      'Control Yamaha digital mixing consoles via the Remote Control Protocol (RCP). Supports fader control, muting, scene recall, send levels, EQ, DCA, and matrix routing across CL, QL, TF, DM, and PM series consoles.',
    actions: [
      {
        id: 'set_fader_level',
        name: 'Set Fader Level',
        description: 'Set the fader level of a specific channel',
        options: [
          {
            id: 'ch',
            type: 'number',
            label: 'Channel',
            default: 1,
          },
          {
            id: 'level',
            type: 'number',
            label: 'Level (0 - 1023)',
            default: 0,
          },
        ],
      },
      {
        id: 'set_mute',
        name: 'Set Mute',
        description: 'Set the mute state of a specific channel',
        options: [
          {
            id: 'ch',
            type: 'number',
            label: 'Channel',
            default: 1,
          },
          {
            id: 'state',
            type: 'dropdown',
            label: 'State',
            default: 'on',
            choices: [
              { id: 'on', label: 'Mute On' },
              { id: 'off', label: 'Mute Off' },
              { id: 'toggle', label: 'Toggle' },
            ],
          },
        ],
      },
      {
        id: 'recall_scene',
        name: 'Recall Scene',
        description: 'Recall a scene by its number',
        options: [
          {
            id: 'scene',
            type: 'number',
            label: 'Scene Number',
            default: 1,
          },
        ],
      },
      {
        id: 'set_send_level',
        name: 'Set Send Level',
        description: 'Set the send level from a channel to a bus',
        options: [
          {
            id: 'ch',
            type: 'number',
            label: 'Channel',
            default: 1,
          },
          {
            id: 'bus',
            type: 'number',
            label: 'Bus',
            default: 1,
          },
          {
            id: 'level',
            type: 'number',
            label: 'Level (0 - 1023)',
            default: 0,
          },
        ],
      },
      {
        id: 'set_eq_band',
        name: 'Set EQ Band',
        description: 'Set a specific EQ band on a channel',
        options: [
          {
            id: 'ch',
            type: 'number',
            label: 'Channel',
            default: 1,
          },
          {
            id: 'band',
            type: 'number',
            label: 'Band',
            default: 1,
          },
          {
            id: 'freq',
            type: 'number',
            label: 'Frequency (Hz)',
            default: 1000,
          },
          {
            id: 'gain',
            type: 'number',
            label: 'Gain (dB)',
            default: 0,
          },
          {
            id: 'q',
            type: 'number',
            label: 'Q Factor',
            default: 1,
          },
        ],
      },
      {
        id: 'set_dca_level',
        name: 'Set DCA Level',
        description: 'Set the level of a DCA group',
        options: [
          {
            id: 'dca',
            type: 'number',
            label: 'DCA',
            default: 1,
          },
          {
            id: 'level',
            type: 'number',
            label: 'Level (0 - 1023)',
            default: 0,
          },
        ],
      },
      {
        id: 'set_matrix_level',
        name: 'Set Matrix Level',
        description: 'Set the level of a matrix crosspoint',
        options: [
          {
            id: 'in',
            type: 'number',
            label: 'Input',
            default: 1,
          },
          {
            id: 'out',
            type: 'number',
            label: 'Output',
            default: 1,
          },
          {
            id: 'level',
            type: 'number',
            label: 'Level (0 - 1023)',
            default: 0,
          },
        ],
      },
    ],
    feedbacks: [
      {
        id: 'fader_level',
        name: 'Fader Level',
        description: 'Current fader level of a channel',
        type: 'advanced',
      },
      {
        id: 'mute_state',
        name: 'Mute State',
        description: 'Current mute state of a channel',
        type: 'boolean',
      },
      {
        id: 'current_scene',
        name: 'Current Scene',
        description: 'Currently active scene name or number',
        type: 'advanced',
      },
      {
        id: 'signal_present',
        name: 'Signal Present',
        description: 'Indicates whether signal is present on a channel',
        type: 'boolean',
      },
    ],
    variables: [
      { id: 'current_scene', name: 'Current Scene Number' },
      { id: 'fader_ch_N', name: 'Fader Level (N = channel number)' },
      { id: 'mute_ch_N', name: 'Mute State (N = channel number)' },
      { id: 'scene_name', name: 'Current Scene Name' },
      { id: 'output_level_N', name: 'Output Level (N = output number)' },
    ],
    supportedModels: ['CL5', 'CL3', 'CL1', 'QL5', 'QL1', 'TF5', 'TF3', 'TF1', 'DM7', 'PM5'],
  },

  // --- allenheath-dlive ---
  {
    id: 'companion-mod-allenheath-dlive',
    moduleId: 'allenheath-dlive',
    name: 'Allen & Heath dLive MixRack',
    manufacturer: 'allen-heath',
    protocol: 'TCP',
    defaultPort: 51325,
    description:
      'Control Allen & Heath dLive mixing systems via TCP. Supports fader control, muting, scene recall, DCA assignment, and aux send levels across all dLive surface and MixRack configurations.',
    actions: [
      {
        id: 'set_fader',
        name: 'Set Fader',
        description: 'Set the fader level of a specific channel',
        options: [
          {
            id: 'ch',
            type: 'number',
            label: 'Channel',
            default: 1,
          },
          {
            id: 'level',
            type: 'number',
            label: 'Level (0 - 1023)',
            default: 0,
          },
        ],
      },
      {
        id: 'set_mute',
        name: 'Set Mute',
        description: 'Set the mute state of a specific channel',
        options: [
          {
            id: 'ch',
            type: 'number',
            label: 'Channel',
            default: 1,
          },
          {
            id: 'state',
            type: 'dropdown',
            label: 'State',
            default: 'on',
            choices: [
              { id: 'on', label: 'Mute On' },
              { id: 'off', label: 'Mute Off' },
              { id: 'toggle', label: 'Toggle' },
            ],
          },
        ],
      },
      {
        id: 'recall_scene',
        name: 'Recall Scene',
        description: 'Recall a scene by its number',
        options: [
          {
            id: 'scene',
            type: 'number',
            label: 'Scene Number',
            default: 1,
          },
        ],
      },
      {
        id: 'next_scene',
        name: 'Next Scene',
        description: 'Recall the next scene in the scene list',
        options: [],
      },
      {
        id: 'prev_scene',
        name: 'Previous Scene',
        description: 'Recall the previous scene in the scene list',
        options: [],
      },
      {
        id: 'set_dca_assign',
        name: 'Set DCA Assignment',
        description: 'Assign a channel to a DCA group',
        options: [
          {
            id: 'ch',
            type: 'number',
            label: 'Channel',
            default: 1,
          },
          {
            id: 'dca',
            type: 'number',
            label: 'DCA Group',
            default: 1,
          },
        ],
      },
      {
        id: 'set_aux_send',
        name: 'Set Aux Send',
        description: 'Set the aux send level from a channel to an aux bus',
        options: [
          {
            id: 'ch',
            type: 'number',
            label: 'Channel',
            default: 1,
          },
          {
            id: 'aux',
            type: 'number',
            label: 'Aux Bus',
            default: 1,
          },
          {
            id: 'level',
            type: 'number',
            label: 'Level (0 - 1023)',
            default: 0,
          },
        ],
      },
    ],
    feedbacks: [
      {
        id: 'fader_position',
        name: 'Fader Position',
        description: 'Current fader position of a channel',
        type: 'advanced',
      },
      {
        id: 'mute_state',
        name: 'Mute State',
        description: 'Current mute state of a channel',
        type: 'boolean',
      },
      {
        id: 'current_scene',
        name: 'Current Scene',
        description: 'Currently active scene name or number',
        type: 'advanced',
      },
      {
        id: 'dca_level',
        name: 'DCA Level',
        description: 'Current level of a DCA group',
        type: 'advanced',
      },
    ],
    variables: [
      { id: 'current_scene', name: 'Current Scene Number' },
      { id: 'scene_name', name: 'Current Scene Name' },
      { id: 'fader_ch_N', name: 'Fader Level (N = channel number)' },
      { id: 'mute_ch_N', name: 'Mute State (N = channel number)' },
      { id: 'ip_address', name: 'Device IP Address' },
    ],
    supportedModels: [
      'dLive S7000',
      'dLive S5000',
      'dLive S3000',
      'dLive CDM64',
      'dLive CDM48',
      'dLive CDM32',
    ],
  },

  // --- allenheath-avantis ---
  {
    id: 'companion-mod-allenheath-avantis',
    moduleId: 'allenheath-avantis',
    name: 'Allen & Heath Avantis',
    manufacturer: 'allen-heath',
    protocol: 'TCP',
    defaultPort: 51325,
    description:
      'Control Allen & Heath Avantis mixing consoles via TCP. Supports fader control, muting, scene and cue recall, and softkey triggering.',
    actions: [
      {
        id: 'set_fader',
        name: 'Set Fader',
        description: 'Set the fader level of a specific channel',
        options: [
          {
            id: 'ch',
            type: 'number',
            label: 'Channel',
            default: 1,
          },
          {
            id: 'level',
            type: 'number',
            label: 'Level (0 - 1023)',
            default: 0,
          },
        ],
      },
      {
        id: 'set_mute',
        name: 'Set Mute',
        description: 'Set the mute state of a specific channel',
        options: [
          {
            id: 'ch',
            type: 'number',
            label: 'Channel',
            default: 1,
          },
          {
            id: 'state',
            type: 'dropdown',
            label: 'State',
            default: 'on',
            choices: [
              { id: 'on', label: 'Mute On' },
              { id: 'off', label: 'Mute Off' },
              { id: 'toggle', label: 'Toggle' },
            ],
          },
        ],
      },
      {
        id: 'recall_scene',
        name: 'Recall Scene',
        description: 'Recall a scene by its number',
        options: [
          {
            id: 'scene',
            type: 'number',
            label: 'Scene Number',
            default: 1,
          },
        ],
      },
      {
        id: 'recall_cue',
        name: 'Recall Cue',
        description: 'Recall a cue by its number',
        options: [
          {
            id: 'cue',
            type: 'number',
            label: 'Cue Number',
            default: 1,
          },
        ],
      },
      {
        id: 'set_softkey',
        name: 'Set Softkey',
        description: 'Set the state of a softkey',
        options: [
          {
            id: 'key',
            type: 'number',
            label: 'Softkey Number',
            default: 1,
          },
          {
            id: 'state',
            type: 'dropdown',
            label: 'State',
            default: 'on',
            choices: [
              { id: 'on', label: 'On' },
              { id: 'off', label: 'Off' },
              { id: 'toggle', label: 'Toggle' },
            ],
          },
        ],
      },
    ],
    feedbacks: [
      {
        id: 'fader_position',
        name: 'Fader Position',
        description: 'Current fader position of a channel',
        type: 'advanced',
      },
      {
        id: 'mute_state',
        name: 'Mute State',
        description: 'Current mute state of a channel',
        type: 'boolean',
      },
      {
        id: 'current_scene',
        name: 'Current Scene',
        description: 'Currently active scene name or number',
        type: 'advanced',
      },
    ],
    variables: [
      { id: 'current_scene', name: 'Current Scene Number' },
      { id: 'fader_ch_N', name: 'Fader Level (N = channel number)' },
      { id: 'mute_ch_N', name: 'Mute State (N = channel number)' },
    ],
    supportedModels: ['Avantis', 'Avantis Solo'],
  },

  // --- allenheath-sq ---
  {
    id: 'companion-mod-allenheath-sq',
    moduleId: 'allenheath-sq',
    name: 'Allen & Heath SQ',
    manufacturer: 'allen-heath',
    protocol: 'MIDI/TCP',
    defaultPort: 51326,
    description:
      'Control Allen & Heath SQ series mixing consoles via MIDI over TCP. Supports fader control, muting, scene recall, FX parameter adjustment, and preamp gain control.',
    actions: [
      {
        id: 'set_fader',
        name: 'Set Fader',
        description: 'Set the fader level of a specific channel',
        options: [
          {
            id: 'ch',
            type: 'number',
            label: 'Channel',
            default: 1,
          },
          {
            id: 'level',
            type: 'number',
            label: 'Level (0 - 1023)',
            default: 0,
          },
        ],
      },
      {
        id: 'set_mute',
        name: 'Set Mute',
        description: 'Set the mute state of a specific channel',
        options: [
          {
            id: 'ch',
            type: 'number',
            label: 'Channel',
            default: 1,
          },
          {
            id: 'state',
            type: 'dropdown',
            label: 'State',
            default: 'on',
            choices: [
              { id: 'on', label: 'Mute On' },
              { id: 'off', label: 'Mute Off' },
              { id: 'toggle', label: 'Toggle' },
            ],
          },
        ],
      },
      {
        id: 'recall_scene',
        name: 'Recall Scene',
        description: 'Recall a scene by its number',
        options: [
          {
            id: 'scene',
            type: 'number',
            label: 'Scene Number',
            default: 1,
          },
        ],
      },
      {
        id: 'set_fx_param',
        name: 'Set FX Parameter',
        description: 'Set a parameter on an FX unit',
        options: [
          {
            id: 'fx',
            type: 'number',
            label: 'FX Unit',
            default: 1,
          },
          {
            id: 'param',
            type: 'number',
            label: 'Parameter',
            default: 1,
          },
          {
            id: 'value',
            type: 'number',
            label: 'Value',
            default: 0,
          },
        ],
      },
      {
        id: 'set_gan_preamp',
        name: 'Set Gain/Preamp',
        description: 'Set the preamp gain level of a channel',
        options: [
          {
            id: 'ch',
            type: 'number',
            label: 'Channel',
            default: 1,
          },
          {
            id: 'gain',
            type: 'number',
            label: 'Gain (dB)',
            default: 0,
          },
        ],
      },
    ],
    feedbacks: [
      {
        id: 'fader_position',
        name: 'Fader Position',
        description: 'Current fader position of a channel',
        type: 'advanced',
      },
      {
        id: 'mute_state',
        name: 'Mute State',
        description: 'Current mute state of a channel',
        type: 'boolean',
      },
      {
        id: 'current_scene',
        name: 'Current Scene',
        description: 'Currently active scene name or number',
        type: 'advanced',
      },
    ],
    variables: [
      { id: 'current_scene', name: 'Current Scene Number' },
      { id: 'fader_ch_N', name: 'Fader Level (N = channel number)' },
      { id: 'mute_ch_N', name: 'Mute State (N = channel number)' },
    ],
    supportedModels: ['SQ-7', 'SQ-6', 'SQ-5'],
  },

  // --- behringer-x32 ---
  {
    id: 'companion-mod-behringer-x32',
    moduleId: 'behringer-x32',
    name: 'Behringer X32/M32',
    manufacturer: 'behringer',
    protocol: 'OSC/UDP',
    defaultPort: 10023,
    description:
      'Control Behringer X32 and Midas M32 digital mixing consoles via OSC over UDP. Supports fader control, muting, scene recall, bus sends, solo, DCA levels, and cue triggering.',
    actions: [
      {
        id: 'set_fader',
        name: 'Set Fader',
        description: 'Set the fader level of a specific channel',
        options: [
          {
            id: 'ch',
            type: 'number',
            label: 'Channel',
            default: 1,
          },
          {
            id: 'level',
            type: 'number',
            label: 'Level (0.0 - 1.0)',
            default: 0,
          },
        ],
      },
      {
        id: 'set_mute',
        name: 'Set Mute',
        description: 'Set the mute state of a specific channel',
        options: [
          {
            id: 'ch',
            type: 'number',
            label: 'Channel',
            default: 1,
          },
          {
            id: 'state',
            type: 'dropdown',
            label: 'State',
            default: 'on',
            choices: [
              { id: 'on', label: 'Mute On' },
              { id: 'off', label: 'Mute Off' },
              { id: 'toggle', label: 'Toggle' },
            ],
          },
        ],
      },
      {
        id: 'recall_scene',
        name: 'Recall Scene',
        description: 'Recall a scene by its number',
        options: [
          {
            id: 'scene',
            type: 'number',
            label: 'Scene Number',
            default: 1,
          },
        ],
      },
      {
        id: 'set_bus_send',
        name: 'Set Bus Send',
        description: 'Set the send level from a channel to a mix bus',
        options: [
          {
            id: 'ch',
            type: 'number',
            label: 'Channel',
            default: 1,
          },
          {
            id: 'bus',
            type: 'number',
            label: 'Mix Bus',
            default: 1,
          },
          {
            id: 'level',
            type: 'number',
            label: 'Level (0.0 - 1.0)',
            default: 0,
          },
        ],
      },
      {
        id: 'go_cue',
        name: 'Go Cue',
        description: 'Execute the next cue in the cue list',
        options: [],
      },
      {
        id: 'solo_ch',
        name: 'Solo Channel',
        description: 'Set the solo state of a channel',
        options: [
          {
            id: 'ch',
            type: 'number',
            label: 'Channel',
            default: 1,
          },
          {
            id: 'state',
            type: 'dropdown',
            label: 'State',
            default: 'on',
            choices: [
              { id: 'on', label: 'Solo On' },
              { id: 'off', label: 'Solo Off' },
              { id: 'toggle', label: 'Toggle' },
            ],
          },
        ],
      },
      {
        id: 'set_dca',
        name: 'Set DCA Level',
        description: 'Set the level of a DCA group',
        options: [
          {
            id: 'dca',
            type: 'number',
            label: 'DCA Group',
            default: 1,
          },
          {
            id: 'level',
            type: 'number',
            label: 'Level (0.0 - 1.0)',
            default: 0,
          },
        ],
      },
    ],
    feedbacks: [
      {
        id: 'fader_level',
        name: 'Fader Level',
        description: 'Current fader level of a channel',
        type: 'advanced',
      },
      {
        id: 'mute_state',
        name: 'Mute State',
        description: 'Current mute state of a channel',
        type: 'boolean',
      },
      {
        id: 'solo_active',
        name: 'Solo Active',
        description: 'Indicates whether solo is active on a channel',
        type: 'boolean',
      },
      {
        id: 'current_scene',
        name: 'Current Scene',
        description: 'Currently active scene name or number',
        type: 'advanced',
      },
    ],
    variables: [
      { id: 'current_scene', name: 'Current Scene Number' },
      { id: 'fader_ch_N', name: 'Fader Level (N = channel number)' },
      { id: 'mute_ch_N', name: 'Mute State (N = channel number)' },
      { id: 'bus_level_N', name: 'Bus Level (N = bus number)' },
      { id: 'dca_level_N', name: 'DCA Level (N = DCA number)' },
    ],
    supportedModels: [
      'X32',
      'X32 Rack',
      'X32 Core',
      'X32 Compact',
      'X32 Producer',
      'M32',
      'M32R',
      'M32C',
    ],
  },

  // --- behringer-wing ---
  {
    id: 'companion-mod-behringer-wing',
    moduleId: 'behringer-wing',
    name: 'Behringer WING',
    manufacturer: 'behringer',
    protocol: 'OSC/UDP',
    defaultPort: 2223,
    description:
      'Control Behringer WING digital mixing consoles via OSC over UDP. Supports fader control, muting, snapshot recall, aux sends, and FX parameter adjustment.',
    actions: [
      {
        id: 'set_fader',
        name: 'Set Fader',
        description: 'Set the fader level of a specific channel',
        options: [
          {
            id: 'ch',
            type: 'number',
            label: 'Channel',
            default: 1,
          },
          {
            id: 'level',
            type: 'number',
            label: 'Level (0.0 - 1.0)',
            default: 0,
          },
        ],
      },
      {
        id: 'set_mute',
        name: 'Set Mute',
        description: 'Set the mute state of a specific channel',
        options: [
          {
            id: 'ch',
            type: 'number',
            label: 'Channel',
            default: 1,
          },
          {
            id: 'state',
            type: 'dropdown',
            label: 'State',
            default: 'on',
            choices: [
              { id: 'on', label: 'Mute On' },
              { id: 'off', label: 'Mute Off' },
              { id: 'toggle', label: 'Toggle' },
            ],
          },
        ],
      },
      {
        id: 'recall_snapshot',
        name: 'Recall Snapshot',
        description: 'Recall a snapshot by its number',
        options: [
          {
            id: 'snapshot',
            type: 'number',
            label: 'Snapshot Number',
            default: 1,
          },
        ],
      },
      {
        id: 'set_aux_send',
        name: 'Set Aux Send',
        description: 'Set the aux send level from a channel to an aux bus',
        options: [
          {
            id: 'ch',
            type: 'number',
            label: 'Channel',
            default: 1,
          },
          {
            id: 'aux',
            type: 'number',
            label: 'Aux Bus',
            default: 1,
          },
          {
            id: 'level',
            type: 'number',
            label: 'Level (0.0 - 1.0)',
            default: 0,
          },
        ],
      },
      {
        id: 'set_fx_param',
        name: 'Set FX Parameter',
        description: 'Set a parameter on an FX unit',
        options: [
          {
            id: 'fx',
            type: 'number',
            label: 'FX Unit',
            default: 1,
          },
          {
            id: 'param',
            type: 'number',
            label: 'Parameter',
            default: 1,
          },
          {
            id: 'value',
            type: 'number',
            label: 'Value',
            default: 0,
          },
        ],
      },
    ],
    feedbacks: [
      {
        id: 'fader_level',
        name: 'Fader Level',
        description: 'Current fader level of a channel',
        type: 'advanced',
      },
      {
        id: 'mute_state',
        name: 'Mute State',
        description: 'Current mute state of a channel',
        type: 'boolean',
      },
      {
        id: 'current_snapshot',
        name: 'Current Snapshot',
        description: 'Currently active snapshot name or number',
        type: 'advanced',
      },
    ],
    variables: [
      { id: 'current_snapshot', name: 'Current Snapshot Number' },
      { id: 'fader_ch_N', name: 'Fader Level (N = channel number)' },
      { id: 'mute_ch_N', name: 'Mute State (N = channel number)' },
    ],
    supportedModels: ['WING', 'WING Rack'],
  },

  // --- shure-wireless ---
  {
    id: 'companion-mod-shure-wireless',
    moduleId: 'shure-wireless',
    name: 'Shure Wireless Systems',
    manufacturer: 'shure',
    protocol: 'TCP',
    defaultPort: 2202,
    description:
      'Monitor and control Shure wireless microphone systems via TCP. Supports channel naming, RF power control, audio gain, frequency management, and real-time monitoring of RF quality, battery, and audio levels.',
    actions: [
      {
        id: 'set_channel_name',
        name: 'Set Channel Name',
        description: 'Set the display name of a wireless channel',
        options: [
          {
            id: 'ch',
            type: 'number',
            label: 'Channel',
            default: 1,
          },
          {
            id: 'name',
            type: 'textinput',
            label: 'Channel Name',
            default: '',
          },
        ],
      },
      {
        id: 'set_rf_power',
        name: 'Set RF Power',
        description: 'Set the RF transmission power level',
        options: [
          {
            id: 'ch',
            type: 'number',
            label: 'Channel',
            default: 1,
          },
          {
            id: 'level',
            type: 'dropdown',
            label: 'Power Level',
            default: 'normal',
            choices: [
              { id: 'low', label: 'Low' },
              { id: 'normal', label: 'Normal' },
              { id: 'high', label: 'High' },
            ],
          },
        ],
      },
      {
        id: 'flash_channel',
        name: 'Flash Channel',
        description: 'Flash the LED on a receiver channel for identification',
        options: [
          {
            id: 'ch',
            type: 'number',
            label: 'Channel',
            default: 1,
          },
        ],
      },
      {
        id: 'set_audio_gain',
        name: 'Set Audio Gain',
        description: 'Set the audio output gain of a channel',
        options: [
          {
            id: 'ch',
            type: 'number',
            label: 'Channel',
            default: 1,
          },
          {
            id: 'gain',
            type: 'number',
            label: 'Gain (dB)',
            default: 0,
          },
        ],
      },
      {
        id: 'set_frequency',
        name: 'Set Frequency',
        description: 'Set the operating frequency of a channel',
        options: [
          {
            id: 'ch',
            type: 'number',
            label: 'Channel',
            default: 1,
          },
          {
            id: 'freq',
            type: 'textinput',
            label: 'Frequency (MHz)',
            default: '',
          },
        ],
      },
    ],
    feedbacks: [
      {
        id: 'rf_quality',
        name: 'RF Quality',
        description: 'Current RF signal quality level',
        type: 'advanced',
      },
      {
        id: 'battery_level',
        name: 'Battery Level',
        description: 'Current battery level of the transmitter',
        type: 'advanced',
      },
      {
        id: 'audio_level',
        name: 'Audio Level',
        description: 'Current audio input level',
        type: 'advanced',
      },
      {
        id: 'rf_interference',
        name: 'RF Interference',
        description: 'Indicates whether RF interference is detected',
        type: 'boolean',
      },
      {
        id: 'encryption_status',
        name: 'Encryption Status',
        description: 'Indicates whether encryption is active on the channel',
        type: 'boolean',
      },
    ],
    variables: [
      { id: 'rf_level_N', name: 'RF Level (N = channel number)' },
      { id: 'battery_bars_N', name: 'Battery Bars (N = channel number)' },
      { id: 'battery_runtime_N', name: 'Battery Runtime (N = channel number)' },
      { id: 'audio_level_N', name: 'Audio Level (N = channel number)' },
      { id: 'channel_name_N', name: 'Channel Name (N = channel number)' },
      { id: 'frequency_N', name: 'Frequency (N = channel number)' },
      { id: 'encryption_N', name: 'Encryption Status (N = channel number)' },
    ],
    supportedModels: ['AD4Q', 'AD4D', 'ULXD4Q', 'ULXD4D', 'SLX4D', 'PSM1000'],
  },

  // --- sennheiser-ewdx ---
  {
    id: 'companion-mod-sennheiser-ewdx',
    moduleId: 'sennheiser-ewdx',
    name: 'Sennheiser EW-DX',
    manufacturer: 'sennheiser',
    protocol: 'TCP/JSON',
    defaultPort: 45,
    description:
      'Monitor and control Sennheiser EW-DX wireless microphone systems via TCP with JSON messaging. Supports channel naming, identification, sensitivity control, muting, low-cut filtering, and real-time monitoring of RF quality, battery, and audio levels.',
    actions: [
      {
        id: 'set_channel_name',
        name: 'Set Channel Name',
        description: 'Set the display name of a wireless channel',
        options: [
          {
            id: 'ch',
            type: 'number',
            label: 'Channel',
            default: 1,
          },
          {
            id: 'name',
            type: 'textinput',
            label: 'Channel Name',
            default: '',
          },
        ],
      },
      {
        id: 'identify_channel',
        name: 'Identify Channel',
        description: 'Flash the LED on a receiver channel for identification',
        options: [
          {
            id: 'ch',
            type: 'number',
            label: 'Channel',
            default: 1,
          },
        ],
      },
      {
        id: 'set_sensitivity',
        name: 'Set Sensitivity',
        description: 'Set the input sensitivity level of a channel',
        options: [
          {
            id: 'ch',
            type: 'number',
            label: 'Channel',
            default: 1,
          },
          {
            id: 'level',
            type: 'number',
            label: 'Sensitivity Level (dB)',
            default: 0,
          },
        ],
      },
      {
        id: 'set_mute',
        name: 'Set Mute',
        description: 'Set the mute state of a specific channel',
        options: [
          {
            id: 'ch',
            type: 'number',
            label: 'Channel',
            default: 1,
          },
          {
            id: 'state',
            type: 'dropdown',
            label: 'State',
            default: 'on',
            choices: [
              { id: 'on', label: 'Mute On' },
              { id: 'off', label: 'Mute Off' },
              { id: 'toggle', label: 'Toggle' },
            ],
          },
        ],
      },
      {
        id: 'set_low_cut',
        name: 'Set Low Cut',
        description: 'Set the low-cut filter frequency on a channel',
        options: [
          {
            id: 'ch',
            type: 'number',
            label: 'Channel',
            default: 1,
          },
          {
            id: 'freq',
            type: 'number',
            label: 'Frequency (Hz)',
            default: 80,
          },
        ],
      },
    ],
    feedbacks: [
      {
        id: 'rf_quality',
        name: 'RF Quality',
        description: 'Current RF signal quality level',
        type: 'advanced',
      },
      {
        id: 'battery_level',
        name: 'Battery Level',
        description: 'Current battery level of the transmitter',
        type: 'advanced',
      },
      {
        id: 'audio_level',
        name: 'Audio Level',
        description: 'Current audio input level',
        type: 'advanced',
      },
      {
        id: 'link_quality',
        name: 'Link Quality',
        description: 'Indicates whether the wireless link quality is good',
        type: 'boolean',
      },
    ],
    variables: [
      { id: 'rf_level_N', name: 'RF Level (N = channel number)' },
      { id: 'battery_percent_N', name: 'Battery Percentage (N = channel number)' },
      { id: 'audio_level_N', name: 'Audio Level (N = channel number)' },
      { id: 'channel_name_N', name: 'Channel Name (N = channel number)' },
      { id: 'frequency_N', name: 'Frequency (N = channel number)' },
      { id: 'diversity_N', name: 'Diversity Status (N = channel number)' },
    ],
    supportedModels: ['EW-DX EM 4', 'EW-DX EM 2'],
  },
  // ============================================================
  // CAMERA / VIDEO / STREAMING - 8 modules
  // ============================================================

  // --- panasonic-ptz ---
  {
    id: 'companion-mod-panasonic-ptz',
    moduleId: 'panasonic-ptz',
    name: 'Panasonic PTZ Camera Control',
    manufacturer: 'panasonic',
    protocol: 'HTTP/CGI',
    defaultPort: 80,
    description:
      'Control Panasonic PTZ cameras via the HTTP/CGI interface. Supports pan/tilt/zoom, preset recall, iris, gain, white balance, tally, and OSD menu access.',
    actions: [
      {
        id: 'pan_tilt',
        name: 'Pan/Tilt',
        description: 'Move the camera pan and tilt axes',
        options: [
          {
            id: 'speed',
            type: 'number',
            label: 'Speed (1-49)',
            default: 25,
          },
          {
            id: 'direction',
            type: 'dropdown',
            label: 'Direction',
            default: 'up',
            choices: [
              { id: 'up', label: 'Up' },
              { id: 'down', label: 'Down' },
              { id: 'left', label: 'Left' },
              { id: 'right', label: 'Right' },
              { id: 'up_left', label: 'Up Left' },
              { id: 'up_right', label: 'Up Right' },
              { id: 'down_left', label: 'Down Left' },
              { id: 'down_right', label: 'Down Right' },
              { id: 'stop', label: 'Stop' },
            ],
          },
        ],
      },
      {
        id: 'zoom',
        name: 'Zoom',
        description: 'Zoom the camera lens in or out',
        options: [
          {
            id: 'speed',
            type: 'number',
            label: 'Speed (1-49)',
            default: 25,
          },
          {
            id: 'direction',
            type: 'dropdown',
            label: 'Direction',
            default: 'in',
            choices: [
              { id: 'in', label: 'Zoom In' },
              { id: 'out', label: 'Zoom Out' },
              { id: 'stop', label: 'Stop' },
            ],
          },
        ],
      },
      {
        id: 'set_preset',
        name: 'Set Preset',
        description: 'Store the current camera position to a preset slot',
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
        id: 'recall_preset',
        name: 'Recall Preset',
        description: 'Move the camera to a stored preset position',
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
        id: 'power_on',
        name: 'Power On',
        description: 'Power on the camera',
        options: [],
      },
      {
        id: 'power_off',
        name: 'Power Off',
        description: 'Power off the camera',
        options: [],
      },
      {
        id: 'auto_focus',
        name: 'Auto Focus',
        description: 'Trigger one-shot auto focus',
        options: [],
      },
      {
        id: 'set_iris',
        name: 'Set Iris',
        description: 'Set the iris aperture value',
        options: [
          {
            id: 'value',
            type: 'number',
            label: 'Iris Value (0-255)',
            default: 128,
          },
        ],
      },
      {
        id: 'set_gain',
        name: 'Set Gain',
        description: 'Set the camera gain value',
        options: [
          {
            id: 'value',
            type: 'number',
            label: 'Gain Value (0-255)',
            default: 128,
          },
        ],
      },
      {
        id: 'set_white_balance',
        name: 'Set White Balance',
        description: 'Set the white balance mode',
        options: [
          {
            id: 'mode',
            type: 'dropdown',
            label: 'White Balance Mode',
            default: 'auto',
            choices: [
              { id: 'auto', label: 'Auto' },
              { id: 'manual', label: 'Manual' },
              { id: '3200k', label: '3200K' },
              { id: '5600k', label: '5600K' },
            ],
          },
        ],
      },
      {
        id: 'tally_on',
        name: 'Tally On',
        description: 'Turn on the tally light',
        options: [],
      },
      {
        id: 'tally_off',
        name: 'Tally Off',
        description: 'Turn off the tally light',
        options: [],
      },
      {
        id: 'osd_menu_toggle',
        name: 'OSD Menu Toggle',
        description: 'Toggle the on-screen display menu',
        options: [],
      },
    ],
    feedbacks: [
      {
        id: 'power_state',
        name: 'Power State',
        description: 'Indicates whether the camera is powered on',
        type: 'boolean',
      },
      {
        id: 'tally_state',
        name: 'Tally State',
        description: 'Indicates whether the tally light is active',
        type: 'boolean',
      },
      {
        id: 'recording_state',
        name: 'Recording State',
        description: 'Indicates whether the camera is currently recording',
        type: 'boolean',
      },
      {
        id: 'preset_active',
        name: 'Preset Active',
        description: 'Indicates the currently active preset number',
        type: 'advanced',
      },
    ],
    variables: [
      { id: 'power_state', name: 'Power State' },
      { id: 'tally_state', name: 'Tally State' },
      { id: 'zoom_position', name: 'Zoom Position' },
      { id: 'pan_position', name: 'Pan Position' },
      { id: 'tilt_position', name: 'Tilt Position' },
      { id: 'preset_name_1', name: 'Preset 1 Name' },
      { id: 'preset_name_2', name: 'Preset 2 Name' },
      { id: 'preset_name_3', name: 'Preset 3 Name' },
      { id: 'preset_name_4', name: 'Preset 4 Name' },
      { id: 'preset_name_5', name: 'Preset 5 Name' },
      { id: 'model_name', name: 'Model Name' },
    ],
    supportedModels: ['AW-UE150', 'AW-UE100', 'AW-HE130', 'AW-RP150', 'AW-RP60'],
  },

  // --- sony-visca ---
  {
    id: 'companion-mod-sony-visca',
    moduleId: 'sony-visca',
    name: 'Sony VISCA Camera Control',
    manufacturer: 'sony',
    protocol: 'VISCA/IP',
    defaultPort: 52381,
    description:
      'Control Sony cameras via the VISCA over IP protocol. Supports pan/tilt/zoom, preset memory, power, focus, exposure mode, and tally control.',
    actions: [
      {
        id: 'pan_tilt',
        name: 'Pan/Tilt',
        description: 'Move the camera pan and tilt axes',
        options: [
          {
            id: 'speed',
            type: 'number',
            label: 'Speed (1-24)',
            default: 12,
          },
          {
            id: 'direction',
            type: 'dropdown',
            label: 'Direction',
            default: 'up',
            choices: [
              { id: 'up', label: 'Up' },
              { id: 'down', label: 'Down' },
              { id: 'left', label: 'Left' },
              { id: 'right', label: 'Right' },
              { id: 'up_left', label: 'Up Left' },
              { id: 'up_right', label: 'Up Right' },
              { id: 'down_left', label: 'Down Left' },
              { id: 'down_right', label: 'Down Right' },
              { id: 'stop', label: 'Stop' },
            ],
          },
        ],
      },
      {
        id: 'zoom',
        name: 'Zoom',
        description: 'Zoom the camera lens in or out',
        options: [
          {
            id: 'speed',
            type: 'number',
            label: 'Speed (0-7)',
            default: 4,
          },
          {
            id: 'direction',
            type: 'dropdown',
            label: 'Direction',
            default: 'in',
            choices: [
              { id: 'in', label: 'Zoom In' },
              { id: 'out', label: 'Zoom Out' },
              { id: 'stop', label: 'Stop' },
            ],
          },
        ],
      },
      {
        id: 'recall_preset',
        name: 'Recall Preset',
        description: 'Move the camera to a stored preset position',
        options: [
          {
            id: 'preset',
            type: 'number',
            label: 'Preset Number (0-255)',
            default: 0,
          },
        ],
      },
      {
        id: 'store_preset',
        name: 'Store Preset',
        description: 'Store the current camera position to a preset slot',
        options: [
          {
            id: 'preset',
            type: 'number',
            label: 'Preset Number (0-255)',
            default: 0,
          },
        ],
      },
      {
        id: 'power_on',
        name: 'Power On',
        description: 'Power on the camera',
        options: [],
      },
      {
        id: 'power_off',
        name: 'Power Off',
        description: 'Power off the camera',
        options: [],
      },
      {
        id: 'set_focus_mode',
        name: 'Set Focus Mode',
        description: 'Set the camera focus mode',
        options: [
          {
            id: 'mode',
            type: 'dropdown',
            label: 'Focus Mode',
            default: 'auto',
            choices: [
              { id: 'auto', label: 'Auto' },
              { id: 'manual', label: 'Manual' },
            ],
          },
        ],
      },
      {
        id: 'auto_focus_trigger',
        name: 'Auto Focus Trigger',
        description: 'Trigger one-push auto focus',
        options: [],
      },
      {
        id: 'set_exposure_mode',
        name: 'Set Exposure Mode',
        description: 'Set the camera exposure mode',
        options: [
          {
            id: 'mode',
            type: 'dropdown',
            label: 'Exposure Mode',
            default: 'auto',
            choices: [
              { id: 'auto', label: 'Auto' },
              { id: 'manual', label: 'Manual' },
              { id: 'shutter-priority', label: 'Shutter Priority' },
              { id: 'iris-priority', label: 'Iris Priority' },
            ],
          },
        ],
      },
      {
        id: 'tally_on',
        name: 'Tally On',
        description: 'Turn on the tally light',
        options: [],
      },
      {
        id: 'tally_off',
        name: 'Tally Off',
        description: 'Turn off the tally light',
        options: [],
      },
    ],
    feedbacks: [
      {
        id: 'power_state',
        name: 'Power State',
        description: 'Indicates whether the camera is powered on',
        type: 'boolean',
      },
      {
        id: 'tally_state',
        name: 'Tally State',
        description: 'Indicates whether the tally light is active',
        type: 'boolean',
      },
      {
        id: 'zoom_position',
        name: 'Zoom Position',
        description: 'Current zoom position value',
        type: 'advanced',
      },
      {
        id: 'focus_mode',
        name: 'Focus Mode',
        description: 'Current focus mode of the camera',
        type: 'advanced',
      },
    ],
    variables: [
      { id: 'power_state', name: 'Power State' },
      { id: 'zoom_position', name: 'Zoom Position' },
      { id: 'pan_position', name: 'Pan Position' },
      { id: 'tilt_position', name: 'Tilt Position' },
      { id: 'focus_mode', name: 'Focus Mode' },
      { id: 'exposure_mode', name: 'Exposure Mode' },
    ],
    supportedModels: ['BRC-X400', 'BRC-X1000', 'SRG-X400', 'SRG-X120', 'FR7'],
  },

  // --- magewell-ultrastream ---
  {
    id: 'companion-mod-magewell-ultrastream',
    moduleId: 'magewell-ultrastream',
    name: 'Magewell Encoding/Streaming',
    manufacturer: 'magewell',
    protocol: 'HTTP/REST',
    defaultPort: 80,
    description:
      'Control Magewell encoding and streaming devices via the HTTP REST API. Manage streaming, recording, input selection, bitrate, resolution, and snapshot capture.',
    actions: [
      {
        id: 'start_stream',
        name: 'Start Stream',
        description: 'Start the live stream',
        options: [],
      },
      {
        id: 'stop_stream',
        name: 'Stop Stream',
        description: 'Stop the live stream',
        options: [],
      },
      {
        id: 'start_record',
        name: 'Start Record',
        description: 'Start recording to local storage',
        options: [],
      },
      {
        id: 'stop_record',
        name: 'Stop Record',
        description: 'Stop recording',
        options: [],
      },
      {
        id: 'set_bitrate',
        name: 'Set Bitrate',
        description: 'Set the encoding bitrate in kbps',
        options: [
          {
            id: 'value',
            type: 'number',
            label: 'Bitrate (kbps)',
            default: 5000,
          },
        ],
      },
      {
        id: 'set_resolution',
        name: 'Set Resolution',
        description: 'Set the encoding output resolution',
        options: [
          {
            id: 'resolution',
            type: 'dropdown',
            label: 'Resolution',
            default: '1080p',
            choices: [
              { id: '4k', label: '4K (3840x2160)' },
              { id: '1080p', label: '1080p (1920x1080)' },
              { id: '720p', label: '720p (1280x720)' },
            ],
          },
        ],
      },
      {
        id: 'take_snapshot',
        name: 'Take Snapshot',
        description: 'Capture a still image from the current input',
        options: [],
      },
      {
        id: 'set_stream_url',
        name: 'Set Stream URL',
        description: 'Set the streaming destination URL',
        options: [
          {
            id: 'url',
            type: 'textinput',
            label: 'Stream URL',
            default: '',
          },
        ],
      },
      {
        id: 'switch_input',
        name: 'Switch Input',
        description: 'Switch the active input source',
        options: [
          {
            id: 'input',
            type: 'dropdown',
            label: 'Input Source',
            default: 'hdmi',
            choices: [
              { id: 'hdmi', label: 'HDMI' },
              { id: 'sdi', label: 'SDI' },
              { id: 'usb', label: 'USB' },
            ],
          },
        ],
      },
    ],
    feedbacks: [
      {
        id: 'streaming_state',
        name: 'Streaming State',
        description: 'Indicates whether the device is currently streaming',
        type: 'boolean',
      },
      {
        id: 'recording_state',
        name: 'Recording State',
        description: 'Indicates whether the device is currently recording',
        type: 'boolean',
      },
      {
        id: 'input_signal',
        name: 'Input Signal',
        description: 'Indicates whether a valid input signal is detected',
        type: 'boolean',
      },
      {
        id: 'encoding_status',
        name: 'Encoding Status',
        description: 'Current encoding status of the device',
        type: 'advanced',
      },
    ],
    variables: [
      { id: 'stream_status', name: 'Stream Status' },
      { id: 'record_status', name: 'Record Status' },
      { id: 'input_resolution', name: 'Input Resolution' },
      { id: 'input_framerate', name: 'Input Frame Rate' },
      { id: 'bitrate', name: 'Current Bitrate' },
      { id: 'uptime', name: 'Device Uptime' },
      { id: 'cpu_temp', name: 'CPU Temperature' },
      { id: 'stream_duration', name: 'Stream Duration' },
    ],
    supportedModels: [
      'Ultra Encode HDMI Plus',
      'Ultra Encode AIO',
      'Ultra Stream HDMI',
      'Pro Convert 4K Plus',
    ],
  },

  // --- teradek-vidiu ---
  {
    id: 'companion-mod-teradek-vidiu',
    moduleId: 'teradek-vidiu',
    name: 'Teradek Streaming/Encoding',
    manufacturer: 'teradek',
    protocol: 'HTTP/REST',
    defaultPort: 80,
    description:
      'Control Teradek streaming and encoding devices via the HTTP REST API. Manage streaming, recording, input selection, bitrate, streaming modes, and device reboot.',
    actions: [
      {
        id: 'start_stream',
        name: 'Start Stream',
        description: 'Start the live stream',
        options: [],
      },
      {
        id: 'stop_stream',
        name: 'Stop Stream',
        description: 'Stop the live stream',
        options: [],
      },
      {
        id: 'start_record',
        name: 'Start Record',
        description: 'Start recording to local storage',
        options: [],
      },
      {
        id: 'stop_record',
        name: 'Stop Record',
        description: 'Stop recording',
        options: [],
      },
      {
        id: 'set_bitrate',
        name: 'Set Bitrate',
        description: 'Set the encoding bitrate in kbps',
        options: [
          {
            id: 'value',
            type: 'number',
            label: 'Bitrate (kbps)',
            default: 5000,
          },
        ],
      },
      {
        id: 'switch_input',
        name: 'Switch Input',
        description: 'Switch the active input source',
        options: [
          {
            id: 'input',
            type: 'dropdown',
            label: 'Input Source',
            default: 'sdi',
            choices: [
              { id: 'sdi', label: 'SDI' },
              { id: 'hdmi', label: 'HDMI' },
            ],
          },
        ],
      },
      {
        id: 'set_streaming_mode',
        name: 'Set Streaming Mode',
        description: 'Set the streaming protocol mode',
        options: [
          {
            id: 'mode',
            type: 'dropdown',
            label: 'Streaming Mode',
            default: 'rtmp',
            choices: [
              { id: 'rtmp', label: 'RTMP' },
              { id: 'srt', label: 'SRT' },
              { id: 'hls', label: 'HLS' },
            ],
          },
        ],
      },
      {
        id: 'reboot',
        name: 'Reboot',
        description: 'Reboot the device',
        options: [],
      },
    ],
    feedbacks: [
      {
        id: 'streaming_state',
        name: 'Streaming State',
        description: 'Indicates whether the device is currently streaming',
        type: 'boolean',
      },
      {
        id: 'recording_state',
        name: 'Recording State',
        description: 'Indicates whether the device is currently recording',
        type: 'boolean',
      },
      {
        id: 'signal_detected',
        name: 'Signal Detected',
        description: 'Indicates whether a valid input signal is detected',
        type: 'boolean',
      },
      {
        id: 'connection_quality',
        name: 'Connection Quality',
        description: 'Current connection quality percentage',
        type: 'advanced',
      },
    ],
    variables: [
      { id: 'stream_status', name: 'Stream Status' },
      { id: 'record_status', name: 'Record Status' },
      { id: 'stream_duration', name: 'Stream Duration' },
      { id: 'bitrate_current', name: 'Current Bitrate' },
      { id: 'connection_quality', name: 'Connection Quality' },
      { id: 'input_format', name: 'Input Format' },
      { id: 'battery_level', name: 'Battery Level' },
    ],
    supportedModels: ['Prism Flex', 'Prism Mobile', 'Cube 655', 'Cube 755', 'VidiU Go'],
  },

  // --- ptzoptics-visca ---
  {
    id: 'companion-mod-ptzoptics-visca',
    moduleId: 'ptzoptics-visca',
    name: 'PTZOptics Camera Control',
    manufacturer: 'ptzoptics',
    protocol: 'VISCA/TCP',
    defaultPort: 5678,
    description:
      'Control PTZOptics cameras via VISCA over TCP. Supports pan/tilt/zoom, preset memory, focus mode, white balance, power control, and OSD toggle.',
    actions: [
      {
        id: 'pan_tilt',
        name: 'Pan/Tilt',
        description: 'Move the camera pan and tilt axes',
        options: [
          {
            id: 'speed',
            type: 'number',
            label: 'Speed (1-24)',
            default: 12,
          },
          {
            id: 'direction',
            type: 'dropdown',
            label: 'Direction',
            default: 'up',
            choices: [
              { id: 'up', label: 'Up' },
              { id: 'down', label: 'Down' },
              { id: 'left', label: 'Left' },
              { id: 'right', label: 'Right' },
              { id: 'up_left', label: 'Up Left' },
              { id: 'up_right', label: 'Up Right' },
              { id: 'down_left', label: 'Down Left' },
              { id: 'down_right', label: 'Down Right' },
              { id: 'stop', label: 'Stop' },
            ],
          },
        ],
      },
      {
        id: 'zoom',
        name: 'Zoom',
        description: 'Zoom the camera lens in or out',
        options: [
          {
            id: 'speed',
            type: 'number',
            label: 'Speed (0-7)',
            default: 4,
          },
          {
            id: 'direction',
            type: 'dropdown',
            label: 'Direction',
            default: 'in',
            choices: [
              { id: 'in', label: 'Zoom In' },
              { id: 'out', label: 'Zoom Out' },
              { id: 'stop', label: 'Stop' },
            ],
          },
        ],
      },
      {
        id: 'recall_preset',
        name: 'Recall Preset',
        description: 'Move the camera to a stored preset position',
        options: [
          {
            id: 'preset',
            type: 'number',
            label: 'Preset Number (0-255)',
            default: 0,
          },
        ],
      },
      {
        id: 'store_preset',
        name: 'Store Preset',
        description: 'Store the current camera position to a preset slot',
        options: [
          {
            id: 'preset',
            type: 'number',
            label: 'Preset Number (0-255)',
            default: 0,
          },
        ],
      },
      {
        id: 'set_focus_mode',
        name: 'Set Focus Mode',
        description: 'Set the camera focus mode',
        options: [
          {
            id: 'mode',
            type: 'dropdown',
            label: 'Focus Mode',
            default: 'auto',
            choices: [
              { id: 'auto', label: 'Auto' },
              { id: 'manual', label: 'Manual' },
            ],
          },
        ],
      },
      {
        id: 'power_on',
        name: 'Power On',
        description: 'Power on the camera',
        options: [],
      },
      {
        id: 'power_off',
        name: 'Power Off',
        description: 'Power off the camera',
        options: [],
      },
      {
        id: 'set_wb_mode',
        name: 'Set White Balance Mode',
        description: 'Set the white balance mode',
        options: [
          {
            id: 'mode',
            type: 'dropdown',
            label: 'White Balance Mode',
            default: 'auto',
            choices: [
              { id: 'auto', label: 'Auto' },
              { id: '3200k', label: '3200K' },
              { id: '5600k', label: '5600K' },
              { id: 'one-push', label: 'One Push' },
            ],
          },
        ],
      },
      {
        id: 'osd_toggle',
        name: 'OSD Toggle',
        description: 'Toggle the on-screen display menu',
        options: [],
      },
    ],
    feedbacks: [
      {
        id: 'power_state',
        name: 'Power State',
        description: 'Indicates whether the camera is powered on',
        type: 'boolean',
      },
      {
        id: 'tally_state',
        name: 'Tally State',
        description: 'Indicates whether the tally light is active',
        type: 'boolean',
      },
      {
        id: 'preset_active',
        name: 'Preset Active',
        description: 'Indicates the currently active preset number',
        type: 'advanced',
      },
      {
        id: 'autofocus_state',
        name: 'Autofocus State',
        description: 'Indicates whether autofocus is enabled',
        type: 'boolean',
      },
    ],
    variables: [
      { id: 'power_state', name: 'Power State' },
      { id: 'zoom_position', name: 'Zoom Position' },
      { id: 'pan_position', name: 'Pan Position' },
      { id: 'tilt_position', name: 'Tilt Position' },
      { id: 'preset_last_recalled', name: 'Last Recalled Preset' },
    ],
    supportedModels: ['Move 4K', 'Link 4K', 'Move SE'],
  },

  // --- datavideo-dvip ---
  {
    id: 'companion-mod-datavideo-dvip',
    moduleId: 'datavideo-dvip',
    name: 'Datavideo DVIP Control',
    manufacturer: 'datavideo',
    protocol: 'DVIP/TCP',
    defaultPort: 5728,
    description:
      'Control Datavideo video switchers via the DVIP protocol over TCP. Supports program/preview selection, transitions, fade to black, PiP, keying, DSK, and macro recall.',
    actions: [
      {
        id: 'cut',
        name: 'Cut',
        description: 'Execute a hard cut transition',
        options: [],
      },
      {
        id: 'auto_transition',
        name: 'Auto Transition',
        description: 'Execute an automatic transition with the configured speed',
        options: [
          {
            id: 'speed',
            type: 'number',
            label: 'Transition Speed (frames)',
            default: 30,
          },
        ],
      },
      {
        id: 'set_pgm',
        name: 'Set Program',
        description: 'Set the program bus source',
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
        id: 'set_pvw',
        name: 'Set Preview',
        description: 'Set the preview bus source',
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
        id: 'fade_to_black',
        name: 'Fade to Black',
        description: 'Toggle fade to black on or off',
        options: [],
      },
      {
        id: 'set_pip_source',
        name: 'Set PiP Source',
        description: 'Set the picture-in-picture source',
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
        id: 'set_key_source',
        name: 'Set Key Source',
        description: 'Set the upstream key source',
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
        id: 'set_dsk_state',
        name: 'Set DSK State',
        description: 'Set the downstream keyer on or off',
        options: [
          {
            id: 'state',
            type: 'dropdown',
            label: 'DSK State',
            default: 'on',
            choices: [
              { id: 'on', label: 'On' },
              { id: 'off', label: 'Off' },
            ],
          },
        ],
      },
      {
        id: 'recall_macro',
        name: 'Recall Macro',
        description: 'Recall and execute a stored macro',
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
        id: 'pgm_source',
        name: 'Program Source',
        description: 'Indicates the current program bus source',
        type: 'advanced',
      },
      {
        id: 'pvw_source',
        name: 'Preview Source',
        description: 'Indicates the current preview bus source',
        type: 'advanced',
      },
      {
        id: 'ftb_state',
        name: 'Fade to Black State',
        description: 'Indicates whether fade to black is active',
        type: 'boolean',
      },
      {
        id: 'transition_active',
        name: 'Transition Active',
        description: 'Indicates whether a transition is currently in progress',
        type: 'boolean',
      },
    ],
    variables: [
      { id: 'pgm_source', name: 'Program Source' },
      { id: 'pvw_source', name: 'Preview Source' },
      { id: 'transition_position', name: 'Transition Position' },
      { id: 'ftb_state', name: 'Fade to Black State' },
      { id: 'dsk_state', name: 'DSK State' },
    ],
    supportedModels: ['SE-4000', 'SE-3200', 'SE-2200'],
  },

  // --- datavideo-ptz ---
  {
    id: 'companion-mod-datavideo-ptz',
    moduleId: 'datavideo-ptz',
    name: 'Datavideo PTZ Camera',
    manufacturer: 'datavideo',
    protocol: 'VISCA/IP',
    defaultPort: 5500,
    description:
      'Control Datavideo PTZ cameras via VISCA over IP. Supports pan/tilt/zoom, preset memory, power control, and tally light management.',
    actions: [
      {
        id: 'pan_tilt',
        name: 'Pan/Tilt',
        description: 'Move the camera pan and tilt axes',
        options: [
          {
            id: 'speed',
            type: 'number',
            label: 'Speed (1-24)',
            default: 12,
          },
          {
            id: 'direction',
            type: 'dropdown',
            label: 'Direction',
            default: 'up',
            choices: [
              { id: 'up', label: 'Up' },
              { id: 'down', label: 'Down' },
              { id: 'left', label: 'Left' },
              { id: 'right', label: 'Right' },
              { id: 'up_left', label: 'Up Left' },
              { id: 'up_right', label: 'Up Right' },
              { id: 'down_left', label: 'Down Left' },
              { id: 'down_right', label: 'Down Right' },
              { id: 'stop', label: 'Stop' },
            ],
          },
        ],
      },
      {
        id: 'zoom',
        name: 'Zoom',
        description: 'Zoom the camera lens in or out',
        options: [
          {
            id: 'speed',
            type: 'number',
            label: 'Speed (0-7)',
            default: 4,
          },
          {
            id: 'direction',
            type: 'dropdown',
            label: 'Direction',
            default: 'in',
            choices: [
              { id: 'in', label: 'Zoom In' },
              { id: 'out', label: 'Zoom Out' },
              { id: 'stop', label: 'Stop' },
            ],
          },
        ],
      },
      {
        id: 'recall_preset',
        name: 'Recall Preset',
        description: 'Move the camera to a stored preset position',
        options: [
          {
            id: 'preset',
            type: 'number',
            label: 'Preset Number (0-255)',
            default: 0,
          },
        ],
      },
      {
        id: 'store_preset',
        name: 'Store Preset',
        description: 'Store the current camera position to a preset slot',
        options: [
          {
            id: 'preset',
            type: 'number',
            label: 'Preset Number (0-255)',
            default: 0,
          },
        ],
      },
      {
        id: 'power_on',
        name: 'Power On',
        description: 'Power on the camera',
        options: [],
      },
      {
        id: 'power_off',
        name: 'Power Off',
        description: 'Power off the camera',
        options: [],
      },
      {
        id: 'tally_on',
        name: 'Tally On',
        description: 'Turn on the tally light',
        options: [],
      },
      {
        id: 'tally_off',
        name: 'Tally Off',
        description: 'Turn off the tally light',
        options: [],
      },
    ],
    feedbacks: [
      {
        id: 'power_state',
        name: 'Power State',
        description: 'Indicates whether the camera is powered on',
        type: 'boolean',
      },
      {
        id: 'tally_state',
        name: 'Tally State',
        description: 'Indicates whether the tally light is active',
        type: 'boolean',
      },
      {
        id: 'preset_active',
        name: 'Preset Active',
        description: 'Indicates the currently active preset number',
        type: 'advanced',
      },
    ],
    variables: [
      { id: 'power_state', name: 'Power State' },
      { id: 'zoom_position', name: 'Zoom Position' },
      { id: 'preset_last', name: 'Last Recalled Preset' },
    ],
    supportedModels: ['PTC-280', 'PTC-150TL', 'PTC-140T'],
  },

  // --- roland-v60hd ---
  {
    id: 'companion-mod-roland-v60hd',
    moduleId: 'roland-v60hd',
    name: 'Roland Video Switcher',
    manufacturer: 'roland',
    protocol: 'TCP/SMART',
    defaultPort: 8023,
    description:
      'Control Roland video switchers via the TCP SMART protocol. Supports program/preview selection, transitions, fade to black, still images, memory recall, audio mixing, and output assignment.',
    actions: [
      {
        id: 'cut',
        name: 'Cut',
        description: 'Execute a hard cut transition',
        options: [],
      },
      {
        id: 'auto_transition',
        name: 'Auto Transition',
        description: 'Execute an automatic transition',
        options: [],
      },
      {
        id: 'set_pgm',
        name: 'Set Program',
        description: 'Set the program bus source',
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
        id: 'set_pvw',
        name: 'Set Preview',
        description: 'Set the preview bus source',
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
        id: 'fade_to_black',
        name: 'Fade to Black',
        description: 'Toggle fade to black on or off',
        options: [],
      },
      {
        id: 'set_transition_type',
        name: 'Set Transition Type',
        description: 'Set the transition effect type',
        options: [
          {
            id: 'type',
            type: 'dropdown',
            label: 'Transition Type',
            default: 'mix',
            choices: [
              { id: 'mix', label: 'Mix' },
              { id: 'wipe', label: 'Wipe' },
              { id: 'cut', label: 'Cut' },
            ],
          },
        ],
      },
      {
        id: 'set_still_image',
        name: 'Set Still Image',
        description: 'Load a still image from a memory slot',
        options: [
          {
            id: 'slot',
            type: 'number',
            label: 'Still Image Slot',
            default: 1,
          },
        ],
      },
      {
        id: 'recall_memory',
        name: 'Recall Memory',
        description: 'Recall a stored memory preset',
        options: [
          {
            id: 'memory',
            type: 'number',
            label: 'Memory Number',
            default: 1,
          },
        ],
      },
      {
        id: 'set_audio_level',
        name: 'Set Audio Level',
        description: 'Set the audio level for a specific channel',
        options: [
          {
            id: 'ch',
            type: 'number',
            label: 'Channel Number',
            default: 1,
          },
          {
            id: 'level',
            type: 'number',
            label: 'Level (0-100)',
            default: 75,
          },
        ],
      },
      {
        id: 'set_audio_mute',
        name: 'Set Audio Mute',
        description: 'Mute or unmute an audio channel',
        options: [
          {
            id: 'ch',
            type: 'number',
            label: 'Channel Number',
            default: 1,
          },
          {
            id: 'state',
            type: 'dropdown',
            label: 'Mute State',
            default: 'on',
            choices: [
              { id: 'on', label: 'Mute On' },
              { id: 'off', label: 'Mute Off' },
            ],
          },
        ],
      },
      {
        id: 'set_output_assign',
        name: 'Set Output Assign',
        description: 'Assign a source to a specific output',
        options: [
          {
            id: 'output',
            type: 'number',
            label: 'Output Number',
            default: 1,
          },
          {
            id: 'source',
            type: 'number',
            label: 'Source Number',
            default: 1,
          },
        ],
      },
    ],
    feedbacks: [
      {
        id: 'pgm_source',
        name: 'Program Source',
        description: 'Indicates the current program bus source',
        type: 'advanced',
      },
      {
        id: 'pvw_source',
        name: 'Preview Source',
        description: 'Indicates the current preview bus source',
        type: 'advanced',
      },
      {
        id: 'ftb_state',
        name: 'Fade to Black State',
        description: 'Indicates whether fade to black is active',
        type: 'boolean',
      },
      {
        id: 'transition_active',
        name: 'Transition Active',
        description: 'Indicates whether a transition is currently in progress',
        type: 'boolean',
      },
      {
        id: 'audio_level',
        name: 'Audio Level',
        description: 'Current audio level for a channel',
        type: 'advanced',
      },
    ],
    variables: [
      { id: 'pgm_source', name: 'Program Source' },
      { id: 'pvw_source', name: 'Preview Source' },
      { id: 'transition_type', name: 'Transition Type' },
      { id: 'ftb_state', name: 'Fade to Black State' },
      { id: 'audio_level_1', name: 'Audio Level Channel 1' },
      { id: 'audio_level_2', name: 'Audio Level Channel 2' },
      { id: 'audio_level_3', name: 'Audio Level Channel 3' },
      { id: 'audio_level_4', name: 'Audio Level Channel 4' },
      { id: 'output_resolution', name: 'Output Resolution' },
    ],
    supportedModels: ['V-160HD', 'V-60HD', 'VR-6HD', 'V-02HD MK II'],
  },
  // ============================================================
  // ETC - 1 module
  // ============================================================

  // --- etc-eos ---
  {
    id: 'companion-mod-etc-eos',
    moduleId: 'etc-eos',
    name: 'ETC Eos Family Lighting Console',
    manufacturer: 'etc',
    protocol: 'OSC/UDP',
    defaultPort: 3032,
    description:
      'Control ETC Eos-family lighting consoles via OSC. Supports cue playback, channel and submaster control, macro execution, grandmaster management, and command-line interaction.',
    actions: [
      {
        id: 'go_cue',
        name: 'Go Cue',
        description: 'Fire a specific cue number on the active cue list',
        options: [
          {
            id: 'cue_number',
            type: 'textinput',
            label: 'Cue Number',
            default: '1',
          },
        ],
      },
      {
        id: 'stop_cue',
        name: 'Stop Cue',
        description: 'Stop the currently running cue or effect',
        options: [],
      },
      {
        id: 'go_back',
        name: 'Go Back',
        description: 'Go back to the previous cue in the cue list',
        options: [],
      },
      {
        id: 'fire_macro',
        name: 'Fire Macro',
        description: 'Execute a macro by its number',
        options: [
          {
            id: 'macro_number',
            type: 'number',
            label: 'Macro Number',
            default: 1,
          },
        ],
      },
      {
        id: 'set_channel_level',
        name: 'Set Channel Level',
        description: 'Set a lighting channel to a specific intensity level',
        options: [
          {
            id: 'channel',
            type: 'number',
            label: 'Channel Number',
            default: 1,
          },
          {
            id: 'level',
            type: 'number',
            label: 'Level (0 - 100)',
            default: 100,
          },
        ],
      },
      {
        id: 'set_sub_master',
        name: 'Set Submaster',
        description: 'Set a submaster fader to a specific level',
        options: [
          {
            id: 'sub',
            type: 'number',
            label: 'Submaster Number',
            default: 1,
          },
          {
            id: 'level',
            type: 'number',
            label: 'Level (0 - 100)',
            default: 100,
          },
        ],
      },
      {
        id: 'select_channel',
        name: 'Select Channel',
        description: 'Select a channel on the command line for further manipulation',
        options: [
          {
            id: 'channel',
            type: 'number',
            label: 'Channel Number',
            default: 1,
          },
        ],
      },
      {
        id: 'set_grandmaster',
        name: 'Set Grandmaster',
        description: 'Set the grandmaster fader level',
        options: [
          {
            id: 'level',
            type: 'number',
            label: 'Level (0 - 100)',
            default: 100,
          },
        ],
      },
      {
        id: 'blackout',
        name: 'Blackout',
        description: 'Toggle or activate the grandmaster blackout',
        options: [],
      },
      {
        id: 'record_cue',
        name: 'Record Cue',
        description: 'Record the current state as a new cue',
        options: [
          {
            id: 'cue',
            type: 'textinput',
            label: 'Cue Number',
            default: '1',
          },
        ],
      },
      {
        id: 'clear_command_line',
        name: 'Clear Command Line',
        description: 'Clear the current command line entry on the console',
        options: [],
      },
      {
        id: 'set_sneak_time',
        name: 'Set Sneak Time',
        description: 'Set the sneak transition time for manual fader moves',
        options: [
          {
            id: 'time',
            type: 'number',
            label: 'Time (seconds)',
            default: 0,
          },
        ],
      },
    ],
    feedbacks: [
      {
        id: 'cue_active',
        name: 'Cue Active',
        description: 'Indicates which cue is currently active',
        type: 'advanced',
      },
      {
        id: 'cue_pending',
        name: 'Cue Pending',
        description: 'Indicates which cue is pending (next to fire)',
        type: 'advanced',
      },
      {
        id: 'grandmaster_level',
        name: 'Grandmaster Level',
        description: 'Current grandmaster fader level',
        type: 'advanced',
      },
      {
        id: 'blackout_state',
        name: 'Blackout State',
        description: 'Indicates whether blackout is currently engaged',
        type: 'boolean',
      },
      {
        id: 'command_line',
        name: 'Command Line',
        description: 'Current contents of the command line',
        type: 'advanced',
      },
    ],
    variables: [
      { id: 'current_cue', name: 'Current Cue' },
      { id: 'pending_cue', name: 'Pending Cue' },
      { id: 'cue_list', name: 'Active Cue List' },
      { id: 'last_cue', name: 'Last Fired Cue' },
      { id: 'grandmaster', name: 'Grandmaster Level' },
      { id: 'show_name', name: 'Show Name' },
      { id: 'active_channels', name: 'Active Channels Count' },
      { id: 'command_line', name: 'Command Line Contents' },
    ],
    supportedModels: [
      'Eos Ti',
      'Eos Apex',
      'Ion Xe',
      'Ion Xe 20',
      'Element 2',
      'Gio',
      'Gio @5',
    ],
  },

  // ============================================================
  // MA LIGHTING - 1 module
  // ============================================================

  // --- malighting-grandma3 ---
  {
    id: 'companion-mod-malighting-grandma3',
    moduleId: 'malighting-grandma3',
    name: 'MA Lighting grandMA3',
    manufacturer: 'ma-lighting',
    protocol: 'TCP/Telnet',
    defaultPort: 30000,
    description:
      'Control MA Lighting grandMA3 consoles via Telnet. Supports executor and cue control, macro firing, fader management, page navigation, and key press emulation.',
    actions: [
      {
        id: 'go_cue',
        name: 'Go Cue',
        description: 'Fire a Go on a specific executor and cue',
        options: [
          {
            id: 'executor',
            type: 'number',
            label: 'Executor Number',
            default: 1,
          },
          {
            id: 'cue',
            type: 'textinput',
            label: 'Cue Number',
            default: '1',
          },
        ],
      },
      {
        id: 'goto_cue',
        name: 'Goto Cue',
        description: 'Jump directly to a specific cue on an executor without transition',
        options: [
          {
            id: 'executor',
            type: 'number',
            label: 'Executor Number',
            default: 1,
          },
          {
            id: 'cue',
            type: 'textinput',
            label: 'Cue Number',
            default: '1',
          },
        ],
      },
      {
        id: 'stop',
        name: 'Stop',
        description: 'Stop a running executor',
        options: [
          {
            id: 'executor',
            type: 'number',
            label: 'Executor Number',
            default: 1,
          },
        ],
      },
      {
        id: 'fire_macro',
        name: 'Fire Macro',
        description: 'Execute a macro by its number',
        options: [
          {
            id: 'macro',
            type: 'number',
            label: 'Macro Number',
            default: 1,
          },
        ],
      },
      {
        id: 'set_exec_fader',
        name: 'Set Executor Fader',
        description: 'Set the fader level of a specific executor',
        options: [
          {
            id: 'executor',
            type: 'number',
            label: 'Executor Number',
            default: 1,
          },
          {
            id: 'level',
            type: 'number',
            label: 'Level (0 - 100)',
            default: 100,
          },
        ],
      },
      {
        id: 'select_exec',
        name: 'Select Executor',
        description: 'Select an executor for further operations',
        options: [
          {
            id: 'executor',
            type: 'number',
            label: 'Executor Number',
            default: 1,
          },
        ],
      },
      {
        id: 'off',
        name: 'Off',
        description: 'Turn off an executor',
        options: [
          {
            id: 'executor',
            type: 'number',
            label: 'Executor Number',
            default: 1,
          },
        ],
      },
      {
        id: 'page_up',
        name: 'Page Up',
        description: 'Navigate to the next executor page',
        options: [],
      },
      {
        id: 'page_down',
        name: 'Page Down',
        description: 'Navigate to the previous executor page',
        options: [],
      },
      {
        id: 'set_master_intensity',
        name: 'Set Master Intensity',
        description: 'Set the master intensity value for the console',
        options: [
          {
            id: 'value',
            type: 'number',
            label: 'Intensity (0 - 100)',
            default: 100,
          },
        ],
      },
      {
        id: 'press_key',
        name: 'Press Key',
        description: 'Simulate a key press on the console',
        options: [
          {
            id: 'key',
            type: 'dropdown',
            label: 'Key',
            default: 'go',
            choices: [
              { id: 'go', label: 'Go' },
              { id: 'pause', label: 'Pause' },
              { id: 'goback', label: 'Go Back' },
              { id: 'oops', label: 'Oops' },
              { id: 'clear', label: 'Clear' },
              { id: 'esc', label: 'Esc' },
              { id: 'select', label: 'Select' },
              { id: 'store', label: 'Store' },
            ],
          },
        ],
      },
    ],
    feedbacks: [
      {
        id: 'executor_state',
        name: 'Executor State',
        description: 'Indicates the current state of an executor',
        type: 'advanced',
      },
      {
        id: 'cue_active',
        name: 'Cue Active',
        description: 'Indicates which cue is currently active on an executor',
        type: 'advanced',
      },
      {
        id: 'grandmaster_level',
        name: 'Grandmaster Level',
        description: 'Current grandmaster intensity level',
        type: 'advanced',
      },
    ],
    variables: [
      { id: 'current_cue', name: 'Current Cue' },
      { id: 'current_page', name: 'Current Page' },
      { id: 'executor_N_value', name: 'Executor N Value' },
      { id: 'show_name', name: 'Show Name' },
      { id: 'session_name', name: 'Session Name' },
      { id: 'command_line', name: 'Command Line Contents' },
    ],
    supportedModels: [
      'grandMA3 full-size',
      'grandMA3 light',
      'grandMA3 compact',
      'grandMA3 onPC',
      'grandMA3 processing unit XL',
      'grandMA3 processing unit L',
    ],
  },

  // ============================================================
  // QSC - 1 module
  // ============================================================

  // --- qsc-qsys ---
  {
    id: 'companion-mod-qsc-qsys',
    moduleId: 'qsc-qsys',
    name: 'QSC Q-SYS Core',
    manufacturer: 'qsc',
    protocol: 'TCP/QRC',
    defaultPort: 1710,
    description:
      'Control QSC Q-SYS audio and control processors via the QRC protocol. Supports named control manipulation, component property access, fader/mute management, and router selection.',
    actions: [
      {
        id: 'set_named_control',
        name: 'Set Named Control',
        description: 'Set the value of a named control in the Q-SYS design',
        options: [
          {
            id: 'name',
            type: 'textinput',
            label: 'Control Name',
            default: '',
          },
          {
            id: 'value',
            type: 'number',
            label: 'Value',
            default: 0,
          },
        ],
      },
      {
        id: 'set_named_control_position',
        name: 'Set Named Control Position',
        description: 'Set the position (0.0 - 1.0) of a named control',
        options: [
          {
            id: 'name',
            type: 'textinput',
            label: 'Control Name',
            default: '',
          },
          {
            id: 'position',
            type: 'number',
            label: 'Position (0.0 - 1.0)',
            default: 0,
          },
        ],
      },
      {
        id: 'trigger_control',
        name: 'Trigger Control',
        description: 'Trigger a named control (momentary action)',
        options: [
          {
            id: 'name',
            type: 'textinput',
            label: 'Control Name',
            default: '',
          },
        ],
      },
      {
        id: 'set_component_property',
        name: 'Set Component Property',
        description: 'Set a property value on a named component within the design',
        options: [
          {
            id: 'component',
            type: 'textinput',
            label: 'Component Name',
            default: '',
          },
          {
            id: 'property',
            type: 'textinput',
            label: 'Property Name',
            default: '',
          },
          {
            id: 'value',
            type: 'textinput',
            label: 'Value',
            default: '',
          },
        ],
      },
      {
        id: 'set_fader',
        name: 'Set Fader',
        description: 'Set the level of a fader control',
        options: [
          {
            id: 'name',
            type: 'textinput',
            label: 'Fader Control Name',
            default: '',
          },
          {
            id: 'level',
            type: 'number',
            label: 'Level (dB)',
            default: 0,
          },
        ],
      },
      {
        id: 'set_mute',
        name: 'Set Mute',
        description: 'Set the mute state of a control',
        options: [
          {
            id: 'name',
            type: 'textinput',
            label: 'Mute Control Name',
            default: '',
          },
          {
            id: 'state',
            type: 'checkbox',
            label: 'Muted',
            default: false,
          },
        ],
      },
      {
        id: 'set_router_select',
        name: 'Set Router Select',
        description: 'Set a crosspoint on a router component',
        options: [
          {
            id: 'router',
            type: 'textinput',
            label: 'Router Component Name',
            default: '',
          },
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
    ],
    feedbacks: [
      {
        id: 'named_control_value',
        name: 'Named Control Value',
        description: 'Feedback when a named control value changes',
        type: 'advanced',
      },
      {
        id: 'named_control_string',
        name: 'Named Control String',
        description: 'Feedback for the string representation of a named control',
        type: 'advanced',
      },
      {
        id: 'component_status',
        name: 'Component Status',
        description: 'Indicates the operational status of a design component',
        type: 'advanced',
      },
    ],
    variables: [
      { id: 'control_N_value', name: 'Control N Value' },
      { id: 'control_N_string', name: 'Control N String' },
      { id: 'control_N_position', name: 'Control N Position' },
      { id: 'design_name', name: 'Design Name' },
      { id: 'is_redundant', name: 'Is Redundant' },
      { id: 'is_emulator', name: 'Is Emulator' },
    ],
    supportedModels: ['Core 510i', 'Core 110f', 'Core Nano', 'Core 8 Flex'],
  },

  // ============================================================
  // CLEAR-COM - 2 modules
  // ============================================================

  // --- clearcom-eclipse ---
  {
    id: 'companion-mod-clearcom-eclipse',
    moduleId: 'clearcom-eclipse',
    name: 'Clear-Com Eclipse HX Digital Matrix',
    manufacturer: 'clear-com',
    protocol: 'TCP',
    defaultPort: 4001,
    description:
      'Control Clear-Com Eclipse HX digital matrix intercom systems. Supports crosspoint routing, group volume management, key activation, label assignment, and listen level control.',
    actions: [
      {
        id: 'set_crosspoint',
        name: 'Set Crosspoint',
        description: 'Enable or disable a crosspoint between source and destination ports',
        options: [
          {
            id: 'source',
            type: 'number',
            label: 'Source Port',
            default: 1,
          },
          {
            id: 'dest',
            type: 'number',
            label: 'Destination Port',
            default: 1,
          },
          {
            id: 'state',
            type: 'checkbox',
            label: 'Enable',
            default: true,
          },
        ],
      },
      {
        id: 'set_group_volume',
        name: 'Set Group Volume',
        description: 'Set the volume level for a port group',
        options: [
          {
            id: 'group',
            type: 'number',
            label: 'Group Number',
            default: 1,
          },
          {
            id: 'level',
            type: 'number',
            label: 'Level (0 - 100)',
            default: 100,
          },
        ],
      },
      {
        id: 'key_on',
        name: 'Key On',
        description: 'Activate a key on a specific port',
        options: [
          {
            id: 'port',
            type: 'number',
            label: 'Port Number',
            default: 1,
          },
          {
            id: 'key',
            type: 'number',
            label: 'Key Number',
            default: 1,
          },
        ],
      },
      {
        id: 'key_off',
        name: 'Key Off',
        description: 'Deactivate a key on a specific port',
        options: [
          {
            id: 'port',
            type: 'number',
            label: 'Port Number',
            default: 1,
          },
          {
            id: 'key',
            type: 'number',
            label: 'Key Number',
            default: 1,
          },
        ],
      },
      {
        id: 'all_call',
        name: 'All Call',
        description: 'Trigger an all-call announcement to all ports',
        options: [],
      },
      {
        id: 'set_label',
        name: 'Set Label',
        description: 'Set the display label for a port',
        options: [
          {
            id: 'port',
            type: 'number',
            label: 'Port Number',
            default: 1,
          },
          {
            id: 'text',
            type: 'textinput',
            label: 'Label Text',
            default: '',
          },
        ],
      },
      {
        id: 'set_listen_level',
        name: 'Set Listen Level',
        description: 'Set the listen level for a specific port',
        options: [
          {
            id: 'port',
            type: 'number',
            label: 'Port Number',
            default: 1,
          },
          {
            id: 'level',
            type: 'number',
            label: 'Level (0 - 100)',
            default: 100,
          },
        ],
      },
    ],
    feedbacks: [
      {
        id: 'crosspoint_state',
        name: 'Crosspoint State',
        description: 'Indicates whether a specific crosspoint is active',
        type: 'boolean',
      },
      {
        id: 'port_status',
        name: 'Port Status',
        description: 'Indicates the operational status of a matrix port',
        type: 'advanced',
      },
      {
        id: 'key_state',
        name: 'Key State',
        description: 'Indicates whether a specific key is active on a port',
        type: 'boolean',
      },
    ],
    variables: [
      { id: 'port_N_label', name: 'Port N Label' },
      { id: 'port_N_status', name: 'Port N Status' },
      { id: 'crosspoint_N_N', name: 'Crosspoint N-N State' },
      { id: 'system_name', name: 'System Name' },
      { id: 'total_ports', name: 'Total Ports' },
    ],
    supportedModels: ['Eclipse HX Omega', 'Eclipse HX Delta', 'Eclipse HX Median'],
  },

  // --- clearcom-freespeak ---
  {
    id: 'companion-mod-clearcom-freespeak',
    moduleId: 'clearcom-freespeak',
    name: 'Clear-Com FreeSpeak II/Edge',
    manufacturer: 'clear-com',
    protocol: 'TCP',
    defaultPort: 80,
    description:
      'Monitor and control Clear-Com FreeSpeak II and FreeSpeak Edge wireless intercom systems. Supports beltpack channel assignment, volume control, talk/listen state management, and beltpack identification.',
    actions: [
      {
        id: 'assign_channel',
        name: 'Assign Channel',
        description: 'Assign a channel to a beltpack',
        options: [
          {
            id: 'beltpack',
            type: 'number',
            label: 'Beltpack Number',
            default: 1,
          },
          {
            id: 'channel',
            type: 'number',
            label: 'Channel Number',
            default: 1,
          },
        ],
      },
      {
        id: 'set_volume',
        name: 'Set Volume',
        description: 'Set the volume level on a beltpack',
        options: [
          {
            id: 'beltpack',
            type: 'number',
            label: 'Beltpack Number',
            default: 1,
          },
          {
            id: 'level',
            type: 'number',
            label: 'Level (0 - 100)',
            default: 100,
          },
        ],
      },
      {
        id: 'set_talk',
        name: 'Set Talk',
        description: 'Enable or disable talk on a beltpack channel',
        options: [
          {
            id: 'beltpack',
            type: 'number',
            label: 'Beltpack Number',
            default: 1,
          },
          {
            id: 'channel',
            type: 'number',
            label: 'Channel Number',
            default: 1,
          },
          {
            id: 'state',
            type: 'checkbox',
            label: 'Talk Enabled',
            default: true,
          },
        ],
      },
      {
        id: 'set_listen',
        name: 'Set Listen',
        description: 'Enable or disable listen on a beltpack channel',
        options: [
          {
            id: 'beltpack',
            type: 'number',
            label: 'Beltpack Number',
            default: 1,
          },
          {
            id: 'channel',
            type: 'number',
            label: 'Channel Number',
            default: 1,
          },
          {
            id: 'state',
            type: 'checkbox',
            label: 'Listen Enabled',
            default: true,
          },
        ],
      },
      {
        id: 'identify_beltpack',
        name: 'Identify Beltpack',
        description: 'Flash the LED on a beltpack to physically identify it',
        options: [
          {
            id: 'beltpack',
            type: 'number',
            label: 'Beltpack Number',
            default: 1,
          },
        ],
      },
    ],
    feedbacks: [
      {
        id: 'beltpack_online',
        name: 'Beltpack Online',
        description: 'Indicates whether a beltpack is currently connected and online',
        type: 'boolean',
      },
      {
        id: 'battery_level',
        name: 'Battery Level',
        description: 'Current battery level of a beltpack',
        type: 'advanced',
      },
      {
        id: 'rf_quality',
        name: 'RF Quality',
        description: 'Current RF signal quality for a beltpack',
        type: 'advanced',
      },
    ],
    variables: [
      { id: 'bp_N_battery', name: 'Beltpack N Battery Level' },
      { id: 'bp_N_name', name: 'Beltpack N Name' },
      { id: 'bp_N_channel_A', name: 'Beltpack N Channel A' },
      { id: 'bp_N_channel_B', name: 'Beltpack N Channel B' },
      { id: 'bp_N_rf_quality', name: 'Beltpack N RF Quality' },
      { id: 'total_beltpacks_online', name: 'Total Beltpacks Online' },
    ],
    supportedModels: ['FreeSpeak II Base', 'FreeSpeak Edge Base'],
  },

  // ============================================================
  // RIEDEL - 2 modules
  // ============================================================

  // --- riedel-bolero ---
  {
    id: 'companion-mod-riedel-bolero',
    moduleId: 'riedel-bolero',
    name: 'Riedel Bolero Wireless Intercom',
    manufacturer: 'riedel',
    protocol: 'HTTP/REST',
    defaultPort: 80,
    description:
      'Monitor and control Riedel Bolero wireless intercom systems via REST API. Supports beltpack channel assignment, volume control, talk/call state management, identification, and label configuration.',
    actions: [
      {
        id: 'assign_channel',
        name: 'Assign Channel',
        description: 'Assign a channel to a Bolero beltpack',
        options: [
          {
            id: 'beltpack',
            type: 'number',
            label: 'Beltpack Number',
            default: 1,
          },
          {
            id: 'channel',
            type: 'number',
            label: 'Channel Number',
            default: 1,
          },
        ],
      },
      {
        id: 'set_volume',
        name: 'Set Volume',
        description: 'Set the volume level on a Bolero beltpack',
        options: [
          {
            id: 'beltpack',
            type: 'number',
            label: 'Beltpack Number',
            default: 1,
          },
          {
            id: 'level',
            type: 'number',
            label: 'Level (0 - 100)',
            default: 100,
          },
        ],
      },
      {
        id: 'set_talk',
        name: 'Set Talk',
        description: 'Enable or disable talk on a beltpack channel',
        options: [
          {
            id: 'beltpack',
            type: 'number',
            label: 'Beltpack Number',
            default: 1,
          },
          {
            id: 'channel',
            type: 'number',
            label: 'Channel Number',
            default: 1,
          },
          {
            id: 'state',
            type: 'checkbox',
            label: 'Talk Enabled',
            default: true,
          },
        ],
      },
      {
        id: 'set_call',
        name: 'Set Call',
        description: 'Enable or disable call signaling on a beltpack channel',
        options: [
          {
            id: 'beltpack',
            type: 'number',
            label: 'Beltpack Number',
            default: 1,
          },
          {
            id: 'channel',
            type: 'number',
            label: 'Channel Number',
            default: 1,
          },
          {
            id: 'state',
            type: 'checkbox',
            label: 'Call Enabled',
            default: true,
          },
        ],
      },
      {
        id: 'identify_beltpack',
        name: 'Identify Beltpack',
        description: 'Flash the LED on a Bolero beltpack to physically identify it',
        options: [
          {
            id: 'beltpack',
            type: 'number',
            label: 'Beltpack Number',
            default: 1,
          },
        ],
      },
      {
        id: 'set_beltpack_label',
        name: 'Set Beltpack Label',
        description: 'Set the display label on a Bolero beltpack',
        options: [
          {
            id: 'beltpack',
            type: 'number',
            label: 'Beltpack Number',
            default: 1,
          },
          {
            id: 'label',
            type: 'textinput',
            label: 'Label Text',
            default: '',
          },
        ],
      },
    ],
    feedbacks: [
      {
        id: 'beltpack_online',
        name: 'Beltpack Online',
        description: 'Indicates whether a Bolero beltpack is currently connected',
        type: 'boolean',
      },
      {
        id: 'battery_level',
        name: 'Battery Level',
        description: 'Current battery level of a Bolero beltpack',
        type: 'advanced',
      },
      {
        id: 'rf_quality',
        name: 'RF Quality',
        description: 'Current RF signal quality for a Bolero beltpack',
        type: 'advanced',
      },
      {
        id: 'talk_state',
        name: 'Talk State',
        description: 'Indicates whether talk is active on a beltpack channel',
        type: 'boolean',
      },
    ],
    variables: [
      { id: 'bp_N_battery', name: 'Beltpack N Battery Level' },
      { id: 'bp_N_name', name: 'Beltpack N Name' },
      { id: 'bp_N_channel_A', name: 'Beltpack N Channel A' },
      { id: 'bp_N_channel_B', name: 'Beltpack N Channel B' },
      { id: 'bp_N_rf_quality', name: 'Beltpack N RF Quality' },
      { id: 'antennas_online', name: 'Antennas Online' },
    ],
    supportedModels: ['Bolero Antenna', 'Bolero Beltpack'],
  },

  // --- riedel-artist ---
  {
    id: 'companion-mod-riedel-artist',
    moduleId: 'riedel-artist',
    name: 'Riedel Artist Digital Matrix',
    manufacturer: 'riedel',
    protocol: 'TCP/Ember+',
    defaultPort: 9000,
    description:
      'Control Riedel Artist digital matrix intercom systems via the Ember+ protocol. Supports crosspoint routing, conference management, label assignment, gain control, and GPIO pin management.',
    actions: [
      {
        id: 'set_crosspoint',
        name: 'Set Crosspoint',
        description: 'Enable or disable a crosspoint between source and destination ports',
        options: [
          {
            id: 'src',
            type: 'number',
            label: 'Source Port',
            default: 1,
          },
          {
            id: 'dst',
            type: 'number',
            label: 'Destination Port',
            default: 1,
          },
          {
            id: 'state',
            type: 'checkbox',
            label: 'Enable',
            default: true,
          },
        ],
      },
      {
        id: 'set_conference',
        name: 'Set Conference',
        description: 'Enable or disable a conference group',
        options: [
          {
            id: 'conf',
            type: 'number',
            label: 'Conference Number',
            default: 1,
          },
          {
            id: 'state',
            type: 'checkbox',
            label: 'Enable',
            default: true,
          },
        ],
      },
      {
        id: 'set_label',
        name: 'Set Label',
        description: 'Set the display label for a port',
        options: [
          {
            id: 'port',
            type: 'number',
            label: 'Port Number',
            default: 1,
          },
          {
            id: 'text',
            type: 'textinput',
            label: 'Label Text',
            default: '',
          },
        ],
      },
      {
        id: 'set_gain',
        name: 'Set Gain',
        description: 'Set the audio gain level for a port',
        options: [
          {
            id: 'port',
            type: 'number',
            label: 'Port Number',
            default: 1,
          },
          {
            id: 'value',
            type: 'number',
            label: 'Gain (dB)',
            default: 0,
          },
        ],
      },
      {
        id: 'gpio_set',
        name: 'GPIO Set',
        description: 'Set the state of a GPIO pin on a port',
        options: [
          {
            id: 'port',
            type: 'number',
            label: 'Port Number',
            default: 1,
          },
          {
            id: 'pin',
            type: 'number',
            label: 'Pin Number',
            default: 1,
          },
          {
            id: 'state',
            type: 'checkbox',
            label: 'Pin High',
            default: true,
          },
        ],
      },
    ],
    feedbacks: [
      {
        id: 'crosspoint_state',
        name: 'Crosspoint State',
        description: 'Indicates whether a specific crosspoint is active',
        type: 'boolean',
      },
      {
        id: 'port_online',
        name: 'Port Online',
        description: 'Indicates whether a specific port is online',
        type: 'boolean',
      },
      {
        id: 'conference_state',
        name: 'Conference State',
        description: 'Indicates whether a conference is currently active',
        type: 'boolean',
      },
    ],
    variables: [
      { id: 'port_N_label', name: 'Port N Label' },
      { id: 'port_N_status', name: 'Port N Status' },
      { id: 'crosspoint_N_N', name: 'Crosspoint N-N State' },
      { id: 'total_ports', name: 'Total Ports' },
      { id: 'frame_name', name: 'Frame Name' },
    ],
    supportedModels: ['Artist-128', 'Artist-64', 'Artist-32'],
  },

  // ============================================================
  // EXTRON - 1 module
  // ============================================================

  // --- extron-sis ---
  {
    id: 'companion-mod-extron-sis',
    moduleId: 'extron-sis',
    name: 'Extron SIS Control',
    manufacturer: 'extron',
    protocol: 'TCP/SIS',
    defaultPort: 23,
    description:
      'Control Extron devices via the SIS (Simple Instruction Set) protocol. Supports input/output routing, preset recall, volume and gain management, and mute control across Extron switchers and processors.',
    actions: [
      {
        id: 'set_route',
        name: 'Set Route',
        description: 'Route a specific input to an output',
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
        id: 'set_global_preset',
        name: 'Set Global Preset',
        description: 'Recall a global routing preset',
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
        id: 'set_volume',
        name: 'Set Volume',
        description: 'Set the volume level for a specific output',
        options: [
          {
            id: 'output',
            type: 'number',
            label: 'Output Number',
            default: 1,
          },
          {
            id: 'level',
            type: 'number',
            label: 'Level (0 - 100)',
            default: 100,
          },
        ],
      },
      {
        id: 'set_mute',
        name: 'Set Mute',
        description: 'Set the audio mute state for a specific output',
        options: [
          {
            id: 'output',
            type: 'number',
            label: 'Output Number',
            default: 1,
          },
          {
            id: 'state',
            type: 'checkbox',
            label: 'Muted',
            default: false,
          },
        ],
      },
      {
        id: 'set_input_gain',
        name: 'Set Input Gain',
        description: 'Set the audio input gain for a specific input',
        options: [
          {
            id: 'input',
            type: 'number',
            label: 'Input Number',
            default: 1,
          },
          {
            id: 'value',
            type: 'number',
            label: 'Gain (dB)',
            default: 0,
          },
        ],
      },
      {
        id: 'set_video_mute',
        name: 'Set Video Mute',
        description: 'Set the video mute (blank) state for a specific output',
        options: [
          {
            id: 'output',
            type: 'number',
            label: 'Output Number',
            default: 1,
          },
          {
            id: 'state',
            type: 'checkbox',
            label: 'Video Muted',
            default: false,
          },
        ],
      },
      {
        id: 'recall_preset',
        name: 'Recall Preset',
        description: 'Recall a stored routing preset by number',
        options: [
          {
            id: 'preset',
            type: 'number',
            label: 'Preset Number',
            default: 1,
          },
        ],
      },
    ],
    feedbacks: [
      {
        id: 'route_state',
        name: 'Route State',
        description: 'Indicates which input is currently routed to an output',
        type: 'advanced',
      },
      {
        id: 'mute_state',
        name: 'Mute State',
        description: 'Indicates whether an output is currently muted',
        type: 'boolean',
      },
      {
        id: 'signal_present',
        name: 'Signal Present',
        description: 'Indicates whether a valid signal is detected on an input',
        type: 'boolean',
      },
    ],
    variables: [
      { id: 'route_out_N', name: 'Output N Routed Input' },
      { id: 'input_N_signal', name: 'Input N Signal Present' },
      { id: 'output_N_volume', name: 'Output N Volume' },
      { id: 'output_N_mute', name: 'Output N Mute State' },
      { id: 'model_name', name: 'Model Name' },
      { id: 'firmware_version', name: 'Firmware Version' },
    ],
    supportedModels: [
      'DTP CrossPoint 108',
      'IN1808',
      'DXP HD 4K',
      'SMP 351',
      'DTP2 T 202',
    ],
  },

  // ============================================================
  // CRESTRON - 2 modules
  // ============================================================

  // --- crestron-cp4 ---
  {
    id: 'companion-mod-crestron-cp4',
    moduleId: 'crestron-cp4',
    name: 'Crestron Control Processor',
    manufacturer: 'crestron',
    protocol: 'CIP/TCP',
    defaultPort: 41794,
    description:
      'Interface with Crestron control processors via CIP (Crestron Internet Protocol). Supports digital, analog, and serial join communication for full integration with Crestron control programs.',
    actions: [
      {
        id: 'digital_join',
        name: 'Digital Join',
        description: 'Set a digital join to a specific state (high or low)',
        options: [
          {
            id: 'join',
            type: 'number',
            label: 'Join Number',
            default: 1,
          },
          {
            id: 'state',
            type: 'checkbox',
            label: 'State (High)',
            default: true,
          },
        ],
      },
      {
        id: 'analog_join',
        name: 'Analog Join',
        description: 'Set an analog join to a specific value (0 - 65535)',
        options: [
          {
            id: 'join',
            type: 'number',
            label: 'Join Number',
            default: 1,
          },
          {
            id: 'value',
            type: 'number',
            label: 'Value (0 - 65535)',
            default: 0,
          },
        ],
      },
      {
        id: 'serial_join',
        name: 'Serial Join',
        description: 'Send a string value to a serial join',
        options: [
          {
            id: 'join',
            type: 'number',
            label: 'Join Number',
            default: 1,
          },
          {
            id: 'string',
            type: 'textinput',
            label: 'String Value',
            default: '',
          },
        ],
      },
      {
        id: 'pulse_digital',
        name: 'Pulse Digital',
        description: 'Pulse a digital join high then low (momentary trigger)',
        options: [
          {
            id: 'join',
            type: 'number',
            label: 'Join Number',
            default: 1,
          },
        ],
      },
      {
        id: 'press_button',
        name: 'Press Button',
        description: 'Press and hold a digital join (set high)',
        options: [
          {
            id: 'join',
            type: 'number',
            label: 'Join Number',
            default: 1,
          },
        ],
      },
      {
        id: 'release_button',
        name: 'Release Button',
        description: 'Release a held digital join (set low)',
        options: [
          {
            id: 'join',
            type: 'number',
            label: 'Join Number',
            default: 1,
          },
        ],
      },
    ],
    feedbacks: [
      {
        id: 'digital_join_state',
        name: 'Digital Join State',
        description: 'Indicates the current state of a digital join',
        type: 'boolean',
      },
      {
        id: 'analog_join_value',
        name: 'Analog Join Value',
        description: 'Current value of an analog join',
        type: 'advanced',
      },
      {
        id: 'serial_join_string',
        name: 'Serial Join String',
        description: 'Current string value of a serial join',
        type: 'advanced',
      },
    ],
    variables: [
      { id: 'd_join_N', name: 'Digital Join N State' },
      { id: 'a_join_N', name: 'Analog Join N Value' },
      { id: 's_join_N', name: 'Serial Join N String' },
      { id: 'ip_address', name: 'IP Address' },
      { id: 'hostname', name: 'Hostname' },
      { id: 'firmware', name: 'Firmware Version' },
    ],
    supportedModels: ['CP4-R', 'CP4N', 'PRO4', 'AV4', 'MC4-R'],
  },

  // --- crestron-nvx ---
  {
    id: 'companion-mod-crestron-nvx',
    moduleId: 'crestron-nvx',
    name: 'Crestron DM NVX AV-over-IP',
    manufacturer: 'crestron',
    protocol: 'CIP/TCP',
    defaultPort: 41794,
    description:
      'Control Crestron DM NVX AV-over-IP endpoints. Supports stream routing, video and audio source selection, stream enable/disable, and multiview configuration for NVX encoder and decoder units.',
    actions: [
      {
        id: 'set_route',
        name: 'Set Route',
        description: 'Route a source stream to a destination endpoint',
        options: [
          {
            id: 'source',
            type: 'number',
            label: 'Source ID',
            default: 1,
          },
          {
            id: 'dest',
            type: 'number',
            label: 'Destination ID',
            default: 1,
          },
        ],
      },
      {
        id: 'set_video_source',
        name: 'Set Video Source',
        description: 'Select the video input source for the NVX endpoint',
        options: [
          {
            id: 'input',
            type: 'dropdown',
            label: 'Video Source',
            default: 'hdmi1',
            choices: [
              { id: 'hdmi1', label: 'HDMI 1' },
              { id: 'hdmi2', label: 'HDMI 2' },
              { id: 'dm', label: 'DM' },
              { id: 'stream', label: 'Stream' },
            ],
          },
        ],
      },
      {
        id: 'set_audio_source',
        name: 'Set Audio Source',
        description: 'Select the audio input source for the NVX endpoint',
        options: [
          {
            id: 'input',
            type: 'dropdown',
            label: 'Audio Source',
            default: 'hdmi',
            choices: [
              { id: 'hdmi', label: 'HDMI' },
              { id: 'analog', label: 'Analog' },
              { id: 'dante', label: 'Dante' },
              { id: 'stream', label: 'Stream' },
            ],
          },
        ],
      },
      {
        id: 'enable_stream',
        name: 'Enable Stream',
        description: 'Enable the AV-over-IP stream on the endpoint',
        options: [],
      },
      {
        id: 'disable_stream',
        name: 'Disable Stream',
        description: 'Disable the AV-over-IP stream on the endpoint',
        options: [],
      },
      {
        id: 'set_multiview_mode',
        name: 'Set Multiview Mode',
        description: 'Set the multiview display layout mode',
        options: [
          {
            id: 'mode',
            type: 'textinput',
            label: 'Multiview Mode',
            default: '',
          },
        ],
      },
    ],
    feedbacks: [
      {
        id: 'stream_active',
        name: 'Stream Active',
        description: 'Indicates whether the AV-over-IP stream is currently active',
        type: 'boolean',
      },
      {
        id: 'video_sync',
        name: 'Video Sync',
        description: 'Indicates whether a valid video sync signal is detected',
        type: 'boolean',
      },
      {
        id: 'hdcp_state',
        name: 'HDCP State',
        description: 'Indicates whether HDCP is currently active on the connection',
        type: 'boolean',
      },
      {
        id: 'device_online',
        name: 'Device Online',
        description: 'Indicates whether the NVX endpoint is online and reachable',
        type: 'boolean',
      },
    ],
    variables: [
      { id: 'input_resolution', name: 'Input Resolution' },
      { id: 'stream_status', name: 'Stream Status' },
      { id: 'device_name', name: 'Device Name' },
      { id: 'ip_address', name: 'IP Address' },
      { id: 'mac_address', name: 'MAC Address' },
      { id: 'firmware', name: 'Firmware Version' },
    ],
    supportedModels: ['DM-NVX-360', 'DM-NVX-D30', 'DM-NVX-E30'],
  },
];
