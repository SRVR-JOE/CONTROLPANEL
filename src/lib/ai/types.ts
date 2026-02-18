// ============================================================
// AI Copilot - Type Definitions
// ============================================================

export type AIProvider = 'claude' | 'ollama';

export interface AISettings {
  provider: AIProvider;
  claudeApiKey: string;
  claudeModel: string;
  ollamaUrl: string;
  ollamaModel: string;
  autoFallback: boolean; // Fall back to Ollama when Claude is unavailable
}

export const DEFAULT_AI_SETTINGS: AISettings = {
  provider: 'claude',
  claudeApiKey: '',
  claudeModel: 'claude-sonnet-4-5-20250929',
  ollamaUrl: 'http://localhost:11434',
  ollamaModel: 'llama3.1',
  autoFallback: true,
};

export type CopilotMessageRole = 'user' | 'assistant' | 'system';

export interface CopilotMessage {
  id: string;
  role: CopilotMessageRole;
  content: string;
  timestamp: string;
  provider?: AIProvider;
  toolCalls?: ToolCallResult[];
  isStreaming?: boolean;
}

export interface ToolCallResult {
  tool: string;
  input: Record<string, unknown>;
  result: string;
  success: boolean;
}

export interface DiagnosticAlert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  deviceId?: string;
  timestamp: string;
  dismissed: boolean;
}

// Tool definitions for the AI
export interface CopilotTool {
  name: string;
  description: string;
  parameters: Record<string, {
    type: string;
    description: string;
    required?: boolean;
    enum?: string[];
  }>;
}
