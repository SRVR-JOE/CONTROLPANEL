'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  Type,
  Check,
  CheckSquare,
  Square,
  ChevronRight,
  Plus,
  PanelRightClose,
  PanelRightOpen,
  ArrowUpDown,
  Zap,
} from 'lucide-react';
import { useStore } from '@/store';
import { useNamingStore } from '@/store/useNamingStore';
import { useShallow } from 'zustand/react/shallow';
import { LOCATION_TYPE_CONFIG, STATUS_COLORS } from '@/lib/constants';
import { extractVariables } from '@/lib/naming-engine';
import type { LocationType, Device, NamingTemplate } from '@/types';
import LocationTypeBadge from '@/components/naming/LocationTypeBadge';
import NamingConflictBanner from '@/components/naming/NamingConflictBanner';
import NamingTemplateEditor from '@/components/naming/NamingTemplateEditor';

// ============================================================
// Helpers
// ============================================================

function groupDevicesByLocation(devices: Device[], racks: { id: string; name: string; locationType?: LocationType }[]) {
  const rackMap = new Map(racks.map((r) => [r.id, r]));
  const groups: Record<string, { locationType: LocationType | 'unassigned'; devices: Device[] }> = {};

  for (const device of devices) {
    const rack = device.rackId ? rackMap.get(device.rackId) : undefined;
    const lt = rack?.locationType ?? 'unassigned';
    const groupKey = rack ? `${lt}:${rack.name}` : 'unassigned:Unassigned';
    if (!groups[groupKey]) {
      groups[groupKey] = { locationType: lt as LocationType | 'unassigned', devices: [] };
    }
    groups[groupKey].devices.push(device);
  }

  // Sort: truss first, then rack, then floor, then unassigned
  const order: Record<string, number> = { truss: 0, rack: 1, floor: 2, unassigned: 3 };
  return Object.entries(groups).sort(
    ([, a], [, b]) => (order[a.locationType] ?? 3) - (order[b.locationType] ?? 3)
  );
}

// ============================================================
// NamingView
// ============================================================

export default function NamingPage() {
  const { devices, racks } = useStore(
    useShallow((s) => ({ devices: s.devices, racks: s.racks }))
  );

  const {
    templates,
    selectedDeviceIds,
    selectedTemplateId,
    variableOverrides,
    startNumber,
    numberPadding,
    toggleDeviceSelection,
    setSelectedDeviceIds,
    clearSelection,
    setSelectedTemplate,
    setVariableOverrides,
    setStartNumber,
    setNumberPadding,
    getPreviewNames,
    getConflicts,
    applyNames,
    addTemplate,
    updateTemplate,
    deleteTemplate,
  } = useNamingStore();

  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NamingTemplate | null>(null);
  const [filterLocationType, setFilterLocationType] = useState<LocationType | 'all'>('all');

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === selectedTemplateId) ?? null,
    [templates, selectedTemplateId]
  );

  const previewNames = useMemo(
    () => getPreviewNames(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedDeviceIds, selectedTemplateId, variableOverrides, startNumber, numberPadding, templates],
  );

  const conflicts = useMemo(
    () => getConflicts(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [previewNames],
  );

  const deviceGroups = useMemo(
    () => groupDevicesByLocation(devices, racks),
    [devices, racks]
  );

  const filteredTemplates = useMemo(
    () =>
      filterLocationType === 'all'
        ? templates
        : templates.filter((t) => t.locationType === filterLocationType),
    [templates, filterLocationType]
  );

  const previewMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of previewNames) map.set(p.deviceId, p.name);
    return map;
  }, [previewNames]);

  const extractedVars = useMemo(
    () => (selectedTemplate ? extractVariables(selectedTemplate.pattern) : []),
    [selectedTemplate]
  );

  const handleSelectGroup = useCallback(
    (groupDevices: Device[]) => {
      const ids = groupDevices.map((d) => d.id);
      const allSelected = ids.every((id) => selectedDeviceIds.includes(id));
      if (allSelected) {
        setSelectedDeviceIds(selectedDeviceIds.filter((id) => !ids.includes(id)));
      } else {
        const merged = Array.from(new Set([...selectedDeviceIds, ...ids]));
        setSelectedDeviceIds(merged);
      }
    },
    [selectedDeviceIds, setSelectedDeviceIds]
  );

  const handleApply = useCallback(() => {
    if (conflicts.length > 0) return;
    applyNames();
  }, [conflicts, applyNames]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0c0c14', color: '#e0e0e8' }}>
      <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '24px' }}>
        {/* ============================================================ */}
        {/* HEADER */}
        {/* ============================================================ */}
        <header style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <Type style={{ width: '18px', height: '18px', color: '#6366f1' }} />
            <span style={{ fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase', fontFamily: 'var(--font-mono, monospace)', color: '#6366f1' }}>
              Naming System
            </span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-mono, monospace)', color: '#f0f0f8', margin: 0 }}>
            DEVICE NAMING
          </h1>
          <p style={{ fontSize: '12px', fontFamily: 'var(--font-mono, monospace)', color: '#7a7a8e', marginTop: '4px' }}>
            Select devices, choose a template, preview and apply names
          </p>
        </header>

        {/* ============================================================ */}
        {/* THREE-PANEL LAYOUT */}
        {/* ============================================================ */}
        <div style={{ display: 'grid', gridTemplateColumns: showEditor ? '1fr 1fr 320px' : '1fr 1fr', gap: '16px' }}>
          {/* LEFT PANEL — Device selection */}
          <div
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '12px',
              padding: '16px',
              maxHeight: 'calc(100vh - 200px)',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h2 style={sectionTitleStyle}>
                Devices
                <span style={countBadgeStyle}>{selectedDeviceIds.length}/{devices.length}</span>
              </h2>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => setSelectedDeviceIds(devices.map((d) => d.id))} style={smallButtonStyle}>
                  Select All
                </button>
                <button onClick={clearSelection} style={smallButtonStyle}>
                  Clear
                </button>
              </div>
            </div>

            {/* Device groups */}
            {deviceGroups.map(([groupKey, group]) => {
              const [lt, groupName] = groupKey.split(':');
              const allSelected = group.devices.every((d) => selectedDeviceIds.includes(d.id));
              const someSelected = group.devices.some((d) => selectedDeviceIds.includes(d.id));

              return (
                <div key={groupKey} style={{ marginBottom: '12px' }}>
                  {/* Group header */}
                  <button
                    onClick={() => handleSelectGroup(group.devices)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '6px 4px',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                    }}
                  >
                    {allSelected ? (
                      <CheckSquare style={{ width: '14px', height: '14px', color: '#3b82f6' }} />
                    ) : someSelected ? (
                      <CheckSquare style={{ width: '14px', height: '14px', color: '#3b82f650' }} />
                    ) : (
                      <Square style={{ width: '14px', height: '14px', color: '#4a4a5e' }} />
                    )}
                    {lt !== 'unassigned' && <LocationTypeBadge type={lt as LocationType} size="sm" />}
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono, monospace)', fontWeight: 600, color: '#b0b0c0' }}>
                      {groupName}
                    </span>
                    <span style={{ ...countBadgeStyle, marginLeft: 'auto' }}>{group.devices.length}</span>
                  </button>

                  {/* Device list */}
                  {group.devices.map((device) => {
                    const isSelected = selectedDeviceIds.includes(device.id);
                    const previewName = previewMap.get(device.id);
                    return (
                      <button
                        key={device.id}
                        onClick={() => toggleDeviceSelection(device.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          width: '100%',
                          background: isSelected ? 'rgba(59,130,246,0.06)' : 'transparent',
                          border: 'none',
                          borderLeft: isSelected ? '2px solid #3b82f6' : '2px solid transparent',
                          cursor: 'pointer',
                          padding: '5px 4px 5px 12px',
                          transition: 'background 0.1s',
                        }}
                      >
                        {isSelected ? (
                          <Check style={{ width: '12px', height: '12px', color: '#3b82f6', flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: '12px', height: '12px', flexShrink: 0 }} />
                        )}
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: STATUS_COLORS[device.status],
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            fontSize: '11px',
                            fontFamily: 'var(--font-mono, monospace)',
                            color: '#c0c0d0',
                            flex: 1,
                            textAlign: 'left',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {device.name}
                        </span>
                        {previewName && (
                          <>
                            <ChevronRight style={{ width: '10px', height: '10px', color: '#4a4a5e', flexShrink: 0 }} />
                            <span
                              style={{
                                fontSize: '10px',
                                fontFamily: 'var(--font-mono, monospace)',
                                color: '#3b82f6',
                                fontWeight: 600,
                                flexShrink: 0,
                                maxWidth: '120px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {previewName}
                            </span>
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* CENTER PANEL — Template selector + preview */}
          <div
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              maxHeight: 'calc(100vh - 200px)',
              overflowY: 'auto',
            }}
          >
            {/* Template selector */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <h2 style={sectionTitleStyle}>Templates</h2>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  {/* Location type filter */}
                  <select
                    value={filterLocationType}
                    onChange={(e) => setFilterLocationType(e.target.value as LocationType | 'all')}
                    style={selectStyle}
                  >
                    <option value="all">All Types</option>
                    <option value="truss">Truss</option>
                    <option value="rack">Rack</option>
                    <option value="floor">Floor</option>
                  </select>
                  <button
                    onClick={() => { setEditingTemplate(null); setShowEditor(true); }}
                    style={{ ...smallButtonStyle, color: '#3b82f6' }}
                  >
                    <Plus style={{ width: '12px', height: '12px' }} />
                    New
                  </button>
                  <button
                    onClick={() => setShowEditor(!showEditor)}
                    style={smallButtonStyle}
                    title={showEditor ? 'Hide editor' : 'Show editor'}
                  >
                    {showEditor ? <PanelRightClose style={{ width: '14px', height: '14px' }} /> : <PanelRightOpen style={{ width: '14px', height: '14px' }} />}
                  </button>
                </div>
              </div>

              {/* Template grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
                {filteredTemplates.map((tpl) => {
                  const isActive = tpl.id === selectedTemplateId;
                  const ltColor = LOCATION_TYPE_CONFIG[tpl.locationType].color;
                  return (
                    <button
                      key={tpl.id}
                      onClick={() => setSelectedTemplate(tpl.id)}
                      onDoubleClick={() => { setEditingTemplate(tpl); setShowEditor(true); }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        padding: '10px 12px',
                        background: isActive ? `${ltColor}12` : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${isActive ? `${ltColor}40` : 'rgba(255,255,255,0.06)'}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <LocationTypeBadge type={tpl.locationType} size="sm" />
                        {tpl.isBuiltIn && (
                          <span style={{ fontSize: '8px', fontFamily: 'var(--font-mono, monospace)', color: '#5a5a6e', letterSpacing: '0.05em' }}>
                            PRESET
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono, monospace)', fontWeight: 600, color: isActive ? '#d0d0de' : '#9090a0' }}>
                        {tpl.name}
                      </span>
                      <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono, monospace)', color: '#5a5a6e' }}>
                        {tpl.pattern}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Variable config */}
            {selectedTemplate && extractedVars.length > 0 && (
              <div>
                <h3 style={{ ...sectionTitleStyle, fontSize: '10px', marginBottom: '8px' }}>Variables</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {extractedVars.map((v) => (
                    <div key={v} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono, monospace)', color: '#7a7a8e' }}>
                        {'{' + v + '}'}
                      </span>
                      {v === 'number' ? (
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <label style={{ fontSize: '9px', fontFamily: 'var(--font-mono, monospace)', color: '#5a5a6e' }}>start:</label>
                          <input
                            type="number"
                            value={startNumber}
                            onChange={(e) => setStartNumber(Math.max(0, parseInt(e.target.value) || 0))}
                            style={{ ...inputCompactStyle, width: '48px' }}
                          />
                          <label style={{ fontSize: '9px', fontFamily: 'var(--font-mono, monospace)', color: '#5a5a6e' }}>pad:</label>
                          <input
                            type="number"
                            value={numberPadding}
                            onChange={(e) => setNumberPadding(Math.max(1, Math.min(4, parseInt(e.target.value) || 2)))}
                            style={{ ...inputCompactStyle, width: '36px' }}
                          />
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={variableOverrides[v] ?? selectedTemplate.variables[v] ?? ''}
                          onChange={(e) => setVariableOverrides({ ...variableOverrides, [v]: e.target.value })}
                          style={{ ...inputCompactStyle, width: '80px' }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Conflict banner */}
            <NamingConflictBanner conflicts={conflicts} />

            {/* Preview table */}
            {previewNames.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <h3 style={sectionTitleStyle}>
                    Preview
                    <span style={countBadgeStyle}>{previewNames.length}</span>
                  </h3>
                </div>
                <div
                  style={{
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '8px',
                    overflow: 'hidden',
                  }}
                >
                  {/* Table header */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 24px 1fr',
                      padding: '6px 12px',
                      background: 'rgba(255,255,255,0.03)',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                    }}
                  >
                    <span style={tableHeaderStyle}>Current Name</span>
                    <span />
                    <span style={tableHeaderStyle}>New Name</span>
                  </div>
                  {/* Table rows */}
                  {previewNames.map(({ deviceId, name }) => {
                    const device = devices.find((d) => d.id === deviceId);
                    if (!device) return null;
                    const hasConflict = conflicts.some((c) => c.newDeviceId === deviceId);
                    return (
                      <div
                        key={deviceId}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 24px 1fr',
                          padding: '5px 12px',
                          alignItems: 'center',
                          borderBottom: '1px solid rgba(255,255,255,0.02)',
                          background: hasConflict ? 'rgba(239,68,68,0.05)' : 'transparent',
                        }}
                      >
                        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono, monospace)', color: '#8080a0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {device.name}
                        </span>
                        <ChevronRight style={{ width: '12px', height: '12px', color: '#4a4a5e' }} />
                        <span
                          style={{
                            fontSize: '11px',
                            fontFamily: 'var(--font-mono, monospace)',
                            fontWeight: 600,
                            color: hasConflict ? '#ef4444' : '#3b82f6',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Apply button */}
            {previewNames.length > 0 && (
              <button
                onClick={handleApply}
                disabled={conflicts.length > 0}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: conflicts.length > 0 ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  color: conflicts.length > 0 ? '#4a4a5e' : '#fff',
                  background: conflicts.length > 0 ? 'rgba(255,255,255,0.04)' : 'linear-gradient(135deg, #3b82f6, #6366f1)',
                  transition: 'all 0.2s',
                }}
              >
                <Zap style={{ width: '14px', height: '14px' }} />
                APPLY {previewNames.length} NAME{previewNames.length !== 1 ? 'S' : ''}
              </button>
            )}

            {/* Empty state */}
            {selectedDeviceIds.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <ArrowUpDown style={{ width: '24px', height: '24px', color: '#3a3a52', margin: '0 auto 12px' }} />
                <p style={{ fontSize: '12px', fontFamily: 'var(--font-mono, monospace)', color: '#4a4a5e', margin: 0 }}>
                  Select devices from the left panel, then pick a template
                </p>
              </div>
            )}
          </div>

          {/* RIGHT PANEL — Template editor (collapsible) */}
          {showEditor && (
            <div>
              <NamingTemplateEditor
                template={editingTemplate}
                onSave={(data) => {
                  if (editingTemplate && !editingTemplate.isBuiltIn) {
                    updateTemplate(editingTemplate.id, data);
                  } else {
                    const id = addTemplate(data);
                    setSelectedTemplate(id);
                  }
                  setEditingTemplate(null);
                  setShowEditor(false);
                }}
                onDelete={
                  editingTemplate && !editingTemplate.isBuiltIn
                    ? () => {
                        deleteTemplate(editingTemplate.id);
                        setEditingTemplate(null);
                        setShowEditor(false);
                      }
                    : undefined
                }
                onClose={() => { setEditingTemplate(null); setShowEditor(false); }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Shared styles
// ============================================================

const sectionTitleStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '11px',
  fontFamily: 'var(--font-mono, monospace)',
  fontWeight: 600,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: '#7a7a8e',
  margin: 0,
};

const countBadgeStyle: React.CSSProperties = {
  fontSize: '10px',
  fontFamily: 'var(--font-mono, monospace)',
  color: '#4a4a5e',
  background: 'rgba(255,255,255,0.04)',
  padding: '1px 7px',
  borderRadius: '10px',
};

const smallButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  padding: '4px 8px',
  borderRadius: '6px',
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.04)',
  cursor: 'pointer',
  fontSize: '10px',
  fontFamily: 'var(--font-mono, monospace)',
  color: '#7a7a8e',
  transition: 'all 0.15s',
};

const selectStyle: React.CSSProperties = {
  padding: '4px 8px',
  borderRadius: '6px',
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.04)',
  fontSize: '10px',
  fontFamily: 'var(--font-mono, monospace)',
  color: '#b0b0c0',
  outline: 'none',
  cursor: 'pointer',
};

const inputCompactStyle: React.CSSProperties = {
  padding: '3px 6px',
  borderRadius: '4px',
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.04)',
  fontSize: '11px',
  fontFamily: 'var(--font-mono, monospace)',
  color: '#d0d0de',
  outline: 'none',
};

const tableHeaderStyle: React.CSSProperties = {
  fontSize: '9px',
  fontFamily: 'var(--font-mono, monospace)',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: '#5a5a6e',
};
