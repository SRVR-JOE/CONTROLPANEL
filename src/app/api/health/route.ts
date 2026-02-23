import { NextRequest, NextResponse } from 'next/server';
import { getAdapter } from '@/lib/device-adapters';
import { isAllowedTarget } from '@/lib/validateIp';
import type { DeviceHealth, DeviceManufacturer, DeviceStatus } from '@/types';
import { ALL_MANUFACTURERS } from '@/lib/constants';
import { detectEvents } from '@/lib/events/detector';
import { insertEvent, getEventSettings } from '@/lib/db';
import { dispatchAll } from '@/lib/events/dispatcher';

interface DeviceQueryResult { reachable: boolean; health: DeviceHealth | null; firmware?: string; errors?: string[]; }
interface DeviceQueryInput { id: string; ip: string; manufacturer: DeviceManufacturer; port?: number; name?: string; previousStatus?: DeviceStatus; }

async function queryDevice(ip: string, manufacturer: DeviceManufacturer, port?: number): Promise<DeviceQueryResult> {
  try {
    const adapter = getAdapter(manufacturer);
    return await adapter.queryHealth(ip, port);
  } catch (err) {
    return { reachable: false, health: null, errors: [err instanceof Error ? err.message : String(err)] };
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const ip = searchParams.get('ip');
    const manufacturer = searchParams.get('manufacturer') as DeviceManufacturer | null;
    const portParam = searchParams.get('port');
    if (!ip || !manufacturer) return NextResponse.json({ error: 'Missing required query parameters: ip, manufacturer' }, { status: 400 });
    if (!isAllowedTarget(ip)) return NextResponse.json({ error: 'Invalid or disallowed target IP address' }, { status: 400 });
    if (!ALL_MANUFACTURERS.includes(manufacturer)) return NextResponse.json({ error: `Invalid manufacturer: ${manufacturer}. Must be one of: ${ALL_MANUFACTURERS.join(', ')}` }, { status: 400 });
    const port = portParam ? parseInt(portParam, 10) : undefined;
    if (portParam && (isNaN(port!) || port! < 1 || port! > 65535)) return NextResponse.json({ error: 'Invalid port number. Must be between 1 and 65535.' }, { status: 400 });
    return NextResponse.json(await queryDevice(ip, manufacturer, port));
  } catch (err) { return NextResponse.json({ error: 'Internal server error', details: String(err) }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    const body: { devices: DeviceQueryInput[] } = await request.json();
    if (!body.devices || !Array.isArray(body.devices) || body.devices.length === 0) return NextResponse.json({ error: 'Missing or empty devices array in request body' }, { status: 400 });
    for (const device of body.devices) {
      if (!device.id || !device.ip || !device.manufacturer) return NextResponse.json({ error: `Each device must include id, ip, and manufacturer. Invalid entry: ${JSON.stringify(device)}` }, { status: 400 });
      if (!isAllowedTarget(device.ip)) return NextResponse.json({ error: `Invalid or disallowed target IP address for device: ${device.id}` }, { status: 400 });
    }

    const settledResults = await Promise.allSettled(body.devices.map((device) => queryDevice(device.ip, device.manufacturer, device.port)));
    const results: Record<string, DeviceQueryResult> = {};
    const allNewEvents: import('@/types').SystemEvent[] = [];

    let settings;
    try { settings = getEventSettings(); } catch { settings = null; }

    for (let i = 0; i < body.devices.length; i++) {
      const device = body.devices[i];
      const settled = settledResults[i];
      const result: DeviceQueryResult = settled.status === 'fulfilled'
        ? settled.value
        : { reachable: false, health: null, errors: [settled.reason instanceof Error ? settled.reason.message : String(settled.reason)] };
      results[device.id] = result;

      // Event detection
      if (settings) {
        try {
          const currentStatus: DeviceStatus = result.reachable
            ? (result.health?.errors?.length ? 'error' : result.health?.warnings?.length ? 'warning' : 'online')
            : 'offline';

          const events = detectEvents(
            device.id,
            device.name || device.id,
            currentStatus,
            result.health,
            settings
          );

          for (const event of events) {
            try { insertEvent(event); } catch (e) { console.error('[Health] Failed to insert event:', e); }
          }
          allNewEvents.push(...events);
        } catch (e) {
          console.error('[Health] Event detection error:', e);
        }
      }
    }

    // Dispatch notifications (best-effort, async, non-blocking)
    if (allNewEvents.length > 0 && settings) {
      dispatchAll(allNewEvents, settings.flappingCooldownMs).catch((e) =>
        console.error('[Health] Notification dispatch error:', e)
      );
    }

    return NextResponse.json({ results });
  } catch (err) { return NextResponse.json({ error: 'Internal server error', details: String(err) }, { status: 500 }); }
}
