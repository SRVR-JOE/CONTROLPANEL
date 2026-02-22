'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/store';
import { Settings, Plus, Trash2, Server, AlertTriangle } from 'lucide-react';
import InteractiveRackEditor from '@/components/rack/dnd/InteractiveRackEditor';
import type { RackWidth } from '@/types';

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
      </div>
    </div>
  );
}
