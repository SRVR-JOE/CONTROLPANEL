'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  History, AlertTriangle, AlertCircle, Info, Flame, Search,
  ChevronLeft, ChevronRight, Check, RefreshCw, Filter,
} from 'lucide-react';
import type { EventType, EventSeverity, EventQueryResult } from '@/types';

const severityIcons: Record<EventSeverity, typeof Info> = {
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
  critical: Flame,
};

const severityColors: Record<EventSeverity, string> = {
  info: '#3b82f6',
  warning: '#f59e0b',
  error: '#ef4444',
  critical: '#dc2626',
};

const eventTypeLabels: Record<EventType, string> = {
  status_change: 'Status Change',
  temperature_alert: 'Temperature',
  signal_loss: 'Signal Loss',
  power_event: 'Power Event',
};

export default function EventsPage() {
  const [data, setData] = useState<EventQueryResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [search, setSearch] = useState('');
  const [selectedSeverities, setSelectedSeverities] = useState<EventSeverity[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<EventType[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (search) params.set('search', search);
      if (selectedSeverities.length > 0) params.set('severities', selectedSeverities.join(','));
      if (selectedTypes.length > 0) params.set('eventTypes', selectedTypes.join(','));

      const res = await fetch(`/api/events?${params}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, selectedSeverities, selectedTypes]);

  const fetchEventsRef = useRef(fetchEvents);
  fetchEventsRef.current = fetchEvents;

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => fetchEventsRef.current(), 10000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const toggleSeverity = (s: EventSeverity) => {
    setSelectedSeverities((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
    setPage(1);
  };

  const toggleType = (t: EventType) => {
    setSelectedTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
    setPage(1);
  };

  const handleAcknowledge = async (ids: string[]) => {
    const res = await fetch('/api/events/acknowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventIds: ids }),
    });
    if (!res.ok) return;
    await fetchEvents();
    setSelectedIds(new Set());
  };

  const handleAcknowledgeAll = async () => {
    const res = await fetch('/api/events/acknowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    });
    if (!res.ok) return;
    await fetchEvents();
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const events = data?.events || [];

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Page header */}
      <div style={{ borderBottom: '1px solid var(--border)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <History size={20} style={{ color: 'var(--accent)' }} />
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>Event Log</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {selectedIds.size > 0 && (
            <button
              onClick={() => handleAcknowledge(Array.from(selectedIds))}
              style={{
                background: 'var(--accent)', border: 'none', borderRadius: '6px',
                padding: '6px 14px', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
              }}
            >
              Acknowledge ({selectedIds.size})
            </button>
          )}
          <button
            onClick={handleAcknowledgeAll}
            style={{
              background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '6px',
              padding: '6px 14px', color: 'var(--foreground)', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            }}
          >
            Acknowledge All
          </button>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Stat card — total only; per-severity counts are misleading when paginated */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div
            className="glass-card"
            style={{ padding: '12px 20px', minWidth: '100px', textAlign: 'center' }}
          >
            <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--foreground)', fontFamily: 'var(--font-mono, monospace)' }}>{data?.total || 0}</div>
            <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Total Events</div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="glass-card" style={{ padding: '12px 16px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Severity toggles */}
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <Filter size={12} style={{ color: 'var(--muted)' }} />
            {(['critical', 'error', 'warning', 'info'] as EventSeverity[]).map((s) => {
              const active = selectedSeverities.includes(s);
              return (
                <button
                  key={s}
                  onClick={() => toggleSeverity(s)}
                  style={{
                    padding: '4px 10px', fontSize: '11px', fontWeight: 600,
                    borderRadius: '4px', cursor: 'pointer',
                    border: active ? `1px solid ${severityColors[s]}` : '1px solid var(--border)',
                    background: active ? `${severityColors[s]}20` : 'transparent',
                    color: active ? severityColors[s] : 'var(--muted)',
                    textTransform: 'capitalize',
                  }}
                >
                  {s}
                </button>
              );
            })}
          </div>

          {/* Event type toggles */}
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            {(Object.keys(eventTypeLabels) as EventType[]).map((t) => {
              const active = selectedTypes.includes(t);
              return (
                <button
                  key={t}
                  onClick={() => toggleType(t)}
                  style={{
                    padding: '4px 10px', fontSize: '11px', fontWeight: 600,
                    borderRadius: '4px', cursor: 'pointer',
                    border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
                    background: active ? 'rgba(59,130,246,0.1)' : 'transparent',
                    color: active ? 'var(--accent)' : 'var(--muted)',
                  }}
                >
                  {eventTypeLabels[t]}
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div style={{ flex: 1, minWidth: '160px', position: 'relative' }}>
            <Search size={12} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search events..."
              style={{
                width: '100%', padding: '6px 10px 6px 28px',
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: '6px', color: 'var(--foreground)', fontSize: '12px', outline: 'none',
              }}
            />
          </div>

          {/* Auto-refresh toggle */}
          <button
            onClick={() => setAutoRefresh((r) => !r)}
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              padding: '4px 10px', fontSize: '11px', fontWeight: 600,
              borderRadius: '4px', cursor: 'pointer',
              border: autoRefresh ? '1px solid var(--accent)' : '1px solid var(--border)',
              background: autoRefresh ? 'rgba(59,130,246,0.1)' : 'transparent',
              color: autoRefresh ? 'var(--accent)' : 'var(--muted)',
            }}
          >
            <RefreshCw size={12} />
            Auto
          </button>
        </div>

        {/* Events table */}
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>Loading events...</div>
          ) : events.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>No events found</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ ...thStyle, width: '32px' }}></th>
                  <th style={{ ...thStyle, width: '32px' }}></th>
                  <th style={thStyle}>Time</th>
                  <th style={thStyle}>Device</th>
                  <th style={thStyle}>Type</th>
                  <th style={thStyle}>Title</th>
                  <th style={thStyle}>Message</th>
                  <th style={{ ...thStyle, width: '40px' }}>Ack</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => {
                  const Icon = severityIcons[event.severity];
                  const isExpanded = expandedId === event.id;
                  return (
                    <React.Fragment key={event.id}>
                      <tr
                        tabIndex={0}
                        role="button"
                        aria-expanded={isExpanded}
                        onClick={() => setExpandedId(isExpanded ? null : event.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setExpandedId(isExpanded ? null : event.id);
                          }
                        }}
                        style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', background: isExpanded ? 'rgba(59,130,246,0.04)' : 'transparent' }}
                      >
                        <td style={tdStyle}>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(event.id)}
                            onChange={(e) => { e.stopPropagation(); toggleSelect(event.id); }}
                            style={{ cursor: 'pointer' }}
                          />
                        </td>
                        <td style={tdStyle}>
                          <Icon size={14} style={{ color: severityColors[event.severity] }} />
                        </td>
                        <td style={{ ...tdStyle, fontFamily: 'var(--font-mono, monospace)', whiteSpace: 'nowrap' }}>
                          {new Date(event.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>{event.deviceName}</td>
                        <td style={tdStyle}>
                          <span style={{
                            padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 600,
                            background: 'var(--surface-2)', color: 'var(--muted)', textTransform: 'capitalize',
                          }}>
                            {event.eventType.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.title}</td>
                        <td style={{ ...tdStyle, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--muted)' }}>{event.message}</td>
                        <td style={tdStyle}>
                          {event.acknowledged ? (
                            <Check size={14} style={{ color: 'var(--success, #22c55e)' }} />
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleAcknowledge([event.id]); }}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'var(--muted)' }}
                            >
                              <Check size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={8} style={{ padding: '12px 16px', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-mono, monospace)' }}>
                              <strong style={{ color: 'var(--foreground)' }}>Metadata:</strong>
                              <pre style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                                {JSON.stringify(event.metadata, null, 2)}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={{ ...paginationBtnStyle, opacity: page <= 1 ? 0.4 : 1 }}
            >
              <ChevronLeft size={14} />
            </button>
            <span style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'var(--font-mono, monospace)' }}>
              Page {data.page} of {data.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              disabled={page >= data.totalPages}
              style={{ ...paginationBtnStyle, opacity: page >= data.totalPages ? 0.4 : 1 }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: '8px 12px',
  textAlign: 'left',
  fontSize: '10px',
  fontWeight: 600,
  color: 'var(--muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  fontFamily: 'var(--font-mono, monospace)',
};

const tdStyle: React.CSSProperties = {
  padding: '8px 12px',
  fontSize: '12px',
  color: 'var(--foreground)',
};

const paginationBtnStyle: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '6px',
  padding: '6px 10px',
  cursor: 'pointer',
  color: 'var(--foreground)',
  display: 'flex',
  alignItems: 'center',
};
