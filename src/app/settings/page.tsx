'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useStore } from '@/store';
import { Settings, Plus, Trash2, Server, AlertTriangle, Bell, Mail, MessageSquare, Smartphone, Send, ToggleLeft, ToggleRight } from 'lucide-react';
import InteractiveRackEditor from '@/components/rack/dnd/InteractiveRackEditor';
import type { RackWidth, EventSettings, NotificationChannelConfig, EventType, EventSeverity, NotificationChannel } from '@/types';

// ============================================================
// Settings Page
// ============================================================

export default function SettingsPage() {
  const racks = useStore((s) => s.racks);
  const addRack = useStore((s) => s.addRack);
  const removeRack = useStore((s) => s.removeRack);
  const updateRack = useStore((s) => s.updateRack);
  const devices = useStore((s) => s.devices);

  const [selectedRackId, setSelectedRackId] = useState<string | null>(racks[0]?.id ?? null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Add rack form state
  const [newName, setNewName] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newWidth, setNewWidth] = useState<RackWidth>(1);
  const [newTotalRU, setNewTotalRU] = useState(26);

  const selectedRack = useMemo(
    () => racks.find((r) => r.id === selectedRackId),
    [racks, selectedRackId]
  );

  const devicesInSelectedRack = useMemo(
    () => (selectedRack ? devices.filter((d) => d.rackId === selectedRack.id) : []),
    [devices, selectedRack]
  );

  const handleAddRack = () => {
    if (!newName.trim()) return;
    const id = addRack({
      name: newName.trim(),
      location: newLocation.trim(),
      width: newWidth,
      totalRU: newTotalRU,
    });
    setSelectedRackId(id);
    setShowAddForm(false);
    setNewName('');
    setNewLocation('');
    setNewWidth(1);
    setNewTotalRU(26);
  };

  const handleRemoveRack = (rackId: string) => {
    removeRack(rackId);
    setConfirmDeleteId(null);
    if (selectedRackId === rackId) {
      setSelectedRackId(racks.find((r) => r.id !== rackId)?.id ?? null);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Page header */}
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <Settings size={20} style={{ color: 'var(--accent)' }} />
          <h1
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: 'var(--foreground)',
              margin: 0,
            }}
          >
            Settings
          </h1>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Rack Configuration Section */}
        <section>
          <h2
            className="font-mono"
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '12px',
            }}
          >
            Rack Configuration
          </h2>

          {/* Rack card list */}
          <div className="flex gap-3 flex-wrap mb-6">
            {racks.map((rack) => (
              <button
                key={rack.id}
                onClick={() => {
                  setSelectedRackId(rack.id);
                  setShowAddForm(false);
                }}
                className="glass-card"
                style={{
                  padding: '12px 16px',
                  minWidth: '160px',
                  cursor: 'pointer',
                  border: selectedRackId === rack.id
                    ? '1px solid var(--accent)'
                    : '1px solid var(--border)',
                  textAlign: 'left',
                  transition: 'border-color 0.15s ease',
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Server size={14} style={{ color: 'var(--accent)' }} />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)' }}>
                    {rack.name}
                  </span>
                </div>
                <div className="font-mono" style={{ fontSize: '10px', color: 'var(--muted)' }}>
                  {rack.width}-Wide &middot; {rack.totalRU}U &middot; {rack.location}
                </div>
              </button>
            ))}

            {/* Add Rack button */}
            <button
              onClick={() => {
                setShowAddForm(true);
                setSelectedRackId(null);
              }}
              className="glass-card flex items-center justify-center gap-2"
              style={{
                padding: '12px 16px',
                minWidth: '120px',
                cursor: 'pointer',
                border: showAddForm
                  ? '1px solid var(--accent)'
                  : '1px dashed var(--border)',
                color: 'var(--muted)',
                fontSize: '12px',
                fontWeight: 600,
                transition: 'border-color 0.15s ease, color 0.15s ease',
              }}
            >
              <Plus size={14} />
              Add Rack
            </button>
          </div>

          {/* Add Rack Form */}
          {showAddForm && (
            <div className="glass-card p-5 mb-6" style={{ maxWidth: '500px' }}>
              <h3
                style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: 'var(--foreground)',
                  marginBottom: '16px',
                }}
              >
                New Rack
              </h3>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-mono" style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Name
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Rack D"
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      color: 'var(--foreground)',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-mono" style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Location
                  </label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="e.g. Backstage"
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      color: 'var(--foreground)',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>
                <div className="flex gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="font-mono" style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Width
                    </label>
                    <div className="flex gap-1">
                      {([1, 2, 3] as RackWidth[]).map((w) => (
                        <button
                          key={w}
                          onClick={() => setNewWidth(w)}
                          style={{
                            padding: '6px 14px',
                            fontSize: '12px',
                            fontWeight: 600,
                            borderRadius: '6px',
                            border: '1px solid var(--border)',
                            background: newWidth === w ? 'var(--accent)' : 'var(--surface)',
                            color: newWidth === w ? '#fff' : 'var(--muted)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {w}W
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-mono" style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      RU per Bay
                    </label>
                    <input
                      type="number"
                      min={4}
                      max={48}
                      value={newTotalRU}
                      onChange={(e) => setNewTotalRU(Number(e.target.value))}
                      style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        color: 'var(--foreground)',
                        fontSize: '13px',
                        outline: 'none',
                        width: '80px',
                      }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={handleAddRack}
                    disabled={!newName.trim()}
                    style={{
                      background: !newName.trim() ? 'var(--surface-2)' : 'var(--accent)',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 20px',
                      color: !newName.trim() ? 'var(--muted)' : '#fff',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: !newName.trim() ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Create
                  </button>
                  <button
                    onClick={() => setShowAddForm(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '8px 16px',
                      color: 'var(--muted)',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Selected Rack Editor */}
          {selectedRack && (
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Editor form */}
              <div className="glass-card p-5 flex-1" style={{ maxWidth: '500px' }}>
                <h3
                  style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: 'var(--foreground)',
                    marginBottom: '16px',
                  }}
                >
                  Edit: {selectedRack.name}
                </h3>

                <div className="flex flex-col gap-3">
                  {/* Name */}
                  <div className="flex flex-col gap-1">
                    <label className="font-mono" style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Name
                    </label>
                    <input
                      type="text"
                      value={selectedRack.name}
                      onChange={(e) => updateRack(selectedRack.id, { name: e.target.value })}
                      style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        color: 'var(--foreground)',
                        fontSize: '13px',
                        outline: 'none',
                      }}
                    />
                  </div>

                  {/* Location */}
                  <div className="flex flex-col gap-1">
                    <label className="font-mono" style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Location
                    </label>
                    <input
                      type="text"
                      value={selectedRack.location}
                      onChange={(e) => updateRack(selectedRack.id, { location: e.target.value })}
                      style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        color: 'var(--foreground)',
                        fontSize: '13px',
                        outline: 'none',
                      }}
                    />
                  </div>

                  {/* Width toggle */}
                  <div className="flex flex-col gap-1">
                    <label className="font-mono" style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Width
                    </label>
                    <div className="flex gap-1">
                      {([1, 2, 3] as RackWidth[]).map((w) => (
                        <button
                          key={w}
                          onClick={() => updateRack(selectedRack.id, { width: w })}
                          style={{
                            padding: '6px 14px',
                            fontSize: '12px',
                            fontWeight: 600,
                            borderRadius: '6px',
                            border: '1px solid var(--border)',
                            background: selectedRack.width === w ? 'var(--accent)' : 'var(--surface)',
                            color: selectedRack.width === w ? '#fff' : 'var(--muted)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {w}W
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* RU per bay */}
                  <div className="flex flex-col gap-1">
                    <label className="font-mono" style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      RU per Bay
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={4}
                        max={48}
                        value={selectedRack.totalRU}
                        onChange={(e) => updateRack(selectedRack.id, { totalRU: Number(e.target.value) })}
                        style={{
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          color: 'var(--foreground)',
                          fontSize: '13px',
                          outline: 'none',
                          width: '80px',
                        }}
                      />
                      <span className="font-mono" style={{ fontSize: '11px', color: 'var(--muted)' }}>
                        {selectedRack.width > 1
                          ? `${selectedRack.width} \u00D7 ${selectedRack.totalRU}U = ${selectedRack.width * selectedRack.totalRU}U total`
                          : `${selectedRack.totalRU}U total`
                        }
                      </span>
                    </div>
                  </div>

                  {/* Device count info */}
                  <div
                    className="flex items-center gap-2 px-3 py-2 rounded font-mono"
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      fontSize: '11px',
                      color: 'var(--muted)',
                    }}
                  >
                    {devicesInSelectedRack.length} device{devicesInSelectedRack.length !== 1 ? 's' : ''} installed
                  </div>

                  {/* Danger zone */}
                  <div
                    className="mt-4 pt-4"
                    style={{ borderTop: '1px solid var(--border)' }}
                  >
                    {confirmDeleteId === selectedRack.id ? (
                      <div className="flex flex-col gap-2">
                        <div
                          className="flex items-center gap-2 px-3 py-2 rounded"
                          style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            fontSize: '12px',
                            color: '#ef4444',
                          }}
                        >
                          <AlertTriangle size={14} />
                          {devicesInSelectedRack.length > 0
                            ? `This will unassign ${devicesInSelectedRack.length} device${devicesInSelectedRack.length !== 1 ? 's' : ''} from this rack.`
                            : 'Are you sure you want to remove this rack?'
                          }
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRemoveRack(selectedRack.id)}
                            style={{
                              background: '#ef4444',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '8px 16px',
                              color: '#fff',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Confirm Remove
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: '8px 16px',
                              color: 'var(--muted)',
                              fontSize: '12px',
                              cursor: 'pointer',
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(selectedRack.id)}
                        className="flex items-center gap-2"
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '6px',
                          padding: '8px 16px',
                          color: '#ef4444',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={14} />
                        Remove Rack
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Interactive rack editor with drag-and-drop */}
              <div className="flex-shrink-0">
                <InteractiveRackEditor rack={selectedRack} />
              </div>
            </div>
          )}
        </section>

        {/* Notifications & Alerts Section */}
        <NotificationsSection />
      </div>
    </div>
  );
}

// ============================================================
// Notifications & Alerts Settings Section
// ============================================================

const ALL_EVENT_TYPES: EventType[] = ['status_change', 'temperature_alert', 'signal_loss', 'power_event'];
const ALL_SEVERITIES: EventSeverity[] = ['info', 'warning', 'error', 'critical'];

const channelMeta: Record<NotificationChannel, { label: string; icon: typeof Mail; fields: { key: string; label: string; placeholder: string; type?: string }[] }> = {
  email: { label: 'Email', icon: Mail, fields: [{ key: 'recipients', label: 'Recipients (comma-separated)', placeholder: 'user@example.com, admin@example.com' }] },
  sms: { label: 'SMS', icon: Smartphone, fields: [{ key: 'recipients', label: 'Phone Numbers (comma-separated)', placeholder: '+1234567890' }] },
  slack: { label: 'Slack', icon: MessageSquare, fields: [{ key: 'webhookUrl', label: 'Webhook URL', placeholder: 'https://hooks.slack.com/services/...' }] },
  discord: { label: 'Discord', icon: MessageSquare, fields: [{ key: 'webhookUrl', label: 'Webhook URL', placeholder: 'https://discord.com/api/webhooks/...' }] },
  in_app: { label: 'In-App', icon: Bell, fields: [] },
};

function NotificationsSection() {
  const [eventSettings, setEventSettings] = useState<EventSettings>({
    retentionDays: 30,
    temperatureThresholds: { warning: 55, critical: 70 },
    gpuTemperatureThresholds: { warning: 75, critical: 90 },
    flappingCooldownMs: 60000,
  });
  const [configs, setConfigs] = useState<NotificationChannelConfig[]>([]);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; error?: string }>>({});

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/events/settings');
      if (res.ok) setEventSettings(await res.json());
    } catch { /* ignore */ }
  }, []);

  const fetchConfigs = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/config');
      if (res.ok) setConfigs(await res.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchSettings(); fetchConfigs(); }, [fetchSettings, fetchConfigs]);

  const saveSettings = async (updates: Partial<EventSettings>) => {
    const updated = { ...eventSettings, ...updates };
    setEventSettings(updated);
    await fetch('/api/events/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
  };

  const saveConfig = async (cfg: NotificationChannelConfig) => {
    await fetch('/api/notifications/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cfg),
    });
    fetchConfigs();
  };

  const deleteConfig = async (id: string) => {
    await fetch(`/api/notifications/config?id=${id}`, { method: 'DELETE' });
    fetchConfigs();
  };

  const sendTest = async (channelId: string) => {
    setTestResults((r) => ({ ...r, [channelId]: { success: false, error: 'Sending...' } }));
    try {
      const res = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId }),
      });
      const result = await res.json();
      setTestResults((r) => ({ ...r, [channelId]: result }));
    } catch (e) {
      setTestResults((r) => ({ ...r, [channelId]: { success: false, error: String(e) } }));
    }
  };

  const addChannel = (channel: NotificationChannel) => {
    const id = `cfg-${Date.now()}`;
    const newCfg: NotificationChannelConfig = {
      id,
      channel,
      enabled: true,
      config: channel === 'email' || channel === 'sms' ? { recipients: [] } : {},
      eventTypes: [...ALL_EVENT_TYPES],
      severities: ['warning', 'error', 'critical'],
      rateLimitMs: 300000,
    };
    saveConfig(newCfg);
  };

  return (
    <section>
      <h2
        className="font-mono"
        style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}
      >
        Notifications & Alerts
      </h2>

      {/* Event Settings */}
      <div className="glass-card p-5 mb-4" style={{ maxWidth: '600px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--foreground)', marginBottom: '16px' }}>Event Settings</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <SettingsField
              label="Retention (days)"
              value={eventSettings.retentionDays}
              onChange={(v) => saveSettings({ retentionDays: Number(v) })}
              type="number"
            />
            <SettingsField
              label="Flapping Cooldown (sec)"
              value={eventSettings.flappingCooldownMs / 1000}
              onChange={(v) => saveSettings({ flappingCooldownMs: Number(v) * 1000 })}
              type="number"
            />
          </div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <SettingsField
              label="Temp Warning (°C)"
              value={eventSettings.temperatureThresholds.warning}
              onChange={(v) => saveSettings({ temperatureThresholds: { ...eventSettings.temperatureThresholds, warning: Number(v) } })}
              type="number"
            />
            <SettingsField
              label="Temp Critical (°C)"
              value={eventSettings.temperatureThresholds.critical}
              onChange={(v) => saveSettings({ temperatureThresholds: { ...eventSettings.temperatureThresholds, critical: Number(v) } })}
              type="number"
            />
          </div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <SettingsField
              label="GPU Temp Warning (°C)"
              value={eventSettings.gpuTemperatureThresholds.warning}
              onChange={(v) => saveSettings({ gpuTemperatureThresholds: { ...eventSettings.gpuTemperatureThresholds, warning: Number(v) } })}
              type="number"
            />
            <SettingsField
              label="GPU Temp Critical (°C)"
              value={eventSettings.gpuTemperatureThresholds.critical}
              onChange={(v) => saveSettings({ gpuTemperatureThresholds: { ...eventSettings.gpuTemperatureThresholds, critical: Number(v) } })}
              type="number"
            />
          </div>
        </div>
      </div>

      {/* Notification Channels */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {(Object.keys(channelMeta) as NotificationChannel[]).map((ch) => {
          const hasExisting = configs.some((c) => c.channel === ch);
          if (hasExisting) return null;
          const meta = channelMeta[ch];
          const Icon = meta.icon;
          return (
            <button
              key={ch}
              onClick={() => addChannel(ch)}
              className="glass-card flex items-center gap-2"
              style={{
                padding: '8px 14px', cursor: 'pointer',
                border: '1px dashed var(--border)', color: 'var(--muted)',
                fontSize: '12px', fontWeight: 600,
              }}
            >
              <Plus size={12} />
              <Icon size={14} />
              Add {meta.label}
            </button>
          );
        })}
      </div>

      {/* Channel config cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {configs.map((cfg) => {
          const meta = channelMeta[cfg.channel];
          const Icon = meta.icon;
          const testResult = testResults[cfg.id];
          return (
            <div key={cfg.id} className="glass-card p-4" style={{ maxWidth: '600px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icon size={16} style={{ color: 'var(--accent)' }} />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)' }}>{meta.label}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    onClick={() => saveConfig({ ...cfg, enabled: !cfg.enabled })}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: cfg.enabled ? 'var(--accent)' : 'var(--muted)' }}
                  >
                    {cfg.enabled ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                  </button>
                  <button
                    onClick={() => deleteConfig(cfg.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Channel-specific fields */}
              {meta.fields.map((field) => (
                <div key={field.key} style={{ marginBottom: '8px' }}>
                  <label className="font-mono" style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    {field.label}
                  </label>
                  <input
                    type={field.type || 'text'}
                    value={
                      field.key === 'recipients'
                        ? (cfg.config.recipients as string[] || []).join(', ')
                        : (cfg.config[field.key] as string) || ''
                    }
                    onChange={(e) => {
                      const val = field.key === 'recipients'
                        ? { recipients: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) }
                        : { [field.key]: e.target.value };
                      saveConfig({ ...cfg, config: { ...cfg.config, ...val } });
                    }}
                    placeholder={field.placeholder}
                    style={{
                      width: '100%', padding: '6px 10px',
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: '6px', color: 'var(--foreground)', fontSize: '12px', outline: 'none',
                    }}
                  />
                </div>
              ))}

              {/* Event types and severities */}
              <div style={{ display: 'flex', gap: '16px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <div>
                  <label className="font-mono" style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Event Types</label>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {ALL_EVENT_TYPES.map((t) => {
                      const active = cfg.eventTypes.includes(t);
                      return (
                        <button
                          key={t}
                          onClick={() => {
                            const types = active ? cfg.eventTypes.filter((x) => x !== t) : [...cfg.eventTypes, t];
                            saveConfig({ ...cfg, eventTypes: types });
                          }}
                          style={{
                            padding: '2px 8px', fontSize: '10px', borderRadius: '4px', cursor: 'pointer',
                            border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
                            background: active ? 'rgba(59,130,246,0.1)' : 'transparent',
                            color: active ? 'var(--accent)' : 'var(--muted)',
                            textTransform: 'capitalize',
                          }}
                        >
                          {t.replace('_', ' ')}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="font-mono" style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Severities</label>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {ALL_SEVERITIES.map((s) => {
                      const active = cfg.severities.includes(s);
                      return (
                        <button
                          key={s}
                          onClick={() => {
                            const sevs = active ? cfg.severities.filter((x) => x !== s) : [...cfg.severities, s];
                            saveConfig({ ...cfg, severities: sevs });
                          }}
                          style={{
                            padding: '2px 8px', fontSize: '10px', borderRadius: '4px', cursor: 'pointer',
                            border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
                            background: active ? 'rgba(59,130,246,0.1)' : 'transparent',
                            color: active ? 'var(--accent)' : 'var(--muted)',
                            textTransform: 'capitalize',
                          }}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Test button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                <button
                  onClick={() => sendTest(cfg.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '6px 14px', background: 'var(--surface-2)',
                    border: '1px solid var(--border)', borderRadius: '6px',
                    color: 'var(--foreground)', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  <Send size={12} />
                  Send Test
                </button>
                {testResult && (
                  <span style={{ fontSize: '11px', color: testResult.success ? '#22c55e' : '#ef4444' }}>
                    {testResult.success ? 'Sent!' : testResult.error}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SettingsField({ label, value, onChange, type = 'text' }: { label: string; value: string | number; onChange: (v: string) => void; type?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <label className="font-mono" style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100px', padding: '6px 10px',
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '6px', color: 'var(--foreground)', fontSize: '12px', outline: 'none',
        }}
      />
    </div>
  );
}
