import { NextRequest, NextResponse } from 'next/server';
import { getAdapter } from '@/lib/device-adapters';
import type { DeviceQueryResult } from '@/lib/device-adapters';
import type { DeviceManufacturer } from '@/types';
import { validateIp, validatePort } from '@/lib/validation';

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

interface DeviceQueryInput {
  id: string;
  ip: string;
  manufacturer: DeviceManufacturer;
  port?: number;
}

const ALLOWED_ORIGINS = ['http://localhost:3000', 'http://localhost:3001'];

function getCorsHeaders(request: NextRequest): Record<string, string> {
  const origin = request.headers.get('Origin');
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
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
 * OPTIONS - handle CORS preflight for local network access.
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}

/**
 * GET /api/health?ip={ip}&manufacturer={manufacturer}&port={port}
 *
 * Query a single device by IP and manufacturer.
 */
export async function GET(request: NextRequest) {
  const corsHeaders = getCorsHeaders(request);
  try {
    const { searchParams } = request.nextUrl;
    const ip = searchParams.get('ip');
    const manufacturer = searchParams.get('manufacturer') as DeviceManufacturer | null;
    const portParam = searchParams.get('port');

    if (!ip || !manufacturer) {
      return NextResponse.json(
        { error: 'Missing required query parameters: ip, manufacturer' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!validateIp(ip)) {
      return NextResponse.json(
        { error: 'Invalid IP address' },
        { status: 400, headers: corsHeaders }
      );
    }

    const validManufacturers: DeviceManufacturer[] = [
      'disguise', 'barco', 'brompton', 'lightware', 'aja', 'blackmagic', 'ross',
    ];

    if (!validManufacturers.includes(manufacturer)) {
      return NextResponse.json(
        { error: `Invalid manufacturer: ${manufacturer}. Must be one of: ${validManufacturers.join(', ')}` },
        { status: 400, headers: corsHeaders }
      );
    }

    const port = portParam ? parseInt(portParam, 10) : undefined;

    if (portParam && !validatePort(port)) {
      return NextResponse.json(
        { error: 'Invalid port number. Must be between 1 and 65535.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const result = await queryDevice(ip, manufacturer, port);

    return NextResponse.json(result, { headers: corsHeaders });
  } catch (err) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
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
 */
export async function POST(request: NextRequest) {
  const corsHeaders = getCorsHeaders(request);
  try {
    let body: { devices: DeviceQueryInput[] };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!body.devices || !Array.isArray(body.devices) || body.devices.length === 0) {
      return NextResponse.json(
        { error: 'Missing or empty devices array in request body' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (body.devices.length > 100) {
      return NextResponse.json(
        { error: 'Too many devices. Maximum 100 devices per request.' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate each device entry
    for (const device of body.devices) {
      if (!device.id || !device.ip || !device.manufacturer) {
        return NextResponse.json(
          { error: `Each device must include id, ip, and manufacturer. Invalid entry: ${JSON.stringify(device)}` },
          { status: 400, headers: corsHeaders }
        );
      }
    }

    // Query all devices in parallel using Promise.allSettled
    const settledResults = await Promise.allSettled(
      body.devices.map((device) => {
        // Validate IP for each device; if invalid, return an error result immediately
        if (!validateIp(device.ip)) {
          return Promise.resolve<DeviceQueryResult>({
            reachable: false,
            health: null,
            errors: ['Invalid IP address'],
          });
        }
        return queryDevice(device.ip, device.manufacturer, device.port);
      })
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

    return NextResponse.json({ results }, { headers: corsHeaders });
  } catch (err) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
