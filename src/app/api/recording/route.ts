import { NextRequest, NextResponse } from 'next/server';
import * as net from 'net';
import { isAllowedTarget } from '@/lib/validateIp';
import { stripControlChars, validateSlotId } from '@/lib/sanitize';
import { getCorsHeadersFromRequest } from '@/lib/cors';
const TIMEOUT_MS = 4000;
export type RecorderType = 'hyperdeck' | 'kipro' | 'generic';
export type TransportAction = 'record' | 'stop' | 'play' | 'ff' | 'rew';
export type RecordingAction = 'connect' | 'transport' | 'status' | 'clips' | 'settings' | 'set-settings';
interface RecordingRequest { action: RecordingAction; ip: string; type: RecorderType; transport?: TransportAction; slotId?: number; settings?: { fileFormat?: string; inputSource?: string; filenamePrefix?: string; }; }
export interface SlotInfo { slotId: number; status: 'empty' | 'mounted' | 'recording' | 'busy'; volumeName?: string; recordingTime?: number; totalSpace?: number; freeSpace?: number; }
export interface TransportStatus { status: 'recording' | 'stopped' | 'playing' | 'preview' | 'forward' | 'rewind' | 'unknown'; timecode: string; clipId?: number; clipName?: string; loop?: boolean; singleClip?: boolean; speed?: number; slotId?: number; }
export interface ClipInfo { clipId: number; name: string; duration: string; format?: string; resolution?: string; frameRate?: string; fileSize?: number; startTimecode?: string; }
export interface RecordingSettings { fileFormat?: string; inputSource?: string; filenamePrefix?: string; videoFormat?: string; audioInput?: string; }
export interface RecordingResponse { success: boolean; simulated?: boolean; error?: string; transport?: TransportStatus; slots?: SlotInfo[]; clips?: ClipInfo[]; settings?: RecordingSettings; connected?: boolean; deviceInfo?: { model?: string; firmware?: string; protocolVersion?: string }; }
async function fetchWithTimeout(url: string, init: RequestInit = {}): Promise<Response> { const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), TIMEOUT_MS); try { return await fetch(url, { ...init, signal: controller.signal }); } finally { clearTimeout(timer); } }
function sendHyperDeckCommand(ip: string, port: number, commands: string[]): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const responses: string[] = [];
    let buffer = '';
    const socket = new net.Socket();
    const done = () => { socket.destroy(); resolve(responses); };
    const fail = (msg: string) => { socket.destroy(); reject(new Error(msg)); };
    const timer = setTimeout(() => fail(`HyperDeck at ${ip}:${port} timed out`), TIMEOUT_MS);
    socket.connect(port, ip, () => { for (const cmd of commands) socket.write(cmd + '\n'); });
    socket.on('data', (chunk) => {
      buffer += chunk.toString();
      const blocks = buffer.split('\r\n\r\n');
      for (let i = 0; i < blocks.length - 1; i++) responses.push(blocks[i].trim());
      buffer = blocks[blocks.length - 1];
      if (responses.length >= commands.length) { clearTimeout(timer); done(); }
    });
    socket.on('error', (err) => { clearTimeout(timer); fail(err.message); });
    socket.on('close', () => { clearTimeout(timer); resolve(responses); });
  });
}
function parseHyperDeckBlock(block: string): { code: number; message: string; data: Record<string, string> } {
  const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
  let code = 200; let message = ''; const data: Record<string, string> = {};
  for (const line of lines) {
    const codeMatch = line.match(/^(\d{3})\s+(.*)$/);
    if (codeMatch) { code = parseInt(codeMatch[1], 10); message = codeMatch[2]; continue; }
    const kvMatch = line.match(/^([^:]+):\s*(.*)$/);
    if (kvMatch) data[kvMatch[1].trim()] = kvMatch[2].trim();
  }
  return { code, message, data };
}
function parseTimecode(tc: string): string { return tc || '00:00:00:00'; }
async function dispatchHyperDeck(ip: string, action: RecordingAction, req: RecordingRequest): Promise<RecordingResponse> {
  const port = 9990;
  switch (action) {
    case 'connect': { try { const responses = await sendHyperDeckCommand(ip, port, ['device info']); const parsed = parseHyperDeckBlock(responses[0] ?? ''); if (parsed.code !== 200 && parsed.code !== 204) return { success: false, error: `HyperDeck refused connection: ${parsed.message}` }; return { success: true, connected: true, deviceInfo: { model: parsed.data['model'] ?? 'HyperDeck', firmware: parsed.data['software version'] ?? undefined, protocolVersion: parsed.data['protocol version'] ?? undefined } }; } catch (err) { return { success: false, error: (err as Error).message }; } }
    case 'transport': { const transportCmd = req.transport; const cmdMap: Record<TransportAction, string> = { record: 'record', stop: 'stop', play: 'play', ff: 'jog: speed: 2', rew: 'jog: speed: -2' }; if (!transportCmd || !cmdMap[transportCmd]) return { success: false, error: `Unknown transport action: ${transportCmd}` }; try { const responses = await sendHyperDeckCommand(ip, port, [cmdMap[transportCmd]]); const parsed = parseHyperDeckBlock(responses[0] ?? ''); const ok = parsed.code === 200 || parsed.code === 204 || parsed.code === 0; return ok ? { success: true } : { success: false, error: `HyperDeck error ${parsed.code}: ${parsed.message}` }; } catch (err) { return { success: false, error: (err as Error).message }; } }
    case 'status': { try { const responses = await sendHyperDeckCommand(ip, port, ['transport info', 'slot info: slot id: 1', 'slot info: slot id: 2']); const transportBlock = parseHyperDeckBlock(responses[0] ?? ''); const slot1Block = parseHyperDeckBlock(responses[1] ?? ''); const slot2Block = parseHyperDeckBlock(responses[2] ?? ''); const statusMap: Record<string, TransportStatus['status']> = { record: 'recording', stopped: 'stopped', play: 'playing', preview: 'preview', forward: 'forward', rewind: 'rewind' }; const rawStatus = transportBlock.data['status'] ?? 'stopped'; const transportStatus: TransportStatus = { status: statusMap[rawStatus] ?? 'stopped', timecode: parseTimecode(transportBlock.data['timecode'] ?? ''), clipId: transportBlock.data['clip id'] ? parseInt(transportBlock.data['clip id'], 10) : undefined, slotId: transportBlock.data['slot id'] ? parseInt(transportBlock.data['slot id'], 10) : 1, speed: transportBlock.data['speed'] ? parseInt(transportBlock.data['speed'], 10) : undefined }; const buildSlotInfo = (block: typeof slot1Block, id: number): SlotInfo => { const slotStatusMap: Record<string, SlotInfo['status']> = { empty: 'empty', mounted: 'mounted', recording: 'recording', busy: 'busy' }; const rawSlotStatus = block.data['status'] ?? 'empty'; const totalBytes = block.data['total size'] ? parseInt(block.data['total size'], 10) * 1024 * 1024 : 0; const usedBytes = 0; const recTimeSeconds = block.data['recording time'] ? parseInt(block.data['recording time'], 10) * 60 : 0; return { slotId: id, status: slotStatusMap[rawSlotStatus] ?? 'empty', volumeName: block.data['volume name'] ?? undefined, recordingTime: recTimeSeconds, totalSpace: totalBytes, freeSpace: totalBytes - usedBytes }; }; return { success: true, transport: transportStatus, slots: [buildSlotInfo(slot1Block, 1), buildSlotInfo(slot2Block, 2)] }; } catch (err) { return { success: false, error: (err as Error).message }; } }
    case 'clips': { const slotId = validateSlotId(req.slotId ?? 1); try { const responses = await sendHyperDeckCommand(ip, port, [`clips get: slot id: ${slotId}`]); const block = parseHyperDeckBlock(responses[0] ?? ''); const clips: ClipInfo[] = []; for (const [key, value] of Object.entries(block.data)) { const idMatch = key.match(/^(\d+)$/); if (idMatch) { const parts = value.split(' '); const clipId = parseInt(idMatch[1], 10); clips.push({ clipId, name: parts[0] ?? `Clip ${clipId}`, startTimecode: parts[1] ?? '00:00:00:00', duration: parts[2] ?? '00:00:00:00', format: parts[3] ?? '' }); } } return { success: true, clips }; } catch (err) { return { success: false, error: (err as Error).message }; } }
    case 'settings': { try { const responses = await sendHyperDeckCommand(ip, port, ['configuration']); const block = parseHyperDeckBlock(responses[0] ?? ''); return { success: true, settings: { fileFormat: block.data['file format'] ?? undefined, videoFormat: block.data['video format'] ?? undefined, audioInput: block.data['audio input'] ?? undefined } }; } catch (err) { return { success: false, error: (err as Error).message }; } }
    case 'set-settings': { const s = req.settings ?? {}; const cmds: string[] = []; if (s.fileFormat) { const safe = stripControlChars(s.fileFormat); if (safe) cmds.push(`configuration: file format: ${safe}`); } if (s.inputSource) { const safe = stripControlChars(s.inputSource); if (safe) cmds.push(`configuration: video format: ${safe}`); } if (cmds.length === 0) return { success: true }; try { await sendHyperDeckCommand(ip, port, cmds); return { success: true }; } catch (err) { return { success: false, error: (err as Error).message }; } }
    default: return { success: false, error: `Unknown action: ${action}` };
  }
}
const KI_PRO_PARAMS = { TRANSPORT_STATE: 'eParamID_TransportState', RECORD: 'eParamID_RecordCommand', STOP: 'eParamID_StopCommand', PLAY: 'eParamID_PlayCommand', FAST_FWD: 'eParamID_FastForwardCommand', REWIND: 'eParamID_ReverseCommand', TIMECODE: 'eParamID_DisplayTimecode', CLIP_NAME: 'eParamID_ClipName', MEDIA_STATE: 'eParamID_MediaState', REMAINING_TIME: 'eParamID_MediaRemainingTime', TOTAL_SPACE: 'eParamID_MediaTotalSpace', USED_SPACE: 'eParamID_MediaUsedSpace', FILE_FORMAT: 'eParamID_RecordFileFormat', VIDEO_INPUT: 'eParamID_VideoInput', FILENAME_PREFIX: 'eParamID_FilenamePrefix' };
async function kiProGet(ip: string, paramId: string): Promise<string | null> { try { const res = await fetchWithTimeout(`http://${ip}/config?action=get&paramid=${paramId}`); if (!res.ok) return null; const data = await res.json() as { value?: string | number }; return String(data.value ?? ''); } catch { return null; } }
async function kiProSet(ip: string, paramId: string, value: string | number): Promise<boolean> { try { const res = await fetchWithTimeout(`http://${ip}/config?action=set&paramid=${paramId}&value=${encodeURIComponent(String(value))}`, { method: 'POST' }); return res.ok; } catch { return false; } }
async function dispatchKiPro(ip: string, action: RecordingAction, req: RecordingRequest): Promise<RecordingResponse> {
  switch (action) {
    case 'connect': { const state = await kiProGet(ip, KI_PRO_PARAMS.TRANSPORT_STATE); if (state === null) return { success: false, error: `Cannot reach Ki Pro at ${ip}` }; return { success: true, connected: true, deviceInfo: { model: 'AJA Ki Pro' } }; }
    case 'transport': { const transportCmd = req.transport; const paramMap: Record<TransportAction, [string, string]> = { record: [KI_PRO_PARAMS.RECORD, '1'], stop: [KI_PRO_PARAMS.STOP, '1'], play: [KI_PRO_PARAMS.PLAY, '1'], ff: [KI_PRO_PARAMS.FAST_FWD, '1'], rew: [KI_PRO_PARAMS.REWIND, '1'] }; if (!transportCmd || !paramMap[transportCmd]) return { success: false, error: `Unknown transport action: ${transportCmd}` }; const [paramId, value] = paramMap[transportCmd]; const ok = await kiProSet(ip, paramId, value); return ok ? { success: true } : { success: false, error: 'Ki Pro did not acknowledge transport command' }; }
    case 'status': { const [state, tc, clipName, remaining, total, used] = await Promise.all([kiProGet(ip, KI_PRO_PARAMS.TRANSPORT_STATE), kiProGet(ip, KI_PRO_PARAMS.TIMECODE), kiProGet(ip, KI_PRO_PARAMS.CLIP_NAME), kiProGet(ip, KI_PRO_PARAMS.REMAINING_TIME), kiProGet(ip, KI_PRO_PARAMS.TOTAL_SPACE), kiProGet(ip, KI_PRO_PARAMS.USED_SPACE)]); const kiProStateMap: Record<string, TransportStatus['status']> = { '0': 'stopped', '1': 'playing', '2': 'recording', '3': 'forward', '4': 'rewind' }; const totalBytes = total ? parseInt(total, 10) * 1024 * 1024 : 0; const usedBytes = used ? parseInt(used, 10) * 1024 * 1024 : 0; return { success: true, transport: { status: kiProStateMap[state ?? '0'] ?? 'stopped', timecode: tc ?? '00:00:00:00', clipName: clipName ?? undefined }, slots: [{ slotId: 1, status: totalBytes > 0 ? 'mounted' : 'empty', recordingTime: remaining ? parseInt(remaining, 10) * 60 : 0, totalSpace: totalBytes, freeSpace: totalBytes - usedBytes }] }; }
    case 'clips': { return { success: true, clips: [] }; }
    case 'settings': { const [fmt, input, prefix] = await Promise.all([kiProGet(ip, KI_PRO_PARAMS.FILE_FORMAT), kiProGet(ip, KI_PRO_PARAMS.VIDEO_INPUT), kiProGet(ip, KI_PRO_PARAMS.FILENAME_PREFIX)]); return { success: true, settings: { fileFormat: fmt ?? undefined, inputSource: input ?? undefined, filenamePrefix: prefix ?? undefined } }; }
    case 'set-settings': { const s = req.settings ?? {}; const tasks: Promise<boolean>[] = []; if (s.fileFormat) tasks.push(kiProSet(ip, KI_PRO_PARAMS.FILE_FORMAT, s.fileFormat)); if (s.inputSource) tasks.push(kiProSet(ip, KI_PRO_PARAMS.VIDEO_INPUT, s.inputSource)); if (s.filenamePrefix) tasks.push(kiProSet(ip, KI_PRO_PARAMS.FILENAME_PREFIX, s.filenamePrefix)); const results = await Promise.all(tasks); return results.every(Boolean) ? { success: true } : { success: false, error: 'Some settings failed to apply' }; }
    default: return { success: false, error: `Unknown action: ${action}` };
  }
}
function simulatedTimecode(): string { const now = new Date(); return `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}:${String(Math.floor(now.getMilliseconds()/33.33)).padStart(2,'0')}`; }
async function dispatchGeneric(_ip: string, action: RecordingAction, _request: RecordingRequest): Promise<RecordingResponse> {
  switch (action) {
    case 'connect': return { success: true, connected: true, simulated: true, deviceInfo: { model: 'Generic Recorder' } };
    case 'transport': return { success: true, simulated: true };
    case 'status': return { success: true, simulated: true, transport: { status: 'stopped', timecode: simulatedTimecode() }, slots: [{ slotId: 1, status: 'mounted', recordingTime: 7200, totalSpace: 2_000_000_000_000, freeSpace: 1_500_000_000_000 }] };
    case 'clips': return { success: true, simulated: true, clips: [{ clipId: 1, name: 'Clip_001', duration: '00:10:23:12', format: 'ProRes HQ', resolution: '1920x1080', frameRate: '25' }, { clipId: 2, name: 'Clip_002', duration: '00:05:44:00', format: 'ProRes HQ', resolution: '1920x1080', frameRate: '25' }, { clipId: 3, name: 'Rehearsal_001', duration: '00:32:15:07', format: 'ProRes HQ', resolution: '1920x1080', frameRate: '25' }] };
    case 'settings': case 'set-settings': return { success: true, simulated: true, settings: { fileFormat: 'ProRes HQ', inputSource: 'SDI 1', filenamePrefix: 'Clip' } };
    default: return { success: false, error: `Unknown action: ${action}` };
  }
}
async function dispatch(req: RecordingRequest): Promise<RecordingResponse> {
  const { type, ip, action } = req;
  try {
    switch (type) { case 'hyperdeck': return await dispatchHyperDeck(ip, action, req); case 'kipro': return await dispatchKiPro(ip, action, req); case 'generic': default: return await dispatchGeneric(ip, action, req); }
  } catch (err) { const msg = err instanceof Error ? err.message : String(err); if (msg.includes('abort') || msg.includes('timeout') || msg.includes('ECONNREFUSED') || msg.includes('timed out')) return { success: false, error: `Device at ${ip} did not respond within ${TIMEOUT_MS / 1000}s — check network connectivity` }; return { success: false, error: msg }; }
}
export async function OPTIONS(request: NextRequest) { return new NextResponse(null, { status: 204, headers: getCorsHeadersFromRequest(request) }); }
export async function POST(request: NextRequest) {
  const corsHeaders = getCorsHeadersFromRequest(request);
  try {
    let body: RecordingRequest;
    try { body = await request.json(); } catch { return NextResponse.json({ success: false, error: 'Invalid JSON in request body' }, { status: 400, headers: corsHeaders }); }
    const { action, ip, type } = body;
    if (!action || typeof action !== 'string') return NextResponse.json({ success: false, error: 'Missing or invalid field: action' }, { status: 400, headers: corsHeaders });
    if (!ip || typeof ip !== 'string') return NextResponse.json({ success: false, error: 'Missing or invalid field: ip' }, { status: 400, headers: corsHeaders });
    if (!isAllowedTarget(ip)) return NextResponse.json({ success: false, error: 'Invalid or disallowed target IP address' }, { status: 400, headers: corsHeaders });
    if (!type || !['hyperdeck', 'kipro', 'generic'].includes(type)) return NextResponse.json({ success: false, error: 'Missing or invalid field: type (must be hyperdeck | kipro | generic)' }, { status: 400, headers: corsHeaders });
    const result = await dispatch(body);
    return NextResponse.json(result, { status: result.success ? 200 : 502, headers: corsHeaders });
  } catch (err) { return NextResponse.json({ success: false, error: 'Internal server error', details: String(err) }, { status: 500, headers: corsHeaders }); }
}
