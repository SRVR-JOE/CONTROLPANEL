import { NextRequest, NextResponse } from 'next/server';
import type { LEDTileInfo, LEDTileErrorType } from '@/types';
import { isAllowedTarget } from '@/lib/validateIp';
import { getCorsHeadersFromRequest } from '@/lib/cors';
interface TileQueryDevice { id: string; ip: string; }
type LEDTileErrorTypeEntry = { type: LEDTileErrorType; message: string; severity: 'warning' | 'error'; };
const ERROR_POOL: LEDTileErrorTypeEntry[] = [
  { type: 'high-temperature', message: 'Panel temperature exceeds safe operating threshold', severity: 'warning' },
  { type: 'communication-lost', message: 'No response from panel over Ethernet link', severity: 'error' },
  { type: 'driver-fault', message: 'LED driver IC reporting fault condition', severity: 'error' },
  { type: 'power-fault', message: 'Power supply voltage out of tolerance', severity: 'error' },
  { type: 'color-calibration', message: 'Color calibration data mismatch detected', severity: 'warning' },
  { type: 'pixel-failure', message: 'One or more pixel sub-elements unresponsive', severity: 'warning' },
];
const DEVICE_CHAIN_CONFIG: Record<string, { chains: number[]; onlinePanels: number }> = {
  'dev-brompton-1': { chains: [30, 30, 30, 30], onlinePanels: 120 },
  'dev-brompton-2': { chains: [24, 24, 24, 22], onlinePanels: 94 },
};
function generateTilesForDevice(deviceId: string): LEDTileInfo[] {
  const config = DEVICE_CHAIN_CONFIG[deviceId] ?? { chains: [24, 24], onlinePanels: 48 };
  const tiles: LEDTileInfo[] = [];
  let globalIndex = 0;
  for (let chainIdx = 0; chainIdx < config.chains.length; chainIdx++) {
    const chainLength = config.chains[chainIdx];
    for (let pos = 0; pos < chainLength; pos++) {
      const rng = Math.random();
      const isOffline = rng < 0.08;
      const isWarning = !isOffline && rng < 0.13;
      const hasError = !isOffline && !isWarning && rng > 0.96;
      let status: LEDTileInfo['status'];
      let temperature: number;
      const errors: LEDTileInfo['errors'] = [];
      if (isOffline || globalIndex >= config.onlinePanels) { status = 'offline'; temperature = 0; }
      else if (isWarning) { status = 'warning'; temperature = 48 + Math.random() * 7; const e = ERROR_POOL[Math.floor(Math.random() * 2)]; errors.push({ type: e.type, message: e.message, severity: e.severity, timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString() }); }
      else if (hasError) { status = 'error'; temperature = 52 + Math.random() * 5; const e = ERROR_POOL[Math.floor(Math.random() * ERROR_POOL.length)]; errors.push({ type: e.type, message: e.message, severity: 'error', timestamp: new Date(Date.now() - Math.random() * 1800000).toISOString() }); }
      else { status = 'online'; temperature = Math.random() < 0.07 ? 43 + Math.random() * 5 : 30 + Math.random() * 15; }
      tiles.push({ id: `${deviceId}-chain${chainIdx}-pos${pos}`, chainIndex: chainIdx, positionInChain: pos, status, temperature, errors,
        lastSeen: status === 'offline' ? new Date(Date.now() - 60000 - Math.random() * 300000).toISOString() : new Date(Date.now() - Math.random() * 5000).toISOString(),
        serialNumber: status !== 'offline' ? `SN-${deviceId.slice(-3).toUpperCase()}-C${chainIdx + 1}P${String(pos + 1).padStart(2, '0')}` : undefined,
        firmwareVersion: status !== 'offline' ? '2.4.1' : undefined });
      globalIndex++;
    }
  }
  return tiles;
}
export async function OPTIONS(request: NextRequest) { return new NextResponse(null, { status: 204, headers: getCorsHeadersFromRequest(request) }); }
export async function POST(request: NextRequest) {
  const corsHeaders = getCorsHeadersFromRequest(request);
  try {
    const body: { devices: TileQueryDevice[] } = await request.json();
    if (!body.devices || !Array.isArray(body.devices) || body.devices.length === 0) return NextResponse.json({ error: 'Missing or empty devices array in request body' }, { status: 400, headers: corsHeaders });
    for (const device of body.devices) {
      if (!device.id || !device.ip) return NextResponse.json({ error: `Each device must include id and ip. Invalid entry: ${JSON.stringify(device)}` }, { status: 400, headers: corsHeaders });
      if (!isAllowedTarget(device.ip)) return NextResponse.json({ error: `Invalid or disallowed target IP address for device: ${device.id}` }, { status: 400, headers: corsHeaders });
    }
    const results: Record<string, { tiles: LEDTileInfo[] }> = {};
    for (const device of body.devices) results[device.id] = { tiles: generateTilesForDevice(device.id) };
    return NextResponse.json({ results }, { headers: corsHeaders });
  } catch (err) { return NextResponse.json({ error: 'Internal server error', details: String(err) }, { status: 500, headers: corsHeaders }); }
}
