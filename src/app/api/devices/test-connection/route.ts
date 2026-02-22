import { NextRequest, NextResponse } from 'next/server';
import { getAdapter } from '@/lib/device-adapters';
import { isAllowedTarget } from '@/lib/validateIp';
import { getCorsHeadersFromRequest } from '@/lib/cors';
import type { DeviceManufacturer } from '@/types';
import { ALL_MANUFACTURERS } from '@/lib/constants';
export async function OPTIONS(request: NextRequest) { return new NextResponse(null, { status: 204, headers: getCorsHeadersFromRequest(request) }); }
export async function POST(request: NextRequest) {
  const corsHeaders = getCorsHeadersFromRequest(request);
  try {
    const body = await request.json() as { ip?: string; manufacturer?: DeviceManufacturer; port?: number };
    if (!body.ip || !body.manufacturer) return NextResponse.json({ error: 'Missing required fields: ip, manufacturer' }, { status: 400, headers: corsHeaders });
    if (!isAllowedTarget(body.ip)) return NextResponse.json({ error: 'Invalid or disallowed target IP address' }, { status: 400, headers: corsHeaders });
    if (!ALL_MANUFACTURERS.includes(body.manufacturer)) return NextResponse.json({ error: `Invalid manufacturer: ${body.manufacturer}` }, { status: 400, headers: corsHeaders });
    const adapter = getAdapter(body.manufacturer);
    const result = await adapter.queryHealth(body.ip, body.port);
    return NextResponse.json(result, { headers: corsHeaders });
  } catch (err) { return NextResponse.json({ error: 'Internal server error', details: String(err) }, { status: 500, headers: corsHeaders }); }
}
