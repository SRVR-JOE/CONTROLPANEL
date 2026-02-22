import { NextRequest, NextResponse } from 'next/server';
import { getAdapter } from '@/lib/device-adapters';
import type { DeviceHealth, DeviceManufacturer } from '@/types';

/**
 * GET/POST /api/health
 *
 * Queries real devices on the network for their health status.
 *
 * GET  /api/health?ip={ip}&manufacturer={manufacturer}&port={port}
 *   Query a single device. Returns a DeviceQueryResult.
 *
 * POST /api/health
 *   Body: { devices: [{ id, ip, manufacturer, port? }] }
 *   Query multiple devices in parallel. Returns { results: { [deviceId]: DeviceQueryResult } }
 */

interface DeviceQueryResult {
  reachable: boolean;
  health: DeviceHealth | null;
  firmware?: string;
  errors?: string[];
}

interface DeviceQueryInput {
  id: string;
  ip: string;
  manufacturer: DeviceManufacturer;
  port?: number;
}

/**
 * Query a single device for its health status using the
 * manufacturer-specific adapter.
 */
async function queryDevice(
  ip: string,
  manufacturer: DeviceManufacturer,
  port?: number
): Promise<DeviceQueryResult> {
  try {
    const adapter = getAdapter(manufacturer);
    const result = await adapter.queryHealth(ip, port);
    return result;
  } catch (err) {
    return {
      reachable: false,
      health: null,
      errors: [err instanceof Error ? err.message : String(err)],
    };
  }
}

/**
 * GET /api/health?ip={ip}&manufacturer={manufacturer}&port={port}
 *
 * Query a single device by IP and manufacturer.
 * Same-origin only — no CORS headers are set.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const ip = searchParams.get('ip');
    const manufacturer = searchParams.get('manufacturer') as DeviceManufacturer | null;
    const portParam = searchParams.get('port');

    if (!ip || !manufacturer) {
      return NextResponse.json(
        { error: 'Missing required query parameters: ip, manufacturer' },
        { status: 400 }
      );
    }

    const validManufacturers: DeviceManufacturer[] = [
      'disguise', 'barco', 'brompton', 'lightware', 'aja', 'blackmagic', 'ross',
    ];

    if (!validManufacturers.includes(manufacturer)) {
      return NextResponse.json(
        { error: `Invalid manufacturer: ${manufacturer}. Must be one of: ${validManufacturers.join(', ')}` },
        { status: 400 }
      );
    }

    const port = portParam ? parseInt(portParam, 10) : undefined;

    if (portParam && (isNaN(port!) || port! < 1 || port! > 65535)) {
      return NextResponse.json(
        { error: 'Invalid port number. Must be between 1 and 65535.' },
        { status: 400 }
      );
    }

    const result = await queryDevice(ip, manufacturer, port);

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: 'Internal server error', details: String(err) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/health
 *
 * Body: { devices: [{ id, ip, manufacturer, port? }] }
 *
 * Query multiple devices in parallel. Returns a results map
 * keyed by device ID.
 * Same-origin only — no CORS headers are set.
 */
export async function POST(request: NextRequest) {
  try {
    const body: { devices: DeviceQueryInput[] } = await request.json();

    if (!body.devices || !Array.isArray(body.devices) || body.devices.length === 0) {
      return NextResponse.json(
        { error: 'Missing or empty devices array in request body' },
        { status: 400 }
      );
    }

    // Validate each device entry
    for (const device of body.devices) {
      if (!device.id || !device.ip || !device.manufacturer) {
        return NextResponse.json(
          { error: `Each device must include id, ip, and manufacturer. Invalid entry: ${JSON.stringify(device)}` },
          { status: 400 }
        );
      }
    }

    // Query all devices in parallel using Promise.allSettled
    const settledResults = await Promise.allSettled(
      body.devices.map((device) =>
        queryDevice(device.ip, device.manufacturer, device.port)
      )
    );

    // Build the results map keyed by device ID
    const results: Record<string, DeviceQueryResult> = {};

    for (let i = 0; i < body.devices.length; i++) {
      const device = body.devices[i];
      const settled = settledResults[i];

      if (settled.status === 'fulfilled') {
        results[device.id] = settled.value;
      } else {
        results[device.id] = {
          reachable: false,
          health: null,
          errors: [settled.reason instanceof Error ? settled.reason.message : String(settled.reason)],
        };
      }
    }

    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json(
      { error: 'Internal server error', details: String(err) },
      { status: 500 }
    );
  }
}
