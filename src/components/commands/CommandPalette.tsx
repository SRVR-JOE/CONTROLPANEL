'use client';

import { useState } from 'react';
import {
  Send,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sliders,
  Settings,
  Stethoscope,
  Terminal,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { commandRegistry } from '@/lib/commands/registry';
import type { CommandDefinition } from '@/types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CommandPaletteProps {
  deviceId: string;
  manufacturer: string;
  deviceName: string;
  onSendCommand: (deviceId: string, command: string, params?: Record<string, unknown>) => void;
}

// ---------------------------------------------------------------------------
// Category config
// ---------------------------------------------------------------------------

const CATEGORY_CONFIG = {
  control: {
    label: 'Control',
    icon: Sliders,
    color: '#3b82f6',
    borderColor: 'border-blue-500/30',
    headerBg: 'bg-blue-500/10',
    activeBg: 'bg-blue-600',
    hoverBg: 'hover:bg-blue-600/20',
    textColor: 'text-blue-400',
  },
  config: {
    label: 'Configuration',
    icon: Settings,
    color: '#8b5cf6',
    borderColor: 'border-purple-500/30',
    headerBg: 'bg-purple-500/10',
    activeBg: 'bg-purple-600',
    hoverBg: 'hover:bg-purple-600/20',
    textColor: 'text-purple-400',
  },
  diagnostic: {
    label: 'Diagnostic',
    icon: Stethoscope,
    color: '#f59e0b',
    borderColor: 'border-amber-500/30',
    headerBg: 'bg-amber-500/10',
    activeBg: 'bg-amber-600',
    hoverBg: 'hover:bg-amber-600/20',
    textColor: 'text-amber-400',
  },
} as const;

// ---------------------------------------------------------------------------
// Individual param input — renders number, string (free text or select), boolean
// ---------------------------------------------------------------------------

interface ParamInputProps {
  paramKey: string;
  schema: NonNullable<CommandDefinition['params']>[string];
  value: unknown;
  onChange: (key: string, value: unknown) => void;
}

function ParamInput({ paramKey, schema, value, onChange }: ParamInputProps) {
  if (schema.type === 'boolean') {
    return (
      <div className="flex items-center justify-between">
        <label className="text-xs text-gray-400">{schema.label}</label>
        <button
          type="button"
          onClick={() => onChange(paramKey, !value)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            value ? 'bg-blue-600' : 'bg-[#2a2a3d]'
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
              value ? 'translate-x-[18px]' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    );
  }

  if (schema.type === 'number') {
    return (
      <div>
        <label className="text-xs text-gray-400 block mb-1">{schema.label}</label>
        <input
          type="number"
          min={schema.min}
          max={schema.max}
          value={value === undefined ? '' : String(value)}
          onChange={(e) => {
            const num = e.target.value === '' ? undefined : Number(e.target.value);
            onChange(paramKey, num);
          }}
          placeholder={
            schema.min !== undefined && schema.max !== undefined
              ? `${schema.min} – ${schema.max}`
              : schema.min !== undefined
              ? `min ${schema.min}`
              : ''
          }
          className="w-full bg-[#0c0c14] border border-[#2a2a3d] rounded px-3 py-1.5 text-sm font-mono focus:outline-none focus:border-blue-500 text-white"
        />
      </div>
    );
  }

  // string — either a free text input or a select if options are provided
  if (schema.options && schema.options.length > 0) {
    return (
      <div>
        <label className="text-xs text-gray-400 block mb-1">{schema.label}</label>
        <select
          value={value === undefined ? '' : String(value)}
          onChange={(e) => onChange(paramKey, e.target.value)}
          className="w-full bg-[#0c0c14] border border-[#2a2a3d] rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 text-white"
        >
          <option value="" disabled>Select {schema.label}…</option>
          {schema.options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div>
      <label className="text-xs text-gray-400 block mb-1">{schema.label}</label>
      <input
        type="text"
        value={value === undefined ? '' : String(value)}
        onChange={(e) => onChange(paramKey, e.target.value === '' ? undefined : e.target.value)}
        placeholder={schema.label}
        className="w-full bg-[#0c0c14] border border-[#2a2a3d] rounded px-3 py-1.5 text-sm font-mono focus:outline-none focus:border-blue-500 text-white"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single command card
// ---------------------------------------------------------------------------

interface CommandCardProps {
  cmd: CommandDefinition;
  category: keyof typeof CATEGORY_CONFIG;
  onExecute: (cmd: CommandDefinition, params: Record<string, unknown>) => void;
  isExecuting: boolean;
}

function CommandCard({ cmd, category, onExecute, isExecuting }: CommandCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [params, setParams] = useState<Record<string, unknown>>(() => {
    // Pre-populate boolean params to false, others to undefined
    const defaults: Record<string, unknown> = {};
    if (cmd.params) {
      for (const [key, schema] of Object.entries(cmd.params)) {
        defaults[key] = schema.type === 'boolean' ? false : undefined;
      }
    }
    return defaults;
  });
  const [pendingConfirm, setPendingConfirm] = useState(false);

  const cfg = CATEGORY_CONFIG[category];
  const hasParams = cmd.params && Object.keys(cmd.params).length > 0;

  const handleParamChange = (key: string, value: unknown) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleExecuteClick = () => {
    if (cmd.confirmRequired && !pendingConfirm) {
      setPendingConfirm(true);
      return;
    }
    setPendingConfirm(false);
    onExecute(cmd, params);
  };

  const handleCancelConfirm = () => setPendingConfirm(false);

  return (
    <div className={`bg-[#14141f] rounded-lg border ${cfg.borderColor} overflow-hidden`}>
      {/* Command header row */}
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white truncate">{cmd.label}</span>
            {cmd.confirmRequired && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-900/40 text-amber-400 shrink-0">
                confirm
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 truncate mt-0.5">{cmd.description}</p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Expand/collapse button if there are params */}
          {hasParams && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="p-1.5 rounded hover:bg-[#2a2a3d] text-gray-400 hover:text-white transition"
              title={expanded ? 'Hide parameters' : 'Set parameters'}
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}

          {/* Execute / confirm button */}
          {pendingConfirm ? (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-amber-400">Sure?</span>
              <button
                type="button"
                onClick={handleExecuteClick}
                className="px-2 py-1 rounded bg-amber-600 hover:bg-amber-500 text-xs text-white font-medium transition"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={handleCancelConfirm}
                className="px-2 py-1 rounded bg-[#2a2a3d] hover:bg-[#3a3a4d] text-xs text-gray-300 transition"
              >
                No
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                // If there are params and the panel is not expanded, expand first
                if (hasParams && !expanded) {
                  setExpanded(true);
                } else {
                  handleExecuteClick();
                }
              }}
              disabled={isExecuting}
              className={`px-3 py-1.5 rounded text-xs font-medium transition flex items-center gap-1.5 ${
                isExecuting
                  ? 'bg-[#2a2a3d] text-gray-500 cursor-not-allowed'
                  : `${cfg.activeBg} hover:opacity-90 text-white`
              }`}
            >
              <Send size={11} />
              {hasParams && !expanded ? 'Open' : 'Run'}
            </button>
          )}
        </div>
      </div>

      {/* Param form */}
      {expanded && hasParams && (
        <div className="px-3 pb-3 pt-1 border-t border-[#1c1c2b] space-y-3">
          {Object.entries(cmd.params!).map(([key, schema]) => (
            <ParamInput
              key={key}
              paramKey={key}
              schema={schema}
              value={params[key]}
              onChange={handleParamChange}
            />
          ))}
          {!pendingConfirm && (
            <button
              type="button"
              onClick={handleExecuteClick}
              disabled={isExecuting}
              className={`w-full py-1.5 rounded text-xs font-medium transition flex items-center justify-center gap-2 ${
                isExecuting
                  ? 'bg-[#2a2a3d] text-gray-500 cursor-not-allowed'
                  : `${cfg.activeBg} hover:opacity-90 text-white`
              }`}
            >
              <Send size={12} />
              Execute {cmd.label}
            </button>
          )}
          {pendingConfirm && (
            <div className="flex items-center gap-2 p-2 rounded bg-amber-900/20 border border-amber-500/30">
              <AlertTriangle size={14} className="text-amber-400 shrink-0" />
              <span className="text-xs text-amber-300 flex-1">
                This action requires confirmation. Are you sure?
              </span>
              <button
                type="button"
                onClick={handleExecuteClick}
                className="px-2 py-1 rounded bg-amber-600 hover:bg-amber-500 text-xs text-white font-medium transition"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={handleCancelConfirm}
                className="px-2 py-1 rounded bg-[#2a2a3d] hover:bg-[#3a3a4d] text-xs text-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Custom command fallback
// ---------------------------------------------------------------------------

interface CustomCommandProps {
  deviceId: string;
  deviceName: string;
  onSendCommand: (deviceId: string, command: string) => void;
}

function CustomCommandInput({ deviceId, deviceName, onSendCommand }: CustomCommandProps) {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    onSendCommand(deviceId, input.trim());
    setInput('');
  };

  return (
    <div className="bg-[#14141f] rounded-lg border border-[#2a2a3d] p-3">
      <div className="flex items-center gap-2 mb-2">
        <Terminal size={14} className="text-gray-500" />
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Custom Command</span>
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={`Send raw command to ${deviceName}…`}
          className="flex-1 bg-[#0c0c14] border border-[#2a2a3d] rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-500 text-white placeholder-gray-600"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!input.trim()}
          className="px-3 py-2 bg-[#2a2a3d] hover:bg-[#3a3a4d] disabled:opacity-40 disabled:cursor-not-allowed rounded text-xs font-medium text-gray-300 transition flex items-center gap-1.5"
        >
          <Send size={12} /> Send
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Last execution feedback banner
// ---------------------------------------------------------------------------

interface FeedbackBannerProps {
  success: boolean;
  message: string;
  commandLabel: string;
}

function FeedbackBanner({ success, message, commandLabel }: FeedbackBannerProps) {
  return (
    <div
      className={`flex items-start gap-2 p-3 rounded-lg border text-sm ${
        success
          ? 'bg-green-900/20 border-green-500/30 text-green-300'
          : 'bg-red-900/20 border-red-500/30 text-red-300'
      }`}
    >
      {success ? (
        <CheckCircle size={14} className="shrink-0 mt-0.5 text-green-400" />
      ) : (
        <XCircle size={14} className="shrink-0 mt-0.5 text-red-400" />
      )}
      <div className="min-w-0">
        <span className="font-medium">{commandLabel}:</span>{' '}
        <span className="font-mono text-xs break-all">{message}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main CommandPalette
// ---------------------------------------------------------------------------

export default function CommandPalette({
  deviceId,
  manufacturer,
  deviceName,
  onSendCommand,
}: CommandPaletteProps) {
  const [executingCommand, setExecutingCommand] = useState<string | null>(null);
  const [lastFeedback, setLastFeedback] = useState<{
    success: boolean;
    message: string;
    commandLabel: string;
  } | null>(null);

  const commands = commandRegistry[manufacturer] ?? [];

  const grouped = {
    control: commands.filter((c) => c.category === 'control'),
    config: commands.filter((c) => c.category === 'config'),
    diagnostic: commands.filter((c) => c.category === 'diagnostic'),
  } as const;

  const handleExecute = (cmd: CommandDefinition, params: Record<string, unknown>) => {
    // Strip undefined values from params before sending
    const cleanParams: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) cleanParams[key] = value;
    }

    setExecutingCommand(cmd.type);
    setLastFeedback(null);

    // Call the store action — the feedback will come back via commandHistory,
    // but we also surface immediate UI feedback here by resolving after a brief
    // delay to allow the store's fetch to complete. We poll via a small delay
    // since we don't have access to the fetch promise directly from here.
    onSendCommand(deviceId, cmd.type, Object.keys(cleanParams).length > 0 ? cleanParams : undefined);

    // Give the network call time to complete, then clear the executing state.
    // The commandHistory list (rendered below the palette) shows the real result.
    const timeout = setTimeout(() => {
      setExecutingCommand(null);
    }, 3500);

    return () => clearTimeout(timeout);
  };

  const hasNoCommands = commands.length === 0;

  return (
    <div className="space-y-4">
      {/* No commands known for this manufacturer */}
      {hasNoCommands && (
        <div className="bg-[#14141f] rounded-lg border border-[#2a2a3d] p-5 text-center">
          <Terminal size={24} className="mx-auto mb-2 text-gray-600" />
          <p className="text-sm text-gray-500">
            No structured commands are defined for{' '}
            <span className="text-gray-300 capitalize">{manufacturer}</span> devices.
          </p>
          <p className="text-xs text-gray-600 mt-1">Use the custom command input below.</p>
        </div>
      )}

      {/* Category groups */}
      {(Object.entries(grouped) as [keyof typeof CATEGORY_CONFIG, CommandDefinition[]][]).map(
        ([category, cmds]) => {
          if (cmds.length === 0) return null;
          const cfg = CATEGORY_CONFIG[category];
          const Icon = cfg.icon;

          return (
            <div key={category} className="rounded-lg border border-[#2a2a3d] overflow-hidden">
              {/* Category header */}
              <div className={`flex items-center gap-2 px-3 py-2 ${cfg.headerBg} border-b border-[#2a2a3d]`}>
                <Icon size={14} style={{ color: cfg.color }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: cfg.color }}>
                  {cfg.label}
                </span>
                <span className="ml-auto text-[10px] text-gray-500">{cmds.length} command{cmds.length !== 1 ? 's' : ''}</span>
              </div>

              {/* Commands list */}
              <div className="bg-[#0f0f1a] divide-y divide-[#1c1c2b]">
                {cmds.map((cmd) => (
                  <CommandCard
                    key={cmd.type}
                    cmd={cmd}
                    category={category}
                    onExecute={handleExecute}
                    isExecuting={executingCommand === cmd.type}
                  />
                ))}
              </div>
            </div>
          );
        }
      )}

      {/* Feedback from last execution */}
      {lastFeedback && (
        <FeedbackBanner
          success={lastFeedback.success}
          message={lastFeedback.message}
          commandLabel={lastFeedback.commandLabel}
        />
      )}

      {/* Custom command fallback — always shown at bottom */}
      <CustomCommandInput
        deviceId={deviceId}
        deviceName={deviceName}
        onSendCommand={onSendCommand}
      />
    </div>
  );
}
