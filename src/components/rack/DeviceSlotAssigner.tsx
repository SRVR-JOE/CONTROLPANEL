'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useStore } from '@/store';
import { X, Plus, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';

// ============================================================
// Props
// ============================================================

interface DeviceSlotAssignerProps {
  open: boolean;
  onClose: () => void;
}

// ============================================================
// DeviceSlotAssigner component
// ============================================================

export default function DeviceSlotAssigner({ open, onClose }: DeviceSlotAssignerProps) {
  const devices = useStore((s) => s.devices);
  const racks = useStore((s) => s.racks);
  const assignDeviceToRack = useStore((s) => s.assignDeviceToRack);
  const removeDeviceFromRack = useStore((s) => s.removeDeviceFromRack);

  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [selectedRackId, setSelectedRackId] = useState<string>('');
  const [startRU, setStartRU] = useState<number>(1);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Devices not currently assigned to any rack
  const unassignedDevices = useMemo(
    () => devices.filter((d) => !d.rackId),
    [devices]
  );

  // Devices currently assigned to racks
  const assignedDevices = useMemo(
    () => devices.filter((d) => d.rackId),
    [devices]
  );

  // The selected device object
  const selectedDevice = useMemo(
    () => devices.find((d) => d.id === selectedDeviceId),
    [devices, selectedDeviceId]
  );

  // The selected rack object
  const selectedRack = useMemo(
    () => racks.find((r) => r.id === selectedRackId),
    [racks, selectedRackId]
  );

  // Validate whether the target RU range is free in the selected rack
  const validateSlotAvailability = useCallback((): string | null => {
    if (!selectedDevice) return 'Please select a device.';
    if (!selectedRack) return 'Please select a target rack.';

    const endRU = startRU + selectedDevice.rackUnits - 1;

    if (startRU < 1 || startRU > selectedRack.totalRU) {
      return `Starting RU must be between 1 and ${selectedRack.totalRU}.`;
    }

    if (endRU > selectedRack.totalRU) {
      return `Device needs ${selectedDevice.rackUnits}U but only ${selectedRack.totalRU - startRU + 1}U available from RU ${startRU}.`;
    }

    // Check each slot in the range
    for (let ru = startRU; ru <= endRU; ru++) {
      const slot = selectedRack.slots.find((s) => s.ru === ru);
      if (slot?.deviceId) {
        const occupyingDevice = devices.find((d) => d.id === slot.deviceId);
        return `RU ${ru} is already occupied by "${occupyingDevice?.name || 'unknown device'}".`;
      }
    }

    return null;
  }, [selectedDevice, selectedRack, startRU, devices]);

  const handleAssign = () => {
    setError('');
    setSuccess('');

    const validationError = validateSlotAvailability();
    if (validationError) {
      setError(validationError);
      return;
    }

    assignDeviceToRack(selectedDeviceId, selectedRackId, startRU);
    setSuccess(`"${selectedDevice?.name}" assigned to RU ${startRU} in "${selectedRack?.name}".`);
    setSelectedDeviceId('');
    setStartRU(1);
  };

  const handleRemove = (deviceId: string) => {
    const device = devices.find((d) => d.id === deviceId);
    removeDeviceFromRack(deviceId);
    setSuccess(`"${device?.name}" removed from rack.`);
    setError('');
  };

  const handleClose = () => {
    setSelectedDeviceId('');
    setSelectedRackId('');
    setStartRU(1);
    setError('');
    setSuccess('');
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }}
      onClick={handleClose}
    >
      <div
        className="glass-card flex flex-col"
        style={{
          width: '520px',
          maxHeight: '80vh',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <h2
            style={{
              fontSize: '16px',
              fontWeight: 700,
              color: 'var(--foreground)',
              margin: 0,
            }}
          >
            Assign Device to Rack
          </h2>
          <button
            onClick={handleClose}
            className="flex items-center justify-center"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              border: 'none',
              background: 'rgba(255,255,255,0.05)',
              cursor: 'pointer',
              color: 'var(--muted)',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Feedback messages */}
          {error && (
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
              {error}
            </div>
          )}
          {success && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded"
              style={{
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                fontSize: '12px',
                color: '#22c55e',
              }}
            >
              <CheckCircle size={14} />
              {success}
            </div>
          )}

          {/* Device selection */}
          <div className="flex flex-col gap-1">
            <label style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Select Unassigned Device
            </label>
            <select
              value={selectedDeviceId}
              onChange={(e) => {
                setSelectedDeviceId(e.target.value);
                setError('');
                setSuccess('');
              }}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '8px 12px',
                color: 'var(--foreground)',
                fontSize: '13px',
                outline: 'none',
              }}
            >
              <option value="">-- Choose a device --</option>
              {unassignedDevices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.manufacturer} {d.model}) - {d.rackUnits}U
                </option>
              ))}
            </select>
          </div>

          {/* RU requirement display */}
          {selectedDevice && (
            <div
              className="flex items-center gap-3 px-3 py-2 rounded"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                fontSize: '12px',
              }}
            >
              <span style={{ color: 'var(--muted)' }}>Device requires:</span>
              <span style={{ color: 'var(--foreground)', fontWeight: 600 }}>
                {selectedDevice.rackUnits} rack unit{selectedDevice.rackUnits > 1 ? 's' : ''}
              </span>
            </div>
          )}

          {/* Rack selection */}
          <div className="flex flex-col gap-1">
            <label style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Target Rack
            </label>
            <select
              value={selectedRackId}
              onChange={(e) => {
                setSelectedRackId(e.target.value);
                setError('');
                setSuccess('');
              }}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '8px 12px',
                color: 'var(--foreground)',
                fontSize: '13px',
                outline: 'none',
              }}
            >
              <option value="">-- Choose a rack --</option>
              {racks.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.location}) - {r.totalRU}U
                </option>
              ))}
            </select>
          </div>

          {/* Starting RU */}
          <div className="flex flex-col gap-1">
            <label style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Starting RU Position
            </label>
            <input
              type="number"
              min={1}
              max={selectedRack?.totalRU ?? 26}
              value={startRU}
              onChange={(e) => {
                setStartRU(Number(e.target.value));
                setError('');
                setSuccess('');
              }}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '8px 12px',
                color: 'var(--foreground)',
                fontSize: '13px',
                outline: 'none',
                width: '120px',
              }}
            />
          </div>

          {/* Assign button */}
          <button
            onClick={handleAssign}
            disabled={!selectedDeviceId || !selectedRackId}
            className="flex items-center justify-center gap-2"
            style={{
              background: !selectedDeviceId || !selectedRackId ? 'var(--surface-2)' : 'var(--accent)',
              border: 'none',
              borderRadius: '6px',
              padding: '10px 16px',
              color: !selectedDeviceId || !selectedRackId ? 'var(--muted)' : '#fff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: !selectedDeviceId || !selectedRackId ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s ease',
            }}
          >
            <Plus size={14} />
            Assign Device to Rack
          </button>

          {/* Divider */}
          <div
            style={{
              height: '1px',
              background: 'var(--border)',
              margin: '4px 0',
            }}
          />

          {/* Currently assigned devices */}
          <div className="flex flex-col gap-1">
            <label style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Currently Assigned Devices
            </label>
            <div className="flex flex-col gap-1" style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {assignedDevices.length === 0 && (
                <div style={{ fontSize: '12px', color: 'var(--muted)', padding: '8px 0' }}>
                  No devices assigned to any rack.
                </div>
              )}
              {assignedDevices.map((d) => {
                const rack = racks.find((r) => r.id === d.rackId);
                return (
                  <div
                    key={d.id}
                    className="flex items-center justify-between px-3 py-2 rounded"
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      fontSize: '12px',
                    }}
                  >
                    <div className="flex flex-col">
                      <span style={{ color: 'var(--foreground)', fontWeight: 500 }}>{d.name}</span>
                      <span style={{ color: 'var(--muted)', fontSize: '10px' }}>
                        {rack?.name} &middot; RU {d.rackSlot}
                        {d.rackUnits > 1 ? `-${(d.rackSlot ?? 0) + d.rackUnits - 1}` : ''}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemove(d.id)}
                      className="flex items-center gap-1"
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        color: '#ef4444',
                        fontSize: '11px',
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={12} />
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
