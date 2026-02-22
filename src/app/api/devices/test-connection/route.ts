import { NextRequest, NextResponse } from 'next/server';
import { getAdapter } from '@/lib/device-adapters';
import type { DeviceManufacturer } from '@/types';
import { ALL_MANUFACTURERS } from '@/lib/constants';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * POST /api/devices/test-connection
 *
 * Body: { ip: string, manufacturer: DeviceManufacturer, port?: number }
 *
 * Tests connectivity to a device using the appropriate adapter.
 * Returns: { reachable: boolean, health?: DeviceHealth, firmware?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      ip?: string;
      manufacturer?: DeviceManufacturer;
      port?: number;
    };

    if (!body.ip || !body.manufacturer) {
      return NextResponse.json(
        { error: 'Missing required fields: ip, manufacturer' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    if (!ALL_MANUFACTURERS.includes(body.manufacturer)) {
      return NextResponse.json(
        { error: `Invalid manufacturer: ${body.manufacturer}` },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const adapter = getAdapter(body.manufacturer);
    const result = await adapter.queryHealth(body.ip, body.port);

    return NextResponse.json(result, { headers: CORS_HEADERS });
  } catch (err) {
    return NextResponse.json(
      { error: 'Internal server error', details: String(err) },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
