'use client';

import { useState, useMemo } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import type { NamingTemplate, LocationType } from '@/types';
import { LOCATION_TYPE_CONFIG } from '@/lib/constants';
import { extractVariables, compileName, validateTemplate } from '@/lib/naming-engine';
import LocationTypeBadge from './LocationTypeBadge';

interface NamingTemplateEditorProps {
  template?: NamingTemplate | null;
  onSave: (data: { name: string; pattern: string; locationType: LocationType; variables: Record<string, string> }) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export default function NamingTemplateEditor({
  template,
  onSave,
  onDelete,
  onClose,
}: NamingTemplateEditorProps) {
  const [name, setName] = useState(template?.name ?? '');
  const [pattern, setPattern] = useState(template?.pattern ?? '{location}-{type}-{number}');
  const [locationType, setLocationType] = useState<LocationType>(template?.locationType ?? 'rack');
  const [variables, setVariables] = useState<Record<string, string>>(
    template?.variables ?? { location: 'FOH', type: 'RACK', number: '01' }
  );

  const extractedVars = useMemo(() => extractVariables(pattern), [pattern]);
  const preview = useMemo(() => compileName(pattern, variables), [pattern, variables]);
  const validation = useMemo(() => validateTemplate({ name, pattern, variables }), [name, pattern, variables]);

  // Sync variables when pattern changes
  const currentVarKeys = Object.keys(variables);
  const missingVars = extractedVars.filter((v) => !currentVarKeys.includes(v));
  if (missingVars.length > 0) {
    const updated = { ...variables };
    for (const v of missingVars) {
      updated[v] = v === 'number' ? '01' : '';
    }
    setVariables(updated);
  }

  const handleSave = () => {
    if (!validation.valid) return;
    onSave({ name, pattern, locationType, variables });
  };

  const isBuiltIn = template?.isBuiltIn ?? false;

  return (
    <div
      style={{
        background: 'rgba(14, 14, 24, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3
          style={{
            fontSize: '13px',
            fontFamily: 'var(--font-mono, monospace)',
            fontWeight: 700,
            color: '#d0d0de',
            margin: 0,
          }}
        >
          {template ? (isBuiltIn ? 'Template Details' : 'Edit Template') : 'New Template'}
        </h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#7a7a8e',
            padding: '4px',
          }}
        >
          <X style={{ width: '16px', height: '16px' }} />
        </button>
      </div>

      {/* Name */}
      <div>
        <label style={labelStyle}>Template Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isBuiltIn}
          placeholder="e.g. FOH Rack"
          style={inputStyle}
        />
      </div>

      {/* Location Type */}
      <div>
        <label style={labelStyle}>Location Type</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(Object.keys(LOCATION_TYPE_CONFIG) as LocationType[]).map((lt) => (
            <button
              key={lt}
              onClick={() => !isBuiltIn && setLocationType(lt)}
              disabled={isBuiltIn}
              style={{
                ...buttonBaseStyle,
                background: locationType === lt ? `${LOCATION_TYPE_CONFIG[lt].color}20` : 'rgba(255,255,255,0.04)',
                borderColor: locationType === lt ? `${LOCATION_TYPE_CONFIG[lt].color}50` : 'rgba(255,255,255,0.08)',
                color: locationType === lt ? LOCATION_TYPE_CONFIG[lt].color : '#7a7a8e',
                opacity: isBuiltIn ? 0.6 : 1,
              }}
            >
              <LocationTypeBadge type={lt} size="sm" />
            </button>
          ))}
        </div>
      </div>

      {/* Pattern */}
      <div>
        <label style={labelStyle}>Pattern</label>
        <input
          type="text"
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
          disabled={isBuiltIn}
          placeholder="e.g. FOH-{type}-{number}"
          style={{
            ...inputStyle,
            fontFamily: 'var(--font-mono, monospace)',
          }}
        />
        <div style={{ marginTop: '4px', fontSize: '10px', color: '#5a5a6e', fontFamily: 'var(--font-mono, monospace)' }}>
          Use {'{variable}'} for dynamic parts. {'{number}'} auto-increments.
        </div>
      </div>

      {/* Variable defaults */}
      {extractedVars.length > 0 && (
        <div>
          <label style={labelStyle}>Variable Defaults</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {extractedVars.map((v) => (
              <div key={v} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono, monospace)',
                    color: '#8b8ba0',
                    minWidth: '60px',
                  }}
                >
                  {'{' + v + '}'}
                </span>
                <input
                  type="text"
                  value={variables[v] ?? ''}
                  onChange={(e) => setVariables({ ...variables, [v]: e.target.value })}
                  disabled={isBuiltIn}
                  style={{ ...inputStyle, flex: 1 }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live preview */}
      <div
        style={{
          background: 'rgba(59, 130, 246, 0.08)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          borderRadius: '8px',
          padding: '10px 14px',
        }}
      >
        <div style={{ fontSize: '9px', fontFamily: 'var(--font-mono, monospace)', color: '#5a8abf', marginBottom: '4px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Preview
        </div>
        <div
          style={{
            fontSize: '16px',
            fontFamily: 'var(--font-mono, monospace)',
            fontWeight: 700,
            color: '#d0d0de',
          }}
        >
          {preview}
        </div>
      </div>

      {/* Validation errors */}
      {!validation.valid && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {validation.errors.map((err, i) => (
            <span
              key={i}
              style={{
                fontSize: '10px',
                fontFamily: 'var(--font-mono, monospace)',
                color: '#ef4444',
              }}
            >
              {err}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      {!isBuiltIn && (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          {onDelete && template && (
            <button onClick={onDelete} style={{ ...actionButtonStyle, color: '#ef4444', background: 'rgba(239,68,68,0.1)' }}>
              <Trash2 style={{ width: '12px', height: '12px' }} />
              Delete
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!validation.valid}
            style={{
              ...actionButtonStyle,
              color: validation.valid ? '#3b82f6' : '#4a4a5e',
              background: validation.valid ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)',
              cursor: validation.valid ? 'pointer' : 'not-allowed',
            }}
          >
            <Plus style={{ width: '12px', height: '12px' }} />
            {template ? 'Update' : 'Create'}
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Shared styles
// ============================================================

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '10px',
  fontFamily: 'var(--font-mono, monospace)',
  color: '#7a7a8e',
  marginBottom: '4px',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255, 255, 255, 0.04)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '6px',
  padding: '7px 10px',
  fontSize: '12px',
  color: '#d0d0de',
  outline: 'none',
};

const buttonBaseStyle: React.CSSProperties = {
  padding: '4px 8px',
  borderRadius: '6px',
  border: '1px solid',
  cursor: 'pointer',
  background: 'transparent',
  transition: 'all 0.15s',
};

const actionButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
  padding: '6px 12px',
  borderRadius: '6px',
  border: 'none',
  cursor: 'pointer',
  fontSize: '11px',
  fontFamily: 'var(--font-mono, monospace)',
  fontWeight: 600,
};
