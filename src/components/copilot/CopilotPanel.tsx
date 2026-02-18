'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Bot, User, Wrench, AlertTriangle, Settings, ChevronDown, Sparkles, Loader2 } from 'lucide-react';
import { useStore } from '@/store';
import { buildSystemContext, SYSTEM_PROMPT } from '@/lib/ai/context';
import { executeTool } from '@/lib/ai/tools';
import type { CopilotMessage, AISettings, ToolCallResult, DiagnosticAlert, AIProvider } from '@/lib/ai/types';
import { DEFAULT_AI_SETTINGS } from '@/lib/ai/types';
import { v4 as uuidv4 } from 'uuid';

interface CopilotPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  diagnosticAlerts: DiagnosticAlert[];
  onDismissAlert: (id: string) => void;
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

export default function CopilotPanel({ isOpen, onClose, onOpenSettings, diagnosticAlerts, onDismissAlert }: CopilotPanelProps) {
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Store access for tools
  const store = useStore();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);
  useEffect(() => { if (isOpen) inputRef.current?.focus(); }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const activeAlerts = diagnosticAlerts.filter((a) => !a.dismissed);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const settings = loadSettings();
    const userMsg: CopilotMessage = {
      id: uuidv4(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Build system context from current app state
    const systemContext = buildSystemContext({
      devices: store.devices,
      racks: store.racks,
      routers: store.routers,
      bromptonStatuses: store.bromptonStatuses,
      disguiseSessions: store.disguiseSessions,
      deploymentJobs: store.deploymentJobs,
      matrixPresets: store.matrixPresets,
      selectedSessionId: store.selectedSessionId,
    });

    // Build message history for API
    const apiMessages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      ...messages.filter((m) => m.role !== 'system').map((m) => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: text },
    ];

    try {
      const response = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          systemContext,
          provider: settings.provider,
          settings: {
            claudeApiKey: settings.claudeApiKey,
            claudeModel: settings.claudeModel,
            ollamaUrl: settings.ollamaUrl,
            ollamaModel: settings.ollamaModel,
            autoFallback: settings.autoFallback,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? `API error ${response.status}`);
      }

      // Execute any tool calls
      const toolResults: ToolCallResult[] = [];
      if (data.toolCalls) {
        for (const tc of data.toolCalls) {
          const result = executeTool(tc.name, tc.input, {
            getState: () => useStore.getState(),
            setRoute: useStore.getState().setRoute,
            recallMatrixPreset: useStore.getState().recallMatrixPreset,
            sendCommand: useStore.getState().sendCommand,
            startDeployment: useStore.getState().startDeployment,
          });
          toolResults.push(result);
        }
      }

      const assistantMsg: CopilotMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: data.content || (toolResults.length > 0 ? 'Actions executed.' : 'No response.'),
        timestamp: new Date().toISOString(),
        provider: data.provider as AIProvider,
        toolCalls: toolResults.length > 0 ? toolResults : undefined,
      };

      // If there was a fallback, prepend a notice
      if (data.fallbackReason) {
        assistantMsg.content = `*[Fell back to Ollama: ${data.fallbackReason}]*\n\n${assistantMsg.content}`;
      }

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg: CopilotMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: `**Error:** ${err instanceof Error ? err.message : 'Failed to reach AI provider'}.\n\nCheck your settings — make sure your API key is set (for Claude) or Ollama is running locally.`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, store]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="AI Copilot"
      className="fixed right-0 top-0 z-50 flex h-screen w-[420px] flex-col border-l border-border bg-surface/95 backdrop-blur-xl shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          <span className="text-sm font-bold">AI Copilot</span>
          {loadSettings().provider === 'claude' && (
            <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-medium text-accent">Claude</span>
          )}
          {loadSettings().provider === 'ollama' && (
            <span className="rounded bg-green-500/15 px-1.5 py-0.5 text-[10px] font-medium text-green-400">Ollama</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenSettings}
            className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-foreground"
            aria-label="Copilot settings"
          >
            <Settings className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-foreground"
            aria-label="Close copilot"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Diagnostic Alerts Banner */}
      {activeAlerts.length > 0 && (
        <div className="border-b border-border">
          <button
            onClick={() => setShowAlerts(!showAlerts)}
            className="flex w-full items-center justify-between px-4 py-2 text-xs hover:bg-surface-2"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-warning" />
              <span className="text-warning font-medium">{activeAlerts.length} diagnostic alert{activeAlerts.length !== 1 ? 's' : ''}</span>
            </div>
            <ChevronDown className={`h-3.5 w-3.5 text-muted transition-transform ${showAlerts ? 'rotate-180' : ''}`} />
          </button>
          {showAlerts && (
            <div className="max-h-40 overflow-y-auto px-4 pb-2">
              {activeAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`mb-1 flex items-start justify-between rounded-lg px-2.5 py-1.5 text-xs ${
                    alert.severity === 'critical' ? 'bg-error/10 text-error' :
                    alert.severity === 'warning' ? 'bg-warning/10 text-warning' :
                    'bg-accent/10 text-accent'
                  }`}
                >
                  <div>
                    <div className="font-medium">{alert.title}</div>
                    <div className="opacity-80">{alert.message}</div>
                  </div>
                  <button
                    onClick={() => onDismissAlert(alert.id)}
                    className="ml-2 shrink-0 opacity-50 hover:opacity-100"
                    aria-label="Dismiss alert"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted">
            <Sparkles className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm font-medium mb-1">AV Control Copilot</p>
            <p className="text-xs max-w-[280px] opacity-70">
              Ask about device health, route signals, recall presets, deploy configs, or run diagnostics — all in natural language.
            </p>
            <div className="mt-4 flex flex-col gap-1.5">
              {['Which devices have warnings?', 'Route input 1 to output 3 on the Lightware', 'Run diagnostics on all devices'].map((q) => (
                <button
                  key={q}
                  onClick={() => { setInput(q); inputRef.current?.focus(); }}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted hover:bg-surface-2 hover:text-foreground text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'assistant' && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/15">
                <Bot className="h-4 w-4 text-accent" />
              </div>
            )}
            <div className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-accent text-white'
                : 'bg-surface-2 text-foreground'
            }`}>
              {msg.role === 'assistant' ? (
                <div className="whitespace-pre-wrap break-words [&_strong]:font-bold [&_code]:rounded [&_code]:bg-background/50 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs">
                  {msg.content}
                </div>
              ) : (
                <div className="whitespace-pre-wrap break-words">{msg.content}</div>
              )}

              {/* Tool call results */}
              {msg.toolCalls && msg.toolCalls.length > 0 && (
                <div className="mt-2 space-y-1 border-t border-border/30 pt-2">
                  {msg.toolCalls.map((tc, i) => (
                    <div key={i} className={`flex items-start gap-1.5 rounded-md px-2 py-1 text-xs ${tc.success ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                      <Wrench className="h-3 w-3 mt-0.5 shrink-0" />
                      <span>{tc.result}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Provider badge */}
              {msg.provider && (
                <div className="mt-1.5 text-[10px] opacity-40">
                  via {msg.provider === 'claude' ? 'Claude' : 'Ollama'}
                </div>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface-2">
                <User className="h-4 w-4 text-muted" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/15">
              <Bot className="h-4 w-4 text-accent" />
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-surface-2 px-3.5 py-2.5 text-sm text-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              Thinking...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-3">
        <div className="flex items-end gap-2 rounded-xl bg-surface-2 px-3 py-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything or give a command..."
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none"
            style={{ maxHeight: '120px' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 120) + 'px';
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-white transition-opacity disabled:opacity-30"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
