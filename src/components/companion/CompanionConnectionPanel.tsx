'use client';

import { useState } from 'react';
import { useStore } from '@/store';
import { companionModules } from '@/store/companion-modules';
import { CompanionConnectionStatus } from '@/types';
import { Plug, Unplug, Radio, Globe } from 'lucide-react';

const statusConfig: Record<CompanionConnectionStatus, { color: string; label: string }> = {
  connected: { color: 'var(--success)', label: 'Connected' },
  connecting: { color: 'var(--warning)', label: 'Connecting' },
  error: { color: 'var(--error)', label: 'Error' },
  disconnected: { color: 'var(--muted)', label: 'Disconnected' },
};

export default function CompanionConnectionPanel() {
  const connection = useStore((s) => s.companionConnection);
  const instances = useStore((s) => s.companionModuleInstances);
  const setCompanionConnection = useStore((s) => s.setCompanionConnection);
  const disconnectCompanion = useStore((s) => s.disconnectCompanion);

  const [host, setHost] = useState('127.0.0.1');
  const [port, setPort] = useState(8000);

  const status = connection?.status ?? 'disconnected';
  const cfg = statusConfig[status];
  const isConnected = status === 'connected';
  const isConnecting = status === 'connecting';

  const handleConnect = () => {
    if (host.trim()) {
      setCompanionConnection(host.trim(), port);
    }
  };

  const handleDisconnect = () => {
    disconnectCompanion();
  };

  const baseUrl = connection
    ? `${connection.protocol}://${connection.host}:${connection.port}`
    : `http://${host}:${port}`;

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15">
          <Radio className="h-5 w-5 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-foreground">Companion Connection</h2>
          <p className="text-xs text-muted">Bitfocus Companion API</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full shrink-0"
            style={{ backgroundColor: cfg.color }}
          />
          <span className="text-xs font-medium" style={{ color: cfg.color }}>
            {cfg.label}
          </span>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Connection form */}
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs text-muted mb-1.5">Host</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input
                type="text"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                disabled={isConnected || isConnecting}
                placeholder="127.0.0.1"
                className="w-full rounded-md border border-border bg-surface pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none disabled:opacity-50"
              />
            </div>
          </div>
          <div className="w-24">
            <label className="block text-xs text-muted mb-1.5">Port</label>
            <input
              type="number"
              value={port}
              onChange={(e) => setPort(parseInt(e.target.value) || 8000)}
              disabled={isConnected || isConnecting}
              placeholder="8000"
              min={1}
              max={65535}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm font-mono text-foreground focus:border-accent focus:outline-none disabled:opacity-50"
            />
          </div>
          <div>
            {isConnected ? (
              <button
                onClick={handleDisconnect}
                className="flex items-center gap-2 rounded-md bg-error/15 px-4 py-2 text-sm font-medium text-error transition-colors hover:bg-error/25"
              >
                <Unplug className="h-4 w-4" />
                Disconnect
              </button>
            ) : (
              <button
                onClick={handleConnect}
                disabled={isConnecting || !host.trim()}
                className="flex items-center gap-2 rounded-md bg-accent/15 px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plug className="h-4 w-4" />
                {isConnecting ? 'Connecting...' : 'Connect'}
              </button>
            )}
          </div>
        </div>

        {/* Connection details (when connected) */}
        {connection && isConnected && (
          <div className="rounded-lg bg-surface-2 p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {connection.version && (
                <div>
                  <span className="block text-[10px] uppercase tracking-wider text-muted mb-0.5">Version</span>
                  <span className="text-sm font-mono text-foreground">{connection.version}</span>
                </div>
              )}
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-muted mb-0.5">Protocol</span>
                <span className="text-sm font-mono text-foreground uppercase">{connection.protocol}</span>
              </div>
              {connection.lastSeen && (
                <div>
                  <span className="block text-[10px] uppercase tracking-wider text-muted mb-0.5">Last Seen</span>
                  <span className="text-sm font-mono text-foreground">
                    {new Date(connection.lastSeen).toLocaleTimeString()}
                  </span>
                </div>
              )}
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-muted mb-0.5">Name</span>
                <span className="text-sm text-foreground">{connection.name}</span>
              </div>
            </div>
          </div>
        )}

        {/* API endpoint reference */}
        <div className="rounded-lg bg-surface-2 p-3">
          <span className="block text-[10px] uppercase tracking-wider text-muted mb-1">API Endpoint</span>
          <code className="text-xs font-mono text-accent break-all">{baseUrl}</code>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-surface-2 p-3 text-center">
            <span className="block text-2xl font-bold font-mono text-foreground">
              {companionModules.length}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted">Modules Available</span>
          </div>
          <div className="rounded-lg bg-surface-2 p-3 text-center">
            <span className="block text-2xl font-bold font-mono text-foreground">
              {instances.length}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted">Instances Configured</span>
          </div>
        </div>
      </div>
    </div>
  );
}
