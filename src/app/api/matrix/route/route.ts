import { NextRequest, NextResponse } from 'next/server';
import { getMatrixAdapter } from '@/lib/matrix-adapters';
import { isAllowedTarget } from '@/lib/validateIp';
import { getCorsHeadersFromRequest } from '@/lib/cors';
import type { MatrixManufacturer } from '@/types';

interface RouteRequest {
  manufacturer: MatrixManufacturer;
  ip: string;
  outputIndex: number;
  inputIndex: number;
  port?: number;
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: getCorsHeadersFromRequest(request) });
}

export async function POST(request: NextRequest) {
  const corsHeaders = getCorsHeadersFromRequest(request);

  try {
    let body: RouteRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400, headers: corsHeaders },
      );
    }

    const { manufacturer, ip, outputIndex, inputIndex, port } = body;

    if (!manufacturer || typeof manufacturer !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid field: manufacturer' },
        { status: 400, headers: corsHeaders },
      );
    }
    if (!ip || typeof ip !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid field: ip' },
        { status: 400, headers: corsHeaders },
      );
    }
    if (!isAllowedTarget(ip)) {
      return NextResponse.json(
        { success: false, error: 'Invalid or disallowed target IP address' },
        { status: 400, headers: corsHeaders },
      );
    }
    if (typeof outputIndex !== 'number' || !Number.isInteger(outputIndex) || outputIndex < 0) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid field: outputIndex (expected non-negative integer)' },
        { status: 400, headers: corsHeaders },
      );
    }
    if (typeof inputIndex !== 'number' || !Number.isInteger(inputIndex) || inputIndex < 0) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid field: inputIndex (expected non-negative integer)' },
        { status: 400, headers: corsHeaders },
      );
    }
    if (port !== undefined && (typeof port !== 'number' || port < 1 || port > 65535)) {
      return NextResponse.json(
        { success: false, error: 'Field "port" must be a number between 1 and 65535' },
        { status: 400, headers: corsHeaders },
      );
    }

    const adapter = getMatrixAdapter(manufacturer);
    if (!adapter) {
      return NextResponse.json(
        { success: false, error: `No adapter available for manufacturer "${manufacturer}"` },
        { status: 400, headers: corsHeaders },
      );
    }

    try {
      const success = await adapter.setRoute(ip, outputIndex, inputIndex, port);
      if (!success) {
        return NextResponse.json(
          { success: false, error: `Device at ${ip} rejected the route change` },
          { status: 502, headers: corsHeaders },
        );
      }
      return NextResponse.json(
        { success: true },
        { headers: corsHeaders },
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return NextResponse.json(
        { success: false, error: message },
        { status: 502, headers: corsHeaders },
      );
    }
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: String(err) },
      { status: 500, headers: corsHeaders },
    );
  }
}
