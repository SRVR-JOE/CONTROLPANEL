'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Circle,
  Plus,
  Wifi,
  WifiOff,
  ChevronUp,
  Trash2,
  RefreshCw,
  Settings,
} from 'lucide-react';
import TransportControls from '@/components/recording/TransportControls';
import DiskStatus from '@/components/recording/DiskStatus';
import ClipList from '@/components/recording/ClipList';

// ---------------------------------------------------------------------------
// Local types (mirrors the API response shapes)
// ---------------------------------------------------------------------------

type RecorderType = 'hyperdeck' | 'kipro' | 'generic';
type TransportState = 'recording' | 'stopped' | 'playing' | 'preview' | 'forward' | 'rewind' | 'unknown';
type TransportAction = 'record' | 'stop' | 'play' | 'ff' | 'rew';
type ConnectionStatus = 'connected' | 'connecting' | 'error' | 'disconnected';

interface SlotInfo {
  slotId: number;
  status: 'empty' | 'mounted' | 'recording' | 'busy';
  volumeName?: string;
  recordingTime?: number;
  totalSpace?: number;
  freeSpace?: number;
}

interface TransportStatus {
  status: TransportState;
  timecode: string;
  clipId?: number;
  clipName?: string;
  slotId?: number;
  speed?: number;
}

interface ClipInfo {
  clipId: number;
  name: string;
  duration: string;
  format?: string;
  resolution?: string;
  frameRate?: string;
  fileSize?: number;
  startTimecode?: string;
}

interface RecordingSettings {
  fileFormat?: string;
  inputSource?: string;
  filenamePrefix?: string;
  videoFormat?: string;
  audioInput?: string;
}

interface Recorder {
  id: string;
  name: string;
  ip: string;
  type: RecorderType;
  connectionStatus: ConnectionStatus;
  transport: TransportStatus;
  slots: SlotInfo[];
  clips: ClipInfo[];
  settings: RecordingSettings;
  deviceInfo?: { model?: string; firmware?: string; protocolVersion?: string };
  lastError?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TYPE_LABELS: Record<RecorderType, string> = {
  hyperdeck: 'HyperDeck',
  kipro:     'Ki Pro',
  generic:   'Generic',
};

const FILE_FORMATS: Record<RecorderType, string[]> = {
  hyperdeck: ['QuickTime', 'MXF OP-Atom', 'MXF OP-1a', 'DNxHD MXF', 'H.264', 'H.265'],
  kipro:     ['ProRes HQ', 'ProRes', 'ProRes LT', 'ProRes Proxy', 'DNxHD 220x', 'DNxHD 220', 'DNxHD 145'],
  generic:   ['ProRes HQ', 'ProRes', 'H.264', 'H.265', 'DNxHD'],
};

const INPUT_SOURCES: Record<RecorderType, string[]> = {
  hyperdeck: ['SDI', 'HDMI', 'Component', 'Composite'],
  kipro:     ['SDI 1', 'SDI 2', 'HDMI', 'Component', 'Composite'],
  generic:   ['SDI', 'HDMI', 'NDI', 'IP Stream'],
};

const POLL_INTERVAL_MS = 3000;

// ---------------------------------------------------------------------------
// API helper
// ---------------------------------------------------------------------------

async function recorderApi(
  ip: string,
  type: RecorderType,
  action: string,
  extra: Record<string, unknown> = {}
): Promise<Record<string, unknown>> {
  const res = await fetch('/api/recording', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ip, type, action, ...extra }),
  });
  if (!res.ok && res.status !== 502) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json() as Promise<Record<string, unknown>>;
}

function makeId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function defaultRecorder(partial: Partial<Recorder>): Recorder {
  return {
    id: makeId(),
    name: partial.name ?? 'New Recorder',
    ip: partial.ip ?? '',
    type: partial.type ?? 'hyperdeck',
    connectionStatus: 'disconnected',
    transport: { status: 'unknown', timecode: '00:00:00:00' },
    slots: [],
    clips: [],
    settings: {},
    ...partial,
  };
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function RecordingPage() {
  const [recorders, setRecorders] = useState<Recorder[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isTransportLoading, setIsTransportLoading] = useState(false);
  const [isClipsLoading, setIsClipsLoading] = useState(false);
  const [activeSlot, setActiveSlot] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Add form state
  const [addName, setAddName]   = useState('');
  const [addIp, setAddIp]       = useState('');
  const [addType, setAddType]   = useState<RecorderType>('hyperdeck');

  // Settings edit state (local draft, applied on submit)
  const [settingsDraft, setSettingsDraft] = useState<RecordingSettings>({});
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  const recordersRef = useRef<Recorder[]>([]);
  selectedIdRef.current = selectedId;
  recordersRef.current = recorders;

  const selected = recorders.find((r) => r.id === selectedId) ?? null;

  // ---------------------------------------------------------------------------
  // Polling — status refresh
  // ---------------------------------------------------------------------------

  const refreshStatus = useCallback(async (recorder: Recorder) => {
    try {
      const data = await recorderApi(recorder.ip, recorder.type, 'status');
      const success = data.success as boolean;
      if (!success) {
        setRecorders((prev) =>
          prev.map((r) =>
            r.id === recorder.id
              ? { ...r, connectionStatus: 'error', lastError: (data.error as string) ?? 'Status failed' }
              : r
          )
        );
        return;
      }

      const transport = data.transport as TransportStatus | undefined;
      const slots = (data.slots as SlotInfo[] | undefined) ?? [];

      setRecorders((prev) =>
        prev.map((r) =>
          r.id === recorder.id
            ? {
                ...r,
                connectionStatus: 'connected',
                lastError: undefined,
                transport: transport ?? r.transport,
                slots,
              }
            : r
        )
      );
    } catch {
      setRecorders((prev) =>
        prev.map((r) =>
          r.id === recorder.id
            ? { ...r, connectionStatus: 'error', lastError: 'Connection lost' }
            : r
        )
      );
    }
  }, []);

  // Start / stop polling when selected recorder changes
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);

    if (!selectedId) return;
    const rec = recorders.find((r) => r.id === selectedId);
    if (!rec || rec.connectionStatus === 'disconnected') return;

    // Immediate poll
    refreshStatus(rec);

    pollRef.current = setInterval(() => {
      const current = recordersRef.current.find((r) => r.id === selectedIdRef.current);
      if (current && current.connectionStatus !== 'disconnected') {
        refreshStatus(current);
      }
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  // ---------------------------------------------------------------------------
  // Connect
  // ---------------------------------------------------------------------------

  const connectRecorder = async (recorder: Recorder) => {
    setRecorders((prev) =>
      prev.map((r) => (r.id === recorder.id ? { ...r, connectionStatus: 'connecting' } : r))
    );

    try {
      const data = await recorderApi(recorder.ip, recorder.type, 'connect');
      if (data.success) {
        setRecorders((prev) =>
          prev.map((r) =>
            r.id === recorder.id
              ? {
                  ...r,
                  connectionStatus: 'connected',
                  deviceInfo: (data.deviceInfo as Recorder['deviceInfo']) ?? r.deviceInfo,
                  lastError: undefined,
                }
              : r
          )
        );
        // Immediately fetch status + clips
        await refreshStatus(recorder);
        fetchClips(recorder);
      } else {
        setRecorders((prev) =>
          prev.map((r) =>
            r.id === recorder.id
              ? {
                  ...r,
                  connectionStatus: 'error',
                  lastError: (data.error as string) ?? 'Connection failed',
                }
              : r
          )
        );
      }
    } catch (err) {
      setRecorders((prev) =>
        prev.map((r) =>
          r.id === recorder.id
            ? { ...r, connectionStatus: 'error', lastError: (err as Error).message }
            : r
        )
      );
    }
  };

  // ---------------------------------------------------------------------------
  // Transport
  // ---------------------------------------------------------------------------

  const sendTransport = async (action: TransportAction) => {
    if (!selected || selected.connectionStatus !== 'connected') return;
    setIsTransportLoading(true);
    try {
      await recorderApi(selected.ip, selected.type, 'transport', { transport: action });
      // Refresh status right away
      await refreshStatus(selected);
    } finally {
      setIsTransportLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Clips
  // ---------------------------------------------------------------------------

  const fetchClips = useCallback(async (recorder: Recorder) => {
    setIsClipsLoading(true);
    try {
      const data = await recorderApi(recorder.ip, recorder.type, 'clips', { slotId: activeSlot });
      const clips = (data.clips as ClipInfo[] | undefined) ?? [];
      setRecorders((prev) =>
        prev.map((r) => (r.id === recorder.id ? { ...r, clips } : r))
      );
    } finally {
      setIsClipsLoading(false);
    }
  }, [activeSlot]);

  const cueClip = async (clipId: number) => {
    if (!selected || selected.connectionStatus !== 'connected') return;
    // Send play command with clip targeting — HyperDeck: "goto: clip id: N" then "play"
    await recorderApi(selected.ip, selected.type, 'transport', { transport: 'play', clipId });
    await refreshStatus(selected);
  };

  // ---------------------------------------------------------------------------
  // Settings
  // ---------------------------------------------------------------------------

  const fetchSettings = async (recorder: Recorder) => {
    const data = await recorderApi(recorder.ip, recorder.type, 'settings');
    if (data.success && data.settings) {
      const settings = data.settings as RecordingSettings;
      setRecorders((prev) =>
        prev.map((r) => (r.id === recorder.id ? { ...r, settings } : r))
      );
      setSettingsDraft(settings);
    }
  };

  const saveSettings = async () => {
    if (!selected) return;
    setIsSavingSettings(true);
    try {
      await recorderApi(selected.ip, selected.type, 'set-settings', { settings: settingsDraft });
      setRecorders((prev) =>
        prev.map((r) =>
          r.id === selected.id ? { ...r, settings: settingsDraft } : r
        )
      );
    } finally {
      setIsSavingSettings(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Add recorder
  // ---------------------------------------------------------------------------

  const addRecorder = () => {
    if (!addIp.trim()) return;
    const rec = defaultRecorder({
      name: addName.trim() || `${TYPE_LABELS[addType]} ${addIp}`,
      ip: addIp.trim(),
      type: addType,
    });
    setRecorders((prev) => [...prev, rec]);
    setSelectedId(rec.id);
    setShowAddForm(false);
    setAddName('');
    setAddIp('');
    setAddType('hyperdeck');
    // Auto-connect
    setTimeout(() => connectRecorder(rec), 50);
  };

  const removeRecorder = (id: string) => {
    setRecorders((prev) => prev.filter((r) => r.id !== id));
    if (selectedId === id) setSelectedId(recorders.find((r) => r.id !== id)?.id ?? null);
  };

  // ---------------------------------------------------------------------------
  // Slot change — re-fetch clips
  // ---------------------------------------------------------------------------

  const handleSlotChange = (slotId: number) => {
    setActiveSlot(slotId);
    if (selected && selected.connectionStatus === 'connected') {
      fetchClips({ ...selected, slots: selected.slots });
    }
  };

  // When settings panel opens, fetch latest settings
  const handleToggleSettings = () => {
    const next = !showSettings;
    setShowSettings(next);
    if (next && selected && selected.connectionStatus === 'connected') {
      fetchSettings(selected);
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const isConnected = selected?.connectionStatus === 'connected';

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: '#0c0c14', color: '#e0e0e8' }}
    >
      {/* Page header */}
      <div
        className="border-b"
        style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(14,14,24,0.8)', backdropFilter: 'blur(12px)' }}
      >
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-9 h-9 rounded-lg"
              style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.25)' }}
            >
              <Circle className="w-5 h-5" style={{ color: '#ef4444' }} />
            </div>
            <div>
              <h1 className="text-base font-bold font-mono" style={{ color: '#f0f0f8' }}>
                Recording Control
              </h1>
              <p className="text-[11px] font-mono" style={{ color: '#6b7280' }}>
                Universal transport control for HyperDeck, Ki Pro, and recording devices
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono" style={{ color: '#4a4a5e' }}>
            {recorders.filter((r) => r.connectionStatus === 'connected').length} of {recorders.length} connected
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="max-w-[1600px] mx-auto px-6 py-6 flex gap-5" style={{ minHeight: 'calc(100vh - 80px)' }}>
        {/* ================================================================ */}
        {/* LEFT PANEL — Device list */}
        {/* ================================================================ */}
        <aside
          className="flex-shrink-0 flex flex-col gap-3"
          style={{ width: 280 }}
        >
          {/* Add recorder button */}
          <button
            onClick={() => setShowAddForm((v) => !v)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-mono font-medium transition-all duration-150 focus:outline-none"
            style={{
              background: showAddForm ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.3)',
              color: '#8b8fdf',
            }}
          >
            <Plus className="w-4 h-4" />
            Add Recorder
          </button>

          {/* Add form */}
          {showAddForm && (
            <div
              className="rounded-xl border p-4 space-y-3"
              style={{
                background: 'rgba(14,14,24,0.9)',
                borderColor: 'rgba(99,102,241,0.3)',
              }}
            >
              <p className="text-xs font-mono uppercase tracking-wider" style={{ color: '#6366f1' }}>
                New Recorder
              </p>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Name (optional)"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs font-mono focus:outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#e0e0e8',
                  }}
                />
                <input
                  type="text"
                  placeholder="IP Address *"
                  value={addIp}
                  onChange={(e) => setAddIp(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addRecorder()}
                  className="w-full px-3 py-2 rounded-lg text-xs font-mono focus:outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#e0e0e8',
                  }}
                />
                <select
                  value={addType}
                  onChange={(e) => setAddType(e.target.value as RecorderType)}
                  className="w-full px-3 py-2 rounded-lg text-xs font-mono focus:outline-none"
                  style={{
                    background: 'rgba(20,20,30,0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#e0e0e8',
                  }}
                >
                  <option value="hyperdeck">Blackmagic HyperDeck</option>
                  <option value="kipro">AJA Ki Pro</option>
                  <option value="generic">Generic</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={addRecorder}
                  disabled={!addIp.trim()}
                  className="flex-1 py-2 rounded-lg text-xs font-mono font-medium transition-colors focus:outline-none"
                  style={{
                    background: addIp.trim() ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${addIp.trim() ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.06)'}`,
                    color: addIp.trim() ? '#a5b4fc' : '#4a4a5e',
                    cursor: addIp.trim() ? 'pointer' : 'not-allowed',
                  }}
                >
                  Connect
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-2 rounded-lg text-xs font-mono transition-colors focus:outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    color: '#6b7280',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Recorder list */}
          {recorders.length === 0 ? (
            <div
              className="flex-1 flex flex-col items-center justify-center gap-3 rounded-xl border p-6 text-center"
              style={{
                background: 'rgba(14,14,24,0.4)',
                borderColor: 'rgba(255,255,255,0.04)',
                borderStyle: 'dashed',
              }}
            >
              <Circle className="w-8 h-8" style={{ color: '#2a2a3a' }} />
              <p className="text-xs font-mono" style={{ color: '#4a4a5e' }}>
                No recorders added.
              </p>
              <p className="text-[10px] font-mono" style={{ color: '#2a2a3a' }}>
                Click &ldquo;Add Recorder&rdquo; above to get started.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {recorders.map((rec) => (
                <RecorderListItem
                  key={rec.id}
                  recorder={rec}
                  isSelected={rec.id === selectedId}
                  onSelect={() => {
                    setSelectedId(rec.id);
                    setActiveSlot(1);
                  }}
                  onConnect={() => connectRecorder(rec)}
                  onRemove={() => removeRecorder(rec.id)}
                />
              ))}
            </div>
          )}
        </aside>

        {/* ================================================================ */}
        {/* CENTER + RIGHT — Transport + disk + clips */}
        {/* ================================================================ */}
        <main className="flex-1 flex flex-col gap-5 min-w-0">
          {!selected ? (
            /* Empty state */
            <div
              className="flex-1 flex flex-col items-center justify-center gap-4 rounded-xl border"
              style={{
                background: 'rgba(14,14,24,0.4)',
                borderColor: 'rgba(255,255,255,0.04)',
                borderStyle: 'dashed',
                minHeight: 400,
              }}
            >
              <Circle className="w-14 h-14" style={{ color: '#2a2a3a' }} />
              <div className="text-center">
                <p className="text-base font-mono font-semibold" style={{ color: '#3a3a4e' }}>
                  No recorder selected
                </p>
                <p className="text-xs font-mono mt-1" style={{ color: '#2a2a3a' }}>
                  Add a recorder from the panel on the left to begin
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Top row: transport + disk status */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Transport controls — center main panel */}
                <div
                  className="lg:col-span-2 rounded-xl border p-6 flex flex-col items-center gap-6"
                  style={{
                    background: 'rgba(14,14,24,0.7)',
                    borderColor: selected.connectionStatus === 'connected'
                      ? (selected.transport.status === 'recording'
                          ? 'rgba(239,68,68,0.3)'
                          : 'rgba(255,255,255,0.06)')
                      : 'rgba(255,255,255,0.04)',
                    backdropFilter: 'blur(12px)',
                    boxShadow: selected.transport.status === 'recording'
                      ? '0 0 40px rgba(239,68,68,0.08)'
                      : 'none',
                  }}
                >
                  {/* Device identity row */}
                  <div className="w-full flex items-center justify-between">
                    <div>
                      <p className="text-sm font-mono font-semibold" style={{ color: '#d0d0e0' }}>
                        {selected.name}
                      </p>
                      <p className="text-[10px] font-mono mt-0.5" style={{ color: '#4a4a5e' }}>
                        {TYPE_LABELS[selected.type]} &bull; {selected.ip}
                        {selected.deviceInfo?.model ? ` — ${selected.deviceInfo.model}` : ''}
                        {selected.deviceInfo?.firmware ? ` (fw ${selected.deviceInfo.firmware})` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {selected.connectionStatus !== 'connected' && (
                        <button
                          onClick={() => connectRecorder(selected)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors focus:outline-none"
                          style={{
                            background: 'rgba(99,102,241,0.15)',
                            border: '1px solid rgba(99,102,241,0.3)',
                            color: '#8b8fdf',
                            cursor: 'pointer',
                          }}
                        >
                          <RefreshCw className="w-3 h-3" />
                          {selected.connectionStatus === 'connecting' ? 'Connecting...' : 'Reconnect'}
                        </button>
                      )}
                      <button
                        onClick={handleToggleSettings}
                        className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors focus:outline-none"
                        style={{
                          background: showSettings ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${showSettings ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.08)'}`,
                          color: showSettings ? '#8b8fdf' : '#6b7280',
                          cursor: 'pointer',
                        }}
                        title="Device Settings"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Error banner */}
                  {selected.lastError && selected.connectionStatus === 'error' && (
                    <div
                      className="w-full px-3 py-2 rounded-lg text-xs font-mono"
                      style={{
                        background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.2)',
                        color: '#fca5a5',
                      }}
                    >
                      {selected.lastError}
                    </div>
                  )}

                  {/* Simulated badge */}
                  {selected.type === 'generic' && (
                    <div
                      className="px-2.5 py-1 rounded-lg text-[10px] font-mono uppercase tracking-wider"
                      style={{
                        background: 'rgba(245,158,11,0.1)',
                        border: '1px solid rgba(245,158,11,0.2)',
                        color: '#fcd34d',
                      }}
                    >
                      Simulated — Generic device
                    </div>
                  )}

                  {/* Transport controls */}
                  <TransportControls
                    transportState={isConnected ? selected.transport.status : 'unknown'}
                    timecode={selected.transport.timecode}
                    isConnected={isConnected}
                    isLoading={isTransportLoading}
                    onTransport={sendTransport}
                  />
                </div>

                {/* Disk status panel */}
                <div className="flex flex-col gap-3">
                  <DiskStatus
                    slots={selected.slots}
                    activeSlot={activeSlot}
                    onSelectSlot={handleSlotChange}
                    currentClipName={selected.transport.clipName}
                  />

                  {/* Fetch clips button */}
                  {isConnected && (
                    <button
                      onClick={() => fetchClips(selected)}
                      disabled={isClipsLoading}
                      className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-mono transition-all duration-150 focus:outline-none"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        color: '#6b7280',
                        cursor: isClipsLoading ? 'not-allowed' : 'pointer',
                        opacity: isClipsLoading ? 0.6 : 1,
                      }}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isClipsLoading ? 'animate-spin' : ''}`} />
                      {isClipsLoading ? 'Loading clips...' : 'Refresh clips'}
                    </button>
                  )}
                </div>
              </div>

              {/* Settings panel (collapsible) */}
              {showSettings && (
                <SettingsPanel
                  recorder={selected}
                  draft={settingsDraft}
                  isSaving={isSavingSettings}
                  onDraftChange={setSettingsDraft}
                  onSave={saveSettings}
                  onClose={() => setShowSettings(false)}
                />
              )}

              {/* Clip list */}
              <ClipList
                clips={selected.clips}
                isLoading={isClipsLoading}
                isConnected={isConnected}
                onCueClip={cueClip}
              />
            </>
          )}
        </main>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// RecorderListItem
// ---------------------------------------------------------------------------

interface RecorderListItemProps {
  recorder: Recorder;
  isSelected: boolean;
  onSelect: () => void;
  onConnect: () => void;
  onRemove: () => void;
}

function RecorderListItem({ recorder, isSelected, onSelect, onConnect, onRemove }: RecorderListItemProps) {
  const statusColors: Record<ConnectionStatus, string> = {
    connected:    '#22c55e',
    connecting:   '#f59e0b',
    error:        '#ef4444',
    disconnected: '#4a4a5e',
  };

  const transportStateColors: Record<TransportState, string> = {
    recording: '#ef4444',
    stopped:   '#6b7280',
    playing:   '#22c55e',
    preview:   '#f59e0b',
    forward:   '#3b82f6',
    rewind:    '#3b82f6',
    unknown:   '#4a4a5e',
  };

  const connColor = statusColors[recorder.connectionStatus];
  const isRecording = recorder.transport.status === 'recording';

  return (
    <div
      onClick={onSelect}
      className="group relative flex items-start gap-3 px-3 py-3 rounded-xl border transition-all duration-150 cursor-pointer"
      style={{
        background: isSelected
          ? 'rgba(99,102,241,0.1)'
          : 'rgba(14,14,24,0.6)',
        borderColor: isSelected
          ? 'rgba(99,102,241,0.4)'
          : isRecording
          ? 'rgba(239,68,68,0.3)'
          : 'rgba(255,255,255,0.06)',
        boxShadow: isRecording ? '0 0 12px rgba(239,68,68,0.08)' : 'none',
      }}
    >
      {/* Connection indicator */}
      <div className="flex-shrink-0 pt-0.5">
        <span
          className="inline-block w-2 h-2 rounded-full"
          style={{
            backgroundColor: connColor,
            boxShadow: recorder.connectionStatus === 'connected'
              ? `0 0 6px ${connColor}`
              : 'none',
            animation: recorder.connectionStatus === 'connecting'
              ? 'pulse 1s ease-in-out infinite'
              : isRecording
              ? 'pulse 0.8s ease-in-out infinite'
              : 'none',
          }}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-mono font-medium truncate" style={{ color: '#d0d0e0' }}>
          {recorder.name}
        </p>
        <p className="text-[10px] font-mono" style={{ color: '#4a4a5e' }}>
          {TYPE_LABELS[recorder.type]} &bull; {recorder.ip}
        </p>
        {recorder.connectionStatus === 'connected' && (
          <div className="flex items-center gap-1 mt-1">
            <span
              className="text-[9px] font-mono uppercase tracking-wider font-semibold"
              style={{ color: transportStateColors[recorder.transport.status] }}
            >
              {recorder.transport.status}
            </span>
            {recorder.transport.timecode !== '00:00:00:00' && (
              <span className="text-[9px] font-mono" style={{ color: '#4a4a5e' }}>
                &bull; {recorder.transport.timecode}
              </span>
            )}
          </div>
        )}
        {recorder.connectionStatus === 'error' && recorder.lastError && (
          <p className="text-[10px] font-mono mt-0.5 truncate" style={{ color: '#ef4444' }}>
            {recorder.lastError}
          </p>
        )}
      </div>

      {/* Actions */}
      <div
        className="flex-shrink-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {recorder.connectionStatus !== 'connected' && recorder.connectionStatus !== 'connecting' && (
          <button
            onClick={onConnect}
            className="flex items-center justify-center w-6 h-6 rounded transition-colors focus:outline-none"
            style={{
              background: 'rgba(34,197,94,0.15)',
              border: '1px solid rgba(34,197,94,0.3)',
              color: '#22c55e',
              cursor: 'pointer',
            }}
            title="Connect"
          >
            <Wifi className="w-3 h-3" />
          </button>
        )}
        {recorder.connectionStatus === 'connected' && (
          <button
            onClick={() => {
              /* disconnect = just mark disconnected, stop polling */
              /* We don't have a disconnect API command so just update state */
            }}
            className="flex items-center justify-center w-6 h-6 rounded transition-colors focus:outline-none"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#6b7280',
              cursor: 'pointer',
            }}
            title="Connected"
          >
            <WifiOff className="w-3 h-3" />
          </button>
        )}
        <button
          onClick={onRemove}
          className="flex items-center justify-center w-6 h-6 rounded transition-colors focus:outline-none"
          style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.2)',
            color: '#ef4444',
            cursor: 'pointer',
          }}
          title="Remove"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SettingsPanel
// ---------------------------------------------------------------------------

interface SettingsPanelProps {
  recorder: Recorder;
  draft: RecordingSettings;
  isSaving: boolean;
  onDraftChange: (s: RecordingSettings) => void;
  onSave: () => void;
  onClose: () => void;
}

function SettingsPanel({ recorder, draft, isSaving, onDraftChange, onSave, onClose }: SettingsPanelProps) {
  const formats = FILE_FORMATS[recorder.type];
  const sources = INPUT_SOURCES[recorder.type];

  return (
    <div
      className="rounded-xl border p-5 space-y-4"
      style={{
        background: 'rgba(14,14,24,0.8)',
        borderColor: 'rgba(99,102,241,0.2)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4" style={{ color: '#6366f1' }} />
          <span className="text-xs font-mono uppercase tracking-[0.2em]" style={{ color: '#7a7a8e' }}>
            Device Settings
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors focus:outline-none"
            style={{
              background: isSaving ? 'rgba(255,255,255,0.04)' : 'rgba(99,102,241,0.2)',
              border: '1px solid rgba(99,102,241,0.4)',
              color: '#a5b4fc',
              cursor: isSaving ? 'not-allowed' : 'pointer',
            }}
          >
            {isSaving ? 'Saving...' : 'Apply'}
          </button>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors focus:outline-none"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#6b7280',
              cursor: 'pointer',
            }}
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* File format */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono uppercase tracking-wider" style={{ color: '#6b7280' }}>
            File Format
          </label>
          <select
            value={draft.fileFormat ?? ''}
            onChange={(e) => onDraftChange({ ...draft, fileFormat: e.target.value || undefined })}
            className="w-full px-3 py-2 rounded-lg text-xs font-mono focus:outline-none"
            style={{
              background: 'rgba(20,20,30,0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#e0e0e8',
            }}
          >
            <option value="">-- Select --</option>
            {formats.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>

        {/* Input source */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono uppercase tracking-wider" style={{ color: '#6b7280' }}>
            Input Source
          </label>
          <select
            value={draft.inputSource ?? ''}
            onChange={(e) => onDraftChange({ ...draft, inputSource: e.target.value || undefined })}
            className="w-full px-3 py-2 rounded-lg text-xs font-mono focus:outline-none"
            style={{
              background: 'rgba(20,20,30,0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#e0e0e8',
            }}
          >
            <option value="">-- Select --</option>
            {sources.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Filename prefix */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono uppercase tracking-wider" style={{ color: '#6b7280' }}>
            Filename Prefix
          </label>
          <input
            type="text"
            value={draft.filenamePrefix ?? ''}
            onChange={(e) => onDraftChange({ ...draft, filenamePrefix: e.target.value || undefined })}
            placeholder="e.g. Show_A_"
            className="w-full px-3 py-2 rounded-lg text-xs font-mono focus:outline-none"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#e0e0e8',
            }}
          />
        </div>
      </div>

      {/* Current values read from device */}
      {Object.keys(recorder.settings).length > 0 && (
        <div className="flex flex-wrap gap-3 pt-1">
          {recorder.settings.fileFormat && (
            <DeviceBadge label="Current Format" value={recorder.settings.fileFormat} />
          )}
          {recorder.settings.inputSource && (
            <DeviceBadge label="Current Input" value={recorder.settings.inputSource} />
          )}
          {recorder.settings.filenamePrefix && (
            <DeviceBadge label="Current Prefix" value={recorder.settings.filenamePrefix} />
          )}
          {recorder.settings.videoFormat && (
            <DeviceBadge label="Video Format" value={recorder.settings.videoFormat} />
          )}
          {recorder.settings.audioInput && (
            <DeviceBadge label="Audio Input" value={recorder.settings.audioInput} />
          )}
        </div>
      )}
    </div>
  );
}

function DeviceBadge({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <span className="text-[9px] font-mono uppercase tracking-wider" style={{ color: '#4a4a5e' }}>
        {label}:
      </span>
      <span className="text-[10px] font-mono" style={{ color: '#9ca3af' }}>
        {value}
      </span>
    </div>
  );
}

