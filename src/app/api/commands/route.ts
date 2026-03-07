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

/** Tessera SX40 API requires PUT body wrapped in {"data": value} */
async function putTessera(url: string, value: unknown): Promise<{ ok: boolean; text: string }> {
  return putJson(url, { data: value });
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
    case 'set-brightness': { const pct = Number(params.value); const scaled = Math.round(pct * 100); const { ok, text } = await putTessera(`${base}/api/output/global-colour/brightness`, scaled); return ok ? { success: true, response: `Brightness set to ${pct}% (${scaled}/10000)` } : { success: false, error: `Device returned error: ${text}` }; }
    case 'set-blackout': {
      const results: string[] = [];
      const { ok, text } = await putTessera(`${base}/api/override/blackout/enabled`, params.enabled);
      if (!ok) return { success: false, error: `Device returned error: ${text}` };
      results.push(`Blackout ${params.enabled ? 'enabled' : 'disabled'}`);
      if (params.fadeTime !== undefined) {
        const fade = await putTessera(`${base}/api/override/blackout/fade-time`, Number(params.fadeTime));
        if (fade.ok) results.push(`fade time ${params.fadeTime}s`);
      }
      return { success: true, response: results.join(', ') };
    }
    case 'set-freeze': {
      const { ok, text } = await putTessera(`${base}/api/override/freeze/enabled`, params.enabled);
      return ok
        ? { success: true, response: `Freeze ${params.enabled ? 'enabled' : 'disabled'}` }
        : { success: false, error: `Device returned error: ${text}` };
    }
    case 'set-test-pattern': {
      const results: string[] = [];
      if (params.enabled !== undefined) {
        const en = await putTessera(`${base}/api/override/test-pattern/enabled`, params.enabled);
        if (!en.ok) return { success: false, error: `Device returned error: ${en.text}` };
        results.push(`Test pattern ${params.enabled ? 'enabled' : 'disabled'}`);
      }
      if (params.type) {
        const tp = await putTessera(`${base}/api/override/test-pattern/type`, params.type);
        if (!tp.ok) return { success: false, error: `Device returned error setting type: ${tp.text}` };
        results.push(`type: ${params.type}`);
      }
      return { success: true, response: results.join(', ') || 'Test pattern updated' };
    }
    case 'set-color-temp': { const { ok, text } = await putTessera(`${base}/api/output/global-colour/colour-temperature`, Number(params.kelvin)); return ok ? { success: true, response: `Color temperature set to ${params.kelvin}K` } : { success: false, error: `Device returned error: ${text}` }; }
    case 'select-input': { const src = String(params.source).trim().toUpperCase(); const match = src.match(/^(HDMI|SDI)\s*(\d+)$/); if (!match) return { success: false, error: `Invalid source format "${params.source}". Expected "HDMI 1", "SDI 1", "SDI 2", etc.` }; const portType = match[1].toLowerCase(); const portNumber = Number(match[2]) - 1; const { ok, text } = await putTessera(`${base}/api/input/active/source`, { 'port-type': portType, 'port-number': portNumber }); return ok ? { success: true, response: `Input source switched to: ${params.source}` } : { success: false, error: `Device returned error: ${text}` }; }
    case 'toggle-darkmagic': { const { ok, text } = await putTessera(`${base}/api/output/global-colour/dark-magic/enabled`, Boolean(params.enabled)); return ok ? { success: true, response: `DarkMagic ${params.enabled ? 'enabled' : 'disabled'}` } : { success: false, error: `Device returned error: ${text}` }; }
    case 'toggle-puretone': { const { ok, text } = await putTessera(`${base}/api/output/global-colour/puretone/enabled`, Boolean(params.enabled)); return ok ? { success: true, response: `PureTone ${params.enabled ? 'enabled' : 'disabled'}` } : { success: false, error: `Device returned error: ${text}` }; }
    case 'set-gamma': { const { ok, text } = await putTessera(`${base}/api/output/global-colour/gamma`, Number(params.gamma)); return ok ? { success: true, response: `Gamma set to ${params.gamma}` } : { success: false, error: `Device returned error: ${text}` }; }
    case 'set-gains': { const { ok, text } = await putTessera(`${base}/api/output/global-colour/gains`, { red: Number(params.red), green: Number(params.green), blue: Number(params.blue), intensity: Number(params.intensity) }); return ok ? { success: true, response: `Gains set to R:${params.red} G:${params.green} B:${params.blue} I:${params.intensity}` } : { success: false, error: `Device returned error: ${text}` }; }
    case 'toggle-overdrive': { const { ok, text } = await putTessera(`${base}/api/output/global-colour/overdrive/enabled`, Boolean(params.enabled)); return ok ? { success: true, response: `Overdrive ${params.enabled ? 'enabled' : 'disabled'}` } : { success: false, error: `Device returned error: ${text}` }; }
    case 'toggle-extended-bit-depth': { const { ok, text } = await putTessera(`${base}/api/output/global-colour/extended-bit-depth/enabled`, Boolean(params.enabled)); return ok ? { success: true, response: `Extended bit depth ${params.enabled ? 'enabled' : 'disabled'}` } : { success: false, error: `Device returned error: ${text}` }; }
    case 'get-status': { const { ok, text } = await getJson(`${base}/api/system`); if (!ok) return { success: false, error: `Device returned error: ${text}` }; return { success: true, response: text }; }
    case 'identify-panel': { const { ok, text } = await postJson(`${base}/api/panels/identify`, { panelId: params.panelId, duration: params.duration }); return ok ? { success: true, response: `Identifying panel ${params.panelId} for ${params.duration}s` } : { success: false, error: `Device returned error: ${text}` }; }
    case 'reload-panels': { const { ok, text } = await postJson(`${base}/api/panels/reload`, {}); return ok ? { success: true, response: 'Panel reload initiated' } : { success: false, error: `Device returned error: ${text}` }; }
    case 'set-network-bit-depth': { const bd = Number(params.bitDepth); if (![8, 10, 12].includes(bd)) return { success: false, error: 'bitDepth must be 8, 10, or 12' }; const { ok, text } = await putTessera(`${base}/api/output/network/bit-depth`, bd); return ok ? { success: true, response: `Network bit depth set to ${bd}` } : { success: false, error: `Device returned error: ${text}` }; }
    case 'set-genlock-source': { const { ok, text } = await putTessera(`${base}/api/output/network/genlock/source`, params.source); return ok ? { success: true, response: `Genlock source set to ${params.source}` } : { success: false, error: `Device returned error: ${text}` }; }
    case 'set-genlock-internal-rate': { const rate = Number(params.rate); if (isNaN(rate) || rate < 23.5 || rate > 251) return { success: false, error: 'rate must be between 23.5 and 251 Hz' }; const { ok, text } = await putTessera(`${base}/api/output/network/genlock/internal-rate`, rate); return ok ? { success: true, response: `Genlock internal rate set to ${rate} Hz` } : { success: false, error: `Device returned error: ${text}` }; }
    case 'set-frame-rate-multiplier': { const mult = Number(params.multiplier); if (isNaN(mult) || mult < 1 || mult > 10) return { success: false, error: 'multiplier must be between 1 and 10' }; const { ok, text } = await putTessera(`${base}/api/output/network/frame-rate-multiplier`, mult); return ok ? { success: true, response: `Frame rate multiplier set to ${mult}x` } : { success: false, error: `Device returned error: ${text}` }; }
    case 'get-failover-status': { const { ok, text } = await getJson(`${base}/api/output/network/failover/state`); if (!ok) return { success: false, error: `Device returned error: ${text}` }; return { success: true, response: text }; }
    case 'request-failover': { const { ok, text } = await postJson(`${base}/api/output/network/failover/actions/request-failover`, ""); return ok ? { success: true, response: 'Failover requested' } : { success: false, error: `Device returned error: ${text}` }; }
    case 'set-shuttersync-mode': { const { ok, text } = await putTessera(`${base}/api/output/network/shuttersync/mode`, params.mode); return ok ? { success: true, response: `ShutterSync mode set to ${params.mode}` } : { success: false, error: `Device returned error: ${text}` }; }
    case 'set-hidden-markers': { const r1 = await putTessera(`${base}/api/output/network/hidden-markers/enabled`, Boolean(params.enabled)); if (!r1.ok) return { success: false, error: `Device returned error setting enabled: ${r1.text}` }; const r2 = await putTessera(`${base}/api/output/network/hidden-markers/mode`, params.mode); if (!r2.ok) return { success: false, error: `Device returned error setting mode: ${r2.text}` }; return { success: true, response: `Hidden markers ${params.enabled ? 'enabled' : 'disabled'}, mode set to ${params.mode}` }; }
    case 'set-colour-correct-enabled': {
      const { ok, text } = await putTessera(`${base}/api/processing/colour-correct/enabled`, params.enabled);
      return ok
        ? { success: true, response: `Colour correction ${params.enabled ? 'enabled' : 'disabled'}` }
        : { success: false, error: `Device returned error: ${text}` };
    }
    case 'set-3d-lut-enabled': {
      const { ok, text } = await putTessera(`${base}/api/processing/3d-lut/enabled`, params.enabled);
      return ok
        ? { success: true, response: `3D LUT ${params.enabled ? 'enabled' : 'disabled'}` }
        : { success: false, error: `Device returned error: ${text}` };
    }
    case 'set-scaler-enabled': {
      const { ok, text } = await putTessera(`${base}/api/processing/scaler/enabled`, params.enabled);
      return ok
        ? { success: true, response: `Scaler ${params.enabled ? 'enabled' : 'disabled'}` }
        : { success: false, error: `Device returned error: ${text}` };
    }
    case 'set-osca-module-correction': {
      const { ok, text } = await putTessera(`${base}/api/processing/osca/module-correction-enabled`, params.enabled);
      return ok
        ? { success: true, response: `OSCA module correction ${params.enabled ? 'enabled' : 'disabled'}` }
        : { success: false, error: `Device returned error: ${text}` };
    }
    case 'set-osca-seam-correction': {
      const { ok, text } = await putTessera(`${base}/api/processing/osca/seam-correction-enabled`, params.enabled);
      return ok
        ? { success: true, response: `OSCA seam correction ${params.enabled ? 'enabled' : 'disabled'}` }
        : { success: false, error: `Device returned error: ${text}` };
    }
    case 'get-panel-stats': {
      const [assocRes, onlineRes, errorRes] = await Promise.all([
        getJson(`${base}/api/devices/statistics/associated-count`),
        getJson(`${base}/api/devices/statistics/online-count`),
        getJson(`${base}/api/devices/statistics/error-count`),
      ]);
      if (!assocRes.ok && !onlineRes.ok && !errorRes.ok) return { success: false, error: `Device returned error: ${assocRes.text}` };
      const stats = {
        associated: assocRes.ok ? JSON.parse(assocRes.text) : null,
        online: onlineRes.ok ? JSON.parse(onlineRes.text) : null,
        errors: errorRes.ok ? JSON.parse(errorRes.text) : null,
      };
      return { success: true, response: JSON.stringify(stats) };
    }
    case 'get-preset-info': {
      const [nameRes, numberRes] = await Promise.all([
        getJson(`${base}/api/presets/active/name`),
        getJson(`${base}/api/presets/active/number`),
      ]);
      if (!nameRes.ok && !numberRes.ok) return { success: false, error: `Device returned error: ${nameRes.text}` };
      const preset = {
        name: nameRes.ok ? JSON.parse(nameRes.text) : null,
        number: numberRes.ok ? JSON.parse(numberRes.text) : null,
      };
      return { success: true, response: JSON.stringify(preset) };
    }
    case 'get-project-name': {
      const { ok, text } = await getJson(`${base}/api/project/name`);
      if (!ok) return { success: false, error: `Device returned error: ${text}` };
      return { success: true, response: text };
    }
    case 'get-input-info': {
      const sourceRes = await getJson(`${base}/api/input/active/source`);
      if (!sourceRes.ok) return { success: false, error: `Device returned error: ${sourceRes.text}` };
      const sourceData = JSON.parse(sourceRes.text);
      // Response is wrapped: { source: { port-type, port-number } }
      const src = sourceData.source ?? sourceData;
      const portType = src['port-type'] ?? 'hdmi';
      const portNumber = src['port-number'] ?? 1;
      // API ports path is 0-indexed, port-number from source is 1-indexed
      const portIndex = portNumber - 1;
      const metaBase = `${base}/api/input/ports/${portType}/${portIndex}/meta-data`;
      const [resRes, refreshRes, hdrRes] = await Promise.all([
        getJson(`${metaBase}/resolution`),
        getJson(`${metaBase}/refresh-rate`),
        getJson(`${metaBase}/hdr/format`),
      ]);
      const info: Record<string, unknown> = { source: `${portType.toUpperCase()} ${portNumber}` };
      if (resRes.ok) { const r = JSON.parse(resRes.text); const res = r.resolution ?? r; info.resolution = `${res.width ?? '?'}x${res.height ?? '?'}`; }
      if (refreshRes.ok) { const rr = JSON.parse(refreshRes.text); info.refreshRate = rr['refresh-rate'] ?? rr; }
      if (hdrRes.ok) { const hr = JSON.parse(hdrRes.text); const hdr = hr.hdr ?? hr; info.hdrFormat = hdr.format ?? hdr; }
      return { success: true, response: JSON.stringify(info) };
    }
    case 'get-output-settings': {      const { ok, text } = await getJson(`${base}/api/output/global-colour`);      if (!ok) return { success: false, error: `Device returned error: ${text}` };      try { const data = JSON.parse(text); return { success: true, response: JSON.stringify(data['global-colour'] ?? data) }; } catch { return { success: true, response: text }; }    }    case 'get-processing-status': {      const { ok, text } = await getJson(`${base}/api/processing`);      if (!ok) return { success: false, error: `Device returned error: ${text}` };      try { const data = JSON.parse(text); return { success: true, response: JSON.stringify(data['processing'] ?? data) }; } catch { return { success: true, response: text }; }    }    case 'get-override-status': {      const { ok, text } = await getJson(`${base}/api/override`);      if (!ok) return { success: false, error: `Device returned error: ${text}` };      try { const data = JSON.parse(text); return { success: true, response: JSON.stringify(data['override'] ?? data) }; } catch { return { success: true, response: text }; }    }    case 'get-network-settings': {      const { ok, text } = await getJson(`${base}/api/output/network`);      if (!ok) return { success: false, error: `Device returned error: ${text}` };      try { const data = JSON.parse(text); return { success: true, response: JSON.stringify(data['network'] ?? data) }; } catch { return { success: true, response: text }; }    }    case 'get-device-list': {      const { ok, text } = await getJson(`${base}/api/devices`);      if (!ok) return { success: false, error: `Device returned error: ${text}` };      try { const data = JSON.parse(text); return { success: true, response: JSON.stringify(data['devices'] ?? data) }; } catch { return { success: true, response: text }; }    }
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
    case 'set-crosspoint': { const output = Number(params.output); const input = Number(params.input); if (isNaN(output) || isNaN(input) || output < 1 || input < 1) return { success: false, error: 'set-crosspoint requires numeric input and output params (both must be >= 1)' }; const body = { [`eParamID_XPT_Destination${output}_Status`]: input }; const { ok, text } = await putJson(configUrl, body); return ok ? { success: true, response: `Routed input ${input} -> output ${output}` } : { success: false, error: `AJA returned error: ${text}` }; }
    case 'get-status': { const { ok, text } = await getJson(configUrl); if (!ok) return { success: false, error: `AJA returned error: ${text}` }; try { const config = JSON.parse(text) as Record<string, unknown>; return { success: true, response: `Router: ${config['eParamID_NumberOfVideoInputs'] ?? '?'}x${config['eParamID_NumberOfVideoOutputs'] ?? '?'}. Full config retrieved (${text.length} bytes).` }; } catch { return { success: true, response: `Config retrieved (${text.length} bytes)` }; } }
    case 'label-input': { const index = Number(params.index); if (isNaN(index) || index < 1) return { success: false, error: 'label-input requires a numeric index param (>= 1)' }; const body = { [`eParamID_Input${index}_Label`]: params.label }; const { ok, text } = await putJson(configUrl, body); return ok ? { success: true, response: `Input ${index} labelled as "${params.label}"` } : { success: false, error: `AJA returned error: ${text}` }; }
    case 'label-output': { const index = Number(params.index); if (isNaN(index) || index < 1) return { success: false, error: 'label-output requires a numeric index param (>= 1)' }; const body = { [`eParamID_Output${index}_Label`]: params.label }; const { ok, text } = await putJson(configUrl, body); return ok ? { success: true, response: `Output ${index} labelled as "${params.label}"` } : { success: false, error: `AJA returned error: ${text}` }; }
    default: return { success: false, error: `Unknown AJA command: ${command}` };
  }
}

async function dispatchLightware(ip: string, command: string, params: Record<string, unknown>): Promise<CommandResponse> {
  const base = `http://${ip}`;
  switch (command) {
    case 'set-crosspoint': { const output = Number(params.output); const input = Number(params.input); if (isNaN(output) || isNaN(input) || output < 1 || input < 1) return { success: false, error: 'set-crosspoint requires numeric input and output params (both must be >= 1)' }; const { ok, text } = await putJson(`${base}/api/MEDIA/VIDEO/XP/O${output}/Source`, { Source: `I${input}` }); return ok ? { success: true, response: `Routed input ${input} -> output ${output}` } : { success: false, error: `Lightware returned error: ${text}` }; }
    default: return { success: false, error: `Unknown Lightware command: ${command}` };
  }
}

async function dispatchBlackmagic(ip: string, command: string, params: Record<string, unknown>): Promise<CommandResponse> {
  const base = `http://${ip}/control/api/v1`;
  switch (command) {
    case 'set-crosspoint': { const output = Number(params.output); const input = Number(params.input); if (isNaN(output) || isNaN(input) || output < 1 || input < 1) return { success: false, error: 'set-crosspoint requires numeric input and output params (both must be >= 1)' }; const { ok, text } = await putJson(`${base}/router/routing`, { videoSource: input, videoDestination: output }); return ok ? { success: true, response: `Routed input ${input} -> output ${output}` } : { success: false, error: `Blackmagic returned error: ${text}` }; }
    default: return { success: false, error: `Unknown Blackmagic command: ${command}` };
  }
}

async function dispatchRoss(ip: string, command: string, params: Record<string, unknown>): Promise<CommandResponse> {
  const base = `http://${ip}`;
  switch (command) {
    case 'get-frame-status': { const { ok, text } = await getJson(`${base}/`); if (!ok) return { success: false, error: `Ross frame returned error: ${text}` }; return { success: true, response: `Frame status retrieved (${text.length} bytes)` }; }
    case 'get-card-status': { const slot = Number(params.slot); if (isNaN(slot) || slot < 1) return { success: false, error: 'get-card-status requires a numeric slot param (>= 1)' }; const { ok, text } = await getJson(`${base}/slot/${slot}`); if (!ok) return { success: false, error: `Ross frame returned error for slot ${slot}: ${text}` }; return { success: true, response: `Slot ${slot} status retrieved` }; }
    default: return { success: false, error: `Unknown Ross command: ${command}` };
  }
}

async function dispatchBrainstorm(ip: string, command: string): Promise<CommandResponse> {
  const base = `http://${ip}`;
  switch (command) {
    case 'get-timecode-status': { const { ok, text } = await getJson(`${base}/`); if (!ok) return { success: false, error: `Brainstorm device returned error: ${text}` }; return { success: true, response: `Timecode status retrieved (${text.length} bytes)` }; }
    case 'get-sync-status': { const { ok, text } = await getJson(`${base}/`); if (!ok) return { success: false, error: `Brainstorm device returned error: ${text}` }; return { success: true, response: `Sync status retrieved (${text.length} bytes)` }; }
    default: return { success: false, error: `Unknown Brainstorm command: ${command}` };
  }
}

async function dispatchBarco(ip: string, command: string, params: Record<string, unknown>): Promise<CommandResponse> {
  const base = `http://${ip}`;
  switch (command) {
    case 'select-input': { const input = Number(params.input); if (isNaN(input) || input < 1) return { success: false, error: 'select-input requires a numeric input param (>= 1)' }; const { ok, text } = await putJson(`${base}/api/input/select`, { input }); return ok ? { success: true, response: `Input switched to ${input}` } : { success: false, error: `Barco returned error: ${text}` }; }
    case 'set-output-resolution': { const { ok, text } = await putJson(`${base}/api/output/resolution`, { resolution: params.resolution }); return ok ? { success: true, response: `Output resolution set to ${params.resolution}` } : { success: false, error: `Barco returned error: ${text}` }; }
    case 'freeze': { const { ok, text } = await putJson(`${base}/api/output/freeze`, { enabled: params.enabled }); return ok ? { success: true, response: `Freeze ${params.enabled ? 'enabled' : 'disabled'}` } : { success: false, error: `Barco returned error: ${text}` }; }
    case 'test-pattern': { const { ok, text } = await putJson(`${base}/api/output/testPattern`, { pattern: params.pattern }); return ok ? { success: true, response: `Test pattern set to: ${params.pattern}` } : { success: false, error: `Barco returned error: ${text}` }; }
    default: return { success: false, error: `Unknown Barco command: ${command}` };
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
      case 'ross': return await dispatchRoss(ip, command, params);
      case 'brainstorm': return await dispatchBrainstorm(ip, command);
      case 'barco': return await dispatchBarco(ip, command, params);
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
