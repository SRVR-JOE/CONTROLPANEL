import { NextRequest, NextResponse } from 'next/server';
import { commandRegistry } from '@/lib/commands/registry';
import { isAllowedTarget } from '@/lib/validateIp';
import { getCorsHeadersFromRequest } from '@/lib/cors';
import type { DeviceManufacturer } from '@/types';

const TIMEOUT_MS = 3000;

interface CommandRequest {
  deviceId: string;
  manufacturer: DeviceManufacturer;
  ip: string;
  command: string;
  params?: Record<string, unknown>;
}

interface CommandResponse {
  success: boolean;
  response?: string;
  error?: string;
  simulated?: boolean;
}

async function fetchWithTimeout(url: string, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try { return await fetch(url, { ...init, signal: controller.signal }); } finally { clearTimeout(timer); }
}

async function putJson(url: string, body: unknown): Promise<{ ok: boolean; text: string }> {
  try { const res = await fetchWithTimeout(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); const text = await res.text().catch(() => ''); return { ok: res.ok, text }; } catch (err) { throw new Error(`PUT ${url} failed: ${err instanceof Error ? err.message : String(err)}`); }
}

async function postJson(url: string, body: unknown): Promise<{ ok: boolean; text: string }> {
  try { const res = await fetchWithTimeout(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); const text = await res.text().catch(() => ''); return { ok: res.ok, text }; } catch (err) { throw new Error(`POST ${url} failed: ${err instanceof Error ? err.message : String(err)}`); }
}

async function getJson(url: string): Promise<{ ok: boolean; text: string }> {
  try { const res = await fetchWithTimeout(url, { method: 'GET' }); const text = await res.text().catch(() => ''); return { ok: res.ok, text }; } catch (err) { throw new Error(`GET ${url} failed: ${err instanceof Error ? err.message : String(err)}`); }
}

async function dispatchBrompton(ip: string, command: string, params: Record<string, unknown>): Promise<CommandResponse> {
  const base = `http://${ip}`;
  switch (command) {
    case 'set-brightness': { const { ok, text } = await putJson(`${base}/api/output/brightness`, { value: params.value }); return ok ? { success: true, response: `Brightness set to ${params.value}%` } : { success: false, error: `Device returned error: ${text}` }; }
    case 'blackout': { const { ok, text } = await putJson(`${base}/api/output/blackout`, { enabled: params.enabled }); return ok ? { success: true, response: `Blackout ${params.enabled ? 'enabled' : 'disabled'}` } : { success: false, error: `Device returned error: ${text}` }; }
    case 'freeze': { const { ok, text } = await putJson(`${base}/api/output/freeze`, { enabled: params.enabled }); return ok ? { success: true, response: `Freeze ${params.enabled ? 'enabled' : 'disabled'}` } : { success: false, error: `Device returned error: ${text}` }; }
    case 'test-pattern': { const { ok, text } = await putJson(`${base}/api/output/testPattern`, { pattern: params.pattern }); return ok ? { success: true, response: `Test pattern set to: ${params.pattern}` } : { success: false, error: `Device returned error: ${text}` }; }
    case 'set-color-temp': { const { ok, text } = await putJson(`${base}/api/output/colorTemperature`, { kelvin: params.kelvin }); return ok ? { success: true, response: `Color temperature set to ${params.kelvin}K` } : { success: false, error: `Device returned error: ${text}` }; }
    case 'select-input': { const { ok, text } = await putJson(`${base}/api/input/source`, { source: params.source }); return ok ? { success: true, response: `Input source switched to: ${params.source}` } : { success: false, error: `Device returned error: ${text}` }; }
    case 'toggle-darkmagic': { const { ok, text } = await putJson(`${base}/api/processing/darkMagic`, { enabled: params.enabled }); return ok ? { success: true, response: `DarkMagic ${params.enabled ? 'enabled' : 'disabled'}` } : { success: false, error: `Device returned error: ${text}` }; }
    case 'toggle-puretone': { const { ok, text } = await putJson(`${base}/api/processing/pureTone`, { enabled: params.enabled }); return ok ? { success: true, response: `PureTone ${params.enabled ? 'enabled' : 'disabled'}` } : { success: false, error: `Device returned error: ${text}` }; }
    case 'identify-panel': { const { ok, text } = await postJson(`${base}/api/panels/identify`, { panelId: params.panelId, duration: params.duration }); return ok ? { success: true, response: `Identifying panel ${params.panelId} for ${params.duration}s` } : { success: false, error: `Device returned error: ${text}` }; }
    case 'reload-panels': { const { ok, text } = await postJson(`${base}/api/panels/reload`, {}); return ok ? { success: true, response: 'Panel reload initiated' } : { success: false, error: `Device returned error: ${text}` }; }
    default: return { success: false, error: `Unknown Brompton command: ${command}` };
  }
}

async function dispatchDisguise(ip: string, command: string, params: Record<string, unknown>): Promise<CommandResponse> {
  const base = `http://${ip}/api`;
  switch (command) {
    case 'play': { const { ok, text } = await postJson(`${base}/transport/play`, {}); return ok ? { success: true, response: 'Playback started' } : { success: false, error: `Device returned error: ${text}` }; }
    case 'stop': { const { ok, text } = await postJson(`${base}/transport/stop`, {}); return ok ? { success: true, response: 'Transport stopped' } : { success: false, error: `Device returned error: ${text}` }; }
    case 'goto-cue': { const { ok, text } = await postJson(`${base}/transport/cue`, { cueId: params.cueId }); return ok ? { success: true, response: `Jumped to cue: ${params.cueId}` } : { success: false, error: `Device returned error: ${text}` }; }
    case 'jump-timecode': { const { ok, text } = await postJson(`${base}/transport/timecode`, { timecode: params.timecode }); return ok ? { success: true, response: `Seeked to timecode: ${params.timecode}` } : { success: false, error: `Device returned error: ${text}` }; }
    case 'restart-service': { const { ok, text } = await postJson(`${base}/system/restart`, {}); return ok ? { success: true, response: 'd3 service restart initiated' } : { success: false, error: `Device returned error: ${text}` }; }
    case 'understudy-takeover': { const { ok, text } = await postJson(`${base}/session/understudyTakeover`, { actorIndex: params.actorIndex }); return ok ? { success: true, response: `Understudy takeover initiated for actor index ${params.actorIndex}` } : { success: false, error: `Device returned error: ${text}` }; }
    default: return { success: false, error: `Unknown Disguise command: ${command}` };
  }
}

async function dispatchAJA(ip: string, command: string, params: Record<string, unknown>): Promise<CommandResponse> {
  const configUrl = `http://${ip}/config`;
  switch (command) {
    case 'set-crosspoint': { const output = Number(params.output); const input = Number(params.input); if (!output || !input) return { success: false, error: 'set-crosspoint requires numeric input and output params' }; const body = { [`eParamID_XPT_Destination${output}_Status`]: input }; const { ok, text } = await putJson(configUrl, body); return ok ? { success: true, response: `Routed input ${input} -> output ${output}` } : { success: false, error: `AJA returned error: ${text}` }; }
    case 'get-status': { const { ok, text } = await getJson(configUrl); if (!ok) return { success: false, error: `AJA returned error: ${text}` }; try { const config = JSON.parse(text) as Record<string, unknown>; return { success: true, response: `Router: ${config['eParamID_NumberOfVideoInputs'] ?? '?'}x${config['eParamID_NumberOfVideoOutputs'] ?? '?'}. Full config retrieved (${text.length} bytes).` }; } catch { return { success: true, response: `Config retrieved (${text.length} bytes)` }; } }
    case 'label-input': { const index = Number(params.index); if (!index) return { success: false, error: 'label-input requires a numeric index param' }; const body = { [`eParamID_Input${index}_Label`]: params.label }; const { ok, text } = await putJson(configUrl, body); return ok ? { success: true, response: `Input ${index} labelled as "${params.label}"` } : { success: false, error: `AJA returned error: ${text}` }; }
    case 'label-output': { const index = Number(params.index); if (!index) return { success: false, error: 'label-output requires a numeric index param' }; const body = { [`eParamID_Output${index}_Label`]: params.label }; const { ok, text } = await putJson(configUrl, body); return ok ? { success: true, response: `Output ${index} labelled as "${params.label}"` } : { success: false, error: `AJA returned error: ${text}` }; }
    default: return { success: false, error: `Unknown AJA command: ${command}` };
  }
}

async function dispatchLightware(ip: string, command: string, params: Record<string, unknown>): Promise<CommandResponse> {
  const base = `http://${ip}`;
  switch (command) {
    case 'set-crosspoint': { const output = Number(params.output); const input = Number(params.input); if (!output || !input) return { success: false, error: 'set-crosspoint requires numeric input and output params' }; const { ok, text } = await putJson(`${base}/api/MEDIA/VIDEO/XP/O${output}/Source`, { Source: `I${input}` }); return ok ? { success: true, response: `Routed input ${input} -> output ${output}` } : { success: false, error: `Lightware returned error: ${text}` }; }
    default: return { success: false, error: `Unknown Lightware command: ${command}` };
  }
}

async function dispatchBlackmagic(ip: string, command: string, params: Record<string, unknown>): Promise<CommandResponse> {
  const base = `http://${ip}/control/api/v1`;
  switch (command) {
    case 'set-crosspoint': { const output = Number(params.output); const input = Number(params.input); if (!output || !input) return { success: false, error: 'set-crosspoint requires numeric input and output params' }; const { ok, text } = await putJson(`${base}/router/routing`, { videoSource: input, videoDestination: output }); return ok ? { success: true, response: `Routed input ${input} -> output ${output}` } : { success: false, error: `Blackmagic returned error: ${text}` }; }
    default: return { success: false, error: `Unknown Blackmagic command: ${command}` };
  }
}

async function dispatchCommand(req: CommandRequest): Promise<CommandResponse> {
  const { manufacturer, ip, command, params = {} } = req;
  try {
    switch (manufacturer) {
      case 'brompton': return await dispatchBrompton(ip, command, params);
      case 'disguise': return await dispatchDisguise(ip, command, params);
      case 'aja': return await dispatchAJA(ip, command, params);
      case 'lightware': return await dispatchLightware(ip, command, params);
      case 'blackmagic': return await dispatchBlackmagic(ip, command, params);
      default: return { success: true, response: `[Simulated] Command "${command}" acknowledged by ${manufacturer} device at ${ip}`, simulated: true };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('abort') || message.includes('timeout') || message.includes('ECONNREFUSED')) return { success: false, error: `Device at ${ip} did not respond within ${TIMEOUT_MS / 1000}s — check network connectivity` };
    return { success: false, error: message };
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: getCorsHeadersFromRequest(request) });
}

export async function POST(request: NextRequest) {
  const corsHeaders = getCorsHeadersFromRequest(request);
  try {
    let body: CommandRequest;
    try { body = await request.json(); } catch { return NextResponse.json({ success: false, error: 'Invalid JSON in request body' }, { status: 400, headers: corsHeaders }); }
    const { deviceId, manufacturer, ip, command } = body;
    if (!deviceId || typeof deviceId !== 'string') return NextResponse.json({ success: false, error: 'Missing or invalid field: deviceId' }, { status: 400, headers: corsHeaders });
    if (!manufacturer || typeof manufacturer !== 'string') return NextResponse.json({ success: false, error: 'Missing or invalid field: manufacturer' }, { status: 400, headers: corsHeaders });
    if (!ip || typeof ip !== 'string') return NextResponse.json({ success: false, error: 'Missing or invalid field: ip' }, { status: 400, headers: corsHeaders });
    if (!isAllowedTarget(ip)) return NextResponse.json({ success: false, error: 'Invalid or disallowed target IP address' }, { status: 400, headers: corsHeaders });
    if (!command || typeof command !== 'string') return NextResponse.json({ success: false, error: 'Missing or invalid field: command' }, { status: 400, headers: corsHeaders });
    const manufacturerCommands = commandRegistry[manufacturer];
    if (manufacturerCommands) {
      const knownCommand = manufacturerCommands.find((c) => c.type === command);
      if (!knownCommand) return NextResponse.json({ success: false, error: `Unknown command "${command}" for manufacturer "${manufacturer}". Known commands: ${manufacturerCommands.map((c) => c.type).join(', ')}` }, { status: 400, headers: corsHeaders });
    }
    const result = await dispatchCommand(body);
    return NextResponse.json(result, { status: result.success ? 200 : 502, headers: corsHeaders });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Internal server error', details: String(err) }, { status: 500, headers: corsHeaders });
  }
}
