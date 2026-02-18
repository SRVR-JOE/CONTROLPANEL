// ============================================================
// AI Copilot API Route
// Proxies chat requests to Claude API or Ollama
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { toAnthropicTools, toOllamaTools } from '@/lib/ai/tools';

const ALLOWED_ORIGINS = ['http://localhost:3000', 'http://localhost:3001'];

function corsHeaders(origin: string | null) {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface RequestBody {
  messages: ChatMessage[];
  systemContext: string;
  provider: 'claude' | 'ollama';
  settings: {
    claudeApiKey?: string;
    claudeModel?: string;
    ollamaUrl?: string;
    ollamaModel?: string;
    autoFallback?: boolean;
  };
}

// ---- Claude API ----
async function chatWithClaude(
  messages: ChatMessage[],
  systemContext: string,
  apiKey: string,
  model: string
): Promise<{ content: string; toolCalls?: { name: string; input: Record<string, unknown> }[] }> {
  const systemPrompt = messages.find((m) => m.role === 'system')?.content ?? '';
  const chatMessages = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role, content: m.content }));

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: `${systemPrompt}\n\n${systemContext}`,
      messages: chatMessages,
      tools: toAnthropicTools(),
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Claude API error ${response.status}: ${errText.slice(0, 200)}`);
  }

  const data = await response.json();

  // Extract text and tool use from response
  let content = '';
  const toolCalls: { name: string; input: Record<string, unknown> }[] = [];

  for (const block of data.content ?? []) {
    if (block.type === 'text') content += block.text;
    if (block.type === 'tool_use') {
      toolCalls.push({ name: block.name, input: block.input as Record<string, unknown> });
    }
  }

  return { content, toolCalls: toolCalls.length > 0 ? toolCalls : undefined };
}

// ---- Ollama API ----
async function chatWithOllama(
  messages: ChatMessage[],
  systemContext: string,
  ollamaUrl: string,
  model: string
): Promise<{ content: string; toolCalls?: { name: string; input: Record<string, unknown> }[] }> {
  const systemPrompt = messages.find((m) => m.role === 'system')?.content ?? '';

  const ollamaMessages = [
    { role: 'system', content: `${systemPrompt}\n\n${systemContext}` },
    ...messages.filter((m) => m.role !== 'system').map((m) => ({ role: m.role, content: m.content })),
  ];

  const response = await fetch(`${ollamaUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: ollamaMessages,
      tools: toOllamaTools(),
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama error ${response.status}`);
  }

  const data = await response.json();
  const content = data.message?.content ?? '';
  const toolCalls: { name: string; input: Record<string, unknown> }[] = [];

  if (data.message?.tool_calls) {
    for (const tc of data.message.tool_calls) {
      toolCalls.push({
        name: tc.function.name,
        input: tc.function.arguments ?? {},
      });
    }
  }

  return { content, toolCalls: toolCalls.length > 0 ? toolCalls : undefined };
}

// ---- Route handlers ----

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders(request.headers.get('origin')) });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);

  try {
    const contentLength = request.headers.get('content-length');
    const contentLengthNum = contentLength ? Number(contentLength) : 0;
    if (!Number.isNaN(contentLengthNum) && contentLengthNum > 100_000) {
      return NextResponse.json({ error: 'Request too large' }, { status: 413, headers });
    }

    const body: RequestBody = await request.json();

    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json({ error: 'Messages required' }, { status: 400, headers });
    }

    const { messages, systemContext, settings } = body;
    let { provider } = body;

    // Try primary provider, fall back if configured
    let lastError: string | undefined;

    if (provider === 'claude') {
      if (!settings.claudeApiKey) {
        if (settings.autoFallback) {
          provider = 'ollama';
        } else {
          return NextResponse.json({ error: 'Claude API key not configured' }, { status: 400, headers });
        }
      } else {
        try {
          const result = await chatWithClaude(
            messages,
            systemContext,
            settings.claudeApiKey,
            settings.claudeModel ?? 'claude-sonnet-4-5-20250929'
          );
          return NextResponse.json({ ...result, provider: 'claude' }, { headers });
        } catch (err) {
          lastError = err instanceof Error ? err.message : String(err);
          if (settings.autoFallback) {
            provider = 'ollama';
          } else {
            return NextResponse.json({ error: `Claude API failed: ${lastError}` }, { status: 502, headers });
          }
        }
      }
    }

    if (provider === 'ollama') {
      try {
        const result = await chatWithOllama(
          messages,
          systemContext,
          settings.ollamaUrl ?? 'http://localhost:11434',
          settings.ollamaModel ?? 'llama3.1'
        );
        return NextResponse.json({
          ...result,
          provider: 'ollama',
          fallbackReason: lastError ? `Claude unavailable: ${lastError}` : undefined,
        }, { headers });
      } catch (err) {
        const ollamaErr = err instanceof Error ? err.message : String(err);
        return NextResponse.json({
          error: lastError
            ? `Both providers failed. Claude: ${lastError}. Ollama: ${ollamaErr}`
            : `Ollama failed: ${ollamaErr}`,
        }, { status: 502, headers });
      }
    }

    return NextResponse.json({ error: 'Invalid provider' }, { status: 400, headers });
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400, headers });
  }
}
