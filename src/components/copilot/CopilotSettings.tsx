'use client';

import { useState, useEffect } from 'react';
import { X, Eye, EyeOff, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import type { AISettings } from '@/lib/ai/types';
import { DEFAULT_AI_SETTINGS } from '@/lib/ai/types';

interface CopilotSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

function loadSettings(): AISettings {
  if (typeof window === 'undefined') return DEFAULT_AI_SETTINGS;
  try {
    const stored = localStorage.getItem('copilot-settings');
    return stored ? { ...DEFAULT_AI_SETTINGS, ...JSON.parse(stored) } : DEFAULT_AI_SETTINGS;
  } catch {
    return DEFAULT_AI_SETTINGS;
  }
}

function saveSettings(settings: AISettings) {
  localStorage.setItem('copilot-settings', JSON.stringify(settings));
}

export default function CopilotSettings({ isOpen, onClose }: CopilotSettingsProps) {
  const [settings, setSettings] = useState<AISettings>(DEFAULT_AI_SETTINGS);
  const [showKey, setShowKey] = useState(false);
  const [claudeStatus, setClaudeStatus] = useState<'idle' | 'checking' | 'ok' | 'error'>('idle');
  const [ollamaStatus, setOllamaStatus] = useState<'idle' | 'checking' | 'ok' | 'error'>('idle');
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) setSettings(loadSettings());
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const update = (patch: Partial<AISettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(next);
  };

  const testClaude = async () => {
    if (!settings.claudeApiKey) return;
    setClaudeStatus('checking');
    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Say "OK" in one word.' }],
          systemContext: '',
          provider: 'claude',
          settings: { claudeApiKey: settings.claudeApiKey, claudeModel: settings.claudeModel, autoFallback: false },
        }),
      });
      setClaudeStatus(res.ok ? 'ok' : 'error');
    } catch {
      setClaudeStatus('error');
    }
  };

  const testOllama = async () => {
    setOllamaStatus('checking');
    try {
      const res = await fetch(`${settings.ollamaUrl}/api/tags`);
      if (res.ok) {
        const data = await res.json();
        const models = (data.models ?? []).map((m: { name: string }) => m.name);
        setOllamaModels(models);
        setOllamaStatus('ok');
      } else {
        setOllamaStatus('error');
      }
    } catch {
      setOllamaStatus('error');
    }
  };

  if (!isOpen) return null;

  const StatusIcon = ({ status }: { status: 'idle' | 'checking' | 'ok' | 'error' }) => {
    if (status === 'checking') return <Loader2 className="h-4 w-4 animate-spin text-muted" />;
    if (status === 'ok') return <CheckCircle2 className="h-4 w-4 text-success" />;
    if (status === 'error') return <XCircle className="h-4 w-4 text-error" />;
    return null;
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="AI Copilot Settings"
        className="w-[480px] max-h-[85vh] overflow-y-auto rounded-2xl border border-border bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-sm font-bold">AI Copilot Settings</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-muted hover:bg-surface-2 hover:text-foreground" aria-label="Close settings">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-6 p-5">
          {/* Provider Selection */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted">Primary Provider</label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                onClick={() => update({ provider: 'claude' })}
                className={`rounded-xl border px-4 py-3 text-left text-sm transition-all ${
                  settings.provider === 'claude' ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted hover:bg-surface-2'
                }`}
              >
                <div className="font-medium">Claude</div>
                <div className="text-xs opacity-60">Anthropic API</div>
              </button>
              <button
                onClick={() => update({ provider: 'ollama' })}
                className={`rounded-xl border px-4 py-3 text-left text-sm transition-all ${
                  settings.provider === 'ollama' ? 'border-green-500 bg-green-500/10 text-green-400' : 'border-border text-muted hover:bg-surface-2'
                }`}
              >
                <div className="font-medium">Ollama</div>
                <div className="text-xs opacity-60">Local / Offline</div>
              </button>
            </div>
          </div>

          {/* Auto-fallback */}
          <label className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Auto-fallback to Ollama</div>
              <div className="text-xs text-muted">When Claude is unavailable, use local Ollama</div>
            </div>
            <button
              role="switch"
              aria-checked={settings.autoFallback}
              onClick={() => update({ autoFallback: !settings.autoFallback })}
              className={`relative h-6 w-11 rounded-full transition-colors ${settings.autoFallback ? 'bg-accent' : 'bg-surface-2'}`}
            >
              <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${settings.autoFallback ? 'translate-x-5' : ''}`} />
            </button>
          </label>

          {/* Claude Settings */}
          <div className="rounded-xl border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Claude API</h3>
              <div className="flex items-center gap-2">
                <StatusIcon status={claudeStatus} />
                <button onClick={testClaude} className="rounded-lg bg-surface-2 px-2.5 py-1 text-xs text-muted hover:text-foreground">
                  Test
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted">API Key</label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={settings.claudeApiKey}
                  onChange={(e) => update({ claudeApiKey: e.target.value })}
                  placeholder="sk-ant-..."
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none"
                />
                <button onClick={() => setShowKey(!showKey)} className="rounded-lg p-2 text-muted hover:text-foreground" aria-label={showKey ? 'Hide key' : 'Show key'}>
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted">Model</label>
              <select
                value={settings.claudeModel}
                onChange={(e) => update({ claudeModel: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none"
              >
                <option value="claude-sonnet-4-5-20250929">Claude Sonnet 4.5 (Recommended)</option>
                <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 (Fast)</option>
                <option value="claude-opus-4-6">Claude Opus 4.6 (Most capable)</option>
              </select>
            </div>
          </div>

          {/* Ollama Settings */}
          <div className="rounded-xl border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Ollama (Local)</h3>
              <div className="flex items-center gap-2">
                <StatusIcon status={ollamaStatus} />
                <button onClick={testOllama} className="rounded-lg bg-surface-2 px-2.5 py-1 text-xs text-muted hover:text-foreground">
                  Test
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted">Ollama URL</label>
              <input
                type="text"
                value={settings.ollamaUrl}
                onChange={(e) => update({ ollamaUrl: e.target.value })}
                placeholder="http://localhost:11434"
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-muted">Model</label>
              {ollamaModels.length > 0 ? (
                <select
                  value={settings.ollamaModel}
                  onChange={(e) => update({ ollamaModel: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none"
                >
                  {ollamaModels.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={settings.ollamaModel}
                  onChange={(e) => update({ ollamaModel: e.target.value })}
                  placeholder="llama3.1"
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none"
                />
              )}
              <p className="mt-1 text-[10px] text-muted">Click &quot;Test&quot; to auto-detect installed models</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
